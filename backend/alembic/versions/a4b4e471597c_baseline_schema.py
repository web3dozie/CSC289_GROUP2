"""baseline schema

Revision ID: a4b4e471597c
Revises:
Create Date: 2025-10-05 14:21:19.806796

"""

from datetime import datetime
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "a4b4e471597c"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    # User table
    op.create_table(
        "user",
        sa.Column("id", sa.Integer, primary_key=True, nullable=False),
        sa.Column("username", sa.String(20), nullable=False, unique=True),
        sa.Column("email", sa.String(99), nullable=False, unique=True),
        sa.Column("pin_hash", sa.String(128), nullable=False),
        sa.Column(
            "created_on", sa.DateTime(), nullable=False, server_default=sa.func.now()
        ),
        sa.Column(
            "config_data",
            sa.String(1000),
            nullable=False,
            server_default=sa.text("'{}'"),
        ),
    )

    # Category, Status, Tag tables
    op.create_table(
        "category",
        sa.Column(
            "id", sa.Integer, primary_key=True, nullable=False, autoincrement=True
        ),
        sa.Column("name", sa.String(140), nullable=False),
        sa.Column("description", sa.String(140), nullable=True),
        sa.Column("color_hex", sa.String(6), nullable=True),
        sa.Column(
            "created_on", sa.DateTime, nullable=False, server_default=sa.func.now()
        ),
        sa.Column(
            "updated_on",
            sa.DateTime,
            nullable=False,
            server_default=sa.func.now(),
            onupdate=sa.func.now(),
        ),
        sa.Column(
            "created_by",
            sa.Integer,
            sa.ForeignKey("user.id", ondelete="CASCADE"),
            nullable=False,
        ),
    )

    op.create_table(
        "status",
        sa.Column(
            "id", sa.Integer, primary_key=True, nullable=False, autoincrement=True
        ),
        sa.Column("title", sa.String(25), nullable=False),
        sa.Column("description", sa.String(140), nullable=True),
        sa.Column(
            "created_on", sa.DateTime, nullable=False, server_default=sa.func.now()
        ),
        sa.Column(
            "updated_on",
            sa.DateTime,
            nullable=False,
            server_default=sa.func.now(),
            onupdate=sa.func.now(),
        ),
        sa.Column(
            "created_by",
            sa.Integer,
            sa.ForeignKey("user.id", ondelete="CASCADE"),
            nullable=False,
        ),
    )

    op.create_table(
        "tag",
        sa.Column(
            "id", sa.Integer, primary_key=True, nullable=False, autoincrement=True
        ),
        sa.Column("name", sa.String(140), nullable=False),
        sa.Column("description", sa.String(140), nullable=True),
        sa.Column("color_hex", sa.String(6), nullable=True),
        sa.Column(
            "created_on", sa.DateTime, nullable=False, server_default=sa.func.now()
        ),
        sa.Column(
            "updated_on",
            sa.DateTime,
            nullable=False,
            server_default=sa.func.now(),
            onupdate=sa.func.now(),
        ),
        sa.Column(
            "created_by",
            sa.Integer,
            sa.ForeignKey("user.id", ondelete="CASCADE"),
            nullable=False,
        ),
    )

    # Task table
    op.create_table(
        "task",
        sa.Column(
            "id", sa.Integer, primary_key=True, nullable=False, autoincrement=True
        ),
        sa.Column("title", sa.String(140), nullable=False),
        sa.Column("description", sa.String(140), nullable=True),
        sa.Column("notes", sa.String(140), nullable=True),
        sa.Column(
            "category_id",
            sa.Integer,
            sa.ForeignKey("category.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("status_id", sa.Integer, sa.ForeignKey("status.id"), nullable=False),
        sa.Column(
            "parent_id",
            sa.Integer,
            sa.ForeignKey("task.id", ondelete="CASCADE"),
            nullable=True,
        ),
        sa.Column(
            "done",
            sa.Boolean,
            default=False,
            nullable=False,
            server_default=sa.text("0"),
        ),
        sa.Column("closed_on", sa.DateTime, nullable=True),
        sa.Column("due_date", sa.DateTime, nullable=True),
        sa.Column(
            "created_on", sa.DateTime, nullable=False, server_default=sa.func.now()
        ),
        sa.Column(
            "updated_on",
            sa.DateTime,
            nullable=False,
            server_default=sa.func.now(),
            onupdate=sa.func.now(),
        ),
        sa.Column(
            "created_by",
            sa.Integer,
            sa.ForeignKey("user.id", ondelete="CASCADE"),
            nullable=False,
        ),
    )

    op.create_index("ix_task_parent_id", "task", ["parent_id"])
    op.create_index("ix_task_created_by", "task", ["created_by"])

    op.create_table(
        "journal_entries",
        sa.Column("id", sa.Integer, primary_key=True, nullable=False),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("user.id"), nullable=False),
        sa.Column("entry_date", sa.Date, nullable=False),
        sa.Column("content", sa.Text, nullable=False),
        sa.Column(
            "created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()
        ),
        sa.Column(
            "updated_on",
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.now(),
            onupdate=sa.func.now(),
        ),
    )

    op.create_table(
        "configuration",
        sa.Column(
            "id", sa.Integer, primary_key=True, nullable=False, autoincrement=True
        ),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("user.id"), nullable=False),
        sa.Column(
            "notes_enabled", sa.Boolean, nullable=False, server_default=sa.text("1")
        ),
        sa.Column(
            "timer_enabled", sa.Boolean, nullable=False, server_default=sa.text("1")
        ),
        sa.Column("ai_url", sa.String(255), nullable=True),
        sa.Column(
            "auto_lock_minutes",
            sa.Integer,
            nullable=False,
            server_default=sa.text("10"),
        ),
        sa.Column(
            "theme", sa.String(50), nullable=False, server_default=sa.text("'light'")
        ),
        sa.Column(
            "updated_on",
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.now(),
            onupdate=sa.func.now(),
        ),
    )

    op.create_table(
        "task_tag",
        sa.Column(
            "task_id",
            sa.Integer,
            sa.ForeignKey("task.id"),
            primary_key=True,
            nullable=False,
        ),
        sa.Column(
            "tag_id",
            sa.Integer,
            sa.ForeignKey("tag.id"),
            primary_key=True,
            nullable=False,
        ),
    )


def downgrade() -> None:
    """Downgrade schema."""
    # reverse dependency order
    op.drop_table("task_tag")
    op.drop_table("configuration")
    op.drop_table("journal_entries")
    op.drop_index("ix_task_created_by", table_name="task")
    op.drop_index("ix_task_parent_id", table_name="task")
    op.drop_table("task")
    op.drop_table("tag")
    op.drop_table("status")
    op.drop_table("category")
    op.drop_table("user")
