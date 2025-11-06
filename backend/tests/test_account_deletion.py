import pytest
from quart import session
from db.models import User, Task, JournalEntry, Configuration, hash_pin


@pytest.mark.asyncio
class TestAccountDeletion:
    """Test suite for account deletion functionality"""

    async def test_delete_account_preview_requires_auth(self, client):
        """Preview endpoint should require authentication"""
        response = await client.get("/api/account/preview")
        assert response.status_code == 401

    async def test_delete_account_requires_auth(self, client):
        """Delete endpoint should require authentication"""
        response = await client.delete("/api/account")
        assert response.status_code == 401

    async def test_delete_account_preview_success(self, client, authenticated_user, db_session):
        """Preview should return account data summary"""
        user_id = authenticated_user["user_id"]

        # Create some test data
        # Add a task
        task = Task(
            title="Test Task",
            description="Test Description",
            status_id=1,
            created_by=user_id,
        )
        db_session.add(task)

        # Add a journal entry
        from datetime import datetime

        journal = JournalEntry(
            user_id=user_id, entry_date=datetime.now(), content="Test journal entry"
        )
        db_session.add(journal)

        await db_session.commit()

        # Get preview
        response = await client.get("/api/account/preview")
        assert response.status_code == 200

        data = await response.get_json()
        assert "username" in data["data"]
        assert "data_summary" in data["data"]
        assert data["data"]["data_summary"]["tasks"] >= 1
        assert data["data"]["data_summary"]["journal_entries"] >= 1
        assert "warning" in data["data"]

    async def test_delete_account_missing_pin(self, client, authenticated_user):
        """Delete should fail without PIN"""
        response = await client.delete(
            "/api/account", json={"confirmation": "DELETE"}
        )
        assert response.status_code == 400

        data = await response.get_json()
        assert "pin" in str(data).lower()

    async def test_delete_account_wrong_confirmation(self, client, authenticated_user):
        """Delete should fail with wrong confirmation text"""
        response = await client.delete(
            "/api/account", json={"pin": "1234", "confirmation": "WRONG"}
        )
        assert response.status_code == 400

        data = await response.get_json()
        assert "confirmation" in str(data).lower()

    async def test_delete_account_invalid_pin(
        self, client, authenticated_user, db_session
    ):
        """Delete should fail with invalid PIN"""
        response = await client.delete(
            "/api/account", json={"pin": "wrong", "confirmation": "DELETE"}
        )
        assert response.status_code == 401

        data = await response.get_json()
        assert "pin" in str(data).lower()

    async def test_delete_account_success(
        self, client, authenticated_user, db_session
    ):
        """Delete should succeed with valid PIN and confirmation"""
        user_id = authenticated_user["user_id"]
        pin = "1234"  # This should match the pin used in authenticated_user fixture

        # Create some test data to verify cascade delete
        task = Task(
            title="Test Task",
            description="Test Description",
            status_id=1,
            created_by=user_id,
        )
        db_session.add(task)

        from datetime import datetime

        journal = JournalEntry(
            user_id=user_id, entry_date=datetime.now(), content="Test journal entry"
        )
        db_session.add(journal)

        config = Configuration(user_id=user_id)
        db_session.add(config)

        await db_session.commit()

        # Get counts before deletion
        from sqlalchemy import select, func

        tasks_before = await db_session.scalar(
            select(func.count(Task.id)).where(Task.created_by == user_id)
        )
        journal_before = await db_session.scalar(
            select(func.count(JournalEntry.id)).where(JournalEntry.user_id == user_id)
        )

        assert tasks_before > 0
        assert journal_before > 0

        # Delete account
        response = await client.delete(
            "/api/account", json={"pin": pin, "confirmation": "DELETE"}
        )
        assert response.status_code == 200

        data = await response.get_json()
        assert data["success"] is True
        assert "deleted_at" in data["data"]

        # Verify user is deleted
        user_exists = await db_session.scalar(
            select(func.count(User.id)).where(User.id == user_id)
        )
        assert user_exists == 0

        # Verify cascade delete worked
        tasks_after = await db_session.scalar(
            select(func.count(Task.id)).where(Task.created_by == user_id)
        )
        journal_after = await db_session.scalar(
            select(func.count(JournalEntry.id)).where(JournalEntry.user_id == user_id)
        )
        config_after = await db_session.scalar(
            select(func.count(Configuration.id)).where(Configuration.user_id == user_id)
        )

        assert tasks_after == 0
        assert journal_after == 0
        assert config_after == 0

    async def test_delete_account_clears_session(
        self, client, authenticated_user, db_session
    ):
        """Delete should clear the session after successful deletion"""
        pin = "1234"

        # Verify session exists before deletion
        async with client.session_transaction() as sess:
            assert "user_id" in sess

        # Delete account
        response = await client.delete(
            "/api/account", json={"pin": pin, "confirmation": "DELETE"}
        )
        assert response.status_code == 200

        # Verify session is cleared
        async with client.session_transaction() as sess:
            assert "user_id" not in sess
