from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database.db import get_db
from app.models.city import City, Activity
from app.schemas.city import CityOut, ActivityOut, CityWithActivities
from app.utils.deps import get_current_user

router = APIRouter(tags=["Cities & Activities"])


# --- Cities ---

@router.get("/cities", response_model=List[CityOut])
def list_cities(
    search: Optional[str] = Query(None),
    country: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    featured: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(City)
    if search:
        q = q.filter(City.name.ilike(f"%{search}%"))
    if country:
        q = q.filter(City.country.ilike(f"%{country}%"))
    if region:
        q = q.filter(City.region.ilike(f"%{region}%"))
    if featured is not None:
        q = q.filter(City.is_featured == featured)
    return q.order_by(City.popularity_score.desc()).all()


@router.get("/cities/{city_id}", response_model=CityWithActivities)
def get_city(city_id: int, db: Session = Depends(get_db)):
    city = db.query(City).filter(City.id == city_id).first()
    if not city:
        raise HTTPException(status_code=404, detail="City not found")
    return city


# --- Activities ---

@router.get("/cities/{city_id}/activities", response_model=List[ActivityOut])
def list_activities(
    city_id: int,
    category: Optional[str] = Query(None),
    max_cost: Optional[float] = Query(None),
    max_duration: Optional[float] = Query(None),
    sort_by: Optional[str] = Query(None),  # cost_asc, cost_desc, duration_asc, name_asc
    db: Session = Depends(get_db),
):
    if not db.query(City).filter(City.id == city_id).first():
        raise HTTPException(status_code=404, detail="City not found")
    q = db.query(Activity).filter(Activity.city_id == city_id)
    if category:
        q = q.filter(Activity.category == category)
    if max_cost is not None:
        q = q.filter(Activity.estimated_cost <= max_cost)
    if max_duration is not None:
        q = q.filter(Activity.duration_hours <= max_duration)
    if sort_by == "cost_asc":      q = q.order_by(Activity.estimated_cost.asc())
    elif sort_by == "cost_desc":   q = q.order_by(Activity.estimated_cost.desc())
    elif sort_by == "duration_asc": q = q.order_by(Activity.duration_hours.asc())
    elif sort_by == "name_asc":    q = q.order_by(Activity.name.asc())
    return q.all()


@router.get("/activities/{activity_id}", response_model=ActivityOut)
def get_activity(activity_id: int, db: Session = Depends(get_db)):
    activity = db.query(Activity).filter(Activity.id == activity_id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    return activity
