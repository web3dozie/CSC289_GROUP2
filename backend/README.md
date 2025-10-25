# Task Line — Backend

This document explains how the Task Line backend works, how to run it on your computer, and how it meets the project requirements.

## Summary
- Backend is a Quart-based async API using SQLAlchemy ORM with an SQLite development database.
- Structure: modular "monolith" using Blueprints for auth, tasks, review, settings, chat, sessions (see backend/blueprints).
- Key files:
  - `backend/db/engine_async.py` — async engine and session factory.
  - `backend/db/models.py` — SQLAlchemy ORM models.
  - `backend/app.py` — app factory / initialization and DB seed logic.
  - `backend/validation.py` — comprehensive input validation for tasks.
  - `backend/security_logging.py` — security monitoring and logging.
  - `backend/blueprints/*` — API endpoints by domain.
  - `backend/tests/*` — pytest tests for API and models.
  - `backend/taskline.db` — local SQLite DB (should not be committed; see below).

## Project Structure
```
backend/
├── app.py                    # Main Quart application factory
├── db/                       # Database module
│   ├── engine_async.py      # Async database engine and session setup
│   ├── models.py            # SQLAlchemy ORM models (User, Task, Status, etc.)
│   ├── init_db.py           # Database initialization
│   └── session.py           # Session management
├── validation.py            # Input validation for tasks
├── security_logging.py      # Security monitoring and logging
├── errors.py                # Custom error classes
├── config.py                # Configuration settings
├── cache_utils.py           # Caching utilities
├── requirements.txt         # Python dependencies
├── taskline.db             # Local SQLite database (should be gitignored)
├── debug_auth_post.py      # Debug script for auth testing
├── debug_init_db.py        # Debug script for database initialization
├── debug_task_flow.py      # Debug script for task workflows
├── README.md               # This file
├── __pycache__/            # Python bytecode cache (gitignored)
├── alembic/                # Database migrations
│   ├── versions/           # Migration scripts
│   └── env.py             # Alembic environment configuration
├── blueprints/             # Modular API blueprints
│   ├── __init__.py
│   ├── auth/               # Authentication endpoints
│   │   ├── __init__.py
│   │   ├── routes.py       # PIN setup, login, logout, PIN changes
│   │   └── __pycache__/
│   ├── tasks/              # Task management endpoints
│   │   ├── __init__.py
│   │   ├── routes.py       # CRUD operations, kanban, categories, archive
│   │   └── __pycache__/
│   ├── review/             # Review and analytics endpoints
│   │   ├── __init__.py
│   │   ├── routes.py       # Journal, summaries, insights
│   │   └── __pycache__/
│   ├── settings/           # User preferences endpoints
│   │   ├── __init__.py
│   │   ├── routes.py       # Feature toggles, themes, auto-lock, tutorial
│   │   └── __pycache__/
│   ├── chat/               # AI chat endpoints
│   │   ├── __init__.py
│   │   ├── routes.py       # Chat messages, history, clear
│   │   └── __pycache__/
│   └── sessions/           # Session management endpoints
│       ├── __init__.py
│       ├── routes.py       # Session listing, logout, cleanup
│       └── __pycache__/
├── services/               # Business logic services
│   └── context_builder.py # Context building for chat
└── tests/                  # Test suite
    ├── test_api.py         # General API and task CRUD tests
    ├── test_quart_api.py   # Basic Quart app smoke tests
    ├── test_review_api.py  # Review and journal endpoint tests
    ├── test_settings_api.py # Settings endpoint tests
    ├── test_task_validation.py # Task validation tests
    ├── test_error_handling.py # Error handling tests
    ├── test_db_models.py   # Database model tests
    └── __pycache__/
```

## Quick status vs LOW-LEVEL-REQUIREMENTS
- Present / implemented:
  - Async engine, Base, models, and blueprints for auth, tasks, review, settings, chat, sessions.
  - Tests demonstrating async SQLite usage.
  - ✅ WAL mode and foreign_keys PRAGMA enabled (see `backend/app.py:328-330`)
  - ✅ Export/import API endpoints implemented (see `backend/app.py:105-264`)
  - ✅ Archive functionality for tasks (archived column, archive endpoints)
  - ✅ Task ordering support for drag-and-drop
  - ✅ Priority and time estimation fields
  - ✅ Comprehensive input validation (see `backend/validation.py`)
  - ✅ Security monitoring and logging (see `backend/security_logging.py`)
- Recommended changes:
  - Alembic migrations (use `backend/alembic/`); ensure env.py targets `backend.db.models.Base.metadata`.
  - Committed local DB file should be removed from the repo and replaced with migrations + seed script.

## Requirements
- Python 3.12+ (project uses modern async features).
- Recommended dev tools: pip, virtualenv, alembic.
- Runs on Windows (PowerShell snippets below).

## Local setup (PowerShell)
1. Create and activate venv
```powershell
   .\venv\Scripts\Activate.ps1
```

2. Install dependencies
```powershell
   pip install -r requirements.txt
   pip install alembic  # if using migrations
```

3. (Optional) Add dev tools
```powershell
   pip install pytest ruff black isort
```

## SQLite PRAGMAs (WAL, foreign_keys)
- ✅ **Already implemented** in `backend/app.py:328-330`
- WAL mode enabled for better concurrency
- Foreign key constraints enforced

## Migrations (recommended)
1. Initialize Alembic (one-time)
```bash
   cd backend
   alembic init alembic
```

2. Configure `backend/alembic/env.py` to import Base.metadata from `backend.db.models`:
   - Example: `from backend.db.models import Base; target_metadata = Base.metadata`

3. Create and apply migrations
```bash
   alembic revision --autogenerate -m "Initial schema"
   alembic upgrade head
```

## Seeding / init
- Replace any committed `backend/taskline.db` flow with Alembic migrations + a seed script (`backend/db/init_db.py`) which inserts required default rows (statuses, default settings).

## Run the app (development)
- Simple invocation (depends on app entry):
```bash
  python backend/app.py
```
- Or if app is configured as a Quart app object, use:
```bash
  quart run --app backend.app --reload
```

## Run tests
- From repository root:
```bash
  pytest -q backend/tests
```

## Remove committed local DB and caches
- Add these to .gitignore if not present:
```
  backend/*.db
  **/__pycache__/
  *.py[cod]
```

- Untrack already committed files (PowerShell):
```powershell
  git add .gitignore
  git commit -m "Ignore local DB and python caches"
  git rm --cached backend/taskline.db
  git rm --cached -r **/__pycache__ 2>$null
  git rm --cached -r **/*.pyc 2>$null
  git commit -m "Remove tracked local DB and bytecode caches"
```

## API notes
- The repository provides auth, tasks, review, settings, chat, and sessions blueprints. Confirm exact endpoints by opening `backend/blueprints/*/routes.py`.
- Export/import endpoints are implemented in `backend/app.py` (lines 105-264).

## Recommended next changes (small, prioritized)
- Complete Alembic setup and create initial migrations; remove committed DB.
- Add DB indexes for performance on queried columns (status, category, due_date, archived, order).
- Add CI job to run migrations and tests on PRs.
- Consider adding composite indexes for common query patterns (created_by + archived, created_by + done).

## API

Compact endpoint map (copy for quick reference):

- **Auth** (`/api/auth`)
  - POST /api/auth/setup — set initial PIN
  - POST /api/auth/login — login with PIN
  - POST /api/auth/logout — logout
  - PUT /api/auth/pin — change PIN
  
- **Tasks** (`/api/tasks`)
  - GET /api/tasks — list tasks (query: status, category, page)
  - GET /api/tasks/calendar — tasks by date
  - GET /api/tasks/kanban — grouped tasks for Kanban
  - POST /api/tasks — create task (supports priority, estimate_minutes)
  - GET /api/tasks/{id} — get task
  - PUT /api/tasks/{id} — update task (supports done, archived, priority, estimate_minutes, order)
  - DELETE /api/tasks/{id} — delete task
  - GET /api/tasks/categories — list categories
  - POST /api/tasks/archive-completed — archive all completed tasks
  - GET /api/tasks/archived — get archived tasks
  
- **Review** (`/api/review`)
  - GET /api/review/journal — list journal entries
  - POST /api/review/journal — create entry
  - PUT /api/review/journal/{id} — update entry
  - DELETE /api/review/journal/{id} — delete entry
  - GET /api/review/summary/daily — daily summary (excludes archived tasks)
  - GET /api/review/summary/weekly — weekly summary (excludes archived tasks)
  - GET /api/review/insights — analytics/insights (excludes archived tasks)
  - **Note:** All analytics endpoints exclude archived tasks from calculations
  
- **Settings** (`/api/settings`)
  - GET /api/settings — get preferences
  - PUT /api/settings — bulk update preferences
  - PUT /api/settings/notes — update notes prefs
  - PUT /api/settings/timer — update timer prefs
  - PUT /api/settings/ai-url — update AI service URL
  - PUT /api/settings/auto-lock — update auto-lock
  - PUT /api/settings/theme — update theme
  
- **Chat** (`/api/chat`)
  - POST /api/chat/message — send message to AI assistant
  - GET /api/chat/history — get chat history
  - POST /api/chat/clear — clear chat history
  
- **Sessions** (`/api/sessions`)
  - GET /api/sessions/current — get current active sessions
  - POST /api/sessions/{id}/logout — logout specific session
  - POST /api/sessions/logout-all-others — logout all other sessions
  - POST /api/sessions/cleanup-expired — cleanup expired sessions
  
- **Export / Import** ✅
  - GET /api/export — export full data (JSON) - tasks, journal, settings
  - POST /api/import — import/merge JSON bundle with duplicate detection

For exact parameter names, request/response shapes, and authentication details, check the individual blueprint route files in `backend/blueprints/*/routes.py`.
