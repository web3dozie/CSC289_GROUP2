from .models import Base
from .engine_async import async_engine


# Create db tables
async def init_models():
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
