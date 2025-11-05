"""
Test suite for standardized API error handling

This test file demonstrates the error handling patterns and provides
test cases for various error scenarios.

To run these tests:
    python -m pytest backend/tests/test_error_handling.py -v
"""

import pytest
from backend.errors import (
    APIError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    ConflictError,
    DatabaseError,
    ServerError,
)
from conftest import create_user_and_login


class TestErrorClasses:
    """Test custom error classes"""

    def test_api_error_basic(self):
        """Test basic APIError creation"""
        error = APIError("Test error", 500)
        assert error.message == "Test error"
        assert error.status_code == 500
        assert error.details == {}

    def test_api_error_with_details(self):
        """Test APIError with details"""
        error = APIError("Test error", 400, {"field": "username"})
        assert error.details == {"field": "username"}

    def test_api_error_to_dict(self):
        """Test APIError to_dict conversion"""
        error = APIError("Test error", 400, {"field": "test"})
        result = error.to_dict()

        assert result["success"] is False
        assert result["error"]["code"] == 400
        assert result["error"]["message"] == "Test error"
        assert result["error"]["details"] == {"field": "test"}

    def test_validation_error(self):
        """Test ValidationError defaults"""
        error = ValidationError()
        assert error.status_code == 400
        assert error.message == "Validation failed"

    def test_authentication_error(self):
        """Test AuthenticationError defaults"""
        error = AuthenticationError()
        assert error.status_code == 401
        assert error.message == "Authentication required"

    def test_authorization_error(self):
        """Test AuthorizationError defaults"""
        error = AuthorizationError()
        assert error.status_code == 403
        assert error.message == "Access denied"

    def test_not_found_error(self):
        """Test NotFoundError defaults"""
        error = NotFoundError()
        assert error.status_code == 404
        assert error.message == "Resource not found"

    def test_conflict_error(self):
        """Test ConflictError defaults"""
        error = ConflictError()
        assert error.status_code == 409
        assert error.message == "Resource conflict"

    def test_database_error(self):
        """Test DatabaseError defaults"""
        error = DatabaseError()
        assert error.status_code == 500
        assert error.message == "Database operation failed"

    def test_server_error(self):
        """Test ServerError defaults"""
        error = ServerError()
        assert error.status_code == 500
        assert error.message == "Internal server error"


# Integration tests for API endpoints


class TestAuthErrorHandling:
    """Test auth endpoint error handling"""

    @pytest.mark.asyncio
    async def test_login_missing_fields(self, client):
        """Test login with missing fields returns 400"""
        response = await client.post("/api/auth/login", json={})
        assert response.status_code == 400

        data = await response.get_json()
        assert data["success"] is False
        assert data["error"]["code"] == 400
        assert "required" in data["error"]["message"].lower()

    @pytest.mark.asyncio
    async def test_login_invalid_credentials(self, client):
        """Test login with invalid credentials returns 401"""
        response = await client.post(
            "/api/auth/login",
            json={
                "username": "nonexistent",
                "pin": "1234",
                "email": "nonexistent@example.com",
            },
        )
        assert response.status_code == 401

        data = await response.get_json()
        assert data["success"] is False
        assert data["error"]["code"] == 401

    @pytest.mark.asyncio
    async def test_setup_duplicate_username(self, client):
        """Test setup with duplicate username returns 400"""
        # First create a user
        await client.post(
            "/api/auth/setup",
            json={
                "username": "duplicate_test",
                "pin": "1234",
                "email": "duplicate_test@example.com",
            },
        )

        # Try to create same user again
        response = await client.post(
            "/api/auth/setup", json={"username": "duplicate_test", "pin": "5678"}
        )

        assert response.status_code == 400
        data = await response.get_json()
        assert data["success"] is False
        assert "already exists" in data["error"]["message"].lower()


class TestTasksErrorHandling:
    """Test tasks endpoint error handling"""

    @pytest.mark.asyncio
    async def test_get_task_not_found(self, client):
        """Test getting non-existent task returns 404"""
        # Create user and login
        await create_user_and_login(client)

        response = await client.get("/api/tasks/999999")

        assert response.status_code == 404
        data = await response.get_json()
        assert data["success"] is False
        assert data["error"]["code"] == 404
        assert "not found" in data["error"]["message"].lower()

    @pytest.mark.asyncio
    async def test_create_task_missing_title(self, client):
        """Test creating task without title returns 400"""
        # Create user and login
        await create_user_and_login(client)

        # Test with empty title string
        response = await client.post("/api/tasks/", json={"title": ""})

        assert response.status_code == 400
        data = await response.get_json()
        assert data["success"] is False
        assert "title" in data["error"]["message"].lower()

    @pytest.mark.asyncio
    async def test_update_task_unauthorized(self, client):
        """Test updating task without auth returns 401"""
        response = await client.put("/api/tasks/1", json={"title": "Updated"})

        assert response.status_code == 401
        data = await response.get_json()
        assert data["success"] is False
        assert data["error"]["code"] == 401


class TestReviewErrorHandling:
    """Test review endpoint error handling"""

    @pytest.mark.asyncio
    async def test_create_journal_missing_content(self, client):
        """Test creating journal without content returns 400"""
        # Create user and login
        await create_user_and_login(client)

        response = await client.post("/api/review/journal", json={})

        assert response.status_code == 400
        data = await response.get_json()
        assert data["success"] is False
        assert "content" in data["error"]["message"].lower()

    @pytest.mark.asyncio
    async def test_update_journal_not_found(self, client):
        """Test updating non-existent journal entry returns 404"""
        # Create user and login
        await create_user_and_login(client)

        response = await client.put(
            "/api/review/journal/999999", json={"content": "Updated"}
        )

        assert response.status_code == 404
        data = await response.get_json()
        assert data["success"] is False
        assert data["error"]["code"] == 404


class TestSettingsErrorHandling:
    """Test settings endpoint error handling"""

    @pytest.mark.asyncio
    async def test_update_settings_no_data(self, client):
        """Test updating settings with no data returns 400"""
        # Create user and login
        await create_user_and_login(client)

        response = await client.put("/api/settings", json=None)

        assert response.status_code == 400
        data = await response.get_json()
        assert data["success"] is False
        assert "no data" in data["error"]["message"].lower()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
