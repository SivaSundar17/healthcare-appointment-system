from sqlalchemy import create_engine, Column, String, Integer, DateTime, Date, Text, Boolean, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
import os
from datetime import datetime

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://localhost/healthcare")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Patient(Base):
    __tablename__ = "patients"
    
    id = Column(Integer, primary_key=True)  # Integer ID from users table
    email = Column(String, unique=True, index=True)
    first_name = Column(String)
    last_name = Column(String)
    phone = Column(String)
    date_of_birth = Column(String)
    gender = Column(String)
    address = Column(Text)
    blood_group = Column(String)
    allergies = Column(Text)
    emergency_contact = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships (for ORM only, no ForeignKey constraints - specify primaryjoin)
    appointments = relationship("Appointment", primaryjoin="Appointment.patient_id == Patient.id", foreign_keys="[Appointment.patient_id]", back_populates="patient")
    medical_records = relationship("MedicalRecord", primaryjoin="MedicalRecord.patient_id == Patient.id", foreign_keys="[MedicalRecord.patient_id]", back_populates="patient")

class MedicalRecord(Base):
    __tablename__ = "medical_records"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, index=True)  # Integer ID referencing patients.id
    doctor_id = Column(Integer, index=True)  # Integer ID referencing doctors.id
    record_date = Column(Date)  # Date of the medical record
    diagnosis = Column(Text)
    prescription = Column(Text)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships (for ORM only, no ForeignKey constraints - specify primaryjoin)
    patient = relationship("Patient", primaryjoin="MedicalRecord.patient_id == Patient.id", foreign_keys=[patient_id], back_populates="medical_records")

class Appointment(Base):
    __tablename__ = "appointments"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, index=True)  # Integer ID referencing patients.id
    doctor_id = Column(Integer, index=True)   # Integer ID referencing doctors.id
    appointment_date = Column(DateTime)
    status = Column(String, default="scheduled")  # scheduled, completed, cancelled, no_show
    reason = Column(Text)
    notes = Column(Text)
    prescription = Column(Text)
    symptoms = Column(Text)
    diagnosis = Column(Text)
    amount = Column(Float)
    payment_status = Column(String, default="pending")  # pending, paid, refunded
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    cancelled_by = Column(String)  # patient, doctor, system
    cancellation_reason = Column(Text)
    
    # Relationships (for ORM only, no ForeignKey constraints - specify primaryjoin)
    patient = relationship("Patient", primaryjoin="Appointment.patient_id == Patient.id", foreign_keys=[patient_id], back_populates="appointments")
    doctor = relationship("Doctor", primaryjoin="Appointment.doctor_id == Doctor.id", foreign_keys=[doctor_id], back_populates="appointments")

# Doctor model reference (stored in doctor service, referenced here for ORM)
class Doctor(Base):
    __tablename__ = "doctors"
    
    id = Column(Integer, primary_key=True)  # Integer ID from users table
    email = Column(String, unique=True)
    first_name = Column(String)
    last_name = Column(String)
    specialization = Column(String)
    phone = Column(String)
    
    appointments = relationship("Appointment", primaryjoin="Appointment.doctor_id == Doctor.id", foreign_keys=[Appointment.doctor_id], back_populates="doctor")

# Tables are now created via init.sql - no need for create_all
# Base.metadata.create_all(bind=engine)
