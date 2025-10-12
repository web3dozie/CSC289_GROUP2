"""add_task_validation_constraints

Adds validation rules to prevent bad data from getting into the database.

Revision ID: task_validation_001
Revises: 03499190d263
Create Date: 2025-10-12

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import CheckConstraint


# revision identifiers, used by Alembic.
revision = 'task_validation_001'
down_revision = '03499190d263'  # Points to user_sessions migration
branch_labels = None
depends_on = None


def upgrade():
    """Add validation rules to task table using batch mode for SQLite"""
    
    # Use batch mode to support SQLite constraint additions
    with op.batch_alter_table('task', schema=None) as batch_op:
        # Make sure task titles aren't empty
        batch_op.create_check_constraint(
            "task_title_not_empty",
            "length(trim(title)) > 0"
        )
        
        # Limit title length to 200 characters
        batch_op.create_check_constraint(
            "task_title_length",
            "length(title) <= 200"
        )
        
        # Limit description to 2000 characters
        batch_op.create_check_constraint(
            "task_description_length",
            "description IS NULL OR length(description) <= 2000"
        )
        
        # Time estimates must be positive
        batch_op.create_check_constraint(
            "task_estimate_positive",
            "estimate_minutes IS NULL OR estimate_minutes >= 0"
        )
        
        # Time estimates max 7 days (10080 minutes)
        batch_op.create_check_constraint(
            "task_estimate_max",
            "estimate_minutes IS NULL OR estimate_minutes <= 10080"
        )
        
        # Task order must be positive
        batch_op.create_check_constraint(
            "task_order_positive",
            '"order" >= 0'
        )


def downgrade():
    """Remove validation rules using batch mode for SQLite"""
    
    with op.batch_alter_table('task', schema=None) as batch_op:
        batch_op.drop_constraint("task_title_not_empty", type_="check")
        batch_op.drop_constraint("task_title_length", type_="check")
        batch_op.drop_constraint("task_description_length", type_="check")
        batch_op.drop_constraint("task_estimate_positive", type_="check")
        batch_op.drop_constraint("task_estimate_max", type_="check")
        batch_op.drop_constraint("task_order_positive", type_="check")
