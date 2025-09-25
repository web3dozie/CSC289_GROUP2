"""
Tests for user settings endpoints.

Verifies retrieving and updating user settings, including toggles for notes
and timer, updating AI URL, auto-lock minutes, and theme preferences.
"""

import os
import pytest


@pytest.mark.asyncio
async def test_settings_endpoints(tmp_path, monkeypatch):
    # temporary DB
    db_path = tmp_path / "test_settings.db"
    db_uri = f"sqlite+aiosqlite:///{db_path.as_posix()}"
    monkeypatch.setenv("DATABASE_URL", db_uri)

    from backend.app import create_app, initialize_database

    app = create_app()
    await initialize_database()

    async with app.test_client() as client:
        # create a user/session (idempotent: if user exists, try login)
        resp = await client.post('/api/auth/setup', json={'pin': '1234', 'username': 'settings_tester'})
        if resp.status_code == 400:
            # user already exists; try to login to establish session
            login = await client.post('/api/auth/login', json={'pin': '1234'})
            assert login.status_code in (200, 201)
        else:
            assert resp.status_code in (200, 201)

        # GET settings
        r = await client.get('/api/settings')
        assert r.status_code == 200
        settings = await r.get_json()
        assert 'notes_enabled' in settings

        # PUT update settings
        r = await client.put('/api/settings', json={'notes_enabled': False, 'timer_enabled': False, 'theme': 'dark'})
        assert r.status_code == 200
        updated = await r.get_json()
        assert updated['notes_enabled'] is False
        assert updated['timer_enabled'] is False
        assert updated['theme'] == 'dark'

        # PUT notes toggle
        r = await client.put('/api/settings/notes', json={'enabled': True})
        assert r.status_code == 200
        data = await r.get_json()
        assert data['notes_enabled'] is True

        # PUT timer toggle
        r = await client.put('/api/settings/timer', json={'enabled': True})
        assert r.status_code == 200
        data = await r.get_json()
        assert data['timer_enabled'] is True

        # PUT ai-url
        r = await client.put('/api/settings/ai-url', json={'url': 'https://example.com/ai'})
        assert r.status_code == 200
        data = await r.get_json()
        assert data['ai_url'] == 'https://example.com/ai'

        # PUT auto-lock
        r = await client.put('/api/settings/auto-lock', json={'minutes': 5})
        assert r.status_code == 200
        data = await r.get_json()
        assert data['auto_lock_minutes'] == 5

        # PUT theme
        r = await client.put('/api/settings/theme', json={'theme': 'light'})
        assert r.status_code == 200
        data = await r.get_json()
        assert data['theme'] == 'light'
