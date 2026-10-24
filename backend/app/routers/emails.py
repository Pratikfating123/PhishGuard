import nh3
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from pydantic import BaseModel, Field
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from .. import models
from ..analysis.parser import EmailParseError, parse_eml
from ..config import settings
from ..db import get_db
from ..deps import audit, current_user, owned_email

router = APIRouter(prefix="/api/emails", tags=["emails"])


def _row(e: models.EmailRecord) -> dict:
    a = e.analyses[0] if e.analyses else None
    return {"id": e.id, "sender": e.sender, "subject": e.subject, "received_at": e.received_at,
            "is_read": e.is_read, "is_quarantined": e.is_quarantined,
            "risk_category": a.risk_category if a else None}


@router.get("")
def list_emails(q: str = "", risk: str = "", quarantined: bool | None = None,
                page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100),
                user: models.User = Depends(current_user), db: Session = Depends(get_db)):
    stmt = select(models.EmailRecord).where(models.EmailRecord.owner_id == user.id)
    if q:
        like = f"%{q[:100]}%"
        stmt = stmt.where(or_(models.EmailRecord.subject.ilike(like), models.EmailRecord.sender.ilike(like)))
    if quarantined is not None:
        stmt = stmt.where(models.EmailRecord.is_quarantined == quarantined)
    if risk:
        sub = select(models.EmailAnalysis.email_id).where(models.EmailAnalysis.owner_id == user.id,
                                                          models.EmailAnalysis.risk_category == risk)
        stmt = stmt.where(models.EmailRecord.id.in_(sub))
    total = db.scalar(select(func.count()).select_from(stmt.subquery()))
    rows = db.scalars(stmt.order_by(models.EmailRecord.received_at.desc()).offset((page - 1) * page_size).limit(page_size)).all()
    return {"total": total, "page": page, "page_size": page_size, "items": [_row(e) for e in rows]}


@router.post("/import", status_code=201)
async def import_eml(file: UploadFile = File(...), user: models.User = Depends(current_user), db: Session = Depends(get_db)):
    if not (file.filename or "").lower().endswith(".eml"):
        raise HTTPException(415, "Only .eml files are supported.")
    data = await file.read(settings.max_upload_bytes + 1)
    if len(data) > settings.max_upload_bytes:
        raise HTTPException(413, "The file is larger than the 5 MB limit.")
    try:
        p = parse_eml(data)
    except EmailParseError as exc:
        raise HTTPException(422, str(exc)) from exc
    rec = models.EmailRecord(owner_id=user.id, sender=p.sender, reply_to=p.reply_to, subject=p.subject[:998],
                             body_text=p.body_text, headers=p.headers, attachments=p.attachments)
    db.add(rec)
    db.commit()
    audit(db, user.id, "email.import", f"email:{rec.id}")
    return _row(rec)


@router.get("/{email_id}")
def get_email(email_id: int, user: models.User = Depends(current_user), db: Session = Depends(get_db)):
    e = owned_email(db, user, email_id)
    # Body is returned as plain text. If HTML is ever rendered, it must pass through this sanitizer
    # and be shown in a sandboxed iframe without scripts or remote content.
    return {**_row(e), "reply_to": e.reply_to, "body_text": e.body_text, "attachments": e.attachments,
            "safe_body": nh3.clean(e.body_text, tags=set())}


class ReadStatus(BaseModel):
    is_read: bool = Field(...)


@router.patch("/{email_id}/read-status")
def set_read(email_id: int, body: ReadStatus, user: models.User = Depends(current_user), db: Session = Depends(get_db)):
    e = owned_email(db, user, email_id)
    e.is_read = body.is_read
    db.commit()
    return _row(e)
