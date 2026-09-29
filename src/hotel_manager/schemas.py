from pydantic import BaseModel, ConfigDict, Field


class HotelCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    address: str = Field(min_length=1, max_length=250)
    city: str = Field(min_length=1, max_length=100)
    country: str = Field(min_length=1, max_length=100)


class HotelRead(HotelCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int