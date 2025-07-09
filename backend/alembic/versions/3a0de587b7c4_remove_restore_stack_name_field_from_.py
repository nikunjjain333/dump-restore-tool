"""remove restore_stack_name field from configs

Revision ID: 3a0de587b7c4
Revises: c1234567890d
Create Date: 2025-07-10 01:43:04.211146

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '3a0de587b7c4'
down_revision: Union[str, Sequence[str], None] = 'c1234567890d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Drop the restore_stack_name column from configs table
    op.drop_column('configs', 'restore_stack_name')


def downgrade() -> None:
    """Downgrade schema."""
    # Add back the restore_stack_name column to configs table
    op.add_column('configs', sa.Column('restore_stack_name', sa.String(), nullable=True))
