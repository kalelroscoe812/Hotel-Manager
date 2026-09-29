from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from hotel_manager.database import Base


class Hotel(Base):
    __tablename__ = "hotels"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    address: Mapped[str] = mapped_column(String(250), nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    country: Mapped[str] = mapped_column(String(100), nullable=False)