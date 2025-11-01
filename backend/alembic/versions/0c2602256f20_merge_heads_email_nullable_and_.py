"""merge heads: email nullable and performance indexes

Revision ID: 0c2602256f20
Revises: 448980ad963f, 1cce66b666c8
Create Date: 2025-11-01 14:46:22.292911

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0c2602256f20'
down_revision: Union[str, Sequence[str], None] = ('448980ad963f', '1cce66b666c8')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
