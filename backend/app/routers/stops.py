from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database.db import get_db
from app.models.user import User
from app.models.trip import Trip, TripStop, StopActivity
from app.models.city import Activity
from app.schemas.trip import StopCreate, StopUpdate, StopOut, StopActivityCreate, StopActivityOut, ReorderStopsIn
from app.utils.deps import get_current_user

router = APIRouter(prefix="/trips/{trip_id}/stops", tags=["Stops"])


def _get_trip(trip_id: int, user_id: int, db: Session) -> Trip:
    trip = db.query(Trip).filter(Trip.id == trip_id, Trip.user_id == user_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip


def _stop_out(stop: TripStop) -> dict:
    data = {c.name: getattr(stop, c.name) for c in stop.__table__.columns}
    data["city_name"] = stop.city.name if stop.city else None
    data["city_country"] = stop.city.country if stop.city else None
    data["stop_activities"] = [
        {
            "id": sa.id,
            "activity_id": sa.activity_id,
            "scheduled_date": sa.scheduled_date,
            "custom_cost": sa.custom_cost,
            "activity_name": sa.activity.name if sa.activity else None,
            "activity_category": sa.activity.category if sa.activity else None,
            "activity_cost": sa.custom_cost if sa.custom_cost is not None else (sa.activity.estimated_cost if sa.activity else None),
        }
        for sa in stop.stop_activities
    ]
    return data


@router.get("", response_model=List[StopOut])
def list_stops(trip_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _get_trip(trip_id, current_user.id, db)
    stops = db.query(TripStop).filter(TripStop.trip_id == trip_id).order_by(TripStop.stop_order).all()
    return [_stop_out(s) for s in stops]


@router.post("", response_model=StopOut, status_code=status.HTTP_201_CREATED)
def add_stop(trip_id: int, payload: StopCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _get_trip(trip_id, current_user.id, db)
    stop = TripStop(trip_id=trip_id, **payload.model_dump())
    db.add(stop)
    db.commit()
    db.refresh(stop)
    return _stop_out(stop)


@router.put("/{stop_id}", response_model=StopOut)
def update_stop(trip_id: int, stop_id: int, payload: StopUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _get_trip(trip_id, current_user.id, db)
    stop = db.query(TripStop).filter(TripStop.id == stop_id, TripStop.trip_id == trip_id).first()
    if not stop:
        raise HTTPException(status_code=404, detail="Stop not found")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(stop, field, value)
    db.commit()
    db.refresh(stop)
    return _stop_out(stop)


@router.delete("/{stop_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_stop(trip_id: int, stop_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _get_trip(trip_id, current_user.id, db)
    stop = db.query(TripStop).filter(TripStop.id == stop_id, TripStop.trip_id == trip_id).first()
    if not stop:
        raise HTTPException(status_code=404, detail="Stop not found")
    db.delete(stop)
    db.commit()


@router.put("/reorder", response_model=List[StopOut])
def reorder_stops(trip_id: int, payload: ReorderStopsIn, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _get_trip(trip_id, current_user.id, db)
    for item in payload.stop_orders:
        stop = db.query(TripStop).filter(TripStop.id == item["stop_id"], TripStop.trip_id == trip_id).first()
        if stop:
            stop.stop_order = item["stop_order"]
    db.commit()
    stops = db.query(TripStop).filter(TripStop.trip_id == trip_id).order_by(TripStop.stop_order).all()
    return [_stop_out(s) for s in stops]


# --- Stop Activities ---

@router.post("/{stop_id}/activities", response_model=StopActivityOut, status_code=status.HTTP_201_CREATED)
def add_activity_to_stop(trip_id: int, stop_id: int, payload: StopActivityCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _get_trip(trip_id, current_user.id, db)
    stop = db.query(TripStop).filter(TripStop.id == stop_id, TripStop.trip_id == trip_id).first()
    if not stop:
        raise HTTPException(status_code=404, detail="Stop not found")
    if not db.query(Activity).filter(Activity.id == payload.activity_id).first():
        raise HTTPException(status_code=404, detail="Activity not found")
    sa = StopActivity(stop_id=stop_id, **payload.model_dump())
    db.add(sa)
    db.commit()
    db.refresh(sa)
    return {
        "id": sa.id,
        "activity_id": sa.activity_id,
        "scheduled_date": sa.scheduled_date,
        "custom_cost": sa.custom_cost,
        "activity_name": sa.activity.name,
        "activity_category": sa.activity.category,
        "activity_cost": sa.custom_cost if sa.custom_cost is not None else sa.activity.estimated_cost,
    }


@router.delete("/{stop_id}/activities/{sa_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_activity_from_stop(trip_id: int, stop_id: int, sa_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _get_trip(trip_id, current_user.id, db)
    sa = db.query(StopActivity).filter(StopActivity.id == sa_id, StopActivity.stop_id == stop_id).first()
    if not sa:
        raise HTTPException(status_code=404, detail="Stop activity not found")
    db.delete(sa)
    db.commit()
