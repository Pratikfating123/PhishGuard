"""Sender and header analysis. Authentication results are only trusted when present."""
from __future__ import annotations

import re

URGENT = re.compile(r"\b(urgent|immediately|within 24 hours|act now|suspended|final notice|verify your account)\b", re.I)
CREDENTIALS = re.compile(r"\b(password|passcode|credentials|sign[- ]?in|log[- ]?in|ssn|social security|card number|pin)\b", re.I)
MONEY = re.compile(r"\b(wire transfer|gift card|bitcoin|invoice|payment (?:failed|overdue)|refund|bank account)\b", re.I)


def _domain(addr: str) -> str:
    return addr.rsplit("@", 1)[-1].lower() if "@" in addr else ""


def analyze_sender(sender: str, reply_to: str, headers: dict[str, str]) -> list[dict]:
    out: list[dict] = []
    if sender and reply_to and _domain(sender) != _domain(reply_to):
        out.append({"code": "reply_to_mismatch", "kind": "observed", "weight": 2,
                    "text": f"Reply-To domain ({_domain(reply_to)}) differs from the sender domain ({_domain(sender)})."})
    auth = headers.get("Authentication-Results", "")
    if auth:
        for mech in ("spf", "dkim", "dmarc"):
            m = re.search(rf"\b{mech}=(\w+)", auth, re.I)
            if m and m.group(1).lower() in {"fail", "softfail", "permerror"}:
                out.append({"code": f"{mech}_fail", "kind": "observed", "weight": 2,
                            "text": f"{mech.upper()} reported {m.group(1).lower()} in the Authentication-Results header."})
    else:
        out.append({"code": "no_auth_results", "kind": "observed", "weight": 0,
                    "text": "No Authentication-Results header was supplied, so sender authentication was not assessed."})
    return out


def analyze_content(subject: str, body: str) -> list[dict]:
    text = f"{subject}\n{body}"
    out = []
    if URGENT.search(text):
        out.append({"code": "urgency", "kind": "heuristic", "weight": 1, "text": "The message uses urgent or threatening language."})
    if CREDENTIALS.search(text):
        out.append({"code": "credential_request", "kind": "heuristic", "weight": 2, "text": "The message refers to passwords, sign-in or other credentials."})
    if MONEY.search(text):
        out.append({"code": "financial_request", "kind": "heuristic", "weight": 1, "text": "The message makes an unusual financial or account request."})
    return out


def analyze_attachments(attachments: list[dict]) -> list[dict]:
    risky = {".exe", ".js", ".vbs", ".scr", ".bat", ".cmd", ".iso", ".lnk", ".docm", ".xlsm", ".html", ".htm"}
    out = []
    for a in attachments:
        name = a.get("filename", "").lower()
        if any(name.endswith(ext) for ext in risky):
            out.append({"code": "risky_attachment", "kind": "observed", "weight": 2,
                        "text": f"Attachment '{a.get('filename')}' has a file type that is commonly used to deliver malware."})
    return out
