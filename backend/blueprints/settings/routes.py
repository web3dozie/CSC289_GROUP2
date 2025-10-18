from quart import Blueprint, jsonify, request, session
import logging
from sqlalchemy import select

try:
    from backend.db.models import Configuration, auth_required
    from backend.db.engine_async import AsyncSessionLocal
    from backend.errors import ValidationError, AuthenticationError, DatabaseError, success_response
except ImportError:
    from db.models import Configuration, auth_required
    from db.engine_async import AsyncSessionLocal
    from errors import ValidationError, AuthenticationError, DatabaseError, success_response

settings_bp = Blueprint("settings", __name__)


async def get_settings():
    # Require authenticated session
    if 'user_id' not in session:
        raise AuthenticationError('Authentication required')
    
    user_id = session['user_id']
    try:
        async with AsyncSessionLocal() as s:
            result = await s.execute(select(Configuration).filter_by(user_id=user_id))
            settings = result.scalars().first()
            if not settings:
                settings = Configuration(user_id=user_id)
                s.add(settings)
                await s.commit()
                await s.refresh(settings)
            return settings
    except Exception as e:
        logging.exception("Failed to fetch settings")
        raise DatabaseError('Failed to fetch settings')


@settings_bp.route("/api/settings", methods=["GET"])
@auth_required
async def get_all_settings():
    settings = await get_settings()
    return success_response(settings.to_dict())


@settings_bp.route("/api/settings", methods=["PUT"])
@auth_required
async def update_settings():
    data = await request.get_json()
    if not data:
        raise ValidationError("No data provided")
    
    # Require authenticated session
    if 'user_id' not in session:
        raise AuthenticationError('Authentication required')
    
    user_id = session['user_id']
    
    try:
        async with AsyncSessionLocal() as s:
            # Fetch settings within the same session we'll use for updating
            result = await s.execute(select(Configuration).filter_by(user_id=user_id))
            settings = result.scalars().first()
            
            if not settings:
                settings = Configuration(user_id=user_id)
                s.add(settings)
            
            # Update fields
            if "notes_enabled" in data:
                settings.notes_enabled = bool(data["notes_enabled"])
            if "timer_enabled" in data:
                settings.timer_enabled = bool(data["timer_enabled"])
            if "ai_url" in data:
                settings.ai_url = data["ai_url"]
            if "auto_lock_minutes" in data:
                settings.auto_lock_minutes = int(data["auto_lock_minutes"])
            if "theme" in data:
                settings.theme = data["theme"]
            
            await s.commit()
            await s.refresh(settings)
            return success_response(settings.to_dict())
    except (ValidationError, AuthenticationError):
        raise  # Re-raise known errors
    except Exception as e:
        logging.exception("Failed to update settings")
        raise DatabaseError('Failed to update settings')


@settings_bp.route("/api/settings/notes", methods=["PUT"])
@auth_required
async def update_notes():
    data = await request.get_json()
    
    # Require authenticated session
    if 'user_id' not in session:
        raise AuthenticationError('Authentication required')
    
    user_id = session['user_id']
    
    try:
        async with AsyncSessionLocal() as s:
            result = await s.execute(select(Configuration).filter_by(user_id=user_id))
            settings = result.scalars().first()
            
            if not settings:
                settings = Configuration(user_id=user_id)
                s.add(settings)
            
            if "enabled" in data:
                settings.notes_enabled = bool(data["enabled"])
            
            await s.commit()
            await s.refresh(settings)
            return success_response({"notes_enabled": settings.notes_enabled})
    except (ValidationError, AuthenticationError):
        raise  # Re-raise known errors
    except Exception as e:
        logging.exception("Failed to update notes settings")
        raise DatabaseError('Failed to update notes settings')


@settings_bp.route("/api/settings/timer", methods=["PUT"])
@auth_required
async def update_timer():
    data = await request.get_json()
    
    # Require authenticated session
    if 'user_id' not in session:
        raise AuthenticationError('Authentication required')
    
    user_id = session['user_id']
    
    try:
        async with AsyncSessionLocal() as s:
            result = await s.execute(select(Configuration).filter_by(user_id=user_id))
            settings = result.scalars().first()
            
            if not settings:
                settings = Configuration(user_id=user_id)
                s.add(settings)
            
            if "enabled" in data:
                settings.timer_enabled = bool(data["enabled"])
            
            await s.commit()
            await s.refresh(settings)
            return success_response({"timer_enabled": settings.timer_enabled})
    except (ValidationError, AuthenticationError):
        raise  # Re-raise known errors
    except Exception as e:
        logging.exception("Failed to update timer settings")
        raise DatabaseError('Failed to update timer settings')


@settings_bp.route("/api/settings/ai-url", methods=["PUT"])
@auth_required
async def update_ai_url():
    data = await request.get_json()
    
    # Require authenticated session
    if 'user_id' not in session:
        raise AuthenticationError('Authentication required')
    
    user_id = session['user_id']
    
    try:
        async with AsyncSessionLocal() as s:
            result = await s.execute(select(Configuration).filter_by(user_id=user_id))
            settings = result.scalars().first()
            
            if not settings:
                settings = Configuration(user_id=user_id)
                s.add(settings)
            
            if "url" in data:
                settings.ai_url = data["url"]
            
            await s.commit()
            await s.refresh(settings)
            return success_response({"ai_url": settings.ai_url})
    except (ValidationError, AuthenticationError):
        raise  # Re-raise known errors
    except Exception as e:
        logging.exception("Failed to update AI URL")
        raise DatabaseError('Failed to update AI URL')


@settings_bp.route("/api/settings/auto-lock", methods=["PUT"])
@auth_required
async def update_auto_lock():
    data = await request.get_json()
    
    # Require authenticated session
    if 'user_id' not in session:
        raise AuthenticationError('Authentication required')
    
    user_id = session['user_id']
    
    try:
        async with AsyncSessionLocal() as s:
            result = await s.execute(select(Configuration).filter_by(user_id=user_id))
            settings = result.scalars().first()
            
            if not settings:
                settings = Configuration(user_id=user_id)
                s.add(settings)
            
            if "minutes" in data:
                settings.auto_lock_minutes = int(data["minutes"])
            
            await s.commit()
            await s.refresh(settings)
            return success_response({"auto_lock_minutes": settings.auto_lock_minutes})
    except (ValidationError, AuthenticationError):
        raise  # Re-raise known errors
    except Exception as e:
        logging.exception("Failed to update auto-lock")
        raise DatabaseError('Failed to update auto-lock')


@settings_bp.route("/api/settings/theme", methods=["PUT"])
@auth_required
async def update_theme():
    data = await request.get_json()
    
    # Require authenticated session
    if 'user_id' not in session:
        raise AuthenticationError('Authentication required')
    
    user_id = session['user_id']
    
    try:
        async with AsyncSessionLocal() as s:
            result = await s.execute(select(Configuration).filter_by(user_id=user_id))
            settings = result.scalars().first()
            
            if not settings:
                settings = Configuration(user_id=user_id)
                s.add(settings)
            
            if "theme" in data:
                settings.theme = data["theme"]
            
            await s.commit()
            await s.refresh(settings)
            return success_response({"theme": settings.theme})
    except (ValidationError, AuthenticationError):
        raise  # Re-raise known errors
    except Exception as e:
        logging.exception("Failed to update theme")
        raise DatabaseError('Failed to update theme')