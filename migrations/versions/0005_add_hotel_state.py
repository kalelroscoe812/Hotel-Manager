"""Add state column to hotels table."""

from alembic import op
import sqlalchemy as sa


revision = "0005"
down_revision = "0004"
branch_labels = None
depends_on = None


def upgrade():
    existing_columns = {
        column["name"] for column in sa.inspect(op.get_bind()).get_columns("hotels")
    }

    if "state" not in existing_columns:
        op.add_column("hotels", sa.Column("state", sa.String(length=100), nullable=True, server_default=""))


def downgrade():
    op.drop_column("hotels", "state")
