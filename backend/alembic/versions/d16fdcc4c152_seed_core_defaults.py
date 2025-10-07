"""seed core defaults

Revision ID: d16fdcc4c152
Revises: a4b4e471597c
Create Date: 2025-10-05 14:55:02.291530

"""

from __future__ import annotations

from datetime import datetime
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "d16fdcc4c152"
down_revision: Union[str, Sequence[str], None] = "a4b4e471597c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Lightweight table definitions for seeding (avoid importing from models.py)
user_tbl = sa.table(
    "user",
    sa.column("id", sa.Integer),
    sa.column("username", sa.String),
    sa.column("email", sa.String),
    sa.column("pin_hash", sa.String),
    sa.column("config_data", sa.Text),
    sa.column("created_on", sa.DateTime),
)

status_tbl = sa.table(
    "status",
    sa.column("id", sa.Integer),
    sa.column("title", sa.String),
    sa.column("description", sa.String),
    sa.column("created_on", sa.DateTime),
    sa.column("updated_on", sa.DateTime),
    sa.column("created_by", sa.Integer),
)


def upgrade() -> None:
    """Upgrade schema."""
    conn = op.get_bind()
    now = datetime.now()

    # Check if system user exists
    result = conn.execute(
        sa.select(user_tbl.c.id).where(
            user_tbl.c.username == "system", user_tbl.c.id == 0
        )
    )
    if not result.fetchone():
        # Insert system user if not exists
        conn.execute(
            user_tbl.insert().values(
                id=0,
                username="system",
                email="system@example.com",
                pin_hash="hashed_pin",
                config_data="{}",
                created_on=now,
            )
        )

    # Check if default statuses exist
    defaults = [
        {"id": 1, "title": "Todo", "description": "Todo"},
        {"id": 2, "title": "In Progress", "description": "In Progress"},
        {"id": 3, "title": "Done", "description": "Done"},
    ]

    for default in defaults:
        result = conn.execute(
            sa.select(status_tbl.c.id).where(status_tbl.c.id == default["id"])
        )
        # Insert status if not found
        if not result.fetchone():
            conn.execute(
                status_tbl.insert().values(
                    id=default["id"],
                    title=default["title"],
                    description=default["description"],
                    created_on=now,
                    updated_on=now,
                    created_by=0,
                )
            )


def downgrade() -> None:
    """Downgrade schema."""
    conn = op.get_bind()

    # Remove default statuses created by this migration
    conn.execute(
        status_tbl.delete().where(
            status_tbl.c.id.in_([1, 2, 3]), status_tbl.c.created_by == 0
        )
    )

    # Optionally remove system user if no other users exist
    result = conn.execute(sa.select(user_tbl.c.id).where(user_tbl.c.id != 0))
    if not result.fetchone():
        conn.execute(user_tbl.delete().where(user_tbl.c.id == 0))
