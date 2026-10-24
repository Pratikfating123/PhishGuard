"""Risk aggregation. Classifier output and heuristics stay separate so each can be tested alone."""
from __future__ import annotations

from datetime import datetime, timezone

from .headers import analyze_attachments, analyze_content, analyze_sender
from .parser import ParsedEmail
from .text_model import TextModel
from .urls import analyze_urls

HEURISTIC_HIGH = 5
HEURISTIC_SUSPICIOUS = 2


def heuristic_score(sender_ind, content_ind, attach_ind, url_results) -> int:
    s = sum(i.get("weight", 0) for i in (*sender_ind, *content_ind, *attach_ind))
    s += sum(min(u.get("score", 0), 3) for u in url_results)
    return s


def categorize(model_out: dict | None, h_score: int) -> str:
    """Combine the model verdict and the heuristic score into a risk category."""
    if model_out is None and h_score < HEURISTIC_SUSPICIOUS:
        return "inconclusive"  # no model and no evidence: never report "safe"
    is_phish = bool(model_out and model_out["label"] == "phishing")
    if (is_phish and h_score >= HEURISTIC_SUSPICIOUS) or h_score >= HEURISTIC_HIGH:
        return "high_risk"
    if is_phish or h_score >= HEURISTIC_SUSPICIOUS:
        return "suspicious"
    return "low_risk"


def analyze(parsed: ParsedEmail, model: TextModel) -> dict:
    model_out = model.predict(f"{parsed.subject}\n{parsed.body_text}")
    url_results = analyze_urls(parsed.urls)
    sender_ind = analyze_sender(parsed.sender, parsed.reply_to, parsed.headers)
    content_ind = analyze_content(parsed.subject, parsed.body_text)
    attach_ind = analyze_attachments(parsed.attachments)
    h = heuristic_score(sender_ind, content_ind, attach_ind, url_results)
    category = categorize(model_out, h)

    # Numeric score blends both signals. It is a ranking aid, not a calibrated probability.
    m = model_out["phishing_score"] if model_out else 0.0
    score = round(min(100.0, (60 * m if model_out else 0) + min(h, 8) * (5 if model_out else 12.5)))

    indicators = [*sender_ind, *content_ind, *attach_ind]
    for u in url_results:
        for f in u["flags"]:
            indicators.append({"code": f["code"], "kind": f["kind"], "weight": 0, "text": f"{u['host'] or u['url']}: {f['text']}"})

    steps = {
        "high_risk": ["Do not click links or open attachments.", "Hold the message in quarantine for review.", "Report it to your security team."],
        "suspicious": ["Verify the sender through a separate channel.", "Avoid clicking links until verified."],
        "low_risk": ["No strong indicators were found. Stay cautious with unexpected requests."],
        "inconclusive": ["The classifier is unavailable or evidence was insufficient. Review the message manually."],
    }[category]

    return {
        "risk_category": category,
        "risk_score": score,
        "model": {"available": model.available, "output": model_out, "version": model.version},
        "heuristic_score": h,
        "indicators": indicators,
        "urls": url_results,
        "recommended_steps": steps,
        "summary": f"Assessed as {category.replace('_', ' ')}. This is an automated assessment, not proof.",
        "analyzed_at": datetime.now(timezone.utc).isoformat(),
    }
