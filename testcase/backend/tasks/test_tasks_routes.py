import pytest


@pytest.mark.asyncio
async def test_create_and_get_tasks_list(client):
    # Create and login a user
    from testcase.backend.conftest import create_user_and_login
    await create_user_and_login(client)

    # Initially, list should be empty
    initial = await (await client.get("/api/tasks/")).get_json()
    assert initial["success"] is True
    assert isinstance(initial["data"], dict)
    assert isinstance(initial["data"].get("tasks"), list)
    assert len(initial["data"]["tasks"]) == 0

    # Create a task
    resp = await client.post("/api/tasks", json={"title": "Write Tests"})
    assert resp.status_code in (200, 201)
    body = await resp.get_json()
    assert body["success"] is True
    assert body["data"].get("task_id")

    # Fetch list again
    after = await (await client.get("/api/tasks/")).get_json()
    titles = [t["title"] for t in after["data"]["tasks"]]
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
async def test_create_validation_error_on_empty_title(client):
    from testcase.backend.conftest import create_user_and_login
    await create_user_and_login(client)

    resp = await client.post("/api/tasks", json={"title": "   "})
    assert resp.status_code == 400
    err = await resp.get_json()
    assert err["success"] is False
    assert err["error"]["code"] == 400


@pytest.mark.asyncio
async def test_update_toggles_done_and_status(client):
    from testcase.backend.conftest import create_user_and_login
    await create_user_and_login(client)

    # Create a task
    create_resp = await client.post("/api/tasks", json={"title": "Toggle Me"})
    assert create_resp.status_code in (200, 201)
    create_body = await create_resp.get_json()
    task_id = create_body["data"]["task_id"]

    # Mark done
    put_resp = await client.put(f"/api/tasks/{task_id}", json={"done": True})
    assert put_resp.status_code == 200
    updated = await put_resp.get_json()
    assert updated["data"].get("done") is True
    assert updated["data"].get("closed_on") is not None

    # Mark not-done
    put_resp2 = await client.put(f"/api/tasks/{task_id}", json={"done": False})
    assert put_resp2.status_code == 200
    updated2 = await put_resp2.get_json()
    assert updated2["data"].get("done") is False
    # closed_on should clear when marking not done
    assert updated2["data"].get("closed_on") is None


@pytest.mark.asyncio
async def test_delete_task_route(client):
    from testcase.backend.conftest import create_user_and_login
    await create_user_and_login(client)

    # Create a task
    create_resp = await client.post("/api/tasks", json={"title": "Trash"})
    assert create_resp.status_code in (200, 201)
    task_id = (await create_resp.get_json())["data"]["task_id"]

    # Delete it
    del_resp = await client.delete(f"/api/tasks/{task_id}")
    assert del_resp.status_code == 204

    # Ensure it's gone from list
    after = await (await client.get("/api/tasks/")).get_json()
    titles = [t["title"] for t in after["data"]["tasks"]]
    assert "Trash" not in titles


@pytest.mark.asyncio
async def test_tasks_categories(client):
    from testcase.backend.conftest import create_user_and_login
    await create_user_and_login(client)
    await client.post("/api/tasks", json={"title": "Cat A", "category": "Work"})
    await client.post("/api/tasks", json={"title": "Cat B", "category": "Personal"})
    resp = await client.get("/api/tasks/categories")
    assert resp.status_code == 200
    cats = await resp.get_json()
    assert set(["Work", "Personal"]).issubset(set(cats))

@pytest.mark.asyncio
async def test_tasks_kanban(client):
    from testcase.backend.conftest import create_user_and_login
    await create_user_and_login(client)
    # Seed a task so board isn't empty
    await client.post("/api/tasks", json={"title": "Kanban Item"})
    resp = await client.get("/api/tasks/kanban")
    assert resp.status_code == 200
    payload = await resp.get_json()
    assert payload.get("success") is True
    board = payload.get("data", {})
    assert isinstance(board, dict)
    assert any(isinstance(col, dict) and "tasks" in col for col in board.values())

@pytest.mark.asyncio
async def test_tasks_calendar(client):
    from testcase.backend.conftest import create_user_and_login
    await create_user_and_login(client)
    await client.post("/api/tasks", json={"title": "Cal A", "due_date": "2030-01-01"})
    await client.post("/api/tasks", json={"title": "Cal B", "due_date": "2030-01-01"})
    resp = await client.get("/api/tasks/calendar")
    assert resp.status_code == 200
    cal = await resp.get_json()
    assert "2030-01-01" in cal
    assert isinstance(cal["2030-01-01"], list)
    titles = [t.get("title") for t in cal["2030-01-01"]]
    assert "Cal A" in titles and "Cal B" in titles

@pytest.mark.asyncio
async def test_tasks_archive_completed(client):
    from testcase.backend.conftest import create_user_and_login
    await create_user_and_login(client)
    # Create and complete a task
    create = await client.post("/api/tasks", json={"title": "To Archive", "due_date": "2030-01-01"})
    assert create.status_code in (200, 201)
    task_id = (await create.get_json())["data"]["task_id"]
    put = await client.put(f"/api/tasks/{task_id}", json={"done": True})
    assert put.status_code == 200
    # Archive completed
    arch_resp = await client.post("/api/tasks/archive-completed")
    assert arch_resp.status_code == 200
    arch = await arch_resp.get_json()
    assert arch["data"]["archived_count"] >= 1


@pytest.mark.asyncio
async def test_task_get_not_found(client):
    from testcase.backend.conftest import create_user_and_login
    await create_user_and_login(client)
    resp = await client.get("/api/tasks/9999")
    assert resp.status_code == 404
    body = await resp.get_json()
    assert body["success"] is False
    assert body["error"]["code"] == 404


@pytest.mark.asyncio
async def test_task_update_not_found(client):
    from testcase.backend.conftest import create_user_and_login
    await create_user_and_login(client)
    resp = await client.put("/api/tasks/9999", json={"title": "Nope"})
    assert resp.status_code == 404
    body = await resp.get_json()
    assert body["success"] is False
    assert body["error"]["code"] == 404


@pytest.mark.asyncio
async def test_task_delete_not_found(client):
    from testcase.backend.conftest import create_user_and_login
    await create_user_and_login(client)
    resp = await client.delete("/api/tasks/9999")
    assert resp.status_code == 404
    body = await resp.get_json()
    assert body["success"] is False
    assert body["error"]["code"] == 404


@pytest.mark.asyncio
async def test_create_invalid_title_too_long(client):
    from testcase.backend.conftest import create_user_and_login
    await create_user_and_login(client)
    long_title = "x" * 201
    resp = await client.post("/api/tasks", json={"title": long_title})
    assert resp.status_code == 400
    body = await resp.get_json()
    assert body["success"] is False
    assert body["error"]["code"] == 400


@pytest.mark.asyncio
async def test_create_invalid_due_date_format(client):
    from testcase.backend.conftest import create_user_and_login
    await create_user_and_login(client)
    resp = await client.post("/api/tasks", json={"title": "Bad Date", "due_date": "12-31-2030"})
    assert resp.status_code == 400
    body = await resp.get_json()
    assert body["success"] is False
    assert body["error"]["code"] == 400


@pytest.mark.asyncio
async def test_create_invalid_negative_estimate(client):
    from testcase.backend.conftest import create_user_and_login
    await create_user_and_login(client)
    resp = await client.post("/api/tasks", json={"title": "Bad Estimate", "estimate_minutes": -5})
    assert resp.status_code == 400
    body = await resp.get_json()
    assert body["success"] is False
    assert body["error"]["code"] == 400


@pytest.mark.asyncio
async def test_update_invalid_due_date_format(client):
    from testcase.backend.conftest import create_user_and_login
    await create_user_and_login(client)
    create = await client.post("/api/tasks", json={"title": "Upd Date"})
    assert create.status_code in (200, 201)
    task_id = (await create.get_json())["data"]["task_id"]
    resp = await client.put(f"/api/tasks/{task_id}", json={"due_date": "31-12-2030"})
    assert resp.status_code == 400
    body = await resp.get_json()
    assert body["success"] is False
    assert body["error"]["code"] == 400
