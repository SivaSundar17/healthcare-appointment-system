from sqlalchemy import create_engine, Column, String, Integer, DateTime, Text, Time, Date, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from datetime import datetime

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://localhost/healthcare")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Appointment(Base):
    __tablename__ = "appointments"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, index=True)  # Integer ID referencing users.id
    doctor_id = Column(Integer, index=True)   # Integer ID referencing doctors.id
    appointment_date = Column(Date)
    start_time = Column(Time)
    end_time = Column(Time)
    status = Column(String, default="scheduled")  # scheduled, confirmed, completed, cancelled, no_show
    reason = Column(Text)
    notes = Column(Text)
    prescription = Column(Text)
    symptoms = Column(Text)
    diagnosis = Column(Text)
    amount = Column(Float)
    payment_status = Column(String, default="pending")  # pending, paid, refunded
    created_at = Column(DateTime, default=datetime.utcnow())
    updated_at = Column(DateTime, default=datetime.utcnow(), onupdate=datetime.utcnow())
    cancelled_by = Column(String)  # patient, doctor, system
    cancellation_reason = Column(Text)
    
    # No ORM relationships - using manual queries instead

class AppointmentHistory(Base):
    __tablename__ = "appointment_history"
    
    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(Integer, index=True)  # No ForeignKey - handled by SQL script
    status_from = Column(String)
    status_to = Column(String)
    changed_by = Column(String)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow())
    
    # No ORM relationships - using manual queries instead

# Tables are now created via init.sql - no need for create_all
# Base.metadata.create_all(bind=engine)
