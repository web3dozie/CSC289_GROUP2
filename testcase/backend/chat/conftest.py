import pytest_asyncio
import importlib
from backend.db.engine_async import AsyncSessionLocal
from backend.db.models import Status
from sqlalchemy import select


@pytest_asyncio.fixture
async def patch_llm(monkeypatch):
    """Fixture returning a helper to patch the LLMService used by chat routes.

    Usage:
        set_llm = patch_llm
        set_llm(MyFakeLLM)  # class or factory returning an instance
    """
    def _set_llm(factory_or_cls):
        # Import the routes module fresh each time to avoid stale references
        chat_routes = importlib.import_module("backend.blueprints.chat.routes")
        # Accept class, callable factory, or instance
        if isinstance(factory_or_cls, type):
            monkeypatch.setattr(chat_routes, "LLMService", lambda: factory_or_cls())
        elif callable(factory_or_cls):
            monkeypatch.setattr(chat_routes, "LLMService", factory_or_cls)
        else:
            # instance
            monkeypatch.setattr(chat_routes, "LLMService", lambda: factory_or_cls)
    return _set_llm


@pytest_asyncio.fixture
async def ensure_todo_status():
    """Ensure a default 'Todo' Status exists for tests that write Tasks directly.

    Returns the Status row.
    """
    async with AsyncSessionLocal() as s:
        existing = (await s.execute(select(Status).where(Status.title == "Todo"))).scalars().first()
        if existing:
            return existing
    st = Status(title="Todo", description="Default", created_by=1, color_hex="000000")
    s.add(st)
    await s.flush()
    await s.commit()
    return st
