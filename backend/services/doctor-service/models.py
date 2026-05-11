from sqlalchemy import create_engine, Column, String, Integer, DateTime, Text, Boolean, Float, Date, Time
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
import os
from datetime import datetime

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://localhost/healthcare")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Doctor(Base):
    __tablename__ = "doctors"
    
    # Updated to INTEGER to match database schema (Full PostgreSQL with integer IDs)
    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, index=True)
    first_name = Column(String)
    last_name = Column(String)
    specialization = Column(String, index=True)
    phone = Column(String)
    
    # Added for appointment booking
    consultation_fee = Column(Float, default=0.0)
    is_active = Column(Boolean, default=True)
    rating = Column(Float, default=0.0)
    review_count = Column(Integer, default=0)
    
    # Relationships (for ORM only, no ForeignKey constraints - specify primaryjoin)
    availability = relationship("Availability", primaryjoin="Availability.doctor_id == Doctor.id", foreign_keys="[Availability.doctor_id]", back_populates="doctor", cascade="all, delete-orphan")
    reviews = relationship("DoctorReview", primaryjoin="DoctorReview.doctor_id == Doctor.id", foreign_keys="[DoctorReview.doctor_id]", back_populates="doctor")

class Availability(Base):
    __tablename__ = "availability"
    
    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(Integer, index=True)  # Integer ID referencing doctors.id
    day_of_week = Column(Integer)  # 0=Monday, 6=Sunday (Python weekday convention)
    start_time = Column(Time)
    end_time = Column(Time)
    is_available = Column(Boolean, default=True)
    valid_from = Column(Date)
    valid_to = Column(Date)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships (for ORM only, no ForeignKey constraints - specify primaryjoin)
    doctor = relationship("Doctor", primaryjoin="Availability.doctor_id == Doctor.id", foreign_keys=[doctor_id], back_populates="availability")

class DoctorReview(Base):
    __tablename__ = "doctor_reviews"
    
    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(Integer, index=True)  # Integer ID referencing doctors.id
    patient_id = Column(Integer, index=True)  # Integer ID referencing patients.id
    rating = Column(Integer)
    review = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships (for ORM only, no ForeignKey constraints - specify primaryjoin)
    doctor = relationship("Doctor", primaryjoin="DoctorReview.doctor_id == Doctor.id", foreign_keys=[doctor_id], back_populates="reviews")

# Tables are now created via init.sql - no need for create_all
# Base.metadata.create_all(bind=engine)
