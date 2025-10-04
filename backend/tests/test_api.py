"""
Tests for general API flows: health check, homepage, and full task CRUD workflow.

This file uses a temporary SQLite file-backed database so async SQLAlchemy
connections share the same file during tests. It verifies creating a user,
listing/creating/updating/deleting tasks and basic health/home endpoints.
"""

import pytest
from conftest import create_user_and_login


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
    response_data = await resp.get_json()
    # Handle new standardized format: {"success": true, "data": {"tasks": [...], "pagination": {...}}}
    assert response_data['success'] is True
    tasks_data = response_data['data']
    assert isinstance(tasks_data, dict)
    assert 'tasks' in tasks_data
    assert 'pagination' in tasks_data
    tasks = tasks_data['tasks']
    assert isinstance(tasks, list)
    assert len(tasks) == 0

    # create a task
    resp = await client.post('/api/tasks/', json={'title': 'Async Test Task'})
    assert resp.status_code in (200, 201)
    created = await resp.get_json()
    # Handle new standardized format: {"success": true, "data": {"task_id": ..., "message": ...}}
    assert created['success'] is True
    task_id = created['data']['task_id']

    # fetch task
    resp = await client.get(f'/api/tasks/{task_id}')
    assert resp.status_code == 200
    response_data = await resp.get_json()
    assert response_data['success'] is True
    task = response_data['data']
    assert task['title'] == 'Async Test Task'

    # update task
    resp = await client.put(f'/api/tasks/{task_id}', json={'title': 'Updated Async Task', 'done': True})
    assert resp.status_code == 200
    response_data = await resp.get_json()
    assert response_data['success'] is True
    updated = response_data['data']
    assert updated['title'] == 'Updated Async Task'
    assert updated['done'] is True

    # delete task
    resp = await client.delete(f'/api/tasks/{task_id}')
    assert resp.status_code == 204

    # confirm deleted - should return error format
    resp = await client.get(f'/api/tasks/{task_id}')
    assert resp.status_code == 404
    error_data = await resp.get_json()
    assert error_data['success'] is False
    assert error_data['error']['code'] == 404
