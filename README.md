# Task Line

Lock in. Get it done. Stay zen.

Task Line is a classy, local‑first task companion. It runs entirely on your computer, stores data locally, and helps you finish what matters with clean views, smooth interactions, and optional conversational help.

- Fast and offline: local container, no cloud required
- Private by design: PIN lock (4–8 digits), configurable auto‑lock
- Productive flows: quick add, drag‑to‑reorder, highlights, filters/search
- Clear views: List, Board (Todo → In‑Progress → Done), Agenda calendar, Review
- Optional: completion notes, estimates/time, focus timer, local analytics
- Optional AI chat (“Zedd Mode”) only if you provide an AI API URL

## Quick Start

Docker Compose (one‑command) and full dev scripts are being added as we scaffold the backend/frontend. For now, see SDLC and Overview for scope and decisions.

- Overview: `OVERVIEW.md`
- SDLC workspace: `SDLC/`
- Historical docs: `old_docs/`

## Developer setup (quick)

- Activate the project venv (PowerShell):
```powershell
& .venv\Scripts\Activate.ps1
```

- Install dependencies:
```powershell
.venv\Scripts\python.exe -m pip install -r requirements.txt
```

- Run the test suite (example):
```powershell
.venv\Scripts\python.exe -m pytest -q -s
```

## Features (V1)
- Tasks: add, edit, delete with validation and inline errors
- Organize: categories, drag‑to‑reorder, star/highlight, start/end dates
- Views: List, Board, Agenda‑only Calendar, Review (history, notes, charts)
- Safety: autosave, undo, export/import JSON (local‑only)
- Privacy: strictly local unless you explicitly enable AI

## Architecture
 Frontend: React + Vite + TypeScript + Tailwind + TanStack Router/Query
 Backend: Quart (async) + SQLAlchemy (modular monolith using Blueprints)
 Database: SQLite for local development (WAL recommended)
 Packaging: intended to run in containers for local/dev usage; currently run via provided scripts

## Contributing
See `CONTRIBUTING.md` for:
- Branch model: `main` (stable), `dev` (team integration), personal named branches (e.g., `dozie`)
 There are dev scripts for frontend and backend in the repository root; see `run-dev.ps1` and `run-backend.ps1` for Windows PowerShell helpers. Full Docker/compose setup is planned but not required for local dev.
 - Overview: `OVERVIEW.md`
 - SDLC workspace: `SDLC/`
 - Historical docs: `old_docs/`
- Conventional Commits and code style

## License
MIT — see `LICENSE`.

---
Questions? Start with `OVERVIEW.md` for the full product vision.
