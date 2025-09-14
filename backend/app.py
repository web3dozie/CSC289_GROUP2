#!/usr/bin/env python3
"""
Momentum Task Manager - Phase 1
A clean, Flask API for task management
Author: Issagha Diallo 
Created: 9/12/2025
"""
import os
from functools import wraps
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

# Create the db object up front.
# We'll attach it to the app later inside create_app().
db = SQLAlchemy()

# -----------------------------
# Input validation decorator
# -----------------------------
def validate_json(*expected_fields):
    """
    Small helper to make sure we actually got JSON
    and that certain fields are present and non-empty.
    """
    def decorator(f):
        @wraps(f)
        def fn(*args, **kwargs):
            # Must be JSON (e.g., Content-Type: application/json)
            if not request.is_json:
                return jsonify({'error': 'Content-Type must be application/json'}), 400

            # Try to parse the body without blowing up on bad JSON
            data = request.get_json(silent=True)
            if data is None:
                return jsonify({'error': 'Malformed JSON'}), 400

            # Make sure required fields exist and aren't just whitespace
            for field in expected_fields:
                if field not in data:
                    return jsonify({'error': f'{field} is required'}), 400
                if isinstance(data[field], str) and not data[field].strip():
                    return jsonify({'error': f'{field} cannot be empty'}), 400

            return f(*args, **kwargs)
        return fn
    return decorator

# -----------------------------
# Database Model
# -----------------------------
class Task(db.Model):
    """
    Tiny task table for Phase 1: title + done + created_at.
    Keep it simple for now; easy to extend later.
    """
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    done = db.Column(db.Boolean, default=False)
    # Using a naive timestamp for Phase 1. We can swap to UTC-aware in Phase 2.
    created_at = db.Column(db.DateTime, default=datetime.now)

    def to_dict(self):
        # Shape the object exactly how the API returns it.
        return {
            'id': self.id,
            'title': self.title,
            'done': self.done,
            'created_at': self.created_at.isoformat()
        }

# -----------------------------
# App Factory
# -----------------------------
def create_app():
    """
    Build the Flask app, wire up extensions, and register routes.
    Using a factory keeps testing and config changes straightforward.
    """
    app = Flask(__name__)

    # Allow the frontend (usually running on a different port) to call us.
    CORS(app)

    # SQLite is perfect for local dev. No setup required.
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///momentum.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # In production, this should come from the environment.
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-key-change-in-production')

    # Attach the db instance to this app.
    db.init_app(app)

    # Optional: simple rate limiting so we don’t get hammered in a demo.
    # If the package isn’t installed, we just skip it.
    try:
        from flask_limiter import Limiter
        from flask_limiter.util import get_remote_address
        Limiter(
            key_func=get_remote_address,
            app=app,
            default_limits=["200 per hour"],  # global default
            storage_uri="memory://"          # swap to Redis for real deployments
        )
    except Exception:
        pass

    # All endpoints live in one place.
    register_routes(app)

    return app

# -----------------------------
# Routes
# -----------------------------
def register_routes(app):
    """Hook up all endpoints and error handlers."""

    # Quick landing page so you know the server is alive.
    @app.route('/')
    def home():
        return jsonify({
            'message': 'Welcome to Momentum Task Manager API!',
            'version': '1.0',
            'endpoints': {
                'tasks': '/api/tasks',
                'health': '/api/health'
            }
        })

    # Simple health check for pings/monitoring.
    @app.route('/api/health')
    def health_check():
        return jsonify({
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'database': 'connected'
        })

    # List tasks, newest first. Supports a basic limit.
    @app.route('/api/tasks', methods=['GET'])
    def get_tasks():
        """
        Query params:
          - limit (int): max number of tasks (default 50, max 100)
        """
        try:
            limit = min(int(request.args.get('limit', 50)), 100)
            tasks = Task.query.order_by(Task.created_at.desc()).limit(limit).all()
            return jsonify([task.to_dict() for task in tasks])
        except ValueError:
            return jsonify({'error': 'limit must be a valid integer'}), 400
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    # Create a task. Title is required and capped at 200 chars.
    @app.route('/api/tasks', methods=['POST'])
    @validate_json('title')
    def create_task():
        """
        Body:
          - title (str, <= 200)
        """
        try:
            data = request.get_json()
            title = data['title'].strip()

            if len(title) > 200:
                return jsonify({'error': 'Title too long (max 200 characters)'}), 400

            task = Task(title=title)
            db.session.add(task)
            db.session.commit()
            return jsonify(task.to_dict()), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500

    # Fetch a single task by id.
    @app.route('/api/tasks/<int:task_id>', methods=['GET'])
    def get_task(task_id):
        # SQLAlchemy 2.x style lookup (no deprecation warning).
        task = db.session.get(Task, task_id)
        if task is None:
            return jsonify({'error': 'Resource not found'}), 404
        return jsonify(task.to_dict())

    # Update title/done for a task.
    @app.route('/api/tasks/<int:task_id>', methods=['PUT'])
    def update_task(task_id):
        task = db.session.get(Task, task_id)
        if task is None:
            return jsonify({'error': 'Resource not found'}), 404

        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        try:
            if 'title' in data:
                title = data['title'].strip() if data['title'] else ''
                if not title:
                    return jsonify({'error': 'Title cannot be empty'}), 400
                if len(title) > 200:
                    return jsonify({'error': 'Title too long (max 200 characters)'}), 400
                task.title = title

            if 'done' in data:
                task.done = bool(data['done'])

            db.session.commit()
            return jsonify(task.to_dict())
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500

    # Permanently delete a task by id.
    @app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
    def delete_task(task_id):
        task = db.session.get(Task, task_id)
        if task is None:
            return jsonify({'error': 'Resource not found'}), 404

        try:
            db.session.delete(task)
            db.session.commit()
            return '', 204
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500

    # Consistent JSON error responses.
    @app.errorhandler(404)
    def not_found_error(error):
        return jsonify({'error': 'Resource not found'}), 404

    @app.errorhandler(400)
    def bad_request_error(error):
        return jsonify({'error': 'Bad request'}), 400

    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500

# -----------------------------
# Startup
# -----------------------------
def initialize_database(app):
    """
    Create tables on first run and seed a single welcome task
    so the list view has something to show.
    """
    with app.app_context():
        try:
            db.create_all()
            print("Database initialized successfully!")
            if Task.query.count() == 0:
                db.session.add(Task(title="Welcome to Momentum! Edit or delete this task to get started."))
                db.session.commit()
                print("Sample task created!")
        except Exception as e:
            print(f"Database initialization failed: {e}")

def main():
    print("Starting Momentum Task Manager...")
    print("Phase 1: Basic CRUD Operations")

    app = create_app()
    initialize_database(app)

    print("Server starting on http://localhost:8000")
    print("API endpoints available at http://localhost:8000/api/tasks")
    print("Health check at http://localhost:8000/api/health")
    print("Press Ctrl+C to stop the server")

    app.run(
        debug=True,
        host='127.0.0.1',
        port=8000
    )

if __name__ == '__main__':
    main()

