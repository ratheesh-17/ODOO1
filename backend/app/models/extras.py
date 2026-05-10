from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, DateTime, Boolean, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.db import Base
import enum


class PackingCategory(str, enum.Enum):
    clothing = "clothing"
    documents = "documents"
    electronics = "electronics"
    toiletries = "toiletries"
    medicines = "medicines"
    other = "other"


class TripBudget(Base):
    __tablename__ = "trip_budgets"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id", ondelete="CASCADE"), nullable=False, unique=True)
    transport_cost = Column(Float, default=0.0)
    accommodation_cost = Column(Float, default=0.0)
    activity_cost = Column(Float, default=0.0)
    meals_cost = Column(Float, default=0.0)
    misc_cost = Column(Float, default=0.0)
    # total_cost is computed: transport + accommodation + activity + meals + misc

    trip = relationship("Trip", back_populates="budget")


class PackingItem(Base):
    __tablename__ = "packing_items"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(200), nullable=False)
    category = Column(Enum(PackingCategory), default=PackingCategory.other)
    is_packed = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    trip = relationship("Trip", back_populates="packing_items")


class TripNote(Base):
    __tablename__ = "trip_notes"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id", ondelete="CASCADE"), nullable=False)
    stop_id = Column(Integer, ForeignKey("trip_stops.id", ondelete="SET NULL"), nullable=True)  # optional: note tied to a stop
    title = Column(String(200), nullable=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    trip = relationship("Trip", back_populates="notes")
    stop = relationship("TripStop", back_populates="trip_notes")


class SharedTrip(Base):
    __tablename__ = "shared_trips"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id", ondelete="CASCADE"), nullable=False, unique=True)
    share_token = Column(String(64), unique=True, nullable=False, index=True)  # UUID-based public token
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    trip = relationship("Trip", back_populates="shared")


class SavedDestination(Base):
    __tablename__ = "saved_destinations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    city_id = Column(Integer, ForeignKey("cities.id", ondelete="CASCADE"), nullable=False)
    saved_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="saved_destinations")
    city = relationship("City", back_populates="saved_by")
