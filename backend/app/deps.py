from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session

from . import models
from .db import get_db
from .security import COOKIE, check_csrf, read_token


def current_user(request: Request, db: Session = Depends(get_db)) -> models.User:
    check_csrf(request)
    token = request.cookies.get(COOKIE)
    uid = read_token(token) if token else None
    user = db.get(models.User, uid) if uid else None
    if not user or not user.is_active:
        raise HTTPException(401, "Not signed in.")
    return user


def require_admin(user: models.User = Depends(current_user)) -> models.User:
    if user.role != "admin":
        raise HTTPException(403, "Administrator access required.")
    return user


def audit(db: Session, user_id: int | None, action: str, target: str = "", result: str = "success") -> None:
    db.add(models.AuditLog(user_id=user_id, action=action, target=target, result=result))
    db.commit()


def owned_email(db: Session, user: models.User, email_id: int) -> models.EmailRecord:
    """Ownership check: another user's id returns 404, not 403, to avoid leaking existence."""
    rec = db.get(models.EmailRecord, email_id)
    if not rec or rec.owner_id != user.id:
        raise HTTPException(404, "Email not found.")
    return rec
