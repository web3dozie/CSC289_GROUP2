async def fake_check_db_health_success(*args, **kwargs):
    """Fake health check that always succeeds."""
    return True


async def fake_check_db_health_fail(*args, **kwargs):
    """Fake health check that always raises a RuntimeError."""
    raise RuntimeError("health check failed")
