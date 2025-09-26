# Low Level Requirements for Task Management System

## Backend Requirements (Quart-Based)

### Core Framework & Setup

- Use Quart 0.18.4 as the web framework (micro-framework for lightweight, modular design, aligning with project resources for college students).
- Implement a **modular monolith structure** with Blueprints for organization:
    - `auth` Blueprint: PIN authentication (set, verify, login, logout, change PIN) – supports secure, PIN-based login with error notifications (e.g., "Error, wrong PIN").
    - `tasks` Blueprint: Task CRUD, categories, reordering, highlighting, dates, estimates, completion – enables adding, editing, deleting tasks with validation and inline errors.
    - `review` Blueprint: Journal entries, completion notes, summaries/analytics.
    - `settings` Blueprint: Feature toggles (e.g., notes, timer, AI URL), themes, auto-lock.
- Use Quart-RESTful for REST API structure.
- Enable CORS for frontend communication (Quart-CORS 0.7.0).
- Configure for local container deployment (Docker), ensuring minimal server resources and compatibility with modern web browsers.

---

### Authentication & Security

- Implement **PIN-based auth** (4-8 digits) with HTTP-only cookies for sessions – aligns with project scope for secure login and user experience.
- Add configurable **auto-lock** (default 10 minutes idle).
- Validate PIN strength and handle errors (e.g., "PIN must be 4-8 digits").
- Secure endpoints: Require authentication for all non-public routes.

---

### API Endpoint Map

Your new map provides a clear, high-level overview of the API.

#### **Core Authentication - `/api/auth/`**

- `POST /api/auth/setup`: Initial PIN setup (first-time).
- `POST /api/auth/login`: Authenticate with PIN.
- `POST /api/auth/logout`: End session.
- `PUT /api/auth/pin`: Change existing PIN.

#### **Task Management - `/api/tasks/`**

- `GET /api/tasks`: List all tasks (with filtering/pagination).
- `GET /api/tasks/kanban`: Display kanban board grouped by status.
- `POST /api/tasks`: Create new task.
- `GET /api/tasks/{id}`: Get specific task.
- `PUT /api/tasks/{id}`: Update task (toggle completion, priority, category, status).
- `DELETE /api/tasks/{id}`: Delete task.
- `GET /api/tasks/categories`: Get available categories.

#### **Review & Analytics - `/api/review/`**

- `GET /api/review/journal`: Get journal entries.
- `POST /api/review/journal`: Create journal entry.
- `PUT /api/review/journal/{id}`: Update journal entry.
- `GET /api/review/summary/daily`: Daily productivity summary.
- `GET /api/review/summary/weekly`: Weekly productivity summary.
- `GET /api/review/insights`: Get productivity insights/trends.

#### **User Settings - `/api/settings/`**

- `GET /api/settings`: Get all user preferences.
- `PUT /api/settings`: Update preferences (bulk).
- `PUT /api/settings/notes`: Update notes preferences.
- `PUT /api/settings/timer`: Update timer preferences.
- `PUT /api/settings/ai-url`: Update AI service URL.
- `PUT /api/settings/auto-lock`: Update auto-lock settings.
- `PUT /api/settings/theme`: Update UI theme preferences.

---

### Data Handling & Validation

- Use Quart's built-in `request` object for parsing JSON inputs and manual validation (e.g., check types, lengths, required fields) – ensures error notifications for empty input fields.
- Implement inline error handling (e.g., "Title is required", "Invalid date format") by returning JSON error responses.
- **Export/Import (Not Implemented)**: Planned support for `GET /api/export` (JSON bundle), `POST /api/import` (validate and merge).
- **Autosave (Not Implemented)**: Planned periodic saves via background threads or on changes.

---

### Performance & Reliability

- **Offline-first (Not Fully Implemented)**: Basic local storage via SQLite, but full offline sync not implemented.
- **Undo (Not Implemented)**: Planned simple stack for recent changes (e.g., last 10 actions).
- Error responses: JSON with status codes (400 for validation, 401 for auth, 500 for server errors).
- **Single-user only**: No multi-user or synchronization features (out of scope).

---

### Dependencies

- Quart 0.18.4, Quart-CORS 0.7.0
- SQLAlchemy 2.0.43 with aiosqlite 0.20.0 for async database operations
- Werkzeug 2.3.7 for utilities
- APScheduler 3.10.4 for optional background tasks (e.g., auto-lock)
- pytest 8.4.2 for testing

---

## Frontend Requirements (React-Based)

### Core Framework & Setup

- Use **React 18 with Vite** for build tooling – aligns with project resources and objectives for a user-friendly web application.
- **TypeScript** for type safety.
- **TanStack Router** for client-side routing (e.g., `/` for landing, `/login` for auth, future `/tasks` for app).
- **TanStack Query** for API state management and caching.
- Ensure compatibility with modern web browsers and minimal server resources.

---

### UI Components & Views

- **Landing Page**: Complete landing page with hero, tutorial, privacy, FAQ, CTA sections using React components.
- Login/SignUp pages: Forms with PIN validation and error handling.
- **Main App Interface (Not Yet Implemented)**: Planned views include:
  - **List**: Keyboard-navigable list with search/filters – supports grouping tasks by importance and adjusting order for prioritization.
  - **Board**: Drag-and-drop lanes (Todo, In-Progress, Done) using `react-beautiful-dnd` or `@dnd-kit`.
  - **Calendar**: Agenda-style (Today, Tomorrow, This Week) with date picker.
  - **Review**: Charts (e.g., completions) using Chart.js or Recharts.
- Tutorial: First-run guided tour (around 60 - 90 seconds) using `react-joyride`.
- Optional Coach Chat: Side panel with AI prompts (only if API URL provided).
- Minimalistic, intuitive web interface – aligns with project scope and objectives.

---

### State Management & API Integration

- **TanStack Query (Not Yet Connected)**: Planned for API calls (e.g., fetch tasks, handle mutations) once main app interface is built.
- Local state for UI (e.g., form inputs) with React hooks.
- **Offline Handling (Not Implemented)**: Planned cache data locally, sync on reconnect.

---

### Styling & Accessibility

- **Tailwind CSS** for utility-first styling (reuse landing page palette).
- Ensure **WCAG 2.1 AA compliance**: Keyboard navigation, focus indicators, screen-reader support.
- Responsive design: Mobile-friendly with breakpoints.

---

### Features Implementation

- **Landing Page**: Complete with all sections (hero, tutorial, privacy, FAQ, CTA).
- **Authentication**: PIN-based login/signup with validation.
- **Backend API**: Full task CRUD, categories, priority, due dates, completion tracking.
- **Settings Management**: User preferences for notes, timer, AI URL, auto-lock, theme.
- **Review/Analytics**: Journal entries, daily/weekly summaries, productivity insights.
- **Task Management (Backend Only)**: Task CRUD, categories, prioritization, due dates, estimates, completion – enables adding, editing, deleting tasks within the first 6 weeks.
- **Frontend App Interface (Not Yet Implemented)**: Main task management views (List, Board, Calendar, Review) to be built.

---

### Dependencies

- React 18.2.0, React DOM 18.2.0, Vite 7.1.5, TypeScript 5.2.2
- TanStack Router 1.20.0, TanStack Query 5.17.0
- Tailwind CSS 3.4.1, PostCSS 8.4.35, Autoprefixer 10.4.17
- Lucide React 0.344.0 for icons
- React Joyride 2.8.2 for tutorial
- React Markdown 10.1.0 for content rendering

---

## Database Requirements

### Database System

- Use **SQLite 3.x** as the local database (no external services) – aligns with project scope for local storage and constraints against cloud storage.
- Enable **WAL (Write-Ahead Logging)** mode for better concurrency and performance.

---

### Schema Design

The implemented database schema focuses on core functionality with the following tables:

- **Users**: `id`, `username`, `email`, `pin_hash`, `config_data`, `created_at`.
- **Statuses**: `id`, `description`, `created_at` (for kanban board: Todo, In Progress, Done).
- **Tasks**: `id`, `title`, `description`, `notes`, `done`, `category`, `priority`, `due_date`, `estimate_minutes`, `order`, `status_id`, `created_at`, `updated_on`, `closed_on`, `created_by`.
- **JournalEntries**: `id`, `user_id`, `entry_date`, `content`, `created_at`, `updated_on`.
- **UserSettings**: `id`, `user_id`, `notes_enabled`, `timer_enabled`, `ai_url`, `auto_lock_minutes`, `theme`, `updated_on`.
- Use **foreign keys** for relationships (e.g., `Tasks.status_id > Statuses.id`, `Tasks.created_by > Users.id`).
- Indexes on frequently queried fields (status, created_by, dates).

---

### Data Integrity & Operations

- **ACID compliance** via SQLite transactions.
- Backup: Export to JSON for user backups.
- Migration: Use Alembic or Flask-Migrate for schema changes.
- Performance: Optimize queries (e.g., pagination for large task lists).
- Single-user only: No multi-user support (out of scope).

---

### Integration

- Connect via **SQLAlchemy** (Flask-SQLAlchemy) for ORM.
- Handle concurrency: WAL mode supports multiple readers.

---

## Testing Requirements

### Backend Testing

- Use **pytest 8.4.2** for unit and integration tests.
- Test coverage: Basic API endpoints tested (health check, task CRUD, auth flows).
- Test types:
  - Unit: Individual route functions and utilities.
  - Integration: API endpoints (e.g., login flow, task creation with validation).
  - Edge cases: Invalid inputs, auth failures.
- Mock external dependencies (e.g., AI API if enabled).
- CI: Run on PRs to `dev`/`main` via GitHub Actions – aligns with CONTRIBUTING.md's branch model and CI requirements.

---

### Frontend Testing

- Use **Vitest 3.2.4 + React Testing Library 14.2.1** for unit/component tests.
- Test coverage: Basic component tests for landing page components (Header, Hero, Login).
- Test types:
  - Unit: Components (e.g., form validation, PIN input restrictions).
  - Integration: User flows (e.g., login form validation).
  - Accessibility: Screen-reader and keyboard navigation (planned).
- Mock API calls with **MSW (Mock Service Worker) 2.2.3**.
- CI: Run on PRs to `dev`/`main`.---

### General Testing Practices

- Pre-commit hooks: Run linters/formatters (Black, Ruff, Prettier, ESLint) before commits.
- Code style: Follow CONTRIBUTING.md (Black for backend, Prettier for frontend).
- Documentation: Update tests with changes; include in PR descriptions.
- End-to-End: Manual testing for full flows (e.g., add task → complete → review).
- Collaboration: Use Trello for task tracking and GitHub for version control/documentation – aligns with project resources and team collaboration via Microsoft Teams for daily stand-ups.