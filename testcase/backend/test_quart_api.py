"""
Lightweight Quart app smoke tests.

Verifies the homepage and /api/health endpoint behave as expected. Uses a
temporary file-backed SQLite database to avoid in-memory multi-connection
issues when running the async engine.
"""

import os
import tempfile
import pytest
import pytest_asyncio

from conftest import create_user_and_login

pytest_plugins = "pytest_asyncio"


@pytest.mark.asyncio
async def test_home(client):
    await create_user_and_login(client)

    resp = await client.get("/")
    assert resp.status_code == 200
    data = await resp.get_json()
    assert data["message"].startswith("Welcome to")


@pytest.mark.asyncio
async def test_health(client):
    await create_user_and_login(client)

    resp = await client.get("/api/health")
    assert resp.status_code == 200
    data = await resp.get_json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"
