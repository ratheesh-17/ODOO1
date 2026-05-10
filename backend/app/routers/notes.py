from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database.db import get_db
from app.models.user import User
from app.models.trip import Trip
from app.models.extras import TripNote
from app.schemas.extras import NoteCreate, NoteUpdate, NoteOut
from app.utils.deps import get_current_user

router = APIRouter(prefix="/trips/{trip_id}/notes", tags=["Notes"])


def _get_trip(trip_id: int, user_id: int, db: Session) -> Trip:
    trip = db.query(Trip).filter(Trip.id == trip_id, Trip.user_id == user_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip


@router.get("", response_model=List[NoteOut])
def list_notes(trip_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _get_trip(trip_id, current_user.id, db)
    return db.query(TripNote).filter(TripNote.trip_id == trip_id).order_by(TripNote.created_at.desc()).all()


@router.post("", response_model=NoteOut, status_code=status.HTTP_201_CREATED)
def create_note(trip_id: int, payload: NoteCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _get_trip(trip_id, current_user.id, db)
    # Fix 5: verify stop_id belongs to this trip
    if payload.stop_id:
        from app.models.trip import TripStop
        if not db.query(TripStop).filter(TripStop.id == payload.stop_id, TripStop.trip_id == trip_id).first():
            raise HTTPException(status_code=400, detail="stop_id does not belong to this trip")
    note = TripNote(trip_id=trip_id, **payload.model_dump())
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


@router.put("/{note_id}", response_model=NoteOut)
def update_note(trip_id: int, note_id: int, payload: NoteUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _get_trip(trip_id, current_user.id, db)
    note = db.query(TripNote).filter(TripNote.id == note_id, TripNote.trip_id == trip_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    # Fix 5: verify stop_id belongs to this trip on update too
    if payload.stop_id:
        from app.models.trip import TripStop
        if not db.query(TripStop).filter(TripStop.id == payload.stop_id, TripStop.trip_id == trip_id).first():
            raise HTTPException(status_code=400, detail="stop_id does not belong to this trip")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(note, field, value)
    db.commit()
    db.refresh(note)
    return note


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(trip_id: int, note_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _get_trip(trip_id, current_user.id, db)
    note = db.query(TripNote).filter(TripNote.id == note_id, TripNote.trip_id == trip_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    db.delete(note)
    db.commit()
