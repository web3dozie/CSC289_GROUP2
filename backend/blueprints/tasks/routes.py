from quart import Blueprint, request, jsonify, session
import logging
from datetime import datetime, date, timedelta
from sqlalchemy import select, and_, func
from sqlalchemy.orm import selectinload
from backend.db.engine_async import AsyncSessionLocal
from backend.db.models import Task, Status, Category, auth_required
from backend.cache_utils import cache
from backend.errors import ValidationError, NotFoundError, DatabaseError, success_response

tasks_bp = Blueprint("tasks", __name__, url_prefix="/api/tasks")


async def resolve_category_name_to_id(category_name: str, db_session, user_id: int) -> int | None:
    """
    Resolve a category name to its database ID.
    If the category doesn't exist, create it with a default color.

    Args:
        category_name: The name of the category (string from frontend)
        db_session: Active database session
        user_id: Current user's ID

    Returns:
        category_id (int) if found/created, None if category_name is empty
    """
    if not category_name or not category_name.strip():
        return None

    category_name = category_name.strip()

    # Try to find existing category
    result = await db_session.execute(
        select(Category).where(
            and_(
                Category.name == category_name,
                Category.created_by == user_id
            )
        )
    )
    existing_category = result.scalars().first()

    if existing_category:
        return existing_category.id

    # Category doesn't exist, create it with default color
    new_category = Category(
        name=category_name,
        description=f"Auto-created category: {category_name}",
        color_hex="808080",  # Default gray color
        created_by=user_id
    )
    db_session.add(new_category)
    await db_session.flush()  # Flush to get the ID without committing

    return new_category.id


@tasks_bp.route("/", methods=["GET"])
@tasks_bp.route("", methods=["GET"])
@auth_required
async def get_tasks():
    """Get all tasks for the user with pagination"""
    try:
        # Get page number and items per page from URL (default to page 1, 20 items)
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
                select(Task).options(selectinload(Task.status), selectinload(Task.tags), selectinload(Task.category))
                .where(Task.created_by == session['user_id'])
                .order_by(Task.updated_on.desc())
                .limit(per_page)
                .offset(offset)
            )
            tasks = result.scalars().all()
            
            # Send back the tasks plus info about pagination
            return success_response({
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
        raise DatabaseError("Failed to fetch tasks")



@tasks_bp.route("/", methods=["POST"])
@tasks_bp.route("", methods=["POST"])
@auth_required
async def create_task():
    """Create a new task"""
    data = await request.get_json()

    if not data or not data.get("title", "").strip():
        raise ValidationError("Task title is required", details={
            'field': 'title'
        })

    try:
        async with AsyncSessionLocal() as db_session:
            # pick a default status if none provided
            if data.get("status_id"):
                status_id = int(data["status_id"])
            else:
                # try to find a sensible default status row (Todo/In Progress)
                res = await db_session.execute(select(Status).limit(1))
                first_status = res.scalars().first()
                status_id = first_status.id if first_status else 1

            # ensure due_date is a datetime
            if data.get("due_date"):
                # accept YYYY-MM-DD date strings
                due_date = datetime.strptime(data["due_date"], "%Y-%m-%d")
            else:
                due_date = datetime.now()

            # Resolve category name to category_id
            category_id = None
            if data.get('category'):
                category_id = await resolve_category_name_to_id(
                    data['category'],
                    db_session,
                    session['user_id']
                )

            task = Task(
                title=data['title'].strip(),
                description=data.get('description', ''),
                category_id=category_id,
                status_id=status_id,
                due_date=due_date,
                priority=data.get('priority', False),
                estimate_minutes=data.get('estimate_minutes'),
                created_by=session['user_id']
            )

            db_session.add(task)
            await db_session.commit()
            await db_session.refresh(task)
            return success_response({
                'message': 'Task created successfully',
                'task_id': task.id
            }, 201)
    except ValidationError:
        raise  # Re-raise validation errors
    except Exception as e:
        logging.exception("Failed to create task")
        raise DatabaseError("Failed to create task")


@tasks_bp.route("/kanban", methods=["GET"])
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

async def get_kanban_board():
    """Display kanban board grouped by status"""
    try:
        async with AsyncSessionLocal() as db_session:
            statuses = await get_cached_statuses(db_session)

            kanban_data = {}

            for status in statuses:
                task_result = await db_session.execute(
                    select(Task).options(selectinload(Task.status), selectinload(Task.tags), selectinload(Task.category))
                    .where(and_(Task.created_by == session['user_id'], Task.status_id == status.id))
                    .order_by(Task.updated_on.desc())
                )
                tasks = task_result.scalars().all()

                kanban_data[status.title.lower().replace(" ", "_")] = {
                    "status_id": status.id,
                    "name": status.title,
                    "tasks": [task.to_dict() for task in tasks],
                }

            return success_response(kanban_data)

    except Exception as e:
        logging.exception("Failed to fetch kanban board")
        raise DatabaseError("Failed to fetch kanban board")


@tasks_bp.route("/categories", methods=["GET"])
@auth_required
async def get_categories():
    """Get available categories for the user as a list of category names with caching"""
    # Create a cache key specific to this user
    cache_key = f"categories_user_{session['user_id']}"
    
    # Look in cache first
    cached_categories = cache.get(cache_key)
    if cached_categories is not None:
        return jsonify(cached_categories)
    
    # Not in cache yet, so grab from database
    try:
        async with AsyncSessionLocal() as db_session:
            result = await db_session.execute(
                select(Category)
                .where(Category.created_by == session['user_id'])
                .order_by(Category.name)
            )
            # Return just the category names as strings, not full objects
            category_names = [category.name for category in result.scalars().all()]
            
            # Store in cache for 5 minutes
            cache.set(cache_key, category_names, ttl_seconds=300)
            
            return jsonify(category_names)
    except Exception as e:
        logging.exception("Failed to fetch categories")


@tasks_bp.route("/<int:task_id>", methods=["GET"])
@auth_required
async def get_task(task_id):
    """Fetch a single task by id for the current user"""
    try:
        async with AsyncSessionLocal() as db_session:
            result = await db_session.execute(
                select(Task)
                .options(selectinload(Task.status), selectinload(Task.tags), selectinload(Task.category))
                .where(Task.id == task_id, Task.created_by == session["user_id"])
            )
            task = result.scalars().first()
            if not task:
                raise NotFoundError("Task not found", details={'task_id': task_id})
            return success_response(task.to_dict())
    except NotFoundError:
        raise  # Re-raise not found errors
    except Exception as e:
        logging.exception("Failed to fetch task")
        raise DatabaseError('Failed to fetch task')


@tasks_bp.route("/<int:task_id>", methods=["PUT"])
@auth_required
async def update_task(task_id):
    """Update a task's fields"""
    data = await request.get_json()
    
    if not data:
        raise ValidationError('No data provided')
        
    try:
        async with AsyncSessionLocal() as db_session:
            task = await db_session.get(Task, task_id)
            if not task or task.created_by != session["user_id"]:
                raise NotFoundError("Task not found", details={'task_id': task_id})

            if 'title' in data:
                task.title = data['title']
            if 'description' in data:
                task.description = data['description']
            if 'notes' in data:
                task.notes = data['notes']
            if 'done' in data:
                task.done = bool(data['done'])
            if 'archived' in data:
                task.archived = bool(data['archived'])
            if 'priority' in data:
                task.priority = bool(data['priority'])
            if 'estimate_minutes' in data:
                task.estimate_minutes = data['estimate_minutes']
            if 'order' in data:
                task.order = int(data['order'])
            # Handle category - accept both string name and integer ID
            if 'category' in data:
                # Frontend sends category as string name
                task.category_id = await resolve_category_name_to_id(
                    data['category'],
                    db_session,
                    session['user_id']
                )
            elif 'category_id' in data:
                # Backwards compatibility: also accept category_id directly
                task.category_id = data['category_id']
            if 'due_date' in data:
                task.due_date = datetime.strptime(data['due_date'], '%Y-%m-%d') if data['due_date'] else None
            if 'status_id' in data:
                task.status_id = int(data['status_id'])

            await db_session.commit()
            # Re-query with selectinload so related objects (status) are loaded safely
            result = await db_session.execute(
                select(Task)
                .options(selectinload(Task.status), selectinload(Task.tags), selectinload(Task.category))
                .where(Task.id == task_id)
            )
            task = result.scalars().first()
            return success_response(task.to_dict())
    except (ValidationError, NotFoundError):
        raise  # Re-raise known errors
    except Exception as e:
        logging.exception("Failed to update task")
        raise DatabaseError('Failed to update task')


@tasks_bp.route("/<int:task_id>", methods=["DELETE"])
@auth_required
async def delete_task(task_id):
    """Delete a task by id"""
    try:
        async with AsyncSessionLocal() as db_session:
            task = await db_session.get(Task, task_id)
            if not task or task.created_by != session["user_id"]:
                raise NotFoundError("Task not found", details={'task_id': task_id})
            await db_session.delete(task)
            await db_session.commit()
            return ("", 204)
    except NotFoundError:
        raise  # Re-raise not found errors
    except Exception as e:
        logging.exception("Failed to delete task")
        raise DatabaseError('Failed to delete task')

@tasks_bp.route('/calendar', methods=['GET'])
@auth_required
async def get_calendar_tasks():
    """Get tasks grouped by due date for calendar view"""
    try:
        async with AsyncSessionLocal() as db_session:
            result = await db_session.execute(
                select(Task).options(selectinload(Task.status), selectinload(Task.tags), selectinload(Task.category))
                .where(and_(Task.created_by == session['user_id'], Task.due_date.isnot(None)))
                .order_by(Task.due_date, Task.updated_on.desc())
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
        raise DatabaseError('Failed to fetch calendar tasks')


@tasks_bp.route('/archive-completed', methods=['POST'])
@auth_required
async def archive_completed_tasks():
    """Archive all completed tasks for the current user"""
    try:
        async with AsyncSessionLocal() as db_session:
            # Find all completed tasks that are not already archived
            result = await db_session.execute(
                select(Task)
                .where(and_(
                    Task.created_by == session['user_id'],
                    Task.done == True,
                    Task.archived == False
                ))
            )
            tasks = result.scalars().all()

            # Mark them as archived
            archived_count = 0
            for task in tasks:
                task.archived = True
                archived_count += 1

            await db_session.commit()

            return jsonify({
                'success': True,
                'message': f'Archived {archived_count} completed tasks',
                'archived_count': archived_count
            })
    except Exception:
        logging.exception("Failed to archive completed tasks")
        return jsonify({'error': 'Failed to archive completed tasks'}), 500


@tasks_bp.route('/archived', methods=['GET'])
@auth_required
async def get_archived_tasks():
    """Get all archived tasks for the current user"""
    try:
        async with AsyncSessionLocal() as db_session:
            result = await db_session.execute(
                select(Task).options(selectinload(Task.status), selectinload(Task.tags), selectinload(Task.category))
                .where(and_(
                    Task.created_by == session['user_id'],
                    Task.archived == True
                ))
                .order_by(Task.updated_on.desc())
            )
            tasks = result.scalars().all()
            return jsonify([task.to_dict() for task in tasks])
    except Exception:
        logging.exception("Failed to fetch archived tasks")
        return jsonify({'error': 'Failed to fetch archived tasks'}), 500