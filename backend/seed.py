"""Create synthetic demo data. Run: python seed.py

Creates demo@phishguard.local with a password printed once to the console.
All records are invented. Do not use real mail here.
"""
import secrets
from datetime import timedelta

from app import models
from app.analysis.engine import analyze
from app.analysis.parser import parse_pasted
from app.analysis.text_model import TextModel
from app.db import SessionLocal
from app.security import hash_password

SAMPLES = [
    ("support@secure-acc0unt-verify.com", "attacker@evil.example", "Urgent: verify your account",
     "Your access will be suspended. Log in immediately at http://secure-acc0unt-verify.com/login"),
    ("billing@vendor-example.org", "", "Invoice 4471 for October",
     "Hello, your invoice is attached. See https://vendor-example.org/invoices/4471"),
    ("team@company-example.org", "", "Weekly planning notes", "Agenda for Thursday: roadmap, hiring, retro."),
    ("alerts@bank-secure-login.top", "", "Payment failed: confirm your password",
     "Confirm your password at http://bit.ly/3xK9pQ or your card will be blocked."),
]


def main() -> None:
    model = TextModel()
    db = SessionLocal()
    pw = secrets.token_urlsafe(12)
    user = models.User(email="demo@phishguard.local", password_hash=hash_password(pw), full_name="Demo User")
    db.add(user)
    db.flush()
    for i, (s, rt, sub, body) in enumerate(SAMPLES * 3):
        parsed = parse_pasted(s, sub, body, rt)
        rec = models.EmailRecord(owner_id=user.id, sender=s, reply_to=rt, subject=sub, body_text=body,
                                 received_at=models.now() - timedelta(days=i * 2))
        db.add(rec)
        db.flush()
        r = analyze(parsed, model)
        a = models.EmailAnalysis(email_id=rec.id, owner_id=user.id, risk_category=r["risk_category"], risk_score=r["risk_score"],
                                 classification=(r["model"]["output"] or {}).get("label", "unavailable"),
                                 model_version=r["model"]["version"], created_at=rec.received_at,
                                 evidence={"indicators": r["indicators"], "recommended_steps": r["recommended_steps"], "summary": r["summary"]})
        a.urls = [models.URLIndicator(url=u["url"], host=u["host"], risk=u["risk"], flags=u["flags"]) for u in r["urls"]]
        db.add(a)
    db.commit()
    print(f"Demo user: demo@phishguard.local\nPassword:  {pw}")


if __name__ == "__main__":
    main()
