"""add restore_username to configs

Revision ID: a87549c02d2e
Revises: 6ff72447fe8c
Create Date: 2025-07-09 17:40:53.916535

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'a87549c02d2e'
down_revision: Union[str, Sequence[str], None] = '6ff72447fe8c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('configs', sa.Column('restore_username', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('configs', 'restore_username')
