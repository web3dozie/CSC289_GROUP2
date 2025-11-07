from quart import Blueprint, request, jsonify, session
import logging
from sqlalchemy import select, delete, func
from datetime import datetime

try:
    from backend.db.engine_async import AsyncSessionLocal
    from backend.db.models import User, verify_and_migrate_pin
    from backend.security.auth_decorators import auth_required
    from backend.security_logging import security_logger
    from backend.errors import (
        ValidationError,
        AuthenticationError,
        DatabaseError,
        success_response,
    )
except ImportError:
    from db.engine_async import AsyncSessionLocal
    from db.models import User, verify_and_migrate_pin
    from security.auth_decorators import auth_required
    from security_logging import security_logger
    from errors import (
        ValidationError,
        AuthenticationError,
        DatabaseError,
        success_response,
    )

account_deletion_bp = Blueprint("account_deletion", __name__, url_prefix="/api/account")


@account_deletion_bp.route("", methods=["DELETE"])
@auth_required
async def delete_account():
    """
    Permanently delete user account and all associated data.
    
    This endpoint:
    1. Verifies the user's PIN for security
    2. Deletes all user data (cascade delete handles related records)
    3. Invalidates all sessions
    4. Logs the deletion for security audit
    
    Request body:
    {
        "pin": "user's PIN for verification",
        "confirmation": "DELETE" (must match exactly)
    }
    
    Returns:
    - 200: Account deleted successfully
    - 400: Missing or invalid confirmation
    - 401: Invalid PIN or not authenticated
    - 500: Server error during deletion
    """
    try:
        data = await request.get_json()
        
        # Validate request
        if not data:
            raise ValidationError("Request body required")
        
        if "pin" not in data:
            raise ValidationError(
                "PIN is required for account deletion",
                details={"missing_fields": ["pin"]}
            )
        
        if "confirmation" not in data or data["confirmation"] != "DELETE":
            raise ValidationError(
                "Confirmation text must be 'DELETE'",
                details={"field": "confirmation", "expected": "DELETE"}
            )
        
        pin = data["pin"].strip()
        user_id = session["user_id"]
        
        # Get client info for security logging
        ip_address = request.headers.get("X-Forwarded-For", request.remote_addr)
        
        async with AsyncSessionLocal() as db_session:
            # Fetch user
            result = await db_session.execute(
                select(User).where(User.id == user_id)
            )
            user = result.scalar_one_or_none()
            
            if not user:
                raise AuthenticationError("User not found")
            
            # Verify PIN
            is_valid, _ = verify_and_migrate_pin(pin, user.pin_hash)
            if not is_valid:
                # Log failed deletion attempt
                security_logger.log_sensitive_operation(
                    "account_deletion_failed",
                    user_id,
                    ip_address,
                    {
                        "username": user.username,
                        "reason": "Invalid PIN"
                    }
                )
                raise AuthenticationError("Invalid PIN")
            
            # Store username for logging (before deletion)
            username = user.username
            
            # Log successful account deletion before deleting
            security_logger.log_sensitive_operation(
                "account_deletion",
                user_id,
                ip_address,
                {
                    "username": username,
                    "timestamp": datetime.now().isoformat()
                }
            )
            
            # Delete user - cascade will handle all related records:
            # - tasks (and their tags via association table)
            # - journal_entries
            # - settings (Configuration)
            # - conversations (and messages)
            # - sessions (UserSession)
            await db_session.delete(user)
            await db_session.commit()
            
            logging.info(f"Account deleted successfully: user_id={user_id}, username={username}")
        
        # Clear session after successful deletion
        session.clear()
        
        return success_response({
            "message": "Account deleted successfully",
            "deleted_at": datetime.now().isoformat()
        })
        
    except (ValidationError, AuthenticationError):
        raise  # Re-raise known errors
    except Exception as e:
        logging.exception(f"Failed to delete account for user {session.get('user_id')}")
        raise DatabaseError("Failed to delete account. Please try again.")


@account_deletion_bp.route("/preview", methods=["GET"])
@auth_required
async def preview_deletion():
    """
    Get a preview of what will be deleted when account is deleted.
    Helps users understand the impact before confirming.
    
    Returns:
    {
        "username": "...",
        "data_summary": {
            "tasks": 42,
            "journal_entries": 15,
            "conversations": 3,
            "sessions": 2
        },
        "warning": "This action cannot be undone"
    }
    """
    try:
        user_id = session["user_id"]
        
        async with AsyncSessionLocal() as db_session:
            # Import models here to avoid circular imports
            try:
                from backend.db.models import Task, JournalEntry, Conversation, UserSession
            except ImportError:
                from db.models import Task, JournalEntry, Conversation, UserSession
            
            # Fetch user
            result = await db_session.execute(
                select(User).where(User.id == user_id)
            )
            user = result.scalar_one_or_none()
            
            if not user:
                raise AuthenticationError("User not found")
            
            # Count related records
            tasks_count = await db_session.scalar(
                select(func.count(Task.id)).where(Task.created_by == user_id)
            )
            
            journal_count = await db_session.scalar(
                select(func.count(JournalEntry.id)).where(JournalEntry.user_id == user_id)
            )
            
            conversations_count = await db_session.scalar(
                select(func.count(Conversation.id)).where(Conversation.user_id == user_id)
            )
            
            sessions_count = await db_session.scalar(
                select(func.count(UserSession.id)).where(UserSession.user_id == user_id)
            )
            
            return success_response({
                "username": user.username,
                "data_summary": {
                    "tasks": tasks_count or 0,
                    "journal_entries": journal_count or 0,
                    "conversations": conversations_count or 0,
                    "sessions": sessions_count or 0
                },
                "warning": "This action cannot be undone. All your data will be permanently deleted."
            })
            
    except AuthenticationError:
        raise
    except Exception as e:
        logging.exception("Failed to preview account deletion")
        raise DatabaseError("Failed to load account information")
