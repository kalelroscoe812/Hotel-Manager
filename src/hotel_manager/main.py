from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, status
from sqlalchemy.orm import Session

from hotel_manager.database import Base, engine, get_db
from hotel_manager import models  # noqa: F401
from hotel_manager.schemas import HotelCreate, HotelRead
from hotel_manager.services import create_hotel, list_hotels


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="Hotel Manager API", version="0.1.0", lifespan=lifespan)


@app.get("/", tags=["system"])
def read_root():
    return {"service": "hotel-manager", "status": "ok"}


@app.post("/hotels", response_model=HotelRead, status_code=status.HTTP_201_CREATED, tags=["hotels"])
def create_hotel_endpoint(payload: HotelCreate, db: Session = Depends(get_db)):
    return create_hotel(db, payload)


@app.get("/hotels", response_model=list[HotelRead], tags=["hotels"])
def list_hotels_endpoint(db: Session = Depends(get_db)):
    return list_hotels(db)