"""add missing performance indexes

Revision ID: 1cce66b666c8
Revises: d6bfca52a7ec
Create Date: 2025-11-01 00:03:58.607231

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1cce66b666c8'
down_revision: Union[str, Sequence[str], None] = 'd6bfca52a7ec'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add missing performance indexes."""
    # Task table indexes
    op.create_index('ix_task_status_id', 'task', ['status_id'])
    op.create_index('ix_task_due_date', 'task', ['due_date'])
    op.create_index('ix_task_archived', 'task', ['archived'])
    op.create_index('ix_task_done', 'task', ['done'])
    op.create_index('ix_task_created_on', 'task', ['created_on'])
    
    # JournalEntry table index
    op.create_index('ix_journal_entries_entry_date', 'journal_entries', ['entry_date'])


def downgrade() -> None:
    """Remove performance indexes."""
    # Remove Task indexes
    op.drop_index('ix_task_status_id', 'task')
    op.drop_index('ix_task_due_date', 'task')
    op.drop_index('ix_task_archived', 'task')
    op.drop_index('ix_task_done', 'task')
    op.drop_index('ix_task_created_on', 'task')
    
    # Remove JournalEntry index
    op.drop_index('ix_journal_entries_entry_date', 'journal_entries')
