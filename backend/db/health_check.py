"""Database health check utility module."""

from __future__ import annotations
from collections.abc import Iterable
from sqlalchemy import text, inspect
from sqlalchemy.ext.asyncio import AsyncEngine
from sqlalchemy.engine import Connection
from alembic.config import Config
from alembic.script import ScriptDirectory
from alembic.runtime.migration import MigrationContext


# Synchronous helper functions
def list_tables(sync_conn: Connection) -> set[str]:
    """List all tables in the connected database."""
    inspector = inspect(sync_conn)
    return set(inspector.get_table_names())


def get_current_revision(sync_conn: Connection) -> str | None:
    """Get the current Alembic revision from the database."""
    ctx = MigrationContext.configure(sync_conn)
    return ctx.get_current_revision()


def get_head_revision(alembic_ini_path: str) -> str:
    """Get the latest (head) Alembic revision from the migration scripts."""
    alembic_cfg = Config(str(alembic_ini_path))
    script = ScriptDirectory.from_config(alembic_cfg)
    return script.get_current_head()


async def check_db_health(
    engine: AsyncEngine, required_tables: Iterable[str], alembic_ini_path: str
):
    """Check if the database is reachable and has the required tables.

    Args:
        engine: Async SQLAlchemy engine
        required_tables: Iterable of table names that must exist
        alembic_ini_path: Path to alembic.ini configuration file

    Raises:
        RuntimeError: If database check fails for any reason (connection,
                     missing tables, version mismatch, PRAGMA issues)
    """
    try:
        async with engine.connect() as conn:
            # Check connection
            await conn.execute(text("SELECT 1"))

            # Check for required tables
            existing_tables = await conn.run_sync(list_tables)
            missing_tables = [t for t in required_tables if t not in existing_tables]
            if missing_tables:
                raise RuntimeError(f"Missing required tables: {missing_tables}")

            # Check Alembic version
            current_rev = await conn.run_sync(get_current_revision)
            head_rev = get_head_revision(alembic_ini_path)

            print(f"Alembic current revision: {current_rev}")
            print(f"Alembic head revision: {head_rev}")

            if current_rev != head_rev:
                raise RuntimeError(
                    f"Database schema is out of date: current {current_rev}, head {head_rev}"
                )

            # Ensure PRAGMAs are set correctly for SQLite
            await conn.execute(text("PRAGMA foreign_keys=ON"))
            await conn.execute(text("PRAGMA journal_mode=WAL"))
            # Verify
            fk = (await conn.execute(text("PRAGMA foreign_keys"))).scalar()
            mode = (await conn.execute(text("PRAGMA journal_mode"))).scalar()
            if fk != 1:
                raise RuntimeError("SQLite PRAGMA foreign_keys is not ON.")
            if (mode or "").lower() != "wal":
                raise RuntimeError("SQLite PRAGMA journal_mode is not WAL.")

    except Exception as e:
        raise RuntimeError(f"Database health check failed: {e}") from e
