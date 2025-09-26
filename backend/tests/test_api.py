"""
Tests for general API flows: health check, homepage, and full task CRUD workflow.

This file uses a temporary SQLite file-backed database so async SQLAlchemy
connections share the same file during tests. It verifies creating a user,
listing/creating/updating/deleting tasks and basic health/home endpoints.
"""

import os
import pytest
import pytest_asyncio
from datetime import datetime
import tempfile

# Use a temporary file SQLite DB for tests so the async engine and connections share the same file.
tmp_db = tempfile.NamedTemporaryFile(prefix='test_taskline_', suffix='.db', delete=False)
os.environ['DATABASE_URL'] = f"sqlite+aiosqlite:///{tmp_db.name}"

from backend.app import create_app, initialize_database


@pytest.fixture
def app():
    app = create_app()
    app.config['TESTING'] = True
    return app


@pytest_asyncio.fixture
async def client(app):
    # Ensure DB tables are created for the test run
    await initialize_database()
    async with app.test_client() as c:
        yield c


async def create_user_and_login(client, pin='1234', username='testuser'):
    resp = await client.post('/api/auth/setup', json={'pin': pin, 'username': username})
    if resp.status_code in (200, 201):
        return await resp.get_json()
    # If user already exists, attempt login to establish session
    if resp.status_code == 400:
        # try login
        login_resp = await client.post('/api/auth/login', json={'pin': pin})
        assert login_resp.status_code in (200, 201)
        return await login_resp.get_json()
    # otherwise fail
    assert False, f"Unexpected response from setup: {resp.status_code}"


@pytest.mark.asyncio
async def test_home_and_health(client):
    resp = await client.get('/')
    assert resp.status_code == 200
    data = await resp.get_json()
    assert 'message' in data

    resp = await client.get('/api/health')
    assert resp.status_code == 200
    data = await resp.get_json()
    assert data['status'] == 'healthy'


@pytest.mark.asyncio
async def test_task_crud_workflow(client):
    # create user & authenticate
    await create_user_and_login(client)

    # initially no tasks
    resp = await client.get('/api/tasks/')
    assert resp.status_code == 200
    tasks = await resp.get_json()
    assert isinstance(tasks, list)
    assert len(tasks) == 0

    # create a task
    resp = await client.post('/api/tasks/', json={'title': 'Async Test Task'})
    assert resp.status_code in (200, 201)
    created = await resp.get_json()
    if isinstance(created, dict) and 'task_id' in created:
        task_id = created['task_id']
    else:
        task_id = created.get('id')

    # fetch task
    resp = await client.get(f'/api/tasks/{task_id}')
    assert resp.status_code == 200
    task = await resp.get_json()
    assert task['title'] == 'Async Test Task'

    # update task
    resp = await client.put(f'/api/tasks/{task_id}', json={'title': 'Updated Async Task', 'done': True})
    assert resp.status_code == 200
    updated = await resp.get_json()
    assert updated['title'] == 'Updated Async Task'
    assert updated['done'] is True

    # delete task
    resp = await client.delete(f'/api/tasks/{task_id}')
    assert resp.status_code == 204

    # confirm deleted
    resp = await client.get(f'/api/tasks/{task_id}')
    assert resp.status_code == 404
