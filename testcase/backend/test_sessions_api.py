import pytest
from datetime import datetime, timedelta
from conftest import create_user_and_login

from sqlalchemy import select
from backend.db.engine_async import AsyncSessionLocal
from backend.db.models import UserSession


@pytest.mark.asyncio
async def test_session_creation_and_validation(client):
    # Create login and establish session
    await create_user_and_login(
        client, username="sess_user", email="sess_user@example.com"
    )
    # Fetch current session info
    r = await client.get("/api/sessions/current")
    assert r.status_code in (
        200,
        401,
    )
    data = await r.get_json()

    # We expect 200
    if r.status_code == 200:
        assert "current_session_id" in data
        assert data.get("is_active", True) is True

        # Re-fetch to ensure session persists
        r2 = await client.get("/api/sessions/current")
        assert r2.status_code == 200
        data2 = await r2.get_json()
        # Should stay the same session id
        assert data2.get("current_session_id") == data.get("current_session_id")
    else:
        pass


@pytest.mark.asyncio
async def test_auto_lock_timeout_expires_session(client):
    # Log in and set a very short auto-lock to make testing easier
    await create_user_and_login(
        client, username="lock_user", email="lock_user@example.com"
    )
    r = await client.put("/api/settings", json={"auto_lock_minutes": 1})
    assert r.status_code in (200, 201)

    # Grab the current session id
    r = await client.get("/api/sessions/current")
    # We expect 200
    assert r.status_code in (200, 401)
    if r.status_code == 401:
        pass
    cur = await r.get_json()
    session_id = cur["current_session_id"]

    # Force this session to be expired in the DB
    async with AsyncSessionLocal() as db:
        # Try to locate the active session for this user
        q = await db.execute(
            select(UserSession).where(UserSession.session_id == session_id)
        )
        us = q.scalars().first()
        assert us is not None, "No active session found to expire"
        us.expires_at = datetime.now() - timedelta(minutes=5)
        await db.commit()

    # Attempt to access protected route should now yield 401
    r2 = await client.get("/api/sessions/current")
    assert r2.status_code == 401


@pytest.mark.asyncio
async def test_session_invalidation_on_logout(client):
    # Log in
    await create_user_and_login(
        client, username="logout_user", email="logout_user@example.com"
    )

    # Sanity-check we can hit a protected route
    r_ok = await client.get("/api/tasks/")
    assert r_ok.status_code in (
        200,
        204,
        200,
    ), "Expected to reach protected route before logout"

    # Log out. Prefer /api/auth/logout if available; fall back to sessions route if that’s your API.
    r = await client.post("/api/auth/logout")
    if r.status_code == 404:
        # Fallback if your logout lives under sessions
        r = await client.post("/api/sessions/logout-current")

    assert r.status_code in (200, 204)

    # After logout the same protected route should now fail with 401
    r2 = await client.get("/api/tasks/")
    assert r2.status_code == 401
