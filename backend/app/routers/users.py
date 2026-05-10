from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database.db import get_db
from app.models.user import User
from app.models.extras import SavedDestination
from app.models.city import City
from app.schemas.user import UserOut, UserUpdate
from app.schemas.city import CityOut
from app.utils.deps import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserOut)
def get_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserOut)
def update_profile(payload: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db.delete(current_user)
    db.commit()


# --- Saved Destinations ---

@router.get("/me/saved-destinations", response_model=List[CityOut])
def get_saved(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    saved = db.query(SavedDestination).filter(SavedDestination.user_id == current_user.id).all()
    return [s.city for s in saved]


@router.post("/me/saved-destinations/{city_id}", status_code=status.HTTP_201_CREATED)
def save_destination(city_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not db.query(City).filter(City.id == city_id).first():
        raise HTTPException(status_code=404, detail="City not found")
    existing = db.query(SavedDestination).filter_by(user_id=current_user.id, city_id=city_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="City already saved")
    db.add(SavedDestination(user_id=current_user.id, city_id=city_id))
    db.commit()
    return {"message": "City saved"}


@router.delete("/me/saved-destinations/{city_id}", status_code=status.HTTP_204_NO_CONTENT)
def unsave_destination(city_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    saved = db.query(SavedDestination).filter_by(user_id=current_user.id, city_id=city_id).first()
    if not saved:
        raise HTTPException(status_code=404, detail="Saved destination not found")
    db.delete(saved)
    db.commit()
