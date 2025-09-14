# Momentum Task Manager — Backend API

A small, clean Flask API for managing tasks. It's easy to run on your Mac, simple to extend in later phases, and straightforward for frontend teammates to integrate with.

---

## Features

- **CRUD for tasks** at `/api/tasks`
- **SQLite** storage (auto-creates `momentum.db`)
- **CORS** enabled (frontend on another port can call the API)
- **Consistent JSON errors** (`{ "error": "message" }`)
- **Health check** at `/api/health`
- **Unit tests** covering health, CRUD, and validation
- Optional: **basic rate limiting** if `flask-limiter` is installed

---

## Quick Start (macOS)

```bash
# Go to the project
cd momentum-app

# Create & activate a virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -U pip
pip install -r requirements.txt

# (Optional) install rate limiting support
# pip install flask-limiter

# Run the server
python app.py
# Server runs at http://127.0.0.1:8000
```

---

## API Endpoints

| Method | Endpoint          | Description       |
| :----: | ----------------- | ----------------- |
|   GET  | `/api/tasks`      | List all tasks    |
|  POST  | `/api/tasks`      | Create new task   |
|   GET  | `/api/tasks/{id}` | Get specific task |
|   PUT  | `/api/tasks/{id}` | Update task       |
| DELETE | `/api/tasks/{id}` | Delete task       |
|   GET  | `/api/health`     | Health check      |

---

## Example Usage (curl)

### Create a task
```bash
curl -X POST http://127.0.0.1:8000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Learn Flask"}'
```

**Example response:**
```json
{
  "id": 2,
  "title": "Learn Flask",
  "done": false,
  "created_at": "2025-09-13T15:47:22.999366"
}
```

### List all tasks
```bash
curl http://127.0.0.1:8000/api/tasks
```

### Get a task by id
```bash
curl http://127.0.0.1:8000/api/tasks/2
```

### Update a task
```bash
curl -X PUT http://127.0.0.1:8000/api/tasks/2 \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated title", "done": true}'
```

### Delete a task
```bash
curl -X DELETE http://127.0.0.1:8000/api/tasks/2
```

### Error format
```json
{ "error": "Task not found" }
```

---

## Testing

You don't need the server running; tests use an in-memory SQLite DB.

```bash
# pytest (recommended)
python -m pytest tests/ -v

# unittest (built-in)
python -m unittest -v tests/test_api.py
```

---

## Status

**Phase 1: Complete** 
CRUD working, tests passing (14/14), ready for frontend.