
# Task Management System - Backend

## Overview
Backend API for the Task Management System built with Quart 0.18.x following project requirements. Provides PIN-based authentication, task management, and kanban board functionality.


## Architecture
- **Framework**: Quart 0.18.x (async micro-framework)
- **Database**: SQLite with async SQLAlchemy
- **Authentication**: PIN-based (4-8 digits) with session management
- **Structure**: Modular blueprints for organized routing

## Current Implementation Status

### Completed Features

#### Authentication System (/api/auth/)
- POST /api/auth/setup - Initial PIN setup (first-time user)
- POST /api/auth/login - PIN authentication with error handling
- POST /api/auth/logout - Session termination
- PUT /api/auth/pin - Change existing PIN

#### Task Management (/api/tasks/)
- GET /api/tasks/ - List all user tasks
- POST /api/tasks/ - Create new task with validation
- GET /api/tasks/kanban - Kanban board view (Todo/In Progress/Done)
- GET /api/tasks/categories - Available categories (Personal, Work, Shopping)

## Setup Instructions
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
API Testing
bash# Health check
curl http://localhost:5001/api/health

# Authentication setup
curl -X POST http://localhost:5001/api/auth/setup \
  -H "Content-Type: application/json" \

  -d '{"pin": "1234", "username": "testuser"}'
Dependencies
quart==0.18.4
quart-cors==0.7.0
SQLAlchemy==2.0.43
aiosqlite==0.20.0

