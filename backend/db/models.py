from datetime import datetime
from functools import wraps
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from quart import jsonify, session
import inspect
import hashlib
import logging
from passlib.hash import pbkdf2_sha256
from sqlalchemy import (
    Boolean,
    String,
    DateTime,
    ForeignKey,
    Table,
    Column,
    Integer,
    # UniqueConstraint,
    # CheckConstraint,
    # Index,
)


class Base(DeclarativeBase):
    pass


def _iso(dt):
    # If dt is None, or doesn't provide isoformat(), return None
    if dt is None:
        return None
    try:
        return dt.isoformat()
    except (AttributeError, TypeError, ValueError):
        return None


# User Table
class User(Base):
    __tablename__ = "user"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(20), nullable=False, unique=True)
    # Nullable for development purposes, but should be required in production
    email: Mapped[str] = mapped_column(String(99), nullable=True, unique=True)
    pin_hash: Mapped[str] = mapped_column(nullable=False)
    created_on: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.now
    )
    config_data: Mapped[str] = mapped_column(String(1000), default="{}")

    # Relating user to all their created tasks
    tasks: Mapped[list["Task"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )

    # Relating user to all their created journal entries
    journal_entries: Mapped[list["JournalEntry"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )

    # One-to-one user settings (Configuration holds the foreign key)
    settings: Mapped["Configuration"] = relationship(
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
        single_parent=True,
    )

    def to_dict(self) -> dict:
        return {
            "id": getattr(self, "id", None),
            "username": getattr(self, "username", None),
            "email": getattr(self, "email", None),
            "created_on": _iso(getattr(self, "created_on", None)),
            "config_data": getattr(self, "config_data", None),
        }


# Basic Table implementation for join table (Many to Many)
# Declared before Task Table or Tag Table in this file
task_tag = Table(
    "task_tag",
    Base.metadata,
    Column(
        "task_id", Integer, ForeignKey("task.id", ondelete="CASCADE"), primary_key=True
    ),
    Column(
        "tag_id", Integer, ForeignKey("tag.id", ondelete="CASCADE"), primary_key=True
    ),
)


class JournalEntry(Base):
    __tablename__ = "journal_entries"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("user.id"), nullable=False)
    entry_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    content: Mapped[str] = mapped_column(String(140), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    updated_on: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.now, onupdate=datetime.now
    )

    user = relationship("User", back_populates="journal_entries")

    def to_dict(self) -> dict:
        return {
            "id": getattr(self, "id", None),
            "user_id": getattr(self, "user_id", None),
            "entry_date": _iso(getattr(self, "entry_date", None)),
            "content": getattr(self, "content", None),
            "created_at": _iso(getattr(self, "created_at", None)),
            "updated_on": _iso(getattr(self, "updated_on", None)),
        }


# Task Table
class Task(Base):
    __tablename__ = "task"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(140), nullable=False)
    description: Mapped[str | None] = mapped_column(String(140), nullable=True)
    notes: Mapped[str | None] = mapped_column(String(140), nullable=True)
    category_id: Mapped[int | None] = mapped_column(
        ForeignKey("category.id", ondelete="SET NULL"), nullable=True
    )
    status_id: Mapped[int] = mapped_column(ForeignKey("status.id"), nullable=False)
    parent_id: Mapped[int | None] = mapped_column(
        ForeignKey("task.id", ondelete="CASCADE"), nullable=True, index=True
    )
    # Completion flag
    done: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    closed_on: Mapped[datetime | None] = mapped_column(
        DateTime, nullable=True, default=None
    )
    # Archive flag for soft delete
    archived: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    # Priority flag for important tasks
    priority: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    # Estimated time in minutes
    estimate_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    # Order for manual sorting/drag-drop
    order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    due_date: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=None)
    created_on: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.now
    )
    updated_on: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.now
    )
    created_by: Mapped[int] = mapped_column(
        ForeignKey("user.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # Relating tasks to user that created them
    user: Mapped["User"] = relationship(back_populates="tasks")

    # Relating tasks to categories
    category: Mapped["Category"] = relationship(back_populates="tasks")

    # Relating tasks to tags (Many to Many) -- This abstracts our join table
    tags: Mapped[list["Tag"]] = relationship(
        secondary="task_tag", back_populates="tasks", passive_deletes=True
    )

    # Relating tasks to statuses
    status: Mapped["Status"] = relationship(back_populates="tasks")

    # Relate subtasks and parent tasks together
    parent_task: Mapped["Task"] = relationship(
        back_populates="subtasks",
        remote_side=[id],
    )
    subtasks: Mapped[list["Task"]] = relationship(
        back_populates="parent_task", cascade="all, delete-orphan", single_parent=True
    )

    def to_dict(self) -> dict:
        status = getattr(self, "status", None)
        tags = getattr(self, "tags", None) or []
        category = getattr(self, "category", None)

        # Resolve category name from category relationship
        category_name = getattr(category, "name", None) if category else None

        return {
            "id": getattr(self, "id", None),
            "title": getattr(self, "title", None),
            "description": getattr(self, "description", None),
            "notes": getattr(self, "notes", None),
            # Frontend expects 'category' as string, not category_id
            "category": category_name,
            "status": (
                # Frontend expects 'name' not 'title'
                {"id": status.id, "name": getattr(status, "title", None)}
                if status
                else None
            ),
            "tags": [getattr(t, "name", None) for t in tags],
            "done": getattr(self, "done", False),
            "archived": getattr(self, "archived", False),
            "priority": getattr(self, "priority", False),
            "estimate_minutes": getattr(self, "estimate_minutes", None),
            "order": getattr(self, "order", 0),
            "parent_id": getattr(self, "parent_id", None),
            "due_date": _iso(getattr(self, "due_date", None)),
            # Frontend expects 'created_at' not 'created_on'
            "created_at": _iso(getattr(self, "created_on", None)),
            "updated_on": _iso(getattr(self, "updated_on", None)),
            "closed_on": _iso(getattr(self, "closed_on", None)),
            "created_by": getattr(self, "created_by", None),
        }

    # Potential dependency relationship
    # successor_links: Mapped[list["TaskDependency"]] = relationship(back_populates=)


# Category Table
class Category(Base):
    __tablename__ = "category"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(140), nullable=False)
    description: Mapped[str | None] = mapped_column(String(140), nullable=True)
    color_hex: Mapped[str] = mapped_column(String(6), nullable=False)
    created_on: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.now
    )
    updated_on: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.now
    )
    created_by: Mapped[int] = mapped_column(ForeignKey("user.id"), nullable=False)

    # Relating categories to tasks that are so labeled
    tasks: Mapped[list["Task"]] = relationship(back_populates="category")

    def to_dict(self) -> dict:
        return {
            "id": getattr(self, "id", None),
            "name": getattr(self, "name", None),
            "description": getattr(self, "description", None),
            "color_hex": getattr(self, "color_hex", None),
            "created_on": _iso(getattr(self, "created_on", None)),
            "updated_on": _iso(getattr(self, "updated_on", None)),
            "created_by": getattr(self, "created_by", None),
        }


# Tag Table
class Tag(Base):
    __tablename__ = "tag"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(140), nullable=False)
    description: Mapped[str | None] = mapped_column(String(140), nullable=True)
    color_hex: Mapped[str] = mapped_column(String(6), nullable=False)
    created_on: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.now
    )
    updated_on: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.now
    )
    created_by: Mapped[int] = mapped_column(ForeignKey("user.id"), nullable=False)

    # Relates tags to tasks (Many to Many) -- This abstracts our join table
    tasks: Mapped[list["Task"]] = relationship(
        secondary=task_tag, back_populates="tags", passive_deletes=True
    )

    def to_dict(self) -> dict:
        return {
            "id": getattr(self, "id", None),
            "name": getattr(self, "name", None),
            "description": getattr(self, "description", None),
            "color_hex": getattr(self, "color_hex", None),
            "created_on": _iso(getattr(self, "created_on", None)),
            "updated_on": _iso(getattr(self, "updated_on", None)),
            "created_by": getattr(self, "created_by", None),
        }


# # Many-To-Many Sequential Task Dependencies association table (Out of scope for now)
# class TaskDependency(Base):
#     __tablename__ = "task_dependency"
#     __table_args__ = (
#         CheckConstraint("parent_id <> child_id"), # Ensure dependency is not upon self
#         Index("ix_task_dependency_child_id", "child"),
#     )

#     parent_id: Mapped[int] = mapped_column(ForeignKey("task.id", ondelete="CASCADE"), primary_key=True)
#     child_id: Mapped[int] = mapped_column(ForeignKey("task.id", ondelete="CASCADE"), primary_key=True)
#     created_on: Mapped[datetime] = mapped_column(DateTime, nullable=False)
#     updated_on: Mapped[datetime] = mapped_column(DateTime, nullable=True)

#     parent: Mapped["Task"] = relationship(back_populates="sucessor_pointer", foreign_keys=[parent_id])


# Statuses lookup table
class Status(Base):
    __tablename__ = "status"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(25), nullable=False, unique=True)
    description: Mapped[str | None] = mapped_column(String(140), nullable=True)
    created_on: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.now
    )
    updated_on: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.now
    )
    created_by: Mapped[int] = mapped_column(ForeignKey("user.id"), nullable=False)

    # Relate statuses to tasks
    tasks: Mapped[list["Task"]] = relationship(back_populates="status")

    def to_dict(self) -> dict:
        return {
            "id": getattr(self, "id", None),
            "title": getattr(self, "title", None),
            "description": getattr(self, "description", None),
            "created_on": _iso(getattr(self, "created_on", None)),
            "updated_on": _iso(getattr(self, "updated_on", None)),
            "created_by": getattr(self, "created_by", None),
        }


class Configuration(Base):
    __tablename__ = "configuration"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("user.id"), nullable=False)
    notes_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    timer_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    ai_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    auto_lock_minutes: Mapped[int] = mapped_column(Integer, default=10)
    theme: Mapped[str] = mapped_column(String(50), default="light")
    updated_on: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.now, onupdate=datetime.now
    )

    user = relationship("User", back_populates="settings")

    def to_dict(self) -> dict:
        return {
            "id": getattr(self, "id", None),
            "user_id": getattr(self, "user_id", None),
            "notes_enabled": getattr(self, "notes_enabled", None),
            "timer_enabled": getattr(self, "timer_enabled", None),
            "ai_url": getattr(self, "ai_url", None),
            "auto_lock_minutes": getattr(self, "auto_lock_minutes", None),
            "theme": getattr(self, "theme", None),
            "updated_on": _iso(getattr(self, "updated_on", None)),
        }


def auth_required(f):
    @wraps(f)
    async def decorated_function(*args, **kwargs):
        if "user_id" not in session:
            return jsonify({"error": "Authentication required"}), 401
        if inspect.iscoroutinefunction(f):
            return await f(*args, **kwargs)
        else:
            return f(*args, **kwargs)

    return decorated_function


def hash_pin(pin: str) -> str:
    """Hash a PIN using bcrypt (includes salt). Returns the bcrypt hash string.

    Note: this replaces the previous unsalted SHA-256 storage. Existing old
    SHA-256 hashes are detected by length (64 hex chars) and migrated on
    successful login.
    """
    return pbkdf2_sha256.hash(pin)


def verify_and_migrate_pin(pin: str, stored_hash: str) -> tuple[bool, str | None]:
    """Verify PIN against stored_hash.

    Returns tuple (is_valid, new_hash_or_none). If stored_hash is an old
    unsalted SHA-256, verify using hashlib and if valid return a new pbkdf2_sha256
    hash to replace the old one (migration path).
    """
    # Detect old SHA-256 hex digests (64 chars, 0-9a-f)
    try:
        if stored_hash and len(stored_hash) == 64 and all(c in '0123456789abcdef' for c in stored_hash.lower()):
            # legacy SHA-256 verification
            if hashlib.sha256(pin.encode()).hexdigest() == stored_hash:
                # migrate to bcrypt
                return True, pbkdf2_sha256.hash(pin)
            return False, None

        # Otherwise assume stored_hash is bcrypt or other passlib-supported format
        is_valid = pbkdf2_sha256.verify(pin, stored_hash)
        return is_valid, None
    except Exception:
        logging.exception("Error verifying PIN")
        return False, None


def validate_pin(pin: str) -> bool:
    return pin.isdigit() and 4 <= len(pin) <= 8
