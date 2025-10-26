"""replace_ai_url_with_openai_compatible_fields

Revision ID: ae80be0ccd2c
Revises: 3b80f86b0f6f
Create Date: 2025-10-10 14:54:27.284261

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ae80be0ccd2c'
down_revision: Union[str, Sequence[str], None] = '3b80f86b0f6f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Replace ai_url with OpenAI-compatible fields."""
    # Add new columns for OpenAI-compatible API configuration
    op.add_column('configuration', sa.Column('ai_api_url', sa.String(length=500), nullable=True))
    op.add_column('configuration', sa.Column('ai_model', sa.String(length=100), nullable=True))
    op.add_column('configuration', sa.Column('ai_api_key', sa.String(length=500), nullable=True))

    # Drop old ai_url column
    op.drop_column('configuration', 'ai_url')


def downgrade() -> None:
    """Restore ai_url field."""
    # Restore old ai_url column
    op.add_column('configuration', sa.Column('ai_url', sa.String(length=500), nullable=True))

    # Drop new columns
    op.drop_column('configuration', 'ai_api_key')
    op.drop_column('configuration', 'ai_model')
    op.drop_column('configuration', 'ai_api_url')
