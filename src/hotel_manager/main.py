from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, Header, HTTPException, Query, Response, status
from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

from decimal import Decimal
import os

from hotel_manager.database import Base, engine, get_db, SessionLocal
from hotel_manager import models  # noqa: F401
from hotel_manager import auth
from hotel_manager import email_service
from hotel_manager.schemas import (
    AuthLoginRequest,
    AuthResponse,
    ConnectEmailRequest,
    ElectricityMeterCreate,
    HotelCreate,
    HotelRead,
    HotelUpdate,
    RoomCreate,
    SendEmailTestRequest,
    UserCreate,
    UserLoginRequest,
    UserLoginResponse,
    UserRead,
    UserSignupRequest,
    UserUpdate,
)
from hotel_manager import services

from hotel_manager.rooms import router as rooms_router
from hotel_manager.meters import router as meters_router


def ensure_schema_compatibility():
    with engine.connect() as conn:
        inspector = inspect(conn)
        if "users" in inspector.get_table_names():
            columns = {col["name"] for col in inspector.get_columns("users")}
            if "email" not in columns:
                conn.execute(text("ALTER TABLE users ADD COLUMN email VARCHAR(255)"))
            if "password_hash" not in columns:
                conn.execute(text("ALTER TABLE users ADD COLUMN password_hash VARCHAR(255)"))
            conn.commit()
        if "hotels" in inspector.get_table_names():
            hotel_columns = {col["name"] for col in inspector.get_columns("hotels")}
            if "state" not in hotel_columns:
                conn.execute(text("ALTER TABLE hotels ADD COLUMN state VARCHAR(100) DEFAULT ''"))
            conn.commit()


def seed_demo_data_if_empty():
    with SessionLocal() as db:
        admin = services.get_user_by_username(db, "admin")
        if not admin:
            services.create_user(
                db,
                UserCreate(
                    username="admin",
                    first_name="System",
                    last_name="Administrator",
                    email="admin@hotelmanager.com",
                    password="admin123",
                    role="ADMIN",
                ),
            )
        hotels = services.list_hotels(db, page=1, page_size=1)
        if not hotels:
            hotel = services.create_hotel(
                db,
                HotelCreate(
                    name="The Grand Azure Resort",
                    address="77 Ocean Promenade",
                    city="Miami",
                    state="FL",
                    country="USA",
                    contact_number="305-555-0144",
                    total_rooms=4,
                ),
            )
            r101 = services.create_room(
                db,
                RoomCreate(
                    hotel_id=hotel.id,
                    room_number=101,
                    status="available",
                    floor=1,
                    nightly_price=Decimal("185.00"),
                    room_type="Standard",
                ),
            )
            services.create_or_update_meter(
                db,
                ElectricityMeterCreate(
                    room_id=r101.id,
                    current_reading=142.5,
                    status="Active",
                ),
            )
            r102 = services.create_room(
                db,
                RoomCreate(
                    hotel_id=hotel.id,
                    room_number=102,
                    status="OCCUPIED",
                    floor=1,
                    nightly_price=Decimal("220.00"),
                    room_type="Deluxe",
                ),
            )
            services.create_or_update_meter(
                db,
                ElectricityMeterCreate(
                    room_id=r102.id,
                    current_reading=310.2,
                    status="Active",
                ),
            )
            r201 = services.create_room(
                db,
                RoomCreate(
                    hotel_id=hotel.id,
                    room_number=201,
                    status="Maintenance",
                    floor=2,
                    nightly_price=Decimal("350.00"),
                    room_type="Suite",
                ),
            )
            services.create_or_update_meter(
                db,
                ElectricityMeterCreate(
                    room_id=r201.id,
                    current_reading=52.0,
                    status="Active",
                ),
            )
            staff = services.create_user(
                db,
                UserCreate(
                    username="frontdesk_jane",
                    first_name="Jane",
                    last_name="Doe",
                    email="jane@hotelmanager.com",
                    password="password123",
                    role="FRONT_DESK",
                ),
            )
            services.bind_user_to_hotel(db, staff.id, hotel.id)


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    try:
        ensure_schema_compatibility()
    except Exception:
        pass
    if not os.getenv("PYTEST_CURRENT_TEST"):
        try:
            seed_demo_data_if_empty()
        except Exception:
            pass
    yield


app = FastAPI(title="Hotel Manager API", version="0.1.0", lifespan=lifespan)
app.include_router(rooms_router)
app.include_router(meters_router)


@app.get("/", tags=["system"])
def read_root():
    return {
        "service": "hotel-manager",
        "status": "ok",
        "resend_configured": email_service.is_resend_configured(),
    }


# ==================== AUTHENTICATION & EMAIL ENDPOINTS ====================
@app.post(
    "/auth/signup",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["auth"],
)
def signup_endpoint(payload: UserSignupRequest, db: Session = Depends(get_db)):
    if services.get_user_by_username(db, payload.username) is not None:
        raise HTTPException(status_code=409, detail="Username already exists")
    if payload.email and services.get_user_by_email(db, payload.email) is not None:
        raise HTTPException(status_code=409, detail="Email is already registered")
    if payload.hotel_id is not None and services.get_hotel(db, payload.hotel_id) is None:
        raise HTTPException(status_code=404, detail="Hotel not found")

    user = services.create_user(
        db,
        UserCreate(
            username=payload.username,
            first_name=payload.first_name,
            last_name=payload.last_name,
            email=payload.email,
            password=payload.password,
            role="FRONT_DESK",            other_info=payload.other_info,
            hotel_id=payload.hotel_id,
        ),
    )

    hotel_name = None
    if payload.hotel_id is not None:
        services.bind_user_to_hotel(db, user.id, payload.hotel_id)
        hotel = services.get_hotel(db, payload.hotel_id)
        if hotel:
            hotel_name = hotel.name

    if payload.email:
        email_service.send_welcome_email(
            to_email=payload.email,
            username=user.username,
            role=user.role,
            hotel_name=hotel_name,
        )

    token = auth.create_access_token(
        user_id=user.id,
        username=user.username,
        role=user.role,
        hotel_id=payload.hotel_id,
    )

    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        username=user.username,
        email=user.email,
        role=user.role,
        hotel_id=payload.hotel_id,
        first_name=user.first_name,
        last_name=user.last_name,
    )


@app.post("/auth/login", response_model=AuthResponse, tags=["auth"])
def auth_login_endpoint(payload: AuthLoginRequest, db: Session = Depends(get_db)):
    user, error = services.authenticate_user(db, payload.username_or_email, payload.password)
    if user is None:
        raise HTTPException(status_code=401, detail=error or "Invalid username/email or password")

    hotel_id = services.get_user_hotel_id(db, user.id)
    token = auth.create_access_token(
        user_id=user.id,
        username=user.username,
        role=user.role,
        hotel_id=hotel_id,
    )
    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        username=user.username,
        email=user.email,
        role=user.role,
        hotel_id=hotel_id,
        first_name=user.first_name,
        last_name=user.last_name,
    )


@app.get("/auth/me", response_model=AuthResponse, tags=["auth"])
def auth_me_endpoint(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication token required")
    token = authorization.split(" ", 1)[1].strip()
    claims = auth.verify_access_token(token)
    if not claims:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user = services.get_user(db, claims["sub"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    hotel_id = services.get_user_hotel_id(db, user.id)
    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        username=user.username,
        email=user.email,
        role=user.role,
        hotel_id=hotel_id,
        first_name=user.first_name,
        last_name=user.last_name,
    )


@app.post("/users/{user_id}/connect-email", response_model=UserRead, tags=["users"])
def connect_email_endpoint(
    user_id: int,
    payload: ConnectEmailRequest,
    db: Session = Depends(get_db),
):
    user = services.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user = services.connect_user_email(db, user_id, payload.email)
    hotel_id = services.get_user_hotel_id(db, user.id)
    hotel = services.get_hotel(db, hotel_id) if hotel_id else None

    # Connect user's email via Resend welcome notification
    email_service.send_welcome_email(
        to_email=payload.email,
        username=user.username,
        role=user.role,
        hotel_name=hotel.name if hotel else None,
    )

    return UserRead.model_validate(user).model_copy(update={"hotel_id": hotel_id})


@app.post("/email/send-test", tags=["system"])
def send_test_email_endpoint(payload: SendEmailTestRequest):
    return email_service.send_test_email(to_email=payload.email, username=payload.username)


# ==================== HOTEL ENDPOINTS ====================
@app.post("/hotels", response_model=HotelRead, status_code=status.HTTP_201_CREATED, tags=["hotels"])
def create_hotel_endpoint(payload: HotelCreate, db: Session = Depends(get_db)):
    return services.create_hotel(db, payload)


@app.get("/hotels", response_model=list[HotelRead], tags=["hotels"])
def list_hotels_endpoint(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return services.list_hotels(db, page=page, page_size=page_size)


@app.get("/hotels/{hotel_id}", response_model=HotelRead, tags=["hotels"])
def get_hotel_endpoint(hotel_id: int, db: Session = Depends(get_db)):
    hotel = services.get_hotel(db, hotel_id)
    if hotel is None:
        raise HTTPException(status_code=404, detail="Hotel not found")
    return hotel


@app.put("/hotels/{hotel_id}", response_model=HotelRead, tags=["hotels"])
def update_hotel_endpoint(
    hotel_id: int,
    payload: HotelUpdate,
    db: Session = Depends(get_db),
):
    hotel = services.update_hotel(db, hotel_id, payload)
    if hotel is None:
        raise HTTPException(status_code=404, detail="Hotel not found")
    return hotel


@app.delete("/hotels/{hotel_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["hotels"])
def delete_hotel_endpoint(hotel_id: int, db: Session = Depends(get_db)):
    if not services.delete_hotel(db, hotel_id):
        raise HTTPException(status_code=404, detail="Hotel not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ==================== USER ENDPOINTS ====================
@app.post(
    "/users",
    response_model=UserRead,
    status_code=status.HTTP_201_CREATED,
    tags=["users"],
)
def create_user_endpoint(payload: UserCreate, db: Session = Depends(get_db)):
    if services.get_user_by_username(db, payload.username) is not None:
        raise HTTPException(status_code=409, detail="Username already exists")
    if payload.hotel_id is not None and services.get_hotel(db, payload.hotel_id) is None:
        raise HTTPException(status_code=404, detail="Hotel not found")

    user = services.create_user(db, payload)
    if payload.hotel_id is not None:
        services.bind_user_to_hotel(db, user.id, payload.hotel_id)

    # If email provided, send welcome email via Resend
    if payload.email:
        hotel = services.get_hotel(db, payload.hotel_id) if payload.hotel_id else None
        email_service.send_welcome_email(
            to_email=payload.email,
            username=user.username,
            role=user.role,
            hotel_name=hotel.name if hotel else None,
        )

    return UserRead.model_validate(user).model_copy(update={"hotel_id": payload.hotel_id})


@app.get("/users", response_model=list[UserRead], tags=["users"])
def list_users_endpoint(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    role: str | None = None,
    db: Session = Depends(get_db),
):
    users = services.list_users(db, page=page, page_size=page_size, role=role)
    return [
        UserRead.model_validate(user).model_copy(
            update={"hotel_id": services.get_user_hotel_id(db, user.id)}
        )
        for user in users
    ]


@app.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["users"])
def delete_user_endpoint(user_id: int, db: Session = Depends(get_db)):
    if not services.delete_user(db, user_id):
        raise HTTPException(status_code=404, detail="User not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.put(
    "/users/{user_id}",
    response_model=UserRead,
    tags=["users"],
)
def update_user_endpoint(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
):
    if payload.username:
        existing = services.get_user_by_username(db, payload.username)
        if existing and existing.id != user_id:
            raise HTTPException(status_code=409, detail="Username already exists")
    if payload.email:
        existing_email = services.get_user_by_email(db, payload.email)
        if existing_email and existing_email.id != user_id:
            raise HTTPException(status_code=409, detail="Email is already registered")

    user = services.update_user(db, user_id, payload)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    hotel_id = services.get_user_hotel_id(db, user.id)
    return UserRead.model_validate(user).model_copy(update={"hotel_id": hotel_id})


@app.post(
    "/hotels/{hotel_id}/users/{user_id}/bind",
    tags=["users"],
)
def bind_user_endpoint(
    hotel_id: int,
    user_id: int,
    db: Session = Depends(get_db),
):
    if services.get_hotel(db, hotel_id) is None:
        raise HTTPException(status_code=404, detail="Hotel not found")
    if services.get_user(db, user_id) is None:
        raise HTTPException(status_code=404, detail="User not found")
    services.bind_user_to_hotel(db, user_id, hotel_id)
    return {"status": "bound", "hotel_id": hotel_id, "user_id": user_id}


@app.get(
    "/hotels/{hotel_id}/users/{user_id}",
    response_model=UserRead,
    tags=["users"],
)
def get_hotel_user_endpoint(
    hotel_id: int,
    user_id: int,
    db: Session = Depends(get_db),
):
    user = services.get_user_by_hotel_and_user_id(db, hotel_id, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="Hotel user not found")
    return UserRead.model_validate(user).model_copy(update={"hotel_id": hotel_id})


@app.post("/login", response_model=UserLoginResponse, tags=["system"])
def login_endpoint(payload: UserLoginRequest, db: Session = Depends(get_db)):
    user, error = services.authenticate_user(db, payload.username, payload.password)
    if user is None:
        # Check if user exists but bad password vs not found
        existing = services.get_user_by_username(db, payload.username)
        if existing is None:
            raise HTTPException(status_code=404, detail="User not found")
        raise HTTPException(status_code=401, detail=error or "Invalid password")

    hotel_id = services.get_user_hotel_id(db, user.id)
    token = auth.create_access_token(
        user_id=user.id,
        username=user.username,
        role=user.role,
        hotel_id=hotel_id,
    )
    return UserLoginResponse(
        user_id=user.id,
        username=user.username,
        role=user.role,
        email=user.email,
        hotel_id=hotel_id,
        token=token,
    )
