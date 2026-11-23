from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from hotel_manager import services
from hotel_manager.database import get_db
from hotel_manager.schemas import (
    ElectricityMeterCreate,
    ElectricityMeterRead,
)
from hotel_manager.models import ElectricityMeter


router = APIRouter(tags=["meters"])


@router.get("/meters", response_model=list[ElectricityMeterRead])
def list_meters_endpoint(db: Session = Depends(get_db)):
    return services.list_meters(db)


@router.post("/meters", response_model=ElectricityMeterRead)
def create_or_update_meter_endpoint(
    payload: ElectricityMeterCreate,
    db: Session = Depends(get_db),
):
    if services.get_room(db, payload.room_id) is None:
        raise HTTPException(
            status_code=404,
            detail="Room not found",
        )

    return services.create_or_update_meter(db, payload)


@router.get(
    "/rooms/{room_id}/meter",
    response_model=ElectricityMeterRead,
)
def get_room_meter_endpoint(
    room_id: int,
    db: Session = Depends(get_db),
):
    if services.get_room(db, room_id) is None:
        raise HTTPException(
            status_code=404,
            detail="Room not found",
        )

    meter = services.get_meter_by_room(db, room_id)

    if meter is None:
        raise HTTPException(
            status_code=404,
            detail="Electricity meter not found",
        )

    return meter


@router.delete("/meters/{meter_id}", status_code=204)
def delete_meter_endpoint(meter_id: int, db: Session = Depends(get_db)):
    if not services.delete_meter(db, meter_id):
        raise HTTPException(status_code=404, detail="Electricity meter not found")
    return Response(status_code=204)