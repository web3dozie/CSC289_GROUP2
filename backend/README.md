# Task Line — Backend

This document describes the backend for Task Line, how to run it locally, and how it maps to the project's low-level requirements.

Summary
- Backend is a Quart-based async API using SQLAlchemy ORM with an SQLite development database.
- Structure: modular "monolith" using Blueprints for auth, tasks, review, settings (see backend/blueprints).
- Key files:
  - backend/db_async.py — async engine, sessions, DB connection setup.
  - backend/models.py — SQLAlchemy ORM models.
  - backend/app.py — app factory / initialization and DB seed logic.
  - backend/blueprints/* — API endpoints by domain.
  - backend/tests/* — pytest tests for API and models.
  - backend/taskline.db — local SQLite DB (should not be committed; see below).

## Project Structure

```
backend/
├── app.py                    # Main Quart application factory
├── db_async.py              # Async database engine and session setup
├── models.py                # SQLAlchemy ORM models (User, Task, Status, etc.)
├── requirements.txt         # Python dependencies
├── taskline.db             # Local SQLite database (should be gitignored)
├── debug_auth_post.py      # Debug script for auth testing
├── debug_init_db.py        # Debug script for database initialization
├── debug_task_flow.py      # Debug script for task workflows
├── README.md               # This file
├── __pycache__/            # Python bytecode cache (gitignored)
├── blueprints/             # Modular API blueprints
│   ├── __init__.py
│   ├── __pycache__/
│   ├── auth/               # Authentication endpoints
│   │   ├── __init__.py
│   │   ├── routes.py       # PIN setup, login, logout, PIN changes
│   │   └── __pycache__/
│   ├── tasks/              # Task management endpoints
│   │   ├── __init__.py
│   │   ├── routes.py       # CRUD operations, kanban, categories
│   │   └── __pycache__/
│   ├── review/             # Review and analytics endpoints
│   │   ├── __init__.py
│   │   ├── routes.py       # Journal, summaries, insights
│   │   └── __pycache__/
│   └── settings/           # User preferences endpoints
│       ├── __init__.py
│       ├── routes.py       # Feature toggles, themes, auto-lock
│       └── __pycache__/
└── tests/                  # Test suite
    ├── test_api.py         # General API and task CRUD tests
    ├── test_quart_api.py   # Basic Quart app smoke tests
    ├── test_review_api.py  # Review and journal endpoint tests
    ├── test_settings_api.py # Settings endpoint tests
    └── __pycache__/
```

Quick status vs LOW-LEVEL-REQUIREMENTS
- Present / implemented:
  - Async engine, Base, models, and blueprints for auth, tasks, review, settings.
  - Tests demonstrating async SQLite usage.
- Missing / recommended changes:
  - WAL + PRAGMA foreign_keys enforcement on connect (recommended for reliability).
  - Alembic migrations (no migration history present; app may still call create_all()).
  - Export/import API endpoints are not present (required by the spec).
  - Committed local DB file should be removed from the repo and replaced with migrations + seed script.

Requirements
- Python 3.12+ (project uses modern async features).
- Recommended dev tools: pip, virtualenv, alembic.
- Runs on Windows (PowerShell snippets below).

Local setup (PowerShell)
1. Create and activate venv
   .\venv\Scripts\Activate.ps1

2. Install dependencies
   pip install -r backend/requirements.txt
   pip install alembic  # if using migrations

3. (Optional) Add dev tools
   pip install pytest ruff black isort

Enable recommended SQLite PRAGMAs (WAL, foreign_keys)
- Recommended change: add a PRAGMA listener in backend/db_async.py so dev and tests use WAL and foreign keys are enforced.
- Example (place in backend/db_async.py near engine creation):

```python
# filepath: c:\Users\acarr\Documents\GitHub\CSC289_GROUP2\backend\db_async.py
# ...existing code...
import sqlite3
from sqlalchemy import event
from sqlalchemy.engine import Engine

# ...existing code that creates `engine` ...

@event.listens_for(Engine, "connect")
def _set_sqlite_pragma(dbapi_connection, connection_record):
    # Only apply to SQLite DBAPI connections
    if isinstance(dbapi_connection, sqlite3.Connection):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL;")
        cursor.execute("PRAGMA foreign_keys=ON;")
        cursor.close()
# ...existing code...
```

Migrations (recommended)
1. Initialize Alembic (one-time)
   cd backend
   alembic init alembic

2. Configure alembic/env.py to import Base.metadata from backend.models:
   - Replace the target_metadata with your models' metadata (e.g., from backend.models import Base; target_metadata = Base.metadata).

3. Create and apply migrations
   alembic revision --autogenerate -m "Initial schema"
   alembic upgrade head

Seeding / init
- If you currently rely on a committed backend/taskline.db, replace that flow with:
  - Alembic migrations + a seed script (backend/init_db.py) which inserts required default rows (statuses, default settings).
- Recommended pattern: migration + seed script run during local setup or CI.

Run the app (development)
- Simple invocation (depends on app entry):
  python backend/app.py
- Or if app is configured as a Quart app object, use:
  quart run --app backend.app --reload

Run tests
- From repository root:
  pytest -q backend/tests

Remove committed local DB and caches
- Add these to .gitignore if not present:
  backend/*.db
  **/__pycache__/
  *.py[cod]

- Untrack already committed files (PowerShell):
  git add .gitignore
  git commit -m "Ignore local DB and python caches"
  git rm --cached backend/taskline.db
  git rm --cached -r **/__pycache__ 2>$null
  git rm --cached -r **/*.pyc 2>$null
  git commit -m "Remove tracked local DB and bytecode caches"

API notes
- The repository provides auth, tasks, review, and settings blueprints. Confirm exact endpoints by opening backend/blueprints/*/routes.py.
- Export/import endpoints described in the low-level requirements are not implemented; add them under backend/blueprints/export or extend settings blueprint.

Recommended next changes (small, prioritized)
- Enforce WAL and foreign_keys (db_async.py) — low friction, improves reliability.
- Add Alembic and create initial migrations; remove committed DB.
- Implement /api/export and /api/import endpoints.
- Add DB indexes for performance on queried columns (status, category, due_date).
- Add CI job to run migrations and tests on PRs.

If you want, I can:
- Create the WAL PRAGMA patch and a small seed script.
- Scaffold an Alembic env.py configured to use backend.models.Base.
- Draft export/import endpoints.

## API

Compact endpoint map (copy for quick reference):

- Auth (`/api/auth`)
  - POST /api/auth/setup — set initial PIN
  - POST /api/auth/login — login with PIN
  - POST /api/auth/logout — logout
  - PUT /api/auth/pin — change PIN
- Tasks (`/api/tasks`)
  - GET /api/tasks — list tasks (query: status, category, page)
  - GET /api/tasks/calendar — tasks by date
  - GET /api/tasks/kanban — grouped tasks for Kanban
  - POST /api/tasks — create task
  - GET /api/tasks/{id} — get task
  - PUT /api/tasks/{id} — update task (toggle complete, edit)
  - DELETE /api/tasks/{id} — delete task
  - GET /api/tasks/categories — list categories
- Review (`/api/review`)
  - GET /api/review/journal — list journal entries
  - POST /api/review/journal — create entry
  - PUT /api/review/journal/{id} — update entry
  - GET /api/review/summary/daily — daily summary
  - GET /api/review/summary/weekly — weekly summary
  - GET /api/review/insights — analytics/insights
- Settings (`/api/settings`)
  - GET /api/settings — get preferences
  - PUT /api/settings — bulk update preferences
  - PUT /api/settings/notes — update notes prefs
  - PUT /api/settings/timer — update timer prefs
  - PUT /api/settings/ai-url — update AI service URL
  - PUT /api/settings/auto-lock — update auto-lock
  - PUT /api/settings/theme — update theme
- Export / Import (recommended)
  - GET /api/export — export full data (JSON)
  - POST /api/import — import/merge JSON bundle

For exact parameter names, request/response shapes, and authentication details, check the individual blueprint route files in `backend/blueprints/*/routes.py`.

