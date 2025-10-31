"""merge heads

Revision ID: 3927d2aa6714
Revises: task_validation_001, 33e27e3b0b06
Create Date: 2025-10-13 16:51:53.860222

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3927d2aa6714'
down_revision: Union[str, Sequence[str], None] = ('task_validation_001', '33e27e3b0b06')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
