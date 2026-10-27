"""Create the original hotel manager tables."""

from alembic import op
import sqlalchemy as sa


revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "hotels",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(150), nullable=False),
        sa.Column("address", sa.String(250), nullable=False),
        sa.Column("city", sa.String(100), nullable=True),
        sa.Column("country", sa.String(100), nullable=True),
        sa.Column("logo", sa.String(500), nullable=True),
        sa.Column("contact_number", sa.String(50), nullable=True),
        sa.Column("total_rooms", sa.Integer(), nullable=False),
    )

    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("username", sa.String(100), nullable=False),
        sa.Column("first_name", sa.String(100), nullable=False),
        sa.Column("last_name", sa.String(100), nullable=False),
        sa.Column("other_info", sa.String(255), nullable=True),
        sa.Column("role", sa.String(50), nullable=False),
        sa.UniqueConstraint("username"),
    )

    op.create_table(
        "hotel_users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id"),
            nullable=False,
        ),
        sa.Column(
            "hotel_id",
            sa.Integer(),
            sa.ForeignKey("hotels.id"),
            nullable=False,
        ),
    )

    op.create_table(
        "rooms",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "hotel_id",
            sa.Integer(),
            sa.ForeignKey("hotels.id"),
            nullable=False,
        ),
        sa.Column("room_number", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(50), nullable=False),
    )

    op.create_table(
        "electricity_meters",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "room_id",
            sa.Integer(),
            sa.ForeignKey("rooms.id"),
            nullable=False,
        ),
        sa.Column("current_reading", sa.Float(), nullable=False),
        sa.Column("status", sa.String(50), nullable=False),
        sa.UniqueConstraint("room_id"),
    )


def downgrade():
    op.drop_table("electricity_meters")
    op.drop_table("rooms")
    op.drop_table("hotel_users")
    op.drop_table("users")
    op.drop_table("hotels")