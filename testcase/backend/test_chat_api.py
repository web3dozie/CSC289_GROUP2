import pytest
from conftest import create_user_and_login


@pytest.mark.asyncio
async def test_chat_rejects_when_ai_not_configured(client):
    await create_user_and_login(client)
    r = await client.post("/api/chat/message", json={"message": "Hello"})
    assert r.status_code == 400
    data = await r.get_json()
    assert "AI API not configured" in data["error"]


@pytest.mark.asyncio
async def test_chat_executes_create_task_action(monkeypatch, client):
    await create_user_and_login(client)
    # Configure AI settings so the route won’t bail early
    await client.put(
        "/api/settings",
        json={"ai_api_url": "http://fake", "ai_model": "fake", "ai_api_key": "fake"},
    )

    class FakeLLM:
        async def get_completion(self, **kwargs):
            # response includes an action JSON block in a fenced code segment
            return (
                "Sure!\n"
                "```json\n"
                '{"action":"create_task","title":"AI task","due_date":"2030-01-01","tags":["ai"]}\n'
                "```\n"
                "Done."
            )

        async def close(self):
            pass

    monkeypatch.setattr("backend.blueprints.chat.routes.LLMService", lambda: FakeLLM())

    r = await client.post("/api/chat/message", json={"message": "make a task"})
    assert r.status_code == 200
    payload = await r.get_json()
    assert (
        "AI task" not in payload["response"]
    )  # JSON block stripped from visible reply
    # Verify task exists via tasks API
    tasks = await (await client.get("/api/tasks/")).get_json()
    titles = [t["title"] for t in tasks["data"]["tasks"]]
    assert "AI task" in titles
