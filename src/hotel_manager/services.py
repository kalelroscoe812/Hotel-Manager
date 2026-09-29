from sqlalchemy import select
from sqlalchemy.orm import Session

from hotel_manager.models import Hotel
from hotel_manager.schemas import HotelCreate


def create_hotel(db: Session, payload: HotelCreate) -> Hotel:
    hotel = Hotel(**payload.model_dump())
    db.add(hotel)
    db.commit()
    db.refresh(hotel)
    return hotel


def list_hotels(db: Session) -> list[Hotel]:
    return list(db.scalars(select(Hotel).order_by(Hotel.id)))