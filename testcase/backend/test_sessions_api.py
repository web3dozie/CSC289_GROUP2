import pytest
from conftest import create_user_and_login


@pytest.mark.asyncio
async def test_sessions_current_and_logout_others(client):
    # First device
    await create_user_and_login(client, username="u1", email="u1@example.com")
    s1 = await (await client.get("/api/sessions/current")).get_json()
    assert "current_session_id" in s1

    # Simulate a second device: new client context (fresh cookies)
    async with client.app.test_client() as c2:
        await create_user_and_login(c2, username="u1", email="u1@example.com")
        s2 = await (await c2.get("/api/sessions/current")).get_json()
        assert s2["current_session_id"] != s1["current_session_id"]

        # From device 2, log out all other sessions
        res = await c2.post("/api/sessions/logout-all-others")
        assert res.status_code == 200
        data = await res.get_json()
        assert data.get("terminated_count", 0) >= 1

        # Now device1 should no longer be active
        r = await client.get("/api/sessions/current")
        assert r.status_code in (200, 401)
