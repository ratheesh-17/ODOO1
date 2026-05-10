from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.db import get_db
from app.models.user import User
from app.models.trip import Trip
from app.models.extras import TripBudget
from app.schemas.extras import BudgetUpdate, BudgetOut
from app.utils.deps import get_current_user

router = APIRouter(prefix="/trips/{trip_id}/budget", tags=["Budget"])


def _budget_out(budget: TripBudget, trip_limit: float) -> dict:
    total = budget.transport_cost + budget.accommodation_cost + budget.activity_cost + budget.meals_cost + budget.misc_cost
    return {
        "id": budget.id,
        "trip_id": budget.trip_id,
        "transport_cost": budget.transport_cost,
        "accommodation_cost": budget.accommodation_cost,
        "activity_cost": budget.activity_cost,
        "meals_cost": budget.meals_cost,
        "misc_cost": budget.misc_cost,
        "total_cost": total,
        "over_budget": total > trip_limit if trip_limit > 0 else False,
    }


@router.get("")
def get_budget(trip_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    trip = db.query(Trip).filter(Trip.id == trip_id, Trip.user_id == current_user.id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    if not trip.budget:
        # auto-create empty budget
        budget = TripBudget(trip_id=trip_id)
        db.add(budget)
        db.commit()
        db.refresh(budget)
        trip.budget = budget
    return _budget_out(trip.budget, trip.total_budget)


@router.put("")
def update_budget(trip_id: int, payload: BudgetUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    trip = db.query(Trip).filter(Trip.id == trip_id, Trip.user_id == current_user.id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    if not trip.budget:
        trip.budget = TripBudget(trip_id=trip_id)
        db.add(trip.budget)
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(trip.budget, field, value)
    db.commit()
    db.refresh(trip.budget)
    return _budget_out(trip.budget, trip.total_budget)
