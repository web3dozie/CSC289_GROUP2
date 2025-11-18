import pytest


@pytest.mark.asyncio
async def test_not_found_handler(client):
    resp = await client.get("/no-such-route")
    assert resp.status_code == 404
    payload = await resp.get_json()
    assert payload["success"] is False
    assert payload["error"]["code"] == 404


@pytest.mark.asyncio
async def test_bad_request_handler(logged_in_client):
    resp = await logged_in_client.post("/api/import", json={})
    assert resp.status_code == 400

@pytest.mark.asyncio
async def test_unauthorized_handler(client):
    # Use raw client without login to hit an auth-protected route
    resp = await client.get("/api/tasks/")
    assert resp.status_code == 401
    payload = await resp.get_json()
    assert payload["success"] is False
    assert payload["error"]["code"] == 401


@pytest.mark.asyncio
async def test_internal_error_handler(app, client):
    # Define a route that always raises; register on existing app instance.
    @app.route("/boom")
    async def boom():  # pragma: no cover - route body itself
        raise RuntimeError("boom")

    resp = await client.get("/boom")
    assert resp.status_code == 500, f"Got {resp.status_code}"
    body = await resp.get_json()
    assert body == {
        "success": False,
        "error": {"code": 500, "message": "An unexpected error occurred"},
    }


@pytest.mark.asyncio
async def test_export_route_failure(monkeypatch, logged_in_client):
    # Simulate exception inside export_data to assert 500 error response
    from backend import app as app_module
    app = app_module.app

    # Patch AsyncSessionLocal to raise when entering context
    class BrokenSession:
        async def __aenter__(self):
            raise RuntimeError("db explode")
        async def __aexit__(self, exc_type, exc, tb):
            return False

    from backend import db
    monkeypatch.setattr("backend.db.engine_async.AsyncSessionLocal", BrokenSession, raising=False)

    resp = await logged_in_client.get("/api/export")
    assert resp.status_code == 500
    payload = await resp.get_json()
    assert payload == {
        "success": False,
        "error": {"code": 500, "message": "An unexpected error occurred"}
    }


@pytest.mark.asyncio
async def test_import_validation_error(logged_in_client):
    # Missing version field -> 400
    resp = await logged_in_client.post("/api/import", json={})
    assert resp.status_code == 400
    payload = await resp.get_json()
    assert payload.get("error") == "Invalid import data format"


@pytest.mark.asyncio
async def test_import_route_failure(monkeypatch, logged_in_client):
    # Provide minimal valid payload but break DB layer to force 500
    class BrokenSession:
        async def __aenter__(self):
            return self
        async def __aexit__(self, exc_type, exc, tb):
            return False
        async def execute(self, *args, **kwargs):
            raise RuntimeError("query failed")
        async def commit(self):
            pass

    monkeypatch.setattr("backend.db.engine_async.AsyncSessionLocal", BrokenSession, raising=False)

    payload = {"version": "1.0", "tasks": []}

    resp = await logged_in_client.post("/api/import", json=payload)
    assert resp.status_code == 500
    payload = await resp.get_json()
    assert payload == {
        "success": False,
        "error": {"code": 500, "message": "An unexpected error occurred"}
    }
