from quart import Blueprint, request, jsonify, session
from datetime import datetime, date, timedelta
from sqlalchemy import select, and_, func
from sqlalchemy.orm import selectinload
from backend.db.engine_async import AsyncSessionLocal
from backend.db.models import Task, Status, auth_required

tasks_bp = Blueprint("tasks", __name__, url_prefix="/api/tasks")


@tasks_bp.route("/", methods=["GET"])
@tasks_bp.route("", methods=["GET"])
@auth_required
async def get_tasks():
    """Get all tasks for the user"""
    try:
        async with AsyncSessionLocal() as db_session:
            result = await db_session.execute(
                select(Task)
                .options(selectinload(Task.status), selectinload(Task.tags))
                .where(Task.created_by == session["user_id"])
                # .order_by(Task.priority.desc(), Task.updated_on.desc())
            )
            tasks = result.scalars().all()
            return jsonify([task.to_dict() for task in tasks])
    except Exception as e:
        return jsonify({"error": "Failed to fetch tasks"}), 500


@tasks_bp.route("/", methods=["POST"])
@tasks_bp.route("", methods=["POST"])
@auth_required
async def create_task():
    """Create a new task"""
    data = await request.get_json()

    if not data or not data.get("title", "").strip():
        return jsonify({"error": "Task title is required"}), 400

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

            task = Task(
                title=data["title"].strip(),
                description=data.get("description", ""),
                category=data.get("category"),
                # Priority field is not currently implemented
                # priority=bool(data.get("priority", False)),
                due_date=due_date,
                status_id=status_id,
                created_on=datetime.now(),
                updated_on=datetime.now(),
                created_by=session["user_id"],
            )

            db_session.add(task)
            await db_session.commit()
            await db_session.refresh(task)
            return (
                jsonify(
                    {
                        "success": True,
                        "message": "Task created successfully",
                        "task_id": task.id,
                    }
                ),
                201,
            )
    except Exception as e:
        import traceback

        traceback.print_exc()  # show the real error in test output
        return jsonify({"error": "Failed to create task"}), 500


@tasks_bp.route("/kanban", methods=["GET"])
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
                    select(Task)
                    .options(selectinload(Task.status), selectinload(Task.tags))
                    .where(
                        and_(
                            Task.created_by == session["user_id"],
                            Task.status_id == status.id,
                        )
                    )
                    .order_by(Task.priority.desc(), Task.updated_on.desc())
                )
                tasks = task_result.scalars().all()

                kanban_data[status.description.lower().replace(" ", "_")] = {
                    "status_id": status.id,
                    "name": status.description,
                    "tasks": [task.to_dict() for task in tasks],
                }

            return jsonify(kanban_data)

    except Exception as e:
        return jsonify({"error": "Failed to fetch kanban board"}), 500


@tasks_bp.route("/categories", methods=["GET"])
@auth_required
async def get_categories():
    """Get available categories"""
    categories = [
        {"id": "personal", "name": "Personal", "color": "#10B981"},
        {"id": "work", "name": "Work", "color": "#3B82F6"},
        {"id": "shopping", "name": "Shopping", "color": "#F59E0B"},
    ]
    return jsonify({"categories": categories})


@tasks_bp.route("/<int:task_id>", methods=["GET"])
@auth_required
async def get_task(task_id):
    """Fetch a single task by id for the current user"""
    try:
        async with AsyncSessionLocal() as db_session:
            result = await db_session.execute(
                select(Task)
                .options(selectinload(Task.status), selectinload(Task.tags))
                .where(Task.id == task_id, Task.created_by == session["user_id"])
            )
            task = result.scalars().first()
            if not task:
                return jsonify({"error": "Task not found"}), 404
            return jsonify(task.to_dict())
    except Exception:
        import traceback

        traceback.print_exc()
        return jsonify({"error": "Failed to fetch task"}), 500


@tasks_bp.route("/<int:task_id>", methods=["PUT"])
@auth_required
async def update_task(task_id):
    """Update a task's fields"""
    data = await request.get_json()
    try:
        async with AsyncSessionLocal() as db_session:
            task = await db_session.get(Task, task_id)
            if not task or task.created_by != session["user_id"]:
                return jsonify({"error": "Task not found"}), 404

            if not data:
                return jsonify({"error": "No data provided"}), 400
            if "title" in data:
                task.title = data["title"]
            if "description" in data:
                task.description = data["description"]
            if "done" in data:
                task.done = bool(data["done"])
            if "priority" in data:
                task.priority = bool(data["priority"])
            if "due_date" in data:
                task.due_date = (
                    datetime.strptime(data["due_date"], "%Y-%m-%d").date()
                    if data["due_date"]
                    else None
                )
            if "status_id" in data:
                task.status_id = int(data["status_id"])

            await db_session.commit()
            # Re-query with selectinload so related objects (status) are loaded safely
            result = await db_session.execute(
                select(Task)
                .options(selectinload(Task.status), selectinload(Task.tags))
                .where(Task.id == task_id)
            )
            task = result.scalars().first()
            return jsonify(task.to_dict())
    except Exception:
        import traceback

        traceback.print_exc()
        return jsonify({"error": "Failed to update task"}), 500


@tasks_bp.route("/<int:task_id>", methods=["DELETE"])
@auth_required
async def delete_task(task_id):
    """Delete a task by id"""
    try:
        async with AsyncSessionLocal() as db_session:
            task = await db_session.get(Task, task_id)
            if not task or task.created_by != session["user_id"]:
                return jsonify({"error": "Task not found"}), 404
            await db_session.delete(task)
            await db_session.commit()
            return ("", 204)
    except Exception:
        return jsonify({"error": "Failed to delete task"}), 500
