"""Add email and password_hash columns to users table for Resend email connection and authenticated login."""

from alembic import op
import sqlalchemy as sa


revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def upgrade():
    existing_columns = {
        column["name"] for column in sa.inspect(op.get_bind()).get_columns("users")
    }

    if "email" not in existing_columns:
        op.add_column("users", sa.Column("email", sa.String(length=255), nullable=True))
    if "password_hash" not in existing_columns:
        op.add_column(
            "users",
            sa.Column("password_hash", sa.String(length=255), nullable=True),
        )


def downgrade():
    op.drop_column("users", "password_hash")
    op.drop_column("users", "email")
