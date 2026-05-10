from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, Date, DateTime, Boolean, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.db import Base
import enum


class TripStatus(str, enum.Enum):
    draft = "draft"
    planned = "planned"
    ongoing = "ongoing"
    completed = "completed"


class Trip(Base):
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    cover_photo = Column(String(500), nullable=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    status = Column(Enum(TripStatus), default=TripStatus.draft)
    total_budget = Column(Float, default=0.0)       # user-set budget limit
    is_public = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="trips")
    stops = relationship("TripStop", back_populates="trip", cascade="all, delete-orphan", order_by="TripStop.stop_order")
    budget = relationship("TripBudget", back_populates="trip", uselist=False, cascade="all, delete-orphan")
    packing_items = relationship("PackingItem", back_populates="trip", cascade="all, delete-orphan")
    notes = relationship("TripNote", back_populates="trip", cascade="all, delete-orphan")
    shared = relationship("SharedTrip", back_populates="trip", uselist=False, cascade="all, delete-orphan")


class TripStop(Base):
    __tablename__ = "trip_stops"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id", ondelete="CASCADE"), nullable=False)
    city_id = Column(Integer, ForeignKey("cities.id", ondelete="RESTRICT"), nullable=False)
    stop_order = Column(Integer, nullable=False)     # for reordering
    arrival_date = Column(Date, nullable=False)
    departure_date = Column(Date, nullable=False)
    accommodation_cost = Column(Float, default=0.0)
    transport_cost = Column(Float, default=0.0)
    notes = Column(Text, nullable=True)

    trip = relationship("Trip", back_populates="stops")
    city = relationship("City", back_populates="trip_stops")
    stop_activities = relationship("StopActivity", back_populates="stop", cascade="all, delete-orphan")
    trip_notes = relationship("TripNote", back_populates="stop")


class StopActivity(Base):
    __tablename__ = "stop_activities"

    id = Column(Integer, primary_key=True, index=True)
    stop_id = Column(Integer, ForeignKey("trip_stops.id", ondelete="CASCADE"), nullable=False)
    activity_id = Column(Integer, ForeignKey("activities.id", ondelete="CASCADE"), nullable=False)
    scheduled_date = Column(Date, nullable=True)
    custom_cost = Column(Float, nullable=True)       # override activity default cost if needed

    stop = relationship("TripStop", back_populates="stop_activities")
    activity = relationship("Activity", back_populates="stop_activities")
