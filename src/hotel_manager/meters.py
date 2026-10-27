from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from hotel_manager import services
from hotel_manager.database import get_db
from hotel_manager.schemas import (
    ElectricityMeterCreate,
    ElectricityMeterRead,
)


router = APIRouter(tags=["meters"])


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