from sqlalchemy import select
from sqlalchemy.orm import Session

from hotel_manager.models import Hotel, User, HotelUser, Room, ElectricityMeter
from hotel_manager.schemas import (
    HotelCreate,
    HotelUpdate,
    UserCreate,
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
    # delete associated rooms
    rooms = list(db.scalars(select(Room).where(Room.hotel_id == hotel_id)))
    for r in rooms:
        db.delete(r)
    db.delete(hotel)
    db.commit()
    return True


# ==================== USER SERVICES ====================
def create_user(db: Session, payload: UserCreate) -> User:
    user = User(**payload.model_dump())
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


def get_user_by_username(db: Session, username: str) -> User | None:
    return db.scalar(select(User).where(User.username == username))


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
) -> list[Room]:
    stmt = select(Room).order_by(Room.room_number)
    if hotel_id is not None:
        stmt = stmt.where(Room.hotel_id == hotel_id)
    if status is not None:
        stmt = stmt.where(Room.status == status)
    offset = (page - 1) * page_size
    stmt = stmt.offset(offset).limit(page_size)
    return list(db.scalars(stmt))


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