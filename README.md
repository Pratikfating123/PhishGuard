<div align="center">

# ðŸ›¡ï¸ PhishGuard AI

### AI-assisted phishing detection and secure email analysis

Analyze suspicious email content, inspect URLs and sender signals, review risk indicators, and keep an auditable record of security investigations.

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![FastAPI](https://img.shields.io/badge/API-FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)](https://www.python.org/)

**Live Demo:** [PhishGuard AI](https://phish-guard-murex.vercel.app/) Â· **API Docs:** run the backend locally and visit `http://localhost:8000/docs`

</div>

---

## Product Preview

![PhishGuard AI dashboard preview](docs/screenshots/dashboard-preview.png)

> The included preview is an illustrative README graphic, not a captured live application screenshot. Replace it with a real screenshot from your running app when available. See [Adding real screenshots](#adding-real-screenshots).

## Overview

PhishGuard AI is a full-stack security project designed to help users investigate potentially malicious emails. It combines a React interface with a FastAPI backend, PostgreSQL persistence, rule-based indicators, and an optional machine-learning text classifier.

The analysis pipeline separates observed message facts from heuristic signals. Its risk score is an evidence-ranking score, **not a calibrated probability**. When a trained classifier is unavailable and evidence is insufficient, the system can return an inconclusive result rather than declaring an email safe.

## Features

- **Email analysis:** submit email content for a structured security assessment.
- **URL indicators:** inspect URLs found in a message and report heuristic warning signals without visiting the URLs.
- **Sender and header signals:** evaluate available sender, reply-to, authentication-result, and content indicators.
- **Risk summary:** combine analysis signals into a risk category, score, evidence, and suggested next steps.
- **Email workspace:** browse imported email records and view analysis history.
- **Threats and quarantine views:** review flagged messages and quarantine records.
- **Dashboard and reports:** view dashboard statistics, trends, risk distribution, and exportable reports.
- **Audit trail:** retain records of relevant application actions.
- **Authentication protections:** HttpOnly session cookie, CSRF-token checks for state-changing requests, password hashing, and ownership checks.
- **Responsive frontend:** React, Vite, Tailwind CSS, and Recharts.

Feature availability depends on configuration and whether the required database and trained model are present. Password-reset email delivery and some settings shown in the UI require additional implementation or integration.

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React 18, Vite, React Router, Tailwind CSS, Recharts, Lucide React |
| Backend | Python, FastAPI, Uvicorn, Pydantic |
| Database and migrations | PostgreSQL, SQLAlchemy, Alembic |
| Machine learning | scikit-learn, TF-IDF, Logistic Regression, pandas, joblib |
| Security | Argon2 password hashing, JWT-based session cookie, CSRF checks, security headers |
| Deployment | Vercel-compatible frontend; backend can be deployed separately |

## Architecture

```text
Browser
  â”‚
  â–¼
React + Vite frontend
  â”‚  HTTP API requests, session cookie, CSRF token
  â–¼
FastAPI backend
  â”œâ”€â”€ Authentication and authorization
  â”œâ”€â”€ Email parsing and analysis pipeline
  â”‚    â”œâ”€â”€ Sender / header checks
  â”‚    â”œâ”€â”€ URL indicator checks
  â”‚    â”œâ”€â”€ Content heuristics
  â”‚    â””â”€â”€ Optional ML text classifier
  â”œâ”€â”€ Dashboard, reports, quarantine, audit logs
  â–¼
PostgreSQL database
```

More details: [`docs/architecture.md`](docs/architecture.md) and [`docs/security-and-privacy.md`](docs/security-and-privacy.md).

## Getting Started on Windows

### Prerequisites

Install the following before starting:

- Python 3.11 or newer
- Node.js 20 or newer and npm
- PostgreSQL 14 or newer
- Git

### 1. Clone the repository

```powershell
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd phishguard
```

Replace `<YOUR_GITHUB_REPOSITORY_URL>` with your repository URL. If you already downloaded the source ZIP, extract it and open the `phishguard` folder in VS Code.

### 2. Create the PostgreSQL database

Open `psql` or pgAdmin and create a database and user. Example SQL:

```sql
CREATE USER phishguard WITH PASSWORD 'replace-with-a-strong-password';
CREATE DATABASE phishguard OWNER phishguard;
```

Use your own strong password. If the database or user already exists, do not run the creation statements again.

### 3. Configure the backend

Open PowerShell in the project folder:

```powershell
cd backend
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
Copy-Item .env.example .env
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

Copy the generated secret into `SECRET_KEY` in `backend/.env`. Update `DATABASE_URL` with your PostgreSQL username, password, host, and database name. Example:

```env
DATABASE_URL=postgresql+psycopg2://phishguard:YOUR_PASSWORD@localhost:5432/phishguard
SECRET_KEY=PASTE_A_LONG_RANDOM_SECRET_HERE
CORS_ORIGINS=http://localhost:5173
COOKIE_SECURE=false
```

Do not commit `.env` or real credentials to GitHub.

### 4. Apply database migrations

Run these commands from the `backend` folder:

```powershell
alembic upgrade head
```

If this is a fresh checkout and there is no migration revision in `backend/alembic/versions/`, generate the initial migration once, then apply it:

```powershell
alembic revision --autogenerate -m "initial schema"
alembic upgrade head
```

Do not generate a second initial migration if one is already committed.

### 5. Start the backend API

From `backend` with the virtual environment active:

```powershell
uvicorn app.main:app --reload --port 8000
```

Check the health endpoint at `http://localhost:8000/api/health`. Interactive API documentation is at `http://localhost:8000/docs`.

### 6. Start the frontend

Open a second PowerShell terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite, normally `http://localhost:5173`.

If the frontend needs a different API address, check `frontend/src/api.js` and configure the environment variable expected by that file. Keep the frontend's API URL aligned with the backend deployment.

## Optional: Train the Machine-Learning Classifier

The classifier needs a labeled CSV dataset. Use a dataset that you are permitted to use and redistribute, and review its license before including it in the repository.

Expected example format:

```csv
text,label
"Example email content goes here",0
"Example suspicious email content goes here",1
```

Place the dataset at `backend/data/emails.csv`, with `1` representing phishing and `0` representing legitimate email, unless you configure different column names. Then run from `backend`:

```powershell
python -m ml.train --data data/emails.csv --text-col text --label-col label
```

Review the generated evaluation metadata before making claims about detection performance. A model trained on a tiny or synthetic dataset is not evidence of real-world accuracy. The application can use rule-based analysis when a trained model is not available, but it should not be treated as a replacement for a dedicated email-security product.

## Tests and Build Checks

From the `backend` folder:

```powershell
pytest tests/test_analysis.py
```

For API tests, configure a separate test database and a test-only `SECRET_KEY` before running:

```powershell
$env:SECRET_KEY = "local-test-secret-change-this"
$env:DATABASE_URL = "postgresql+psycopg2://phishguard:YOUR_PASSWORD@localhost:5432/phishguard_test"
pytest tests/test_api.py
```

From the `frontend` folder:

```powershell
npm run build
```

Run tests only against local or explicitly authorized systems. Use synthetic or sanitized email data during development.

## API Reference

The backend exposes interactive API documentation at `/docs`. Main endpoint groups include:

| Area | Example endpoints |
|---|---|
| Health | `GET /api/health` |
| Authentication | `/api/auth/*` |
| Emails | `GET /api/emails`, `POST /api/emails/import` |
| Analysis | `POST /api/analyze`, `GET /api/analysis` |
| Quarantine | `GET /api/quarantine`, `POST /api/quarantine/{email_id}` |
| Dashboard | `/api/dashboard/stats`, `/api/dashboard/trends`, `/api/dashboard/risk-distribution` |
| Reports | `GET /api/reports/export` |
| Audit | `GET /api/audit-logs` |

Consult the interactive API docs for request schemas, response formats, and current endpoint behavior.

## Repository Structure

```text
phishguard/
â”œâ”€â”€ backend/
â”‚   â”œâ”€â”€ app/                 # FastAPI application, models, auth, API routers
â”‚   â”œâ”€â”€ alembic/             # Database migrations
â”‚   â”œâ”€â”€ data/                # Example dataset schema, not private email data
â”‚   â”œâ”€â”€ ml/                  # Model training and artifacts logic
â”‚   â”œâ”€â”€ tests/               # Analysis and API tests
â”‚   â”œâ”€â”€ .env.example         # Safe configuration template
â”‚   â””â”€â”€ requirements.txt
â”œâ”€â”€ frontend/
â”‚   â”œâ”€â”€ src/                 # React application and dashboard pages
â”‚   â”œâ”€â”€ package.json
â”‚   â””â”€â”€ vercel.json
â”œâ”€â”€ docs/
â”‚   â”œâ”€â”€ architecture.md
â”‚   â”œâ”€â”€ security-and-privacy.md
â”‚   â””â”€â”€ evaluation-report-template.md
â””â”€â”€ README.md
```

## Adding Real Screenshots

To replace the illustrative preview with a genuine screenshot:

1. Run the backend and frontend locally, or open the deployed application.
2. Navigate to the page you want to document, for example the landing page or dashboard.
3. Capture a screenshot with your operating system's screenshot tool.
4. Save it in `docs/screenshots/`, for example as `dashboard.png`.
5. Update the image link near the top of this README to `![PhishGuard AI dashboard](docs/screenshots/dashboard.png)`.

Use synthetic messages and hide personal information, email addresses, tokens, and other sensitive data in screenshots.

## Security and Privacy Notes

- Never upload `.env`, database passwords, secret keys, access tokens, real customer emails, or private datasets to a public repository.
- Treat email content, URLs, and attachments as untrusted input. Do not open suspicious links or attachments just to test detection.
- The URL checks are designed to evaluate extracted strings and heuristics. Do not assume the application has verified a URL's live reputation unless a reputation integration is explicitly configured.
- A risk score is not a probability or a guarantee. Verify important findings with additional security controls and human review.
- Review [`docs/security-and-privacy.md`](docs/security-and-privacy.md) before using real email data or deploying for multiple users.

## Current Limitations

- Password reset email delivery requires an email provider integration.
- Some settings and administrative workflows may be placeholders or require additional implementation.
- Rate limiting is in-memory and is not sufficient by itself for a multi-worker production deployment.
- Machine-learning quality depends on dataset quality, class balance, and measured evaluation results.
- Production deployment requires secure environment variables, HTTPS, a managed database, backups, logging, and operational monitoring.

## Roadmap

- [ ] Add and document verified screenshots of the live application
- [ ] Add repeatable CI checks for backend tests and frontend builds
- [ ] Integrate a production-grade rate limiter
- [ ] Add configurable email delivery for password reset and notifications
- [ ] Publish model evaluation results from a licensed, representative dataset
- [ ] Add deployment instructions for the API and PostgreSQL database

## Contributing

Issues and pull requests are welcome. For significant changes, describe the problem, proposed solution, and how you tested it. Avoid submitting secrets, real email content, or sensitive indicators.

## Disclaimer

PhishGuard AI is an educational and defensive security project. It can produce false positives and false negatives. Do not use its output as the sole basis for security, legal, financial, or operational decisions.

## License

No license has been specified in this repository yet. Add a `LICENSE` file before presenting the project as open source or permitting reuse.

---

<div align="center">

Built for learning, defensive security, and safer email investigation.

</div>

