"""API tests. Require a running test database: set DATABASE_URL to a throwaway DB and SECRET_KEY.

    SECRET_KEY=test DATABASE_URL=postgresql+psycopg2://... pytest tests/test_api.py
"""
import uuid

import pytest
from fastapi.testclient import TestClient

from app.db import Base, engine
from app.main import app


@pytest.fixture(scope="module")
def client():
    Base.metadata.create_all(engine)
    with TestClient(app) as c:
        yield c


def signup(client):
    email = f"{uuid.uuid4().hex[:8]}@example.com"
    r = client.post("/api/auth/register", json={"email": email, "password": "correct-horse-9", "full_name": "T"})
    assert r.status_code == 201
    client.headers["X-CSRF-Token"] = client.cookies.get("pg_csrf")
    return email


def test_unauthenticated_is_rejected():
    with TestClient(app) as c:
        assert c.get("/api/emails").status_code == 401


def test_state_change_needs_csrf(client):
    signup(client)
    token = client.headers.pop("X-CSRF-Token")
    assert client.post("/api/analyze", json={"body": "hi"}).status_code == 403
    client.headers["X-CSRF-Token"] = token


def test_analyze_persists_and_is_private(client):
    signup(client)
    r = client.post("/api/analyze", json={"sender": "a@x.com", "subject": "Urgent", "body": "Log in at http://192.168.1.1/x immediately"})
    assert r.status_code == 201
    aid = r.json()["id"]
    assert client.get(f"/api/analysis/{aid}").status_code == 200
    with TestClient(app) as other:
        other.post("/api/auth/register", json={"email": f"{uuid.uuid4().hex[:8]}@example.com", "password": "correct-horse-9"})
        other.headers["X-CSRF-Token"] = other.cookies.get("pg_csrf")
        assert other.get(f"/api/analysis/{aid}").status_code == 404


def test_release_requires_confirmation(client):
    signup(client)
    a = client.post("/api/analyze", json={"subject": "s", "body": "b"}).json()
    client.post(f"/api/quarantine/{a['email_id']}", json={"reason": "test"})
    assert client.post(f"/api/quarantine/{a['email_id']}/release", json={"confirm": False}).status_code == 422
    assert client.post(f"/api/quarantine/{a['email_id']}/release", json={"confirm": True}).status_code == 200


def test_rejects_non_eml_upload(client):
    signup(client)
    r = client.post("/api/emails/import", files={"file": ("x.txt", b"hello", "text/plain")})
    assert r.status_code == 415
