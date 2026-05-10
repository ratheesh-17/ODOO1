from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.extras import PackingCategory


class BudgetUpdate(BaseModel):
    transport_cost: Optional[float] = None
    accommodation_cost: Optional[float] = None
    activity_cost: Optional[float] = None
    meals_cost: Optional[float] = None
    misc_cost: Optional[float] = None


class BudgetOut(BaseModel):
    id: int
    trip_id: int
    transport_cost: float
    accommodation_cost: float
    activity_cost: float
    meals_cost: float
    misc_cost: float
    total_cost: float  # computed field

    model_config = {"from_attributes": True}


# --- Packing ---

class PackingItemCreate(BaseModel):
    name: str
    category: Optional[PackingCategory] = PackingCategory.other


class PackingItemUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[PackingCategory] = None
    is_packed: Optional[bool] = None


class PackingItemOut(BaseModel):
    id: int
    trip_id: int
    name: str
    category: PackingCategory
    is_packed: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Notes ---

class NoteCreate(BaseModel):
    title: Optional[str] = None
    content: str
    stop_id: Optional[int] = None


class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    stop_id: Optional[int] = None


class NoteOut(BaseModel):
    id: int
    trip_id: int
    stop_id: Optional[int]
    title: Optional[str]
    content: str
    created_at: datetime
    updated_at: Optional[datetime]

    model_config = {"from_attributes": True}


# --- Share ---

class SharedTripOut(BaseModel):
    share_token: str
    share_url: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
