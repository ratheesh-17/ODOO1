from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import date, datetime
from app.models.trip import TripStatus


class TripCreate(BaseModel):
    name: str
    description: Optional[str] = None
    cover_photo: Optional[str] = None
    start_date: date
    end_date: date
    total_budget: Optional[float] = 0.0

    @field_validator("end_date")
    @classmethod
    def end_after_start(cls, v, info):
        if "start_date" in info.data and v < info.data["start_date"]:
            raise ValueError("end_date must be after start_date")
        return v


class TripUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    cover_photo: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    total_budget: Optional[float] = None
    status: Optional[TripStatus] = None
    is_public: Optional[bool] = None


class TripOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    cover_photo: Optional[str]
    start_date: date
    end_date: date
    status: TripStatus
    total_budget: float
    is_public: bool
    created_at: datetime
    stop_count: Optional[int] = 0

    model_config = {"from_attributes": True}


# --- TripStop ---

class StopCreate(BaseModel):
    city_id: int
    stop_order: int
    arrival_date: date
    departure_date: date
    accommodation_cost: Optional[float] = 0.0
    transport_cost: Optional[float] = 0.0
    notes: Optional[str] = None

    @field_validator("departure_date")
    @classmethod
    def depart_after_arrive(cls, v, info):
        if "arrival_date" in info.data and v < info.data["arrival_date"]:
            raise ValueError("departure_date must be after arrival_date")
        return v


class StopUpdate(BaseModel):
    stop_order: Optional[int] = None
    arrival_date: Optional[date] = None
    departure_date: Optional[date] = None
    accommodation_cost: Optional[float] = None
    transport_cost: Optional[float] = None
    notes: Optional[str] = None


class StopActivityOut(BaseModel):
    id: int
    activity_id: int
    scheduled_date: Optional[date]
    custom_cost: Optional[float]
    activity_name: Optional[str] = None
    activity_category: Optional[str] = None
    activity_cost: Optional[float] = None

    model_config = {"from_attributes": True}


class StopOut(BaseModel):
    id: int
    trip_id: int
    city_id: int
    city_name: Optional[str] = None
    city_country: Optional[str] = None
    stop_order: int
    arrival_date: date
    departure_date: date
    accommodation_cost: float
    transport_cost: float
    notes: Optional[str]
    stop_activities: List[StopActivityOut] = []

    model_config = {"from_attributes": True}


# --- StopActivity ---

class StopActivityCreate(BaseModel):
    activity_id: int
    scheduled_date: Optional[date] = None
    custom_cost: Optional[float] = None


class ReorderStopsIn(BaseModel):
    stop_orders: List[dict]  # [{"stop_id": 1, "stop_order": 1}, ...]
