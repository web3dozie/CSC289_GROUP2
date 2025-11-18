from quart import Blueprint, request, jsonify, session
import logging
from datetime import timedelta
from datetime import datetime
from sqlalchemy import select
import secrets
from datetime import datetime, timedelta

try:
    from backend.db.engine_async import AsyncSessionLocal
    from backend.db.models import (
        User,
        Configuration,
        UserSession,
        hash_pin,
        validate_pin,
        verify_and_migrate_pin,
    )
    from backend.security.auth_decorators import auth_required
    from backend.security_logging import security_logger
    from quart_rate_limiter import rate_limit
    from backend.errors import (
        ValidationError,
        AuthenticationError,
        DatabaseError,
        success_response,
    )
except ImportError:
    from db.engine_async import AsyncSessionLocal
    from security_logging import security_logger
    from db.models import (
        User,
        Configuration,
        UserSession,
        hash_pin,
        validate_pin,
        verify_and_migrate_pin,
    )
    from backend.security.auth_decorators import auth_required
    from errors import (
        ValidationError,
        AuthenticationError,
        DatabaseError,
        success_response,
    )

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/setup", methods=["POST"])
@rate_limit(3, timedelta(minutes=1))  # 3 attempts per minute for setup
async def setup_auth():
    """Initial PIN setup for first-time users"""
    data = await request.get_json()

    if not data or "pin" not in data or "username" not in data:
        raise ValidationError(
            "PIN and username are required",
            details={
                "missing_fields": [
                    f for f in ["pin", "username"] if f not in (data or {})
                ]
            },
        )

    pin = data["pin"].strip()
    username = data["username"].strip()

    if not username:
        raise ValidationError("Username cannot be empty")

    if not validate_pin(pin):
        raise ValidationError(
            "PIN must be 4-8 digits",
            details={"field": "pin", "requirement": "4-8 numeric digits"},
        )

    try:
        async with AsyncSessionLocal() as db_session:
            # Check if username already exists
            result = await db_session.execute(
                select(User).where(User.username == username)
            )
            if result.first():
                raise ValidationError(
                    "Username already exists",
                    details={"field": "username", "value": username},
                )

            # Create new user
            email = data.get("email", "").strip()
            new_user = User(
                username=username,
                pin_hash=hash_pin(pin),
                email=(
                    email if email else None
                ),  # Use None instead of empty string for UNIQUE constraint
                config_data="{}",
            )
            db_session.add(new_user)
            await db_session.commit()
            await db_session.refresh(new_user)

            # Create default settings
            default_settings = Configuration(
                user_id=new_user.id,
                notes_enabled=True,
                timer_enabled=True,
                auto_lock_minutes=10,
                theme="light",
                ai_api_url="",
            )
            db_session.add(default_settings)
            await db_session.commit()

            # Create session record (same as login)
            session_id = secrets.token_hex(32)
            ip_address = request.headers.get("X-Forwarded-For", request.remote_addr)
            user_agent = request.headers.get("User-Agent", "Unknown")
            
            # Default to 24-hour session for new accounts
            expires_at = datetime.now() + timedelta(hours=24)
            
            user_session = UserSession(
                session_id=session_id,
                user_id=new_user.id,
                ip_address=ip_address,
                user_agent=user_agent,
                is_remember_me=False,
                expires_at=expires_at,
            )
            db_session.add(user_session)
            await db_session.commit()

            # Set up the user session
            session["user_id"] = new_user.id
            session["username"] = username
            session["session_id"] = session_id
            # Session expires when browser closes (non-permanent)
            session.permanent = False

            # Log successful signup
            security_logger.log_login_attempt(username, ip_address, True, new_user.id)
            logging.info(
                f"User {new_user.id} created account and logged in with session {session_id}"
            )

            return success_response(
                {
                    "message": "Account created successfully",
                    "user": {"id": new_user.id, "username": username},
                },
                201,
            )

    except ValidationError:
        raise  # Re-raise validation errors
    except Exception as e:
        logging.exception("Failed to create account")
        raise DatabaseError("Failed to create account")


@auth_bp.route("/login", methods=["POST"])
@rate_limit(5, timedelta(minutes=1))  # 5 attempts per minute
async def login():
    """Authenticate with username and PIN"""
    data = await request.get_json()

    if not data or "pin" not in data or "username" not in data:
        raise ValidationError(
            "Username and PIN are required",
            details={
                "missing_fields": [
                    f for f in ["pin", "username"] if f not in (data or {})
                ]
            },
        )

    pin = data["pin"].strip()
    username = data["username"].strip()

    if not username:
        raise ValidationError("Username cannot be empty")

    try:
        async with AsyncSessionLocal() as db_session:
            result = await db_session.execute(
                select(User).where(User.username == username)
            )
            user = result.scalar_one_or_none()

            if not user:
                # Get IP for security logging
                ip_address = request.headers.get("X-Forwarded-For", request.remote_addr)
                security_logger.log_login_attempt(username, ip_address, False)
                raise AuthenticationError("Invalid username or PIN")

            # Verify PIN and migrate legacy SHA-256 -> bcrypt if needed
            is_valid, new_hash = verify_and_migrate_pin(pin, user.pin_hash)
            if not is_valid:
                # Log failed login - wrong PIN
                ip_address = request.headers.get("X-Forwarded-For", request.remote_addr)
                security_logger.log_login_attempt(username, ip_address, False, user.id)
                raise AuthenticationError("Invalid username or PIN")

            if new_hash:
                user.pin_hash = new_hash
                await db_session.commit()

            # Session fixation protection - clear any existing session
            import logging

            old_session_id = session.get("session_id")
            session.clear()
            if old_session_id:
                logging.info(f"Cleared old session {old_session_id} for security")
            # Generate unique session ID for tracking this login
            session_id = secrets.token_hex(32)

            # Get client info for security tracking
            ip_address = request.headers.get("X-Forwarded-For", request.remote_addr)
            user_agent = request.headers.get("User-Agent", "Unknown")

            # Session expires when browser closes (24 hour max for session tracking)
            expires_at = datetime.now() + timedelta(hours=24)

            # Create session record in database
            user_session = UserSession(
                session_id=session_id,
                user_id=user.id,
                ip_address=ip_address,
                user_agent=user_agent,
                is_remember_me=False,  # Never persist sessions
                expires_at=expires_at,
            )
            db_session.add(user_session)
            await db_session.commit()

            # Set up the user session
            session["user_id"] = user.id
            session["username"] = user.username
            session["session_id"] = session_id

            # Session expires when browser closes (non-permanent)
            session.permanent = False

            # Log successful login
            security_logger.log_login_attempt(username, ip_address, True, user.id)

            # Log successful login
            import logging

            logging.info(
                f"User {user.id} logged in successfully with session {session_id}, session expires on browser close"
            )

            return success_response(
                {
                    "message": "Login successful",
                    "user": {"id": user.id, "username": user.username},
                }
            )

    except (ValidationError, AuthenticationError):
        raise  # Re-raise known errors
    except Exception as e:
        logging.exception("Login failed")
        raise DatabaseError("Login failed")


@auth_bp.route("/logout", methods=["POST"])
@auth_required
async def logout():
    """End session and mark it inactive in database"""
    try:
        # Mark the current session as inactive in database
        current_session_id = session.get("session_id")
        if current_session_id:
            async with AsyncSessionLocal() as db_session:
                result = await db_session.execute(
                    select(UserSession).where(
                        UserSession.session_id == current_session_id
                    )
                )
                user_session = result.scalar_one_or_none()
                if user_session:
                    user_session.is_active = False
                    await db_session.commit()
                    import logging

                    logging.info(
                        f"User {user_session.user_id} logged out session {current_session_id}"
                    )
        # Clear browser session
        session.clear()
        return success_response({"message": "Logged out successfully"})

    except Exception:
        # Even if database update fails, clear the browser session
        session.clear()
        return success_response({"message": "Logged out successfully"})


@auth_bp.route("/pin", methods=["PUT"])
@auth_required
async def change_pin():
    """Change existing PIN"""
    data = await request.get_json()

    if not data or "current_pin" not in data or "new_pin" not in data:
        raise ValidationError(
            "Current PIN and new PIN are required",
            details={
                "missing_fields": [
                    f for f in ["current_pin", "new_pin"] if f not in (data or {})
                ]
            },
        )

    current_pin = data["current_pin"].strip()
    new_pin = data["new_pin"].strip()

    if not validate_pin(new_pin):
        raise ValidationError(
            "PIN must be 4-8 digits",
            details={"field": "new_pin", "requirement": "4-8 numeric digits"},
        )

    try:
        async with AsyncSessionLocal() as db_session:
            result = await db_session.execute(
                select(User).where(User.id == session["user_id"])
            )
            user = result.scalar_one_or_none()

            if not user:
                raise AuthenticationError("User not found")

            # Verify current PIN
            is_valid, _ = verify_and_migrate_pin(current_pin, user.pin_hash)
            if not is_valid:
                raise AuthenticationError("Current PIN is incorrect")

            # Store new PIN using bcrypt

            user.pin_hash = hash_pin(new_pin)

            await db_session.commit()

            # Log sensitive operation - PIN change
            ip_address = request.headers.get("X-Forwarded-For", request.remote_addr)
            security_logger.log_sensitive_operation(
                "pin_change", user.id, ip_address, {"username": user.username}
            )

            return success_response({"message": "PIN updated successfully"})

    except (ValidationError, AuthenticationError):
        raise  # Re-raise known errors
    except Exception as e:
        logging.exception("Failed to update PIN")
        raise DatabaseError("Failed to update PIN")


@auth_bp.route("/username", methods=["PUT"])
@auth_required
@rate_limit(3, timedelta(minutes=5))  # 3 attempts per 5 minutes
async def change_username():
    """Change existing username with PIN verification"""
    data = await request.get_json()

    if not data or "new_username" not in data or "pin" not in data:
        raise ValidationError(
            "New username and PIN are required",
            details={
                "missing_fields": [
                    f for f in ["new_username", "pin"] if f not in (data or {})
                ]
            },
        )

    new_username = data["new_username"].strip()
    pin = data["pin"].strip()

    # Validate new username
    if not new_username:
        raise ValidationError("Username cannot be empty")

    if len(new_username) > 20:
        raise ValidationError(
            "Username is too long",
            details={"field": "new_username", "max_length": 20},
        )

    try:
        async with AsyncSessionLocal() as db_session:
            # Get current user
            result = await db_session.execute(
                select(User).where(User.id == session["user_id"])
            )
            user = result.scalar_one_or_none()

            if not user:
                raise AuthenticationError("User not found")

            # Verify PIN for security
            is_valid, _ = verify_and_migrate_pin(pin, user.pin_hash)
            if not is_valid:
                # Log failed attempt
                ip_address = request.headers.get("X-Forwarded-For", request.remote_addr)
                security_logger.log_sensitive_operation(
                    "username_change_failed",
                    user.id,
                    ip_address,
                    {"old_username": user.username, "reason": "invalid_pin"},
                )
                raise AuthenticationError("Invalid PIN")

            # Check if new username already exists
            existing_user = await db_session.execute(
                select(User).where(User.username == new_username)
            )
            if existing_user.scalar_one_or_none():
                raise ValidationError(
                    "Username already exists",
                    details={"field": "new_username", "value": new_username},
                )

            # Store old username for logging
            old_username = user.username

            # Update username
            user.username = new_username

            await db_session.commit()

            # Update session with new username
            session["username"] = new_username

            # Log successful username change
            ip_address = request.headers.get("X-Forwarded-For", request.remote_addr)
            security_logger.log_sensitive_operation(
                "username_change",
                user.id,
                ip_address,
                {"old_username": old_username, "new_username": new_username},
            )

            logging.info(
                f"User {user.id} changed username from '{old_username}' to '{new_username}'"
            )

            return success_response(
                {
                    "message": "Username updated successfully",
                    "username": new_username,
                }
            )

    except (ValidationError, AuthenticationError):
        raise  # Re-raise known errors
    except Exception as e:
        logging.exception("Failed to update username")
        raise DatabaseError("Failed to update username")
