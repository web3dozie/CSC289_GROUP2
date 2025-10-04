"""Context builder for AI chat with user task data."""

import json
import logging
from datetime import datetime
from sqlalchemy import select, func, and_

logger = logging.getLogger(__name__)


class ContextBuilder:
    """Build AI context from user task data."""

    async def build_user_context(self, db_session, user_id: int) -> dict:
        """
        Aggregate user task data for AI context.

        Args:
            db_session: Active async database session
            user_id: Current user's ID

        Returns:
            dict: Context data including task statistics and recent activity
        """
        try:
            from backend.db.models import Task

            # Get total task count
            total_result = await db_session.execute(
                select(func.count(Task.id)).where(
                    and_(Task.created_by == user_id, Task.archived == False)
                )
            )
            total_tasks = total_result.scalar_one()

            # Get completed task count
            completed_result = await db_session.execute(
                select(func.count(Task.id)).where(
                    and_(
                        Task.created_by == user_id,
                        Task.done == True,
                        Task.archived == False
                    )
                )
            )
            completed_tasks = completed_result.scalar_one()

            # Calculate completion rate
            completion_rate = (
                round((completed_tasks / total_tasks) * 100) if total_tasks > 0 else 0
            )

            # Get overdue tasks
            now = datetime.now()
            overdue_result = await db_session.execute(
                select(Task).where(
                    and_(
                        Task.created_by == user_id,
                        Task.done == False,
                        Task.archived == False,
                        Task.due_date < now
                    )
                ).order_by(Task.due_date.asc()).limit(5)
            )
            overdue_tasks_list = overdue_result.scalars().all()

            overdue_count = len(overdue_tasks_list)

            # Build overdue task details
            overdue_tasks = []
            for task in overdue_tasks_list:
                days_overdue = (now - task.due_date).days
                overdue_tasks.append({
                    "title": task.title,
                    "due_date": task.due_date.strftime("%Y-%m-%d"),
                    "days_overdue": days_overdue
                })

            # Get recent tasks (last 5 updated)
            recent_result = await db_session.execute(
                select(Task).where(
                    and_(Task.created_by == user_id, Task.archived == False)
                ).order_by(Task.updated_on.desc()).limit(5)
            )
            recent_tasks_list = recent_result.scalars().all()

            recent_tasks = []
            for task in recent_tasks_list:
                recent_tasks.append({
                    "title": task.title,
                    "done": task.done,
                    "due_date": task.due_date.strftime("%Y-%m-%d") if task.due_date else None
                })

            context = {
                "total_tasks": total_tasks,
                "completed_tasks": completed_tasks,
                "completion_rate": completion_rate,
                "overdue_count": overdue_count,
                "overdue_tasks": overdue_tasks,
                "recent_tasks": recent_tasks
            }

            logger.info(f"Built context for user {user_id}: {total_tasks} tasks, {completion_rate}% complete")
            return context

        except Exception as e:
            logger.error(f"Error building user context: {e}")
            # Return empty context on error
            return {
                "total_tasks": 0,
                "completed_tasks": 0,
                "completion_rate": 0,
                "overdue_count": 0,
                "overdue_tasks": [],
                "recent_tasks": []
            }

    def build_system_prompt(self, context: dict) -> str:
        """
        Build system prompt with user context.

        Args:
            context: User context dict from build_user_context()

        Returns:
            str: Engineered system prompt with user-specific context
        """
        # Format overdue tasks section
        overdue_section = self._format_overdue_tasks(context)

        prompt = f"""You are TaskLine AI, a productivity assistant for task management.

**Your Role:**
Help users manage tasks efficiently through conversation. Provide insights, prioritization advice, and productivity coaching based on their actual data.

**User Context (Current State):**
- Total tasks: {context['total_tasks']}
- Completed: {context['completed_tasks']} ({context['completion_rate']}%)
- Overdue: {context['overdue_count']} tasks
- Recent activity: {json.dumps(context['recent_tasks'], indent=2)}

{overdue_section}

**Your Capabilities:**

1. **Task Analysis & Insights**
   - Analyze completion patterns and trends
   - Identify productivity blockers
   - Suggest improvements based on data

2. **Task Prioritization**
   - Recommend which tasks to focus on based on:
     * Due dates (urgent vs important)
     * Completion patterns
     * Overdue status
   - Provide reasoning for recommendations

3. **Task Creation from Natural Language**
   - When user requests task creation (e.g., "remind me to...", "create task...", "add to my list..."):
     * Extract: title, due date/time, description
     * Respond with: CREATE_TASK|title|due_date_ISO8601|description
     * Then confirm to user in natural language

   Examples:
   - "Remind me to call John tomorrow at 2pm"
     → CREATE_TASK|Call John|{(datetime.now().replace(hour=14, minute=0, second=0, microsecond=0)).isoformat()}|Follow up call
   - "Add buy groceries to my tasks"
     → CREATE_TASK|Buy groceries|{datetime.now().isoformat()}|Shopping task

4. **Productivity Coaching**
   - Celebrate progress and wins
   - Identify patterns (e.g., "You complete most tasks in mornings")
   - Suggest workflow improvements
   - Encourage without being preachy

**Response Guidelines:**

✓ DO:
- Reference specific user data and tasks
- Suggest 1-2 priorities, not overwhelming lists
- Be concise and actionable
- Use encouraging tone for progress
- Acknowledge context (e.g., "I see you completed 3 tasks today")

✗ DON'T:
- Give generic advice not based on user data
- Overwhelm with too many suggestions
- Ignore the user's actual task state
- Be vague or abstract

**Example Interactions:**

User: "What should I focus on today?"
You: "You have 3 tasks due today:
1. 'Client presentation' (due 2pm) - highest priority, time-sensitive
2. 'Review report' (due 5pm) - important but can wait
3. 'Email follow-up' (due EOD) - quick task

I'd start with the client presentation since it's due in a few hours and likely needs the most focus."

User: "How am I doing this week?"
You: "Great progress! You've completed {context['completed_tasks']} tasks this week ({context['completion_rate']}%). However, you have {context['overdue_count']} overdue tasks that might need attention. Want me to help prioritize them?"

User: "Remind me to call the client tomorrow at 2pm"
You: CREATE_TASK|Call the client|{(datetime.now().replace(hour=14, minute=0, second=0, microsecond=0)).isoformat()}|Follow-up call
✓ Created task 'Call the client' for tomorrow at 2pm. I've added it to your list.

**Current Date/Time:** {datetime.now().isoformat()}

Remember: Be helpful, specific, and based on real data. Your value is in personalized insights, not generic tips."""

        return prompt

    def _format_overdue_tasks(self, context: dict) -> str:
        """
        Format overdue tasks for prompt.

        Args:
            context: User context dict

        Returns:
            str: Formatted overdue tasks section
        """
        if context['overdue_count'] == 0:
            return "✓ No overdue tasks - great job staying on track!"

        overdue_list = context.get('overdue_tasks', [])[:3]
        formatted = "\n**Overdue Tasks (Needs Attention):**\n"
        for task in overdue_list:
            formatted += f"- '{task['title']}' (due {task['due_date']}, {task['days_overdue']} days overdue)\n"

        return formatted
