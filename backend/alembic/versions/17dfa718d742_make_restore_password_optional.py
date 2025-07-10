"""make_restore_password_optional

Revision ID: 17dfa718d742
Revises: 3a0de587b7c4
Create Date: 2025-07-11 03:50:33.051238

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '17dfa718d742'
down_revision: Union[str, Sequence[str], None] = '3a0de587b7c4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Make restore_password column nullable
    op.alter_column('configs', 'restore_password',
                    existing_type=sa.String(),
                    nullable=True)


def downgrade() -> None:
    """Downgrade schema."""
    # Make restore_password column non-nullable
    op.alter_column('configs', 'restore_password',
                    existing_type=sa.String(),
                    nullable=False)
