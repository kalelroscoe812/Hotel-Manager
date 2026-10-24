import os
os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from hotel_manager.database import Base, get_db
from hotel_manager.main import app


@pytest.fixture
def client_and_db(tmp_path):
    engine = create_engine(f"sqlite+pysqlite:///{tmp_path / 'test_deliverables.db'}")
    TestingSessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    Base.metadata.create_all(engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()
    engine.dispose()


def test_oct27_high_priority_hotel_apis(client_and_db):
    client = client_and_db

    # 1. Create hotel
    res = client.post(
        "/hotels",
        json={
            "name": "Grand Plaza",
            "address": "100 Peachtree St",
            "city": "Atlanta",
            "country": "USA",
            "contact_number": "404-555-1234",
            "total_rooms": 50,
        },
    )
    assert res.status_code == 201
    hotel_id = res.json()["id"]
    assert res.json()["name"] == "Grand Plaza"

    # 2. Get hotel by ID
    res = client.get(f"/hotels/{hotel_id}")
    assert res.status_code == 200
    assert res.json()["contact_number"] == "404-555-1234"

    # 3. Update hotel
    res = client.put(
        f"/hotels/{hotel_id}",
        json={"name": "Grand Plaza Resort", "contact_number": "404-555-9999"},
    )
    assert res.status_code == 200
    assert res.json()["name"] == "Grand Plaza Resort"
    assert res.json()["contact_number"] == "404-555-9999"

    # 4. List hotels with pagination
    res = client.get("/hotels?page=1&page_size=10")
    assert res.status_code == 200
    assert len(res.json()) >= 1


def test_oct27_high_priority_user_apis_and_auth(client_and_db):
    client = client_and_db

    # Create a hotel first
    h_res = client.post(
        "/hotels",
        json={"name": "Atlanta Inn", "address": "200 Martin Luther King Dr", "city": "Atlanta", "country": "USA"},
    )
    hotel_id = h_res.json()["id"]

    # 1. Add User
    res = client.post(
        "/users",
        json={
            "username": "frontdesk_marcus",
            "first_name": "Marcus",
            "last_name": "Garvey",
            "other_info": "Shift A",
            "role": "FRONT_DESK",
        },
    )
    assert res.status_code == 201
    user_id = res.json()["id"]
    assert res.json()["role"] == "FRONT_DESK"

    # 2. List users with pagination and role filter
    res = client.get("/users?page=1&page_size=10&role=FRONT_DESK")
    assert res.status_code == 200
    assert any(u["username"] == "frontdesk_marcus" for u in res.json())

    # 3. Bind user with hotel
    res = client.post(f"/hotels/{hotel_id}/users/{user_id}/bind")
    assert res.status_code == 200

    # 4. Get user by hotel and user id
    res = client.get(f"/hotels/{hotel_id}/users/{user_id}")
    assert res.status_code == 200
    assert res.json()["username"] == "frontdesk_marcus"

    # 5. Login action
    login_res = client.post("/login", json={"username": "frontdesk_marcus"})
    assert login_res.status_code == 200
    login_data = login_res.json()
    assert login_data["username"] == "frontdesk_marcus"
    assert login_data["role"] == "FRONT_DESK"
    assert login_data["hotel_id"] == hotel_id


def test_oct27_high_priority_room_and_meter_apis(client_and_db):
    client = client_and_db

    # Create hotel
    h_res = client.post(
        "/hotels",
        json={"name": "Boutique Hotel", "address": "50 Tech Sq", "city": "Atlanta", "country": "USA"},
    )
    hotel_id = h_res.json()["id"]

    # 1. Create Room
    res = client.post(
        "/rooms",
        json={"hotel_id": hotel_id, "room_number": 204, "status": "available"},
    )
    assert res.status_code == 201
    room_id = res.json()["id"]
    assert res.json()["room_number"] == 204

    # 2. Get room by ID
    res = client.get(f"/rooms/{room_id}")
    assert res.status_code == 200
    assert res.json()["status"] == "available"

    # 3. Update room (e.g. check-in guest -> OCCUPIED)
    res = client.put(f"/rooms/{room_id}", json={"status": "OCCUPIED"})
    assert res.status_code == 200
    assert res.json()["status"] == "OCCUPIED"

    # 4. List rooms with pagination and hotel filter
    res = client.get(f"/rooms?hotel_id={hotel_id}&page=1&page_size=20")
    assert res.status_code == 200
    assert len(res.json()) >= 1

    # 5. Electricity meter for room
    meter_res = client.post(
        "/meters",
        json={"room_id": room_id, "current_reading": 345.8, "status": "Active"},
    )
    assert meter_res.status_code == 200
    assert meter_res.json()["current_reading"] == 345.8

    get_meter_res = client.get(f"/rooms/{room_id}/meter")
    assert get_meter_res.status_code == 200
    assert get_meter_res.json()["current_reading"] == 345.8
