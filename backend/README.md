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
```markdown
# Task Line — Backend

This document describes the backend for Task Line, how to run it locally, and how it maps to the project's low-level requirements.

Summary
- Backend is a Quart-based async API using SQLAlchemy ORM with an SQLite development database.
- Structure: modular "monolith" using Blueprints for auth, tasks, review, settings (see backend/blueprints).
- Key files:
  - `backend/db/models.py` — SQLAlchemy ORM models.
  - `backend/db/engine_async.py` — async engine / session factory used by the app.
  - `backend/app.py` — app factory / initialization and DB seed logic.
  - `backend/blueprints/*` — API endpoints by domain.
  - `backend/tests/*` — pytest tests for API and models.

Quick status vs LOW-LEVEL-REQUIREMENTS
- Present / implemented:
  - Async engine, Base, models, and blueprints for auth, tasks, review, settings.
  - Tests demonstrating async SQLite usage.
- Missing / recommended changes:
  - WAL + PRAGMA foreign_keys enforcement on connect (recommended for reliability).
  - Alembic migrations (use `backend/alembic/`); ensure env.py targets `backend.db.models.Base.metadata`.
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
   pip install -r requirements.txt
   pip install alembic  # if using migrations

3. (Optional) Add dev tools
   pip install pytest ruff black isort

Enable recommended SQLite PRAGMAs (WAL, foreign_keys)
- Recommended change: add a PRAGMA listener in `backend/db/engine_async.py` so dev and tests use WAL and foreign keys are enforced.
- Example (place near engine creation):

```python
import sqlite3
from sqlalchemy import event
from sqlalchemy.engine import Engine

@event.listens_for(Engine, "connect")
def _set_sqlite_pragma(dbapi_connection, connection_record):
    # Only apply to SQLite DBAPI connections
    if isinstance(dbapi_connection, sqlite3.Connection):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL;")
        cursor.execute("PRAGMA foreign_keys=ON;")
        cursor.close()
```

Migrations (recommended)
1. Initialize Alembic (one-time)
   cd backend
   alembic init alembic

2. Configure `backend/alembic/env.py` to import Base.metadata from `backend.db.models`:
   - Example: `from backend.db.models import Base; target_metadata = Base.metadata`

3. Create and apply migrations
   alembic revision --autogenerate -m "Initial schema"
   alembic upgrade head

Seeding / init
- Replace any committed `backend/taskline.db` flow with Alembic migrations + a seed script (`backend/db/init_db.py`) which inserts required default rows (statuses, default settings).

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
- The repository provides auth, tasks, review, and settings blueprints. Confirm exact endpoints by opening `backend/blueprints/*/routes.py`.
- Export/import endpoints described in the low-level requirements are not implemented; add them under `backend/blueprints/export` or extend the settings blueprint.

Recommended next changes (small, prioritized)
- Enforce WAL and foreign_keys (db_async.py) — low friction, improves reliability.
- Add Alembic and create initial migrations; remove committed DB.
- Implement /api/export and /api/import endpoints.
- Add DB indexes for performance on queried columns (status, category, due_date).
- Add CI job to run migrations and tests on PRs.

If you want, I can:
- Create the WAL PRAGMA patch and a small seed script.
- Scaffold an Alembic env.py configured to use `backend.db.models.Base`.
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

