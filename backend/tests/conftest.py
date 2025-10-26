"""
Shared pytest fixtures for backend tests
"""

import os
import sys
from pathlib import Path

import pytest
import pytest_asyncio

# Ensure backend package is importable
ROOT = Path(__file__).resolve().parents[2]  # .../CSC289_GROUP2
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

# Import app creation
from backend.app import create_app


@pytest.fixture(scope="session")
def test_db_path(tmp_path_factory) -> Path:
    """Create a temporary database file for testing"""
    return tmp_path_factory.mktemp("db") / "test_database.db"


def _alembic_upgrade_head(db_file: Path) -> None:
    """Run Alembic migrations to latest head on the given database file"""
    from alembic.config import Config
    from alembic import command

    alembic_cfg = Config(os.path.join(ROOT, "backend", "alembic", "alembic.ini"))
    alembic_cfg.set_main_option("sqlalchemy.url", f"sqlite:///{db_file}")
    command.upgrade(alembic_cfg, "head")


def _migrate_test_db(test_db_path: Path) -> None:
    """Migrate the test database to latest schema"""
    _alembic_upgrade_head(test_db_path)


@pytest.fixture
def app(test_db_path):
    """Create and configure app for testing"""
    os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{test_db_path.as_posix()}"
    application = create_app()
    application.config.update({"TESTING": True})
    return application


@pytest_asyncio.fixture
async def client(app):
    """Create client for testing"""
    async with app.test_client() as c:
        yield c


async def create_user_and_login(client, pin="1234", username="testuser"):
    """Helper to create a user and login"""
    resp = await client.post(
        "/api/auth/setup",
        json={"pin": pin, "username": username, "email": "testuser@example.com"},
    )
    if resp.status_code in (200, 201):
        return await resp.get_json()
    # If user already exists, attempt login to establish session
    if resp.status_code == 400:
        # try login
        login_resp = await client.post(
            "/api/auth/login", json={"pin": pin, "username": username}
        )
        assert login_resp.status_code in (200, 201)
        return await login_resp.get_json()
    # otherwise fail
    assert False, f"Unexpected response from setup: {resp.status_code}"
