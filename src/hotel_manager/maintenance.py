
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from hotel_manager.database import get_db
from hotel_manager.models import MaintenanceTicket, Room
from hotel_manager.schemas import (
    MaintenanceTicketCreate,
    MaintenanceTicketRead,
    MaintenanceTicketUpdate,
)

router = APIRouter(
    prefix="/maintenance-tickets",
    tags=["maintenance"],
)


@router.post(
    "",
    response_model=MaintenanceTicketRead,
    status_code=status.HTTP_201_CREATED,
)
def create_ticket(
    payload: MaintenanceTicketCreate,
    db: Session = Depends(get_db),
):
    room = db.get(Room, payload.room_id)
    if room is None:
        raise HTTPException(404, "Room not found")

    ticket = MaintenanceTicket(**payload.model_dump())
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket


@router.get("", response_model=list[MaintenanceTicketRead])
def list_tickets(db: Session = Depends(get_db)):
    return db.query(MaintenanceTicket).all()


@router.get("/{ticket_id}", response_model=MaintenanceTicketRead)
def get_ticket(ticket_id: int, db: Session = Depends(get_db)):
    ticket = db.get(MaintenanceTicket, ticket_id)
    if ticket is None:
        raise HTTPException(404, "Ticket not found")
    return ticket


@router.patch("/{ticket_id}", response_model=MaintenanceTicketRead)
def update_ticket(
    ticket_id: int,
    payload: MaintenanceTicketUpdate,
    db: Session = Depends(get_db),
):
    ticket = db.get(MaintenanceTicket, ticket_id)
    if ticket is None:
        raise HTTPException(404, "Ticket not found")

    for field, value in payload.model_dump(
        exclude_unset=True
    ).items():
        setattr(ticket, field, value)

    db.commit()
    db.refresh(ticket)
    return ticket
