"""add dump_file_name to configs

Revision ID: 6ff72447fe8c
Revises: 
Create Date: 2025-07-09 17:33:39.094578

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '6ff72447fe8c'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('configs', sa.Column('dump_file_name', sa.String(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('configs', 'dump_file_name')
