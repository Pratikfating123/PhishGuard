# Architecture

## Analysis pipeline

```
paste / .eml upload
   -> parser.py        sender, reply-to, subject, text, headers, URLs, attachment metadata
   -> text_model.py    TF-IDF + logistic regression -> label and score (or None if no model file)
   -> urls.py          per-URL observed facts and heuristic flags (strings only, nothing is fetched)
   -> headers.py       reply-to mismatch, SPF/DKIM/DMARC from Authentication-Results, content cues, attachment types
   -> engine.py        combine -> risk category, 0-100 score, indicators, next steps
   -> routers/analysis persist EmailAnalysis, URLIndicator, ThreatEvent; write audit entry
```

The classifier and the heuristics are separate modules with separate scores, so each is testable alone.

## Decisions worth knowing

- **No model, no "safe".** With no trained model and little evidence the verdict is `inconclusive`. Rules alone can still raise `suspicious` or `high_risk`.
- **Score is not a probability.** `risk_score` ranks evidence strength. It is not calibrated, and the UI says so.
- **Observed vs heuristic.** Indicators carry `kind: observed` (a fact about the message) or `heuristic` (a guess). The result page shows them separately.
- **Missing authentication headers are not failures.** Without `Authentication-Results`, the sender check reports "not assessed" with weight 0.
- **Ownership.** Every query filters by `owner_id`. A foreign id returns 404, not 403.

## Data model

User, EmailRecord, EmailAnalysis, URLIndicator, ThreatEvent, QuarantineRecord, AuditLog, IntegrationConfiguration (see `app/models.py`). Raw bodies are stored once on EmailRecord; analyses store structured evidence only.

## Sessions

JWT in an HttpOnly, SameSite=Lax cookie. A second readable cookie holds a CSRF token that the frontend echoes in `X-CSRF-Token` on every non-GET request (double-submit check in `deps.current_user`).
