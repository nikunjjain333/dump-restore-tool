"""add restore_stack_name field to configs

Revision ID: c1234567890d
Revises: b1234567890a
Create Date: 2025-01-27 11:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'c1234567890d'
down_revision: Union[str, Sequence[str], None] = 'b1234567890a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('configs', sa.Column('restore_stack_name', sa.String(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('configs', 'restore_stack_name') 