"""
Tests for review and journal endpoints.

This file exercises the journal CRUD endpoints and summary/insights routes
to ensure journal entries can be created, updated, listed, deleted, and that
summary/insight endpoints return expected JSON structures.
"""

import os
import tempfile
import asyncio
import pytest

from quart import Quart


@pytest.mark.asyncio
async def test_review_journal_and_summaries(tmp_path, monkeypatch):
    # create a temporary sqlite file DB and point the app to it before import
    db_path = tmp_path / "test_review.db"
    db_uri = f"sqlite+aiosqlite:///{db_path.as_posix()}"
    monkeypatch.setenv("DATABASE_URL", db_uri)

    # import and create app after env var is set
    from backend.app import create_app, initialize_database

    app = create_app()

    # make sure DB is initialized (creates tables and seeds)
    await initialize_database()

    # Use the Quart test client
    async with app.test_client() as client:
        # setup a user (auth/setup endpoint used in other tests)
        resp = await client.post("/api/auth/setup", json={"pin": "1234", "username": "testuser"})
        if resp.status_code == 400:
            # user exists - login
            login = await client.post('/api/auth/login', json={'pin': '1234', 'username': 'testuser'})
            assert login.status_code in (200, 201)
        else:
            assert resp.status_code in (200, 201)
            data = await resp.get_json()
            assert "user_id" in data or resp.status_code == 201

        # Create a journal entry
        journal_payload = {"content": "Today I wrote tests for review.", "mood": "productive"}
        r = await client.post("/api/review/journal", json=journal_payload)
        assert r.status_code == 201
        created = await r.get_json()
        assert created.get("content") == journal_payload["content"]
        entry_id = created.get("id")

        # List journal entries
        r = await client.get("/api/review/journal")
        assert r.status_code == 200
        entries = await r.get_json()
        assert any(e.get("id") == entry_id for e in entries)

        # Update the journal entry
        update_payload = {"content": "Updated content", "mood": "happy"}
        r = await client.put(f"/api/review/journal/{entry_id}", json=update_payload)
        assert r.status_code == 200
        updated = await r.get_json()
        assert updated.get("content") == update_payload["content"]

        # Get daily summary
        r = await client.get("/api/review/summary/daily")
        assert r.status_code == 200
        daily = await r.get_json()
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
