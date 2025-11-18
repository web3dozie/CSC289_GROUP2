"""merge heads

Revision ID: 33e27e3b0b06
Revises: 7644e48ee9a6, 5f98d9b06c2f
Create Date: 2025-10-07 18:41:54.347491

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '33e27e3b0b06'
down_revision: Union[str, Sequence[str], None] = ('7644e48ee9a6', '5f98d9b06c2f')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
