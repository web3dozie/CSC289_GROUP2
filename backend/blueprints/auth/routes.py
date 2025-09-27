from quart import Blueprint, request, jsonify, session
import logging
from datetime import datetime
from sqlalchemy import select
from backend.db_async import AsyncSessionLocal
from backend.models import User, UserSettings, hash_pin, validate_pin, auth_required, verify_and_migrate_pin

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/setup', methods=['POST'])
async def setup_auth():
    """Initial PIN setup for first-time users"""
    data = await request.get_json()
    
    if not data or 'pin' not in data or 'username' not in data:
        return jsonify({'error': 'PIN and username are required'}), 400
    
    pin = data['pin'].strip()
    username = data['username'].strip()
    
    if not username:
        return jsonify({'error': 'Username cannot be empty'}), 400
    
    if not validate_pin(pin):
        return jsonify({'error': 'PIN must be 4-8 digits'}), 400
    
    try:
        async with AsyncSessionLocal() as db_session:
            # Check if username already exists
            result = await db_session.execute(select(User).where(User.username == username))
            if result.first():
                return jsonify({'error': 'Username already exists'}), 400
            
            # Create new user
            new_user = User(
                username=username,
                pin_hash=hash_pin(pin),
                email=data.get('email', ''),
                config_data='{}'
            )
            db_session.add(new_user)
            await db_session.commit()
            await db_session.refresh(new_user)
            
            # Create default settings
            default_settings = UserSettings(
                user_id=new_user.id,
                notes_enabled=True,
                timer_enabled=True,
                auto_lock_minutes=10,
                theme='light',
                ai_url=''
            )
            db_session.add(default_settings)
            await db_session.commit()
            
            session['user_id'] = new_user.id
            session['username'] = username
            
            return jsonify({
                'success': True,
                'message': 'Account created successfully',
                'user_id': new_user.id,
                'username': username
            }), 201
            
    except Exception:
        logging.exception("Failed to create account")
        return jsonify({'error': 'Failed to create account'}), 500

@auth_bp.route('/login', methods=['POST'])
async def login():
    """Authenticate with username and PIN"""
    data = await request.get_json()
    
    if not data or 'pin' not in data or 'username' not in data:
        return jsonify({'error': 'Username and PIN are required'}), 400
    
    pin = data['pin'].strip()
    username = data['username'].strip()
    
    if not username:
        return jsonify({'error': 'Username cannot be empty'}), 400
    
    try:
        async with AsyncSessionLocal() as db_session:
            result = await db_session.execute(
                select(User).where(User.username == username)
            )
            user = result.scalar_one_or_none()
            
            if not user:
                return jsonify({'error': 'Invalid username or PIN'}), 401

            # Verify PIN and migrate legacy SHA-256 -> bcrypt if needed
            is_valid, new_hash = verify_and_migrate_pin(pin, user.pin_hash)
            if not is_valid:
                return jsonify({'error': 'Invalid username or PIN'}), 401

            # If migration produced a new bcrypt hash, save it
            if new_hash:
                user.pin_hash = new_hash
                await db_session.commit()

            session['user_id'] = user.id
            session['username'] = user.username
            
            return jsonify({
                'success': True,
                'message': 'Login successful',
                'user_id': user.id,
                'username': user.username
            })
            
    except Exception:
        logging.exception("Login failed")
        return jsonify({'error': 'Login failed'}), 500

@auth_bp.route('/logout', methods=['POST'])
@auth_required
async def logout():
    """End session"""
    session.clear()
    return jsonify({'success': True, 'message': 'Logged out successfully'})

@auth_bp.route('/pin', methods=['PUT'])
@auth_required
async def change_pin():
    """Change existing PIN"""
    data = await request.get_json()
    
    if not data or 'current_pin' not in data or 'new_pin' not in data:
        return jsonify({'error': 'Current PIN and new PIN are required'}), 400
    
    current_pin = data['current_pin'].strip()
    new_pin = data['new_pin'].strip()
    
    if not validate_pin(new_pin):
        return jsonify({'error': 'PIN must be 4-8 digits'}), 400
    
    try:
        async with AsyncSessionLocal() as db_session:
            result = await db_session.execute(
                select(User).where(User.id == session['user_id'])
            )
            user = result.scalar_one_or_none()
            
            if not user:
                return jsonify({'error': 'Current PIN is incorrect'}), 401

            # Verify current PIN
            is_valid, _ = verify_and_migrate_pin(current_pin, user.pin_hash)
            if not is_valid:
                return jsonify({'error': 'Current PIN is incorrect'}), 401

            # Store new PIN using bcrypt
            user.pin_hash = hash_pin(new_pin)
            await db_session.commit()
            
            return jsonify({'success': True, 'message': 'PIN updated successfully'})
            
    except Exception:
        logging.exception("Failed to update PIN")
        return jsonify({'error': 'Failed to update PIN'}), 500
