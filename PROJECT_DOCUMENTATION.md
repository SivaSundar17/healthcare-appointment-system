# Healthcare Appointment System - Project Documentation

## Project Overview

**Problem Statement**: Design and develop a full-stack web application using React (frontend) and Python FastAPI (backend) with microservices architecture for healthcare appointment booking.

**Key Features**:
- Doctor profiles with specializations and availability
- Patient appointment booking and management
- Real-time notifications via Socket.io
- Medical records management
- Firebase Authentication integration

## Architecture

### Tech Stack
| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite + Tailwind CSS |
| API Gateway | Nginx |
| Auth Service | FastAPI + Firebase Admin |
| User Service | FastAPI + SQLAlchemy |
| Doctor Service | FastAPI + SQLAlchemy |
| Appointment Service | FastAPI + SQLAlchemy |
| Notification Service | FastAPI + Socket.io |
| Database | PostgreSQL |
| Real-time | Socket.io |

### Microservices

1. **Auth Service (Port 8001)**
   - Firebase Authentication integration
   - JWT token verification
   - User role management

2. **User Service (Port 8002)**
   - Patient profile CRUD
   - Medical records management
   - Patient history tracking

3. **Doctor Service (Port 8003)**
   - Doctor profile management
   - Specialization and qualification tracking
   - Availability slot management
   - Time slot generation

4. **Appointment Service (Port 8004)**
   - Appointment booking and scheduling
   - Status management (scheduled, confirmed, completed, cancelled)
   - Appointment history tracking
   - Integration with notification service

5. **Notification Service (Port 8005)**
   - Real-time notifications via Socket.io
   - Email notification support
   - Push notification support
   - Notification history

## Database Schema

### Core Tables
- `patients` - Patient profiles and demographics
- `doctors` - Doctor profiles and specializations
- `appointments` - Appointment bookings with status
- `availability` - Doctor availability slots
- `medical_records` - Patient medical history
- `doctor_reviews` - Doctor ratings and reviews

## API Endpoints

### Auth Service
- `POST /verify-token` - Verify Firebase token
- `GET /user/{uid}` - Get user details
- `POST /set-role/{uid}` - Set user role

### User Service
- `POST /patients` - Create patient profile
- `GET /patients/{id}` - Get patient details
- `PUT /patients/{id}` - Update patient profile
- `GET /patients/{id}/medical-records` - Get medical records
- `POST /patients/{id}/medical-records` - Add medical record

### Doctor Service
- `POST /doctors` - Register doctor
- `GET /doctors` - List doctors
- `GET /doctors/{id}` - Get doctor details
- `PUT /doctors/{id}` - Update doctor profile
- `POST /doctors/{id}/availability` - Add availability
- `GET /doctors/{id}/availability` - Get availability
- `GET /doctors/{id}/slots` - Get available time slots

### Appointment Service
- `POST /appointments` - Book appointment
- `GET /appointments/{id}` - Get appointment details
- `GET /appointments/patient/{id}` - Get patient appointments
- `GET /appointments/doctor/{id}` - Get doctor appointments
- `PUT /appointments/{id}` - Update appointment
- `POST /appointments/{id}/cancel` - Cancel appointment

### Notification Service
- `POST /send` - Send notification
- `POST /broadcast` - Broadcast notification
- `GET /notifications/{user_id}` - Get user notifications
- `POST /notifications/{id}/read` - Mark as read

## Running the Project

### With Docker Compose (Recommended)
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Individual Services (Development)
```bash
# Database
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:15

# Auth Service
cd backend/services/auth-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8001

# User Service
cd backend/services/user-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8002

# Frontend
cd frontend
npm install
npm run dev
```

## Frontend Pages

1. **Landing Page** - Hero section with CTA
2. **Login/Register** - Firebase Authentication
3. **Patient Dashboard** - Upcoming appointments, medical records
4. **Doctor Dashboard** - Schedule, patient list, availability management
5. **Doctor Directory** - Search and filter doctors
6. **Book Appointment** - Select doctor, date, time slot
7. **Appointment Details** - View and manage appointments
8. **Profile Management** - Edit patient/doctor profiles

## AI-Assisted Development

### Prompts and AI Responses
[To be filled during development]

### Human Modifications
[To be filled during development]

### Development Timeline
- Estimated traditional development: 40-50 hours
- AI-assisted development: 12-15 hours
- Time saved: ~70%

## Deployment

### Production Setup
1. Set up PostgreSQL database
2. Configure Firebase project
3. Deploy services to cloud (AWS/GCP/Azure)
4. Set up environment variables
5. Configure SSL certificates
6. Deploy frontend to CDN

### Environment Variables
See `.env.example` for required configuration.

## Testing

### API Testing
Each service exposes Swagger docs at `/docs` endpoint when running.

## Documentation Files

1. `README.md` - Project overview and quick start
2. `PROJECT_DOCUMENTATION.md` - This file
3. `AI_INTERACTION_LOG.md` - Detailed AI prompt/response log
4. `REFLECTION.md` - Personal reflection on AI-assisted development
