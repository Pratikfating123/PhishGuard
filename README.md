# PhishGuard AI

AI-powered phishing detection and secure email management. React + Vite + Tailwind frontend, FastAPI + PostgreSQL backend, scikit-learn text classifier.

## Status

| Part | State |
|---|---|
| Analysis engine (parser, URL, sender, content, aggregation) | Written and tested (11 tests pass) |
| ML training script | Written, needs your labeled dataset |
| API (auth, emails, analysis, quarantine, dashboard, reports, audit) | Written, compiled, **not yet run** |
| API tests (`tests/test_api.py`) | Written, **not yet run** (needs PostgreSQL) |
| Frontend (landing, auth, 9 dashboard pages) | Written, syntax-checked, **not yet built or run** |
| Alembic | Configured, **first migration still needs generating** (step 3) |

The workspace this was written in could not reach PyPI or npm, so the API and frontend were never executed. Expect to fix small errors on first run.

## Requirements

Python 3.11+, Node 20+, PostgreSQL 14+.

## Setup

```bash
# 1. Database
createdb phishguard   # or: psql -c "CREATE DATABASE phishguard;"
psql -c "CREATE USER phishguard WITH PASSWORD 'change-me'; GRANT ALL ON DATABASE phishguard TO phishguard;"

# 2. Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python -c "import secrets; print(secrets.token_urlsafe(48))"   # paste into SECRET_KEY in .env

# 3. Migrations (generate the first one, then apply)
alembic revision --autogenerate -m "initial schema"
alembic upgrade head

# 4. Train the classifier (see "Dataset" below). Without it, results use rules only.
python -m ml.train --data data/emails.csv --text-col text --label-col label

# 5. Demo data (optional, synthetic). Prints the demo password once.
python seed.py

# 6. Run the API
uvicorn app.main:app --reload --port 8000

# 7. Frontend (new terminal)
cd frontend
npm install
npm run dev        # http://localhost:5173
```

## Tests

```bash
cd backend
pytest tests/test_analysis.py                       # no database needed
SECRET_KEY=test DATABASE_URL=postgresql+psycopg2://phishguard:change-me@localhost/phishguard_test pytest tests/test_api.py
cd ../frontend && npm run build                      # confirms the frontend compiles
```

## Dataset

Put a labeled CSV at `backend/data/emails.csv` with a text column (subject and body) and a label column (1 phishing, 0 legitimate). Use a published, licensed corpus. The training script removes duplicate texts before splitting, chooses the threshold on a validation split only, and prints test-set size, class counts, precision, recall, F1 and the confusion matrix into `ml/artifacts/metadata.json`. Report those numbers as they are. A model trained on a handful of invented examples proves nothing.

## What is not built yet

- Password reset (needs an email sender; the endpoint returns 501 on purpose)
- Password change, notification preferences, admin risk policy, mailbox integrations (Settings page lists these)
- Threat review status actions and a dedicated threats API (the Threats page filters analyses)
- Admin-only Administration section
- Framer Motion animation and a newsletter form (omitted rather than faked)
- Rate limiting is in-memory per process; use Redis or a gateway for multiple workers

## API

`POST /api/auth/register|login|logout|forgot-password|reset-password`, `GET /api/auth/me`
`GET /api/emails`, `POST /api/emails/import`, `GET /api/emails/{id}`, `PATCH /api/emails/{id}/read-status`
`POST /api/analyze`, `GET /api/analysis`, `GET /api/analysis/{id}`
`GET /api/quarantine`, `POST /api/quarantine/{email_id}`, `POST /api/quarantine/{email_id}/release` (body `{"confirm": true}`)
`GET /api/dashboard/stats|trends|risk-distribution`, `GET /api/reports/export`, `GET /api/audit-logs`
Interactive docs at http://localhost:8000/docs.

## Layout

```
backend/app/analysis/   parser, urls, headers, text_model, engine (pure Python, tested)
backend/app/routers/    HTTP endpoints
backend/ml/train.py     training and evaluation
frontend/src/pages/     landing and auth
frontend/src/dashboard/ authenticated app
docs/                   architecture, security notes, evaluation template
```
