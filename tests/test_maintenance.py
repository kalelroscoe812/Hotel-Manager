
from fastapi.testclient import TestClient
from hotel_manager.main import app

client = TestClient(app)


def test_maintenance_endpoints_registered():
    paths = app.openapi()["paths"]

    assert "/maintenance-tickets" in paths
    assert "/maintenance-tickets/{ticket_id}" in paths

    assert "post" in paths["/maintenance-tickets"]
    assert "get" in paths["/maintenance-tickets"]
    assert "get" in paths["/maintenance-tickets/{ticket_id}"]
    assert "patch" in paths["/maintenance-tickets/{ticket_id}"]


import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from hotel_manager.database import Base, get_db
from hotel_manager.main import app
from hotel_manager.models import Hotel, Room


@pytest.fixture
def maintenance_client():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    @event.listens_for(engine, "connect")
    def enable_foreign_keys(connection, record):
        connection.execute("PRAGMA foreign_keys=ON")

    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(bind=engine)

    def override_get_db():
        with TestingSession() as db:
            yield db

    app.dependency_overrides[get_db] = override_get_db

    try:
        client = TestClient(app)
        yield client, TestingSession
    finally:
        app.dependency_overrides.pop(get_db, None)
        engine.dispose()


def test_create_ticket_for_missing_room(maintenance_client):
    client, _ = maintenance_client

    response = client.post(
        "/maintenance-tickets",
        json={
            "room_id": 99999,
            "description": "Air conditioning is broken",
            "priority": "High",
        },
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Room not found"


def test_get_missing_ticket(maintenance_client):
    client, _ = maintenance_client

    response = client.get("/maintenance-tickets/99999")

    assert response.status_code == 404
    assert response.json()["detail"] == "Ticket not found"


def test_update_missing_ticket(maintenance_client):
    client, _ = maintenance_client

    response = client.patch(
        "/maintenance-tickets/99999",
        json={"status": "Resolved"},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Ticket not found"


def test_list_tickets_initially_empty(maintenance_client):
    client, _ = maintenance_client

    response = client.get("/maintenance-tickets")

    assert response.status_code == 200
    assert response.json() == []


def test_complete_maintenance_ticket_workflow(maintenance_client):
    client, TestingSession = maintenance_client

    # Step 1: Create a hotel and room in the test database
    with TestingSession() as db:
        hotel = Hotel(
            name="Morehouse Test Hotel",
            address="123 College Street",
            city="Atlanta",
            country="USA",
        )
        db.add(hotel)
        db.flush()

        room = Room(
            hotel_id=hotel.id,
            room_number=204,
        )
        db.add(room)
        db.commit()
        db.refresh(room)
        room_id = room.id

    # Step 2: Create a maintenance ticket
    response = client.post(
        "/maintenance-tickets",
        json={
            "room_id": room_id,
            "description": "Air conditioning is broken",
            "priority": "High",
        },
    )

    assert response.status_code == 201
    ticket = response.json()
    assert ticket["room_id"] == room_id
    assert ticket["description"] == "Air conditioning is broken"
    assert ticket["priority"] == "High"
    assert ticket["status"] == "Open"

    ticket_id = ticket["id"]

    # Step 3: Retrieve the ticket
    response = client.get(
        f"/maintenance-tickets/{ticket_id}"
    )

    assert response.status_code == 200
    assert response.json()["id"] == ticket_id

    # Step 4: Confirm the ticket appears in the list
    response = client.get("/maintenance-tickets")

    assert response.status_code == 200
    assert any(
        item["id"] == ticket_id
        for item in response.json()
    )

    # Step 5: Resolve the maintenance ticket
    response = client.patch(
        f"/maintenance-tickets/{ticket_id}",
        json={"status": "Resolved"},
    )

    assert response.status_code == 200
    assert response.json()["status"] == "Resolved"

    # Step 6: Confirm the updated status was saved
    response = client.get(
        f"/maintenance-tickets/{ticket_id}"
    )

    assert response.status_code == 200
    assert response.json()["status"] == "Resolved"


