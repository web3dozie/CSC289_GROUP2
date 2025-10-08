"""add user_sessions table for session management

Revision ID: 03499190d263
Revises: 5f98d9b06c2f
Create Date: 2025-10-08 08:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '03499190d263'
down_revision: Union[str, Sequence[str], None] = '5f98d9b06c2f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create user_sessions table
    op.create_table(
        'user_sessions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('session_id', sa.String(length=128), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('last_activity', sa.DateTime(), nullable=True),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('user_agent', sa.Text(), nullable=True),
        sa.Column('is_remember_me', sa.Boolean(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('expires_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('session_id')
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('user_sessions')