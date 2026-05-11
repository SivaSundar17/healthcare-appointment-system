from dotenv import load_dotenv
load_dotenv()  # Load .env before any other imports

from fastapi import FastAPI, Depends, HTTPException, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
from sqlalchemy.orm import Session
from datetime import datetime, date
import requests
import os

from models import SessionLocal, Patient, MedicalRecord, Doctor, Appointment

app = FastAPI(title="User Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Pydantic models
class PatientCreate(BaseModel):
    id: int  # users.id (integer from PostgreSQL)
    email: str
    first_name: str
    last_name: str
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    blood_group: Optional[str] = None
    allergies: Optional[str] = None
    emergency_contact: Optional[str] = None

class PatientUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    blood_group: Optional[str] = None
    allergies: Optional[str] = None
    emergency_contact: Optional[str] = None

class PatientResponse(BaseModel):
    id: Optional[int] = None
    email: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    blood_group: Optional[str] = None
    allergies: Optional[str] = None
    emergency_contact: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
        populate_by_name = True
        extra = 'ignore'

class MedicalRecordCreate(BaseModel):
    doctor_id: int
    record_date: Optional[str] = None  # Format: YYYY-MM-DD
    diagnosis: Optional[str] = None
    prescription: Optional[str] = None
    notes: Optional[str] = None

class MedicalRecordResponse(BaseModel):
    id: Optional[int] = None
    patient_id: Optional[int] = None
    doctor_id: Optional[int] = None
    record_date: Optional[date] = None
    diagnosis: Optional[str] = None
    prescription: Optional[str] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
        populate_by_name = True
        extra = 'ignore'

# Verify token with auth service
AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://localhost:8001")

def verify_token(authorization: Optional[str] = Header(None)):
    if not authorization:
        return None

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "user"}

# Create patient profile
@app.post("/patients", response_model=PatientResponse)
async def create_patient(patient: PatientCreate, db: Session = Depends(get_db)):
    """Create a new patient profile"""
    # Check if patient already exists
    existing = db.query(Patient).filter(Patient.id == patient.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Patient profile already exists")
    
    # Create new patient
    new_patient = Patient(
        id=patient.id,
        email=patient.email,
        first_name=patient.first_name,
        last_name=patient.last_name,
        phone=patient.phone,
        date_of_birth=patient.date_of_birth,
        gender=patient.gender,
        address=patient.address,
        blood_group=patient.blood_group,
        allergies=patient.allergies,
        emergency_contact=patient.emergency_contact
    )
    
    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)
    
    # Convert to dict handling NULL values
    return {
        "id": new_patient.id,
        "email": new_patient.email,
        "first_name": new_patient.first_name,
        "last_name": new_patient.last_name,
        "phone": new_patient.phone,
        "date_of_birth": new_patient.date_of_birth,
        "gender": new_patient.gender,
        "address": new_patient.address,
        "blood_group": new_patient.blood_group,
        "allergies": new_patient.allergies,
        "emergency_contact": new_patient.emergency_contact,
        "created_at": new_patient.created_at,
        "updated_at": new_patient.updated_at
    }

# Get patient by ID
@app.get("/patients/{patient_id}", response_model=PatientResponse)
async def get_patient(patient_id: int, db: Session = Depends(get_db)):
    """Get patient profile by ID"""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Convert to dict handling NULL values
    return {
        "id": patient.id,
        "email": patient.email,
        "first_name": patient.first_name,
        "last_name": patient.last_name,
        "phone": patient.phone,
        "date_of_birth": patient.date_of_birth,
        "gender": patient.gender,
        "address": patient.address,
        "blood_group": patient.blood_group,
        "allergies": patient.allergies,
        "emergency_contact": patient.emergency_contact,
        "created_at": patient.created_at,
        "updated_at": patient.updated_at
    }

# Update patient profile
@app.put("/patients/{patient_id}", response_model=PatientResponse)
async def update_patient(patient_id: int, patient_update: PatientUpdate, db: Session = Depends(get_db)):
    """Update patient profile"""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Update fields if provided
    for field, value in patient_update.dict(exclude_unset=True).items():
        setattr(patient, field, value)
    
    patient.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(patient)
    
    # Convert to dict handling NULL values
    return {
        "id": patient.id,
        "email": patient.email,
        "first_name": patient.first_name,
        "last_name": patient.last_name,
        "phone": patient.phone,
        "date_of_birth": patient.date_of_birth,
        "gender": patient.gender,
        "address": patient.address,
        "blood_group": patient.blood_group,
        "allergies": patient.allergies,
        "emergency_contact": patient.emergency_contact,
        "created_at": patient.created_at,
        "updated_at": patient.updated_at
    }

# Get all patients (optional - for admin use)
@app.get("/patients", response_model=List[PatientResponse])
async def get_patients(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all patients with pagination"""
    patients = db.query(Patient).offset(skip).limit(limit).all()
    
    # Convert to dicts handling NULL values
    result = []
    for patient in patients:
        result.append({
            "id": patient.id,
            "email": patient.email,
            "first_name": patient.first_name,
            "last_name": patient.last_name,
            "phone": patient.phone,
            "date_of_birth": patient.date_of_birth,
            "gender": patient.gender,
            "address": patient.address,
            "blood_group": patient.blood_group,
            "allergies": patient.allergies,
            "emergency_contact": patient.emergency_contact,
            "created_at": patient.created_at,
            "updated_at": patient.updated_at
        })
    return result

# ============ MEDICAL RECORDS ENDPOINTS ============

# Get medical records for a patient
@app.get("/patients/{patient_id}/medical-records", response_model=List[MedicalRecordResponse])
async def get_medical_records(patient_id: int, db: Session = Depends(get_db)):
    """Get all medical records for a patient"""
    # Verify patient exists
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    records = db.query(MedicalRecord).filter(MedicalRecord.patient_id == patient_id).order_by(MedicalRecord.record_date.desc()).all()
    
    # Convert to dicts handling NULL values
    result = []
    for record in records:
        result.append({
            "id": record.id,
            "patient_id": record.patient_id,
            "doctor_id": record.doctor_id,
            "record_date": record.record_date,
            "diagnosis": record.diagnosis,
            "prescription": record.prescription,
            "notes": record.notes,
            "created_at": record.created_at
        })
    return result

# Create medical record
@app.post("/patients/{patient_id}/medical-records", response_model=MedicalRecordResponse)
async def create_medical_record(patient_id: int, record: MedicalRecordCreate, db: Session = Depends(get_db)):
    """Create a new medical record for a patient"""
    # Verify patient exists
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Create new medical record
    new_record = MedicalRecord(
        patient_id=patient_id,
        doctor_id=record.doctor_id,
        record_date=record.record_date or datetime.now().date(),
        diagnosis=record.diagnosis,
        prescription=record.prescription,
        notes=record.notes
    )
    
    db.add(new_record)
    db.commit()
    db.refresh(new_record)
    
    return {
        "id": new_record.id,
        "patient_id": new_record.patient_id,
        "doctor_id": new_record.doctor_id,
        "record_date": new_record.record_date,
        "diagnosis": new_record.diagnosis,
        "prescription": new_record.prescription,
        "notes": new_record.notes,
        "created_at": new_record.created_at
    }

# Get single medical record
@app.get("/medical-records/{record_id}", response_model=MedicalRecordResponse)
async def get_medical_record(record_id: int, db: Session = Depends(get_db)):
    """Get a specific medical record by ID"""
    record = db.query(MedicalRecord).filter(MedicalRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Medical record not found")
    
    return {
        "id": record.id,
        "patient_id": record.patient_id,
        "doctor_id": record.doctor_id,
        "record_date": record.record_date,
        "diagnosis": record.diagnosis,
        "prescription": record.prescription,
        "notes": record.notes,
        "created_at": record.created_at
    }
