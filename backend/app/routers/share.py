import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.db import get_db
from app.models.user import User
from app.models.trip import Trip, TripStop, StopActivity
from app.models.extras import SharedTrip, TripBudget
from app.schemas.extras import SharedTripOut
from app.utils.deps import get_current_user

router = APIRouter(tags=["Share"])


@router.post("/trips/{trip_id}/share", response_model=SharedTripOut)
def generate_share_link(trip_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    trip = db.query(Trip).filter(Trip.id == trip_id, Trip.user_id == current_user.id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    if trip.shared:
        shared = trip.shared
    else:
        shared = SharedTrip(trip_id=trip_id, share_token=uuid.uuid4().hex)
        db.add(shared)
        trip.is_public = True
        db.commit()
        db.refresh(shared)
    return {
        "share_token": shared.share_token,
        "share_url": f"/shared/{shared.share_token}",
        "is_active": shared.is_active,
        "created_at": shared.created_at,
    }


@router.get("/shared/{token}")
def view_shared_trip(token: str, db: Session = Depends(get_db)):
    shared = db.query(SharedTrip).filter(SharedTrip.share_token == token, SharedTrip.is_active == True).first()
    if not shared:
        raise HTTPException(status_code=404, detail="Shared trip not found or inactive")
    trip = shared.trip
    total_days = (trip.end_date - trip.start_date).days + 1
    return {
        "id": trip.id,
        "name": trip.name,
        "description": trip.description,
        "cover_photo": trip.cover_photo,
        "start_date": trip.start_date,
        "end_date": trip.end_date,
        "status": trip.status,
        "total_budget": trip.total_budget,
        "total_days": total_days,
        "stops": [
            {
                "city": stop.city.name,
                "country": stop.city.country,
                "arrival_date": stop.arrival_date,
                "departure_date": stop.departure_date,
                "accommodation_cost": stop.accommodation_cost,
                "transport_cost": stop.transport_cost,
                "notes": stop.notes,
                "activities": [
                    {
                        "name": sa.activity.name,
                        "category": sa.activity.category,
                        "duration_hours": sa.activity.duration_hours,
                        "cost": sa.custom_cost if sa.custom_cost is not None else sa.activity.estimated_cost,
                    }
                    for sa in stop.stop_activities
                ],
            }
            for stop in sorted(trip.stops, key=lambda s: s.stop_order)
        ],
    }


@router.patch("/trips/{trip_id}/share/toggle")
def toggle_share_link(trip_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    trip = db.query(Trip).filter(Trip.id == trip_id, Trip.user_id == current_user.id).first()
    if not trip or not trip.shared:
        raise HTTPException(status_code=404, detail="Share link not found")
    trip.shared.is_active = not trip.shared.is_active
    trip.is_public = trip.shared.is_active
    db.commit()
    return {"is_active": trip.shared.is_active}


@router.post("/shared/{token}/copy", status_code=status.HTTP_201_CREATED)
def copy_shared_trip(token: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    shared = db.query(SharedTrip).filter(SharedTrip.share_token == token, SharedTrip.is_active == True).first()
    if not shared:
        raise HTTPException(status_code=404, detail="Shared trip not found or inactive")
    original = shared.trip

    new_trip = Trip(
        user_id=current_user.id,
        name=f"Copy of {original.name}",
        description=original.description,
        cover_photo=original.cover_photo,
        start_date=original.start_date,
        end_date=original.end_date,
        total_budget=original.total_budget,
    )
    db.add(new_trip)
    db.flush()

    for stop in original.stops:
        new_stop = TripStop(
            trip_id=new_trip.id,
            city_id=stop.city_id,
            stop_order=stop.stop_order,
            arrival_date=stop.arrival_date,
            departure_date=stop.departure_date,
            accommodation_cost=stop.accommodation_cost,
            transport_cost=stop.transport_cost,
            notes=stop.notes,
        )
        db.add(new_stop)
        db.flush()
        for sa in stop.stop_activities:
            db.add(StopActivity(stop_id=new_stop.id, activity_id=sa.activity_id, scheduled_date=sa.scheduled_date, custom_cost=sa.custom_cost))

    db.commit()
    db.refresh(new_trip)
    return {"message": "Trip copied successfully", "trip_id": new_trip.id}
