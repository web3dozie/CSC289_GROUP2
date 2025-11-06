"""
Tests for username change functionality.

This module tests the /api/auth/username endpoint including:
- Valid username changes with correct PIN
- Validation errors (empty, too long, duplicate usernames)
- Authentication errors (wrong PIN, no authentication)
- Security logging
- Session updates
"""

import pytest
import pytest_asyncio
from backend.db.models import User, hash_pin
from backend.db.engine_async import AsyncSessionLocal
from sqlalchemy import select
from conftest import create_user_and_login


@pytest.mark.asyncio
class TestUsernameChange:
    """Test suite for username change functionality"""

    async def test_change_username_success(self, client):
        """Test successful username change with correct PIN"""
        # Create user and login
        await create_user_and_login(client, pin="1234", username="testuser1", email="testuser1@example.com")

        # Change username
        resp = await client.put(
            "/api/auth/username",
            json={"new_username": "newusername", "pin": "1234"},
        )

        assert resp.status_code == 200
        data = await resp.get_json()
        assert data["success"] is True
        assert data["data"]["username"] == "newusername"
        assert "Username updated successfully" in data["data"]["message"]

    async def test_change_username_empty(self, client):
        """Test that empty username is rejected"""
        # Create user and login
        await create_user_and_login(client, pin="1234", username="testuser2", email="testuser2@example.com")

        # Try to change to empty username
        resp = await client.put(
            "/api/auth/username",
            json={"new_username": "", "pin": "1234"},
        )

        assert resp.status_code == 400
        data = await resp.get_json()
        assert data["success"] is False
        assert "empty" in data["error"]["message"].lower()

    async def test_change_username_too_long(self, client):
        """Test that username longer than 20 characters is rejected"""
        # Create user and login
        await create_user_and_login(client, pin="1234", username="testuser3", email="testuser3@example.com")

        # Try to change to username that's too long
        resp = await client.put(
            "/api/auth/username",
            json={"new_username": "a" * 21, "pin": "1234"},
        )

        assert resp.status_code == 400
        data = await resp.get_json()
        assert data["success"] is False
        assert "too long" in data["error"]["message"].lower()

    async def test_change_username_duplicate(self, client):
        """Test that duplicate username is rejected"""
        # Create first user
        await create_user_and_login(client, pin="1234", username="testuser4", email="testuser4@example.com")
        
        # Logout
        await client.post("/api/auth/logout")
        
        # Create second user and login
        await create_user_and_login(client, pin="5678", username="testuser5", email="testuser5@example.com")

        # Try to change to existing username
        resp = await client.put(
            "/api/auth/username",
            json={"new_username": "testuser4", "pin": "5678"},
        )

        assert resp.status_code == 400
        data = await resp.get_json()
        assert data["success"] is False
        assert "already exists" in data["error"]["message"].lower()

    async def test_change_username_wrong_pin(self, client):
        """Test that wrong PIN is rejected"""
        # Create user and login
        await create_user_and_login(client, pin="1234", username="testuser6", email="testuser6@example.com")

        # Try to change with wrong PIN
        resp = await client.put(
            "/api/auth/username",
            json={"new_username": "newusername", "pin": "9999"},
        )

        assert resp.status_code == 401
        data = await resp.get_json()
        assert data["success"] is False
        assert "invalid" in data["error"]["message"].lower()

    async def test_change_username_not_authenticated(self, client):
        """Test that unauthenticated request is rejected"""
        resp = await client.put(
            "/api/auth/username",
            json={"new_username": "newusername", "pin": "1234"},
        )

        assert resp.status_code == 401
        data = await resp.get_json()
        assert data["success"] is False

    async def test_change_username_missing_fields(self, client):
        """Test that missing required fields are rejected"""
        # Create user and login
        await create_user_and_login(client, pin="1234", username="testuser7", email="testuser7@example.com")

        # Try without new_username
        resp = await client.put(
            "/api/auth/username",
            json={"pin": "1234"},
        )
        assert resp.status_code == 400

        # Try without PIN
        resp = await client.put(
            "/api/auth/username",
            json={"new_username": "newusername"},
        )
        assert resp.status_code == 400

    async def test_change_username_session_update(self, client):
        """Test that session is updated with new username"""
        # Create user and login
        await create_user_and_login(client, pin="1234", username="testuser8", email="testuser8@example.com")

        # Change username
        resp = await client.put(
            "/api/auth/username",
            json={"new_username": "newusername8", "pin": "1234"},
        )
        assert resp.status_code == 200

        # Verify we can still make authenticated requests
        # (session should be updated automatically)
        settings_resp = await client.get("/api/settings")
        assert settings_resp.status_code == 200

    async def test_change_username_whitespace_trimmed(self, client):
        """Test that whitespace is trimmed from username"""
        # Create user and login
        await create_user_and_login(client, pin="1234", username="testuser9", email="testuser9@example.com")

        # Change username with leading/trailing whitespace
        resp = await client.put(
            "/api/auth/username",
            json={"new_username": "  newusername9  ", "pin": "1234"},
        )

        assert resp.status_code == 200
        data = await resp.get_json()
        assert data["data"]["username"] == "newusername9"

    async def test_change_username_case_sensitive(self, client):
        """Test that username is case-sensitive"""
        # Create user and login
        await create_user_and_login(client, pin="1234", username="testuser10", email="testuser10@example.com")

        # Change to different case
        resp = await client.put(
            "/api/auth/username",
            json={"new_username": "TestUser10", "pin": "1234"},
        )

        assert resp.status_code == 200
        data = await resp.get_json()
        assert data["data"]["username"] == "TestUser10"

    async def test_change_username_multiple_times(self, client):
        """Test changing username multiple times"""
        # Create user and login
        await create_user_and_login(client, pin="1234", username="testuser11", email="testuser11@example.com")

        # First change
        resp = await client.put(
            "/api/auth/username",
            json={"new_username": "username11a", "pin": "1234"},
        )
        assert resp.status_code == 200

        # Second change
        resp = await client.put(
            "/api/auth/username",
            json={"new_username": "username11b", "pin": "1234"},
        )
        assert resp.status_code == 200

        # Third change
        resp = await client.put(
            "/api/auth/username",
            json={"new_username": "username11c", "pin": "1234"},
        )
        assert resp.status_code == 200
        data = await resp.get_json()
        assert data["data"]["username"] == "username11c"

