"""merge heads for user guide screenshots

Revision ID: dfad37dcfdb7
Revises: 0c2602256f20, 2030cbb9b866
Create Date: 2025-11-07 20:09:47.055470

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'dfad37dcfdb7'
down_revision: Union[str, Sequence[str], None] = ('0c2602256f20', '2030cbb9b866')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
