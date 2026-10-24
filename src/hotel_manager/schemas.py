from pydantic import BaseModel, ConfigDict, Field


# ---------------- Hotel Schemas ----------------
class HotelCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    address: str = Field(min_length=1, max_length=250)
    city: str | None = Field(default="", max_length=100)
    country: str | None = Field(default="", max_length=100)
    logo: str | None = Field(default=None, max_length=500)
    contact_number: str | None = Field(default=None, max_length=50)
    total_rooms: int = Field(default=0, ge=0)


class HotelUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=150)
    address: str | None = Field(default=None, min_length=1, max_length=250)
    city: str | None = Field(default=None, max_length=100)
    country: str | None = Field(default=None, max_length=100)
    logo: str | None = Field(default=None, max_length=500)
    contact_number: str | None = Field(default=None, max_length=50)
    total_rooms: int | None = Field(default=None, ge=0)


class HotelRead(HotelCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int


# ---------------- User Schemas ----------------
class UserCreate(BaseModel):
    username: str = Field(min_length=1, max_length=100)
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    other_info: str | None = Field(default=None, max_length=255)
    role: str = Field(default="FRONT_DESK")


class UserRead(UserCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int


class UserLoginRequest(BaseModel):
    username: str


class UserLoginResponse(BaseModel):
    user_id: int
    username: str
    role: str
    hotel_id: int | None = None


class UserBindRequest(BaseModel):
    user_id: int
    hotel_id: int


# ---------------- Room Schemas ----------------
class RoomCreate(BaseModel):
    hotel_id: int
    room_number: int
    status: str = Field(default="available")


class RoomUpdate(BaseModel):
    room_number: int | None = None
    status: str | None = None


class RoomRead(RoomCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int


# ---------------- Electricity Meter Schemas ----------------
class ElectricityMeterCreate(BaseModel):
    room_id: int
    current_reading: float = 0.0
    status: str = "Active"


class ElectricityMeterRead(ElectricityMeterCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int