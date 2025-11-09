import pytest
from datetime import datetime, timedelta

pytestmark = pytest.mark.asyncio

async def _seed_user_data(user_id):
    from backend.db.engine_async import AsyncSessionLocal
    from backend.db.models import Task, JournalEntry, Configuration, Status

    async with AsyncSessionLocal() as s:
        from sqlalchemy import select
        # Ensure a Status exists; pick first or create a simple one if needed
        status = (await s.execute(select(Status).limit(1))).scalars().first()
        if not status:
            # Fallback create 'Todo' status; IDs are autoincrement
            status = Status(title="Todo", description="Default", created_by=user_id, color_hex="000000")
            s.add(status)
            await s.flush()

        # Create a task for the user
        t = Task(
            title="Export me",
            description="desc",
            notes="n",
            status_id=status.id,
            due_date=datetime.now() + timedelta(days=1),
            created_on=datetime.now(),
            updated_on=datetime.now(),
            created_by=user_id,
        )
        s.add(t)

        # Create a journal entry
        j = JournalEntry(
            user_id=user_id,
            entry_date=datetime.now(),
            content="hello",
            created_at=datetime.now(),
            updated_on=datetime.now(),
        )
        s.add(j)

        # Ensure a configuration row exists
        cfg = (await s.execute(select(Configuration).where(Configuration.user_id == user_id).limit(1))).scalars().first()
        if not cfg:
            cfg = Configuration(
                user_id=user_id,
                notes_enabled=True,
                timer_enabled=True,
                ai_api_url="http://fake",
                ai_model="gpt-x",
                ai_api_key="key",
                auto_lock_minutes=10,
                theme="light",
            )
            s.add(cfg)

        await s.commit()

async def test_export_success_returns_seeded_data(logged_in_client):
    # Seed some data for the logged-in user
    async with logged_in_client.session_transaction() as s:
        user_id = s["user_id"]

    await _seed_user_data(user_id)

    resp = await logged_in_client.get("/api/export")
    assert resp.status_code == 200
    data = await resp.get_json()
    assert data["version"] == "1.0"
    # Expect lists present with at least one item each from our seed
    assert isinstance(data.get("tasks"), list) and len(data["tasks"]) >= 1
    assert isinstance(data.get("journal_entries"), list) and len(data["journal_entries"]) >= 1
    assert isinstance(data.get("settings"), list) and len(data["settings"]) >= 1

async def test_import_updates_settings_from_legacy_ai_url(logged_in_client):
    # Existing settings come from seed_ai_config fixture; update them using legacy field
    payload = {
        "version": "1.0",
        "settings": [
            {
                "ai_url": "http://legacy-endpoint",
                "notes_enabled": False,
                "timer_enabled": True,
                "auto_lock_minutes": 5,
                "theme": "dark",
            }
        ],
    }

    resp = await logged_in_client.post("/api/import", json=payload)
    assert resp.status_code == 200
    body = await resp.get_json()
    assert body["success"] is True
    assert body["imported"]["settings"] == 1

    # Verify DB row was updated
    from backend.db.engine_async import AsyncSessionLocal
    from backend.db.models import Configuration
    from sqlalchemy import select

    async with AsyncSessionLocal() as s:
        async with logged_in_client.session_transaction() as sess:
            user_id = sess["user_id"]
        cfg = (await s.execute(select(Configuration).where(Configuration.user_id == user_id))).scalars().first()
        assert cfg is not None
        assert cfg.ai_api_url == "http://legacy-endpoint"
        assert cfg.notes_enabled is False
        assert cfg.auto_lock_minutes == 5
        assert cfg.theme == "dark"

async def test_import_creates_task_and_journal_entry(logged_in_client):
    # Minimal valid payload that should insert one task and one journal entry
    now = datetime.now().replace(microsecond=0)
    payload = {
        "version": "1.0",
        "tasks": [
            {
                "title": "From import",
                # omit status to hit default mapping, omit due_date to use now()
                "done": False,
            }
        ],
        "journal_entries": [
            {
                "entry_date": now.isoformat(),
                "content": "imported!",
            }
        ],
    }

    resp = await logged_in_client.post("/api/import", json=payload)
    assert resp.status_code == 200
    body = await resp.get_json()
    assert body["success"] is True
    assert body["imported"]["tasks"] == 1
    assert body["imported"]["journal_entries"] == 1

    # Verify they exist in DB for this user
    from backend.db.engine_async import AsyncSessionLocal
    from backend.db.models import Task, JournalEntry
    from sqlalchemy import select

    async with AsyncSessionLocal() as s:
        async with logged_in_client.session_transaction() as sess:
            user_id = sess["user_id"]
        task = (await s.execute(select(Task).where(Task.created_by == user_id, Task.title == "From import"))).scalars().first()
        assert task is not None
        entry = (await s.execute(select(JournalEntry).where(JournalEntry.user_id == user_id, JournalEntry.content == "imported!"))).scalars().first()
        assert entry is not None
