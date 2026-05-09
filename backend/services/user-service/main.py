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
    record_type: str
    title: str
    description: Optional[str] = None
    file_url: Optional[str] = None
    doctor_id: str

class MedicalRecordResponse(BaseModel):
    id: Optional[int] = None
    patient_id: Optional[str] = None
    record_type: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    file_url: Optional[str] = None
    doctor_id: Optional[str] = None
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
    
    return new_patient

# Get patient by ID
@app.get("/patients/{patient_id}", response_model=PatientResponse)
async def get_patient(patient_id: int, db: Session = Depends(get_db)):
    """Get patient profile by ID"""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

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
    
    return patient

# Get all patients (optional - for admin use)
@app.get("/patients", response_model=List[PatientResponse])
async def get_patients(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all patients with pagination"""
    patients = db.query(Patient).offset(skip).limit(limit).all()
    return patients
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    token = authorization.split(" ")[1]
    try:
        response = requests.get(
            f"{AUTH_SERVICE_URL}/verify-token",
            headers={"Authorization": f"Bearer {token}"}
        )
        if response.status_code == 200:
            return response.json()
    except:
        pass
    return None
