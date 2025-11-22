import pytest
from quart import Response


@pytest.mark.asyncio
async def test_export_markdown_basic(
    logged_in_client, seed_ai_config, ensure_todo_status
):
    """
    Ensure that /api/export.md returns a Markdown file containing
    the expected sections and the seeded task for the logged-in user.
    """
    from backend.db.engine_async import AsyncSessionLocal
    from backend.db.models import Task

    client = logged_in_client
    user_id = seed_ai_config["user_id"]
    status = ensure_todo_status

    # Seed a task for this user
    async with AsyncSessionLocal() as session:
        task = Task(
            title="Markdown Export Test Task",
            description="Task created for markdown export test",
            created_by=user_id,
            status_id=status.id,
        )
        session.add(task)
        await session.commit()
        await session.refresh(task)

    # Call the Markdown export endpoint
    resp: Response = await client.get("/api/export.md")

    assert resp.status_code == 200
    assert resp.mimetype == "text/markdown"

    md_text = (await resp.get_data()).decode()

    # Header & metadata – match actual implementation
    assert md_text.startswith("# Task Line Export")
    assert "**Exported At:**" in md_text

    # Sections (you have "## Tasks (N)", etc.)
    assert "## Tasks" in md_text
    assert "## Journal Entries" in md_text
    assert "## Settings" in md_text

    # Tasks table header – loosen this to match your actual header shape
    # Example from output:
    # | ID | Title | Description | Notes | Status | Done | Archived | Priority | Estimate (min) | Order | Due Date | Created At | Updated On | Closed On |
    assert "| ID | Title | Description |" in md_text

    # Our seeded task should appear in the Markdown
    assert "Markdown Export Test Task" in md_text

    # Content-Disposition should indicate attachment with .md filename
    cd = resp.headers.get("Content-Disposition", "")
    assert "attachment" in cd
    assert "taskline_export.md" in cd


@pytest.mark.asyncio
async def test_export_markdown_no_data(logged_in_client):
    """
    When a user has no tasks/journal entries, the route should still return
    valid Markdown with the correct section headings and counts.
    """
    client = logged_in_client

    resp: Response = await client.get("/api/export.md")

    assert resp.status_code == 200
    assert resp.mimetype == "text/markdown"

    md_text = (await resp.get_data()).decode()

    # Still has header + exported timestamp
    assert md_text.startswith("# Task Line Export")
    assert "**Exported At:**" in md_text

    # Sections with counts like "## Tasks (0)", "## Journal Entries (0)"
    assert "## Tasks" in md_text
    assert "## Journal Entries" in md_text
    assert "## Settings" in md_text
    assert "## Tasks (0)" in md_text
    assert "## Journal Entries (0)" in md_text

    # We *don't* expect "_No data_", since your implementation always prints tables
    # Instead, we can sanity-check that tables still exist:
    assert "| ID | Title" in md_text


@pytest.mark.asyncio
async def test_export_markdown_requires_auth(client):
    """
    If not authenticated, /api/export.md should be blocked by @auth_required.
    Adjust expected status if your decorator redirects instead.
    """
    resp: Response = await client.get("/api/export.md")

    # Depending on auth_required behavior, might be 401/403/302
    assert resp.status_code in (401, 403, 302)
