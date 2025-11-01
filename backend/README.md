# Task Line — Backend

This document explains how the Task Line backend works, how to run it on your computer, and how it meets the project requirements.

---

## Summary

* Backend is a **Quart-based async API** using **SQLAlchemy ORM** with an **SQLite development database**.
* Structure: modular "monolith" using **Blueprints** for `auth`, `tasks`, `review`, `settings`, `chat`, and `sessions`.
* Key files:

  * `backend/db/engine_async.py` — async engine and session factory.
  * `backend/db/models.py` — SQLAlchemy ORM models.
  * `backend/app.py` — Quart application factory.
  * `backend/validation.py` — input validation for tasks.
  * `backend/security_logging.py` — security monitoring and logging.
  * `backend/blueprints/*` — modular API endpoints.
  * `backend/tests/*` — pytest tests for API and models.
  * `backend/alembic/` — Alembic migrations directory (used for schema management).

---

## Project Structure

```
backend/
├── app.py                    # Main Quart application factory (entry point)
│
├── db/                       # Database layer: engine, models, session, and health checks
│   ├── engine_async.py       # Async SQLAlchemy engine and session factory
│   ├── models.py             # ORM models (User, Task, Status, JournalEntry, etc.)
│   ├── health_check.py       # Database health check utilities for app startup/tests
│   └── session.py            # Session creation and teardown helpers
│
├── validation.py             # Centralized validation logic for user input and payloads
├── security_logging.py       # Security and audit event logging
├── errors.py                 # Custom exception and error-handling classes
├── config.py                 # Environment configuration and app settings
├── cache_utils.py            # Simple caching helpers (in-memory or file-based)
│
├── alembic.ini               # Alembic configuration file (migration settings)
├── alembic/                  # Database migrations (schema version control)
│   ├── versions/             # Auto-generated migration scripts
│   └── env.py                # Alembic environment configuration (targets Base.metadata)
│
├── blueprints/               # Modular API blueprints by feature area
│   ├── auth/                 # Authentication: setup, login, logout, PIN change
│   ├── tasks/                # Task CRUD, archive, ordering, and Kanban endpoints
│   ├── review/               # Journal entries, summaries, and productivity insights
│   ├── settings/             # User preferences (theme, auto-lock, timers, etc.)
│   ├── chat/                 # Chat-based AI assistant endpoints
│   └── sessions/             # Active session management and cleanup
│
├── services/                 # Business logic and shared services layer
│   └── context_builder.py    # Constructs contextual data for chat or analytics
│
└── tests/                    # Automated async pytest suite
    ├── conftest.py           # Shared fixtures (app, client, temp DB migrations)
    ├── db/                   # Database-specific test cases
    │   └── test_db_models.py # Model validation and relationship tests
    ├── test_api.py           # Core CRUD API workflow tests
    ├── test_quart_api.py     # Smoke tests for Quart app and health endpoints
    ├── test_review_api.py    # Journal, summary, and insights API tests
    ├── test_settings_api.py  # User settings endpoint tests
    ├── test_task_validation.py # Unit tests for task validation rules
    ├── test_error_handling.py  # API error-handling and response consistency tests
    └── __pycache__/          # Python bytecode cache (ignored)
```

---

## Requirements

* **Python 3.12+**
* **Quart**, **SQLAlchemy 2.0**, and **Alembic** installed via `requirements.txt`
* Recommended dev tools: `pytest`, `ruff`, `black`, `isort`
* Compatible with **Windows PowerShell**, macOS, or Linux.

---

## Local Setup (PowerShell)

1. **Create and activate a virtual environment**

   ```powershell
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```

2. **Install dependencies**

   ```powershell
   pip install -r requirements.txt
   ```

3. **(Optional) Install developer tools**

   ```powershell
   pip install pytest ruff black isort
   ```

---

## Database Management with Alembic

Task Line uses **Alembic** for database migrations.
This replaces any previous manual or inline initialization.

### Running migrations (apply to the current schema)

From the repository root or backend folder:

```bash
cd backend
alembic upgrade head
```

### Creating new migrations (after modifying models)

```bash
cd backend
alembic revision --autogenerate -m "Add new field to Task"
alembic upgrade head
```

Alembic automatically detects changes to `backend/db/models.py` and updates the schema accordingly.

### Configuration summary

* `alembic.ini` contains:

  ```
  [alembic]
  script_location = backend/alembic
  sqlalchemy.url = %(DATABASE_URL)s
  ```
* `backend/alembic/env.py` imports your metadata:

  ```python
  from backend.db.models import Base
  target_metadata = Base.metadata
  ```

---

## Running the Application (Development)

Run the backend directly using Python:
``` 
python backend/app.py
```
* This command starts the Quart development server using the app factory defined in create_app().

* Hot reload and debug logging are enabled automatically in development mode.

* The application reads environment variables (such as DATABASE_URL) from a .env file in project root.

Example .env file:
```
# Secret key used for session signing (set to any random string in local dev)
SECRET_KEY=dev-secret-key

# Async SQLite database connection (update path as needed)
DATABASE_URL=sqlite+aiosqlite:///db/taskline.db
```
---

## SQLite PRAGMAs

* **Enabled automatically** in the async engine setup:

  * `PRAGMA journal_mode=WAL`
  * `PRAGMA foreign_keys=ON`
* These settings improve concurrency and enforce referential integrity.

---

## Running Tests

Task Line uses **pytest** with **async fixtures** that handle database migrations and app creation.

### Run all tests

From the **repository root**:

```bash
pytest -q backend/tests
```

### Run a specific test file

```bash
pytest backend/tests/test_api.py
```

### Run a single test

```bash
pytest backend/tests/test_review_api.py::test_review_journal_and_summaries
```

### Test behavior

* Each test session creates a **temporary database file**.
* Alembic migrations automatically run before the app starts.
* No persistent DB files (`taskline.db`, `.wal`, `.shm`) remain after test runs.

If you encounter unexpected persistence, confirm that:

* No test manually calls `initialize_database()`.
* All tests rely on `conftest.py` fixtures for `app` and `client`.

---

## API Overview

### **Auth** (`/api/auth`)

* `POST /api/auth/setup` — create new user (PIN setup)
* `POST /api/auth/login` — login
* `POST /api/auth/logout` — logout
* `PUT /api/auth/pin` — change PIN

### **Tasks** (`/api/tasks`)

* `GET /api/tasks` — list all tasks
* `POST /api/tasks` — create task
* `PUT /api/tasks/{id}` — update task
* `DELETE /api/tasks/{id}` — delete task
* `GET /api/tasks/archived` — view archived tasks
* `POST /api/tasks/archive-completed` — bulk archive completed

### **Review** (`/api/review`)

* `POST /api/review/journal` — create journal entry
* `GET /api/review/journal` — list entries
* `PUT /api/review/journal/{id}` — update entry
* `DELETE /api/review/journal/{id}` — delete entry
* `GET /api/review/summary/daily` — daily summary
* `GET /api/review/summary/weekly` — weekly summary
* `GET /api/review/insights` — productivity analytics

### **Settings** (`/api/settings`)

* `GET /api/settings` — get user preferences
* `PUT /api/settings` — update preferences
* `PUT /api/settings/theme` — change theme
* `PUT /api/settings/auto-lock` — toggle auto-lock

### **Chat** (`/api/chat`)

* `POST /api/chat/message` — send message
* `GET /api/chat/history` — get chat history
* `POST /api/chat/clear` — clear chat history

### **Sessions** (`/api/sessions`)

* `GET /api/sessions/current` — active sessions
* `POST /api/sessions/{id}/logout` — logout by ID
* `POST /api/sessions/logout-all-others` — logout all others
* `POST /api/sessions/cleanup-expired` — cleanup old sessions

### **Export / Import**

* `GET /api/export` — export all user data (JSON)
* `POST /api/import` — import or merge JSON bundle

---

## Implementation Summary

* Async engine, Base, models, and blueprints implemented.
* Database schema managed via Alembic migrations.
* PRAGMA settings enabled for WAL and foreign key enforcement.
* Comprehensive async pytest coverage with isolated test DBs.
* Security and input validation integrated.

---

