# Task Line - System Architecture

This document provides a comprehensive overview of the Task Line system architecture, including design decisions, data flow, component organization, and security considerations.

## System Overview

Task Line is a local-first task management application built as a modern web application with a React frontend and Python backend. The system is designed to run entirely on the user's machine without requiring external services or cloud connectivity.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User Interface                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │  Landing Page   │  │   Task Views    │  │   Settings   │ │
│  │                 │  │                 │  │              │ │
│  │ • Hero          │  │ • List View     │  │ • PIN Setup  │ │
│  │ • Tutorial      │  │ • Board View    │  │ • Preferences│ │
│  │ • FAQ           │  │ • Calendar View │  │ • AI Config  │ │
│  │ • Privacy       │  │ • Review View   │  │              │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTP/JSON API
                          │ (localhost:5001)
┌─────────────────────────▼───────────────────────────────────┐
│                   Backend API Server                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │    Auth     │  │    Tasks    │  │   Review    │        │
│  │  Blueprint  │  │  Blueprint  │  │  Blueprint  │        │
│  │             │  │             │  │             │        │
│  │ • PIN Auth  │  │ • CRUD Ops  │  │ • Journal   │        │
│  │ • Sessions  │  │ • Status    │  │ • Analytics │        │
│  │ • Security  │  │ • Priority  │  │ • Insights  │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                            │
│  ┌─────────────┐  ┌─────────────────────────────────────┐  │
│  │  Settings   │  │         Core Application            │  │
│  │  Blueprint  │  │                                     │  │
│  │             │  │ • Quart App Factory                 │  │
│  │ • User Prefs│  │ • CORS Configuration                │  │
│  │ • AI Config │  │ • Error Handling                    │  │
│  │ • Themes    │  │ • Database Initialization           │  │
│  └─────────────┘  └─────────────────────────────────────┘  │
└─────────────────────────┬───────────────────────────────────┘
                          │ SQLAlchemy (Async)
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                   Database Layer                           │
│                                                            │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │     Users       │  │     Tasks       │  │   Journal   │ │
│  │                 │  │                 │  │   Entries   │ │
│  │ • Credentials   │  │ • Task Data     │  │             │ │
│  │ • Configuration │  │ • Status        │  │ • Daily Log │ │
│  │ • Session Data  │  │ • Categories    │  │ • Notes     │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
│                                                            │
│  ┌─────────────────┐  ┌─────────────────┐                 │
│  │    Statuses     │  │   User Settings │                 │
│  │                 │  │                 │                 │
│  │ • Todo          │  │ • Preferences   │                 │
│  │ • In Progress   │  │ • Feature Flags │                 │
│  │ • Done          │  │ • AI Config     │                 │
│  └─────────────────┘  └─────────────────┘                 │
│                                                            │
│                   SQLite Database                          │
│                  (WAL Mode Enabled)                        │
└────────────────────────────────────────────────────────────┘
```

## Frontend Architecture

### Technology Stack
- **React 18**: Modern React with hooks and functional components
- **TypeScript**: Type safety and enhanced developer experience
- **Vite**: Fast build tool and development server
- **TanStack Router**: Type-safe client-side routing
- **TanStack Query**: Server state management and caching
- **Tailwind CSS**: Utility-first styling framework
- **Lucide React**: Icon library

### Component Organization

```
frontend/src/
├── components/
│   ├── landing/           # Landing page components
│   │   ├── Header.tsx     # Navigation header
│   │   ├── Hero.tsx       # Hero section
│   │   ├── Tutorial.tsx   # Interactive tutorial
│   │   ├── Privacy.tsx    # Privacy information
│   │   ├── FAQ.tsx        # Frequently asked questions
│   │   ├── CTA.tsx        # Call to action
│   │   ├── Footer.tsx     # Page footer
│   │   ├── Login.tsx      # PIN login form
│   │   ├── SignUp.tsx     # PIN setup form
│   │   └── Overview.tsx   # Feature overview
│   ├── app/               # Main application components (planned)
│   │   ├── TaskList.tsx   # List view component
│   │   ├── KanbanBoard.tsx# Board view component
│   │   ├── Calendar.tsx   # Calendar view component
│   │   └── Review.tsx     # Review/analytics component
│   ├── shared/            # Reusable components
│   │   ├── Button.tsx     # Button component
│   │   ├── Input.tsx      # Input component
│   │   └── Modal.tsx      # Modal component
│   └── ui/                # Base UI components
├── routes/                # TanStack Router configuration
│   ├── __root.tsx         # Root route layout
│   ├── index.tsx          # Landing page route
│   ├── login.tsx          # Login route
│   └── app/               # Protected app routes
├── hooks/                 # Custom React hooks
│   ├── useAuth.ts         # Authentication hook
│   ├── useTasks.ts        # Task management hook
│   └── useSettings.ts     # Settings management hook
├── services/              # API service layer
│   ├── api.ts             # Base API configuration
│   ├── auth.ts            # Authentication services
│   ├── tasks.ts           # Task services
│   └── settings.ts        # Settings services
├── types/                 # TypeScript type definitions
│   ├── auth.ts            # Authentication types
│   ├── tasks.ts           # Task types
│   └── api.ts             # API response types
└── utils/                 # Utility functions
    ├── validation.ts      # Form validation
    ├── formatting.ts      # Data formatting
    └── storage.ts         # Local storage utilities
```

### State Management Strategy

**TanStack Query** is used for server state management, providing:
- Automatic caching and background updates
- Optimistic updates for better UX
- Error handling and retry logic
- Offline capability with cache persistence

**Local React State** is used for:
- UI state (modals, form inputs, loading states)
- Temporary data that doesn't need persistence
- Component-specific state

### Routing Architecture

```typescript
// Route structure using TanStack Router
/                    # Landing page
├── /login           # PIN authentication
├── /signup          # PIN setup
└── /app             # Protected app routes
    ├── /            # Dashboard (default view)
    ├── /list        # List view
    ├── /board       # Kanban board view
    ├── /calendar    # Calendar view
    ├── /review      # Review and analytics
    └── /settings    # User preferences
```

## Backend Architecture

### Technology Stack
- **Quart 0.18.4**: Async Python web framework (Flask-compatible)
- **SQLAlchemy 2.0**: Modern async ORM with type hints
- **aiosqlite**: Async SQLite driver
- **Quart-CORS**: Cross-Origin Resource Sharing support
- **pytest**: Testing framework

### Blueprint Organization

The backend uses a modular blueprint architecture for separation of concerns:

#### Auth Blueprint (`/api/auth`)
```python
# Authentication endpoints
POST /api/auth/setup     # Initial PIN setup
POST /api/auth/login     # PIN authentication
POST /api/auth/logout    # Session termination
PUT  /api/auth/pin       # PIN change
GET  /api/auth/status    # Session validation
```

#### Tasks Blueprint (`/api/tasks`)
```python
# Task management endpoints
GET    /api/tasks                 # List tasks with filtering
POST   /api/tasks                 # Create new task
GET    /api/tasks/{id}            # Get specific task
PUT    /api/tasks/{id}            # Update task
DELETE /api/tasks/{id}            # Delete task
PUT    /api/tasks/{id}/status     # Update task status
PUT    /api/tasks/{id}/priority   # Toggle priority
GET    /api/tasks/kanban          # Kanban board data
GET    /api/tasks/categories      # Available categories
```

#### Review Blueprint (`/api/review`)
```python
# Journal and analytics endpoints
GET  /api/review/journal          # Get journal entries
POST /api/review/journal          # Create journal entry
PUT  /api/review/journal/{id}     # Update journal entry
GET  /api/review/summary/daily    # Daily summary
GET  /api/review/summary/weekly   # Weekly summary
GET  /api/review/insights         # Analytics insights
```

#### Settings Blueprint (`/api/settings`)
```python
# User preferences endpoints
GET /api/settings                 # Get all settings
PUT /api/settings                 # Update settings (bulk)
PUT /api/settings/notes           # Notes preferences
PUT /api/settings/timer           # Timer preferences
PUT /api/settings/ai-url          # AI service URL
PUT /api/settings/auto-lock       # Auto-lock settings
PUT /api/settings/theme           # Theme preferences
```

### Application Factory Pattern

```python
def create_app():
    """Create and configure the Quart app"""
    app = Quart(__name__)

    # Configuration
    configure_app(app)

    # Extensions
    setup_cors(app)
    setup_database(app)

    # Blueprints
    register_blueprints(app)

    # Error handlers
    register_error_handlers(app)

    return app
```

## Database Architecture

### Schema Design

The database uses SQLite with WAL mode for optimal performance in a single-user environment.

#### Core Tables

```sql
-- Users table for authentication and configuration
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100),
    pin_hash VARCHAR(128) NOT NULL,
    config_data TEXT DEFAULT '{}',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Task statuses for kanban workflow
CREATE TABLE statuses (
    id INTEGER PRIMARY KEY,
    description VARCHAR(50) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Main tasks table
CREATE TABLE tasks (
    id INTEGER PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    notes TEXT,
    done BOOLEAN DEFAULT FALSE,
    category VARCHAR(50),
    priority BOOLEAN DEFAULT FALSE,
    due_date DATE,
    estimate_minutes INTEGER,
    order_position INTEGER DEFAULT 0,
    status_id INTEGER REFERENCES statuses(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_on DATETIME DEFAULT CURRENT_TIMESTAMP,
    closed_on DATETIME,
    created_by INTEGER REFERENCES users(id) NOT NULL
);

-- Journal entries for review and reflection
CREATE TABLE journal_entries (
    id INTEGER PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    entry_date DATE NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_on DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User preferences and settings
CREATE TABLE user_settings (
    id INTEGER PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    notes_enabled BOOLEAN DEFAULT TRUE,
    timer_enabled BOOLEAN DEFAULT TRUE,
    ai_url VARCHAR(500),
    auto_lock_minutes INTEGER DEFAULT 10,
    theme VARCHAR(50) DEFAULT 'light',
    updated_on DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Relationships and Constraints

```
Users (1) ──────── (N) Tasks
Users (1) ──────── (N) JournalEntries
Users (1) ──────── (1) UserSettings
Statuses (1) ──── (N) Tasks
```

### Data Access Layer

```python
# SQLAlchemy models with async support
class Task(Base):
    __tablename__ = 'tasks'

    # Columns defined with proper types
    id = Column(Integer, primary_key=True)
    title = Column(String(200), nullable=False)
    # ... other columns

    # Relationships
    user = relationship("User", back_populates="tasks")
    status = relationship("Status", back_populates="tasks")

    def to_dict(self):
        """Serialize to JSON-compatible dictionary"""
        return {
            'id': self.id,
            'title': self.title,
            # ... other fields
        }
```

## Security Architecture

### Authentication & Authorization

**PIN-Based Authentication**:
- 4-8 digit numeric PIN
- SHA-256 hashing with salt
- Session-based auth with HTTP-only cookies
- Configurable auto-lock (default 10 minutes)

```python
def hash_pin(pin: str) -> str:
    """Hash PIN using SHA-256"""
    return hashlib.sha256(pin.encode()).hexdigest()

def validate_pin(pin: str) -> bool:
    """Validate PIN format (4-8 digits)"""
    return pin.isdigit() and 4 <= len(pin) <= 8

@auth_required
async def protected_endpoint():
    """Decorator ensures user authentication"""
    user_id = session.get('user_id')
    # ... endpoint logic
```

### Data Protection

**Local-First Security**:
- All data stored locally on user's machine
- No cloud storage or external transmission
- SQLite database with file-level permissions
- Optional AI features require explicit user consent

**Session Management**:
- Secure session cookies with proper flags
- Automatic session expiration
- Session invalidation on logout
- CSRF protection through SameSite cookies

### Input Validation

```python
# Example validation for task creation
async def create_task(request_data):
    # Validate required fields
    if not request_data.get('title'):
        raise ValidationError("Title is required")

    # Sanitize inputs
    title = request_data['title'].strip()[:200]

    # Validate data types
    due_date = None
    if request_data.get('due_date'):
        due_date = datetime.fromisoformat(request_data['due_date'])

    return Task(title=title, due_date=due_date, ...)
```

## API Design Principles

### RESTful Design

- **Resources**: Tasks, Users, Settings, Reviews
- **HTTP Methods**: GET (read), POST (create), PUT (update), DELETE (remove)
- **Status Codes**: 200 (success), 201 (created), 400 (bad request), 401 (unauthorized), 404 (not found), 500 (server error)

### Response Format

```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Complete project documentation",
    "status": {
      "id": 1,
      "name": "Todo"
    },
    "created_at": "2024-01-15T10:30:00Z"
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "version": "1.0"
  }
}
```

### Error Handling

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Title is required",
    "details": {
      "field": "title",
      "value": ""
    }
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "request_id": "req_123456"
  }
}
```

## Data Flow Architecture

### Task Management Flow

```
User Input → Frontend Validation → API Request → Backend Validation
→ Database Update → Response → UI Update → Local Cache Update
```

### Authentication Flow

```
PIN Entry → Frontend Validation → Login Request → Backend Verification
→ Session Creation → Response with Cookie → Route Protection Active
```

### Kanban Board Flow

```
Task Status Change → Optimistic UI Update → API Request → Database Update
→ Background Sync → Error Handling (if needed) → UI Correction (if needed)
```

## Performance Considerations

### Frontend Optimization

- **Code Splitting**: Route-based chunking for faster initial load
- **Lazy Loading**: Components loaded on demand
- **Memoization**: React.memo for expensive components
- **Virtual Scrolling**: For large task lists
- **Debounced Search**: Reduce API calls during typing

### Backend Optimization

- **Async Operations**: Non-blocking I/O with Quart and aiosqlite
- **Database Indexing**: Indexes on frequently queried fields
- **Connection Pooling**: Efficient database connection management
- **Response Caching**: Cache static data and computed analytics

### Database Optimization

- **WAL Mode**: Better concurrency for SQLite
- **Prepared Statements**: Prevent SQL injection and improve performance
- **Batch Operations**: Group related database operations
- **Vacuum Operations**: Periodic database maintenance

## Scalability & Future Considerations

### Local-First Limitations

- Single-user design limits concurrent access
- Storage limited by local disk space
- No built-in backup/sync capabilities
- Performance depends on local hardware

### Potential Enhancements

1. **Offline-First PWA**: Service workers for true offline capability
2. **Data Export/Import**: Robust backup and migration tools
3. **Plugin Architecture**: Extensible system for custom features
4. **Multi-Device Sync**: Optional cloud sync while maintaining privacy
5. **Desktop Application**: Electron wrapper for native experience

### Monitoring & Debugging

- **Frontend**: React DevTools, browser console, error boundaries
- **Backend**: Structured logging, health endpoints, async debugging
- **Database**: SQLite EXPLAIN QUERY PLAN for optimization
- **Performance**: Frontend profiling, backend timing middleware

This architecture provides a solid foundation for a local-first task management application while maintaining security, performance, and user privacy as core principles.