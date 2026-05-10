from pydantic import BaseModel
from typing import Optional, List


class CityOut(BaseModel):
    id: int
    name: str
    country: str
    region: Optional[str]
    description: Optional[str]
    image_url: Optional[str]
    avg_daily_cost: float
    popularity_score: int
    is_featured: bool

    model_config = {"from_attributes": True}


class ActivityOut(BaseModel):
    id: int
    city_id: int
    name: str
    category: str
    description: Optional[str]
    image_url: Optional[str]
    estimated_cost: float
    duration_hours: float

    model_config = {"from_attributes": True}


class CityWithActivities(CityOut):
    activities: List[ActivityOut] = []
