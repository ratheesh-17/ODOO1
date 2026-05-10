from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database.db import get_db
from app.models.user import User
from app.models.trip import Trip
from app.models.extras import PackingItem
from app.schemas.extras import PackingItemCreate, PackingItemUpdate, PackingItemOut
from app.utils.deps import get_current_user

router = APIRouter(prefix="/trips/{trip_id}/packing", tags=["Packing"])


def _get_trip(trip_id: int, user_id: int, db: Session) -> Trip:
    trip = db.query(Trip).filter(Trip.id == trip_id, Trip.user_id == user_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip


@router.get("", response_model=List[PackingItemOut])
def list_items(trip_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _get_trip(trip_id, current_user.id, db)
    return db.query(PackingItem).filter(PackingItem.trip_id == trip_id).all()


@router.post("", response_model=PackingItemOut, status_code=status.HTTP_201_CREATED)
def add_item(trip_id: int, payload: PackingItemCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _get_trip(trip_id, current_user.id, db)
    item = PackingItem(trip_id=trip_id, **payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/{item_id}", response_model=PackingItemOut)
def update_item(trip_id: int, item_id: int, payload: PackingItemUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _get_trip(trip_id, current_user.id, db)
    item = db.query(PackingItem).filter(PackingItem.id == item_id, PackingItem.trip_id == trip_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(trip_id: int, item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _get_trip(trip_id, current_user.id, db)
    item = db.query(PackingItem).filter(PackingItem.id == item_id, PackingItem.trip_id == trip_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item)
    db.commit()


@router.post("/reset", status_code=status.HTTP_200_OK)
def reset_checklist(trip_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _get_trip(trip_id, current_user.id, db)
    db.query(PackingItem).filter(PackingItem.trip_id == trip_id).update({"is_packed": False})
    db.commit()
    return {"message": "Checklist reset"}
