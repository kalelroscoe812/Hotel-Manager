import os
os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from hotel_manager.database import Base, get_db
from hotel_manager.main import app
from hotel_manager.auth import hash_password, verify_password, create_access_token, verify_access_token
from hotel_manager import email_service

pytestmark = pytest.mark.integration


@pytest.fixture
def client_and_db(tmp_path):
    engine = create_engine(f"sqlite+pysqlite:///{tmp_path / 'test_auth.db'}")
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


def test_password_hashing_and_tokens():
    pw = "SuperSecret123!"
    hashed = hash_password(pw)
    assert hashed.startswith("pbkdf2:sha256:")
    assert verify_password(pw, hashed)
    assert not verify_password("WrongPassword", hashed)
    assert not verify_password("", None)

    token = create_access_token(user_id=42, username="alice", role="ADMIN", hotel_id=1)
    claims = verify_access_token(token)
    assert claims is not None
    assert claims["sub"] == 42
    assert claims["username"] == "alice"
    assert claims["role"] == "ADMIN"
    assert claims["hotel_id"] == 1


def test_user_and_admin_signup_and_resend_integration(client_and_db):
    client = client_and_db

    # Create a hotel
    h_res = client.post(
        "/hotels",
        json={"name": "Seaside Resort", "address": "10 Ocean Ave", "city": "Miami", "country": "USA"},
    )
    assert h_res.status_code == 201
    hotel_id = h_res.json()["id"]

    # 1. Sign up regular user (FRONT_DESK)
    signup_res = client.post(
        "/auth/signup",
        json={
            "username": "frontdesk_clara",
            "email": "clara@example.com",
            "password": "Password123!",
            "first_name": "Clara",
            "last_name": "Oswald",
            "role": "FRONT_DESK",
            "hotel_id": hotel_id,
        },
    )
    assert signup_res.status_code == 201
    data = signup_res.json()
    assert data["username"] == "frontdesk_clara"
    assert data["email"] == "clara@example.com"
    assert data["role"] == "FRONT_DESK"
    assert "access_token" in data
    token = data["access_token"]

    # Verify /auth/me with bearer token
    me_res = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["username"] == "frontdesk_clara"

    # 2. Sign up new ADMIN user
    admin_signup = client.post(
        "/auth/signup",
        json={
            "username": "global_admin_sarah",
            "email": "sarah.admin@example.com",
            "password": "AdminSecurePassword456!",
            "first_name": "Sarah",
            "last_name": "Connor",
            "role": "ADMIN",
        },
    )
    assert admin_signup.status_code == 201
    admin_data = admin_signup.json()
    assert admin_data["username"] == "global_admin_sarah"
    assert admin_data["role"] == "FRONT_DESK"
    admin_token = admin_data["access_token"]

    # Verify admin /auth/me
    admin_me = client.get("/auth/me", headers={"Authorization": f"Bearer {admin_token}"})
    assert admin_me.status_code == 200
    assert admin_me.json()["role"] == "FRONT_DESK"


def test_authenticated_login_flow(client_and_db):
    client = client_and_db

    # Sign up user
    client.post(
        "/auth/signup",
        json={
            "username": "bob_builder",
            "email": "bob@example.com",
            "password": "CanWeFixIt2026!",
            "first_name": "Bob",
            "last_name": "Builder",
            "role": "MAINTENANCE_ENGINEER",
        },
    )

    # 1. Login with correct username and password
    login_res = client.post(
        "/auth/login",
        json={"username_or_email": "bob_builder", "password": "CanWeFixIt2026!"},
    )
    assert login_res.status_code == 200
    assert login_res.json()["role"] == "FRONT_DESK"    
    assert "access_token" in login_res.json()

    # 2. Login with correct email and password
    email_login = client.post(
        "/auth/login",
        json={"username_or_email": "bob@example.com", "password": "CanWeFixIt2026!"},
    )
    assert email_login.status_code == 200
    assert email_login.json()["username"] == "bob_builder"

    # 3. Login with incorrect password -> 401 Unauthorized
    bad_login = client.post(
        "/auth/login",
        json={"username_or_email": "bob_builder", "password": "WrongPassword!"},
    )
    assert bad_login.status_code == 401
    assert "Invalid" in bad_login.json()["detail"]

    # 4. Login with non-existent user -> 401 Unauthorized
    not_found = client.post(
        "/auth/login",
        json={"username_or_email": "nonexistent_user", "password": "Password!"},
    )
    assert not_found.status_code == 401


def test_resend_email_endpoints(client_and_db):
    client = client_and_db

    # 1. Test sending test email via /email/send-test
    test_res = client.post(
        "/email/send-test",
        json={"email": "tester@example.com", "username": "Tester"},
    )
    assert test_res.status_code == 200
    res_data = test_res.json()
    assert res_data["to"] == "tester@example.com"
    assert res_data["status"] in ("sent", "simulated")

    # 2. Test connect user email
    user_res = client.post(
        "/users",
        json={
            "username": "hotel_staff_jan",
            "first_name": "Jan",
            "last_name": "Levinson",
            "role": "PROPERTY_MANAGER",
        },
    )
    assert user_res.status_code == 201
    user_id = user_res.json()["id"]

    connect_res = client.post(
        f"/users/{user_id}/connect-email",
        json={"email": "jan.levinson@example.com"},
    )
    assert connect_res.status_code == 200
    assert connect_res.json()["email"] == "jan.levinson@example.com"


def test_admin_create_user_with_password_and_edit_user(client_and_db):
    client = client_and_db

    # 1. Create hotel with state/province
    h_res = client.post(
        "/hotels",
        json={
            "name": "Mountain Lodge",
            "address": "12 Alpine Rd",
            "city": "Denver",
            "state": "CO",
            "country": "USA",
        },
    )
    assert h_res.status_code == 201
    assert h_res.json()["state"] == "CO"
    hotel_id = h_res.json()["id"]

    # 2. Admin creates user with a password
    user_res = client.post(
        "/users",
        json={
            "username": "frontdesk_toby",
            "first_name": "Toby",
            "last_name": "Flenderson",
            "email": "toby@example.com",
            "password": "TobyPassword123!",
            "role": "FRONT_DESK",
            "hotel_id": hotel_id,
        },
    )
    assert user_res.status_code == 201
    user_id = user_res.json()["id"]

    # 3. Test that Toby can log in with that password
    toby_login = client.post(
        "/auth/login",
        json={"username_or_email": "frontdesk_toby", "password": "TobyPassword123!"},
    )
    assert toby_login.status_code == 200
    assert toby_login.json()["user_id"] == user_id

    # 4. Admin edits user information via PUT /users/{id}
    update_res = client.put(
        f"/users/{user_id}",
        json={
            "first_name": "Tobias",
            "last_name": "Flenderson-Smith",
            "email": "tobias.smith@example.com",
            "password": "NewTobySecret456!",
        },
    )
    assert update_res.status_code == 200
    updated_data = update_res.json()
    assert updated_data["first_name"] == "Tobias"
    assert updated_data["last_name"] == "Flenderson-Smith"
    assert updated_data["email"] == "tobias.smith@example.com"

    # 5. Verify Toby can log in with the new password
    new_login = client.post(
        "/auth/login",
        json={"username_or_email": "tobias.smith@example.com", "password": "NewTobySecret456!"},
    )
    assert new_login.status_code == 200
    assert new_login.json()["username"] == "frontdesk_toby"
