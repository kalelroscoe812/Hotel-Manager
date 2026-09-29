from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from hotel_manager.database import Base
from hotel_manager.schemas import HotelCreate
from hotel_manager.services import create_hotel, list_hotels


def test_create_and_list_hotels():
    engine = create_engine("sqlite+pysqlite:///:memory:")
    Base.metadata.create_all(engine)

    with Session(engine) as db:
        created = create_hotel(
            db,
            HotelCreate(
                name="Harbor House",
                address="1 Marina Way",
                city="Boston",
                country="USA",
            ),
        )

        hotels = list_hotels(db)

    assert created.id == 1
    assert [hotel.name for hotel in hotels] == ["Harbor House"]