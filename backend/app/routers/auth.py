
import re

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models
from ..config import settings
from ..db import get_db
from ..deps import audit, current_user
from ..security import (
    COOKIE,
    CSRF_COOKIE,
    hash_password,
    make_token,
    new_csrf,
    rate_limit,
    verify_password,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


class Credentials(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class Register(Credentials):
    full_name: str = Field(default="", max_length=120)
    password: str = Field(min_length=10, max_length=128)


def _set_cookies(resp: Response, user_id: int) -> None:
    # Vercel frontend and Render backend require cross-site cookies.
    cookie_options = {
        "secure": True,
        "samesite": "none",
        "path": "/",
        "max_age": settings.access_token_minutes * 60,
    }

    resp.set_cookie(
        COOKIE,
        make_token(user_id),
        httponly=True,
        **cookie_options,
    )

    # JavaScript must be able to read this cookie to send the CSRF header.
    resp.set_cookie(
        CSRF_COOKIE,
        new_csrf(),
        httponly=False,
        **cookie_options,
    )


def _public(u: models.User) -> dict:
    return {
        "id": u.id,
        "email": u.email,
        "full_name": u.full_name,
        "role": u.role,
    }


@router.post("/register", status_code=201)
def register(
    body: Register,
    request: Request,
    resp: Response,
    db: Session = Depends(get_db),
):
    rate_limit(f"reg:{request.client.host}", 10, 3600)

    if not (
        re.search(r"[A-Za-z]", body.password)
        and re.search(r"\d", body.password)
    ):
        raise HTTPException(422, "Password must include letters and numbers.")

    email = body.email.lower()

    if db.scalar(select(models.User).where(models.User.email == email)):
        raise HTTPException(409, "An account with this email already exists.")

    user = models.User(
        email=email,
        password_hash=hash_password(body.password),
        full_name=body.full_name,
    )

    db.add(user)
    db.commit()
    audit(db, user.id, "auth.register", f"user:{user.id}")

    _set_cookies(resp, user.id)
    return _public(user)


@router.post("/login")
def login(
    body: Credentials,
    request: Request,
    resp: Response,
    db: Session = Depends(get_db),
):
    rate_limit(f"login:{request.client.host}", 10, 300)

    user = db.scalar(
        select(models.User).where(models.User.email == body.email.lower())
    )

    if (
        not user
        or not user.is_active
        or not verify_password(body.password, user.password_hash)
    ):
        audit(
            db,
            user.id if user else None,
            "auth.login",
            body.email.lower()[:100],
            "failure",
        )
        raise HTTPException(401, "Email or password is incorrect.")

    audit(db, user.id, "auth.login", f"user:{user.id}")
    _set_cookies(resp, user.id)

    return _public(user)


@router.post("/logout")
def logout(
    resp: Response,
    user: models.User = Depends(current_user),
    db: Session = Depends(get_db),
):
    audit(db, user.id, "auth.logout", f"user:{user.id}")

    # Cookie deletion must use matching path and cookie attributes.
    resp.delete_cookie(
        COOKIE,
        path="/",
        secure=True,
        samesite="none",
    )
    resp.delete_cookie(
        CSRF_COOKIE,
        path="/",
        secure=True,
        samesite="none",
    )

    return {"ok": True}


@router.get("/me")
def me(user: models.User = Depends(current_user)):
    return _public(user)


@router.post("/forgot-password")
def forgot_password(body: dict, request: Request):
    rate_limit(f"forgot:{request.client.host}", 5, 3600)

    # Always return the same response to avoid revealing account existence.
    # Configure a real mail sender before enabling reset links.
    return {
        "message": (
            "If an account exists for that email, reset instructions will be sent."
        )
    }


@router.post("/reset-password")
def reset_password():
    raise HTTPException(
        501,
        "Password reset needs an email sender. Configure one before enabling this endpoint.",
    )
