"""Add optional room inventory fields."""

from alembic import op
import sqlalchemy as sa


revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "rooms",
        sa.Column(
            "floor",
            sa.Integer(),
            nullable=True,
        ),
    )

    op.add_column(
        "rooms",
        sa.Column(
            "nightly_price",
            sa.Numeric(10, 2),
            nullable=True,
        ),
    )

    op.add_column(
        "rooms",
        sa.Column(
            "room_type",
            sa.String(50),
            nullable=True,
        ),
    )


def downgrade():
    with op.batch_alter_table("rooms") as batch_op:
        batch_op.drop_column("room_type")
        batch_op.drop_column("nightly_price")
        batch_op.drop_column("floor")