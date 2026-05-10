from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.db import get_db
from app.models.user import User
from app.models.city import City, Activity
from app.models.trip import Trip, TripStop, StopActivity
from app.utils.deps import get_current_user

router = APIRouter(prefix="/admin", tags=["Admin"])


def require_admin(current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return current_user


@router.get("/stats")
def get_stats(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    total_users = db.query(func.count(User.id)).scalar()
    active_users = db.query(func.count(User.id)).filter(User.is_active == True).scalar()
    total_trips = db.query(func.count(Trip.id)).scalar()
    total_cities = db.query(func.count(City.id)).scalar()
    total_activities = db.query(func.count(Activity.id)).scalar()
    total_stops = db.query(func.count(TripStop.id)).scalar()

    trips_by_status = (
        db.query(Trip.status, func.count(Trip.id))
        .group_by(Trip.status)
        .all()
    )

    return {
        "total_users": total_users,
        "active_users": active_users,
        "total_trips": total_trips,
        "total_cities": total_cities,
        "total_activities": total_activities,
        "total_stops": total_stops,
        "trips_by_status": {str(s): c for s, c in trips_by_status},
    }


@router.get("/top-cities")
def get_top_cities(db: Session = Depends(get_db), _: User = Depends(require_admin)):
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
def get_top_activities(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    rows = (
        db.query(
            Activity.id,
            Activity.name,
            Activity.category,
            City.name.label("city_name"),
            func.count(StopActivity.id).label("usage_count"),
        )
        .join(City, Activity.city_id == City.id)
        .outerjoin(StopActivity, StopActivity.activity_id == Activity.id)
        .group_by(Activity.id, Activity.name, Activity.category, City.name)
        .order_by(func.count(StopActivity.id).desc())
        .limit(10)
        .all()
    )
    return [
        {"id": r.id, "name": r.name, "category": r.category, "city": r.city_name, "usage_count": r.usage_count}
        for r in rows
    ]


@router.get("/users")
def get_users(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    rows = (
        db.query(User.id, User.name, User.email, User.is_active, User.is_admin, User.created_at,
                 func.count(Trip.id).label("trip_count"))
        .outerjoin(Trip, Trip.user_id == User.id)
        .group_by(User.id, User.name, User.email, User.is_active, User.is_admin, User.created_at)
        .order_by(User.created_at.desc())
        .all()
    )
    return [
        {
            "id": r.id,
            "name": r.name,
            "email": r.email,
            "is_active": r.is_active,
            "is_admin": r.is_admin,
            "trip_count": r.trip_count,
            "joined": r.created_at.strftime("%b %d, %Y") if r.created_at else "—",
        }
        for r in rows
    ]


@router.patch("/users/{user_id}/toggle-active", status_code=200)
def toggle_user_active(user_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate yourself")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = not user.is_active
    db.commit()
    return {"id": user.id, "is_active": user.is_active}
