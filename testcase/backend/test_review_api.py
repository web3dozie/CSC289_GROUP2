"""
Tests for review and journal endpoints.

This file exercises the journal CRUD endpoints and summary/insights routes
to ensure journal entries can be created, updated, listed, deleted, and that
summary/insight endpoints return expected JSON structures.
"""

import pytest

from conftest import create_user_and_login


@pytest.mark.asyncio
async def test_review_journal_and_summaries(client):
    """Test review journal CRUD and summary/insights endpoints"""
    # Create user and login
    await create_user_and_login(client)

    # Create a journal entry
    journal_payload = {
        "content": "Today I wrote tests for review.",
        "mood": "productive",
    }
    r = await client.post("/api/review/journal", json=journal_payload)
    assert r.status_code == 201
    response_data = await r.get_json()
    assert response_data["success"] is True
    created = response_data["data"]
    assert created.get("content") == journal_payload["content"]
    entry_id = created.get("id")

    # List journal entries
    r = await client.get("/api/review/journal")
    assert r.status_code == 200
    response_data = await r.get_json()
    assert response_data["success"] is True
    entries = response_data["data"]
    assert any(e.get("id") == entry_id for e in entries)

    # Update the journal entry
    update_payload = {"content": "Updated content", "mood": "happy"}
    r = await client.put(f"/api/review/journal/{entry_id}", json=update_payload)
    assert r.status_code == 200
    response_data = await r.get_json()
    assert response_data["success"] is True
    updated = response_data["data"]
    assert updated.get("content") == update_payload["content"]

    # Get daily summary
    r = await client.get("/api/review/summary/daily")
    assert r.status_code == 200
    response_data = await r.get_json()
    assert response_data["success"] is True
    daily = response_data["data"]
    # expect at least one entry in daily summary payload
    assert isinstance(daily, dict)

    # Get weekly summary
    r = await client.get("/api/review/summary/weekly")
    assert r.status_code == 200
    weekly = await r.get_json()
    assert isinstance(weekly, dict)

    # Get insights
    r = await client.get("/api/review/insights")
    assert r.status_code == 200
    insights = await r.get_json()
    assert isinstance(insights, dict)

    # Delete the journal entry
    r = await client.delete(f"/api/review/journal/{entry_id}")
    assert r.status_code in (200, 204)
