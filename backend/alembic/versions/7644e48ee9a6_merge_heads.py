"""merge heads

Revision ID: 7644e48ee9a6
Revises: 481db314befa, d16fdcc4c152
Create Date: 2025-10-05 16:36:05.918483

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7644e48ee9a6'
down_revision: Union[str, Sequence[str], None] = ('481db314befa', 'd16fdcc4c152')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
