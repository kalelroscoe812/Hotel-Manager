"""Add hotel fields used by current API models."""

from alembic import op
import sqlalchemy as sa


revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade():
    existing_columns = {
        column["name"] for column in sa.inspect(op.get_bind()).get_columns("hotels")
    }

    if "logo" not in existing_columns:
        op.add_column("hotels", sa.Column("logo", sa.String(length=500), nullable=True))
    if "contact_number" not in existing_columns:
        op.add_column(
            "hotels",
            sa.Column("contact_number", sa.String(length=50), nullable=True),
        )
    if "total_rooms" not in existing_columns:
        op.add_column(
            "hotels",
            sa.Column(
                "total_rooms",
                sa.Integer(),
                nullable=False,
                server_default="0",
            ),
        )
        op.alter_column("hotels", "total_rooms", server_default=None)


def downgrade():
    # These fields belong to the baseline schema; this revision only repairs older databases.
    pass
