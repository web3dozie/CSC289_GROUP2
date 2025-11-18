"""merge_heads

Revision ID: 3b80f86b0f6f
Revises: 03499190d263, 7644e48ee9a6
Create Date: 2025-10-10 14:54:21.210115

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3b80f86b0f6f'
down_revision: Union[str, Sequence[str], None] = ('03499190d263', '7644e48ee9a6')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
