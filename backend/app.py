# try:
#     from . import bootstrap_shim
# except Exception:
#     try:
#         import bootstrap_shim
#     except Exception:
#         pass

import os
from quart import Quart, jsonify
from quart_cors import cors
from datetime import datetime
from sqlalchemy import select, func


# Imports for running the full app
# from backend.db.engine_async import async_engine, AsyncSessionLocal
# from backend.db.models import Base, Status, Task

# Imports for 'run-backend.ps1' script
from db.engine_async import async_engine, AsyncSessionLocal
from db.models import Base, Status, Task


def create_app():
    """Create and configure the Quart app"""
    app = Quart(__name__)

    # Enable CORS for frontend communication
    cors(app)

    # Configuration
    app.config["SECRET_KEY"] = os.environ.get(
        "SECRET_KEY", "dev-key-change-in-production"
    )

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

    @app.route("/favicon.ico")
    async def favicon():
        return ("", 204)

    # Register blueprints (we'll add these as we create them)
    try:
        from blueprints.auth.routes import auth_bp

        app.register_blueprint(auth_bp)
    except ImportError:
        print("Auth blueprint not found - will add later")

    try:
        from blueprints.tasks.routes import tasks_bp

        app.register_blueprint(tasks_bp)
    except ImportError:
        print("Tasks blueprint not found - will add later")
    try:
        from blueprints.review.routes import review_bp

        app.register_blueprint(review_bp)
    except ImportError:
        print("Review blueprint not found - will add later")

    try:
        from blueprints.settings.routes import settings_bp

        app.register_blueprint(settings_bp)
    except ImportError:
        print("Settings blueprint not found - will add later")

    # Error handlers
    @app.errorhandler(404)
    async def not_found(error):
        return jsonify({"error": "Resource not found"}), 404

    @app.errorhandler(400)
    async def bad_request(error):
        return jsonify({"error": "Bad request"}), 400

    @app.errorhandler(500)
    async def internal_error(error):
        return jsonify({"error": "Internal server error"}), 500


async def initialize_database():
    """Initialize database with tables and default data"""
    try:
        # Create tables
        async with async_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("Database tables created successfully!")

        # Seed default data
        async with AsyncSessionLocal() as session:

            # Add default statuses for kanban board
            result = await session.execute(select(func.count(Status.id)))
            status_count = result.scalar_one()

            if status_count == 0:
                default_statuses = [
                    Status(id=1, description="Todo"),
                    Status(id=2, description="In Progress"),
                    Status(id=3, description="Done"),
                ]
                for status in default_statuses:
                    session.add(status)
                print("Default statuses created!")

            await session.commit()

    except Exception as e:
        print(f"Database initialization failed: {e}")


def main():
    print("Starting Task Line API...")
    print("Server starting on http://localhost:5000")
    print("Health check at http://localhost:5000/api/health")
    print("Press Ctrl+C to stop")

    app.run(debug=True, host="127.0.0.1", port=5001)


# Create app instance
app = create_app()

if __name__ == "__main__":
    main()
