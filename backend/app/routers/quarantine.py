from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models
from ..db import get_db
from ..deps import audit, current_user, owned_email

router = APIRouter(prefix="/api/quarantine", tags=["quarantine"])


class Reason(BaseModel):
    reason: str = Field(default="Held for review", max_length=255)


class Release(BaseModel):
    confirm: bool = False


@router.get("")
def list_quarantine(user: models.User = Depends(current_user), db: Session = Depends(get_db)):
    rows = db.execute(
        select(models.QuarantineRecord, models.EmailRecord)
        .join(models.EmailRecord, models.EmailRecord.id == models.QuarantineRecord.email_id)
        .where(models.QuarantineRecord.owner_id == user.id)
        .order_by(models.QuarantineRecord.created_at.desc())
    ).all()
    return [{"email_id": e.id, "subject": e.subject, "sender": e.sender, "reason": q.reason, "status": q.status,
             "created_at": q.created_at, "released_at": q.released_at} for q, e in rows]


@router.post("/{email_id}", status_code=201)
def quarantine(email_id: int, body: Reason, user: models.User = Depends(current_user), db: Session = Depends(get_db)):
    e = owned_email(db, user, email_id)
    if e.is_quarantined:
        raise HTTPException(409, "This email is already in quarantine.")
    e.is_quarantined = True
    db.add(models.QuarantineRecord(email_id=e.id, owner_id=user.id, reason=body.reason))
    db.commit()
    audit(db, user.id, "quarantine.hold", f"email:{e.id}")
    return {"email_id": e.id, "status": "held"}


@router.post("/{email_id}/release")
def release(email_id: int, body: Release, user: models.User = Depends(current_user), db: Session = Depends(get_db)):
    e = owned_email(db, user, email_id)
    if not body.confirm:
        raise HTTPException(422, "Release must be confirmed.")
    q = db.scalar(select(models.QuarantineRecord).where(models.QuarantineRecord.email_id == e.id,
                                                       models.QuarantineRecord.status == "held"))
    if not q:
        raise HTTPException(409, "This email is not in quarantine.")
    q.status, q.released_by, q.released_at = "released", user.id, datetime.now(timezone.utc)
    e.is_quarantined = False
    db.commit()
    audit(db, user.id, "quarantine.release", f"email:{e.id}")
    return {"email_id": e.id, "status": "released"}
