# TaskLine Database Documentation

## Overview

TaskLine uses **SQLite** as its database engine with **SQLAlchemy 2.0** ORM for object-relational mapping and **Alembic** for schema migrations. The database is designed with a focus on data integrity, referential consistency, and performance optimization.

**Key Characteristics:**
- **Local-first**: All data stored on user's device
- **Async operations**: Built for Quart async framework
- **Migration-managed**: Schema versioning with Alembic
- **Constraint-enforced**: Data validation at database level
- **Indexed**: Optimized for common query patterns

---

## Database Schema

### Entity Relationship Diagram

```
User (1) ──< (N) Task
User (1) ──< (N) JournalEntry
User (1) ──< (N) Conversation
User (1) ──< (N) UserSession
User (1) ──── (1) Configuration

Category (1) ──< (N) Task
Status (1) ──< (N) Task
Task (N) ──< (N) Tag (via task_tag join table)
Task (1) ──< (N) Task (self-referential for subtasks)

Conversation (1) ──< (N) Message
```

---

## Tables

### 1. User Table

**Purpose:** Stores user account information and authentication credentials.

**Schema:**
```sql
CREATE TABLE user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(99) UNIQUE,
    pin_hash VARCHAR NOT NULL,
    created_on DATETIME NOT NULL,
    config_data VARCHAR(1000) DEFAULT '{}'
);
```

**Columns:**
| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | INTEGER | NO | Primary key, auto-increment |
| username | VARCHAR(20) | NO | Unique username, max 20 chars |
| email | VARCHAR(99) | YES | Email address, nullable for privacy |
| pin_hash | VARCHAR | NO | Bcrypt-hashed PIN (4-8 digits) |
| created_on | DATETIME | NO | Account creation timestamp |
| config_data | VARCHAR(1000) | NO | JSON configuration data |

**Relationships:**
- One-to-many with `Task`
- One-to-many with `JournalEntry`
- One-to-many with `Conversation`
- One-to-many with `UserSession`
- One-to-one with `Configuration`

**Indexes:**
- Primary key index on `id`
- Unique index on `username`
- Unique index on `email`

---

### 2. Task Table

**Purpose:** Core table storing all user tasks with metadata.

**Schema:**
```sql
CREATE TABLE task (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(140) NOT NULL,
    description VARCHAR(140),
    notes VARCHAR(140),
    category_id INTEGER,
    status_id INTEGER NOT NULL,
    parent_id INTEGER,
    done BOOLEAN NOT NULL DEFAULT 0,
    closed_on DATETIME,
    archived BOOLEAN NOT NULL DEFAULT 0,
    priority BOOLEAN NOT NULL DEFAULT 0,
    estimate_minutes INTEGER,
    "order" INTEGER NOT NULL DEFAULT 0,
    due_date DATETIME NOT NULL,
    created_on DATETIME NOT NULL,
    updated_on DATETIME NOT NULL,
    created_by INTEGER NOT NULL,
    FOREIGN KEY (category_id) REFERENCES category(id) ON DELETE SET NULL,
    FOREIGN KEY (status_id) REFERENCES status(id) ON DELETE RESTRICT,
    FOREIGN KEY (parent_id) REFERENCES task(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES user(id) ON DELETE CASCADE,
    CHECK (length(trim(title)) > 0),
    CHECK (length(title) <= 200),
    CHECK (description IS NULL OR length(description) <= 2000),
    CHECK (estimate_minutes IS NULL OR estimate_minutes >= 0),
    CHECK (estimate_minutes IS NULL OR estimate_minutes <= 10080),
    CHECK ("order" >= 0)
);
```

**Columns:**
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | INTEGER | NO | - | Primary key |
| title | VARCHAR(140) | NO | - | Task title, max 140 chars |
| description | VARCHAR(140) | YES | NULL | Task description |
| notes | VARCHAR(140) | YES | NULL | Additional notes |
| category_id | INTEGER | YES | NULL | Foreign key to category |
| status_id | INTEGER | NO | - | Foreign key to status (required) |
| parent_id | INTEGER | YES | NULL | Self-referential FK for subtasks |
| done | BOOLEAN | NO | FALSE | Completion flag |
| closed_on | DATETIME | YES | NULL | Completion timestamp |
| archived | BOOLEAN | NO | FALSE | Soft delete flag |
| priority | BOOLEAN | NO | FALSE | High priority flag |
| estimate_minutes | INTEGER | YES | NULL | Time estimate (0-10080 minutes = 7 days) |
| order | INTEGER | NO | 0 | Manual sort order for drag-drop |
| due_date | DATETIME | NO | - | Task due date |
| created_on | DATETIME | NO | now() | Creation timestamp |
| updated_on | DATETIME | NO | now() | Last update timestamp |
| created_by | INTEGER | NO | - | Foreign key to user |

**Relationships:**
- Many-to-one with `User` (created_by)
- Many-to-one with `Category` (category_id)
- Many-to-one with `Status` (status_id)
- Many-to-many with `Tag` (via task_tag)
- Self-referential one-to-many (parent_id)

**Indexes:**
- Primary key index on `id`
- Index on `created_by` (for user-specific queries)
- Index on `parent_id` (for subtask queries)
- Index on `due_date` (for performance optimization)
- Index on `status_id` (for performance optimization)

**Constraints:**
- `task_title_not_empty`: Title cannot be empty string
- `task_title_length`: Title max 200 characters
- `task_description_length`: Description max 2000 characters
- `task_estimate_positive`: Estimate must be >= 0
- `task_estimate_max`: Estimate max 10080 minutes (7 days)
- `task_order_positive`: Order must be >= 0

---

### 3. Category Table

**Purpose:** Organizes tasks into user-defined categories with color coding.

**Schema:**
```sql
CREATE TABLE category (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(140) NOT NULL,
    description VARCHAR(140),
    color_hex VARCHAR(6) NOT NULL,
    created_on DATETIME NOT NULL,
    updated_on DATETIME NOT NULL,
    created_by INTEGER NOT NULL,
    FOREIGN KEY (created_by) REFERENCES user(id)
);
```

**Columns:**
| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | INTEGER | NO | Primary key |
| name | VARCHAR(140) | NO | Category name |
| description | VARCHAR(140) | YES | Optional description |
| color_hex | VARCHAR(6) | NO | Hex color code (e.g., "FF5733") |
| created_on | DATETIME | NO | Creation timestamp |
| updated_on | DATETIME | NO | Last update timestamp |
| created_by | INTEGER | NO | Foreign key to user |

**Relationships:**
- One-to-many with `Task`
- Many-to-one with `User`

---

### 4. Tag Table

**Purpose:** Flexible tagging system for tasks (many-to-many relationship).

**Schema:**
```sql
CREATE TABLE tag (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(140) NOT NULL,
    description VARCHAR(140),
    color_hex VARCHAR(6) NOT NULL,
    created_on DATETIME NOT NULL,
    updated_on DATETIME NOT NULL,
    created_by INTEGER NOT NULL,
    FOREIGN KEY (created_by) REFERENCES user(id)
);
```

**Columns:**
| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | INTEGER | NO | Primary key |
| name | VARCHAR(140) | NO | Tag name |
| description | VARCHAR(140) | YES | Optional description |
| color_hex | VARCHAR(6) | NO | Hex color code |
| created_on | DATETIME | NO | Creation timestamp |
| updated_on | DATETIME | NO | Last update timestamp |
| created_by | INTEGER | NO | Foreign key to user |

**Relationships:**
- Many-to-many with `Task` (via task_tag)
- Many-to-one with `User`

---

### 5. task_tag (Join Table)

**Purpose:** Many-to-many relationship between tasks and tags.

**Schema:**
```sql
CREATE TABLE task_tag (
    task_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY (task_id, tag_id),
    FOREIGN KEY (task_id) REFERENCES task(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tag(id) ON DELETE CASCADE
);
```

**Columns:**
| Column | Type | Description |
|--------|------|-------------|
| task_id | INTEGER | Foreign key to task |
| tag_id | INTEGER | Foreign key to tag |

**Cascade Behavior:**
- When a task is deleted, all associations are removed
- When a tag is deleted, all associations are removed

---

### 6. Status Table

**Purpose:** Lookup table for task statuses (To Do, In Progress, Done).

**Schema:**
```sql
CREATE TABLE status (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(25) NOT NULL UNIQUE,
    description VARCHAR(140),
    created_on DATETIME NOT NULL,
    updated_on DATETIME NOT NULL,
    created_by INTEGER NOT NULL,
    FOREIGN KEY (created_by) REFERENCES user(id)
);
```

**Columns:**
| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | INTEGER | NO | Primary key |
| title | VARCHAR(25) | NO | Status name (unique) |
| description | VARCHAR(140) | YES | Optional description |
| created_on | DATETIME | NO | Creation timestamp |
| updated_on | DATETIME | NO | Last update timestamp |
| created_by | INTEGER | NO | Foreign key to user |

**Default Values:**
- "To Do" (id: 1)
- "In Progress" (id: 2)
- "Done" (id: 3)

**Relationships:**
- One-to-many with `Task`

**Constraints:**
- Unique constraint on `title`
- ON DELETE RESTRICT prevents deleting statuses in use

---

### 7. JournalEntry Table

**Purpose:** Daily journal entries for productivity tracking.

**Schema:**
```sql
CREATE TABLE journal_entries (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    entry_date DATETIME NOT NULL,
    content VARCHAR(140) NOT NULL,
    created_at DATETIME NOT NULL,
    updated_on DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user(id)
);
```

**Columns:**
| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | INTEGER | NO | Primary key |
| user_id | INTEGER | NO | Foreign key to user |
| entry_date | DATETIME | NO | Date of journal entry |
| content | VARCHAR(140) | NO | Entry content (max 140 chars) |
| created_at | DATETIME | NO | Creation timestamp |
| updated_on | DATETIME | NO | Last update timestamp |

**Relationships:**
- Many-to-one with `User`

---

### 8. Configuration Table

**Purpose:** User settings and preferences (one-to-one with User).

**Schema:**
```sql
CREATE TABLE configuration (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    notes_enabled BOOLEAN DEFAULT 1,
    timer_enabled BOOLEAN DEFAULT 1,
    ai_api_url VARCHAR(500),
    ai_model VARCHAR(100),
    ai_api_key VARCHAR(500),
    auto_lock_minutes INTEGER DEFAULT 10,
    theme VARCHAR(50) DEFAULT 'light',
    updated_on DATETIME,
    FOREIGN KEY (user_id) REFERENCES user(id)
);
```

**Columns:**
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | INTEGER | NO | - | Primary key |
| user_id | INTEGER | NO | - | Foreign key to user |
| notes_enabled | BOOLEAN | NO | TRUE | Enable task notes |
| timer_enabled | BOOLEAN | NO | TRUE | Enable Pomodoro timer |
| ai_api_url | VARCHAR(500) | YES | NULL | Optional AI API endpoint |
| ai_model | VARCHAR(100) | YES | NULL | AI model identifier |
| ai_api_key | VARCHAR(500) | YES | NULL | User's AI API key |
| auto_lock_minutes | INTEGER | NO | 10 | Auto-lock timeout (minutes) |
| theme | VARCHAR(50) | NO | 'light' | UI theme (light/dark) |
| updated_on | DATETIME | YES | now() | Last update timestamp |

**Relationships:**
- One-to-one with `User`

---

### 9. Conversation Table

**Purpose:** AI chat conversation threads.

**Schema:**
```sql
CREATE TABLE conversation (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title VARCHAR(200) NOT NULL DEFAULT 'AI Chat',
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);
```

**Columns:**
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | INTEGER | NO | - | Primary key |
| user_id | INTEGER | NO | - | Foreign key to user |
| title | VARCHAR(200) | NO | 'AI Chat' | Conversation title |
| created_at | DATETIME | NO | now() | Creation timestamp |
| updated_at | DATETIME | NO | now() | Last update timestamp |

**Relationships:**
- Many-to-one with `User`
- One-to-many with `Message`

**Indexes:**
- Index on `user_id`

---

### 10. Message Table

**Purpose:** Individual messages within AI chat conversations.

**Schema:**
```sql
CREATE TABLE message (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id INTEGER NOT NULL,
    role VARCHAR(20) NOT NULL,
    content VARCHAR(10000) NOT NULL,
    created_at DATETIME NOT NULL,
    FOREIGN KEY (conversation_id) REFERENCES conversation(id) ON DELETE CASCADE
);
```

**Columns:**
| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | INTEGER | NO | Primary key |
| conversation_id | INTEGER | NO | Foreign key to conversation |
| role | VARCHAR(20) | NO | 'user' or 'assistant' |
| content | VARCHAR(10000) | NO | Message content |
| created_at | DATETIME | NO | Creation timestamp |

**Relationships:**
- Many-to-one with `Conversation`

**Indexes:**
- Index on `conversation_id`
- Index on `created_at` (for ordering)

---

### 11. UserSession Table

**Purpose:** Tracks active user sessions for authentication and security.

**Schema:**
```sql
CREATE TABLE user_sessions (
    id INTEGER PRIMARY KEY,
    session_id VARCHAR(128) NOT NULL UNIQUE,
    user_id INTEGER NOT NULL,
    created_at DATETIME NOT NULL,
    last_activity DATETIME NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    is_remember_me BOOLEAN DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    expires_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES user(id)
);
```

**Columns:**
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | INTEGER | NO | - | Primary key |
| session_id | VARCHAR(128) | NO | - | Unique session identifier |
| user_id | INTEGER | NO | - | Foreign key to user |
| created_at | DATETIME | NO | now() | Session creation time |
| last_activity | DATETIME | NO | now() | Last activity timestamp |
| ip_address | VARCHAR(45) | YES | NULL | Client IP address |
| user_agent | TEXT | YES | NULL | Browser/device info |
| is_remember_me | BOOLEAN | NO | FALSE | Remember me flag |
| is_active | BOOLEAN | NO | TRUE | Session active status |
| expires_at | DATETIME | YES | NULL | Session expiration time |

**Relationships:**
- Many-to-one with `User`

**Indexes:**
- Unique index on `session_id`

---

## Database Migrations

TaskLine uses **Alembic** for database schema version control.

**Migration Directory:** `backend/alembic/versions/`

**Key Migrations:**
- `a4b4e471597c_baseline_schema.py` - Initial schema
- `d16fdcc4c152_seed_core_defaults.py` - Default data (statuses)
- `1cce66b666c8_add_missing_performance_indexes.py` - Performance optimization

**Running Migrations:**
```bash
# Upgrade to latest
alembic upgrade heads

# Downgrade one version
alembic downgrade -1

# View migration history
alembic history
```

---

## Performance Optimizations

### Indexes

**Explicitly Created Indexes:**
1. `task.created_by` - User-specific task queries
2. `task.parent_id` - Subtask hierarchy queries
3. `task.due_date` - Calendar and deadline queries
4. `task.status_id` - Status filtering
5. `journal_entries.user_id` - User journal queries
6. `conversation.user_id` - User conversation queries
7. `message.conversation_id` - Message retrieval
8. `message.created_at` - Message ordering

**Implicit Indexes:**
- All primary keys automatically indexed
- All unique constraints automatically indexed
- All foreign keys recommended for indexing

### Query Optimization Patterns

**Eager Loading:**
```python
# Use selectinload to prevent N+1 queries
tasks = await session.execute(
    select(Task)
    .options(selectinload(Task.category))
    .options(selectinload(Task.status))
    .where(Task.created_by == user_id)
)
```

**Caching:**
- Status lookup cached (rarely changes)
- Category lookup cached per user session

---

## Data Integrity

### Foreign Key Constraints

**CASCADE DELETE:**
- User deletion cascades to all owned data (tasks, sessions, conversations)
- Task deletion cascades to subtasks
- Conversation deletion cascades to messages

**SET NULL:**
- Category deletion sets task.category_id to NULL (tasks remain)

**RESTRICT:**
- Status deletion prevented if tasks exist with that status

### Check Constraints

**Task Validation:**
- Title: Non-empty, max 200 characters
- Description: Max 2000 characters
- Estimate: 0-10080 minutes (7 days)
- Order: Non-negative

### Application-Level Validation

**PIN Validation:**
- 4-8 digits only
- Bcrypt hashed with salt
- Legacy SHA-256 auto-migration on login

**Username Validation:**
- 3-20 characters
- Alphanumeric plus underscore

---

## Security Considerations

### Authentication

**PIN Storage:**
- Stored as bcrypt hash (cost factor 12)
- Never stored in plain text
- Legacy SHA-256 hashes automatically migrated

**Session Management:**
- Unique session IDs (128 characters)
- Tracks IP address and user agent
- Auto-expiration after inactivity
- Database-tracked for security

### Data Privacy

**Local-Only Storage:**
- All data in local SQLite file
- No network transmission
- No cloud synchronization

**Optional Features:**
- AI API key stored locally (user-provided)
- Email field nullable (not required)

---

## Database Statistics

**Current Schema Version:** Latest migration head

**Table Count:** 11 tables

**Total Columns:** ~100 columns across all tables

**Relationships:** 15+ foreign key relationships

**Indexes:** 15+ performance indexes

---

## Backup and Recovery

### Backup Methods

**SQLite File Backup:**
```bash
# Docker volume backup
docker run --rm -v taskline-data:/data -v $(pwd):/backup \
  ubuntu tar czf /backup/taskline-backup.tar.gz -C /data .
```

**Export Data (Application):**
- Settings → Export Data
- Creates JSON export of all user data
- Importable for data portability

### Recovery Procedures

**Restore from Backup:**
1. Stop TaskLine: `taskline stop`
2. Extract backup to volume
3. Restart: `taskline start`

**Import from JSON:**
1. Settings → Import Data
2. Select exported JSON file
3. Data merged with existing records

---

## Development Notes

### Testing Database

**Test Database Setup:**
```python
# conftest.py creates temporary test database
@pytest.fixture
async def app():
    # Creates isolated test DB for each test
    # Runs migrations
    # Cleans up after test
```

**Test Data:**
- Fixtures create users, tasks, statuses
- Isolated per test (no test pollution)
- Automatic cleanup

### Database Health Checks

**Startup Verification:**
```python
# app.py performs health check on startup
- Verifies connection
- Checks migration status
- Validates schema integrity
```

---

## Future Considerations

### Potential Enhancements

1. **Full-text Search:** Add FTS5 virtual table for task search
2. **Audit Trail:** Add audit_log table for change tracking
3. **Task Dependencies:** Implement TaskDependency table (commented out)
4. **Recurring Tasks:** Add recurrence rules table
5. **Attachments:** Add file attachment table

### Scalability

**Current Limits:**
- SQLite handles millions of rows efficiently
- Single-user application (no concurrency issues)
- File size typically < 100MB for normal usage

**If Multi-User:**
- Consider PostgreSQL for concurrent access
- Implement row-level security
- Add user permissions table

---

## References

- **SQLAlchemy Documentation:** https://docs.sqlalchemy.org/
- **Alembic Documentation:** https://alembic.sqlalchemy.org/
- **SQLite Documentation:** https://www.sqlite.org/docs.html

---

## Changelog

| Date | Author | Change |
|------|--------|--------|
| 2024-12-04 | Issagha Diallo | Initial database documentation created |

---

*This documentation is maintained as part of the TaskLine project. For updates or corrections, please submit a pull request.*
