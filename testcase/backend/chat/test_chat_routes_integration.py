import pytest

from testcase.backend.chat import fake_llm_service
from testcase.backend.conftest import create_user_and_login


@pytest.mark.asyncio
async def test_send_message_empty(monkeypatch, client, seed_ai_config):
    # seed_ai_config pins session user_id already

    resp = await client.post("/api/chat/message", json={"message": "   "})
    assert resp.status_code == 400
    body = await resp.get_json()
    assert body.get("error") == "Message cannot be empty"


@pytest.mark.asyncio
async def test_send_message_llm_failure(patch_llm, client, seed_ai_config):
    # seed_ai_config pins session user_id already

    # Patch LLM to raise using shared fake
    patch_llm(fake_llm_service.FakeLLMServiceError)

    resp = await client.post("/api/chat/message", json={"message": "hi"})
    assert resp.status_code == 500
    body = await resp.get_json()
    assert "Failed to get AI response" in body.get("error", "")


@pytest.mark.asyncio
async def test_send_message_executes_multiple_actions(patch_llm, client, seed_ai_config):
    # seed_ai_config pins session user_id already

    # Configure fake to emit create + update + archive for the same title
    patch_llm(fake_llm_service.FakeLLMServiceMultiAction)

    resp = await client.post("/api/chat/message", json={"message": "go"})
    assert resp.status_code == 200, await resp.get_json()
    body = await resp.get_json()
    acts = [a.get("action") for a in body.get("actions_executed", [])]
    # All three should be recorded in order
    assert acts == ["create_task", "update_task", "archive_task"]


@pytest.mark.asyncio
async def test_chat_history_empty_then_messages(patch_llm, client, seed_ai_config):
    # No conversation yet -> empty list (seed_ai_config pins session)

    resp = await client.get("/api/chat/history")
    assert resp.status_code == 200
    body = await resp.get_json()
    assert body["messages"] == []

    # Now send a message with a do-nothing LLM
    patch_llm(fake_llm_service.FakeLLMServiceEcho)

    send = await client.post("/api/chat/message", json={"message": "Hi"})
    assert send.status_code == 200

    # Now history should contain messages
    resp2 = await client.get("/api/chat/history")
    assert resp2.status_code == 200
    body2 = await resp2.get_json()
    assert len(body2["messages"]) >= 2


@pytest.mark.asyncio
async def test_clear_history(patch_llm, client, seed_ai_config):
    # seed_ai_config pins session user_id already

    # Ensure there's a conversation by sending a message
    patch_llm(fake_llm_service.FakeLLMServiceEcho)
    await client.post("/api/chat/message", json={"message": "Hi"})

    # Clear it
    resp = await client.post("/api/chat/clear")
    assert resp.status_code == 200
    body = await resp.get_json()
    assert body.get("success") is True

    # History now empty
    resp2 = await client.get("/api/chat/history")
    body2 = await resp2.get_json()
    assert body2["messages"] == []


# ---- Consolidated from test_chat_api.py ----

@pytest.mark.asyncio
async def test_chat_rejects_when_ai_not_configured(client):
    # Create User & Authenticate
    await create_user_and_login(client)
    resp = await client.post("/api/chat/message", json={"message": "Hello"})
    assert resp.status_code == 400
    data = await resp.get_json()
    assert "AI API not configured" in data["error"]


@pytest.mark.asyncio
async def test_chat_executes_create_task_action(patch_llm, client, seed_ai_config):
    from backend.db.engine_async import AsyncSessionLocal
    from backend.db.models import Configuration
    from sqlalchemy import select
    
    # Patch LLMService to use our fake that returns a create_task action    
    patch_llm(fake_llm_service.FakeLLMServiceCreate)

    # Set session user_id to the seeded user
    async with client.session_transaction() as session:
        session["user_id"] = seed_ai_config["user_id"]

    # Prove the config row exists for this exact user_id
    async with AsyncSessionLocal() as s:
        cfg = await s.scalar(
            select(Configuration).where(Configuration.user_id == seed_ai_config["user_id"])
        )
        assert cfg is not None, f"No Configuration for user_id={seed_ai_config['user_id']}"
        assert getattr(cfg, "ai_api_url", None), "ai_api_url missing"
        assert getattr(cfg, "ai_api_key", None), "ai_api_key missing"
        assert getattr(cfg, "ai_model", None), "ai_model missing"

    resp = await client.post("/api/chat/message", json={"message": "make a task"})
    assert resp.status_code == 200, f"Unexpected status: {resp.status_code}, {await resp.get_json()}"
    response = await resp.get_json()
    # JSON block stripped from visible reply
    assert (
        "AI task" not in response["response"]
    )
    # Verify task exists via tasks API
    tasks = await (await client.get("/api/tasks/")).get_json()
    titles = [t["title"] for t in tasks["data"]["tasks"]]
    assert "AI task" in titles

@pytest.mark.asyncio
async def test_chat_archives_task(patch_llm, client, seed_ai_config):
    title_to_archive = "To Archive"

    # Use the seeded user for the entire flow so ownership is consistent
    async with client.session_transaction() as session:
        session["user_id"] = seed_ai_config["user_id"]

    # Create a task that we will expect to be archived by the chat action
    create_resp = await client.post("/api/tasks", json={"title": title_to_archive})
    assert create_resp.status_code in (200, 201), f"Create failed: {create_resp.status_code}, {await create_resp.get_json()}"
    created = await create_resp.get_json()

    # Set injection point so fake LLM service can return the correct task_title
    fake_llm_service.INJECT_TASK_TITLE = title_to_archive

    # Patch LLMService to use our fake
    patch_llm(fake_llm_service.FakeLLMServiceArchive)

    # Verify task appears in active tasks list
    tasks_resp = await client.get("/api/tasks/")
    assert tasks_resp.status_code == 200
    tasks = await tasks_resp.get_json()
    titles = [t["title"] for t in tasks["data"]["tasks"]]
    assert title_to_archive in titles, f"Active tasks payload was: {tasks}"

    # Send chat message that triggers archive action (let real async archive_task_action run)
    resp = await client.post("/api/chat/message", json={"message": "anything"})
    body = await resp.get_json()
    assert resp.status_code == 200, f"Still 500 => bug is after actions. Body: {body}"

    # Verify the task no longer appears in the active list
    tasks_resp_after = await client.get("/api/tasks/")
    assert tasks_resp_after.status_code == 200
    tasks_after = await tasks_resp_after.get_json()
    titles_after = [t["title"] for t in tasks_after["data"]["tasks"]]
    assert title_to_archive not in titles_after, f"After-archive payload was: {tasks_after}"


@pytest.mark.asyncio
async def test_chat_completes_task(patch_llm, client, seed_ai_config):
    # Use seeded user
    async with client.session_transaction() as sess:
        sess["user_id"] = seed_ai_config["user_id"]

    # Create an initial task (should start as not done)
    create_resp = await client.post("/api/tasks", json={"title": "Finish Report"})
    assert create_resp.status_code in (200, 201)
    created_task = await create_resp.get_json()
    title = "Finish Report"

    # Verify task is initially not done
    list_resp = await client.get("/api/tasks/")
    assert list_resp.status_code == 200
    listing = await list_resp.get_json()
    task_obj = next((t for t in listing["data"]["tasks"] if t["title"] == title), None)
    assert task_obj is not None
    assert task_obj.get("done") is False

    # Stub LLMService to return a complete_task action using shared fake
    patch_llm(fake_llm_service.FakeLLMServiceComplete)

    # Send chat message (content arbitrary; stub decides action)
    resp = await client.post("/api/chat/message", json={"message": "Please complete the task"})
    assert resp.status_code == 200, f"Unexpected status {resp.status_code}, body={await resp.get_json()}"
    body = await resp.get_json()
    # Confirm action recorded
    actions = body.get("actions_executed", [])
    assert any(a.get("action") == "complete_task" for a in actions)

    # Re-fetch tasks and ensure the task is now done
    list_resp2 = await client.get("/api/tasks/")
    assert list_resp2.status_code == 200
    listing2 = await list_resp2.get_json()
    task_obj2 = next((t for t in listing2["data"]["tasks"] if t["title"] == title), None)
    assert task_obj2 is not None
    assert task_obj2.get("done") is True


@pytest.mark.asyncio
async def test_chat_updates_task(patch_llm, client, seed_ai_config):
    # Use seeded user
    async with client.session_transaction() as sess:
        sess["user_id"] = seed_ai_config["user_id"]

    # Create a task to be updated
    base_title = "Plan Trip"
    create_resp = await client.post("/api/tasks", json={"title": base_title})
    assert create_resp.status_code in (200, 201), f"Create failed: {create_resp.status_code}, {await create_resp.get_json()}"

    # Ensure it's present and capture initial values
    list_before = await (await client.get("/api/tasks/")).get_json()
    task_before = next((t for t in list_before["data"]["tasks"] if t["title"] == base_title), None)
    assert task_before is not None
    before_priority = task_before.get("priority", False)

    # Configure the fake to target our title, then patch LLMService
    fake_llm_service.INJECT_TASK_TITLE = base_title
    patch_llm(fake_llm_service.FakeLLMServiceUpdate)

    # Trigger chat message which should execute update_task
    resp = await client.post("/api/chat/message", json={"message": "update it"})
    assert resp.status_code == 200, f"Unexpected status {resp.status_code}, body={await resp.get_json()}"
    body = await resp.get_json()
    actions = body.get("actions_executed", [])
    assert any(a.get("action") == "update_task" for a in actions), f"Actions were {actions}"

    # Fetch tasks and verify changes were applied
    list_after_resp = await client.get("/api/tasks/")
    assert list_after_resp.status_code == 200
    list_after = await list_after_resp.get_json()
    task_after = next((t for t in list_after["data"]["tasks"] if t["title"] == base_title), None)
    assert task_after is not None

    # priority should now be True
    assert task_after.get("priority") is True, f"Task after: {task_after}"

    # due_date should be set to the provided ISO date
    assert task_after.get("due_date", "").startswith("2030-02-01"), f"due_date is {task_after.get('due_date')}"

    # category should be created/assigned as 'Travel' (if returned)
    category = task_after.get("category")
    if isinstance(category, dict) and category.get("name"):
        assert category.get("name") == "Travel"
    # description and estimate_minutes are optional in list payload, assert if present
    if "description" in task_after:
        assert task_after["description"] == "Updated by AI"
    if "estimate_minutes" in task_after:
        assert task_after["estimate_minutes"] == 45
