from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session

from hotel_manager.database import get_db
from hotel_manager.schemas import RoomCreate, RoomRead, RoomUpdate
from hotel_manager import services


router = APIRouter(prefix="/rooms", tags=["rooms"])


@router.post("", response_model=RoomRead, status_code=201)
def create_room_endpoint(
    payload: RoomCreate,
    db: Session = Depends(get_db),
):
    if services.get_hotel(db, payload.hotel_id) is None:
        raise HTTPException(status_code=404, detail="Hotel not found")

    return services.create_room(db, payload)


@router.get("", response_model=list[RoomRead])
def list_rooms_endpoint(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=100),
    hotel_id: int | None = Query(default=None, ge=1),
    status: str | None = None,
    floor: int | None = None,
    room_type: str | None = Query(
        default=None,
        min_length=1,
        max_length=50,
    ),
    min_price: Decimal | None = Query(
        default=None,
        ge=0,
        max_digits=10,
        decimal_places=2,
        allow_inf_nan=False,
    ),
    max_price: Decimal | None = Query(
        default=None,
        ge=0,
        max_digits=10,
        decimal_places=2,
        allow_inf_nan=False,
    ),
    db: Session = Depends(get_db),
):
    if room_type is not None:
        room_type = room_type.strip().lower()

        if not room_type:
            raise HTTPException(
                status_code=422,
                detail="Room type cannot be blank",
            )

    if (
        min_price is not None
        and max_price is not None
        and min_price > max_price
    ):
        raise HTTPException(
            status_code=422,
            detail="Minimum price cannot exceed maximum price",
        )

    return services.list_rooms(
        db,
        page=page,
        page_size=page_size,
        hotel_id=hotel_id,
        status=status,
        floor=floor,
        room_type=room_type,
        min_price=min_price,
        max_price=max_price,
    )


@router.get("/{room_id}", response_model=RoomRead)
def get_room_endpoint(
    room_id: int,
    db: Session = Depends(get_db),
):
    room = services.get_room(db, room_id)
    if room is None:
        raise HTTPException(status_code=404, detail="Room not found")

    return room


@router.put("/{room_id}", response_model=RoomRead)
def update_room_endpoint(
    room_id: int,
    payload: RoomUpdate,
    db: Session = Depends(get_db),
):
    if services.get_room(db, room_id) is None:
        raise HTTPException(
            status_code=404,
            detail="Room not found",
        )
    return services.update_room(db, room_id, payload)


@router.delete("/{room_id}", status_code=204)
def delete_room_endpoint(
    room_id: int,
    db: Session = Depends(get_db),
):
    if services.get_room(db, room_id) is None:
        raise HTTPException(status_code=404, detail="Room not found")

    if services.get_meter_by_room(db, room_id) is not None:
        raise HTTPException(
            status_code=409,
            detail="Remove the associated electricity meter before deleting this room",
        )

    services.delete_room(db, room_id)
    return Response(status_code=204)