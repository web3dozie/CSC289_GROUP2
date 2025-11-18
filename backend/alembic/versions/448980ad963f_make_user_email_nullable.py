"""Make user email field nullable

Fixes database schema mismatch where the email column was incorrectly set as
NOT NULL, preventing user account creation when email is not provided. The User
model defines email as nullable=True, so this migration aligns the database
schema with the model definition to allow optional email during signup.

Revision ID: 448980ad963f
Revises: f3ff46e97ac3
Create Date: 2025-11-01 02:31:00.400695

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '448980ad963f'
down_revision: Union[str, Sequence[str], None] = 'f3ff46e97ac3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Make email column nullable in user table
    with op.batch_alter_table('user', schema=None) as batch_op:
        batch_op.alter_column('email',
                              existing_type=sa.String(length=99),
                              nullable=True)


def downgrade() -> None:
    """Downgrade schema."""
    # Make email column NOT NULL again
    with op.batch_alter_table('user', schema=None) as batch_op:
        batch_op.alter_column('email',
                              existing_type=sa.String(length=99),
                              nullable=False)
