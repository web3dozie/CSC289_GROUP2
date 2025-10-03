from quart import Blueprint, request, jsonify, session
import logging
from datetime import datetime, date, timedelta
from sqlalchemy import select, and_, func
from sqlalchemy.orm import selectinload
from backend.db_async import AsyncSessionLocal
from backend.models import Task, Status, auth_required
from backend.cache_utils import cache
tasks_bp = Blueprint('tasks', __name__, url_prefix='/api/tasks')

@tasks_bp.route('/', methods=['GET'])
@tasks_bp.route('', methods=['GET'])
@auth_required
async def get_tasks():
    """Get all tasks for the user with pagination"""
    try:
        # Get the page number and items per page from the URL (default to page 1, 20 items)
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        # Figure out how many items to skip based on which page we're on
        offset = (page - 1) * per_page
        
        async with AsyncSessionLocal() as db_session:
            # Count how many total tasks this user has
            count_result = await db_session.execute(
                select(func.count(Task.id))
                .where(Task.created_by == session['user_id'])
            )
            total = count_result.scalar()
            
            # Get just the tasks for this page (not all tasks)
            result = await db_session.execute(
                select(Task).options(selectinload(Task.status))
                .where(Task.created_by == session['user_id'])
                .order_by(Task.priority.desc(), Task.updated_on.desc())
                .limit(per_page)
                .offset(offset)
            )
            tasks = result.scalars().all()
            
            # Send back the tasks plus info about pagination
            return jsonify({
                'tasks': [task.to_dict() for task in tasks],
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': total,
                    'pages': (total + per_page - 1) // per_page
                }
            })
    except Exception as e:
        logging.exception("Failed to fetch tasks")
        return jsonify({'error': 'Failed to fetch tasks'}), 500

@tasks_bp.route('/', methods=['POST'])
@tasks_bp.route('', methods=['POST'])
@auth_required
async def create_task():
    """Create a new task"""
    data = await request.get_json()
    
    if not data or not data.get('title', '').strip():
        return jsonify({'error': 'Task title is required'}), 400
    
    try:
        async with AsyncSessionLocal() as db_session:
            task = Task(
                title=data['title'].strip(),
                description=data.get('description', ''),
                category=data.get('category'),
                priority=bool(data.get('priority', False)),
                due_date=datetime.strptime(data['due_date'], '%Y-%m-%d').date() if data.get('due_date') else None,
                estimate_minutes=data.get('estimate_minutes'),
                created_by=session['user_id']
            )
            db_session.add(task)
            await db_session.commit()
            await db_session.refresh(task)
            
            # Re-query with selectinload so related objects (status) are loaded safely
            result = await db_session.execute(
                select(Task).options(selectinload(Task.status)).where(Task.id == task.id)
            )
            task = result.scalars().first()
            return jsonify(task.to_dict()), 201            
    except Exception as e:
        logging.exception("Failed to create task")
        return jsonify({'error': 'Failed to create task'}), 500

@tasks_bp.route('/kanban', methods=['GET'])
@auth_required

async def get_cached_statuses(db_session):
    """Get all statuses with caching - speeds up loading"""
    # Look in cache first (statuses don't belong to specific users)
    cached_statuses = cache.get('all_statuses')
    if cached_statuses is not None:
        return cached_statuses
    
    # Not in cache yet, so grab from database
    status_result = await db_session.execute(select(Status))
    statuses = status_result.scalars().all()
    
    # Store for 30 minutes (statuses almost never change)
    cache.set('all_statuses', statuses, ttl_seconds=1800)
    
    return statuses

    try:
        async with AsyncSessionLocal() as db_session:
            statuses = await get_cached_statuses(db_session)
            
            kanban_data = {}
            
            for status in statuses:
                task_result = await db_session.execute(
                    select(Task).options(selectinload(Task.status))
                    .where(and_(Task.created_by == session['user_id'], Task.status_id == status.id))
                    .order_by(Task.priority.desc(), Task.updated_on.desc())
                )
                tasks = task_result.scalars().all()
                
                kanban_data[status.description.lower().replace(' ', '_')] = {
                    'status_id': status.id,
                    'name': status.description,
                    'tasks': [task.to_dict() for task in tasks]
                }
            
            return jsonify(kanban_data)
            
    except Exception as e:
        logging.exception("Failed to fetch kanban board")
        return jsonify({'error': 'Failed to fetch kanban board'}), 500

@tasks_bp.route('/categories', methods=['GET'])
@auth_required
async def get_categories():
    """Get available categories from user's tasks with caching"""
    # Create a cache key specific to this user
    cache_key = f"categories_user_{session['user_id']}"
    
    # Check cache first
    cached_categories = cache.get(cache_key)
    if cached_categories is not None:
        return jsonify(cached_categories)
    
    # If not in cache, query database
    try:
        async with AsyncSessionLocal() as db_session:
            result = await db_session.execute(
                select(Task.category)
                .where(and_(Task.created_by == session['user_id'], Task.category.isnot(None)))
                .distinct()
            )
            categories = [row[0] for row in result.all()]
            
            # Store in cache for 5 minutes (300 seconds)
            cache.set(cache_key, categories, ttl_seconds=300)
            
            return jsonify(categories)
    except Exception as e:
        logging.exception("Failed to fetch categories")
        return jsonify({'error': 'Failed to fetch categories'}), 500


@tasks_bp.route('/<int:task_id>', methods=['GET'])
@auth_required
async def get_task(task_id):
    """Fetch a single task by id for the current user"""
    try:
        async with AsyncSessionLocal() as db_session:
            result = await db_session.execute(
                select(Task).options(selectinload(Task.status)).where(
                    Task.id == task_id,
                    Task.created_by == session['user_id']
                )
            )
            task = result.scalars().first()
            if not task:
                return jsonify({'error': 'Task not found'}), 404
            return jsonify(task.to_dict())
    except Exception:
        logging.exception("Failed to fetch task")
        return jsonify({'error': 'Failed to fetch task'}), 500


@tasks_bp.route('/<int:task_id>', methods=['PUT'])
@auth_required
async def update_task(task_id):
    """Update a task's fields"""
    data = await request.get_json()
    try:
        async with AsyncSessionLocal() as db_session:
            task = await db_session.get(Task, task_id)
            if not task or task.created_by != session['user_id']:
                return jsonify({'error': 'Task not found'}), 404

            if not data:
                return jsonify({'error': 'No data provided'}), 400
            if 'title' in data:
                task.title = data['title']
            if 'description' in data:
                task.description = data['description']
            if 'done' in data:
                task.done = bool(data['done'])
            if 'category' in data:
                task.category = data['category']
            if 'priority' in data:
                task.priority = bool(data['priority'])
            if 'due_date' in data:
                task.due_date = datetime.strptime(data['due_date'], '%Y-%m-%d').date() if data['due_date'] else None
            if 'estimate_minutes' in data:
                task.estimate_minutes = data['estimate_minutes']
            if 'status_id' in data:
                task.status_id = int(data['status_id'])

            await db_session.commit()
            # Re-query with selectinload so related objects (status) are loaded safely
            result = await db_session.execute(
                select(Task).options(selectinload(Task.status)).where(Task.id == task_id)
            )
            task = result.scalars().first()
            return jsonify(task.to_dict())
    except Exception:
        logging.exception("Failed to update task")
        return jsonify({'error': 'Failed to update task'}), 500


@tasks_bp.route('/<int:task_id>', methods=['DELETE'])
@auth_required
async def delete_task(task_id):
    """Delete a task by id"""
    try:
        async with AsyncSessionLocal() as db_session:
            task = await db_session.get(Task, task_id)
            if not task or task.created_by != session['user_id']:
                return jsonify({'error': 'Task not found'}), 404
            await db_session.delete(task)
            await db_session.commit()
            return ('', 204)
    except Exception:
        logging.exception("Failed to delete task")
        return jsonify({'error': 'Failed to delete task'}), 500


@tasks_bp.route('/calendar', methods=['GET'])
@auth_required
async def get_calendar_tasks():
    """Get tasks grouped by due date for calendar view"""
    try:
        print(f"Calendar request for user: {session.get('user_id')}")
        async with AsyncSessionLocal() as db_session:
            result = await db_session.execute(
                select(Task).options(selectinload(Task.status))
                .where(and_(Task.created_by == session['user_id'], Task.due_date.isnot(None)))
                .order_by(Task.due_date, Task.priority.desc(), Task.updated_on.desc())
            )
            tasks = result.scalars().all()
            
            print(f"Found {len(tasks)} tasks with due dates")
            
            # Group tasks by due_date
            grouped_tasks = {}
            for task in tasks:
                date_key = task.due_date.isoformat()  # 'YYYY-MM-DD'
                if date_key not in grouped_tasks:
                    grouped_tasks[date_key] = []
                grouped_tasks[date_key].append(task.to_dict())
            
            print(f"Returning grouped tasks with {len(grouped_tasks)} date keys")
            return jsonify(grouped_tasks)
    except Exception:
        logging.exception("Failed to fetch calendar tasks")
        return jsonify({'error': 'Failed to fetch calendar tasks'}), 500
