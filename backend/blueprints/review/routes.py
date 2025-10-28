from quart import Blueprint, jsonify, request, session
from datetime import datetime, date, timedelta
from sqlalchemy import func, select
from sqlalchemy.exc import SQLAlchemyError

try:
    from backend.db.models import JournalEntry, Task, auth_required
    from backend.db.engine_async import AsyncSessionLocal
    from backend.errors import ValidationError, NotFoundError, DatabaseError, success_response
except ImportError:
    from db.models import JournalEntry, Task, auth_required
    from db.engine_async import AsyncSessionLocal
    from errors import ValidationError, NotFoundError, DatabaseError, success_response

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

    user_id = session.get('user_id')
    if not user_id:
        raise ValidationError('Authentication required')

    try:
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
            return success_response([entry.to_dict() for entry in entries])
    except Exception as e:
        import logging
        logging.exception("Failed to fetch journal entries")
        raise DatabaseError('Failed to fetch journal entries')


@review_bp.route("/api/review/journal", methods=["POST"])
@auth_required
async def create_journal():
    data = await request.get_json()
    if not data or "content" not in data:
        raise ValidationError("Content is required", details={'field': 'content'})

    entry_date = data.get("entry_date", date.today().isoformat())
    entry_date = date.fromisoformat(entry_date)
    # Store as a datetime at midnight to match the JournalEntry DateTime column
    entry_datetime = datetime.combine(entry_date, datetime.min.time())

    user_id = session.get('user_id')
    if not user_id:
        raise ValidationError('Authentication required')

    try:
        entry = JournalEntry(
            user_id=user_id,
            entry_date=entry_datetime,
            content=data['content']
        )
        async with AsyncSessionLocal() as s:
            s.add(entry)
            await s.commit()
            await s.refresh(entry)
            return success_response(entry.to_dict(), 201)
    except Exception as e:
        import logging
        logging.exception("Failed to create journal entry")
        raise DatabaseError('Failed to create journal entry')


@review_bp.route("/api/review/journal/<int:entry_id>", methods=["PUT"])
@auth_required
async def update_journal(entry_id):
    user_id = session.get('user_id')
    if not user_id:
        raise ValidationError('Authentication required')
        
    try:
        async with AsyncSessionLocal() as s:
            entry = await s.get(JournalEntry, entry_id)
            if not entry or entry.user_id != user_id:
                raise NotFoundError("Journal entry not found", details={'entry_id': entry_id})

            data = await request.get_json()
            if not data:
                raise ValidationError("No data provided")
                
            if "content" in data:
                entry.content = data["content"]
            if "entry_date" in data:
                # Convert incoming date string to a datetime at midnight to match the
                # JournalEntry.entry_date DateTime column and satisfy type checkers
                new_date = date.fromisoformat(data["entry_date"])
                entry.entry_date = datetime.combine(new_date, datetime.min.time())

            await s.commit()
            return success_response(entry.to_dict())
    except (ValidationError, NotFoundError):
        raise  # Re-raise known errors
    except (ValueError, SQLAlchemyError) as e:
        import logging
        logging.exception("Failed to update journal entry")
        raise DatabaseError("Failed to update journal entry")


@review_bp.route("/api/review/journal/<int:entry_id>", methods=["DELETE"])
@auth_required
async def delete_journal(entry_id):
    user_id = session.get('user_id')
    if not user_id:
        raise ValidationError('Authentication required')
        
    try:
        async with AsyncSessionLocal() as s:
            entry = await s.get(JournalEntry, entry_id)
            if not entry or entry.user_id != user_id:
                raise NotFoundError("Journal entry not found", details={'entry_id': entry_id})
            await s.delete(entry)
            await s.commit()
            return ("", 204)
    except NotFoundError:
        raise  # Re-raise not found errors
    except Exception as e:
        import logging
        logging.exception("Failed to delete journal entry")
        raise DatabaseError('Failed to delete journal entry')


@review_bp.route("/api/review/summary/daily", methods=["GET"])
@auth_required
async def daily_summary():
    target_date = request.args.get("date", date.today().isoformat())
    target_date = date.fromisoformat(target_date)

    user_id = session.get('user_id')
    if not user_id:
        raise ValidationError('Authentication required')

    try:
        async with AsyncSessionLocal() as s:
            # Tasks completed on that day (exclude archived)
            result = await s.execute(
                select(func.count())
                .select_from(Task)
                .where(
                    func.date(Task.created_on) == target_date,
                    Task.done == True,
                    Task.created_by == user_id,
                    Task.archived == False
                )
            )
            completed_tasks = result.scalar_one()

            # Tasks created on that day (exclude archived)
            result = await s.execute(
                select(func.count()).select_from(Task).where(
                    func.date(Task.created_on) == target_date,
                    Task.created_by == user_id,
                    Task.archived == False
                )
            )
            created_tasks = result.scalar_one()

            # To Do tasks - tasks with status_id = 1 (To Do) (exclude archived)
            result = await s.execute(
                select(func.count()).select_from(Task).where(
                    Task.status_id == 1,
                    Task.done == False,
                    Task.created_by == user_id,
                    Task.archived == False
                )
            )
            todo_tasks = result.scalar_one()

            # Overdue tasks (exclude archived)
            today = date.today()
            result = await s.execute(
                select(func.count()).select_from(Task).where(
                    Task.due_date < today,
                    Task.done == False,
                    Task.created_by == user_id,
                    Task.archived == False
                )
            )
            overdue_tasks = result.scalar_one()

            # In progress tasks - only count tasks with status_id = 2 (In Progress) (exclude archived)
            result = await s.execute(
                select(func.count()).select_from(Task).where(
                    Task.status_id == 2,
                    Task.done == False,
                    Task.created_by == user_id,
                    Task.archived == False
                )
            )
            in_progress_tasks = result.scalar_one()

            # Time spent (since estimate_minutes field doesn't exist in new schema, set to 0)
            time_spent = 0

            # Categories breakdown (exclude archived)
            try:
                from backend.db.models import Category
            except ImportError:
                from db.models import Category
                
            result = await s.execute(
                select(Category.name, func.count(Task.id))
                .join(Task)
                .where(
                    func.date(Task.created_on) == target_date,
                    Task.created_by == user_id,
                    Task.category_id.isnot(None),
                    Task.archived == False
                )
                .group_by(Category.name)
            )
            categories = {row[0]: row[1] for row in result.all()}

            # Journal entry
            result = await s.execute(select(JournalEntry).filter_by(entry_date=target_date, user_id=user_id))
            journal = result.scalars().first()
            journal_content = journal.content if journal else None

        return success_response({
            'date': target_date.isoformat(),
            'completed_tasks': completed_tasks,
            'created_tasks': created_tasks,
            'todo_tasks': todo_tasks,
            'in_progress_tasks': in_progress_tasks,
            'overdue_tasks': overdue_tasks,
            'time_spent': time_spent,
            'categories': categories,
            'journal_entry': journal_content
        })
    except Exception as e:
        import logging
        logging.exception("Failed to fetch daily summary")
        raise DatabaseError('Failed to fetch daily summary')


@review_bp.route("/api/review/summary/weekly", methods=["GET"])
@auth_required
async def weekly_summary():
    # For the current week
    today = date.today()
    start_of_week = today - timedelta(days=today.weekday())
    end_of_week = start_of_week + timedelta(days=6)

    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Authentication required'}), 401

    async with AsyncSessionLocal() as s:
        # Tasks completed this week (exclude archived)
        result = await s.execute(
            select(func.count())
            .select_from(Task)
            .where(
                Task.created_on >= start_of_week,
                Task.created_on <= end_of_week + timedelta(days=1),
                Task.done == True,
                Task.created_by == user_id,
                Task.archived == False
            )
        )
        total_completed = result.scalar_one()

        # Total tasks created this week (exclude archived)
        result = await s.execute(
            select(func.count())
            .select_from(Task)
            .where(
                Task.created_on >= start_of_week,
                Task.created_on <= end_of_week + timedelta(days=1),
                Task.created_by == user_id,
                Task.archived == False
            )
        )
        total_tasks = result.scalar_one()

        # Average daily completion
        days_in_week = 7
        average_daily = total_completed / days_in_week if days_in_week > 0 else 0

        # Daily breakdown - ensure proper weekday order (exclude archived)
        daily_breakdown = []
        max_count = 0
        most_productive_day = None
        
        for i in range(7):
            day = start_of_week + timedelta(days=i)
            result = await s.execute(
                select(func.count()).select_from(Task).where(
                    func.date(Task.created_on) == day,
                    Task.done == True,
                    Task.created_by == user_id,
                    Task.archived == False
                )
            )
            count = result.scalar_one()
            day_name = day.strftime('%A')
            daily_breakdown.append({
                'day': day_name,
                'count': count,
                'date': day.isoformat()
            })
            
            # Track most productive day
            if count > max_count:
                max_count = count
                most_productive_day = day_name

        # Total time spent (estimate_minutes field doesn't exist in new schema)
        total_time = 0  # Convert to hours

        # Category performance (exclude archived)
        from backend.db.models import Category
        result = await s.execute(
            select(Category.name, func.count(Task.id))
            .join(Task)
            .where(
                Task.created_on >= start_of_week,
                Task.created_on <= end_of_week + timedelta(days=1),
                Task.done == True,
                Task.created_by == user_id,
                Task.category_id.isnot(None),
                Task.archived == False
            )
            .group_by(Category.name)
        )
        category_performance = {row[0]: {'completed': row[1]} for row in result.all()}

    return jsonify({
        'week_start': start_of_week.isoformat(),
        'week_end': end_of_week.isoformat(),
        'total_completed': total_completed,
        'total_tasks': total_tasks,
        'completion_rate': total_completed / total_tasks if total_tasks > 0 else 0,
        'average_daily': round(average_daily, 1),
        'most_productive_day': most_productive_day,
        'total_time': round(total_time, 1),
        'daily_breakdown': daily_breakdown,
        'category_performance': category_performance
    })



@review_bp.route("/api/review/insights", methods=["GET"])
@auth_required
async def get_insights():
    # Simple insights
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Authentication required'}), 401

    async with AsyncSessionLocal() as s:
        # Basic stats (exclude archived)
        result = await s.execute(
            select(func.count())
            .select_from(Task)
            .where(Task.created_by == user_id, Task.archived == False)
        )
        total_tasks = result.scalar_one()

        result = await s.execute(
            select(func.count())
            .select_from(Task)
            .where(Task.done == True, Task.created_by == user_id, Task.archived == False)
        )
        completed_tasks = result.scalar_one()

        completion_rate = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0

        # Average task time (estimate_minutes field doesn't exist in new schema)
        avg_task_time = 0

        # Productivity score (based on completion rate and other factors)
        productivity_score = min(100, completion_rate * 1.2)  # Simple calculation

        # Most productive day (exclude archived)
        result = await s.execute(
            select(
                func.date(Task.created_on).label("date"),
                func.count(Task.id).label("count"),
            )
            .where(Task.done == True, Task.created_by == user_id, Task.archived == False)
            .group_by(func.date(Task.created_on))
            .order_by(func.count(Task.id).desc())
        )
        productive_days = result.first()

        # Performance trends (last 4 weeks, exclude archived)
        performance_trends = []
        for weeks_ago in range(4, 0, -1):
            week_start = date.today() - timedelta(days=date.today().weekday() + (weeks_ago * 7))
            week_end = week_start + timedelta(days=6)

            result = await s.execute(
                select(func.count()).select_from(Task).where(
                    Task.created_on >= week_start,
                    Task.created_on <= week_end + timedelta(days=1),
                    Task.done == True,
                    Task.created_by == user_id,
                    Task.archived == False
                )
            )
            weekly_completed = result.scalar_one()

            performance_trends.append({
                'period': f'Week {5 - weeks_ago}',
                'score': min(100, weekly_completed * 10)  # Simple scoring
            })

        # Strengths and improvements based on data
        strengths = []
        improvements = []

        if completion_rate > 70:
            strengths.append("High task completion rate")
        if avg_task_time < 60:
            strengths.append("Efficient task completion time")
        if productive_days and productive_days.count > 3:
            strengths.append("Consistent daily productivity")

        if completion_rate < 50:
            improvements.append("Focus on completing more tasks")
        if total_tasks < 5:
            improvements.append("Create more tasks to build momentum")
        if not productive_days:
            improvements.append("Start completing tasks regularly")

        # Recommendations
        recommendations = []
        if completion_rate < 70:
            recommendations.append({
                'title': 'Increase Completion Rate',
                'description': 'Try breaking tasks into smaller, more manageable steps'
            })
        if avg_task_time > 120:
            recommendations.append({
                'title': 'Optimize Task Time',
                'description': 'Consider setting time limits for tasks to improve efficiency'
            })

        insights = {
            'total_tasks': total_tasks,
            'completed_tasks': completed_tasks,
            'overall_completion_rate': completion_rate,
            'productivity_score': round(productivity_score, 1),
            'completion_rate': round(completion_rate, 1),
            'avg_task_time': round(avg_task_time, 1),
            'most_productive_day': productive_days.date if productive_days else None,
            'tasks_on_most_productive_day': productive_days.count if productive_days else 0,
            'performance_trends': performance_trends,
            'strengths': strengths,
            'improvements': improvements,
            'recommendations': recommendations
        }

        return jsonify(insights)

