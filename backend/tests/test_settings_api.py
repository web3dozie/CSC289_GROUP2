"""
Tests for user settings e                login = await client.post("/api/auth/login", json={"pin": "1234", "username": "settings_tester"})dpoints.

Verifies retrieving and updating user settings, including toggles for notes
and timer, updating AI URL, auto-lock minutes, and theme preferences.
"""

import pytest
from conftest import create_user_and_login


@pytest.mark.asyncio
async def test_settings_endpoints(client):
    """Test user settings API endpoints"""
    # Create user and login
    await create_user_and_login(client)

    # GET settings
    r = await client.get("/api/settings")
    assert r.status_code == 200
    response_data = await r.get_json()
    assert response_data["success"] is True
    settings = response_data["data"]
    assert "notes_enabled" in settings

    # PUT update settings
    r = await client.put(
        "/api/settings",
        json={"notes_enabled": False, "timer_enabled": False, "theme": "dark"},
    )
    assert r.status_code == 200
    response_data = await r.get_json()
    assert response_data["success"] is True
    updated = response_data["data"]
    assert updated["notes_enabled"] is False
    assert updated["timer_enabled"] is False
    assert updated["theme"] == "dark"

    # PUT notes toggle
    r = await client.put("/api/settings/notes", json={"enabled": True})
    assert r.status_code == 200
    response_data = await r.get_json()
    assert response_data["success"] is True
    data = response_data["data"]
    assert data["notes_enabled"] is True

    # PUT timer toggle
    r = await client.put("/api/settings/timer", json={"enabled": True})
    assert r.status_code == 200
    response_data = await r.get_json()
    assert response_data["success"] is True
    data = response_data["data"]
    assert data["timer_enabled"] is True

    # PUT AI configuration (OpenAI-compatible)
    r = await client.put(
        "/api/settings",
        json={
            "ai_api_url": "https://generativelanguage.googleapis.com/v1beta/openai",
            "ai_model": "gemini-2.0-flash",
            "ai_api_key": "test-api-key-xyz123",
        },
    )
    assert r.status_code == 200
    response_data = await r.get_json()
    assert response_data["success"] is True
    updated = response_data["data"]
    assert (
        updated["ai_api_url"]
        == "https://generativelanguage.googleapis.com/v1beta/openai"
    )
    assert updated["ai_model"] == "gemini-2.0-flash"
    assert updated["ai_api_key"] == "test-api-key-xyz123"

    # PUT auto-lock
    r = await client.put("/api/settings/auto-lock", json={"minutes": 5})
    assert r.status_code == 200
    response_data = await r.get_json()
    assert response_data["success"] is True
    data = response_data["data"]
    assert data["auto_lock_minutes"] == 5

    # PUT theme
    r = await client.put("/api/settings/theme", json={"theme": "light"})
    assert r.status_code == 200
    response_data = await r.get_json()
    assert response_data["success"] is True
    data = response_data["data"]
    assert data["theme"] == "light"
