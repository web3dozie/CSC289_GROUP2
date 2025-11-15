"""Categories API endpoints for CRUD operations and usage statistics."""
import logging
from quart import Blueprint, jsonify, request, session
from sqlalchemy import select, func
from backend.db.engine_async import AsyncSessionLocal
from backend.db.models import Category, Task
from backend.security.auth_decorators import auth_required
from backend.errors import ValidationError, DatabaseError, NotFoundError
from backend.validation import CategoryValidator
from backend.cache_utils import cache

# Create blueprint
categories_bp = Blueprint("categories", __name__, url_prefix="/api/categories")


@categories_bp.route("", methods=["GET"])
@auth_required
async def get_categories():
    """Get all categories for the current user with caching."""
    cache_key = f"categories_user_{session['user_id']}"
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
            categories = [category.to_dict() for category in result.scalars().all()]
            cache.set(cache_key, categories, ttl_seconds=300)
            return jsonify(categories)
    except Exception:
        logging.exception("Failed to fetch categories")
        raise DatabaseError("Failed to fetch categories")


@categories_bp.route("", methods=["POST"])
@auth_required
async def create_category():
    """Create a new category for the current user."""
    try:
        data = await request.get_json()
        
        # Validate input
        validated = CategoryValidator.validate_create(data)
        
        async with AsyncSessionLocal() as db_session:
            # Create new category
            new_category = Category(
                name=validated["name"],
                description=validated.get("description"),
                color_hex=validated["color_hex"],
                created_by=session["user_id"]
            )
            
            db_session.add(new_category)
            await db_session.commit()
            await db_session.refresh(new_category)
            
            # Invalidate cache
            cache_key = f"categories_user_{session['user_id']}"
            cache.clear(cache_key)
            
            return jsonify(new_category.to_dict()), 201
            
    except ValidationError:
        raise
    except Exception:
        logging.exception("Failed to create category")
        raise DatabaseError("Failed to create category")


@categories_bp.route("/<int:category_id>", methods=["GET"])
@auth_required
async def get_category(category_id):
    """Get a single category by ID."""
    try:
        async with AsyncSessionLocal() as db_session:
            result = await db_session.execute(
                select(Category)
                .where(Category.id == category_id)
                .where(Category.created_by == session["user_id"])
            )
            category = result.scalar_one_or_none()
            
            if not category:
                raise NotFoundError("Category not found")
            
            return jsonify(category.to_dict())
            
    except NotFoundError:
        raise
    except Exception:
        logging.exception("Failed to fetch category")
        raise DatabaseError("Failed to fetch category")


@categories_bp.route("/<int:category_id>", methods=["PUT"])
@auth_required
async def update_category(category_id):
    """Update an existing category."""
    try:
        data = await request.get_json()
        
        # Validate input
        validated = CategoryValidator.validate_update(data)
        
        async with AsyncSessionLocal() as db_session:
            result = await db_session.execute(
                select(Category)
                .where(Category.id == category_id)
                .where(Category.created_by == session["user_id"])
            )
            category = result.scalar_one_or_none()
            
            if not category:
                raise NotFoundError("Category not found")
            
            # Update fields
            if "name" in validated:
                category.name = validated["name"]
            if "description" in validated:
                category.description = validated["description"]
            if "color_hex" in validated:
                category.color_hex = validated["color_hex"]
            
            await db_session.commit()
            await db_session.refresh(category)
            
            # Invalidate cache
            cache_key = f"categories_user_{session['user_id']}"
            cache.clear(cache_key)
            
            return jsonify(category.to_dict())
            
    except (ValidationError, NotFoundError):
        raise
    except Exception:
        logging.exception("Failed to update category")
        raise DatabaseError("Failed to update category")


@categories_bp.route("/<int:category_id>", methods=["DELETE"])
@auth_required
async def delete_category(category_id):
    """Delete a category (tasks using it will have category_id set to NULL)."""
    try:
        async with AsyncSessionLocal() as db_session:
            result = await db_session.execute(
                select(Category)
                .where(Category.id == category_id)
                .where(Category.created_by == session["user_id"])
            )
            category = result.scalar_one_or_none()
            
            if not category:
                raise NotFoundError("Category not found")
            
            await db_session.delete(category)
            await db_session.commit()
            
            # Invalidate cache
            cache_key = f"categories_user_{session['user_id']}"
            cache.clear(cache_key)
            
            return jsonify({"message": "Category deleted successfully"}), 200
            
    except NotFoundError:
        raise
    except Exception:
        logging.exception("Failed to delete category")
        raise DatabaseError("Failed to delete category")


@categories_bp.route("/usage", methods=["GET"])
@auth_required
async def get_category_usage():
    """Get usage statistics for all categories (how many tasks use each)."""
    try:
        async with AsyncSessionLocal() as db_session:
            # Query categories with task counts
            result = await db_session.execute(
                select(
                    Category.id,
                    Category.name,
                    Category.color_hex,
                    func.count(Task.id).label("task_count")
                )
                .outerjoin(Task, Category.id == Task.category_id)
                .where(Category.created_by == session["user_id"])
                .group_by(Category.id, Category.name, Category.color_hex)
                .order_by(Category.name)
            )
            
            usage_stats = []
            for row in result:
                usage_stats.append({
                    "id": row.id,
                    "name": row.name,
                    "color_hex": row.color_hex,
                    "task_count": row.task_count
                })
            
            return jsonify(usage_stats)
            
    except Exception:
        logging.exception("Failed to fetch category usage")
        raise DatabaseError("Failed to fetch category usage")
