"""Chat API routes for AI assistant."""

from quart import Blueprint, request, jsonify, session
import logging
from datetime import datetime
from sqlalchemy import select, and_, desc
from sqlalchemy.orm import selectinload

from backend.db.models import Conversation, Message, Configuration, auth_required
from backend.db.engine_async import AsyncSessionLocal
from backend.services.llm_service import GeminiLLMService, LLMConfig
from backend.services.context_builder import ContextBuilder

logger = logging.getLogger(__name__)

chat_bp = Blueprint("chat", __name__)
llm_service = GeminiLLMService()
context_builder = ContextBuilder()


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
            # Get API key from configuration
            config_result = await db_session.execute(
                select(Configuration).where(Configuration.user_id == user_id)
            )
            config = config_result.scalars().first()

            if not config or not config.ai_url:
                return jsonify({
                    "error": "AI API key not configured. Please set it in Settings."
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
            llm_config = LLMConfig(
                api_key=config.ai_url,  # ai_url stores the API key
                model="gemini-2.0-flash-exp",
                temperature=0.7,
                max_tokens=1000
            )

            try:
                ai_response = await llm_service.get_completion(messages, llm_config)
            except Exception as e:
                logger.error(f"LLM API error: {e}")
                return jsonify({
                    "error": "Failed to get AI response. Check your API key and try again."
                }), 500

            # Save AI response
            ai_msg = Message(
                conversation_id=conversation.id,
                role="assistant",
                content=ai_response
            )
            db_session.add(ai_msg)

            # Update conversation timestamp
            conversation.updated_at = datetime.now()

            await db_session.commit()

            return jsonify({
                "response": ai_response,
                "conversation_id": conversation.id
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
