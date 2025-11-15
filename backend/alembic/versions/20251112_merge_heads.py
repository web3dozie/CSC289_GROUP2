"""merge heads for category colorhex and other branches

Revision ID: 20251112_merge
Revises: 20251112_colorhex, 1cce66b666c8
Create Date: 2025-11-12 00:00:01.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '20251112_merge'
down_revision: Union[str, Sequence[str], None] = ('20251112_colorhex', '1cce66b666c8')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Merge migration - no changes needed."""
    pass


def downgrade() -> None:
    """Merge migration - no changes needed."""
    pass
