from contextlib import asynccontextmanager
from .engine_async import AsyncSessionLocal


@asynccontextmanager
async def get_session():
    async with AsyncSessionLocal() as session:
        yield session
