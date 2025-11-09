"""
Shared pytest fixtures for backend tests
"""

import os
import sys
from pathlib import Path
import uuid
import importlib

import pytest
import pytest_asyncio
from sqlalchemy import select

# Don't import AsyncSessionLocal at module level - it binds to the wrong engine!
# Instead, import it inside fixtures after app fixture has configured the correct engine
from backend.db.models import Status


# Ensure backend package is importable
ROOT = Path(__file__).resolve().parents[2]  # .../CSC289_GROUP2
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))


@pytest.fixture(scope="session")
def session_test_db_path(tmp_path_factory) -> Path:
    """Create a session-level temporary database directory"""
    db_dir = tmp_path_factory.mktemp("db_session")
    return db_dir


@pytest.fixture
def test_db_path(session_test_db_path) -> Path:
    """Create a temporary database file for each test"""
    return session_test_db_path / f"test_database_{uuid.uuid4().hex}.db"


def _alembic_upgrade_head(db_file: Path) -> None:
    """Run Alembic migrations to latest head on the given database file"""
    from alembic.config import Config
    from alembic import command

    alembic_cfg = Config(os.path.join(ROOT, "backend", "alembic.ini"))
    alembic_cfg.set_main_option("sqlalchemy.url", f"sqlite:///{db_file}")
    command.upgrade(alembic_cfg, "head")


@pytest.fixture
def app(test_db_path, monkeypatch):
    """Create and configure app for testing"""
    db_url = f"sqlite+aiosqlite:///{test_db_path.as_posix()}"
    
    # Dispose of any existing engine first to prevent connection leaks
    import sys
    if 'backend.db.engine_async' in sys.modules:
        try:
            from backend.db import engine_async
            import asyncio
            try:
                loop = asyncio.get_running_loop()
            except RuntimeError:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
            
            async def dispose_old_engine():
                if hasattr(engine_async, 'async_engine'):
                    await engine_async.async_engine.dispose()
            
            if not loop.is_running():
                loop.run_until_complete(dispose_old_engine())
        except Exception:
            pass  # Ignore errors during cleanup of old engine
    
    # Set environment variable BEFORE any backend imports
    monkeypatch.setenv("DATABASE_URL", db_url)
    
    # Patch the config module BEFORE it's used to create engine
    import backend.config
    monkeypatch.setattr(backend.config, "DATABASE_URL", db_url)
    
    # Force reimport of engine_async and all modules that use it to pick up new DATABASE_URL
    modules_to_reload = [
        'backend.db.engine_async',
        'backend.db.session',
        'backend.app',
        'backend.blueprints.auth.routes',
        'backend.blueprints.tasks.routes',
        'backend.blueprints.review.routes',
        'backend.blueprints.settings.routes',
        'backend.blueprints.chat.routes',
        'backend.blueprints.sessions.routes',
        'backend.blueprints.account_deletion.routes',
    ]
    for module in modules_to_reload:
        if module in sys.modules:
            del sys.modules[module]
    
    # Now import the engine module - it will create engine with test DB
    from backend.db import engine_async
    
    # Run migrations on test database
    _alembic_upgrade_head(test_db_path)

    # Import app creation (after engine is set up)
    from backend.app import create_app

    application = create_app()
    application.config.update({"TESTING": True})
    
    yield application
    
    # Cleanup: properly dispose of the test engine to free greenlet context
    import asyncio
    try:
        # Create a new event loop for cleanup if needed
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        
        # Dispose the engine synchronously
        async def cleanup():
            await engine_async.async_engine.dispose()
        
        if loop.is_running():
            # Schedule disposal
            asyncio.create_task(cleanup())
        else:
            # Run disposal
            loop.run_until_complete(cleanup())
    except Exception:
        # If disposal fails, just pass
        pass


@pytest_asyncio.fixture
async def client(app):
    """Create client for testing"""
    async with app.test_client() as c:
        yield c


async def create_user_and_login(
    client, pin="1234", username="testuser", email="testuser@example.com"
):
    """Helper to create a user and login"""
    # Create a user via setup
    setup_resp = await client.post(
        "/api/auth/setup",
        json={"pin": pin, "username": username, "email": email},
    )

    if setup_resp.status_code not in (200, 201, 400):
        raise AssertionError(f"Unexpected setup status: {setup_resp.status_code}, {await setup_resp.get_json()}")

    # Login to set the session
    login_resp = await client.post("/api/auth/login", json={"pin": pin, "username": username})
    assert login_resp.status_code in (200, 201), (
        f"Login failed: {login_resp.status_code}, {await login_resp.get_json()}"
    )
    login_json = await login_resp.get_json()

    # Assert the contract (fail fast if it ever changes)
    assert isinstance(login_json, dict), f"expected dict, got {type(login_json)}"
    assert "user" in login_json["data"] and isinstance(login_json["data"]["user"], dict), f"expected 'user' object, got: {login_json}"
    assert "id" in login_json["data"]["user"] and isinstance(login_json["data"]["user"]["id"], int), f"expected user.id int, got: {login_json}"

    user_id = login_json["data"]["user"]["id"]
    return {"user_id": user_id, "login_response": login_json}

    # Otherwise fail
    assert False, f"Unexpected response from setup: {resp.status_code}"

@pytest_asyncio.fixture
async def seed_ai_config(client):
    """Login user via API and ensure Configuration has AI fields set for that user."""

    # Import AsyncSessionLocal here, after app fixture has configured the engine
    from backend.db.engine_async import AsyncSessionLocal
    from backend.db.models import Configuration

    login = await create_user_and_login(client)
    user_id = login["user_id"]

    async with AsyncSessionLocal() as s:
        cfg = await s.scalar(
            select(Configuration).where(Configuration.user_id == user_id).limit(1)
        )

        if cfg is None:
            # no row yet → create with AI fields populated
            cfg = Configuration(
                user_id=user_id,
                ai_api_url="http://fake",
                ai_model="fake-model",
                ai_api_key="fake-key",
            )
            s.add(cfg)
        else:
            # row exists (likely with empty AI fields) → UPDATE it
            cfg.ai_api_url = "http://fake"
            cfg.ai_model = "fake-model"
            cfg.ai_api_key = "fake-key"

        await s.commit()
        # optional: refresh to be sure
        await s.refresh(cfg)

    # also pin the session user just to be explicit in tests
    async with client.session_transaction() as sess:
        sess["user_id"] = user_id

    return {"user_id": user_id}

@pytest_asyncio.fixture
async def logged_in_client(client, seed_ai_config):
    async with client.session_transaction() as s:
        s["user_id"] = seed_ai_config["user_id"]
    return client


import pytest_asyncio

@pytest_asyncio.fixture
async def patch_llm(monkeypatch):
    """Fixture that returns a callable to patch the LLMService used by chat routes.

    Usage inside a test:
        patch_llm(FakeLLMClass)
        patch_llm(lambda: MyFake())
        patch_llm(MyFakeInstance)
    """
    def _set_llm(factory_or_cls):
        # Import fresh to avoid stale references captured during app creation
        chat_routes = importlib.import_module("backend.blueprints.chat.routes")
        if isinstance(factory_or_cls, type):
            monkeypatch.setattr(chat_routes, "LLMService", lambda: factory_or_cls())
        elif callable(factory_or_cls):
            monkeypatch.setattr(chat_routes, "LLMService", factory_or_cls)
        else:
            # Provided an instance
            monkeypatch.setattr(chat_routes, "LLMService", lambda: factory_or_cls)
    return _set_llm


@pytest_asyncio.fixture
async def ensure_todo_status(app):
    """Ensure a default 'Todo' Status exists and return it.
    Depends on app fixture to ensure database tables are created first."""
    # Import AsyncSessionLocal here, after app fixture has configured the engine
    from backend.db.engine_async import AsyncSessionLocal
    
    async with AsyncSessionLocal() as s:
        existing = (
            await s.execute(select(Status).where(Status.title == "Todo"))
        ).scalars().first()
        if existing:
            return existing
        st = Status(title="Todo", description="Default", created_by=1, color_hex="000000")
        s.add(st)
        await s.flush()
        await s.commit()
        return st
