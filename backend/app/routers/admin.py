from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.db import get_db
from app.models.user import User
from app.models.trip import Trip, TripStop, StopActivity
from app.models.city import City, Activity
from app.utils.deps import get_current_user

router = APIRouter(prefix="/admin", tags=["Admin"])


def _require_admin(current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


@router.get("/stats")
def get_stats(db: Session = Depends(get_db), _: User = Depends(_require_admin)):
    total_users   = db.query(func.count(User.id)).scalar()
    active_users  = db.query(func.count(User.id)).filter(User.is_active == True).scalar()
    total_trips   = db.query(func.count(Trip.id)).scalar()
    total_cities  = db.query(func.count(City.id)).scalar()
    total_activities = db.query(func.count(Activity.id)).scalar()
    total_stops   = db.query(func.count(TripStop.id)).scalar()

    trips_by_status = {}
    for status, count in db.query(Trip.status, func.count(Trip.id)).group_by(Trip.status).all():
        trips_by_status[status.value if hasattr(status, 'value') else status] = count

    return {
        "total_users": total_users,
        "active_users": active_users,
        "total_trips": total_trips,
        "total_cities": total_cities,
        "total_activities": total_activities,
        "total_stops": total_stops,
        "trips_by_status": trips_by_status,
    }


@router.get("/top-cities")
def top_cities(db: Session = Depends(get_db), _: User = Depends(_require_admin)):
    rows = (
        db.query(City.id, City.name, City.country, func.count(TripStop.id).label("stop_count"))
        .outerjoin(TripStop, TripStop.city_id == City.id)
        .group_by(City.id, City.name, City.country)
        .order_by(func.count(TripStop.id).desc())
        .limit(10)
        .all()
    )
    return [{"id": r.id, "name": r.name, "country": r.country, "stop_count": r.stop_count} for r in rows]


@router.get("/top-activities")
def top_activities(db: Session = Depends(get_db), _: User = Depends(_require_admin)):
    rows = (
        db.query(
            Activity.id, Activity.name, Activity.category,
            City.name.label("city"),
            func.count(StopActivity.id).label("usage_count")
        )
        .join(City, City.id == Activity.city_id)
        .outerjoin(StopActivity, StopActivity.activity_id == Activity.id)
        .group_by(Activity.id, Activity.name, Activity.category, City.name)
        .order_by(func.count(StopActivity.id).desc())
        .limit(10)
        .all()
    )
    return [{"id": r.id, "name": r.name, "category": r.category, "city": r.city, "usage_count": r.usage_count} for r in rows]


@router.get("/users")
def list_users(db: Session = Depends(get_db), _: User = Depends(_require_admin)):
    users = db.query(User).order_by(User.created_at.desc()).all()
    return [
        {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "is_active": u.is_active,
            "is_admin": u.is_admin,
            "trip_count": len(u.trips),
            "joined": u.created_at.strftime("%b %d, %Y") if u.created_at else "—",
        }
        for u in users
    ]


@router.patch("/users/{user_id}/toggle-active")
def toggle_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(_require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate yourself")
    user.is_active = not user.is_active
    db.commit()
    return {"id": user.id, "is_active": user.is_active}
