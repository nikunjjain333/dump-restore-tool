"""drop operation column from configs

Revision ID: 9cea870afce6
Revises: a87549c02d2e
Create Date: 2025-07-09 18:02:10.705252

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '9cea870afce6'
down_revision: Union[str, Sequence[str], None] = 'a87549c02d2e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_column('configs', 'operation')


def downgrade() -> None:
    op.add_column('configs', sa.Column('operation', sa.String(), nullable=False))
