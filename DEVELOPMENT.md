# Development Guide - Task Line

This guide provides comprehensive instructions for setting up, running, and contributing to the Task Line project. Whether you're a new developer joining the team or setting up the project on a new machine, this guide will get you up and running quickly.

## Prerequisites

### Required Software

1. **Python 3.8 or higher**
   - Download from [python.org](https://python.org)
   - Verify installation: `python --version`

2. **Node.js 16 or higher**
   - Download from [nodejs.org](https://nodejs.org)
   - Verify installation: `node --version` and `npm --version`

3. **PowerShell** (for development scripts)
   - Windows: Pre-installed
   - macOS/Linux: Install PowerShell Core

4. **Git**
   - Download from [git-scm.com](https://git-scm.com)
   - Configure with your name and email:
     ```bash
     git config --global user.name "Your Name"
     git config --global user.email "your.email@example.com"
     ```

### Recommended Tools

- **VS Code** with extensions:
  - Python
  - TypeScript and JavaScript
  - Tailwind CSS IntelliSense
  - Prettier - Code formatter
  - ESLint
- **SQLite browser** for database inspection
- **Postman** or **Thunder Client** for API testing

## Project Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd CSC289_GROUP2
```

### 2. Backend Setup

```powershell
# Navigate to backend directory
cd backend

# Create virtual environment (optional but recommended)
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\Activate.ps1
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Verify installation
python -c "import quart; print('Backend setup successful!')"
```

### 3. Frontend Setup

```powershell
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Verify installation
npm run type-check
```

## Running the Application

### Development Servers

The project includes PowerShell scripts for easy development server management.

#### Backend Server

```powershell
# From project root
.\run-backend.ps1
```

This script will:
- Navigate to the backend directory
- Activate the virtual environment (if it exists)
- Install/update dependencies
- Initialize the database
- Start the development server on `http://localhost:5001`

**Manual backend startup:**
```bash
cd backend
python app.py
```

#### Frontend Server

```powershell
# From project root (in a separate terminal)
.\run-frontend.ps1
```

This script will:
- Navigate to the frontend directory
- Install/update dependencies
- Start the Vite development server on `http://localhost:5173`

**Manual frontend startup:**
```bash
cd frontend
npm run dev
```

### Accessing the Application

1. **Frontend**: `http://localhost:5173`
2. **Backend API**: `http://localhost:5001`
3. **Health Check**: `http://localhost:5001/api/health`

## Development Workflow

### Branch Strategy

- **main**: Production-ready code
- **dev**: Integration branch for development
- **feature branches**: Individual feature development (e.g., `feature/task-board`, `feature/user-settings`)

### Working on Features

1. **Create a feature branch**:
   ```bash
   git checkout dev
   git pull origin dev
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following the coding standards below

3. **Test your changes**:
   ```bash
   # Backend tests
   cd backend && pytest

   # Frontend tests
   cd frontend && npm test
   ```

4. **Commit your changes**:
   ```bash
   git add .
   git commit -m "feat: add user authentication system"
   ```

5. **Push and create a pull request**:
   ```bash
   git push origin feature/your-feature-name
   ```

### Commit Message Convention

Follow [Conventional Commits](https://conventionalcommits.org/):

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

Examples:
```
feat: add kanban board view for tasks
fix: resolve PIN validation error on login
docs: update API endpoint documentation
test: add unit tests for task creation
```

## Code Style Guidelines

### Backend (Python)

**Tools**:
- **Black**: Code formatting
- **Ruff**: Linting
- **pytest**: Testing

**Style Rules**:
- Line length: 88 characters (Black default)
- Use type hints for function parameters and return values
- Follow PEP 8 naming conventions
- Use async/await for all database operations

**Example**:
```python
from typing import Optional
from quart import Blueprint, jsonify, request
from models import Task

async def create_task(task_data: dict) -> Optional[Task]:
    """Create a new task with validation."""
    if not task_data.get('title'):
        raise ValueError("Title is required")

    task = Task(
        title=task_data['title'],
        description=task_data.get('description', ''),
        priority=task_data.get('priority', False)
    )

    return task
```

### Frontend (TypeScript/React)

**Tools**:
- **Prettier**: Code formatting
- **ESLint**: Linting and best practices
- **TypeScript**: Type checking

**Style Rules**:
- Use functional components with hooks
- Prefer named exports over default exports
- Use TypeScript interfaces for props and data structures
- Follow React hooks rules (use ESLint plugin)

**Example**:
```typescript
interface TaskProps {
  task: Task;
  onUpdate: (task: Task) => void;
  onDelete: (id: number) => void;
}

export const TaskItem = ({ task, onUpdate, onDelete }: TaskProps) => {
  const [isEditing, setIsEditing] = useState(false);

  const handleStatusChange = useCallback(() => {
    onUpdate({ ...task, done: !task.done });
  }, [task, onUpdate]);

  return (
    <div className="flex items-center space-x-3 p-3 border rounded-lg">
      <input
        type="checkbox"
        checked={task.done}
        onChange={handleStatusChange}
        className="w-4 h-4"
      />
      <span className={task.done ? 'line-through text-gray-500' : ''}>
        {task.title}
      </span>
    </div>
  );
};
```

## Testing

### Backend Testing

**Framework**: pytest with async support

**Running Tests**:
```bash
cd backend

# Run all tests
pytest

# Run with coverage
pytest --cov=.

# Run specific test file
pytest tests/test_auth.py

# Run with verbose output
pytest -v
```

**Test Structure**:
```python
import pytest
from quart import Quart
from app import create_app

@pytest.fixture
async def app():
    """Create test app instance."""
    app = create_app()
    app.config['TESTING'] = True
    return app

@pytest.fixture
async def client(app):
    """Create test client."""
    return app.test_client()

async def test_create_task(client):
    """Test task creation endpoint."""
    response = await client.post('/api/tasks', json={
        'title': 'Test Task',
        'description': 'Test Description'
    })

    assert response.status_code == 201
    data = await response.get_json()
    assert data['title'] == 'Test Task'
```

### Frontend Testing

**Framework**: Vitest + React Testing Library

**Running Tests**:
```bash
cd frontend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

**Test Structure**:
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TaskItem } from '../TaskItem';

describe('TaskItem', () => {
  const mockTask = {
    id: 1,
    title: 'Test Task',
    done: false,
    priority: false,
  };

  it('renders task title', () => {
    render(
      <TaskItem
        task={mockTask}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });

  it('calls onUpdate when checkbox is clicked', () => {
    const onUpdate = vi.fn();
    render(
      <TaskItem
        task={mockTask}
        onUpdate={onUpdate}
        onDelete={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('checkbox'));
    expect(onUpdate).toHaveBeenCalledWith({ ...mockTask, done: true });
  });
});
```

## Database Management

### Database Initialization

The database is automatically initialized when starting the backend server. However, you can manually manage it:

```python
# Initialize database
python debug_init_db.py

# View current database state
python -c "
import asyncio
from db_async import AsyncSessionLocal
from models import Task, User
from sqlalchemy import select

async def check_db():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Task))
        tasks = result.scalars().all()
        print(f'Found {len(tasks)} tasks')

asyncio.run(check_db())
"
```

### Database Schema Changes

When modifying models, you may need to update the database schema:

1. **Delete the existing database** (development only):
   ```bash
   rm backend/taskline.db
   ```

2. **Restart the backend server** to recreate tables:
   ```bash
   python backend/app.py
   ```

For production environments, implement proper database migrations.

## API Testing

### Using curl

```bash
# Health check
curl http://localhost:5001/api/health

# Create a task (requires authentication)
curl -X POST http://localhost:5001/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Task", "description": "Test Description"}'

# Get all tasks
curl http://localhost:5001/api/tasks
```

### Using Python requests

```python
import requests

# Health check
response = requests.get('http://localhost:5001/api/health')
print(response.json())

# Create task
task_data = {
    'title': 'API Test Task',
    'description': 'Created via API',
    'priority': True
}
response = requests.post('http://localhost:5001/api/tasks', json=task_data)
print(response.json())
```

## Debugging

### Backend Debugging

**Console Logging**:
```python
import logging
logging.basicConfig(level=logging.DEBUG)

# In your code
print(f"Debug: Processing task {task.id}")
```

**Database Debugging**:
```python
# Enable SQLAlchemy logging
import logging
logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)
```

**Async Debugging**:
```python
import asyncio

# Debug async functions
async def debug_function():
    try:
        result = await some_async_operation()
        print(f"Result: {result}")
    except Exception as e:
        print(f"Error: {e}")
        raise

asyncio.run(debug_function())
```

### Frontend Debugging

**React DevTools**: Install browser extension for component inspection

**Console Debugging**:
```typescript
// Debug API calls
console.log('API Request:', requestData);
console.log('API Response:', response);

// Debug state changes
useEffect(() => {
  console.log('Tasks updated:', tasks);
}, [tasks]);
```

**Network Debugging**: Use browser DevTools Network tab to inspect API calls

## Common Issues & Solutions

### Backend Issues

**Port Already in Use**:
```bash
# Find process using port 5001
lsof -i :5001  # macOS/Linux
netstat -ano | findstr :5001  # Windows

# Kill the process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

**Database Locked**:
- Ensure no other processes are accessing the database
- Restart the backend server
- If persistent, delete `taskline.db` and restart

**Import Errors**:
- Verify virtual environment is activated
- Reinstall dependencies: `pip install -r requirements.txt`
- Check Python path: `python -c "import sys; print(sys.path)"`

### Frontend Issues

**Node Modules Issues**:
```bash
# Clear npm cache
npm cache clean --force

# Delete and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Build Errors**:
- Check TypeScript errors: `npm run type-check`
- Verify all imports are correct
- Check console for detailed error messages

**CORS Issues**:
- Ensure backend is running with CORS enabled
- Check that API calls use the correct URL (`http://localhost:5001`)

## Performance Optimization

### Backend Performance

- **Database Indexing**: Add indexes for frequently queried fields
- **Connection Pooling**: Configure SQLAlchemy connection pool
- **Async Operations**: Ensure all I/O operations are async
- **Caching**: Implement response caching for static data

### Frontend Performance

- **Code Splitting**: Implement route-based code splitting
- **Lazy Loading**: Load components on demand
- **Memoization**: Use React.memo for expensive components
- **Bundle Analysis**: Analyze bundle size with `npm run build --analyze`

## Security Considerations

### Development Security

- **Never commit sensitive data**: Use `.gitignore` for sensitive files
- **Environment Variables**: Store configuration in environment variables
- **Input Validation**: Validate all user inputs on both frontend and backend
- **SQL Injection Prevention**: Use parameterized queries with SQLAlchemy

### Local Development

- **HTTPS**: Consider using HTTPS for development (optional)
- **Secure Defaults**: Use secure configurations even in development
- **Regular Updates**: Keep dependencies updated

## Deployment Preparation

### Production Build

**Frontend**:
```bash
cd frontend
npm run build
# Output in dist/ directory
```

**Backend**:
```bash
cd backend
# Ensure all dependencies are listed in requirements.txt
pip freeze > requirements.txt
```

### Environment Configuration

Create environment-specific configuration files:

```python
# config.py
import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-key-change-in-production')
    DATABASE_URL = os.environ.get('DATABASE_URL', 'sqlite+aiosqlite:///taskline.db')

class DevelopmentConfig(Config):
    DEBUG = True

class ProductionConfig(Config):
    DEBUG = False
```

## Getting Help

### Internal Resources

1. **OVERVIEW.md**: Product vision and features
2. **ARCHITECTURE.md**: System design and technical details
3. **README.md**: Quick start and basic information
4. **CONTRIBUTING.md**: Team workflow and contribution guidelines

### External Resources

1. **Quart Documentation**: [pgjones.gitlab.io/quart/](https://pgjones.gitlab.io/quart/)
2. **React Documentation**: [react.dev](https://react.dev)
3. **SQLAlchemy Documentation**: [docs.sqlalchemy.org](https://docs.sqlalchemy.org)
4. **TanStack Query**: [tanstack.com/query](https://tanstack.com/query)

### Team Communication

- **Daily Standups**: Microsoft Teams
- **Code Reviews**: GitHub Pull Requests
- **Task Tracking**: Trello board
- **Technical Discussions**: GitHub Issues

### Troubleshooting Checklist

1. **Are both servers running?** (frontend:5173, backend:5001)
2. **Are dependencies up to date?** (`pip install -r requirements.txt`, `npm install`)
3. **Is the database initialized?** (Check for `taskline.db` file)
4. **Are there any console errors?** (Check browser DevTools and terminal)
5. **Is the virtual environment activated?** (For Python development)
6. **Are file permissions correct?** (Especially for database file)

Remember: When in doubt, restart both servers and check the console output for any error messages!