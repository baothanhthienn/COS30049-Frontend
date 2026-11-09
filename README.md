# COS30049 — Prompt Injection Detector

**Group:** Session 04 Group 6 · Nguyen Gia Bao Pham, Huu Cuong Nguyen, Ethan Nguyen
**Due:** 2026-11-08 23:59 AEDT · Assignment 3 (45%)

A full-stack web app that classifies free-text input as benign or a prompt injection attempt. Users submit prompts through a ChatGPT-style React UI; a FastAPI backend runs a two-stage ML classifier, persists results in PostgreSQL, and returns a verdict with attack-family label, confidence score, and the specific token spans that drove the decision.

**Live:** [cos-30049-frontend.vercel.app](https://cos-30049-frontend.vercel.app) · [API](https://cos30049-backend-production.up.railway.app/api/docs)

---

## Setup & Run

### Prerequisites

- Python 3.11+
- Node.js 20+
- PostgreSQL 15+ (local) or Railway managed DB (production)

### Backend

The backend lives in the **Assignment 2** repository (separate folder from this one).

```bash
# macOS
brew install postgresql@15
# Create the database (one-time)
createdb prompt_injection_db

cd "Assignment 2"
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # fill in DATABASE_URL and API_KEY
alembic upgrade head           # create tables
uvicorn api.main:app --reload
```

```bash
# Linux
sudo apt install postgresql-15
sudo -u postgres createdb prompt_injection_db

cd "Assignment 2"
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
uvicorn api.main:app --reload
```

```powershell
# Windows (PowerShell)
# Install PostgreSQL from https://www.postgresql.org/download/windows/
# Then create the database in psql: CREATE DATABASE prompt_injection_db;
cd "Assignment 2"
python -m venv .venv; .venv\Scripts\Activate.ps1
pip install -r requirements.txt
cp .env.example .env          # fill in DATABASE_URL and API_KEY
alembic upgrade head
uvicorn api.main:app --reload
```

API docs available at `http://localhost:8000/api/docs` once running.

### Frontend

```bash
npm install
cp .env.example .env.local     # set VITE_API_BASE_URL and VITE_API_KEY
npm run dev
```

Open `http://localhost:5173`.

---

## Architecture

```
┌─────────────────────┐        HTTPS/JSON        ┌──────────────────────┐
│   React Frontend     │ ───────────────────────▶ │   FastAPI Backend     │
│   (Vercel)           │ ◀─────────────────────── │   (Railway)           │
│                       │      verdict + spans      │                       │
│  ChatGPT-style UI     │                           │  Input validation     │
│  Sidebar history      │                           │  Two-stage ML         │
│  Span highlighting    │                           │  Postgres writer      │
│  Session trend view   │                           │  Rate limiting        │
└──────────┬────────────┘                           └──────────┬────────────┘
           │  session_id (sessionStorage, UUID v4)             │
           ▼                                                    ▼
                                                       ┌──────────────────┐
                                                       │   PostgreSQL       │
                                                       │   (Railway)        │
                                                       │  classifications   │
                                                       │  sessions          │
                                                       └───────────────────┘
```

---

## Screenshots

**Chat — submit a prompt and receive a verdict with confidence and trigger spans**

![Chat page](src/assets/screenshots/chat-page.jpg)

**Ranking — leaderboard of all classified prompts across sessions, filterable by attack family**

![Ranking page](src/assets/screenshots/trend-page.jpg)

**About — threat model summary and attack family reference**

![About page](src/assets/screenshots/about-page.jpg)

---

## Threat Model

**Who attacks?** An operator or researcher attempting to smuggle a prompt injection past this guardrail so it reaches a downstream LLM undetected.

**What do they want?** A false ALLOW verdict on a known injection attempt — causing the guardrail to pass a payload that would manipulate or jailbreak the downstream model.

**What can they do?** Submit crafted strings through the public `/api/classify` endpoint; probe timing and response-size side-channels; apply character-level obfuscation (homoglyphs, zero-width characters, encoding tricks) to evade the classifier's feature extraction.

**§2.7 Risk mapping:**

| Risk | Applies? | Justification |
|---|---|---|
| SQL Injection | ✓ | App persists every classification in PostgreSQL; a search endpoint accepts user-controlled query params |
| Denial of Service | ✓ | ML inference (Stage A + B) is CPU-bound; a flood of max-length inputs can saturate the event loop |
| Detection Evasion | ✓ (§2.8) | Character-level obfuscation can fool token-level feature extraction without normalisation |
| SSRF | ✗ | App makes no outbound HTTP requests; classifier runs fully local |
| Broken Access Control | ✗ | No user accounts; session identity is a client-generated UUID with no privilege model |
| XSS | ✗ | React escapes all user-controlled output; `dangerouslySetInnerHTML` is banned by lint rule |

**Defences implemented (§2.7):**
- **Denial of Service** (Advanced, 4 marks) — `asyncio.Semaphore` concurrency cap + custom sliding-window rate limiter + Pydantic input size cap. See `attacks/demo_dos.py` in the backend.
- **SQL Injection** (Intermediate, 3 marks) — all queries via SQLAlchemy ORM / bound parameters; no raw f-string SQL. See `attacks/demo_sqli.py` in the backend.

**Advanced attack (§2.8):**
- **Detection Evasion** — Unicode homoglyphs (Cyrillic look-alikes), zero-width chars, mixed scripts. NFKC normalisation in `preprocessing.py` restores original characters before feature extraction. Before/after measurement: `attacks/measure_evasion.py` in the backend.

---

## Named Defences (§2.7)

1. **Denial of Service** (Advanced) — `api/main.py` (rate-limit middleware + semaphore) + `attacks/demo_dos.py`
2. **SQL Injection** (Intermediate) — `api/db/models.py` + `api/routers/sessions.py` (ORM only) + `attacks/demo_sqli.py`

## Named Advanced Attack (§2.8)

**Detection Evasion** — `attacks/measure_evasion.py` (in backend repo)

---

## Security Hygiene (§2.3)

Four measures required before §2.7/§2.8 work is counted:

| # | Measure | Where enforced |
|---|---------|----------------|
| 1 | **No raw HTML rendering** — `dangerouslySetInnerHTML` is not used anywhere in the React source | `frontend/src/` (grep-verified) |
| 2 | **Input size cap** — Pydantic `text: str = Field(max_length=10_000)` on `POST /api/classify`; `limit_body_size` middleware rejects bodies > 1 MB | `api/routers/classify.py` |
| 3 | **CORS allowlist** — explicit allowlist: `https://cos-30049-frontend.vercel.app` + `http://localhost:5173`; wildcard `*` is never set | `api/main.py` + `api/core/errors.py` |
| 4 | **Secrets in env only** — no credentials in source; `.env` files are gitignored; `.env.example` ships with placeholder values. `VITE_API_KEY` is a low-privilege API token (rate-limit identity only, grants no admin access); it is intentionally public-facing and treated as such — analogous to a public site key. The backend enforces all privilege checks independently. | `.env.example` · `.gitignore` · `src/api/client.ts` |

---

## Dependencies

- Backend: see `backend/requirements.txt`
- Frontend: see `frontend/package.json`

---

## References

- Boucher, N., Shumailov, I., Anderson, R. and Papernot, N. (2022) 'Bad characters: Imperceptible NLP attacks', *2022 IEEE Symposium on Security and Privacy*.
- OpenAI (2024) *ChatGPT UI Kit (Community)*. Figma Community.
- OWASP (2024) *Top 10 Web Application Security Risks*. Available at: https://owasp.org/www-project-top-ten/
- Unicode Consortium (n.d.) *Unicode Technical Standard #39: Security Mechanisms*. Available at: https://unicode.org/reports/tr39/

---

## Generative AI Usage

This project used Claude (Anthropic) to assist with system design documentation, code scaffolding, and security evaluation scripts. All generated code was reviewed, tested, and adapted by team members. No AI-generated content was submitted without understanding and verification.
