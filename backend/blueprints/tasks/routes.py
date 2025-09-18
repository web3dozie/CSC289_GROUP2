from quart import Blueprint, request, jsonify, session
from datetime import datetime, date, timedelta
from sqlalchemy import select, and_, func
from sqlalchemy.orm import selectinload
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
                .where(Task.created_by == session['user_id'])
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
        return jsonify({'error': 'Failed to fetch kanban board'}), 500

@tasks_bp.route('/categories', methods=['GET'])
@auth_required
async def get_categories():
    """Get available categories"""
    categories = [
        {'id': 'personal', 'name': 'Personal', 'color': '#10B981'},
        {'id': 'work', 'name': 'Work', 'color': '#3B82F6'},
        {'id': 'shopping', 'name': 'Shopping', 'color': '#F59E0B'}
    ]
    return jsonify({'categories': categories})
