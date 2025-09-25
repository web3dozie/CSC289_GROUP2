from quart import Blueprint, jsonify, request, session
import logging
from backend.models import UserSettings, auth_required
from backend.db_async import AsyncSessionLocal
from sqlalchemy import select

settings_bp = Blueprint('settings', __name__)

async def get_settings():
    # Require authenticated session; do not default to user_id=1
    if 'user_id' not in session:
        return None
    user_id = session['user_id']
    async with AsyncSessionLocal() as s:
        result = await s.execute(select(UserSettings).filter_by(user_id=user_id))
        settings = result.scalars().first()
        if not settings:
            settings = UserSettings(user_id=user_id)
            s.add(settings)
            await s.commit()
            await s.refresh(settings)
        return settings

@settings_bp.route('/api/settings', methods=['GET'])
@auth_required
async def get_all_settings():
    settings = await get_settings()
    if settings is None:
        return jsonify({'error': 'Authentication required'}), 401
    return jsonify(settings.to_dict())

@settings_bp.route('/api/settings', methods=['PUT'])
@auth_required
async def update_settings():
    settings = await get_settings()
    data = await request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    if 'notes_enabled' in data:
        settings.notes_enabled = bool(data['notes_enabled'])
    if 'timer_enabled' in data:
        settings.timer_enabled = bool(data['timer_enabled'])
    if 'ai_url' in data:
        settings.ai_url = data['ai_url']
    if 'auto_lock_minutes' in data:
        settings.auto_lock_minutes = int(data['auto_lock_minutes'])
    if 'theme' in data:
        settings.theme = data['theme']

    async with AsyncSessionLocal() as s:
        await s.merge(settings)
        await s.commit()
        return jsonify(settings.to_dict())

@settings_bp.route('/api/settings/notes', methods=['PUT'])
@auth_required
async def update_notes():
    settings = await get_settings()
    data = await request.get_json()
    if 'enabled' in data:
        settings.notes_enabled = bool(data['enabled'])
    async with AsyncSessionLocal() as s:
        await s.merge(settings)
        await s.commit()
        return jsonify({'notes_enabled': settings.notes_enabled})

@settings_bp.route('/api/settings/timer', methods=['PUT'])
@auth_required
async def update_timer():
    settings = await get_settings()
    data = await request.get_json()
    if 'enabled' in data:
        settings.timer_enabled = bool(data['enabled'])
    async with AsyncSessionLocal() as s:
        await s.merge(settings)
        await s.commit()
        return jsonify({'timer_enabled': settings.timer_enabled})

@settings_bp.route('/api/settings/ai-url', methods=['PUT'])
@auth_required
async def update_ai_url():
    settings = await get_settings()
    data = await request.get_json()
    if 'url' in data:
        settings.ai_url = data['url']
    async with AsyncSessionLocal() as s:
        await s.merge(settings)
        await s.commit()
        return jsonify({'ai_url': settings.ai_url})

@settings_bp.route('/api/settings/auto-lock', methods=['PUT'])
@auth_required
async def update_auto_lock():
    settings = await get_settings()
    data = await request.get_json()
    if 'minutes' in data:
        settings.auto_lock_minutes = int(data['minutes'])
    async with AsyncSessionLocal() as s:
        await s.merge(settings)
        await s.commit()
        return jsonify({'auto_lock_minutes': settings.auto_lock_minutes})

@settings_bp.route('/api/settings/theme', methods=['PUT'])
@auth_required
async def update_theme():
    settings = await get_settings()
    data = await request.get_json()
    if 'theme' in data:
        settings.theme = data['theme']
    async with AsyncSessionLocal() as s:
        await s.merge(settings)
        await s.commit()
        return jsonify({'theme': settings.theme})
    
    