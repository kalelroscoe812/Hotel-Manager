import os
from decimal import Decimal

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker

from hotel_manager.database import Base, get_db
from hotel_manager.main import app
from hotel_manager.models import ElectricityMeter


@pytest.fixture
def room_client(tmp_path):
    database_path = tmp_path / "room_inventory.db"

    engine = create_engine(
        f"sqlite+pysqlite:///{database_path}",
        connect_args={"check_same_thread": False},
    )

    @event.listens_for(engine, "connect")
    def enable_foreign_keys(connection, connection_record):
        cursor = connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    session_factory = sessionmaker(bind=engine)
    Base.metadata.create_all(engine)

    def override_get_db():
        with session_factory() as session:
            yield session

    previous_overrides = app.dependency_overrides.copy()
    app.dependency_overrides[get_db] = override_get_db

    try:
        with TestClient(app) as client:
            yield client, session_factory
    finally:
        app.dependency_overrides.clear()
        app.dependency_overrides.update(previous_overrides)
        engine.dispose()


def create_hotel(client, name="Test Hotel"):
    response = client.post(
        "/hotels",
        json={
            "name": name,
            "address": "1 Test Street",
        },
    )

    assert response.status_code == 201, response.text
    return response.json()["id"]


def create_room(client, hotel_id, room_number=101, **inventory):
    response = client.post(
        "/rooms",
        json={
            "hotel_id": hotel_id,
            "room_number": room_number,
            **inventory,
        },
    )

    assert response.status_code == 201, response.text
    return response.json()


@pytest.fixture
def inventory(room_client):
    client, session_factory = room_client

    first_hotel = create_hotel(client, "First Hotel")
    second_hotel = create_hotel(client, "Second Hotel")

    rooms = [
        create_room(
            client,
            first_hotel,
            101,
            floor=1,
            nightly_price="100.00",
            room_type="single",
        ),
        create_room(
            client,
            first_hotel,
            201,
            floor=2,
            nightly_price="150.00",
            room_type="double",
        ),
        create_room(
            client,
            first_hotel,
            202,
            floor=2,
            nightly_price="200.00",
            room_type="double",
            status="OCCUPIED",
        ),
        create_room(
            client,
            second_hotel,
            201,
            floor=2,
            nightly_price="150.00",
            room_type="double",
        ),
        create_room(client, first_hotel, 301),
    ]

    return client, first_hotel, second_hotel, rooms


@pytest.mark.parametrize(
    ("filters", "expected_indexes"),
    [
        ({}, [0, 1, 3, 2, 4]),
        ({"floor": 1}, [0]),
        ({"floor": 2}, [1, 3, 2]),
        ({"room_type": " SINGLE "}, [0]),
        ({"status": "OCCUPIED"}, [2]),
        ({"min_price": "150.00"}, [1, 3, 2]),
        ({"max_price": "150.00"}, [0, 1, 3]),
        (
            {"min_price": "150.00", "max_price": "150.00"},
            [1, 3],
        ),
        ({"floor": 99}, []),
    ],
)
def test_room_filters(inventory, filters, expected_indexes):
    client, first_hotel, second_hotel, rooms = inventory

    response = client.get("/rooms", params=filters)

    assert response.status_code == 200, response.text

    expected_ids = [rooms[index]["id"] for index in expected_indexes]
    actual_ids = [room["id"] for room in response.json()]

    assert actual_ids == expected_ids


def test_combined_filters_and_pagination(inventory):
    client, first_hotel, second_hotel, rooms = inventory

    filters = {
        "hotel_id": first_hotel,
        "floor": 2,
        "room_type": "double",
        "min_price": "150.00",
        "max_price": "200.00",
        "page_size": 1,
    }

    first_page = client.get(
        "/rooms",
        params={**filters, "page": 1},
    )

    second_page = client.get(
        "/rooms",
        params={**filters, "page": 2},
    )

    third_page = client.get(
        "/rooms",
        params={**filters, "page": 3},
    )

    assert first_page.status_code == 200
    assert second_page.status_code == 200
    assert third_page.status_code == 200

    assert [room["id"] for room in first_page.json()] == [rooms[1]["id"]]
    assert [room["id"] for room in second_page.json()] == [rooms[2]["id"]]
    assert third_page.json() == []


@pytest.mark.parametrize(
    "filters",
    [
        {"page": 0},
        {"page_size": 0},
        {"page_size": 101},
        {"hotel_id": 0},
        {"floor": "invalid"},
        {"min_price": "-1"},
        {"max_price": "-1"},
        {"min_price": "200", "max_price": "100"},
        {"min_price": "NaN"},
        {"max_price": "Infinity"},
        {"min_price": "1.001"},
        {"room_type": "   "},
    ],
)
def test_invalid_filters_return_422(room_client, filters):
    client, session_factory = room_client

    response = client.get("/rooms", params=filters)

    assert response.status_code == 422, response.text


def test_room_creation_and_updates(room_client):
    client, session_factory = room_client
    hotel_id = create_hotel(client)

    room = create_room(
        client,
        hotel_id,
        floor=-1,
        nightly_price="125.50",
        room_type=" Suite ",
    )

    room_id = room["id"]

    assert room["floor"] == -1
    assert Decimal(room["nightly_price"]) == Decimal("125.50")
    assert room["room_type"] == "suite"

    response = client.put(
        f"/rooms/{room_id}",
        json={"status": "OCCUPIED"},
    )

    assert response.status_code == 200, response.text
    assert response.json()["floor"] == -1
    assert Decimal(response.json()["nightly_price"]) == Decimal("125.50")
    assert response.json()["room_type"] == "suite"

    response = client.put(
        f"/rooms/{room_id}",
        json={
            "floor": None,
            "nightly_price": None,
            "room_type": None,
        },
    )

    assert response.status_code == 200, response.text

    response = client.get(f"/rooms/{room_id}")

    assert response.status_code == 200
    assert response.json()["floor"] is None
    assert response.json()["nightly_price"] is None
    assert response.json()["room_type"] is None
    assert response.json()["status"] == "OCCUPIED"


@pytest.mark.parametrize(
    "changes",
    [
        {"room_number": None},
        {"status": None},
        {"nightly_price": "-1"},
        {"nightly_price": "1.001"},
        {"room_type": "   "},
    ],
)
def test_invalid_updates_return_422(room_client, changes):
    client, session_factory = room_client
    hotel_id = create_hotel(client)
    room = create_room(client, hotel_id)

    response = client.put(
        f"/rooms/{room['id']}",
        json=changes,
    )

    assert response.status_code == 422, response.text


def test_missing_hotel_and_rooms(room_client):
    client, session_factory = room_client

    response = client.post(
        "/rooms",
        json={
            "hotel_id": 999,
            "room_number": 101,
        },
    )

    assert response.status_code == 404

    assert client.get("/rooms/999").status_code == 404

    response = client.put(
        "/rooms/999",
        json={"status": "OCCUPIED"},
    )

    assert response.status_code == 404
    assert client.delete("/rooms/999").status_code == 404


def test_delete_room_updates_hotel_count(room_client):
    client, session_factory = room_client
    hotel_id = create_hotel(client)
    room = create_room(client, hotel_id)

    response = client.delete(f"/rooms/{room['id']}")

    assert response.status_code == 204
    assert response.content == b""
    assert client.get(f"/rooms/{room['id']}").status_code == 404

    hotel_response = client.get(f"/hotels/{hotel_id}")

    assert hotel_response.status_code == 200
    assert hotel_response.json()["total_rooms"] == 0


def test_delete_room_with_meter_returns_409(room_client):
    client, session_factory = room_client
    hotel_id = create_hotel(client)
    room = create_room(client, hotel_id)

    with session_factory() as session:
        session.add(
            ElectricityMeter(
                room_id=room["id"],
                current_reading=25.0,
                status="Active",
            )
        )
        session.commit()

    response = client.delete(f"/rooms/{room['id']}")

    assert response.status_code == 409
    assert client.get(f"/rooms/{room['id']}").status_code == 200


def test_meter_creation_and_update(room_client):
    client, session_factory = room_client
    hotel_id = create_hotel(client)
    room = create_room(client, hotel_id)
    room_id = room["id"]

    response = client.post(
        "/meters",
        json={
            "room_id": room_id,
            "current_reading": 125.5,
            "status": "Active",
        },
    )

    assert response.status_code == 200, response.text

    meter_id = response.json()["id"]

    assert response.json()["room_id"] == room_id
    assert response.json()["current_reading"] == 125.5

    response = client.post(
        "/meters",
        json={
            "room_id": room_id,
            "current_reading": 150.75,
            "status": "Inactive",
        },
    )

    assert response.status_code == 200, response.text
    assert response.json()["id"] == meter_id

    response = client.get(f"/rooms/{room_id}/meter")

    assert response.status_code == 200, response.text
    assert response.json()["id"] == meter_id
    assert response.json()["current_reading"] == 150.75
    assert response.json()["status"] == "Inactive"

    with session_factory() as session:
        meters = (
            session.query(ElectricityMeter)
            .filter(ElectricityMeter.room_id == room_id)
            .all()
        )

        assert len(meters) == 1


def test_meter_endpoints_reject_missing_room(room_client):
    client, session_factory = room_client

    response = client.post(
        "/meters",
        json={
            "room_id": 999,
            "current_reading": 100.0,
            "status": "Active",
        },
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Room not found"

    response = client.get("/rooms/999/meter")

    assert response.status_code == 404
    assert response.json()["detail"] == "Room not found"


def test_existing_room_without_meter_returns_404(room_client):
    client, session_factory = room_client
    hotel_id = create_hotel(client)
    room = create_room(client, hotel_id)

    response = client.get(f"/rooms/{room['id']}/meter")

    assert response.status_code == 404
    assert response.json()["detail"] == "Electricity meter not found"


@pytest.mark.parametrize(
    "payload",
    [
        {},
        {"room_id": "invalid"},
        {"room_id": 1, "current_reading": "invalid"},
    ],
)
def test_invalid_meter_requests_return_422(room_client, payload):
    client, session_factory = room_client

    response = client.post("/meters", json=payload)

    assert response.status_code == 422, response.text