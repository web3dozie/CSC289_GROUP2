# Task Line

**Lock in. Get it done. Stay zen.**

A classy, local-first task companion that runs entirely on your computer, stores data locally, and helps you finish what matters with clean views, smooth interactions, and optional conversational help.

[![Python Version](https://img.shields.io/badge/python-3.12+-blue.svg)](https://python.org/downloads/)
[![React Version](https://img.shields.io/badge/react-18.2+-61dafb.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5.2+-3178c6.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

### Core Functionality
- **Fast and offline**: Local container, no cloud required
- **Private by design**: PIN lock (4–8 digits), configurable auto-lock
- **Productive flows**: Quick add, drag-to-reorder, highlights, filters/search
- **Clear views**: List, Board (Todo → In-Progress → Done), Agenda calendar, Review
- **Optional**: Completion notes, estimates/time, focus timer, local analytics
- **Optional AI chat** ("Zedd Mode") only if you provide an AI API URL

### Task Management
- Create, edit, delete tasks with validation and inline errors
- Organize with categories, drag-to-reorder, star/highlight
- Start/end dates, due dates, and time estimates
- Tags system for flexible organization
- Archive completed tasks automatically or manually
- Data export/import in JSON format

### Multiple Views
- **Dashboard**: Overview with statistics and quick actions
- **List View**: Comprehensive task list with filtering
- **Kanban Board**: Visual task management by status
- **Calendar View**: Tasks organized by due dates
- **Review**: Productivity analytics and insights
- **Pomodoro Timer**: Focus sessions with time tracking

### Privacy & Security
- PIN-based authentication (4-8 digits)
- Configurable auto-lock timeout
- Local SQLite database storage
- No data collection or tracking
- Secure session management with database tracking
- Rate limiting and security logging

## Architecture

### Technology Stack

**Backend:**
- **Framework**: Quart (async Python web framework)
- **Database**: SQLite with SQLAlchemy ORM
- **Authentication**: PIN-based with bcrypt hashing
- **Architecture**: Modular monolith using Blueprints
- **Database Management**: Alembic migrations
- **Testing**: Pytest with async fixtures

**Frontend:**
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query + React Context
- **Routing**: TanStack React Router
- **UI Components**: Lucide React icons, custom components
- **Testing**: Vitest + Testing Library

### Project Structure

```
taskline/
├── backend/                    # Python/Quart API
│   ├── app.py                 # Application factory
│   ├── config.py              # Configuration management
│   ├── db/                    # Database layer
│   │   ├── models.py          # SQLAlchemy models
│   │   ├── engine_async.py    # Async database engine
│   │   └── health_check.py    # Health check utilities
│   ├── blueprints/            # API endpoints
│   │   ├── auth/              # Authentication routes
│   │   ├── tasks/             # Task management routes
│   │   ├── review/            # Analytics & journal routes
│   │   ├── settings/          # User preferences routes
│   │   ├── chat/              # AI chat routes
│   │   └── sessions/          # Session management routes
│   ├── services/              # Business logic
│   ├── security/              # Security & auth decorators
│   ├── alembic/               # Database migrations
│   └── tests/                 # Backend tests
├── frontend/                  # React/TypeScript UI
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── views/         # Main view components
│   │   │   ├── tasks/         # Task-related components
│   │   │   ├── landing/       # Authentication pages
│   │   │   └── timer/         # Pomodoro timer components
│   │   ├── contexts/          # React contexts
│   │   ├── hooks/             # Custom hooks
│   │   ├── lib/               # Utilities and API
│   │   └── routes/            # Routing configuration
│   ├── __tests__/             # Frontend tests
│   └── package.json           # Dependencies
├── deployment/                # Docker deployment
├── testcase/                  # E2E and integration tests
└── docs/                      # Additional documentation
```

## Quick Start

### Prerequisites

- **Python 3.12+**
- **Node.js 20+** (pnpm recommended)
- **Docker Desktop** (for containerized deployment)

### Development Setup

#### 1. Clone and Setup Environment

```bash
git clone <repository-url>
cd taskline

# Create Python virtual environment
python -m venv .venv

# Activate virtual environment
# Windows PowerShell:
.venv\Scripts\Activate.ps1

# macOS/Linux:
source .venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Install Node.js dependencies
cd frontend
pnpm install  # or npm install
```

#### 2. Environment Configuration

Create a `.env` file in the project root:

```env
# Secret key for session management
SECRET_KEY=your-secret-key-change-in-production

# Database configuration
DATABASE_URL=sqlite+aiosqlite:///db/taskline.db
```

#### 3. Initialize Database

```bash
# From the backend directory
cd backend
alembic upgrade head
```

#### 4. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
python app.py
# Server starts on http://localhost:5001
```

**Terminal 2 - Frontend:**
```bash
cd frontend
pnpm dev  # or npm run dev
# App starts on http://localhost:5173
```

#### 5. Access the Application

Open your browser to `http://localhost:5173` and:
1. Create an account with username and PIN
2. Start managing your tasks!

## Docker Deployment

For production or containerized development:

```bash
# Using docker-compose (recommended)
docker-compose -f deployment/docker-compose.yml up -d

# Or build and run separately
docker build -f backend/Dockerfile -t taskline-backend .
docker build -f deployment/frontend/Dockerfile -t taskline-frontend .
```

The application will be available at:
- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:5001

## Testing

### Backend Tests

```bash
# Run all backend tests
pytest

# Run specific test files
pytest backend/tests/test_api.py

# Run with coverage
pytest --cov=backend
```

### Frontend Tests

```bash
cd frontend

# Run tests
pnpm test  # or npm run test

# Run tests in watch mode
pnpm test:watch

# Run tests with UI
pnpm test:ui
```

### End-to-End Tests

```bash
# Ensure the application is running
cd testcase/e2e

# Run E2E tests with specific tags
robot --include login E2E.robot
robot --include create-task E2E.robot
robot --include data-seg E2E.robot
```

## API Documentation

### Authentication Endpoints (`/api/auth`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/setup` | Create new user account |
| POST | `/login` | Authenticate with username and PIN |
| POST | `/logout` | End current session |
| PUT | `/pin` | Change PIN |

### Task Management (`/api/tasks`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List all tasks (with pagination) |
| POST | `/` | Create new task |
| GET | `/{id}` | Get specific task |
| PUT | `/{id}` | Update task |
| DELETE | `/{id}` | Delete task |
| GET | `/kanban` | Get Kanban board data |
| GET | `/calendar` | Get calendar view tasks |
| GET | `/archived` | Get archived tasks |
| POST | `/archive-completed` | Bulk archive completed tasks |

### Review & Analytics (`/api/review`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/journal` | Create journal entry |
| GET | `/journal` | List journal entries |
| GET | `/summary/daily` | Daily productivity summary |
| GET | `/summary/weekly` | Weekly productivity summary |
| GET | `/insights` | Productivity analytics |

### Settings (`/api/settings`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get user settings |
| PUT | `/` | Update user settings |
| PUT | `/theme` | Change theme |
| PUT | `/auto-lock` | Configure auto-lock |

### AI Chat (`/api/chat`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/message` | Send message to AI assistant |
| GET | `/history` | Get chat history |
| POST | `/clear` | Clear chat history |

### Data Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/export` | Export all user data as JSON |
| POST | `/import` | Import data from JSON |

## Configuration

### Backend Configuration

Key configuration options in `backend/config.py`:

```python
# Environment variables
SECRET_KEY=os.getenv("SECRET_KEY", "dev-key-change-in-production")
DATABASE_URL=get_database_url()  # SQLite default

# Session configuration
SESSION_COOKIE_HTTPONLY=True
SESSION_COOKIE_SECURE=False  # Set True in production with HTTPS
PERMANENT_SESSION_LIFETIME=86400  # 24 hours
```

### Frontend Configuration

Key configuration in `frontend/vite.config.ts`:

```typescript
// API proxy configuration
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:5001',
      changeOrigin: true,
      secure: false,
    }
  }
}
```

### AI Chat Configuration

To enable AI chat functionality:

1. Go to Settings in the application
2. Configure your AI provider:
   - **AI API URL**: OpenAI-compatible endpoint
   - **AI Model**: Model name (e.g., "gpt-3.5-turbo")
   - **AI API Key**: Your API key

Supported providers: OpenAI, Anthropic (Claude), local models via OpenAI-compatible APIs.

## Security Features

### Authentication & Session Management
- **PIN-based authentication** with bcrypt hashing
- **Secure session tracking** with database-backed sessions
- **Rate limiting** to prevent brute force attacks
- **Session timeout** and auto-lock functionality
- **Session fixation protection**
- **IP address and user agent tracking** for security monitoring

### Data Protection
- **Local storage only** - no data leaves your computer
- **Input validation** on all endpoints
- **SQL injection protection** via SQLAlchemy ORM
- **XSS protection** with security headers
- **CSRF protection** with SameSite cookies

### Security Monitoring
- **Login attempt logging** with IP tracking
- **Sensitive operation logging** (PIN changes, etc.)
- **Session activity monitoring**
- **Automatic security header injection**

## Development

### Code Style

**Backend (Python):**
- **Formatter**: Black
- **Linter**: Ruff
- **Import Sorter**: isort
- **Testing**: pytest with async support

**Frontend (TypeScript):**
- **Formatter**: Prettier
- **Linter**: ESLint
- **Testing**: Vitest + Testing Library

### Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/your-feature`
3. **Make your changes** following our coding standards
4. **Write tests** for new functionality
5. **Run the test suite**: `pytest` and `pnpm test`
6. **Commit using Conventional Commits**: `feat(tasks): add new feature`
7. **Push and create a Pull Request**

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

### Branch Model
- `main`: Stable, release-ready (protected)
- `dev`: Team integration branch (protected)
- Personal branches: Named branches per developer (e.g., `yourname/feature`)

## Architecture Deep Dive

### Database Schema

The application uses a normalized SQLite database with the following main entities:

- **User**: Account information and settings
- **Task**: Main task entity with relationships
- **Status**: Task status definitions (Todo, In Progress, Done)
- **Category**: Task categorization with color coding
- **Tag**: Flexible tagging system
- **JournalEntry**: Daily journal entries for review
- **Configuration**: User preferences and settings
- **UserSession**: Session management and security tracking
- **Conversation/Message**: AI chat history

### API Design Principles

- **RESTful endpoints** with consistent naming
- **Comprehensive error handling** with meaningful messages
- **Input validation** at multiple layers
- **Authentication middleware** for protected routes
- **Rate limiting** for security
- **Caching strategies** for performance

### Frontend Architecture

- **Component-based design** with reusable components
- **Context providers** for global state management
- **Custom hooks** for business logic
- **TanStack Query** for server state synchronization
- **Responsive design** with Tailwind CSS
- **Accessibility features** including ARIA labels and keyboard navigation

## Deployment

### Production Deployment

1. **Set production environment variables**
2. **Use HTTPS** (required for secure cookies)
3. **Configure database** (SQLite suitable for small deployments)
4. **Set up reverse proxy** (nginx recommended)
5. **Configure monitoring** and logging

### Environment Variables

```env
# Production configuration
SECRET_KEY=your-production-secret-key
DATABASE_URL=sqlite+aiosqlite:///path/to/production.db
TASKLINE_HOST=0.0.0.0
TASKLINE_DEBUG=0

# AI configuration (optional)
OPENAI_API_KEY=your-api-key
```

### Docker Production Deployment

```bash
# Build production images
docker-compose -f deployment/docker-compose.yml build

# Deploy with production settings
docker-compose -f deployment/docker-compose.yml up -d
```

## Troubleshooting

### Common Issues

**Database Issues:**
```bash
# Reset database
rm backend/db/taskline.db*
cd backend
alembic upgrade head
```

**Frontend Build Issues:**
```bash
cd frontend
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

**Backend Import Issues:**
```bash
# Ensure PYTHONPATH is set correctly
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
```

### Development Tips

1. **Use the health check endpoint** to verify backend status: `GET /api/health`
2. **Check browser console** for frontend errors
3. **Enable debug logging** by setting `TASKLINE_DEBUG=1`
4. **Use the built-in tutorial** for learning the interface

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Quart](https://github.com/pallets/quart) for the async Python web framework
- UI components styled with [Tailwind CSS](https://tailwindcss.com/)
- Icons provided by [Lucide](https://lucide.dev/)
- Testing powered by [pytest](https://pytest.org/) and [Vitest](https://vitest.dev/)

## Support

- Check the [backend documentation](backend/README.md) for detailed backend information
- Review the [E2E test documentation](testcase/e2e/README-E2E.md) for testing information
- For questions and support, please open an issue in the repository

---

**Task Line** - *Stay organized, stay focused, stay zen.*
