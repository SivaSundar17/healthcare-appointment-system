from fastapi import FastAPI, Depends, HTTPException, Header, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.orm import Session
from datetime import datetime, date, time, timedelta
import requests
import os

from models import SessionLocal, Appointment, AppointmentHistory, engine

app = FastAPI(title="Appointment Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Service URLs - use environment variables or default to localhost
AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "https://healthcare-auth-service.onrender.com")
DOCTOR_SERVICE_URL = os.getenv("DOCTOR_SERVICE_URL", "https://healthcare-doctor-service.onrender.com")
NOTIFICATION_SERVICE_URL = os.getenv("NOTIFICATION_SERVICE_URL", "https://healthcare-notification-service.onrender.com")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Pydantic models
class AppointmentCreate(BaseModel):
    patient_id: int
    doctor_id: int
    appointment_date: date
    start_time: time
    end_time: time
    reason: str
    symptoms: Optional[str] = None

class AppointmentUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None
    prescription: Optional[str] = None
    diagnosis: Optional[str] = None
    payment_status: Optional[str] = None

class AppointmentResponse(BaseModel):
    id: int
    patient_id: int
    doctor_id: int
    appointment_date: Optional[str] = None  # ISO format date
    start_time: Optional[str] = None  # ISO format time
    end_time: Optional[str] = None  # ISO format time
    status: str
    reason: Optional[str] = None
    notes: Optional[str] = None
    prescription: Optional[str] = None
    symptoms: Optional[str] = None
    diagnosis: Optional[str] = None
    amount: Optional[float] = None
    payment_status: Optional[str] = "pending"
    created_at: Optional[str] = None  # ISO format datetime
    
    class Config:
        from_attributes = True
        extra = 'ignore'

class CancelAppointment(BaseModel):
    reason: str

# Token verification
def verify_token(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    token = authorization.split(" ")[1]
    try:
        # Call Auth Service to verify JWT token (new endpoint format)
        response = requests.get(
            f"{AUTH_SERVICE_URL}/verify-token",
            params={"token": token},
            timeout=5
        )
        if response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid token")
        return response.json()
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token verification failed: {str(e)}")

def send_notification(user_id: str, title: str, message: str, notification_type: str):
    """Send notification via notification service"""
    try:
        requests.post(
            f"{NOTIFICATION_SERVICE_URL}/send",
            json={
                "user_id": user_id,
                "title": title,
                "message": message,
                "type": notification_type
            },
            timeout=3
        )
    except:
        pass  # Fail silently

def serialize_appointment(appointment):
    """Serialize Appointment SQLAlchemy object to dict"""
    return {
        "id": appointment.id,
        "patient_id": appointment.patient_id,
        "doctor_id": appointment.doctor_id,
        "appointment_date": appointment.appointment_date.isoformat() if appointment.appointment_date else None,
        "start_time": appointment.start_time.isoformat() if appointment.start_time else None,
        "end_time": appointment.end_time.isoformat() if appointment.end_time else None,
        "status": appointment.status,
        "reason": appointment.reason,
        "notes": appointment.notes,
        "prescription": appointment.prescription,
        "symptoms": appointment.symptoms,
        "diagnosis": appointment.diagnosis,
        "amount": appointment.amount,
        "payment_status": appointment.payment_status,
        "created_at": appointment.created_at.isoformat() if appointment.created_at else None
    }

@app.post("/appointments", response_model=AppointmentResponse)
async def create_appointment(
    appointment: AppointmentCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    auth_user: dict = Depends(verify_token)
):
    """Book a new appointment"""
    try:
        # Check if slot is available
        existing = db.query(Appointment).filter(
            Appointment.doctor_id == appointment.doctor_id,
            Appointment.appointment_date == appointment.appointment_date,
            Appointment.start_time == appointment.start_time,
            Appointment.status.in_(["scheduled", "confirmed"])
        ).first()
        
        if existing:
            raise HTTPException(status_code=400, detail="Time slot already booked")
        
        # Get doctor fee
        try:
            doctor_response = requests.get(
                f"{DOCTOR_SERVICE_URL}/doctors/{appointment.doctor_id}",
                timeout=3
            )
            consultation_fee = doctor_response.json().get("consultation_fee", 0)
        except:
            consultation_fee = 0
        
        new_appointment = Appointment(
            **appointment.dict(),
            amount=consultation_fee
        )
        db.add(new_appointment)
        db.commit()
        db.refresh(new_appointment)
    except HTTPException:
        raise  # Re-raise HTTPException to preserve status code (400, etc.)
    except Exception as e:
        import traceback
        error_detail = f"Error creating appointment: {str(e)}\nTraceback: {traceback.format_exc()}"
        print(error_detail)
        raise HTTPException(status_code=500, detail=error_detail)
    
    # Add to history
    history = AppointmentHistory(
        appointment_id=new_appointment.id,
        status_from="",
        status_to="scheduled",
        changed_by=auth_user["uid"],
        notes="Appointment created"
    )
    db.add(history)
    db.commit()
    
    # Send notifications
    background_tasks.add_task(
        send_notification,
        appointment.doctor_id,
        "New Appointment",
        f"New appointment booked for {appointment.appointment_date}",
        "appointment_booked"
    )
    background_tasks.add_task(
        send_notification,
        appointment.patient_id,
        "Appointment Confirmed",
        f"Your appointment is scheduled for {appointment.appointment_date}",
        "appointment_confirmed"
    )
    
    # Return properly serialized response
    return serialize_appointment(new_appointment)

@app.get("/appointments/{appointment_id}", response_model=AppointmentResponse)
async def get_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    auth_user: dict = Depends(verify_token)
):
    """Get appointment details"""
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return serialize_appointment(appointment)

@app.get("/appointments/patient/{patient_id}", response_model=List[AppointmentResponse])
async def get_patient_appointments(
    patient_id: int,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    auth_user: dict = Depends(verify_token)
):
    """Get all appointments for a patient"""
    query = db.query(Appointment).filter(Appointment.patient_id == patient_id)
    if status:
        query = query.filter(Appointment.status == status)
    appointments = query.order_by(Appointment.appointment_date.desc()).all()
    return [serialize_appointment(a) for a in appointments]

@app.get("/appointments/doctor/{doctor_id}", response_model=List[AppointmentResponse])
async def get_doctor_appointments(
    doctor_id: int,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    auth_user: dict = Depends(verify_token)
):
    """Get all appointments for a doctor"""
    query = db.query(Appointment).filter(Appointment.doctor_id == doctor_id)
    if status:
        query = query.filter(Appointment.status == status)
    appointments = query.order_by(Appointment.appointment_date.desc()).all()
    return [serialize_appointment(a) for a in appointments]

@app.put("/appointments/{appointment_id}", response_model=AppointmentResponse)
async def update_appointment(
    appointment_id: int,
    update_data: AppointmentUpdate,
    db: Session = Depends(get_db),
    auth_user: dict = Depends(verify_token)
):
    """Update appointment status or details"""
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    old_status = appointment.status
    
    for field, value in update_data.dict(exclude_unset=True).items():
        setattr(appointment, field, value)
    
    appointment.updated_at = datetime.utcnow()
    db.commit()
    
    # Add to history if status changed
    if update_data.status and update_data.status != old_status:
        history = AppointmentHistory(
            appointment_id=appointment_id,
            status_from=old_status,
            status_to=update_data.status,
            changed_by=auth_user["uid"]
        )
        db.add(history)
        db.commit()
    
    db.refresh(appointment)
    return serialize_appointment(appointment)

@app.post("/appointments/{appointment_id}/cancel")
async def cancel_appointment(
    appointment_id: int,
    cancel_data: CancelAppointment,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    auth_user: dict = Depends(verify_token)
):
    """Cancel an appointment"""
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    if appointment.status in ["completed", "cancelled"]:
        raise HTTPException(status_code=400, detail=f"Cannot cancel {appointment.status} appointment")
    
    old_status = appointment.status
    appointment.status = "cancelled"
    appointment.cancelled_by = auth_user.get("role", "unknown")
    appointment.cancellation_reason = cancel_data.reason
    appointment.updated_at = datetime.utcnow()
    
    # Add to history
    history = AppointmentHistory(
        appointment_id=appointment_id,
        status_from=old_status,
        status_to="cancelled",
        changed_by=auth_user["uid"],
        notes=f"Cancelled: {cancel_data.reason}"
    )
    db.add(history)
    db.commit()
    
    # Send notifications
    background_tasks.add_task(
        send_notification,
        appointment.doctor_id,
        "Appointment Cancelled",
        f"Appointment cancelled: {cancel_data.reason}",
        "appointment_cancelled"
    )
    background_tasks.add_task(
        send_notification,
        appointment.patient_id,
        "Appointment Cancelled",
        f"Your appointment has been cancelled: {cancel_data.reason}",
        "appointment_cancelled"
    )
    
    return {"message": "Appointment cancelled successfully"}

@app.get("/appointments/{appointment_id}/history")
async def get_appointment_history(
    appointment_id: int,
    db: Session = Depends(get_db),
    auth_user: dict = Depends(verify_token)
):
    """Get status history of an appointment"""
    history = db.query(AppointmentHistory).filter(
        AppointmentHistory.appointment_id == appointment_id
    ).order_by(AppointmentHistory.created_at.asc()).all()
    return history

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "appointment"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8004)
