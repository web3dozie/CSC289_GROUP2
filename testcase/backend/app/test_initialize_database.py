"""Tests for the async `initialize_database` routine.

These tests mock dependencies to verify control flow:

1. Success: health check passes, no migrations run.
2. Recovery: first health check fails, migrations run, then success.
3. Failure: both health check and migration fail.
4. Table list: required core tables passed to health check.
"""

import pytest
import pytest_asyncio

@pytest_asyncio.fixture
def import_initialize():
    """Import and return `initialize_database` lazily so patches apply first."""
    from backend.app import initialize_database
    return initialize_database

@pytest_asyncio.fixture
def fake_config(monkeypatch):
    """Simple stand-in for `alembic.config.Config` that records the ini path."""
    class FakeConfig:
        def __init__(self, path):
            self.path = path
        def set_main_option(self, key, value):  # pragma: no cover - trivial
            pass
    monkeypatch.setattr("alembic.config.Config", FakeConfig, raising=False)
    return FakeConfig

@pytest.mark.asyncio
async def test_initialize_database_happy_path(monkeypatch, capsys, import_initialize):
    """Health check succeeds → no migrations run."""
    async def ok(*args, **kwargs):
        return True
    monkeypatch.setattr("backend.app.check_db_health", ok)

    await import_initialize()
    out = capsys.readouterr().out
    assert "Database connection and schema verified" in out
    assert "Attempting to run migrations" not in out  # no retry path entered

@pytest.mark.asyncio
async def test_initialize_database_recovers_after_migration(monkeypatch, capsys, import_initialize, fake_config):
    """First health check fails → migrations run → retry succeeds."""    
    calls = {"count": 0}

    async def health(*args, **kwargs):
        calls["count"] += 1
        if calls["count"] == 1:
            raise RuntimeError("first failure")
        return True

    monkeypatch.setattr("backend.app.check_db_health", health)

    upgraded = {"called": False}
    def fake_upgrade(cfg, rev):
        upgraded["called"] = True
        assert rev == "head"  # ensure latest migration target

    monkeypatch.setattr("alembic.command.upgrade", fake_upgrade, raising=False)

    await import_initialize()
    out = capsys.readouterr().out
    assert "Database health check failed" in out  # first attempt
    assert "Attempting to run migrations" in out
    assert upgraded["called"] is True
    assert "schema verified after migration" in out  # successful retry

@pytest.mark.asyncio
async def test_initialize_database_migration_failure(monkeypatch, capsys, import_initialize):
    """Both initial health and migration fail -> migration exception propagates."""
    async def always_fail(*args, **kwargs):
        raise RuntimeError("health fail")

    monkeypatch.setattr("backend.app.check_db_health", always_fail)

    def upgrade_fail(cfg, rev):
        raise RuntimeError("migration fail")

    monkeypatch.setattr("alembic.command.upgrade", upgrade_fail, raising=False)

    with pytest.raises(RuntimeError, match="migration fail"):
        await import_initialize()
    out = capsys.readouterr().out
    assert "Database health check failed" in out
    assert "Attempting to run migrations" in out

@pytest.mark.asyncio
async def test_initialize_database_required_tables(monkeypatch, import_initialize):
    """List of required tables passed to health check includes core domain tables."""
    captured = {}

    async def health(engine, alembic_ini_path, required_tables):
        captured["required_tables"] = required_tables
        return True

    monkeypatch.setattr("backend.app.check_db_health", health)
    await import_initialize()
    tables = captured["required_tables"]
    for expected in ("user", "status", "task", "configuration"):
        assert expected in tables