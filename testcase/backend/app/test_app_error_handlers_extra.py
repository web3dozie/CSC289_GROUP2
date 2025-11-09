import pytest
from quart import abort

pytestmark = pytest.mark.asyncio

async def test_bad_request_handler_via_abort(app, client):
    @app.route("/make400")
    async def make400():  # pragma: no cover - route definition
        abort(400)

    resp = await client.get("/make400")
    assert resp.status_code == 400
    payload = await resp.get_json()
    assert payload == {
        "success": False,
        "error": {"code": 400, "message": "Bad request"},
    }

async def test_unauthorized_handler_via_abort(app, client):
    @app.route("/make401")
    async def make401():  # pragma: no cover - route definition
        abort(401)

    resp = await client.get("/make401")
    assert resp.status_code == 401
    payload = await resp.get_json()
    assert payload == {
        "success": False,
        "error": {"code": 401, "message": "Authentication required"},
    }

async def test_internal_error_handler_via_abort(app, client):
    @app.route("/make500")
    async def make500():  # pragma: no cover - route definition
        abort(500)

    resp = await client.get("/make500")
    assert resp.status_code == 500
    payload = await resp.get_json()
    assert payload == {
        "success": False,
        "error": {"code": 500, "message": "Internal server error"},
    }

async def test_unexpected_error_includes_details_when_debug(app, client):
    app.debug = True

    @app.route("/boom-debug")
    async def boom_debug():  # pragma: no cover - route definition
        raise RuntimeError("debug crash")

    resp = await client.get("/boom-debug")
    assert resp.status_code == 500
    payload = await resp.get_json()
    assert payload["error"]["message"] == "An unexpected error occurred"
    details = payload["error"].get("details")
    assert details and details["type"] == "RuntimeError" and "debug crash" in details["message"]
