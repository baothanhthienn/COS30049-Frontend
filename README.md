# COS30049 — Prompt Injection Detector

**Group:** Session 04 Group 6 · Nguyen Gia Bao Pham, Huu Cuong Nguyen, Ethan Nguyen
**Due:** 2026-11-08 23:59 AEDT · Assignment 3 (45%)

A full-stack web app that classifies free-text input as benign or a prompt injection attempt. Users submit prompts through a ChatGPT-style React UI; a FastAPI backend runs a two-stage ML classifier, persists results in PostgreSQL, and returns a verdict with attack-family label, confidence score, and the specific token spans that drove the decision.

**Live:** [Vercel frontend URL] · [Railway backend URL] _(filled after deployment)_

---

## Setup & Run

### Prerequisites

- Python 3.11+
- Node.js 20+
- PostgreSQL 15+ (local) or Railway managed DB (production)

### Backend

```bash
# macOS
brew install postgresql@15
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # fill in DATABASE_URL
alembic upgrade head           # create tables
uvicorn app.main:app --reload
```

```bash
# Linux
sudo apt install postgresql-15
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
uvicorn app.main:app --reload
```

```powershell
# Windows (PowerShell)
# Install PostgreSQL from https://www.postgresql.org/download/windows/
cd backend
python -m venv .venv; .venv\Scripts\Activate.ps1
pip install -r requirements.txt
cp .env.example .env          # fill in DATABASE_URL
alembic upgrade head
uvicorn app.main:app --reload
```

API docs available at `http://localhost:8000/api/docs` once running.

### Frontend

```bash
cd frontend
npm install
cp ../.env.example .env.local  # set VITE_API_BASE_URL=http://localhost:8000
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
           │  session_id (localStorage, UUID v4)               │
           ▼                                                    ▼
                                                       ┌──────────────────┐
                                                       │   PostgreSQL       │
                                                       │   (Railway)        │
                                                       │  classifications   │
                                                       │  sessions          │
                                                       └───────────────────┘
```

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
- **Denial of Service** (Advanced, 4 marks) — `asyncio.Semaphore` concurrency cap + `slowapi` rate limiting + Pydantic input size cap. See `backend/attacks/demo_dos.py`.
- **SQL Injection** (Intermediate, 3 marks) — all queries via SQLAlchemy ORM / bound parameters; CI asserts zero raw f-string SQL. See `backend/attacks/demo_sqli.py`.

**Advanced attack (§2.8):**
- **Detection Evasion** — Unicode homoglyphs, zero-width chars, mixed scripts, NFKC-reversible forms. Before/after measurement with `NORMALISE=on/off`. Results: `backend/attacks/results/`.

---

## Named Defences (§2.7)

1. **Denial of Service** (Advanced) — `backend/app/core/security.py` + `backend/attacks/demo_dos.py`
2. **SQL Injection** (Intermediate) — `backend/app/db/models.py` + `backend/attacks/demo_sqli.py`

## Named Advanced Attack (§2.8)

**Detection Evasion** — `backend/attacks/measure_evasion.py` · results in `backend/attacks/results/`

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
