"""merge migration heads

Revision ID: b5be5d710e9b
Revises: 2030cbb9b866, ae80be0ccd2c
Create Date: 2025-10-31 22:16:28.673517

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b5be5d710e9b'
down_revision: Union[str, Sequence[str], None] = ('2030cbb9b866', 'ae80be0ccd2c')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
