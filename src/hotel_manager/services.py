from decimal import Decimal
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from hotel_manager.models import Hotel, User, HotelUser, Room, ElectricityMeter
from hotel_manager.auth import hash_password, verify_password
from hotel_manager.schemas import (
    HotelCreate,
    HotelUpdate,
    UserCreate,
    UserUpdate,
    RoomCreate,
    RoomUpdate,
    ElectricityMeterCreate,
)


# ==================== HOTEL SERVICES ====================
def create_hotel(db: Session, payload: HotelCreate) -> Hotel:
    hotel = Hotel(**payload.model_dump())
    db.add(hotel)
    db.commit()
    db.refresh(hotel)
    return hotel


def list_hotels(db: Session, page: int = 1, page_size: int = 50) -> list[Hotel]:
    offset = (page - 1) * page_size
    stmt = select(Hotel).order_by(Hotel.id).offset(offset).limit(page_size)
    return list(db.scalars(stmt))


def get_hotel(db: Session, hotel_id: int) -> Hotel | None:
    return db.scalar(select(Hotel).where(Hotel.id == hotel_id))


def update_hotel(db: Session, hotel_id: int, payload: HotelUpdate) -> Hotel | None:
    hotel = get_hotel(db, hotel_id)
    if not hotel:
        return None
    for field, val in payload.model_dump(exclude_unset=True).items():
        setattr(hotel, field, val)
    db.commit()
    db.refresh(hotel)
    return hotel


def delete_hotel(db: Session, hotel_id: int) -> bool:
    hotel = get_hotel(db, hotel_id)
    if not hotel:
        return False

    room_ids = select(Room.id).where(Room.hotel_id == hotel_id)
    db.execute(
        delete(ElectricityMeter).where(ElectricityMeter.room_id.in_(room_ids))
    )
    db.execute(delete(Room).where(Room.hotel_id == hotel_id))
    db.execute(delete(HotelUser).where(HotelUser.hotel_id == hotel_id))
    db.delete(hotel)
    db.commit()
    return True


# ==================== USER SERVICES ====================
def create_user(db: Session, payload: UserCreate) -> User:
    data = payload.model_dump(exclude={"hotel_id", "password"})
    password_hash = hash_password(payload.password) if payload.password else None
    user = User(**data, password_hash=password_hash)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def list_users(
    db: Session,
    page: int = 1,
    page_size: int = 20,
    role: str | None = None,
) -> list[User]:
    stmt = select(User).order_by(User.id)
    if role:
        stmt = stmt.where(User.role == role)
    offset = (page - 1) * page_size
    stmt = stmt.offset(offset).limit(page_size)
    return list(db.scalars(stmt))


def get_user(db: Session, user_id: int) -> User | None:
    return db.scalar(select(User).where(User.id == user_id))


def delete_user(db: Session, user_id: int) -> bool:
    user = get_user(db, user_id)
    if user is None:
        return False
    db.execute(delete(HotelUser).where(HotelUser.user_id == user_id))
    db.delete(user)
    db.commit()
    return True


def update_user(db: Session, user_id: int, payload: UserUpdate) -> User | None:
    user = get_user(db, user_id)
    if not user:
        return None
    data = payload.model_dump(exclude_unset=True)
    if "password" in data:
        pw = data.pop("password")
        if pw:
            user.password_hash = hash_password(pw)
    if "hotel_id" in data:
        hid = data.pop("hotel_id")
        if hid is not None:
            bind_user_to_hotel(db, user_id, hid)
    for field, val in data.items():
        setattr(user, field, val)
    db.commit()
    db.refresh(user)
    return user


def get_user_by_username(db: Session, username: str) -> User | None:
    return db.scalar(select(User).where(User.username == username))


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(User.email == email))


def get_user_by_username_or_email(db: Session, identifier: str) -> User | None:
    return db.scalar(
        select(User).where((User.username == identifier) | (User.email == identifier))
    )


def authenticate_user(
    db: Session,
    username_or_email: str,
    password: str | None = None,
) -> tuple[User | None, str | None]:
    """
    Authenticate user by username or email.
    If password is provided, verifies against password_hash.
    If user has no password set (legacy seed), allows login or sets password.
    Returns (user, error_message).
    """
    user = get_user_by_username_or_email(db, username_or_email)
    if not user:
        return None, "Invalid credentials: user not found"

    if password is not None and user.password_hash:
        if not verify_password(password, user.password_hash):
            return None, "Invalid credentials: incorrect password"
    elif password is not None and not user.password_hash:
        # User was seeded without a password hash - update password on first login
        user.password_hash = hash_password(password)
        db.commit()
        db.refresh(user)

    return user, None


def connect_user_email(db: Session, user_id: int, email: str) -> User | None:
    user = get_user(db, user_id)
    if not user:
        return None
    user.email = email
    db.commit()
    db.refresh(user)
    return user


def bind_user_to_hotel(db: Session, user_id: int, hotel_id: int) -> HotelUser:
    existing = db.scalar(
        select(HotelUser).where(HotelUser.user_id == user_id, HotelUser.hotel_id == hotel_id)
    )
    if existing:
        return existing
    binding = HotelUser(user_id=user_id, hotel_id=hotel_id)
    db.add(binding)
    db.commit()
    db.refresh(binding)
    return binding


def get_user_hotel_id(db: Session, user_id: int) -> int | None:
    binding = db.scalar(select(HotelUser).where(HotelUser.user_id == user_id))
    return binding.hotel_id if binding else None


def get_user_by_hotel_and_user_id(db: Session, hotel_id: int, user_id: int) -> User | None:
    binding = db.scalar(
        select(HotelUser).where(HotelUser.hotel_id == hotel_id, HotelUser.user_id == user_id)
    )
    if not binding:
        return None
    return get_user(db, user_id)


# ==================== ROOM SERVICES ====================
def create_room(db: Session, payload: RoomCreate) -> Room:
    room = Room(**payload.model_dump())
    db.add(room)
    db.commit()
    db.refresh(room)

    # automatically update hotel total_rooms
    hotel = get_hotel(db, payload.hotel_id)
    if hotel:
        count = len(list(db.scalars(select(Room).where(Room.hotel_id == payload.hotel_id))))
        hotel.total_rooms = count
        db.commit()

    return room


def list_rooms(
    db: Session,
    page: int = 1,
    page_size: int = 50,
    hotel_id: int | None = None,
    status: str | None = None,
    floor: int | None = None,
    room_type: str | None = None,
    min_price: Decimal | None = None,
    max_price: Decimal | None = None,
) -> list[Room]:
    statement = select(Room)

    if hotel_id is not None:
        statement = statement.where(Room.hotel_id == hotel_id)

    if status is not None:
        statement = statement.where(Room.status == status)

    if floor is not None:
        statement = statement.where(Room.floor == floor)

    if room_type is not None:
        statement = statement.where(Room.room_type == room_type)

    if min_price is not None:
        statement = statement.where(Room.nightly_price >= min_price)

    if max_price is not None:
        statement = statement.where(Room.nightly_price <= max_price)

    offset = (page - 1) * page_size

    statement = (
        statement
        .order_by(Room.room_number, Room.id)
        .offset(offset)
        .limit(page_size)
    )

    return list(db.scalars(statement))


def get_room(db: Session, room_id: int) -> Room | None:
    return db.scalar(select(Room).where(Room.id == room_id))


def update_room(db: Session, room_id: int, payload: RoomUpdate) -> Room | None:
    room = get_room(db, room_id)
    if not room:
        return None
    for field, val in payload.model_dump(exclude_unset=True).items():
        setattr(room, field, val)
    db.commit()
    db.refresh(room)
    return room


def delete_room(db: Session, room_id: int) -> bool:
    room = get_room(db, room_id)
    if not room:
        return False
    hotel_id = room.hotel_id
    db.delete(room)
    db.commit()

    hotel = get_hotel(db, hotel_id)
    if hotel:
        count = len(list(db.scalars(select(Room).where(Room.hotel_id == hotel_id))))
        hotel.total_rooms = count
        db.commit()

    return True


# ==================== ELECTRICITY METER SERVICES ====================
def create_or_update_meter(db: Session, payload: ElectricityMeterCreate) -> ElectricityMeter:
    meter = db.scalar(select(ElectricityMeter).where(ElectricityMeter.room_id == payload.room_id))
    if meter:
        meter.current_reading = payload.current_reading
        meter.status = payload.status
    else:
        meter = ElectricityMeter(**payload.model_dump())
        db.add(meter)
    db.commit()
    db.refresh(meter)
    return meter


def get_meter_by_room(db: Session, room_id: int) -> ElectricityMeter | None:
    return db.scalar(select(ElectricityMeter).where(ElectricityMeter.room_id == room_id))