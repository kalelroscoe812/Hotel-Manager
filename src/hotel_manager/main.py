from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from hotel_manager.database import Base, engine, get_db
from hotel_manager import models  # noqa: F401
from hotel_manager.schemas import (
    HotelCreate,
    HotelRead,
    HotelUpdate,
    UserCreate,
    UserRead,
    UserLoginRequest,
    UserLoginResponse,
)
from hotel_manager import services

from hotel_manager.rooms import router as rooms_router
from hotel_manager.meters import router as meters_router

@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="Hotel Manager API", version="0.1.0", lifespan=lifespan)
app.include_router(rooms_router)
app.include_router(meters_router)


@app.get("/", tags=["system"])
def read_root():
    return {"service": "hotel-manager", "status": "ok"}


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
        return UserRead.model_validate(user).model_copy(update={"hotel_id": payload.hotel_id})
    return user


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
    user = services.get_user_by_username(db, payload.username)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return UserLoginResponse(
        user_id=user.id,
        username=user.username,
        role=user.role,
        hotel_id=services.get_user_hotel_id(db, user.id),
    )