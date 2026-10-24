from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models
from ..analysis.engine import analyze
from ..analysis.parser import EmailParseError, parse_pasted
from ..analysis.text_model import TextModel
from ..db import get_db
from ..deps import audit, current_user, owned_email
from ..security import rate_limit

router = APIRouter(prefix="/api", tags=["analysis"])
_model = TextModel()  # loaded once; returns "inconclusive" results if no model file exists


class AnalyzeIn(BaseModel):
    email_id: int | None = None
    sender: str = Field(default="", max_length=320)
    reply_to: str = Field(default="", max_length=320)
    subject: str = Field(default="", max_length=998)
    body: str = Field(default="", max_length=200_000)
    raw_headers: str = Field(default="", max_length=50_000)


def _out(a: models.EmailAnalysis) -> dict:
    return {"id": a.id, "email_id": a.email_id, "risk_category": a.risk_category, "risk_score": a.risk_score,
            "classification": a.classification, "model_version": a.model_version, "created_at": a.created_at,
            "evidence": a.evidence,
            "urls": [{"url": u.url, "host": u.host, "risk": u.risk, "flags": u.flags} for u in a.urls]}


@router.post("/analyze", status_code=201)
def run_analysis(body: AnalyzeIn, request: Request, user: models.User = Depends(current_user), db: Session = Depends(get_db)):
    rate_limit(f"analyze:{user.id}", 60, 3600)
    if body.email_id:
        rec = owned_email(db, user, body.email_id)
        from ..analysis.parser import ParsedEmail, extract_urls
        parsed = ParsedEmail(sender=rec.sender, reply_to=rec.reply_to, subject=rec.subject, body_text=rec.body_text,
                             headers=rec.headers or {}, urls=extract_urls(rec.body_text), attachments=rec.attachments or [])
    else:
        if not body.body.strip() and not body.subject.strip():
            raise HTTPException(422, "Provide an email body or subject to analyze.")
        try:
            parsed = parse_pasted(body.sender, body.subject, body.body, body.reply_to, body.raw_headers)
        except EmailParseError as exc:
            raise HTTPException(422, str(exc)) from exc
        rec = models.EmailRecord(owner_id=user.id, sender=parsed.sender, reply_to=parsed.reply_to,
                                 subject=parsed.subject[:998], body_text=parsed.body_text, headers=parsed.headers)
        db.add(rec)
        db.flush()

    r = analyze(parsed, _model)
    mo = (r["model"]["output"] or {})
    a = models.EmailAnalysis(
        email_id=rec.id, owner_id=user.id, risk_category=r["risk_category"], risk_score=r["risk_score"],
        classification=mo.get("label", "unavailable"), model_version=r["model"]["version"],
        evidence={k: r[k] for k in ("indicators", "recommended_steps", "summary", "heuristic_score")} | {"model_available": r["model"]["available"]},
    )
    a.urls = [models.URLIndicator(url=u["url"][:2000], host=u["host"], risk=u["risk"], flags=u["flags"]) for u in r["urls"]]
    db.add(a)
    db.flush()
    if r["risk_category"] in {"suspicious", "high_risk"}:
        db.add(models.ThreatEvent(owner_id=user.id, analysis_id=a.id, threat_type="phishing", risk_category=r["risk_category"]))
    db.commit()
    audit(db, user.id, "analysis.run", f"analysis:{a.id}")
    return _out(a)


@router.get("/analysis")
def list_analysis(page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100), risk: str = "",
                  user: models.User = Depends(current_user), db: Session = Depends(get_db)):
    stmt = select(models.EmailAnalysis).where(models.EmailAnalysis.owner_id == user.id)
    if risk:
        stmt = stmt.where(models.EmailAnalysis.risk_category == risk)
    rows = db.scalars(stmt.order_by(models.EmailAnalysis.created_at.desc()).offset((page - 1) * page_size).limit(page_size)).all()
    return {"page": page, "items": [_out(a) for a in rows]}


@router.get("/analysis/{analysis_id}")
def get_analysis(analysis_id: int, user: models.User = Depends(current_user), db: Session = Depends(get_db)):
    a = db.get(models.EmailAnalysis, analysis_id)
    if not a or a.owner_id != user.id:
        raise HTTPException(404, "Analysis not found.")
    return _out(a)
