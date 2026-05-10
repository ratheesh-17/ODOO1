from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database.db import get_db
from app.models.user import User
from app.models.trip import Trip, TripStop
from app.schemas.trip import TripCreate, TripUpdate, TripOut
from app.utils.deps import get_current_user

router = APIRouter(prefix="/trips", tags=["Trips"])


def _trip_out(trip: Trip) -> dict:
    data = {c.name: getattr(trip, c.name) for c in trip.__table__.columns}
    data["stop_count"] = len(trip.stops)
    return data


@router.get("", response_model=List[TripOut])
def list_trips(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    trips = db.query(Trip).filter(Trip.user_id == current_user.id).order_by(Trip.created_at.desc()).all()
    return [_trip_out(t) for t in trips]


@router.post("", response_model=TripOut, status_code=status.HTTP_201_CREATED)
def create_trip(payload: TripCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    trip = Trip(user_id=current_user.id, **payload.model_dump())
    db.add(trip)
    db.commit()
    db.refresh(trip)
    return _trip_out(trip)


@router.get("/{trip_id}", response_model=TripOut)
def get_trip(trip_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    trip = db.query(Trip).filter(Trip.id == trip_id, Trip.user_id == current_user.id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return _trip_out(trip)


@router.put("/{trip_id}", response_model=TripOut)
def update_trip(trip_id: int, payload: TripUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    trip = db.query(Trip).filter(Trip.id == trip_id, Trip.user_id == current_user.id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    new_start = payload.start_date or trip.start_date
    new_end = payload.end_date or trip.end_date
    if new_end < new_start:
        raise HTTPException(status_code=400, detail="end_date must be after start_date")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(trip, field, value)
    db.commit()
    db.refresh(trip)
    return _trip_out(trip)


@router.delete("/{trip_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_trip(trip_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    trip = db.query(Trip).filter(Trip.id == trip_id, Trip.user_id == current_user.id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    db.delete(trip)
    db.commit()
