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
    # Handle standardized format: {"success": true, "data": {"tasks": [...], "pagination": {...}}}
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
    assert updated.get('status', {}).get('name', '').lower() == 'done'

    # undo completion should fall back to todo without providing status_id
    resp = await client.put(f'/api/tasks/{task_id}', json={'done': False})
    assert resp.status_code == 200
    response_data = await resp.get_json()
    assert response_data['success'] is True
    reverted = response_data['data']
    assert reverted['done'] is False
    assert reverted.get('status', {}).get('name', '').lower() in ('todo', 'to do')

    # delete task
    resp = await client.delete(f'/api/tasks/{task_id}')
    assert resp.status_code == 204

    # confirm deleted - should return error format
    resp = await client.get(f'/api/tasks/{task_id}')
    assert resp.status_code == 404
    error_data = await resp.get_json()
    assert error_data['success'] is False
    assert error_data['error']['code'] == 404


@pytest.mark.asyncio
async def test_export_data(client):
    """Test exporting user data as JSON"""
    # create user & authenticate
    await create_user_and_login(client)

    # create some test data
    resp = await client.post('/api/tasks/', json={
        'title': 'Export Test Task',
        'description': 'Task for export testing',
        'done': False
    })
    assert resp.status_code in (200, 201)

    # export data
    resp = await client.get('/api/export')
    assert resp.status_code == 200
    data = await resp.get_json()

    # verify export structure
    assert 'version' in data
    assert 'exported_at' in data
    assert 'tasks' in data
    assert 'journal_entries' in data
    assert 'settings' in data

    assert isinstance(data['tasks'], list)
    assert isinstance(data['journal_entries'], list)
    assert isinstance(data['settings'], list)

    # verify our test task is in the export
    tasks = data['tasks']
    assert len(tasks) >= 1
    task_titles = [task['title'] for task in tasks]
    assert 'Export Test Task' in task_titles


@pytest.mark.asyncio
async def test_import_data(client):
    """Test importing user data from JSON"""
    # create user & authenticate
    await create_user_and_login(client)

    # prepare import data
    import_data = {
        'version': '1.0',
        'exported_at': '2025-10-23T16:00:00.000000',
        'tasks': [{
            'id': 999,
            'title': 'Imported Task',
            'description': 'Task imported from JSON',
            'done': False,
            'archived': False,
            'priority': False,
            'estimate_minutes': None,
            'order': 0,
            'due_date': '2025-10-25T00:00:00',
            'created_at': '2025-10-23T15:00:00',
            'updated_on': '2025-10-23T15:00:00',
            'closed_on': None,
            'created_by': 1  # will be overridden by current user
        }],
        'journal_entries': [{
            'id': 999,
            'user_id': 1,
            'entry_date': '2025-10-23T00:00:00',
            'content': 'Test journal entry',
            'created_at': '2025-10-23T15:00:00',
            'updated_on': '2025-10-23T15:00:00'
        }],
        'settings': [{
            'id': 999,
            'user_id': 1,
            'notes_enabled': True,
            'timer_enabled': False,
            'ai_url': 'http://test.ai',
            'auto_lock_minutes': 15,
            'theme': 'dark',
            'updated_on': '2025-10-23T15:00:00'
        }]
    }

    # import data
    resp = await client.post('/api/import', json=import_data)
    assert resp.status_code == 200
    data = await resp.get_json()

    # verify import response
    assert data['success'] is True
    assert 'imported' in data
    assert data['imported']['tasks'] >= 1
    assert data['imported']['journal_entries'] >= 1
    assert data['imported']['settings'] >= 1

    # verify imported task exists
    resp = await client.get('/api/tasks/')
    assert resp.status_code == 200
    tasks_data = await resp.get_json()
    tasks = tasks_data['data']['tasks']
    task_titles = [task['title'] for task in tasks]
    assert 'Imported Task' in task_titles


@pytest.mark.asyncio
async def test_import_invalid_data(client):
    """Test importing invalid data returns appropriate errors"""
    # create user & authenticate
    await create_user_and_login(client)

    # test missing version
    resp = await client.post('/api/import', json={'tasks': []})
    assert resp.status_code == 400

    # test invalid JSON structure
    resp = await client.post('/api/import', json={'version': '1.0', 'invalid': 'data'})
    assert resp.status_code == 200  # import succeeds but imports nothing


@pytest.mark.asyncio
async def test_archive_workflow(client):
    """Test complete archive workflow: archive, restore, and permanent deletion"""
    # Create user & authenticate
    await create_user_and_login(client)

    # Create a test task
    resp = await client.post('/api/tasks/', json={'title': 'Archive Test Task'})
    assert resp.status_code in (200, 201)
    created = await resp.get_json()
    assert created['success'] is True
    task_id = created['data']['task_id']

    # Archive the task
    resp = await client.put(f'/api/tasks/{task_id}', json={'archived': True})
    assert resp.status_code == 200
    response_data = await resp.get_json()
    assert response_data['success'] is True
    updated = response_data['data']
    assert updated['archived'] is True

    # Verify task does NOT appear in main task list
    resp = await client.get('/api/tasks/')
    assert resp.status_code == 200
    response_data = await resp.get_json()
    assert response_data['success'] is True
    tasks = response_data['data']['tasks']
    task_ids = [t['id'] for t in tasks]
    assert task_id not in task_ids, "Archived task should not appear in main list"

    # Verify task DOES appear in archived list
    resp = await client.get('/api/tasks/archived')
    assert resp.status_code == 200
    response_data = await resp.get_json()
    assert response_data['success'] is True
    archived_tasks = response_data['data']
    archived_ids = [t['id'] for t in archived_tasks]
    assert task_id in archived_ids, "Archived task should appear in archived list"

    # Restore the task (unarchive)
    resp = await client.put(f'/api/tasks/{task_id}', json={'archived': False})
    assert resp.status_code == 200
    response_data = await resp.get_json()
    assert response_data['success'] is True
    restored = response_data['data']
    assert restored['archived'] is False

    # Verify restored task appears in main list again
    resp = await client.get('/api/tasks/')
    assert resp.status_code == 200
    response_data = await resp.get_json()
    tasks = response_data['data']['tasks']
    task_ids = [t['id'] for t in tasks]
    assert task_id in task_ids, "Restored task should appear in main list"

    # Re-archive for permanent deletion test
    await client.put(f'/api/tasks/{task_id}', json={'archived': True})

    # Permanently delete the archived task
    resp = await client.delete(f'/api/tasks/{task_id}')
    assert resp.status_code == 204

    # Verify task no longer exists
    resp = await client.get(f'/api/tasks/{task_id}')
    assert resp.status_code == 404
    error_data = await resp.get_json()
    assert error_data['success'] is False
