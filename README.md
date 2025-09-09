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

## Features (V1)
- Tasks: add, edit, delete with validation and inline errors
- Organize: categories, drag‑to‑reorder, star/highlight, start/end dates
- Views: List, Board, Agenda‑only Calendar, Review (history, notes, charts)
- Safety: autosave, undo, export/import JSON (local‑only)
- Privacy: strictly local unless you explicitly enable AI

## Architecture
- Frontend: React 19 + Vite + TypeScript + Tailwind + TanStack Router/Query
- Backend: Django + Django REST Framework (modular monolith)
- Database: SQLite (WAL) in the backend container
- Packaging: containers for frontend and backend, no external services

## Contributing
See `CONTRIBUTING.md` for:
- Branch model: `main` (stable), `dev` (team integration), personal named branches (e.g., `dozie`)
- PR flow: PRs → `dev` (squash merges), then `dev` → `main` for releases
- Reviews: 1 reviewer on `dev`, 2 on `main`; CI must pass
- Trello‑first workflow with GitHub links from cards (free tier friendly)
- Conventional Commits and code style

## License
Open source (license file to be confirmed with the team).

---
Questions? Start with `OVERVIEW.md` for the full product vision.
