"""add_task_validation_constraints

Adds validation rules to prevent bad data from getting into the database.

Revision ID: task_validation_001
Revises: 
Create Date: 2025-10-12

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import CheckConstraint


# revision identifiers, used by Alembic.
revision = 'task_validation_001'
down_revision = None  # Will be updated to point to latest migration
branch_labels = None
depends_on = None


def upgrade():
    """Add validation rules to task table"""
    
    # Make sure task titles aren't empty
    op.create_check_constraint(
        "task_title_not_empty",
        "task",
        "length(trim(title)) > 0"
    )
    
    # Limit title length to 200 characters
    op.create_check_constraint(
        "task_title_length",
        "task",
        "length(title) <= 200"
    )
    
    # Limit description to 2000 characters
    op.create_check_constraint(
        "task_description_length",
        "task",
        "description IS NULL OR length(description) <= 2000"
    )
    
    # Time estimates must be positive
    op.create_check_constraint(
        "task_estimate_positive",
        "task",
        "estimate_minutes IS NULL OR estimate_minutes >= 0"
    )
    
    # Time estimates max 7 days (10080 minutes)
    op.create_check_constraint(
        "task_estimate_max",
        "task",
        "estimate_minutes IS NULL OR estimate_minutes <= 10080"
    )
    
    # Task order must be positive
    op.create_check_constraint(
        "task_order_positive",
        "task",
        '"order" >= 0'
    )


def downgrade():
    """Remove validation rules"""
    
    op.drop_constraint("task_title_not_empty", "task", type_="check")
    op.drop_constraint("task_title_length", "task", type_="check")
    op.drop_constraint("task_description_length", "task", type_="check")
    op.drop_constraint("task_estimate_positive", "task", type_="check")
    op.drop_constraint("task_estimate_max", "task", type_="check")
    op.drop_constraint("task_order_positive", "task", type_="check")
