"""
Tests for account deletion functionality

Tests the account deletion feature including:
- Preview deletion data
- Delete account with proper authentication
- Cascade deletion of all user data
- Session clearing after deletion
"""

import pytest
from conftest import create_user_and_login
from sqlalchemy import select, func
from backend.db.models import User, Task, JournalEntry, Configuration, Conversation, UserSession


@pytest.mark.asyncio
async def test_delete_account_preview_requires_auth(client):
    """Preview endpoint should require authentication"""
    resp = await client.get("/api/account/preview")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_delete_account_requires_auth(client):
    """Delete endpoint should require authentication"""
    resp = await client.delete("/api/account")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_delete_account_preview_success(client):
    """Preview should return account data summary"""
    # Create user and login
    await create_user_and_login(client)

    # Create a task via API
    await client.post('/api/tasks/', json={
        'title': 'Test Task for Deletion',
        'description': 'This will be deleted'
    })

    # Create a journal entry via API
    from datetime import datetime
    await client.post('/api/review/journal', json={
        'entry_date': datetime.now().isoformat(),
        'content': 'Test journal entry for deletion'
    })

    # Get preview
    resp = await client.get("/api/account/preview")
    assert resp.status_code == 200

    data = await resp.get_json()
    assert data['success'] is True
    preview = data['data']
    
    assert 'username' in preview
    assert preview['username'] == 'testuser'
    assert 'data_summary' in preview
    assert preview['data_summary']['tasks'] >= 1
    assert preview['data_summary']['journal_entries'] >= 1
    assert 'warning' in preview
    assert 'cannot be undone' in preview['warning'].lower()


@pytest.mark.asyncio
async def test_delete_account_missing_pin(client):
    """Delete should fail without PIN"""
    await create_user_and_login(client)
    
    resp = await client.delete(
        "/api/account", 
        json={"confirmation": "DELETE"}
    )
    assert resp.status_code == 400

    data = await resp.get_json()
    assert data['success'] is False
    assert 'pin' in str(data).lower()


@pytest.mark.asyncio
async def test_delete_account_wrong_confirmation(client):
    """Delete should fail with wrong confirmation text"""
    await create_user_and_login(client)
    
    resp = await client.delete(
        "/api/account", 
        json={"pin": "1234", "confirmation": "WRONG"}
    )
    assert resp.status_code == 400

    data = await resp.get_json()
    assert data['success'] is False
    assert 'confirmation' in str(data).lower() or 'delete' in str(data).lower()


@pytest.mark.asyncio
async def test_delete_account_invalid_pin(client):
    """Delete should fail with invalid PIN"""
    await create_user_and_login(client)
    
    resp = await client.delete(
        "/api/account", 
        json={"pin": "9999", "confirmation": "DELETE"}
    )
    assert resp.status_code == 401

    data = await resp.get_json()
    assert data['success'] is False
    assert 'pin' in str(data).lower() or 'invalid' in str(data).lower()


@pytest.mark.asyncio
async def test_delete_account_success_and_cascade(client, app):
    """Delete should succeed with valid PIN and confirmation, and cascade delete all data"""
    # Create user and login
    login_data = await create_user_and_login(client)
    
    # Create some test data via API
    # Create a task
    task_resp = await client.post('/api/tasks/', json={
        'title': 'Test Task',
        'description': 'Test Description'
    })
    assert task_resp.status_code in (200, 201)

    # Create a journal entry
    from datetime import datetime
    journal_resp = await client.post('/api/review/journal', json={
        'entry_date': datetime.now().isoformat(),
        'content': 'Test journal entry'
    })
    assert journal_resp.status_code in (200, 201)

    # Get the user_id from session (we'll need it after deletion to verify)
    from backend.db.engine_async import AsyncSessionLocal
    
    async with AsyncSessionLocal() as db_session:
        # Find the user to get their ID
        result = await db_session.execute(
            select(User).where(User.username == "testuser")
        )
        user = result.scalar_one_or_none()
        assert user is not None
        user_id = user.id

        # Verify data exists before deletion
        tasks_before = await db_session.scalar(
            select(func.count(Task.id)).where(Task.created_by == user_id)
        )
        journal_before = await db_session.scalar(
            select(func.count(JournalEntry.id)).where(JournalEntry.user_id == user_id)
        )
        
        assert tasks_before >= 1, "Should have at least one task"
        assert journal_before >= 1, "Should have at least one journal entry"

    # Delete account
    resp = await client.delete(
        "/api/account", 
        json={"pin": "1234", "confirmation": "DELETE"}
    )
    assert resp.status_code == 200

    data = await resp.get_json()
    assert data['success'] is True
    assert 'deleted_at' in data['data']
    assert 'message' in data['data']

    # Verify user and all data is deleted
    async with AsyncSessionLocal() as db_session:
        # User should not exist
        user_exists = await db_session.scalar(
            select(func.count(User.id)).where(User.id == user_id)
        )
        assert user_exists == 0, "User should be deleted"

        # All related data should be cascade deleted
        tasks_after = await db_session.scalar(
            select(func.count(Task.id)).where(Task.created_by == user_id)
        )
        journal_after = await db_session.scalar(
            select(func.count(JournalEntry.id)).where(JournalEntry.user_id == user_id)
        )
        config_after = await db_session.scalar(
            select(func.count(Configuration.id)).where(Configuration.user_id == user_id)
        )
        
        assert tasks_after == 0, "All tasks should be deleted"
        assert journal_after == 0, "All journal entries should be deleted"
        assert config_after == 0, "Configuration should be deleted"


@pytest.mark.asyncio
async def test_delete_account_clears_session(client):
    """Delete should clear the session after successful deletion"""
    # Create user and login
    await create_user_and_login(client)

    # Delete account
    resp = await client.delete(
        "/api/account", 
        json={"pin": "1234", "confirmation": "DELETE"}
    )
    assert resp.status_code == 200

    # Try to access a protected endpoint - should fail because session is cleared
    protected_resp = await client.get("/api/tasks/")
    assert protected_resp.status_code == 401, "Session should be cleared after account deletion"


@pytest.mark.asyncio
async def test_cannot_login_after_account_deletion(client):
    """Should not be able to login after account is deleted"""
    # Create user and login
    await create_user_and_login(client, username="deletetest", pin="1234")

    # Delete account
    resp = await client.delete(
        "/api/account", 
        json={"pin": "1234", "confirmation": "DELETE"}
    )
    assert resp.status_code == 200

    # Try to login with the deleted account
    login_resp = await client.post(
        "/api/auth/login",
        json={"pin": "1234", "username": "deletetest"}
    )
    assert login_resp.status_code == 401, "Should not be able to login with deleted account"
