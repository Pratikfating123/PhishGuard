import secrets
import time
from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from fastapi import HTTPException, Request

from .config import settings

_ph = PasswordHasher()  # Argon2id by default
COOKIE = "pg_session"
CSRF_COOKIE = "pg_csrf"


def hash_password(pw: str) -> str:
    return _ph.hash(pw)


def verify_password(pw: str, hashed: str) -> bool:
    try:
        return _ph.verify(hashed, pw)
    except VerifyMismatchError:
        return False
    except Exception:  # noqa: BLE001
        return False


def make_token(user_id: int) -> str:
    exp = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_minutes)
    return jwt.encode({"sub": str(user_id), "exp": exp}, settings.secret_key, algorithm="HS256")


def read_token(token: str) -> int | None:
    try:
        return int(jwt.decode(token, settings.secret_key, algorithms=["HS256"])["sub"])
    except Exception:  # noqa: BLE001
        return None


def new_csrf() -> str:
    return secrets.token_urlsafe(32)


def check_csrf(request: Request) -> None:
    """Double-submit cookie check for state-changing requests."""
    if request.method in {"GET", "HEAD", "OPTIONS"}:
        return
    cookie, header = request.cookies.get(CSRF_COOKIE), request.headers.get("x-csrf-token")
    if not cookie or not header or not secrets.compare_digest(cookie, header):
        raise HTTPException(403, "CSRF token missing or invalid.")


_hits: dict[str, deque] = defaultdict(deque)


def rate_limit(key: str, limit: int, window_s: int) -> None:
    """In-memory limiter for one process. Use Redis or a gateway in multi-worker deployments."""
    now, q = time.monotonic(), _hits[key]
    while q and now - q[0] > window_s:
        q.popleft()
    if len(q) >= limit:
        raise HTTPException(429, "Too many attempts. Try again later.")
    q.append(now)
