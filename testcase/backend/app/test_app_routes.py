import pytest
from conftest import create_user_and_login

pytestmark = pytest.mark.asyncio

async def test_favicon_returns_204(client):
    # No auth required
    resp = await client.get("/favicon.ico")
    assert resp.status_code == 204
    # Empty body
    data = await resp.get_data()
    assert data == b""

async def test_home_includes_security_headers(client):
    await create_user_and_login(client)
    resp = await client.get("/")
    assert resp.status_code == 200
    data = await resp.get_json()
    assert "endpoints" in data and "auth" in data["endpoints"]

    # Security headers added by after_request middleware
    assert resp.headers.get("X-Content-Type-Options") == "nosniff"
    assert resp.headers.get("X-Frame-Options") == "DENY"
    assert resp.headers.get("X-XSS-Protection") == "1; mode=block"
    csp = resp.headers.get("Content-Security-Policy")
    assert csp and "default-src" in csp and "script-src" in csp
