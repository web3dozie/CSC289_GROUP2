"""Add archived, priority, estimate_minutes, order columns to task table

Revision ID: 481db314befa
Revises: 
Create Date: 2025-10-02 15:22:26.410853

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '481db314befa'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add archived column (boolean, default False)
    op.add_column('task', sa.Column('archived', sa.Boolean(), nullable=False, server_default='0'))

    # Add priority column (boolean, default False)
    op.add_column('task', sa.Column('priority', sa.Boolean(), nullable=False, server_default='0'))

    # Add estimate_minutes column (integer, nullable)
    op.add_column('task', sa.Column('estimate_minutes', sa.Integer(), nullable=True))

    # Add order column (integer, default 0)
    op.add_column('task', sa.Column('order', sa.Integer(), nullable=False, server_default='0'))


def downgrade() -> None:
    """Downgrade schema."""
    # Remove columns in reverse order
    op.drop_column('task', 'order')
    op.drop_column('task', 'estimate_minutes')
    op.drop_column('task', 'priority')
    op.drop_column('task', 'archived')
