"""empty message

Revision ID: f3ff46e97ac3
Revises: 3927d2aa6714, ae80be0ccd2c
Create Date: 2025-10-26 16:51:50.101984

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f3ff46e97ac3'
down_revision: Union[str, Sequence[str], None] = ('3927d2aa6714', 'ae80be0ccd2c')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
