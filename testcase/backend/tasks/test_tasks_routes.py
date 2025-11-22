import pytest
import pytest_asyncio


@pytest_asyncio.fixture
async def logged_in_client(client):
    from testcase.backend.conftest import create_user_and_login
    await create_user_and_login(client)
    return client


@pytest.fixture
def create_task(logged_in_client):
    async def _create(**payload) -> int:
        if "title" not in payload:
            payload["title"] = "Task"
        resp = await logged_in_client.post("/api/tasks", json=payload)
        assert resp.status_code in (200, 201)
        body = await resp.get_json()
        return body["data"]["task_id"]
    return _create


@pytest.fixture
def list_titles(logged_in_client):
    async def _list() -> list[str]:
        body = await (await logged_in_client.get("/api/tasks/")).get_json()
        return [t["title"] for t in body["data"]["tasks"]]
    return _list


@pytest.fixture
def get_data():
    async def _unwrap(resp):
        payload = await resp.get_json()
        assert payload.get("success") is True
        return payload.get("data")
    return _unwrap


@pytest.fixture
def assert_error():
    async def _assert(resp, code: int):
        assert resp.status_code == code
        body = await resp.get_json()
        assert body["success"] is False
        assert body["error"]["code"] == code
        return body
    return _assert


@pytest.mark.asyncio
async def test_create_and_get_tasks_list(logged_in_client, create_task, list_titles):

    # Initially, list should be empty
    initial = await (await logged_in_client.get("/api/tasks/")).get_json()
    assert initial["success"] is True
    assert isinstance(initial["data"], dict)
    assert isinstance(initial["data"].get("tasks"), list)
    assert len(initial["data"]["tasks"]) == 0

    # Create a task
    task_id = await create_task(title="Write Tests")
    assert isinstance(task_id, int)

    # Fetch list again
    after = await (await logged_in_client.get("/api/tasks/")).get_json()
    titles = await list_titles()
    assert "Write Tests" in titles


@pytest.mark.asyncio
async def test_tasks_list_requires_auth(client):
    # Intentionally DO NOT create/login user; attempt access should 401
    resp = await client.get("/api/tasks/")
    assert resp.status_code == 401
    body = await resp.get_json()
    assert body["success"] is False
    assert body["error"]["code"] == 401


@pytest.mark.asyncio
async def test_create_validation_error_on_empty_title(logged_in_client, assert_error):
    resp = await logged_in_client.post("/api/tasks", json={"title": "   "})
    await assert_error(resp, 400)


@pytest.mark.asyncio
async def test_update_toggles_done_and_status(logged_in_client, create_task):
    # Create a task
    task_id = await create_task(title="Toggle Me")

    # Mark done
    put_resp = await logged_in_client.put(f"/api/tasks/{task_id}", json={"done": True})
    assert put_resp.status_code == 200
    updated = await put_resp.get_json()
    assert updated["data"].get("done") is True
    assert updated["data"].get("closed_on") is not None

    # Mark not-done
    put_resp2 = await logged_in_client.put(f"/api/tasks/{task_id}", json={"done": False})
    assert put_resp2.status_code == 200
    updated2 = await put_resp2.get_json()
    assert updated2["data"].get("done") is False
    # closed_on should clear when marking not done
    assert updated2["data"].get("closed_on") is None


@pytest.mark.asyncio
async def test_delete_task_route(logged_in_client, create_task, list_titles):
    # Create a task
    task_id = await create_task(title="Trash")

    # Delete it
    del_resp = await logged_in_client.delete(f"/api/tasks/{task_id}")
    assert del_resp.status_code == 204

    # Ensure it's gone from list
    titles = await list_titles()
    assert "Trash" not in titles


@pytest.mark.asyncio
async def test_tasks_categories(logged_in_client, create_task):
    await create_task(title="Cat A", category="Work")
    await create_task(title="Cat B", category="Personal")
    resp = await logged_in_client.get("/api/tasks/categories")
    assert resp.status_code == 200
    cats = await resp.get_json()
    assert set(["Work", "Personal"]).issubset(set(cats))

@pytest.mark.asyncio
async def test_tasks_kanban(logged_in_client, create_task, get_data):
    # Seed a task so board isn't empty
    await create_task(title="Kanban Item")
    resp = await logged_in_client.get("/api/tasks/kanban")
    assert resp.status_code == 200
    board = await get_data(resp)
    assert isinstance(board, dict)
    assert any(isinstance(col, dict) and "tasks" in col for col in board.values())

@pytest.mark.asyncio
async def test_tasks_calendar(logged_in_client, create_task):
    await create_task(title="Cal A", due_date="2030-01-01")
    await create_task(title="Cal B", due_date="2030-01-01")
    resp = await logged_in_client.get("/api/tasks/calendar")
    assert resp.status_code == 200
    cal = await resp.get_json()
    assert "2030-01-01" in cal
    assert isinstance(cal["2030-01-01"], list)
    titles = [t.get("title") for t in cal["2030-01-01"]]
    assert "Cal A" in titles and "Cal B" in titles

@pytest.mark.asyncio
async def test_tasks_archive_completed(logged_in_client, create_task):
    # Create and complete a task
    task_id = await create_task(title="To Archive", due_date="2030-01-01")
    put = await logged_in_client.put(f"/api/tasks/{task_id}", json={"done": True})
    assert put.status_code == 200
    # Archive completed
    arch_resp = await logged_in_client.post("/api/tasks/archive-completed")
    assert arch_resp.status_code == 200
    arch = await arch_resp.get_json()
    assert arch["data"]["archived_count"] >= 1


@pytest.mark.asyncio
async def test_task_get_not_found(logged_in_client, assert_error):
    resp = await logged_in_client.get("/api/tasks/9999")
    await assert_error(resp, 404)


@pytest.mark.asyncio
async def test_task_update_not_found(logged_in_client, assert_error):
    resp = await logged_in_client.put("/api/tasks/9999", json={"title": "Nope"})
    await assert_error(resp, 404)


@pytest.mark.asyncio
async def test_task_delete_not_found(logged_in_client, assert_error):
    resp = await logged_in_client.delete("/api/tasks/9999")
    await assert_error(resp, 404)


@pytest.mark.asyncio
async def test_create_invalid_title_too_long(logged_in_client, assert_error):
    long_title = "x" * 201
    resp = await logged_in_client.post("/api/tasks", json={"title": long_title})
    await assert_error(resp, 400)


@pytest.mark.asyncio
async def test_create_invalid_due_date_format(logged_in_client, assert_error):
    resp = await logged_in_client.post("/api/tasks", json={"title": "Bad Date", "due_date": "12-31-2030"})
    await assert_error(resp, 400)


@pytest.mark.asyncio
async def test_create_invalid_negative_estimate(logged_in_client, assert_error):
    resp = await logged_in_client.post("/api/tasks", json={"title": "Bad Estimate", "estimate_minutes": -5})
    await assert_error(resp, 400)


@pytest.mark.asyncio
async def test_update_invalid_due_date_format(logged_in_client, create_task, assert_error):
    task_id = await create_task(title="Upd Date")
    resp = await logged_in_client.put(f"/api/tasks/{task_id}", json={"due_date": "31-12-2030"})
    await assert_error(resp, 400)


@pytest.mark.asyncio
async def test_update_invalid_order_value(logged_in_client, create_task, assert_error):
    task_id = await create_task(title="Order Test")
    # Try to set non-integer order
    resp = await logged_in_client.put(f"/api/tasks/{task_id}", json={"order": "not_an_int"})
    await assert_error(resp, 400)


@pytest.mark.asyncio
async def test_update_invalid_status_id_value(logged_in_client, create_task, assert_error):
    task_id = await create_task(title="Status Test")
    # Try to set non-integer status id
    resp = await logged_in_client.put(f"/api/tasks/{task_id}", json={"status_id": "not_a_number"})
    await assert_error(resp, 400)


@pytest.mark.asyncio
async def test_create_invalid_status_id(logged_in_client, assert_error):
    # Attempt to create with invalid foreign key status id
    resp = await logged_in_client.post("/api/tasks", json={"title": "Bad Status", "status_id": 9999})
    await assert_error(resp, 400)
