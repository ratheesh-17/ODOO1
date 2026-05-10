from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, Boolean, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from app.database.db import Base


class City(Base):
    __tablename__ = "cities"
    __table_args__ = (
        UniqueConstraint("name", "country", name="uq_city_name_country"),
    )

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    country = Column(String(100), nullable=False)
    region = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    image_url = Column(String(500), nullable=True)
    avg_daily_cost = Column(Float, default=0.0)   # avg cost per day in USD
    popularity_score = Column(Integer, default=0)  # 0-100
    is_featured = Column(Boolean, default=False)

    activities = relationship("Activity", back_populates="city", cascade="all, delete-orphan")
    trip_stops = relationship("TripStop", back_populates="city")
    saved_by = relationship("SavedDestination", back_populates="city")


class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    city_id = Column(Integer, ForeignKey("cities.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(200), nullable=False)
    category = Column(String(50), nullable=False)   # sightseeing, food, adventure, culture, shopping
    description = Column(Text, nullable=True)
    image_url = Column(String(500), nullable=True)
    estimated_cost = Column(Float, default=0.0)
    duration_hours = Column(Float, default=1.0)

    city = relationship("City", back_populates="activities")
    stop_activities = relationship("StopActivity", back_populates="activity")


# Composite index for fast activity search by category within a city
Index("ix_activities_city_category", Activity.city_id, Activity.category)
