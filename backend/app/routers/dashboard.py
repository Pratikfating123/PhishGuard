import csv
import io
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .. import models
from ..db import get_db
from ..deps import audit, current_user, require_admin

router = APIRouter(prefix="/api", tags=["dashboard"])
A = models.EmailAnalysis


def _since(days: int):
    return datetime.now(timezone.utc) - timedelta(days=days)


def _count(db, user, *conds):
    return db.scalar(select(func.count()).select_from(A).where(A.owner_id == user.id, *conds)) or 0


@router.get("/dashboard/stats")
def stats(days: int = Query(30, ge=1, le=365), user: models.User = Depends(current_user), db: Session = Depends(get_db)):
    s = A.created_at >= _since(days)
    quarantined = db.scalar(select(func.count()).select_from(models.EmailRecord)
                            .where(models.EmailRecord.owner_id == user.id, models.EmailRecord.is_quarantined.is_(True))) or 0
    return {"days": days, "total_analyzed": _count(db, user, s), "high_risk": _count(db, user, s, A.risk_category == "high_risk"),
            "suspicious": _count(db, user, s, A.risk_category == "suspicious"), "quarantined": quarantined}


@router.get("/dashboard/trends")
def trends(days: int = Query(30, ge=1, le=365), user: models.User = Depends(current_user), db: Session = Depends(get_db)):
    day = func.date_trunc("day", A.created_at)
    rows = db.execute(select(day, A.risk_category, func.count()).where(A.owner_id == user.id, A.created_at >= _since(days))
                      .group_by(day, A.risk_category).order_by(day)).all()
    out: dict[str, dict] = {}
    for d, cat, n in rows:
        out.setdefault(d.date().isoformat(), {"date": d.date().isoformat()})[cat] = n
    return list(out.values())


@router.get("/dashboard/risk-distribution")
def distribution(days: int = Query(30, ge=1, le=365), user: models.User = Depends(current_user), db: Session = Depends(get_db)):
    rows = db.execute(select(A.risk_category, func.count()).where(A.owner_id == user.id, A.created_at >= _since(days))
                      .group_by(A.risk_category)).all()
    return [{"category": c, "count": n} for c, n in rows]


@router.get("/reports/export")
def export_csv(days: int = Query(30, ge=1, le=365), user: models.User = Depends(current_user), db: Session = Depends(get_db)):
    rows = db.scalars(select(A).where(A.owner_id == user.id, A.created_at >= _since(days)).order_by(A.created_at.desc())).all()
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["analysis_id", "email_id", "created_at", "risk_category", "risk_score", "classification", "model_version"])
    for a in rows:
        w.writerow([a.id, a.email_id, a.created_at.isoformat(), a.risk_category, a.risk_score, a.classification, a.model_version])
    audit(db, user.id, "report.export", f"days:{days}")
    buf.seek(0)
    return StreamingResponse(iter([buf.getvalue()]), media_type="text/csv",
                             headers={"Content-Disposition": 'attachment; filename="phishguard-report.csv"'})


@router.get("/audit-logs")
def audit_logs(page: int = Query(1, ge=1), user: models.User = Depends(current_user), db: Session = Depends(get_db)):
    stmt = select(models.AuditLog)
    if user.role != "admin":  # users only see their own activity
        stmt = stmt.where(models.AuditLog.user_id == user.id)
    rows = db.scalars(stmt.order_by(models.AuditLog.created_at.desc()).offset((page - 1) * 50).limit(50)).all()
    return [{"id": r.id, "user_id": r.user_id, "action": r.action, "target": r.target, "result": r.result,
             "created_at": r.created_at} for r in rows]
