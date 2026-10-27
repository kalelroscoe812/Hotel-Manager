from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, field_validator

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
class RoomInventoryFields(BaseModel):
    floor: int | None = None

    nightly_price: Decimal | None = Field(
        default=None,
        ge=0,
        max_digits=10,
        decimal_places=2,
        allow_inf_nan=False,
    )

    room_type: str | None = Field(
        default=None,
        min_length=1,
        max_length=50,
    )

    @field_validator("room_type", mode="before")
    @classmethod
    def normalize_room_type(cls, value):
        if isinstance(value, str):
            return value.strip().lower()

        return value


class RoomCreate(RoomInventoryFields):
    hotel_id: int
    room_number: int
    status: str = Field(default="available")


class RoomUpdate(RoomInventoryFields):
    room_number: int | None = None
    status: str | None = None

    @field_validator("room_number", "status")
    @classmethod
    def reject_null_required_fields(cls, value):
        if value is None:
            raise ValueError("This field cannot be null")

        return value


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