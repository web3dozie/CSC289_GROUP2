from quart import Blueprint, request, jsonify, session
import logging
from datetime import datetime, date, timedelta
from sqlalchemy import select, and_, func
from sqlalchemy.orm import selectinload
try:
    from backend.db_async import AsyncSessionLocal
    from backend.models import Task, Status, auth_required
except ImportError:
    import sys
    import os
    sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    from db_async import AsyncSessionLocal
    from models import Task, Status, auth_required

tasks_bp = Blueprint('tasks', __name__, url_prefix='/api/tasks')

@tasks_bp.route('/', methods=['GET'])
@tasks_bp.route('', methods=['GET'])
@auth_required
async def get_tasks():
    """Get all tasks for the user"""
    try:
        async with AsyncSessionLocal() as db_session:
            result = await db_session.execute(
                select(Task).options(selectinload(Task.status))
                .where(and_(Task.created_by == session['user_id'], Task.archived == False))
                .order_by(Task.priority.desc(), Task.updated_on.desc())
            )
            tasks = result.scalars().all()
            return jsonify([task.to_dict() for task in tasks])
    except Exception as e:
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
            
            return jsonify({
                'success': True,
                'message': 'Task created successfully',
                'task_id': task.id
            }), 201
            
    except Exception as e:
        return jsonify({'error': 'Failed to create task'}), 500

@tasks_bp.route('/kanban', methods=['GET'])
@auth_required
async def get_kanban_board():
    """Display kanban board grouped by status"""
    try:
        async with AsyncSessionLocal() as db_session:
            status_result = await db_session.execute(select(Status))
            statuses = status_result.scalars().all()
            
            kanban_data = {}
            
            for status in statuses:
                task_result = await db_session.execute(
                    select(Task).options(selectinload(Task.status))
                    .where(and_(Task.created_by == session['user_id'], Task.status_id == status.id, Task.archived == False))
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
        return jsonify({'error': 'Failed to fetch kanban board'}), 500

@tasks_bp.route('/categories', methods=['GET'])
@auth_required
async def get_categories():
    """Get available categories from user's tasks"""
    try:
        async with AsyncSessionLocal() as db_session:
            result = await db_session.execute(
                select(Task.category)
                .where(and_(Task.created_by == session['user_id'], Task.category.isnot(None)))
                .distinct()
            )
            categories = [row[0] for row in result.all()]
            return jsonify(categories)
    except Exception as e:
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
            if 'archived' in data:
                task.archived = bool(data['archived'])
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
                .where(and_(Task.created_by == session['user_id'], Task.due_date.isnot(None), Task.archived == False))
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

@tasks_bp.route('/archived', methods=['GET'])
@auth_required
async def get_archived_tasks():
    """Get all archived tasks for the user"""
    try:
        async with AsyncSessionLocal() as db_session:
            result = await db_session.execute(
                select(Task).options(selectinload(Task.status))
                .where(and_(Task.created_by == session['user_id'], Task.archived == True))
                .order_by(Task.updated_on.desc())
            )
            tasks = result.scalars().all()
            return jsonify([task.to_dict() for task in tasks])
    except Exception as e:
        logging.exception("Failed to fetch archived tasks")
        return jsonify({'error': 'Failed to fetch archived tasks'}), 500

@tasks_bp.route('/archive-completed', methods=['POST'])
@auth_required
async def archive_completed_tasks():
    """Archive all completed tasks for the user"""
    try:
        async with AsyncSessionLocal() as db_session:
            # Find all completed tasks that are not already archived
            result = await db_session.execute(
                select(Task)
                .where(and_(Task.created_by == session['user_id'], Task.done == True, Task.archived == False))
            )
            tasks_to_archive = result.scalars().all()
            
            if not tasks_to_archive:
                return jsonify({'message': 'No completed tasks to archive', 'archived_count': 0})
            
            # Archive them
            for task in tasks_to_archive:
                task.archived = True
            
            await db_session.commit()
            
            return jsonify({
                'message': f'Successfully archived {len(tasks_to_archive)} completed tasks',
                'archived_count': len(tasks_to_archive)
            })
    except Exception as e:
        logging.exception("Failed to archive completed tasks")
        return jsonify({'error': 'Failed to archive completed tasks'}), 500
