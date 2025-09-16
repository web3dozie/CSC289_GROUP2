# Low Level Requirements for Task Management System

## Backend Requirements (Quart-Based)

### Core Framework & Setup

- Use Quart 0.18.x as the web framework (micro-framework for lightweight, modular design, aligning with project resources for college students).
- Implement a **modular monolith structure** with Blueprints for organization:
    - `auth` Blueprint: PIN authentication (set, verify, login, logout, change PIN) – supports secure, PIN-based login with error notifications (e.g., "Error, wrong PIN").
    - `tasks` Blueprint: Task CRUD, categories, reordering, highlighting, dates, estimates, completion – enables adding, editing, deleting tasks with validation and inline errors.
    - `review` Blueprint: Journal entries, completion notes, summaries/analytics.
    - `settings` Blueprint: Feature toggles (e.g., notes, timer, AI URL), themes, auto-lock.
    - `timer` Blueprint (optional): Focus session controls linked to tasks.
    - `agent` Blueprint (optional): AI tool actions with user confirmation.
- Use Quart-RESTful for REST API structure.
- Enable CORS for frontend communication (Quart-CORS).
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
- `GET /api/tasks/calendar`: Display calendar view.
- `GET /api/tasks/kanban`: Display kanban board (Implementation specifics needed).
- `POST /api/tasks`: Create new task.
- `GET /api/tasks/{id}`: Get specific task.
- `PUT /api/tasks/{id}`: Update task. (with Toggle completion status. Toggle highlight/priority. Update task category.)
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

- Use Flask's built-in `request` object for parsing JSON inputs and manual validation (e.g., check types, lengths, required fields) – ensures error notifications for empty input fields.
- Implement inline error handling (e.g., "Title is required", "Invalid date format") by raising `BadRequest` exceptions.
- Support export/import: `GET /api/export` (JSON bundle), `POST /api/import` (validate and merge).
- Autosave: Periodic saves via background threads or on changes.

---

### Performance & Reliability

- Handle **offline-first**: All operations work without internet – aligns with project assumptions of stable internet and local storage.
- Implement **undo**: Simple stack for recent changes (e.g., last 10 actions).
- Error responses: JSON with status codes (400 for validation, 401 for auth, 500 for server errors).
- **Single-user only**: No multi-user or synchronization features (out of scope).

---

### Dependencies

- Quart, Quart-RESTful, Quart-CORS
- Werkzeug for utilities.
- APScheduler for optional background tasks (e.g., auto-lock).

---

## Frontend Requirements (React-Based)

### Core Framework & Setup

- Use **React 19 with Vite** for build tooling – aligns with project resources and objectives for a user-friendly web application.
- **TypeScript** for type safety.
- **TanStack Router** for client-side routing (e.g., `/` for landing, `/login` for auth, future `/tasks` for app).
- **TanStack Query** for API state management and caching.
- Ensure compatibility with modern web browsers and minimal server resources.

---

### UI Components & Views

- Implement views as per OVERVIEW.md:
  - **List**: Keyboard-navigable list with search/filters – supports grouping tasks by importance and adjusting order for prioritization.
  - **Board**: Drag-and-drop lanes (Todo, In-Progress, Done) using `react-beautiful-dnd` or `@dnd-kit`.
  - **Calendar**: Agenda-style (Today, Tomorrow, This Week) with date picker.
  - **Review**: Charts (e.g., completions) using Chart.js or Recharts.
- Login page: Form with username/PIN validation, loading states – provides PIN-based secure login with error notifications.
- Tutorial: First-run guided tour (around 60 - 90 seconds) using `react-joyride`.
- Optional Coach Chat: Side panel with AI prompts (only if API URL provided).
- Minimalistic, intuitive web interface – aligns with project scope and objectives.

---

### State Management & API Integration

- Use TanStack Query for API calls (e.g., fetch tasks, handle mutations).
- Local state for UI (e.g., form inputs) with React hooks.
- Handle offline: Cache data locally, sync on reconnect.

---

### Styling & Accessibility

- **Tailwind CSS** for utility-first styling (reuse landing page palette).
- Ensure **WCAG 2.1 AA compliance**: Keyboard navigation, focus indicators, screen-reader support.
- Responsive design: Mobile-friendly with breakpoints.

---

### Features Implementation

- Task CRUD: Inline editing, validation, drag-to-reorder – enables adding, editing, deleting tasks within the first 6 weeks.
- Categorize tasks: Support for categories (e.g., personal, work) – enables categorization by week 8.
- Prioritization: Highlight important tasks and adjust order – supports prioritization by week 8.
- Search/Filters: Real-time with debouncing.
- Completion: Prompt for optional notes.
- Analytics: Compute on read (e.g., streaks, accuracy).
- Privacy: No external data unless AI enabled.

---

### Dependencies

- React, React DOM, Vite, TypeScript.
- TanStack Router, TanStack Query.
- Tailwind CSS, PostCSS.
- Optional: `react-beautiful-dnd` (drag), Chart.js (charts), `react-joyride` (tutorial).

---

## Database Requirements

### Database System

- Use **SQLite 3.x** as the local database (no external services) – aligns with project scope for local storage and constraints against cloud storage.
- Enable **WAL (Write-Ahead Logging)** mode for better concurrency and performance.

---

### Schema Design

The provided ERD is an excellent, detailed plan for the database schema.

- **Tables**:
  - `Users`: `user_id`, `username`, `email`, `user_pin`, `config_data`, `created_on`.
  - `Tasks`: `task_id`, `description`, `notes`, `category`, `status`, `closed_on`, `due_date`, `created_on`, `updated_on`, `created_by`.
  - `Statuses`: `status_id`, `description`, `created_on`, `created_by`.
  - `Categories`: `category_id`, `name`, `description`, `color_hex`, `created_on`, `created_by`.
  - `Tags`: `tag_id`, `name`, `description`, `color_hex`, `created_on`, `created_by`.
  - `TaskTags`: `task_id`, `tag_id`, `tagged_on`, `tagged_by`.
  - `TaskDependencies`: `parent_task_id`, `dependent_on_task_id`, `created_on`, `created_by`.
- Use **foreign keys** for relationships (e.g., `Tasks.category > Categories.category_id`).
- Indexes: On frequently queried fields (e.g., status, category, dates).

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

- Use **pytest** for unit and integration tests.
- Test coverage: ≥80% (aim for ≥12 tests as per OVERVIEW.md).
- Test types:
  - Unit: Individual functions (e.g., PIN validation, task CRUD).
  - Integration: API endpoints (e.g., login flow, task creation with validation).
  - Edge cases: Invalid inputs, auth failures, offline scenarios.
- Mock external dependencies (e.g., AI API if enabled).
- CI: Run on PRs to `dev`/`main` via GitHub Actions – aligns with CONTRIBUTING.md's branch model and CI requirements.

---

### Frontend Testing

- Use **Vitest + React Testing Library** for unit/component tests.

- Test coverage: ≥6 UI tests (as per OVERVIEW.md).

- Test types:
  
  - Unit: Components (e.g., form validation, drag-and-drop).
  - Integration: User flows (e.g., login to task list).
  - Accessibility: Screen-reader and keyboard navigation.
  * E2E Testing: Playwright

- Mock API calls with **MSW (Mock Service Worker)**.

- CI: Run on PRs to `dev`/`main`.

---

### General Testing Practices

- Pre-commit hooks: Run linters/formatters (Black, Ruff, Prettier, ESLint) before commits.
- Code style: Follow CONTRIBUTING.md (Black for backend, Prettier for frontend).
- Documentation: Update tests with changes; include in PR descriptions.
- End-to-End: Manual testing for full flows (e.g., add task → complete → review).
- Collaboration: Use Trello for task tracking and GitHub for version control/documentation – aligns with project resources and team collaboration via Microsoft Teams for daily stand-ups.