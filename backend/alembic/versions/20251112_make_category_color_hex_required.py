"""make category color_hex required

Revision ID: 20251112_colorhex
Revises: 1cce66b666c8
Create Date: 2025-11-12 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '20251112_colorhex'
down_revision: Union[str, Sequence[str], None] = '1cce66b666c8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Make color_hex column NOT NULL and set default for existing NULL values."""
    # Step 1: Update any existing NULL values to a default blue color
    op.execute(
        "UPDATE category SET color_hex = '3B82F6' WHERE color_hex IS NULL OR color_hex = ''"
    )
    
    # Step 2: Make the column NOT NULL
    # SQLite doesn't support ALTER COLUMN directly, so we need to check the dialect
    # For SQLite, this will be a no-op at the SQL level but documents the intent
    with op.batch_alter_table('category', schema=None) as batch_op:
        batch_op.alter_column('color_hex',
                   existing_type=sa.String(length=6),
                   nullable=False,
                   existing_nullable=True)


def downgrade() -> None:
    """Revert color_hex column back to nullable."""
    with op.batch_alter_table('category', schema=None) as batch_op:
        batch_op.alter_column('color_hex',
                   existing_type=sa.String(length=6),
                   nullable=True,
                   existing_nullable=False)
