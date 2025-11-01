"""merge heads before performance indexes

Revision ID: d6bfca52a7ec
Revises: b5be5d710e9b, f3ff46e97ac3
Create Date: 2025-11-01 00:03:25.396227

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd6bfca52a7ec'
down_revision: Union[str, Sequence[str], None] = ('b5be5d710e9b', 'f3ff46e97ac3')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
