from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date
from app.database.db import get_db
from app.models.user import User
from app.models.trip import Trip, TripStop, StopActivity
from app.models.city import City, Activity
from app.utils.deps import get_current_user
from datetime import datetime, timedelta, timezone

router = APIRouter(prefix="/admin", tags=["Admin"])


def _require_admin(current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


@router.get("/stats")
def get_stats(db: Session = Depends(get_db), _: User = Depends(_require_admin)):
    total_users      = db.query(func.count(User.id)).scalar()
    active_users     = db.query(func.count(User.id)).filter(User.is_active.is_(True)).scalar()
    total_trips      = db.query(func.count(Trip.id)).scalar()
    total_cities     = db.query(func.count(City.id)).scalar()
    total_activities = db.query(func.count(Activity.id)).scalar()
    total_stops      = db.query(func.count(TripStop.id)).scalar()

    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    new_users_30d = db.query(func.count(User.id)).filter(User.created_at >= thirty_days_ago).scalar()

    trips_by_status = {}
    for status, count in db.query(Trip.status, func.count(Trip.id)).group_by(Trip.status).all():
        trips_by_status[status.value if hasattr(status, "value") else status] = count

    return {
        "total_users": total_users,
        "active_users": active_users,
        "total_trips": total_trips,
        "total_cities": total_cities,
        "total_activities": total_activities,
        "total_stops": total_stops,
        "new_users_30d": new_users_30d,
        "trips_by_status": trips_by_status,
    }


@router.get("/trips-over-time")
def trips_over_time(db: Session = Depends(get_db), _: User = Depends(_require_admin)):
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    rows = (
        db.query(
            cast(Trip.created_at, Date).label("date"),
            func.count(Trip.id).label("count"),
        )
        .filter(Trip.created_at >= thirty_days_ago)
        .group_by(cast(Trip.created_at, Date))
        .order_by(cast(Trip.created_at, Date))
        .all()
    )
    return [{"date": str(r.date), "count": r.count} for r in rows]


@router.get("/top-cities")
def top_cities(limit: int = Query(10, ge=1, le=100), db: Session = Depends(get_db), _: User = Depends(_require_admin)):
    rows = (
        db.query(City.id, City.name, City.country, func.count(TripStop.id).label("stop_count"))
        .outerjoin(TripStop, TripStop.city_id == City.id)
        .group_by(City.id, City.name, City.country)
        .order_by(func.count(TripStop.id).desc())
        .limit(limit)
        .all()
    )
    return [{"id": r.id, "name": r.name, "country": r.country, "stop_count": r.stop_count} for r in rows]


@router.get("/top-activities")
def top_activities(limit: int = Query(10, ge=1, le=100), db: Session = Depends(get_db), _: User = Depends(_require_admin)):
    rows = (
        db.query(
            Activity.id, Activity.name, Activity.category,
            City.name.label("city"),
            func.count(StopActivity.id).label("usage_count"),
        )
        .join(City, City.id == Activity.city_id)
        .outerjoin(StopActivity, StopActivity.activity_id == Activity.id)
        .group_by(Activity.id, Activity.name, Activity.category, City.name)
        .order_by(func.count(StopActivity.id).desc())
        .limit(limit)
        .all()
    )
    return [{"id": r.id, "name": r.name, "category": r.category, "city": r.city, "usage_count": r.usage_count} for r in rows]


@router.get("/users")
def list_users(db: Session = Depends(get_db), _: User = Depends(_require_admin)):
    rows = (
        db.query(User, func.count(Trip.id).label("trip_count"))
        .outerjoin(Trip, Trip.user_id == User.id)
        .group_by(User.id)
        .order_by(User.created_at.desc())
        .all()
    )
    return [
        {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "is_active": u.is_active,
            "is_admin": u.is_admin,
            "trip_count": trip_count,
            "joined": u.created_at.isoformat() if u.created_at else None,
        }
        for u, trip_count in rows
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
