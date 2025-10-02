"""
Shared pytest fixtures for backend tests
"""

import os
import pytest
import pytest_asyncio
import tempfile

# Use a temporary file SQLite DB for tests so the async engine and connections share the same file.
tmp_db = tempfile.NamedTemporaryFile(prefix='test_taskline_', suffix='.db', delete=False)
os.environ['DATABASE_URL'] = f"sqlite+aiosqlite:///{tmp_db.name}"

from backend.app import create_app, initialize_database


@pytest.fixture
def app():
    """Create and configure app for testing"""
    app = create_app()
    app.config['TESTING'] = True
    return app


@pytest_asyncio.fixture
async def client(app):
    """Create test client with initialized database"""
    # Ensure DB tables are created for the test run
    await initialize_database()
    async with app.test_client() as c:
        yield c


async def create_user_and_login(client, pin='1234', username='testuser'):
    """Helper to create a user and login"""
    resp = await client.post('/api/auth/setup', json={'pin': pin, 'username': username})
    if resp.status_code in (200, 201):
        return await resp.get_json()
    # If user already exists, attempt login to establish session
    if resp.status_code == 400:
        # try login
        login_resp = await client.post('/api/auth/login', json={'pin': pin, 'username': username})
        assert login_resp.status_code in (200, 201)
        return await login_resp.get_json()
    # otherwise fail
    assert False, f"Unexpected response from setup: {resp.status_code}"
