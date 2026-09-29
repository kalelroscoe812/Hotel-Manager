import os

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from hotel_manager.database import Base, get_db
from hotel_manager.main import app


def test_hotel_api_creates_and_lists_hotel(tmp_path):
    engine = create_engine(f"sqlite+pysqlite:///{tmp_path / 'hotel_manager.db'}")
    testing_session_local = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    Base.metadata.create_all(engine)

    def override_get_db():
        db = testing_session_local()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as client:
        response = client.post(
            "/hotels",
            json={
                "name": "Harbor House",
                "address": "1 Marina Way",
                "city": "Boston",
                "country": "USA",
            },
        )
        assert response.status_code == 201
        assert response.json()["name"] == "Harbor House"

        response = client.get("/hotels")
        assert response.status_code == 200
        assert response.json()[0]["city"] == "Boston"

    app.dependency_overrides.clear()
    engine.dispose()