from quart import Blueprint, jsonify, request, session
from datetime import datetime, timedelta
import secrets
from sqlalchemy import select, and_

try:
    from backend.db.engine_async import AsyncSessionLocal
    from backend.db.models import UserSession, auth_required
except ImportError:
    from db.engine_async import AsyncSessionLocal
    from db.models import UserSession, auth_required

sessions_bp = Blueprint('sessions', __name__, url_prefix='/api/sessions')

@sessions_bp.route('/current', methods=['GET'])
@auth_required
async def get_current_sessions():
    """
    Show the user all their active login sessions.
    
    This lets people see where they're logged in - like "iPhone Safari" or 
    "Windows Chrome" - so they can spot any suspicious logins from devices
    they don't recognize.
    """
    try:
        async with AsyncSessionLocal() as db_session:
            # Find all active sessions for this user
            result = await db_session.execute(
                select(UserSession).where(
                    and_(
                        UserSession.user_id == session['user_id'],
                        UserSession.is_active == True  # Only show sessions that haven't been logged out
                    )
                ).order_by(UserSession.last_activity.desc())  # Most recent activity first
            )
            sessions = result.scalars().all()
            
            return jsonify({
                'sessions': [s.to_dict() for s in sessions],
                'current_session_id': session.get('session_id')  # Highlight which one is "this device"
            })
            
    except Exception as e:
        return jsonify({'error': 'Failed to fetch sessions'}), 500

@sessions_bp.route('/<int:session_id>/logout', methods=['POST'])
@auth_required
async def force_logout_session(session_id):
    """
    Let users kick out a specific login session.
    
    Useful if someone sees "Unknown iPhone logged in from Tokyo" and wants
    to immediately boot that session for security.
    """
    try:
        async with AsyncSessionLocal() as db_session:
            # Find the session they want to logout, but only if it belongs to them
            result = await db_session.execute(
                select(UserSession).where(
                    and_(
                        UserSession.id == session_id,
                        UserSession.user_id == session['user_id']  # Security: only your own sessions
                    )
                )
            )
            target_session = result.scalar_one_or_none()
            
            if not target_session:
                return jsonify({'error': 'Session not found'}), 404
                
            # Mark session as inactive (this will force them to log in again)
            target_session.is_active = False
            await db_session.commit()
            
            return jsonify({'message': 'Session terminated successfully'})
            
    except Exception as e:
        return jsonify({'error': 'Failed to terminate session'}), 500

@sessions_bp.route('/logout-all-others', methods=['POST'])
@auth_required
async def logout_all_other_sessions():
    """
    Nuclear option: log out everywhere except this current device.
    
    Great for when someone thinks their account might be compromised
    and wants to boot everyone else immediately.
    """
    try:
        current_session_id = session.get('session_id')
        
        async with AsyncSessionLocal() as db_session:
            # Find all other active sessions for this user (not including this one)
            result = await db_session.execute(
                select(UserSession).where(
                    and_(
                        UserSession.user_id == session['user_id'],
                        UserSession.session_id != current_session_id,  # Don't log out ourselves
                        UserSession.is_active == True
                    )
                )
            )
            other_sessions = result.scalars().all()
            
            # Boot them all
            count = 0
            for user_session in other_sessions:
                user_session.is_active = False
                count += 1
                
            await db_session.commit()
            
            return jsonify({
                'message': f'Terminated {count} other sessions',
                'terminated_count': count
            })
            
    except Exception as e:
        return jsonify({'error': 'Failed to terminate other sessions'}), 500

@sessions_bp.route('/cleanup-expired', methods=['POST'])
@auth_required
async def cleanup_expired_sessions():
    """
    Delete expired sessions from the database.
    
    This helps keep the database clean and prevents it from filling up
    with old session records. Can be called manually or via a scheduled job.
    
    Note: Only admins should call this in production, or it should be
    triggered by a background task.
    """
    try:
        async with AsyncSessionLocal() as db_session:
            # Find all expired sessions
            result = await db_session.execute(
                select(UserSession).where(
                    and_(
                        UserSession.expires_at != None,
                        UserSession.expires_at < datetime.now()
                    )
                )
            )
            expired_sessions = result.scalars().all()
            
            # Delete them
            count = 0
            for expired in expired_sessions:
                await db_session.delete(expired)
                count += 1
            
            await db_session.commit()
            
            import logging
            logging.info(f"Cleaned up {count} expired sessions")
            
            return jsonify({
                'message': f'Cleaned up {count} expired sessions',
                'deleted_count': count
            })
            
    except Exception as e:
        import logging
        logging.exception("Failed to cleanup expired sessions")
        return jsonify({'error': 'Failed to cleanup expired sessions'}), 500
