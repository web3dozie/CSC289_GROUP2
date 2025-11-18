from backend.config import DATABASE_URL
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import event

# Create engine
async_engine = create_async_engine(
    DATABASE_URL,
    echo=False,
)

# Session factory
AsyncSessionLocal = async_sessionmaker(
    bind=async_engine, class_=AsyncSession, expire_on_commit=False
)


def _apply_sqlite_pragmas(dbapi_connection, connection_record):
    """
    Runs on raw DB-API connection (even with sqlite+aiosqlite).
    No isinstance checks—just feature-detect and fail-soft.
    """
    try:
        cursor = dbapi_connection.cursor()
    except Exception:
        # Not a connection we can tweak (leave silently)
        return

    try:
        cursor.execute("PRAGMA foreign_keys = ON")
        # WAL is great for file-based DBs; may be unsupported for :memory:
        try:
            cursor.execute("PRAGMA journal_mode = WAL")
        except Exception:
            pass
        # Reasonable perf/durability tradeoff
        try:
            cursor.execute("PRAGMA synchronous = NORMAL")
        except Exception:
            pass
    finally:
        try:
            cursor.close()
        except Exception:
            pass


if DATABASE_URL.startswith("sqlite"):
    event.listen(async_engine.sync_engine, "connect", _apply_sqlite_pragmas)
