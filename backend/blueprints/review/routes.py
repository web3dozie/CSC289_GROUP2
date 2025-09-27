from quart import Blueprint, jsonify, request, session
from backend.db.models import JournalEntry, Task, auth_required
from datetime import datetime, date, timedelta
from sqlalchemy import func, select
from backend.db.engine_async import AsyncSessionLocal

review_bp = Blueprint("review", __name__)


@review_bp.route("/api/review/journal", methods=["GET"])
@auth_required
async def get_journal():
    # Get query params for date range
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")
    if start_date:
        start_date = date.fromisoformat(start_date)
    else:
        start_date = date.today() - timedelta(days=30)
    if end_date:
        end_date = date.fromisoformat(end_date)
    else:
        end_date = date.today()

    user_id = session.get("user_id", 1)

    async with AsyncSessionLocal() as s:
        result = await s.execute(
            select(JournalEntry)
            .where(
                JournalEntry.user_id == user_id,
                func.date(JournalEntry.entry_date) >= start_date,
                func.date(JournalEntry.entry_date) <= end_date,
            )
            .order_by(JournalEntry.entry_date.desc())
        )
        entries = result.scalars().all()
        return jsonify([entry.to_dict() for entry in entries])


@review_bp.route("/api/review/journal", methods=["POST"])
@auth_required
async def create_journal():
    data = await request.get_json()
    if not data or "content" not in data:
        return jsonify({"error": "Content is required"}), 400

    entry_date = data.get("entry_date", date.today().isoformat())
    entry_date = date.fromisoformat(entry_date)

    entry = JournalEntry(
        user_id=session.get("user_id", 1),
        entry_date=entry_date,
        content=data["content"],
    )
    async with AsyncSessionLocal() as s:
        s.add(entry)
        await s.commit()
        await s.refresh(entry)
        return jsonify(entry.to_dict()), 201


@review_bp.route("/api/review/journal/<int:entry_id>", methods=["PUT"])
@auth_required
async def update_journal(entry_id):
    user_id = session.get("user_id", 1)
    async with AsyncSessionLocal() as s:
        try:
            entry = await s.get(JournalEntry, entry_id)
            if not entry or entry.user_id != user_id:
                return jsonify({"error": "Journal entry not found"}), 404

            data = await request.get_json()
            if not data:
                return jsonify({"error": "No data provided"}), 400
            if "content" in data:
                entry.content = data["content"]
            if "entry_date" in data:
                entry.entry_date = date.fromisoformat(data["entry_date"])

            await s.commit()
            return jsonify(entry.to_dict())
        except Exception as e:
            try:
                await s.rollback()
            except Exception:
                pass
            return jsonify({"error": str(e)}), 500


@review_bp.route("/api/review/journal/<int:entry_id>", methods=["DELETE"])
@auth_required
async def delete_journal(entry_id):
    user_id = session.get("user_id", 1)
    async with AsyncSessionLocal() as s:
        entry = await s.get(JournalEntry, entry_id)
        if not entry or entry.user_id != user_id:
            return jsonify({"error": "Journal entry not found"}), 404
        await s.delete(entry)
        await s.commit()
        return jsonify({"success": True}), 204


@review_bp.route("/api/review/summary/daily", methods=["GET"])
@auth_required
async def daily_summary():
    target_date = request.args.get("date", date.today().isoformat())
    target_date = date.fromisoformat(target_date)

    user_id = session.get("user_id", 1)

    # Tasks completed on that day (for this user)
    async with AsyncSessionLocal() as s:
        result = await s.execute(
            select(func.count())
            .select_from(Task)
            .where(
                func.date(Task.created_on) == target_date,
                Task.done == True,
                Task.created_by == user_id,
            )
        )
        completed_tasks = result.scalar_one()

        result = await s.execute(
            select(JournalEntry).filter_by(entry_date=target_date, user_id=user_id)
        )
        journal = result.scalars().first()
        journal_content = journal.content if journal else None

    return jsonify(
        {
            "date": target_date.isoformat(),
            "tasks_completed": completed_tasks,
            "journal_entry": journal_content,
        }
    )


@review_bp.route("/api/review/summary/weekly", methods=["GET"])
@auth_required
async def weekly_summary():
    # For the current week
    today = date.today()
    start_of_week = today - timedelta(days=today.weekday())
    end_of_week = start_of_week + timedelta(days=6)

    user_id = session.get("user_id", 1)

    # Tasks completed this week (for this user)
    async with AsyncSessionLocal() as s:
        result = await s.execute(
            select(func.count())
            .select_from(Task)
            .where(
                Task.created_on >= start_of_week,
                Task.created_on <= end_of_week + timedelta(days=1),
                Task.done == True,
                Task.created_by == user_id,
            )
        )
        completed_tasks = result.scalar_one()

        result = await s.execute(
            select(func.count())
            .select_from(Task)
            .where(
                Task.created_on >= start_of_week,
                Task.created_on <= end_of_week + timedelta(days=1),
                Task.created_by == user_id,
            )
        )
        total_tasks = result.scalar_one()

    return jsonify(
        {
            "week_start": start_of_week.isoformat(),
            "week_end": end_of_week.isoformat(),
            "tasks_completed": completed_tasks,
            "total_tasks": total_tasks,
            "completion_rate": completed_tasks / total_tasks if total_tasks > 0 else 0,
        }
    )


@review_bp.route("/api/review/insights", methods=["GET"])
@auth_required
async def get_insights():
    # Simple insights
    user_id = session.get("user_id", 1)

    async with AsyncSessionLocal() as s:
        result = await s.execute(
            select(func.count()).select_from(Task).where(Task.created_by == user_id)
        )
        total_tasks = result.scalar_one()

        result = await s.execute(
            select(func.count())
            .select_from(Task)
            .where(Task.done == True, Task.created_by == user_id)
        )
        completed_tasks = result.scalar_one()

        completion_rate = completed_tasks / total_tasks if total_tasks > 0 else 0

        result = await s.execute(
            select(
                func.date(Task.created_on).label("date"),
                func.count(Task.id).label("count"),
            )
            .where(Task.done == True, Task.created_by == user_id)
            .group_by(func.date(Task.created_on))
            .order_by(func.count(Task.id).desc())
        )
        productive_days = result.first()

        insights = {
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "overall_completion_rate": completion_rate,
            "most_productive_day": (
                productive_days.date.isoformat() if productive_days else None
            ),
            "tasks_on_most_productive_day": (
                productive_days.count if productive_days else 0
            ),
        }

        return jsonify(insights)
