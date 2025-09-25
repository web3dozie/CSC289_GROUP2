import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession


DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///local.db")

# Create engine
async_engine = create_async_engine(
    DATABASE_URL,
    echo=False,
)

# Session factory
AsyncSessionLocal = async_sessionmaker(
    bind=async_engine, class_=AsyncSession, expire_on_commit=False
)
