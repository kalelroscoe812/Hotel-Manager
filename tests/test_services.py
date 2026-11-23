from decimal import Decimal
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from hotel_manager.database import Base
from hotel_manager.schemas import (
    HotelCreate,
    HotelUpdate,
    UserCreate,
    UserUpdate,
    RoomCreate,
    RoomUpdate,
    ElectricityMeterCreate,
)
from hotel_manager import services

pytestmark = pytest.mark.unit


@pytest.fixture
def db_session():
    """Isolated in-memory SQLite session for pure business-layer unit tests."""
    engine = create_engine("sqlite+pysqlite:///:memory:")
    Base.metadata.create_all(engine)
    with Session(engine) as session:
        yield session
    engine.dispose()


# ==================== HOTEL SERVICE UNIT TESTS ====================
def test_hotel_crud_lifecycle(db_session: Session):
    # Create
    hotel = services.create_hotel(
        db_session,
        HotelCreate(
            name="Harbor House",
            address="1 Marina Way",
            city="Boston",
            state="MA",
            country="USA",
            contact_number="617-555-0199",
            total_rooms=10,
        ),
    )
    assert hotel.id == 1
    assert hotel.name == "Harbor House"
    assert hotel.state == "MA"

    # Get
    fetched = services.get_hotel(db_session, hotel.id)
    assert fetched is not None
    assert fetched.city == "Boston"

    # List
    hotels = services.list_hotels(db_session, page=1, page_size=10)
    assert len(hotels) == 1
    assert hotels[0].name == "Harbor House"

    # Update
    updated = services.update_hotel(
        db_session,
        hotel.id,
        HotelUpdate(name="Harbor House Resort", total_rooms=15),
    )
    assert updated is not None
    assert updated.name == "Harbor House Resort"
    assert updated.total_rooms == 15
    assert updated.city == "Boston"

    # Non-existent update
    assert services.update_hotel(db_session, 999, HotelUpdate(name="Ghost")) is None

    # Delete
    deleted = services.delete_hotel(db_session, hotel.id)
    assert deleted is True
    assert services.get_hotel(db_session, hotel.id) is None
    assert services.delete_hotel(db_session, hotel.id) is False


# ==================== USER & AUTH SERVICE UNIT TESTS ====================
def test_user_and_auth_lifecycle(db_session: Session):
    # Create
    user = services.create_user(
        db_session,
        UserCreate(
            username="manager_dan",
            first_name="Dan",
            last_name="Miller",
            email="dan@hotelmanager.com",
            password="SecurePassword123!",
            role="PROPERTY_MANAGER",
        ),
    )
    assert user.id is not None
    assert user.username == "manager_dan"
    assert user.password_hash is not None
    assert user.password_hash.startswith("pbkdf2:sha256:")

    # Lookups
    assert services.get_user(db_session, user.id) is not None
    assert services.get_user_by_username(db_session, "manager_dan") is not None
    assert services.get_user_by_username(db_session, "unknown") is None
    assert services.get_user_by_email(db_session, "dan@hotelmanager.com") is not None
    assert services.get_user_by_email(db_session, "nobody@hotel.com") is None

    # Authentication
    auth_user, err = services.authenticate_user(db_session, "manager_dan", "SecurePassword123!")
    assert auth_user is not None
    assert err is None
    assert auth_user.id == user.id

    # Auth by email
    auth_by_email, err = services.authenticate_user(db_session, "dan@hotelmanager.com", "SecurePassword123!")
    assert auth_by_email is not None
    assert err is None

    # Bad password
    failed_user, err = services.authenticate_user(db_session, "manager_dan", "WrongPassword")
    assert failed_user is None
    assert "incorrect password" in err

    # Nonexistent user auth
    failed_user, err = services.authenticate_user(db_session, "ghost_user", "AnyPassword")
    assert failed_user is None
    assert "not found" in err

    # Update User
    updated_user = services.update_user(
        db_session,
        user.id,
        UserUpdate(first_name="Daniel", password="NewPassword456!"),
    )
    assert updated_user is not None
    assert updated_user.first_name == "Daniel"
    new_auth, _ = services.authenticate_user(db_session, "manager_dan", "NewPassword456!")
    assert new_auth is not None

    # Connect Email
    connected = services.connect_user_email(db_session, user.id, "daniel.miller@hotel.com")
    assert connected.email == "daniel.miller@hotel.com"

    # List Users
    user_list = services.list_users(db_session, page=1, page_size=10, role="PROPERTY_MANAGER")
    assert len(user_list) == 1
    assert services.list_users(db_session, role="ADMIN") == []

    # Delete User
    assert services.delete_user(db_session, user.id) is True
    assert services.get_user(db_session, user.id) is None
    assert services.delete_user(db_session, 999) is False


def test_hotel_user_binding(db_session: Session):
    hotel = services.create_hotel(
        db_session,
        HotelCreate(name="Alpine Lodge", address="10 Peak Rd", city="Aspen", country="USA"),
    )
    user = services.create_user(
        db_session,
        UserCreate(username="clerk_anna", first_name="Anna", last_name="Bell", role="FRONT_DESK"),
    )

    # Bind
    binding = services.bind_user_to_hotel(db_session, user.id, hotel.id)
    assert binding.hotel_id == hotel.id
    assert binding.user_id == user.id

    # Verify query
    assert services.get_user_hotel_id(db_session, user.id) == hotel.id
    bound_user = services.get_user_by_hotel_and_user_id(db_session, hotel.id, user.id)
    assert bound_user is not None
    assert bound_user.username == "clerk_anna"

    # Check unbound query
    assert services.get_user_by_hotel_and_user_id(db_session, hotel.id, 999) is None


# ==================== ROOM & METER SERVICE UNIT TESTS ====================
def test_room_inventory_and_filtering(db_session: Session):
    hotel = services.create_hotel(
        db_session,
        HotelCreate(name="Coastal Resort", address="5 Ocean Blvd", city="San Diego", country="USA"),
    )

    r1 = services.create_room(
        db_session,
        RoomCreate(
            hotel_id=hotel.id,
            room_number=101,
            status="available",
            floor=1,
            nightly_price=Decimal("150.00"),
            room_type="standard",
        ),
    )
    r2 = services.create_room(
        db_session,
        RoomCreate(
            hotel_id=hotel.id,
            room_number=201,
            status="OCCUPIED",
            floor=2,
            nightly_price=Decimal("250.00"),
            room_type="suite",
        ),
    )

    assert services.get_room(db_session, r1.id).room_number == 101

    # Filter by status
    available_rooms = services.list_rooms(db_session, hotel_id=hotel.id, status="available")
    assert len(available_rooms) == 1
    assert available_rooms[0].room_number == 101

    # Filter by floor
    floor2_rooms = services.list_rooms(db_session, hotel_id=hotel.id, floor=2)
    assert len(floor2_rooms) == 1
    assert floor2_rooms[0].room_number == 201

    # Filter by price range
    budget_rooms = services.list_rooms(
        db_session,
        hotel_id=hotel.id,
        min_price=Decimal("100.00"),
        max_price=Decimal("200.00"),
    )
    assert len(budget_rooms) == 1
    assert budget_rooms[0].room_number == 101

    # Update Room
    updated = services.update_room(
        db_session,
        r1.id,
        RoomUpdate(status="Maintenance", nightly_price=Decimal("165.00")),
    )
    assert updated.status == "Maintenance"
    assert updated.nightly_price == Decimal("165.00")

    # Delete Room
    assert services.delete_room(db_session, r2.id) is True
    assert services.get_room(db_session, r2.id) is None
    assert services.delete_room(db_session, 999) is False


def test_meter_telemetry_operations(db_session: Session):
    hotel = services.create_hotel(
        db_session,
        HotelCreate(name="Metro Inn", address="100 Main St", city="Atlanta", country="USA"),
    )
    room = services.create_room(
        db_session,
        RoomCreate(hotel_id=hotel.id, room_number=301, status="available"),
    )

    # Initial meter creation via upsert
    meter = services.create_or_update_meter(
        db_session,
        ElectricityMeterCreate(room_id=room.id, current_reading=120.5, status="Active"),
    )
    assert meter.id is not None
    assert meter.current_reading == 120.5
    assert meter.status == "Active"

    # Upsert existing meter with higher reading
    updated_meter = services.create_or_update_meter(
        db_session,
        ElectricityMeterCreate(room_id=room.id, current_reading=135.0, status="Active"),
    )
    assert updated_meter.id == meter.id
    assert updated_meter.current_reading == 135.0

    # Query meter
    fetched = services.get_meter_by_room(db_session, room.id)
    assert fetched is not None
    assert fetched.current_reading == 135.0
    assert services.get_meter_by_room(db_session, 999) is None

    # List meters
    meters = services.list_meters(db_session)
    assert len(meters) == 1

    # Delete meter
    assert services.delete_meter(db_session, meter.id) is True
    assert services.get_meter_by_room(db_session, room.id) is None
    assert services.delete_meter(db_session, 999) is False
