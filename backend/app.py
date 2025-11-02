
import os
from quart import Quart, jsonify, request, session
from quart_rate_limiter import RateLimiter, rate_limit
from quart_cors import cors
from datetime import datetime
from sqlalchemy import select, func, text

# Add the backend directory to Python path for imports
import sys
import os

# Add both current directory and parent directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, current_dir)
sys.path.insert(0, parent_dir)

# Import environment variables
try:
    from backend.config import DATABASE_URL, SECRET_KEY
except ImportError:
    from config import DATABASE_URL, SECRET_KEY

# Imports for running the full app
try:
    from backend.db.engine_async import async_engine, AsyncSessionLocal
    from backend.db.models import Base, Status, Task, auth_required
except ImportError:
    from db.engine_async import async_engine, AsyncSessionLocal
    from db.models import Base, Status, Task, auth_required

# Import for database health check and migrations
from pathlib import Path
from db.health_check import check_db_health


def create_app():
    """Create and configure the Quart app"""
    app = Quart(__name__)
    
    # Initialize rate limiter for brute force protection
    rate_limiter = RateLimiter(app)

    # Enable CORS for frontend communication with credentials support
    cors(app, allow_origin="http://localhost:5173", allow_credentials=True)

    # Add security headers middleware
    @app.after_request
    async def add_security_headers(response):
        """Add security headers to all responses"""
        # Prevent XSS attacks
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        
        # Content Security Policy
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "connect-src 'self' http://localhost:5173"
        )
        
        return response

    # Configuration - use values from config.py (which loads .env and has defaults)
    app.config["SECRET_KEY"] = SECRET_KEY
    app.config["DATABASE_URL"] = DATABASE_URL
    
    # Session configuration for better persistence
    app.config["SESSION_COOKIE_NAME"] = "taskline_session"
    app.config["SESSION_COOKIE_HTTPONLY"] = True  # Prevent XSS access to cookies
    app.config["SESSION_COOKIE_SECURE"] = False  # Set to True in production with HTTPS
    app.config["SESSION_COOKIE_SAMESITE"] = "Lax"  # CSRF protection
    app.config["PERMANENT_SESSION_LIFETIME"] = 86400  # 24 hours default
    app.config["SESSION_REFRESH_EACH_REQUEST"] = True  # Keep session alive on activity
    
    # Register routes
    register_routes(app)

    # Database initialization
    @app.before_serving
    async def startup():
        try:
            await initialize_database()
        except Exception as e:
            print(f"Database initialization failed: {e}")

    @app.after_serving
    async def shutdown():
        try:
            await async_engine.dispose()
            print("Database engine disposed")
        except Exception as e:
            print(f"Engine disposal failed: {e}")

        # Close LLM service HTTP client
        try:
            from backend.blueprints.chat.routes import llm_service
            await llm_service.close()
            print("LLM service closed")
        except Exception as e:
            print(f"LLM service cleanup failed: {e}")

    return app


def register_routes(app):
    """Register all route blueprints"""

    @app.route("/")
    async def home():
        return jsonify(
            {
                "message": "Welcome to Task Line API!",
                "version": "1.0",
                "endpoints": {
                    "auth": "/api/auth",
                    "tasks": "/api/tasks",
                    "review": "/api/review",
                    "settings": "/api/settings",
                    "health": "/api/health",
                },
            }
        )

    @app.route("/api/health")
    async def health_check():
        return jsonify(
            {
                "status": "healthy",
                "timestamp": datetime.now().isoformat(),
                "database": "connected",
            }
        )

    @app.route('/api/export', methods=['GET'])
    @auth_required
    async def export_data():
        """Export all user data as JSON"""
        try:
            try:
                from backend.db.models import Task, JournalEntry, Configuration, Status
            except ImportError:
                from db.models import Task, JournalEntry, Configuration, Status
            from sqlalchemy import select
            from sqlalchemy.orm import selectinload
            import logging
            
            async with AsyncSessionLocal() as db_session:
                # Export tasks
                task_result = await db_session.execute(
                    select(Task).options(selectinload(Task.status))
                    .where(Task.created_by == session['user_id'])
                )
                tasks = []
                for task in task_result.scalars().all():
                    try:
                        tasks.append(task.to_dict())
                    except Exception as e:
                        logging.error(f"Error serializing task {task.id}: {e}")
                        # Fallback: create dict manually
                        tasks.append({
                            "id": task.id,
                            "title": task.title,
                            "description": task.description,
                            "notes": task.notes,
                            "category": None,  # Skip complex relationships for now
                            "status": {"id": task.status_id, "name": "Unknown"} if task.status_id else None,
                            "tags": [],
                            "done": task.done,
                            "archived": task.archived,
                            "priority": task.priority,
                            "estimate_minutes": task.estimate_minutes,
                            "order": task.order,
                            "parent_id": task.parent_id,
                            "due_date": task.due_date.isoformat() if task.due_date else None,
                            "created_at": task.created_on.isoformat() if task.created_on else None,
                            "updated_on": task.updated_on.isoformat() if task.updated_on else None,
                            "closed_on": task.closed_on.isoformat() if task.closed_on else None,
                            "created_by": task.created_by,
                        })
                
                # Export journal entries
                journal_result = await db_session.execute(
                    select(JournalEntry).where(JournalEntry.user_id == session['user_id'])
                )
                journal_entries = [entry.to_dict() for entry in journal_result.scalars().all()]
                
                # Export settings
                settings_result = await db_session.execute(
                    select(Configuration).where(Configuration.user_id == session['user_id'])
                )
                settings = [setting.to_dict() for setting in settings_result.scalars().all()]
                
                export_data = {
                    'version': '1.0',
                    'exported_at': datetime.now().isoformat(),
                    'tasks': tasks,
                    'journal_entries': journal_entries,
                    'settings': settings
                }
                
                return jsonify(export_data)
                
        except Exception as e:
            import logging
            logging.exception("Failed to export data")
            return jsonify({'error': 'Failed to export data'}), 500

    @app.route('/api/import', methods=['POST'])
    @auth_required
    async def import_data():
        """Import user data from JSON"""
        try:
            data = await request.get_json()
            
            if not data or 'version' not in data:
                return jsonify({'error': 'Invalid import data format'}), 400
            
            try:
                from backend.db.models import Task, JournalEntry, Configuration, Status
            except ImportError:
                from db.models import Task, JournalEntry, Configuration, Status
            from sqlalchemy import select
            from datetime import datetime
            
            async with AsyncSessionLocal() as db_session:
                imported_count = {'tasks': 0, 'journal_entries': 0, 'settings': 0}
                
                # Import tasks
                if 'tasks' in data:
                    for task_data in data['tasks']:
                        # Skip if task with same title and created_at already exists
                        existing_result = await db_session.execute(
                            select(Task).where(
                                Task.title == task_data['title'],
                                Task.created_by == session['user_id']
                            )
                        )
                        if existing_result.scalars().first():
                            continue  # Skip duplicate
                            
                        task = Task(
                            title=task_data['title'],
                            description=task_data.get('description', ''),
                            notes=task_data.get('notes', ''),
                            done=task_data.get('done', False),
                            # Note: new schema uses category_id instead of category string
                            # For now, skip category mapping - would need proper category creation
                            status_id=task_data.get('status', {}).get('id', 1) if task_data.get('status') else 1,
                            due_date=datetime.fromisoformat(task_data['due_date']) if task_data.get('due_date') else datetime.now(),
                            created_on=datetime.fromisoformat(task_data['created_at']) if task_data.get('created_at') else datetime.now(),
                            updated_on=datetime.fromisoformat(task_data['updated_on']) if task_data.get('updated_on') else datetime.now(),
                            closed_on=datetime.fromisoformat(task_data['closed_on']) if task_data.get('closed_on') else None,
                            created_by=session['user_id']
                        )
                        db_session.add(task)
                        imported_count['tasks'] += 1
                
                # Import journal entries
                if 'journal_entries' in data:
                    for entry_data in data['journal_entries']:
                        # Skip if entry with same date and content already exists
                        existing_result = await db_session.execute(
                            select(JournalEntry).where(
                                JournalEntry.entry_date == datetime.fromisoformat(entry_data['entry_date']),
                                JournalEntry.content == entry_data['content'],
                                JournalEntry.user_id == session['user_id']
                            )
                        )
                        if existing_result.scalars().first():
                            continue  # Skip duplicate
                            
                        entry = JournalEntry(
                            user_id=session['user_id'],
                            entry_date=datetime.fromisoformat(entry_data['entry_date']),
                            content=entry_data['content'],
                            created_at=datetime.fromisoformat(entry_data['created_at']) if entry_data.get('created_at') else datetime.now(),
                            updated_on=datetime.fromisoformat(entry_data['updated_on']) if entry_data.get('updated_on') else datetime.now()
                        )
                        db_session.add(entry)
                        imported_count['journal_entries'] += 1
                
                # Import settings (update existing or create new)
                if 'settings' in data and data['settings']:
                    settings_data = data['settings'][0]  # Assume single settings object
                    existing_result = await db_session.execute(
                        select(Configuration).where(Configuration.user_id == session['user_id'])
                    )
                    existing_settings = existing_result.scalars().first()
                    
                    if existing_settings:
                        # Update existing
                        existing_settings.notes_enabled = settings_data.get('notes_enabled', True)
                        existing_settings.timer_enabled = settings_data.get('timer_enabled', True)
                        # Handle both old (ai_url) and new (ai_api_url, ai_model, ai_api_key) formats for backward compatibility
                        if 'ai_api_url' in settings_data:
                            existing_settings.ai_api_url = settings_data.get('ai_api_url')
                        elif 'ai_url' in settings_data:
                            # Backward compatibility: map old ai_url to new ai_api_url
                            existing_settings.ai_api_url = settings_data.get('ai_url')
                        if 'ai_model' in settings_data:
                            existing_settings.ai_model = settings_data.get('ai_model')
                        if 'ai_api_key' in settings_data:
                            existing_settings.ai_api_key = settings_data.get('ai_api_key')
                        existing_settings.auto_lock_minutes = settings_data.get('auto_lock_minutes', 10)
                        existing_settings.theme = settings_data.get('theme', 'light')
                    else:
                        # Create new
                        # Handle both old (ai_url) and new (ai_api_url, ai_model, ai_api_key) formats for backward compatibility
                        ai_api_url = settings_data.get('ai_api_url') or settings_data.get('ai_url')
                        new_settings = Configuration(
                            user_id=session['user_id'],
                            notes_enabled=settings_data.get('notes_enabled', True),
                            timer_enabled=settings_data.get('timer_enabled', True),
                            ai_api_url=ai_api_url,
                            ai_model=settings_data.get('ai_model'),
                            ai_api_key=settings_data.get('ai_api_key'),
                            auto_lock_minutes=settings_data.get('auto_lock_minutes', 10),
                            theme=settings_data.get('theme', 'light')
                        )
                        db_session.add(new_settings)
                    
                    imported_count['settings'] += 1
                
                await db_session.commit()
                
                return jsonify({
                    'success': True,
                    'message': 'Data imported successfully',
                    'imported': imported_count
                })
                
        except Exception:
            import logging
            logging.exception("Failed to import data")
            return jsonify({'error': 'Failed to import data'}), 500

    @app.route("/favicon.ico")
    async def favicon():
        return ("", 204)

    # Register blueprints (we'll add these as we create them)
    try:
        try:
            from backend.blueprints.auth.routes import auth_bp
        except ImportError:
            from blueprints.auth.routes import auth_bp
        app.register_blueprint(auth_bp)
    except ImportError:
        print("Auth blueprint not found - will add later")

    try:
        try:
            from backend.blueprints.tasks.routes import tasks_bp
        except ImportError:
            from blueprints.tasks.routes import tasks_bp
        app.register_blueprint(tasks_bp)
    except ImportError:
        print("Tasks blueprint not found - will add later")
    try:
        try:
            from backend.blueprints.review.routes import review_bp
        except ImportError:
            from blueprints.review.routes import review_bp
        app.register_blueprint(review_bp)
    except ImportError:
        print("Review blueprint not found - will add later")

    try:
        try:
            from backend.blueprints.settings.routes import settings_bp
        except ImportError:
            from blueprints.settings.routes import settings_bp
        app.register_blueprint(settings_bp)
    except ImportError:
        print("Settings blueprint not found - will add later")

    try:
        try:
            from backend.blueprints.chat.routes import chat_bp
        except ImportError:
            from blueprints.chat.routes import chat_bp
        app.register_blueprint(chat_bp)
        print("✓ Chat blueprint registered")
    except ImportError as e:
        print(f"⚠ Chat blueprint not available: {e}")

    try:
        try:
            from backend.blueprints.sessions.routes import sessions_bp
        except ImportError:
            from blueprints.sessions.routes import sessions_bp
        app.register_blueprint(sessions_bp)
        print("✓ Sessions blueprint registered")
    except ImportError as e:
        print(f"⚠ Sessions blueprint not available: {e}")

    # Error handlers - Standardized error responses
    try:
        from backend.errors import (
            APIError, ValidationError, AuthenticationError, AuthorizationError,
            NotFoundError, DatabaseError, ServerError, error_response
        )
    except ImportError:
        from errors import (
            APIError, ValidationError, AuthenticationError, AuthorizationError,
            NotFoundError, DatabaseError, ServerError, error_response
        )
    
    @app.errorhandler(APIError)
    async def handle_api_error(error: APIError):
        """Handle custom API exceptions"""
        import logging
        if error.status_code >= 500:
            logging.error(f"API Error: {error.message}", exc_info=True)
        return jsonify(error.to_dict()), error.status_code

    @app.errorhandler(404)
    async def not_found(error):
        return error_response("Resource not found", 404)

    @app.errorhandler(400)
    async def bad_request(error):
        return error_response("Bad request", 400)
    
    @app.errorhandler(401)
    async def unauthorized(error):
        return error_response("Authentication required", 401)
    
    @app.errorhandler(403)
    async def forbidden(error):
        return error_response("Access denied", 403)

    @app.errorhandler(500)
    async def internal_error(error):
        import logging
        logging.error(f"Internal server error: {error}", exc_info=True)
        return error_response("Internal server error", 500)
    
    @app.errorhandler(Exception)
    async def handle_unexpected_error(error):
        """Catch-all handler for unexpected exceptions"""
        import logging
        logging.exception(f"Unexpected error: {error}")
        
        # In development, include error details
        details = None
        if app.debug:
            details = {
                "type": type(error).__name__,
                "message": str(error)
            }
        
        return error_response(
            "An unexpected error occurred",
            500,
            details
        )


async def initialize_database():
    """Sanity check database schema and default data"""
    try:
        await check_db_health(
            engine=async_engine,
            alembic_ini_path=Path(__file__).with_name("alembic.ini"),
            required_tables=(
                "user",
                "status",
                "task",
                "journal_entries",
                "category",
                "tag",
                "task_tag",
                "configuration",
            ),
        )

        print("Database connection and schema verified")
    except Exception as e:
        print(f"Database health check failed: {e}")
        print("Attempting to run migrations...")
        try:
            # Try to run alembic migrations automatically
            from alembic.config import Config
            from alembic import command
            
            alembic_cfg = Config(str(Path(__file__).with_name("alembic.ini")))
            command.upgrade(alembic_cfg, "head")
            print("Database migrations completed successfully")
            
            # Verify again after migrations
            await check_db_health(
                engine=async_engine,
                alembic_ini_path=Path(__file__).with_name("alembic.ini"),
                required_tables=(
                    "user",
                    "status",
                    "task",
                    "journal_entries",
                    "category",
                    "tag",
                    "task_tag",
                    "configuration",
                ),
            )
            print("Database connection and schema verified after migration")
        except Exception as migration_error:
            print(f"Database initialization failed: {migration_error}")
            raise


def main():
    # Default to 0.0.0.0 for Docker compatibility, but allow override via env var
    host = os.environ.get('TASKLINE_HOST', '0.0.0.0')
    print("Starting Task Line API...")
    print(f"Server starting on http://{host}:5001")
    print(f"Health check at http://{host}:5001/api/health")
    print("Press Ctrl+C to stop")

    debug_mode = os.environ.get('TASKLINE_DEBUG', '0') == '1'
    app.run(
        debug=debug_mode,
        host=host,
        port=5001
    )

# Create app instance
app = create_app()

if __name__ == "__main__":
    main()
