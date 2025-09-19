import os
import tempfile
import pytest
import pytest_asyncio

# Use a temporary file DB so in-memory multi-connection issues do not occur
tmp_db = tempfile.NamedTemporaryFile(prefix='test_taskline_', suffix='.db', delete=False)
os.environ['DATABASE_URL'] = f"sqlite+aiosqlite:///{tmp_db.name}"

from app import create_app, initialize_database

pytest_plugins = "pytest_asyncio"

@pytest.fixture
def app():
    app = create_app()
    app.config['TESTING'] = True
    return app

@pytest_asyncio.fixture
async def client(app):
    await initialize_database()
    async with app.test_client() as c:
        yield c

@pytest.mark.asyncio
async def test_home(client):
    resp = await client.get('/')
    assert resp.status_code == 200
    data = await resp.get_json()
    assert data['message'].startswith('Welcome to')

@pytest.mark.asyncio
async def test_health(client):
    resp = await client.get('/api/health')
    assert resp.status_code == 200
    data = await resp.get_json()
    assert data['status'] == 'healthy'
    assert data['database'] == 'connected'
