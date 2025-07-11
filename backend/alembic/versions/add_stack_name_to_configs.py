"""add stack_name to configs

Revision ID: addstackname1234
Revises: 17dfa718d742
Create Date: 2025-07-11 20:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'addstackname1234'
down_revision: Union[str, Sequence[str], None] = '17dfa718d742'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.add_column('configs', sa.Column('stack_name', sa.String(), nullable=True))

def downgrade() -> None:
    op.drop_column('configs', 'stack_name') 