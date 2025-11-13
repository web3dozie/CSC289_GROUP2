"""Merge all current heads to resolve branching

Revision ID: e60c89a1cf95
Revises: 0c2602256f20, 20251112_merge
Create Date: 2025-11-12 19:13:37.956254

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e60c89a1cf95'
down_revision: Union[str, Sequence[str], None] = ('0c2602256f20', '20251112_merge')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
