"""Chat API routes for AI assistant."""

from quart import Blueprint, request, jsonify, session
import logging
import json
import re
from datetime import datetime
from sqlalchemy import select, and_, desc
from sqlalchemy.orm import selectinload

from backend.db.models import Conversation, Message, Configuration, auth_required, Task, Status, Category, Tag
from backend.db.engine_async import AsyncSessionLocal
from backend.services.llm_service import LLMService
from backend.services.context_builder import ContextBuilder

logger = logging.getLogger(__name__)

chat_bp = Blueprint("chat", __name__)
context_builder = ContextBuilder()


def parse_action_json(ai_response: str) -> list[dict]:
    """
    Extract and parse JSON action blocks from AI response.

    Returns list of parsed action dictionaries.
    """
    actions = []
    # Match ```json ... ``` code blocks
    pattern = r'```json\s*(\{.*?\})\s*```'
    matches = re.findall(pattern, ai_response, re.DOTALL)

    for match in matches:
        try:
            action_data = json.loads(match)
            if isinstance(action_data, dict) and 'action' in action_data:
                actions.append(action_data)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse action JSON: {e}")
            continue

    return actions


def strip_json_blocks(ai_response: str) -> str:
    """Remove JSON code blocks from AI response before showing to user."""
    return re.sub(r'```json\s*\{.*?\}\s*```\s*', '', ai_response, flags=re.DOTALL).strip()


async def create_task_from_ai(db_session, user_id: int, action_data: dict) -> int | None:
    """
    Create task from AI action with comprehensive metadata.

    Args:
        db_session: Active database session
        user_id: Current user's ID
        action_data: Parsed JSON action dict

    Returns:
        Task ID if created successfully, None otherwise
    """
    try:
        # Required fields
        title = action_data.get("title", "").strip()
        due_date_str = action_data.get("due_date")

        if not title or not due_date_str:
            logger.error("Missing required fields: title or due_date")
            return None

        # Parse due date
        try:
            due_date = datetime.fromisoformat(due_date_str)
        except (ValueError, TypeError):
            logger.error(f"Invalid due_date format: {due_date_str}")
            due_date = datetime.now()

        # Get default "Todo" status (or first available status)
        status_result = await db_session.execute(
            select(Status).where(Status.title == "Todo").limit(1)
        )
        default_status = status_result.scalars().first()

        # Fallback: use any status if "Todo" not found
        if not default_status:
            status_result = await db_session.execute(
                select(Status).limit(1)
            )
            default_status = status_result.scalars().first()

        if not default_status:
            logger.error("No status found in database")
            return None

        # Optional: Get or create category
        category_id = None
        category_name = action_data.get("category", "").strip()
        if category_name:
            category_result = await db_session.execute(
                select(Category).where(
                    and_(Category.name == category_name, Category.created_by == user_id)
                )
            )
            category = category_result.scalars().first()

            if not category:
                # Auto-create category
                category = Category(
                    name=category_name,
                    description=f"Auto-created from AI: {category_name}",
                    color_hex="808080",  # Default gray
                    created_by=user_id
                )
                db_session.add(category)
                await db_session.flush()

            category_id = category.id

        # Create task
        task = Task(
            title=title,
            description=action_data.get("description", ""),
            due_date=due_date,
            status_id=default_status.id,
            category_id=category_id,
            created_by=user_id,
            done=False,
            priority=action_data.get("priority", False),
            estimate_minutes=action_data.get("estimate_minutes"),
            archived=False,
            order=0
        )
        db_session.add(task)
        await db_session.flush()

        # Optional: Add tags
        tag_names = action_data.get("tags", [])
        if isinstance(tag_names, list) and tag_names:
            for tag_name in tag_names:
                tag_name = tag_name.strip()
                if not tag_name:
                    continue

                # Get or create tag
                tag_result = await db_session.execute(
                    select(Tag).where(
                        and_(Tag.name == tag_name, Tag.created_by == user_id)
                    )
                )
                tag = tag_result.scalars().first()

                if not tag:
                    tag = Tag(
                        name=tag_name,
                        description=f"Auto-created from AI: {tag_name}",
                        color_hex="808080",  # Default gray
                        created_by=user_id
                    )
                    db_session.add(tag)
                    await db_session.flush()

                # Associate tag with task
                task.tags.append(tag)

        logger.info(f"Created task '{title}' (ID: {task.id}) for user {user_id} via AI")
        return task.id

    except Exception as e:
        logger.error(f"Error creating task from AI: {e}")
        return None


async def find_task_by_title(db_session, user_id: int, task_title: str) -> Task | None:
    """
    Find a task by title (case-insensitive, partial match).

    Args:
        db_session: Active database session
        user_id: Current user's ID
        task_title: Task title to search for

    Returns:
        Task if found, None otherwise
    """
    try:
        # Try exact match first
        result = await db_session.execute(
            select(Task).where(
                and_(
                    Task.created_by == user_id,
                    Task.title == task_title,
                    Task.archived == False
                )
            )
        )
        task = result.scalars().first()

        if task:
            return task

        # Fallback: case-insensitive partial match
        result = await db_session.execute(
            select(Task).where(
                and_(
                    Task.created_by == user_id,
                    Task.title.ilike(f"%{task_title}%"),
                    Task.archived == False
                )
            ).limit(1)
        )
        return result.scalars().first()

    except Exception as e:
        logger.error(f"Error finding task '{task_title}': {e}")
        return None


async def complete_task_action(db_session, user_id: int, action_data: dict) -> bool:
    """Mark a task as completed."""
    try:
        task_title = action_data.get("task_title", "").strip()
        if not task_title:
            return False

        task = await find_task_by_title(db_session, user_id, task_title)
        if not task:
            logger.error(f"Task '{task_title}' not found for completion")
            return False

        task.done = True
        task.updated_on = datetime.now()
        logger.info(f"Marked task '{task.title}' (ID: {task.id}) as complete")
        return True

    except Exception as e:
        logger.error(f"Error completing task: {e}")
        return False


async def update_task_action(db_session, user_id: int, action_data: dict) -> bool:
    """Update task properties (due_date, priority, category, etc)."""
    try:
        task_title = action_data.get("task_title", "").strip()
        if not task_title:
            return False

        task = await find_task_by_title(db_session, user_id, task_title)
        if not task:
            logger.error(f"Task '{task_title}' not found for update")
            return False

        # Update due date
        if "due_date" in action_data:
            try:
                task.due_date = datetime.fromisoformat(action_data["due_date"])
            except (ValueError, TypeError):
                logger.error(f"Invalid due_date: {action_data.get('due_date')}")

        # Update priority
        if "priority" in action_data:
            task.priority = bool(action_data["priority"])

        # Update category
        if "category" in action_data:
            category_name = action_data["category"].strip()
            if category_name:
                category_result = await db_session.execute(
                    select(Category).where(
                        and_(Category.name == category_name, Category.created_by == user_id)
                    )
                )
                category = category_result.scalars().first()

                if not category:
                    category = Category(
                        name=category_name,
                        description=f"Auto-created from AI: {category_name}",
                        color_hex="808080",
                        created_by=user_id
                    )
                    db_session.add(category)
                    await db_session.flush()

                task.category_id = category.id

        # Update description
        if "description" in action_data:
            task.description = action_data["description"]

        # Update estimate
        if "estimate_minutes" in action_data:
            task.estimate_minutes = action_data["estimate_minutes"]

        task.updated_on = datetime.now()
        logger.info(f"Updated task '{task.title}' (ID: {task.id})")
        return True

    except Exception as e:
        logger.error(f"Error updating task: {e}")
        return False


async def archive_task_action(db_session, user_id: int, action_data: dict) -> bool:
    """Archive a task."""
    try:
        task_title = action_data.get("task_title", "").strip()
        if not task_title:
            return False

        task = await find_task_by_title(db_session, user_id, task_title)
        if not task:
            logger.error(f"Task '{task_title}' not found for archiving")
            return False

        task.archived = True
        task.updated_on = datetime.now()
        logger.info(f"Archived task '{task.title}' (ID: {task.id})")
        return True

    except Exception as e:
        logger.error(f"Error archiving task: {e}")
        return False


@chat_bp.route("/api/chat/message", methods=["POST"])
@auth_required
async def send_message():
    """
    Send message and get AI response.

    Request: {"message": "What are my tasks?"}
    Response: {"response": "You have 5 tasks...", "conversation_id": 1}
    """
    try:
        user_id = session.get("user_id")
        data = await request.get_json()
        user_message = data.get("message", "").strip()

        if not user_message:
            return jsonify({"error": "Message cannot be empty"}), 400

        async with AsyncSessionLocal() as db_session:
            # Get AI configuration
            config_result = await db_session.execute(
                select(Configuration).where(Configuration.user_id == user_id)
            )
            config = config_result.scalars().first()

            if not config or not config.ai_api_url or not config.ai_api_key or not config.ai_model:
                return jsonify({
                    "error": "AI API not configured. Please set API URL, Model, and API Key in Settings."
                }), 400

            # Get or create active conversation
            conversation_result = await db_session.execute(
                select(Conversation)
                .where(Conversation.user_id == user_id)
                .order_by(desc(Conversation.updated_at))
                .limit(1)
            )
            conversation = conversation_result.scalars().first()

            if not conversation:
                conversation = Conversation(user_id=user_id, title="AI Chat")
                db_session.add(conversation)
                await db_session.flush()

            # Save user message
            user_msg = Message(
                conversation_id=conversation.id,
                role="user",
                content=user_message
            )
            db_session.add(user_msg)
            await db_session.flush()

            # Build context for AI
            user_context = await context_builder.build_user_context(db_session, user_id)
            system_prompt = context_builder.build_system_prompt(user_context)

            # Get conversation history for context (last 10 messages)
            history_result = await db_session.execute(
                select(Message)
                .where(Message.conversation_id == conversation.id)
                .order_by(desc(Message.created_at))
                .limit(10)
            )
            history_messages = list(reversed(history_result.scalars().all()))

            # Build messages array for LLM
            messages = [{"role": "system", "content": system_prompt}]
            for msg in history_messages:
                messages.append({
                    "role": msg.role,
                    "content": msg.content
                })

            # Get AI response
            llm_service = LLMService()

            try:
                ai_response = await llm_service.get_completion(
                    messages=messages,
                    api_url=config.ai_api_url,
                    api_key=config.ai_api_key,
                    model=config.ai_model,
                    temperature=0.7,
                    max_tokens=1000
                )
            except Exception as e:
                logger.error(f"LLM API error: {e}")
                await llm_service.close()
                return jsonify({
                    "error": "Failed to get AI response. Check your API configuration and try again."
                }), 500
            finally:
                # Clean up service resources
                await llm_service.close()

            # Parse and execute any actions from AI response
            actions = parse_action_json(ai_response)
            executed_actions = []  # Track successful executions for cache invalidation

            for action in actions:
                action_type = action.get("action")

                if action_type == "create_task":
                    task_id = await create_task_from_ai(db_session, user_id, action)
                    if task_id:
                        logger.info(f"Executed create_task action, created task ID {task_id}")
                        executed_actions.append({"action": "create_task", "task_id": task_id})
                    else:
                        logger.error(f"Failed to execute create_task action: {action}")

                elif action_type == "complete_task":
                    success = await complete_task_action(db_session, user_id, action)
                    if success:
                        logger.info(f"Executed complete_task action for '{action.get('task_title')}'")
                        executed_actions.append({"action": "complete_task"})
                    else:
                        logger.error(f"Failed to execute complete_task action: {action}")

                elif action_type == "update_task":
                    success = await update_task_action(db_session, user_id, action)
                    if success:
                        logger.info(f"Executed update_task action for '{action.get('task_title')}'")
                        executed_actions.append({"action": "update_task"})
                    else:
                        logger.error(f"Failed to execute update_task action: {action}")

                elif action_type == "archive_task":
                    success = await archive_task_action(db_session, user_id, action)
                    if success:
                        logger.info(f"Executed archive_task action for '{action.get('task_title')}'")
                        executed_actions.append({"action": "archive_task"})
                    else:
                        logger.error(f"Failed to execute archive_task action: {action}")

            # Strip JSON blocks from response before saving/returning
            clean_response = strip_json_blocks(ai_response)

            # Save AI response (with JSON blocks stripped)
            ai_msg = Message(
                conversation_id=conversation.id,
                role="assistant",
                content=clean_response
            )
            db_session.add(ai_msg)

            # Update conversation timestamp
            conversation.updated_at = datetime.now()

            await db_session.commit()

            return jsonify({
                "response": clean_response,
                "conversation_id": conversation.id,
                "actions_executed": executed_actions  # For frontend cache invalidation
            }), 200

    except Exception as e:
        logger.error(f"Error in send_message: {e}")
        return jsonify({"error": "Internal server error"}), 500


@chat_bp.route("/api/chat/history", methods=["GET"])
@auth_required
async def get_history():
    """
    Get conversation history (last 50 messages).

    Response: {"messages": [...]}
    """
    try:
        user_id = session.get("user_id")

        async with AsyncSessionLocal() as db_session:
            # Get latest conversation
            conversation_result = await db_session.execute(
                select(Conversation)
                .where(Conversation.user_id == user_id)
                .order_by(desc(Conversation.updated_at))
                .limit(1)
            )
            conversation = conversation_result.scalars().first()

            if not conversation:
                return jsonify({"messages": []}), 200

            # Get last 50 messages
            messages_result = await db_session.execute(
                select(Message)
                .where(Message.conversation_id == conversation.id)
                .order_by(Message.created_at.asc())
                .limit(50)
            )
            messages = messages_result.scalars().all()

            return jsonify({
                "messages": [msg.to_dict() for msg in messages]
            }), 200

    except Exception as e:
        logger.error(f"Error in get_history: {e}")
        return jsonify({"error": "Internal server error"}), 500


@chat_bp.route("/api/chat/clear", methods=["POST"])
@auth_required
async def clear_history():
    """
    Clear conversation history.

    Response: {"success": true}
    """
    try:
        user_id = session.get("user_id")

        async with AsyncSessionLocal() as db_session:
            # Delete all user's conversations (cascade will delete messages)
            conversations_result = await db_session.execute(
                select(Conversation).where(Conversation.user_id == user_id)
            )
            conversations = conversations_result.scalars().all()

            for conversation in conversations:
                await db_session.delete(conversation)

            await db_session.commit()

            logger.info(f"Cleared {len(conversations)} conversations for user {user_id}")

            return jsonify({"success": True}), 200

    except Exception as e:
        logger.error(f"Error in clear_history: {e}")
        return jsonify({"error": "Internal server error"}), 500
