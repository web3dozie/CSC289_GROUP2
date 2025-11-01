"""empty message

Revision ID: 9a4131cb24cd
Revises: 0c2602256f20
Create Date: 2025-11-01 17:20:32.342053

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9a4131cb24cd'
down_revision: Union[str, Sequence[str], None] = '0c2602256f20'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
