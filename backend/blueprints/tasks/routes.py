from quart import Blueprint, request, jsonify, session
import logging
from datetime import datetime, date, timedelta
from sqlalchemy import select, and_, func
from sqlalchemy.orm import selectinload
from backend.db.engine_async import AsyncSessionLocal
from backend.db.models import Task, Status, Category
from backend.security.auth_decorators import auth_required
from backend.cache_utils import cache
from backend.errors import (
    ValidationError,
    NotFoundError,
    DatabaseError,
    success_response,
)

from backend.validation import TaskValidator, create_validation_error_response

tasks_bp = Blueprint("tasks", __name__, url_prefix="/api/tasks")


async def resolve_category_name_to_id(
    category_name: str, db_session, user_id: int
) -> int | None:
    """
    Resolve a category name to its database ID, creating it if needed.
    Thread-safe with proper locking to prevent race conditions.
    """
    if not category_name or not category_name.strip():
        return None

    category_name = category_name.strip()

    # First attempt: try to get existing category
    result = await db_session.execute(
        select(Category)
        .where(and_(Category.name == category_name, Category.created_by == user_id))
        .with_for_update()  # Lock the row to prevent race conditions
    )
    existing_category = result.scalars().first()

    if existing_category:
        return existing_category.id

    # Category doesn't exist, create it with exception handling for race conditions
    try:
        new_category = Category(
            name=category_name,
            description=f"Auto-created category: {category_name}",
            color_hex="808080",
            created_by=user_id,
        )
        db_session.add(new_category)
        await db_session.flush()
        return new_category.id
    except Exception:
        # Race condition: another transaction created it, rollback and retry
        await db_session.rollback()

        # Retry: fetch the category that was just created by another transaction
        result = await db_session.execute(
            select(Category).where(
                and_(Category.name == category_name, Category.created_by == user_id)
            )
        )
        retry_category = result.scalars().first()

        if retry_category:
            return retry_category.id

        # If still not found, something went wrong
        raise


@tasks_bp.route("/", methods=["GET"])
@tasks_bp.route("", methods=["GET"])
@auth_required
async def get_tasks():
    """Get all non-archived tasks for the user with pagination."""
    try:
        page = request.args.get("page", 1, type=int)
        per_page = request.args.get("per_page", 20, type=int)
        offset = (page - 1) * per_page

        async with AsyncSessionLocal() as db_session:
            count_result = await db_session.execute(
                select(func.count(Task.id)).where(
                    and_(Task.created_by == session["user_id"], Task.archived == False)
                )
            )
            total = count_result.scalar() or 0

            result = await db_session.execute(
                select(Task)
                .options(
                    selectinload(Task.status),
                    selectinload(Task.tags),
                    selectinload(Task.category),
                )
                .where(
                    and_(Task.created_by == session["user_id"], Task.archived == False)
                )
                .order_by(Task.updated_on.desc())
                .limit(per_page)
                .offset(offset)
            )
            tasks = result.scalars().all()

            return success_response(
                {
                    "tasks": [task.to_dict() for task in tasks],
                    "pagination": {
                        "page": page,
                        "per_page": per_page,
                        "total": total,
                        "pages": (total + per_page - 1) // per_page if per_page else 0,
                    },
                }
            )
    except Exception:
        logging.exception("Failed to fetch tasks")
        raise DatabaseError("Failed to fetch tasks")


@tasks_bp.route("/", methods=["POST"])
@tasks_bp.route("", methods=["POST"])
@auth_required
async def create_task():
    """Create a new task with comprehensive validation."""
    data = await request.get_json()

    if not data:
        raise ValidationError("Request body is required")

    try:
        # Validate all input data
        validated_data = TaskValidator.validate_task_data(data)

        async with AsyncSessionLocal() as db_session:
            # Get or default status_id
            if "status_id" in validated_data:
                status_id = validated_data["status_id"]
                # Verify status exists
                status_result = await db_session.execute(
                    select(Status).where(Status.id == status_id)
                )
                if not status_result.scalar_one_or_none():
                    raise ValidationError(
                        "Invalid status ID", details={"field": "status_id"}
                    )
            else:
                res = await db_session.execute(select(Status).limit(1))
                first_status = res.scalars().first()
                status_id = first_status.id if first_status else 1

            # Handle category with thread-safe creation
            category_id = None
            if "category" in validated_data:
                category_id = await resolve_category_name_to_id(
                    validated_data["category"], db_session, session["user_id"]
                )

            # Create task with validated data
            task = Task(
                title=validated_data["title"],
                description=validated_data["description"],
                category_id=category_id,
                status_id=status_id,
                due_date=validated_data["due_date"] or datetime.now(),
                priority=validated_data["priority"],
                estimate_minutes=validated_data["estimate_minutes"],
                created_by=session["user_id"],
            )

            db_session.add(task)
            await db_session.commit()
            await db_session.refresh(task)

            return success_response(
                {"message": "Task created successfully", "task_id": task.id}, 201
            )
    except ValueError as e:
        # Convert validation errors to user-friendly messages
        error_info = create_validation_error_response(e)
        raise ValidationError(error_info["error"], details=error_info)
    except ValidationError:
        raise
    except Exception:
        logging.exception("Failed to create task")
        raise DatabaseError("Failed to create task")


async def get_cached_statuses(db_session):
    """Get all statuses with caching - speeds up loading."""
    cached_statuses = cache.get("all_statuses")
    if cached_statuses is not None:
        return cached_statuses

    status_result = await db_session.execute(select(Status))
    statuses = status_result.scalars().all()
    cache.set("all_statuses", statuses, ttl_seconds=1800)
    return statuses


async def _resolve_status_id(
    db_session, fallback_id: int, *preferred_titles: str
) -> int | None:
    """Resolve a status id by title with an optional fallback."""
    statuses = await get_cached_statuses(db_session)
    normalized_titles = {title.strip().lower() for title in preferred_titles if title}

    for status in statuses:
        title = getattr(status, "title", "")
        if title and title.strip().lower() in normalized_titles:
            return status.id

    for status in statuses:
        if status.id == fallback_id:
            return status.id

    return None


@tasks_bp.route("/kanban", methods=["GET"])
@auth_required
async def get_kanban_board():
    """Display kanban board grouped by status."""
    try:
        async with AsyncSessionLocal() as db_session:
            statuses = await get_cached_statuses(db_session)

            kanban_data = {}

            for status in statuses:
                task_result = await db_session.execute(
                    select(Task)
                    .options(
                        selectinload(Task.status),
                        selectinload(Task.tags),
                        selectinload(Task.category),
                    )
                    .where(
                        and_(
                            Task.created_by == session["user_id"],
                            Task.status_id == status.id,
                            Task.archived == False,
                        )
                    )
                    .order_by(Task.updated_on.desc())
                )
                tasks = task_result.scalars().all()

                kanban_data[status.title.lower().replace(" ", "_")] = {
                    "status_id": status.id,
                    "name": status.title,
                    "tasks": [task.to_dict() for task in tasks],
                }

            return success_response(kanban_data)

    except Exception:
        logging.exception("Failed to fetch kanban board")
        raise DatabaseError("Failed to fetch kanban board")


@tasks_bp.route("/categories", methods=["GET"])
@auth_required
async def get_categories():
    """Get available categories for the user as a list of category names with caching."""
    cache_key = f"task_categories_user_{session['user_id']}"
    cached_categories = cache.get(cache_key)
    if cached_categories is not None:
        return jsonify(cached_categories)

    try:
        async with AsyncSessionLocal() as db_session:
            result = await db_session.execute(
                select(Category)
                .where(Category.created_by == session["user_id"])
                .order_by(Category.name)
            )
            category_names = [category.name for category in result.scalars().all()]
            cache.set(cache_key, category_names, ttl_seconds=300)
            return jsonify(category_names)
    except Exception:
        logging.exception("Failed to fetch categories")


@tasks_bp.route("/<int:task_id>", methods=["GET"])
@auth_required
async def get_task(task_id):
    """Fetch a single task by id for the current user."""
    try:
        async with AsyncSessionLocal() as db_session:
            result = await db_session.execute(
                select(Task)
                .options(
                    selectinload(Task.status),
                    selectinload(Task.tags),
                    selectinload(Task.category),
                )
                .where(Task.id == task_id, Task.created_by == session["user_id"])
            )
            task = result.scalars().first()
            if not task:
                raise NotFoundError("Task not found", details={"task_id": task_id})
            return success_response(task.to_dict())
    except NotFoundError:
        raise
    except Exception:
        logging.exception("Failed to fetch task")
        raise DatabaseError("Failed to fetch task")


@tasks_bp.route("/<int:task_id>", methods=["PUT"])
@auth_required
async def update_task(task_id):
    """Update a task's fields."""
    data = await request.get_json()

    if not data:
        raise ValidationError("No data provided")

    try:
        async with AsyncSessionLocal() as db_session:
            task = await db_session.get(Task, task_id)
            if not task or task.created_by != session["user_id"]:
                raise NotFoundError("Task not found", details={"task_id": task_id})

            # Validate and update title if provided
            if "title" in data:
                validated_title = TaskValidator.validate_title(data["title"])
                task.title = validated_title

            if "description" in data:
                validated_description = TaskValidator.validate_description(
                    data.get("description")
                )
                task.description = validated_description

            if "notes" in data:
                task.notes = data["notes"]

            status_override: int | None = None
            if "done" in data:
                is_done = bool(data["done"])
                task.done = is_done
                # Set closed_on timestamp when task is completed
                if is_done and not task.closed_on:
                    task.closed_on = datetime.now()
                elif not is_done:
                    # Clear closed_on if task is marked as incomplete
                    task.closed_on = None

                if "status_id" not in data:
                    if is_done:
                        status_override = await _resolve_status_id(
                            db_session, 3, "Done", "Completed"
                        )
                    else:
                        status_override = await _resolve_status_id(
                            db_session, 1, "Todo", "To Do"
                        )

            if "archived" in data:
                task.archived = bool(data["archived"])
            if "priority" in data:
                task.priority = bool(data["priority"])

            if "estimate_minutes" in data:
                validated_estimate = TaskValidator.validate_estimate_minutes(
                    data.get("estimate_minutes")
                )
                task.estimate_minutes = validated_estimate

            if "order" in data:
                task.order = int(data["order"])

            if "category" in data:
                task.category_id = await resolve_category_name_to_id(
                    data["category"], db_session, session["user_id"]
                )
            elif "category_id" in data:
                task.category_id = data["category_id"]

            if "due_date" in data:
                validated_due_date = TaskValidator.validate_due_date(
                    data.get("due_date")
                )
                task.due_date = validated_due_date if validated_due_date else None

            if "status_id" in data:
                task.status_id = int(data["status_id"])
            elif status_override is not None:
                task.status_id = status_override

            await db_session.commit()
            result = await db_session.execute(
                select(Task)
                .options(
                    selectinload(Task.status),
                    selectinload(Task.tags),
                    selectinload(Task.category),
                )
                .where(Task.id == task_id)
            )
            task = result.scalars().first()
            return success_response(task.to_dict())
    except (ValidationError, NotFoundError):
        raise
    except ValueError as e:
        # Convert validation errors to user-friendly messages
        error_info = create_validation_error_response(e)
        raise ValidationError(error_info["error"], details=error_info)
    except Exception:
        logging.exception("Failed to update task")
        raise DatabaseError("Failed to update task")


@tasks_bp.route("/<int:task_id>", methods=["DELETE"])
@auth_required
async def delete_task(task_id):
    """Delete a task by id."""
    try:
        async with AsyncSessionLocal() as db_session:
            task = await db_session.get(Task, task_id)
            if not task or task.created_by != session["user_id"]:
                raise NotFoundError("Task not found", details={"task_id": task_id})
            await db_session.delete(task)
            await db_session.commit()
            return ("", 204)
    except NotFoundError:
        raise
    except Exception:
        logging.exception("Failed to delete task")
        raise DatabaseError("Failed to delete task")


@tasks_bp.route("/calendar", methods=["GET"])
@auth_required
async def get_calendar_tasks():
    """Get tasks grouped by due date for calendar view."""
    try:
        async with AsyncSessionLocal() as db_session:
            result = await db_session.execute(
                select(Task)
                .options(
                    selectinload(Task.status),
                    selectinload(Task.tags),
                    selectinload(Task.category),
                )
                .where(
                    and_(
                        Task.created_by == session["user_id"],
                        Task.due_date.isnot(None),
                        Task.archived == False,
                    )
                )
                .order_by(Task.due_date, Task.updated_on.desc())
            )
            tasks = result.scalars().all()

            grouped_tasks: dict[str, list[dict]] = {}
            for task in tasks:
                # Use date-only key so frontend calendar (`YYYY-MM-DD`) matches
                date_key = task.due_date.date().isoformat()
                if date_key not in grouped_tasks:
                    grouped_tasks[date_key] = []
                grouped_tasks[date_key].append(task.to_dict())

            return jsonify(grouped_tasks)
    except Exception:
        logging.exception("Failed to fetch calendar tasks")
        raise DatabaseError("Failed to fetch calendar tasks")


@tasks_bp.route("/archive-completed", methods=["POST"])
@auth_required
async def archive_completed_tasks():
    """Archive all completed tasks for the current user."""
    try:
        async with AsyncSessionLocal() as db_session:
            result = await db_session.execute(
                select(Task).where(
                    and_(
                        Task.created_by == session["user_id"],
                        Task.done == True,
                        Task.archived == False,
                    )
                )
            )
            tasks = result.scalars().all()

            archived_count = 0
            for task in tasks:
                task.archived = True
                archived_count += 1

            await db_session.commit()

            return success_response(
                {
                    "message": f"Archived {archived_count} completed tasks",
                    "archived_count": archived_count,
                }
            )
    except Exception:
        logging.exception("Failed to archive completed tasks")
        raise DatabaseError("Failed to archive completed tasks")


@tasks_bp.route("/archived", methods=["GET"])
@auth_required
async def get_archived_tasks():
    """Get all archived tasks for the current user."""
    try:
        async with AsyncSessionLocal() as db_session:
            result = await db_session.execute(
                select(Task)
                .options(
                    selectinload(Task.status),
                    selectinload(Task.tags),
                    selectinload(Task.category),
                )
                .where(
                    and_(Task.created_by == session["user_id"], Task.archived == True)
                )
                .order_by(Task.updated_on.desc())
            )
            tasks = result.scalars().all()
            return success_response([task.to_dict() for task in tasks])
    except Exception:
        logging.exception("Failed to fetch archived tasks")
        raise DatabaseError("Failed to fetch archived tasks")
