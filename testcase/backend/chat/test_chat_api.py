import pytest
from conftest import create_user_and_login


@pytest.mark.asyncio
async def test_chat_rejects_when_ai_not_configured(client):
    # Create User & Authenticate
    await create_user_and_login(client)
    resp = await client.post("/api/chat/message", json={"message": "Hello"})
    assert resp.status_code == 400
    data = await resp.get_json()
    assert "AI API not configured" in data["error"]


@pytest.mark.asyncio
async def test_chat_executes_create_task_action(monkeypatch, client, seed_ai_config):
    # Create User & Authenticate
    await create_user_and_login(client)

    # Patch LLMService to use our fake that returns a create_task action
    from testcase.backend.chat.fake_llm_service import FakeLLMServiceCreate
    monkeypatch.setattr("backend.blueprints.chat.routes.LLMService", lambda: FakeLLMServiceCreate())

    resp = await client.post("/api/chat/message", json={"message": "make a task"})
    assert resp.status_code == 200
    payload = await resp.get_json()
    assert (
        "AI task" in payload["response"]
    )  # JSON block stripped from visible reply
    # Verify task exists via tasks API
    tasks = await (await client.get("/api/tasks/")).get_json()
    titles = [t["title"] for t in tasks["data"]["tasks"]]
    assert "AI task" in titles


