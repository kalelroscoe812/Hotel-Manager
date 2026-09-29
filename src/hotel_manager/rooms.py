from fastapi import FastAPI
from pydantic import BaseModel
from .database import get_connection

app = FastAPI()

class RoomCreate(BaseModel):
    room_number: int
    status: str

@app.get("/rooms")
def read_rooms():
    connection = get_connection()
    cursor = connection.cursor(dictionary=True)
    
    cursor.execute("SELECT * FROM rooms")
    rooms = cursor.fetchall()
    
    cursor.close()
    connection.close()
    
    return rooms

@app.post("/rooms")
def create_room(room: RoomCreate):
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        "INSERT INTO rooms (room_number, status) VALUES (%s, %s)",
        (room.room_number, room.status)
    )

    connection.commit()

    cursor.close()
    connection.close()

    return {
        "message": "Room created successfully",
        "room_number": room.room_number,
        "status": room.status
    }

@app.get("/items/{item_id}")
def read_item(item_id: int, q: str | None = None):
    return {"item_id": item_id, "q": q}