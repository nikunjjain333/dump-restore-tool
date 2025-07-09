"""add restore_host and restore_port fields to configs

Revision ID: b1234567890a
Revises: 9cea870afce6
Create Date: 2025-01-27 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'b1234567890a'
down_revision: Union[str, Sequence[str], None] = '9cea870afce6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('configs', sa.Column('restore_host', sa.String(), nullable=True))
    op.add_column('configs', sa.Column('restore_port', sa.String(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('configs', 'restore_port')
    op.drop_column('configs', 'restore_host') 