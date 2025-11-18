import pytest

pytestmark = pytest.mark.asyncio

async def test_api_error_handler(app, client):
    # Define a route that raises APIError and ensure standardized response
    from backend.errors import APIError

    @app.route("/apierror")
    async def apierror():  # pragma: no cover - route body definition
        raise APIError("Nope", status_code=418)

    resp = await client.get("/apierror")
    assert resp.status_code == 418
    payload = await resp.get_json()
    assert payload == {
        "success": False,
        "error": {"code": 418, "message": "Nope"},
    }

async def test_forbidden_error_handler(app, client):
    # AuthorizationError is mapped to 403 with standardized payload
    from backend.errors import AuthorizationError

    @app.route("/forbidden")
    async def forbidden():  # pragma: no cover - route body definition
        raise AuthorizationError()

    resp = await client.get("/forbidden")
    assert resp.status_code == 403
    payload = await resp.get_json()
    assert payload == {
        "success": False,
        "error": {"code": 403, "message": "Access denied"},
    }
