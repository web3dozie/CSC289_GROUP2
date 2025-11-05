from functools import wraps
from quart import jsonify, session
import inspect
import logging
from datetime import datetime

"""Decorator to require authentication for routes and functions."""


def auth_required(f):
    @wraps(f)
    async def decorated_function(*args, **kwargs):
        logging.debug(f"auth_required check - session keys: {list(session.keys())}")

        # Must have user_id in session
        if "user_id" not in session:
            from backend.errors import AuthenticationError

            logging.warning(
                f"Authentication required - no user_id in session. Session keys: {list(session.keys())}"
            )
            raise AuthenticationError("Authentication required")

        # Must have session_id (added after login)
        session_id = session.get("session_id")
        if session_id:
            # Lazy imports to avoid circular references
            from backend.db.engine_async import AsyncSessionLocal
            from backend.db.models import UserSession
            from backend.errors import AuthenticationError
            from sqlalchemy import select, and_

            logging.debug(
                f"Validating session {session_id} for user {session.get('user_id')}"
            )

            async with AsyncSessionLocal() as db_session:
                result = await db_session.execute(
                    select(UserSession).where(
                        and_(
                            UserSession.session_id == session_id,
                            UserSession.is_active.is_(True),
                        )
                    )
                )
                user_session = result.scalar_one_or_none()

                # Session not found or inactive
                if not user_session:
                    session.clear()
                    logging.warning(
                        f"Invalid session attempt: {session_id} - not found in database or inactive"
                    )
                    raise AuthenticationError("Session expired or invalid")

                # Expired session
                if user_session.expires_at and datetime.now() > user_session.expires_at:
                    user_session.is_active = False
                    await db_session.commit()
                    session.clear()
                    logging.info(
                        f"Session expired for user {user_session.user_id} - expired at {user_session.expires_at}"
                    )
                    raise AuthenticationError("Session has expired")

                # Update last activity timestamp
                user_session.last_activity = datetime.now()
                await db_session.commit()
                logging.debug(
                    f"Session activity updated for user {user_session.user_id}, expires at {user_session.expires_at}"
                )

        else:
            logging.warning(
                f"No session_id in session for user {session.get('user_id')}"
            )
            session.clear()
            from backend.errors import AuthenticationError

            raise AuthenticationError("Authentication required")

        # Execute wrapped route
        if inspect.iscoroutinefunction(f):
            return await f(*args, **kwargs)
        else:
            return f(*args, **kwargs)

    return decorated_function
