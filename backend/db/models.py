from datetime import datetime
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy import (
    String,
    DateTime,
    ForeignKey,
    Table,
    Column,
    Integer,
    UniqueConstraint,
    CheckConstraint,
    Index,
)


class Base(DeclarativeBase):
    pass


# User Table
class User(Base):
    __tablename__ = "user"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(20), nullable=False, unique=True)
    email: Mapped[str] = mapped_column(String(99), nullable=False, unique=True)
    user_pin: Mapped[int] = mapped_column(nullable=False)
    # Placeholder for config table to be implemented later
    # config_id: Mapped[int] = mapped_column(ForeignKey("configuration.id"), nullable=False)
    created_on: Mapped[datetime] = mapped_column(DateTime, nullable=False)

    # Relating user to all their created tasks
    tasks: Mapped[list["Task"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )


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
    # TODO: Set default datetimes
    closed_on: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    due_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    created_on: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    updated_on: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    created_by: Mapped[int] = mapped_column(
        ForeignKey("user.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # Relating tasks to user that created them
    user: Mapped["User"] = relationship(
        back_populates="tasks", cascade="all, delete-orphan"
    )

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
        back_populates="subtasks", remote_side=[id]
    )
    subtasks: Mapped[list["Task"]] = relationship(
        back_populates="parent_task", cascade="all, delete-orphan"
    )

    # Potential dependency relationship
    # successor_links: Mapped[list["TaskDependency"]] = relationship(back_populates=)


# Category Table
class Category(Base):
    __tablename__ = "category"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(140), nullable=False)
    description: Mapped[str | None] = mapped_column(String(140), nullable=True)
    color_hex: Mapped[str] = mapped_column(String(6), nullable=False)
    # TODO: Set default datetimes
    created_on: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    updated_on: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    created_by: Mapped[int] = mapped_column(ForeignKey("user.id"), nullable=False)

    # Relating categories to tasks that are so labeled
    tasks: Mapped[list["Task"]] = relationship(back_populates="category")


# Tag Table
class Tag(Base):
    __tablename__ = "tag"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(140), nullable=False)
    description: Mapped[str | None] = mapped_column(String(140), nullable=True)
    color_hex: Mapped[str] = mapped_column(String(6), nullable=False)
    # TODO: Set default datetimes
    created_on: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    updated_on: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    created_by: Mapped[int] = mapped_column(ForeignKey("user.id"), nullable=False)

    # Relates tags to tasks (Many to Many) -- This abstracts our join table
    tasks: Mapped[list["Task"]] = relationship(
        secondary=task_tag, back_populates="tags", passive_deletes=True
    )


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

#     # TODO: Relationships
#     parent: Mapped["Task"] = relationship(back_populates="sucessor_pointer", foreign_keys=[parent_id])


# Statuses lookup table
class Status(Base):
    __tablename__ = "status"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(25), nullable=False, unique=True)
    description: Mapped[str | None] = mapped_column(String(140), nullable=True)
    # TODO: Set default datetimes
    created_on: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    updated_on: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    created_by: Mapped[int] = mapped_column(ForeignKey("user.id"), nullable=False)

    # Relate statuses to tasks
    tasks: Mapped[list["Task"]] = relationship(back_populates="status")
