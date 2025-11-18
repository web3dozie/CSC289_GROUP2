import pytest
import pytest_asyncio
from datetime import datetime

from backend.blueprints.chat.routes import (
    parse_action_json,
    strip_json_blocks,
    create_task_from_ai,
    update_task_action,
    archive_task_action,
    find_task_by_title,
)
# Don't import AsyncSessionLocal at module level - import it inside fixtures after app configures engine
from sqlalchemy import select
from backend.db.models import Task, Tag, Category, Status


@pytest_asyncio.fixture
async def db_session(app):
    # Use a transactional session bound to same engine context. 
    # The app fixture ensures tables are created via migrations.
    # Import AsyncSessionLocal here, after app fixture has configured the engine
    from backend.db.engine_async import AsyncSessionLocal
    
    # Ensure at least one user exists for created_by references.
    async with AsyncSessionLocal() as s:
        # Seed minimal user row if absent (id=1)
        from backend.db.models import User
        from sqlalchemy import select
        existing = (await s.execute(select(User).where(User.id == 1))).scalars().first()
        if not existing:
            u = User(username="tester", email=None, pin_hash="x", created_on=datetime.now())
            s.add(u)
            await s.flush()
            await s.commit()
        yield s


@pytest.mark.asyncio
async def test_parse_action_json_multiple_and_invalid():
    raw = (
        "Here you go.````json {\"action\": \"create_task\", \"title\": \"A\", \"due_date\": \"2030-01-01\"} ```"  # first
        + " Some text ```json {\"action\": \"update_task\", \"task_title\": \"A\", \"priority\": true} ```"  # second
        + " Bad block ```json {invalid} ``` trailing"
    )
    actions = parse_action_json(raw)
    assert len(actions) == 2
    assert actions[0]["action"] == "create_task"
    assert actions[1]["action"] == "update_task"


@pytest.mark.asyncio
async def test_strip_json_blocks_removes_and_trims():
    raw = "Intro before.```json {\"action\": \"x\"} ``` After block."\
    " More ```json {\"action\": \"y\"} ``` end"
    cleaned = strip_json_blocks(raw)
    assert "action" not in cleaned
    assert "Intro before." in cleaned
    assert cleaned.endswith("end")


@pytest.mark.asyncio
async def test_create_task_from_ai_minimal(db_session, ensure_todo_status):
    """Minimal create_task path (no category/tags) to avoid relationship IO in pure unit call.

    Rich create+tags/category behavior is covered by integration tests; here we just assert
    the helper returns an ID when required fields are present.
    """
    action = {"title": "Chat Task", "due_date": "2030-05-05T12:00:00"}
    task_id = await create_task_from_ai(db_session, user_id=1, action_data=action)
    assert isinstance(task_id, int), f"Expected int task_id, got {task_id!r}"


@pytest.mark.asyncio
async def test_create_task_from_ai_missing_fields(db_session):
    action = {"title": "", "due_date": None}
    task_id = await create_task_from_ai(db_session, user_id=1, action_data=action)
    assert task_id is None


@pytest.mark.asyncio
async def test_update_task_action_invalid_due_date(db_session, ensure_todo_status):
    status = ensure_todo_status
    t = Task(title="Update Me", due_date=datetime.now(), status_id=status.id, created_by=1)
    db_session.add(t); await db_session.flush()

    # Invalid due date should log error but not raise.
    action = {"action": "update_task", "task_title": "Update Me", "due_date": "not-a-date"}
    success = await update_task_action(db_session, 1, action)
    assert success is True  # update proceeds for other fields (none here) without crash
    # due_date unchanged (rough assertion by checking still datetime object)
    refreshed = (await db_session.execute(select(Task).where(Task.id == t.id))).scalars().first()
    assert isinstance(refreshed.due_date, datetime)


@pytest.mark.asyncio
async def test_find_task_by_title_partial_match(db_session, ensure_todo_status):
    status = ensure_todo_status
    titles = ["Daily Standup", "Write Report", "Refactor Code"]
    for ttl in titles:
        db_session.add(Task(title=ttl, due_date=datetime.now(), status_id=status.id, created_by=1))
    await db_session.flush()

    found = await find_task_by_title(db_session, 1, "report")
    assert found and found.title == "Write Report"


@pytest.mark.asyncio
async def test_archive_task_action_not_found(db_session):
    action = {"action": "archive_task", "task_title": "Missing"}
    success = await archive_task_action(db_session, 1, action)
    assert success is False
