from enum import Enum as PyEnum
from sqlalchemy import Float, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from hotel_manager.database import Base
from decimal import Decimal

class UserRole(str, PyEnum):
    FRONT_DESK = "FRONT_DESK"
    PROPERTY_MANAGER = "PROPERTY_MANAGER"
    MAINTENANCE_ENGINEER = "MAINTENANCE_ENGINEER"
    GUEST = "GUEST"
    ADMIN = "ADMIN"


class RoomStatus(str, PyEnum):
    AVAILABLE = "available"
    OCCUPIED = "OCCUPIED"
    MAINTENANCE = "Maintenance"


class Hotel(Base):
    __tablename__ = "hotels"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    address: Mapped[str] = mapped_column(String(250), nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=True, default="")
    country: Mapped[str] = mapped_column(String(100), nullable=True, default="")
    logo: Mapped[str | None] = mapped_column(String(500), nullable=True)
    contact_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    total_rooms: Mapped[int] = mapped_column(Integer, default=0)

    @property
    def hotel_id(self) -> int:
        return self.id


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    other_info: Mapped[str | None] = mapped_column(String(255), nullable=True)
    role: Mapped[str] = mapped_column(String(50), default=UserRole.FRONT_DESK.value)

    @property
    def user_id(self) -> int:
        return self.id


class HotelUser(Base):
    __tablename__ = "hotel_users"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    hotel_id: Mapped[int] = mapped_column(ForeignKey("hotels.id"), nullable=False)


class Room(Base):
    __tablename__ = "rooms"

    id: Mapped[int] = mapped_column(primary_key=True)

    hotel_id: Mapped[int] = mapped_column(
        ForeignKey("hotels.id"),
        nullable=False,
    )

    room_number: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(50),
        default=RoomStatus.AVAILABLE.value,
        nullable=False,
    )

    floor: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    nightly_price: Mapped[Decimal | None] = mapped_column(
        Numeric(10, 2),
        nullable=True,
    )

    room_type: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

class ElectricityMeter(Base):
    __tablename__ = "electricity_meters"

    id: Mapped[int] = mapped_column(primary_key=True)
    room_id: Mapped[int] = mapped_column(ForeignKey("rooms.id"), unique=True, nullable=False)
    current_reading: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[str] = mapped_column(String(50), default="Active")