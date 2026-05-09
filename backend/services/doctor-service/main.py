from fastapi import FastAPI, Depends, HTTPException, Query, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.orm import Session
from datetime import datetime, date, time, timedelta
import requests
import os

from models import SessionLocal, Doctor, Availability, DoctorReview

app = FastAPI(title="Doctor Service", version="1.0.0")

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
class DoctorCreate(BaseModel):
    id: int  # users.id (integer from PostgreSQL)
    email: str
    first_name: str
    last_name: str
    specialization: str
    phone: Optional[str] = None
    consultation_fee: Optional[float] = 0.0

class DoctorUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    specialization: Optional[str] = None
    phone: Optional[str] = None
    consultation_fee: Optional[float] = None
    is_active: Optional[bool] = None

class DoctorResponse(BaseModel):
    id: Optional[int] = None
    email: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    specialization: Optional[str] = None
    phone: Optional[str] = None
    consultation_fee: Optional[float] = 0.0
    is_active: Optional[bool] = True
    rating: Optional[float] = 0.0
    review_count: Optional[int] = 0
    
    class Config:
        from_attributes = True
        populate_by_name = True
        extra = 'ignore'

class AvailabilityCreate(BaseModel):
    day_of_week: Optional[int] = None
    date: Optional[str] = None  # Format: YYYY-MM-DD
    start_time: str  # Format: HH:MM
    end_time: str  # Format: HH:MM
    slot_duration: int = 30
    is_available: bool = True

class TimeSlot(BaseModel):
    start_time: time
    end_time: time
    is_available: bool

class AvailabilityResponse(BaseModel):
    id: int
    doctor_id: int
    day_of_week: Optional[int] = None
    date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    is_available: Optional[bool] = True
    slot_duration: Optional[int] = 30
    
    class Config:
        from_attributes = True
        extra = 'ignore'

class DoctorReviewCreate(BaseModel):
    patient_id: int
    rating: int
    review: Optional[str] = None

class DoctorReviewResponse(BaseModel):
    id: Optional[int] = None
    doctor_id: Optional[int] = None
    patient_id: Optional[int] = None
    rating: Optional[int] = None
    review: Optional[str] = None
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
        extra = 'ignore'

# Verify token with auth service
AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://localhost:8001")

def verify_token(authorization: Optional[str] = Header(None)):
    if not authorization:
        return None
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

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "doctor"}

# Create doctor profile
@app.post("/doctors", response_model=DoctorResponse)
async def create_doctor(doctor: DoctorCreate, db: Session = Depends(get_db)):
    """Create a new doctor profile"""
    # Check if doctor already exists
    existing = db.query(Doctor).filter(Doctor.id == doctor.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Doctor profile already exists")
    
    # Create new doctor
    new_doctor = Doctor(
        id=doctor.id,
        email=doctor.email,
        first_name=doctor.first_name,
        last_name=doctor.last_name,
        specialization=doctor.specialization,
        phone=doctor.phone,
        consultation_fee=doctor.consultation_fee
    )
    
    db.add(new_doctor)
    db.commit()
    db.refresh(new_doctor)
    
    # Convert to dict handling NULL values
    return {
        "id": new_doctor.id,
        "email": new_doctor.email,
        "first_name": new_doctor.first_name,
        "last_name": new_doctor.last_name,
        "specialization": new_doctor.specialization,
        "phone": new_doctor.phone,
        "consultation_fee": new_doctor.consultation_fee or 0.0,
        "is_active": new_doctor.is_active if new_doctor.is_active is not None else True,
        "rating": new_doctor.rating or 0.0,
        "review_count": new_doctor.review_count or 0
    }

# Get doctor by ID
@app.get("/doctors/{doctor_id}", response_model=DoctorResponse)
async def get_doctor(doctor_id: int, db: Session = Depends(get_db)):
    """Get doctor profile by ID"""
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    # Convert to dict handling NULL values
    return {
        "id": doctor.id,
        "email": doctor.email,
        "first_name": doctor.first_name,
        "last_name": doctor.last_name,
        "specialization": doctor.specialization,
        "phone": doctor.phone,
        "consultation_fee": doctor.consultation_fee or 0.0,
        "is_active": doctor.is_active if doctor.is_active is not None else True,
        "rating": doctor.rating or 0.0,
        "review_count": doctor.review_count or 0
    }

# Update doctor profile
@app.put("/doctors/{doctor_id}", response_model=DoctorResponse)
async def update_doctor(doctor_id: int, doctor_update: DoctorUpdate, db: Session = Depends(get_db)):
    """Update doctor profile"""
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    # Update fields if provided
    for field, value in doctor_update.dict(exclude_unset=True).items():
        setattr(doctor, field, value)
    
    db.commit()
    db.refresh(doctor)
    
    # Convert to dict handling NULL values
    return {
        "id": doctor.id,
        "email": doctor.email,
        "first_name": doctor.first_name,
        "last_name": doctor.last_name,
        "specialization": doctor.specialization,
        "phone": doctor.phone,
        "consultation_fee": doctor.consultation_fee or 0.0,
        "is_active": doctor.is_active if doctor.is_active is not None else True,
        "rating": doctor.rating or 0.0,
        "review_count": doctor.review_count or 0
    }

# Get all doctors
@app.get("/doctors", response_model=List[DoctorResponse])
async def get_doctors(
    skip: int = 0, 
    limit: int = 100, 
    specialization: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Get all doctors with optional specialization filter"""
    query = db.query(Doctor)
    if specialization:
        query = query.filter(Doctor.specialization == specialization)
    doctors = query.offset(skip).limit(limit).all()
    
    # Convert SQLAlchemy objects to dicts, handling NULL values
    result = []
    for doctor in doctors:
        result.append({
            "id": doctor.id,
            "email": doctor.email,
            "first_name": doctor.first_name,
            "last_name": doctor.last_name,
            "specialization": doctor.specialization,
            "phone": doctor.phone,
            "consultation_fee": doctor.consultation_fee or 0.0,
            "is_active": doctor.is_active if doctor.is_active is not None else True,
            "rating": doctor.rating or 0.0,
            "review_count": doctor.review_count or 0
        })
    return result

# ============= AVAILABILITY ENDPOINTS =============

# Add availability slot for a doctor
@app.post("/doctors/{doctor_id}/availability", response_model=AvailabilityResponse)
async def add_availability(doctor_id: int, avail: AvailabilityCreate, db: Session = Depends(get_db)):
    """Add a new availability slot for a doctor"""
    # Verify doctor exists
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    # Parse time strings to time objects
    try:
        start_time = datetime.strptime(avail.start_time, "%H:%M").time()
        end_time = datetime.strptime(avail.end_time, "%H:%M").time()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid time format. Use HH:MM")
    
    # Parse date if provided
    date_obj = None
    if avail.date:
        try:
            date_obj = datetime.strptime(avail.date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    # Create availability slot
    new_availability = Availability(
        doctor_id=doctor_id,
        day_of_week=avail.day_of_week,
        date=date_obj,
        start_time=start_time,
        end_time=end_time,
        is_available=avail.is_available,
        slot_duration=avail.slot_duration
    )
    
    db.add(new_availability)
    db.commit()
    db.refresh(new_availability)
    
    return new_availability

# Get doctor's availability
@app.get("/doctors/{doctor_id}/availability", response_model=List[AvailabilityResponse])
async def get_availability(doctor_id: int, db: Session = Depends(get_db)):
    """Get all availability slots for a doctor"""
    availability = db.query(Availability).filter(Availability.doctor_id == doctor_id).all()
    return availability

# Update availability slot
@app.put("/availability/{slot_id}", response_model=AvailabilityResponse)
async def update_availability(slot_id: int, avail_update: AvailabilityCreate, db: Session = Depends(get_db)):
    """Update an availability slot"""
    slot = db.query(Availability).filter(Availability.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Availability slot not found")
    
    # Update fields
    if avail_update.day_of_week is not None:
        slot.day_of_week = avail_update.day_of_week
    if avail_update.date:
        try:
            slot.date = datetime.strptime(avail_update.date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    if avail_update.start_time:
        try:
            slot.start_time = datetime.strptime(avail_update.start_time, "%H:%M").time()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid time format. Use HH:MM")
    if avail_update.end_time:
        try:
            slot.end_time = datetime.strptime(avail_update.end_time, "%H:%M").time()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid time format. Use HH:MM")
    if avail_update.is_available is not None:
        slot.is_available = avail_update.is_available
    if avail_update.slot_duration:
        slot.slot_duration = avail_update.slot_duration
    
    db.commit()
    db.refresh(slot)
    
    return slot

# Delete availability slot
@app.delete("/availability/{slot_id}")
async def delete_availability(slot_id: int, db: Session = Depends(get_db)):
    """Delete an availability slot"""
    slot = db.query(Availability).filter(Availability.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Availability slot not found")
    
    db.delete(slot)
    db.commit()
    
    return {"detail": "Availability slot deleted"}

# ============= SLOTS ENDPOINT =============

# Get available slots for a doctor on a specific date
@app.get("/doctors/{doctor_id}/slots")
async def get_available_slots(
    doctor_id: int, 
    date: str = Query(..., description="Date in YYYY-MM-DD format"),
    db: Session = Depends(get_db)
):
    """Get available time slots for a doctor on a specific date"""
    # Verify doctor exists
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    # Parse the date
    try:
        target_date = datetime.strptime(date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    # Get day of week (0=Monday, 6=Sunday)
    day_of_week = target_date.weekday()  # Monday=0
    
    # Find availability for this doctor on this date or day of week
    availability_slots = db.query(Availability).filter(
        Availability.doctor_id == doctor_id,
        Availability.is_available == True,
        (
            (Availability.date == target_date) |  # Specific date match
            (
                (Availability.day_of_week == day_of_week) &  # Day of week match
                (Availability.date == None)  # Recurring weekly slot
            )
        )
    ).all()
    
    if not availability_slots:
        return {"slots": []}
    
    # Generate time slots based on availability
    available_slots = []
    for avail in availability_slots:
        # Generate slots from start_time to end_time with slot_duration
        current_time = datetime.combine(target_date, avail.start_time)
        end_time = datetime.combine(target_date, avail.end_time)
        slot_duration = timedelta(minutes=avail.slot_duration or 30)
        
        while current_time < end_time:
            slot_start = current_time.time()
            slot_end = (current_time + slot_duration).time()
            
            # Only add if slot end is within the availability end time
            if slot_end <= avail.end_time:
                available_slots.append({
                    "start_time": slot_start.strftime("%H:%M"),
                    "end_time": slot_end.strftime("%H:%M"),
                    "available": True
                })
            
            current_time += slot_duration
    
    return {"slots": available_slots}

# Add review for a doctor
@app.post("/doctors/{doctor_id}/reviews", response_model=DoctorReviewResponse)
async def add_doctor_review(doctor_id: int, review: DoctorReviewCreate, db: Session = Depends(get_db)):
    """Add or update a review/rating for a doctor"""
    # Verify doctor exists
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    # Validate rating
    if review.rating < 1 or review.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
    
    # Check if patient already reviewed this doctor
    existing_review = db.query(DoctorReview).filter(
        DoctorReview.doctor_id == doctor_id,
        DoctorReview.patient_id == review.patient_id
    ).first()
    
    if existing_review:
        # Update existing review
        existing_review.rating = review.rating
        existing_review.review = review.review
        db.commit()
        db.refresh(existing_review)
        review_to_return = existing_review
    else:
        # Create new review
        new_review = DoctorReview(
            doctor_id=doctor_id,
            patient_id=review.patient_id,
            rating=review.rating,
            review=review.review
        )
        db.add(new_review)
        db.commit()
        db.refresh(new_review)
        review_to_return = new_review
    
    # Update doctor's average rating
    all_reviews = db.query(DoctorReview).filter(DoctorReview.doctor_id == doctor_id).all()
    if len(all_reviews) > 0:
        avg_rating = sum(r.rating for r in all_reviews) / len(all_reviews)
        doctor.rating = round(avg_rating, 1)
        doctor.review_count = len(all_reviews)
        db.commit()
    
    return review_to_return

# Get doctor reviews
@app.get("/doctors/{doctor_id}/reviews", response_model=List[DoctorReviewResponse])
async def get_doctor_reviews(doctor_id: int, db: Session = Depends(get_db)):
    """Get all reviews for a doctor"""
    reviews = db.query(DoctorReview).filter(DoctorReview.doctor_id == doctor_id).all()
    return reviews

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)
