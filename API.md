# Task Line API Documentation

## Overview

Task Line is a productivity application with a RESTful API built using Quart (async Flask). The API provides endpoints for task management, user authentication, journal entries, and user settings.

## Base Configuration

- **Base URL**: `http://localhost:5001`
- **Framework**: Quart (Async Flask)
- **Database**: SQLite with async support (aiosqlite)
- **Authentication**: Session-based with PIN authentication

## Authentication

All endpoints except `/api/auth/setup` and `/api/auth/login` require authentication. Authentication is handled through sessions - users must login with their PIN to access protected endpoints.

### Authentication Headers
No special headers required - authentication is managed through session cookies.

### Error Responses
- `401 Unauthorized`: Authentication required or invalid credentials
- `400 Bad Request`: Invalid request data
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

---

## Endpoints

### System Endpoints

#### Health Check
```http
GET /api/health
```

**Description**: Check API health status

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-12-21T10:30:00.000Z",
  "database": "connected"
}
```

#### API Info
```http
GET /
```

**Description**: Get API information and available endpoints

**Response**:
```json
{
  "message": "Welcome to Task Line API!",
  "version": "1.0",
  "endpoints": {
    "auth": "/api/auth",
    "tasks": "/api/tasks",
    "review": "/api/review",
    "settings": "/api/settings",
    "health": "/api/health"
  }
}
```

---

## Authentication Endpoints (`/api/auth`)

### Setup Account
```http
POST /api/auth/setup
```

**Description**: Initial PIN setup for first-time users

**Request Body**:
```json
{
  "pin": "1234",
  "username": "admin",
  "email": "user@example.com"
}
```

**Required Fields**:
- `pin` (string): 4-8 digit PIN for authentication

**Optional Fields**:
- `username` (string): Username (defaults to "admin")
- `email` (string): User email

**Response** (201):
```json
{
  "success": true,
  "message": "Account created successfully",
  "user_id": 1,
  "username": "admin"
}
```

**Errors**:
- `400`: PIN is required or invalid format (must be 4-8 digits)
- `400`: User already exists
- `500`: Failed to create account

---

### Login
```http
POST /api/auth/login
```

**Description**: Authenticate with PIN

**Request Body**:
```json
{
  "pin": "1234"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Login successful",
  "user_id": 1,
  "username": "admin"
}
```

**Errors**:
- `400`: PIN is required
- `401`: Wrong PIN
- `500`: Login failed

---

### Logout
```http
POST /api/auth/logout
```

**Description**: End current session
**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### Change PIN
```http
PUT /api/auth/pin
```

**Description**: Change existing PIN
**Authentication**: Required

**Request Body**:
```json
{
  "current_pin": "1234",
  "new_pin": "5678"
}
```

**Response**:
```json
{
  "success": true,
  "message": "PIN updated successfully"
}
```

**Errors**:
- `400`: Current PIN and new PIN are required
- `400`: PIN must be 4-8 digits
- `401`: Current PIN is incorrect
- `500`: Failed to update PIN

---

## Task Endpoints (`/api/tasks`)

### Get All Tasks
```http
GET /api/tasks
```

**Description**: Get all tasks for the authenticated user
**Authentication**: Required

**Response**:
```json
[
  {
    "id": 1,
    "title": "Complete project documentation",
    "description": "Write comprehensive API documentation",
    "notes": "Include examples and error codes",
    "done": false,
    "category": "work",
    "priority": true,
    "due_date": "2024-12-25",
    "estimate_minutes": 120,
    "order": 0,
    "created_at": "2024-12-21T10:00:00.000Z",
    "updated_on": "2024-12-21T10:30:00.000Z",
    "closed_on": null,
    "status": {
      "id": 1,
      "name": "Todo"
    },
    "created_by": 1
  }
]
```

---

### Create Task
```http
POST /api/tasks
```

**Description**: Create a new task
**Authentication**: Required

**Request Body**:
```json
{
  "title": "Complete project documentation",
  "description": "Write comprehensive API documentation",
  "category": "work",
  "priority": true,
  "due_date": "2024-12-25"
}
```

**Required Fields**:
- `title` (string): Task title

**Optional Fields**:
- `description` (string): Task description
- `category` (string): Task category (personal, work, shopping)
- `priority` (boolean): High priority flag
- `due_date` (string): Due date in YYYY-MM-DD format

**Response** (201):
```json
{
  "success": true,
  "message": "Task created successfully",
  "task_id": 1
}
```

**Errors**:
- `400`: Task title is required
- `500`: Failed to create task

---

### Get Kanban Board
```http
GET /api/tasks/kanban
```

**Description**: Get tasks organized by status (kanban board)
**Authentication**: Required

**Response**:
```json
{
  "todo": {
    "status_id": 1,
    "name": "Todo",
    "tasks": [...]
  },
  "in_progress": {
    "status_id": 2,
    "name": "In Progress",
    "tasks": [...]
  },
  "done": {
    "status_id": 3,
    "name": "Done",
    "tasks": [...]
  }
}
```

---

### Get Categories
```http
GET /api/tasks/categories
```

**Description**: Get available task categories
**Authentication**: Required

**Response**:
```json
{
  "categories": [
    {
      "id": "personal",
      "name": "Personal",
      "color": "#10B981"
    },
    {
      "id": "work",
      "name": "Work",
      "color": "#3B82F6"
    },
    {
      "id": "shopping",
      "name": "Shopping",
      "color": "#F59E0B"
    }
  ]
}
```

---

### Get Single Task
```http
GET /api/tasks/{task_id}
```

**Description**: Fetch a single task by ID
**Authentication**: Required

**Path Parameters**:
- `task_id` (integer): Task ID

**Response**:
```json
{
  "id": 1,
  "title": "Complete project documentation",
  "description": "Write comprehensive API documentation",
  "notes": "Include examples and error codes",
  "done": false,
  "category": "work",
  "priority": true,
  "due_date": "2024-12-25",
  "estimate_minutes": 120,
  "order": 0,
  "created_at": "2024-12-21T10:00:00.000Z",
  "updated_on": "2024-12-21T10:30:00.000Z",
  "closed_on": null,
  "status": {
    "id": 1,
    "name": "Todo"
  },
  "created_by": 1
}
```

**Errors**:
- `404`: Task not found
- `500`: Failed to fetch task

---

### Update Task
```http
PUT /api/tasks/{task_id}
```

**Description**: Update a task's fields
**Authentication**: Required

**Path Parameters**:
- `task_id` (integer): Task ID

**Request Body** (all fields optional):
```json
{
  "title": "Updated task title",
  "description": "Updated description",
  "done": true,
  "priority": false,
  "due_date": "2024-12-30",
  "status_id": 2
}
```

**Response**:
```json
{
  "id": 1,
  "title": "Updated task title",
  // ... full task object
}
```

**Errors**:
- `400`: No data provided
- `404`: Task not found
- `500`: Failed to update task

---

### Delete Task
```http
DELETE /api/tasks/{task_id}
```

**Description**: Delete a task by ID
**Authentication**: Required

**Path Parameters**:
- `task_id` (integer): Task ID

**Response**: `204 No Content`

**Errors**:
- `404`: Task not found
- `500`: Failed to delete task

---

## Review Endpoints (`/api/review`)

### Get Journal Entries
```http
GET /api/review/journal
```

**Description**: Get journal entries with optional date filtering
**Authentication**: Required

**Query Parameters**:
- `start_date` (string, optional): Start date in YYYY-MM-DD format (defaults to 30 days ago)
- `end_date` (string, optional): End date in YYYY-MM-DD format (defaults to today)

**Response**:
```json
[
  {
    "id": 1,
    "entry_date": "2024-12-21",
    "content": "Today was productive. Completed 3 tasks and made good progress on the project.",
    "created_at": "2024-12-21T20:00:00.000Z",
    "updated_on": "2024-12-21T20:30:00.000Z"
  }
]
```

---

### Create Journal Entry
```http
POST /api/review/journal
```

**Description**: Create a new journal entry
**Authentication**: Required

**Request Body**:
```json
{
  "content": "Today was productive. Completed 3 tasks and made good progress on the project.",
  "entry_date": "2024-12-21"
}
```

**Required Fields**:
- `content` (string): Journal entry content

**Optional Fields**:
- `entry_date` (string): Entry date in YYYY-MM-DD format (defaults to today)

**Response** (201):
```json
{
  "id": 1,
  "entry_date": "2024-12-21",
  "content": "Today was productive. Completed 3 tasks and made good progress on the project.",
  "created_at": "2024-12-21T20:00:00.000Z",
  "updated_on": "2024-12-21T20:00:00.000Z"
}
```

**Errors**:
- `400`: Content is required

---

### Update Journal Entry
```http
PUT /api/review/journal/{entry_id}
```

**Description**: Update an existing journal entry
**Authentication**: Required

**Path Parameters**:
- `entry_id` (integer): Journal entry ID

**Request Body**:
```json
{
  "content": "Updated journal content",
  "entry_date": "2024-12-21"
}
```

**Response**:
```json
{
  "id": 1,
  "entry_date": "2024-12-21",
  "content": "Updated journal content",
  "created_at": "2024-12-21T20:00:00.000Z",
  "updated_on": "2024-12-21T20:30:00.000Z"
}
```

**Errors**:
- `400`: No data provided
- `404`: Journal entry not found
- `500`: Update failed

---

### Delete Journal Entry
```http
DELETE /api/review/journal/{entry_id}
```

**Description**: Delete a journal entry
**Authentication**: Required

**Path Parameters**:
- `entry_id` (integer): Journal entry ID

**Response** (204):
```json
{
  "success": true
}
```

**Errors**:
- `404`: Journal entry not found

---

### Daily Summary
```http
GET /api/review/summary/daily
```

**Description**: Get daily productivity summary
**Authentication**: Required

**Query Parameters**:
- `date` (string, optional): Date in YYYY-MM-DD format (defaults to today)

**Response**:
```json
{
  "date": "2024-12-21",
  "tasks_completed": 3,
  "journal_entry": "Today was productive. Completed 3 tasks and made good progress on the project."
}
```

---

### Weekly Summary
```http
GET /api/review/summary/weekly
```

**Description**: Get weekly productivity summary for current week
**Authentication**: Required

**Response**:
```json
{
  "week_start": "2024-12-16",
  "week_end": "2024-12-22",
  "tasks_completed": 15,
  "total_tasks": 20,
  "completion_rate": 0.75
}
```

---

### Insights
```http
GET /api/review/insights
```

**Description**: Get productivity insights and analytics
**Authentication**: Required

**Response**:
```json
{
  "total_tasks": 50,
  "completed_tasks": 35,
  "overall_completion_rate": 0.7,
  "most_productive_day": "2024-12-20",
  "tasks_on_most_productive_day": 5
}
```

---

## Settings Endpoints (`/api/settings`)

### Get All Settings
```http
GET /api/settings
```

**Description**: Get all user settings
**Authentication**: Required

**Response**:
```json
{
  "notes_enabled": true,
  "timer_enabled": true,
  "ai_url": "https://api.example.com/ai",
  "auto_lock_minutes": 10,
  "theme": "light",
  "updated_on": "2024-12-21T10:00:00.000Z"
}
```

---

### Update All Settings
```http
PUT /api/settings
```

**Description**: Update multiple settings at once
**Authentication**: Required

**Request Body** (all fields optional):
```json
{
  "notes_enabled": false,
  "timer_enabled": true,
  "ai_url": "https://api.example.com/ai",
  "auto_lock_minutes": 15,
  "theme": "dark"
}
```

**Response**:
```json
{
  "notes_enabled": false,
  "timer_enabled": true,
  "ai_url": "https://api.example.com/ai",
  "auto_lock_minutes": 15,
  "theme": "dark",
  "updated_on": "2024-12-21T10:30:00.000Z"
}
```

**Errors**:
- `400`: No data provided

---

### Update Notes Setting
```http
PUT /api/settings/notes
```

**Description**: Toggle notes feature
**Authentication**: Required

**Request Body**:
```json
{
  "enabled": false
}
```

**Response**:
```json
{
  "notes_enabled": false
}
```

---

### Update Timer Setting
```http
PUT /api/settings/timer
```

**Description**: Toggle timer feature
**Authentication**: Required

**Request Body**:
```json
{
  "enabled": true
}
```

**Response**:
```json
{
  "timer_enabled": true
}
```

---

### Update AI URL Setting
```http
PUT /api/settings/ai-url
```

**Description**: Update AI service URL
**Authentication**: Required

**Request Body**:
```json
{
  "url": "https://api.example.com/ai"
}
```

**Response**:
```json
{
  "ai_url": "https://api.example.com/ai"
}
```

---

### Update Auto-lock Setting
```http
PUT /api/settings/auto-lock
```

**Description**: Update auto-lock timeout
**Authentication**: Required

**Request Body**:
```json
{
  "minutes": 15
}
```

**Response**:
```json
{
  "auto_lock_minutes": 15
}
```

---

### Update Theme Setting
```http
PUT /api/settings/theme
```

**Description**: Update application theme
**Authentication**: Required

**Request Body**:
```json
{
  "theme": "dark"
}
```

**Response**:
```json
{
  "theme": "dark"
}
```

---

## Data Schemas

### User Schema
```json
{
  "id": "integer",
  "username": "string",
  "email": "string",
  "created_at": "datetime"
}
```

### Task Schema
```json
{
  "id": "integer",
  "title": "string (required)",
  "description": "string",
  "notes": "string",
  "done": "boolean",
  "category": "string (personal|work|shopping)",
  "priority": "boolean",
  "due_date": "date (YYYY-MM-DD)",
  "estimate_minutes": "integer",
  "order": "integer",
  "status": {
    "id": "integer",
    "name": "string"
  },
  "created_at": "datetime",
  "updated_on": "datetime",
  "closed_on": "datetime",
  "created_by": "integer"
}
```

### Journal Entry Schema
```json
{
  "id": "integer",
  "entry_date": "date (YYYY-MM-DD)",
  "content": "string (required)",
  "created_at": "datetime",
  "updated_on": "datetime"
}
```

### User Settings Schema
```json
{
  "notes_enabled": "boolean",
  "timer_enabled": "boolean",
  "ai_url": "string",
  "auto_lock_minutes": "integer",
  "theme": "string (light|dark)",
  "updated_on": "datetime"
}
```

---

## Error Handling

All endpoints return consistent error responses:

### Error Response Format
```json
{
  "error": "Error message description"
}
```

### HTTP Status Codes
- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `204 No Content`: Request successful, no content returned
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required or invalid credentials
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

---

## Development Notes

- Server runs on `http://localhost:5001` (note: port 5001, not 5000)
- CORS is enabled for frontend communication
- Database is SQLite with async support (aiosqlite)
- Session-based authentication with secure PIN hashing (SHA-256)
- All datetime fields are returned in ISO format
- Boolean fields accept `true`/`false` values
- Date fields use `YYYY-MM-DD` format