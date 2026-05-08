# Healthcare Appointment System - Run Instructions

## Prerequisites
- Docker and Docker Compose installed
- Node.js 18+ and npm installed
- Python 3.11+ installed (for running services individually)

## Option 1: Quick Start with Docker Compose (Recommended)

### Step 1: Start the Database
```bash
cd /Users/satyasivasundarsalagrama/projects/BITS/FSD/healthcare-appointment-system

# Start PostgreSQL
docker run -d \
  --name healthcare-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=healthcare \
  -p 5432:5432 \
  postgres:15-alpine
```

### Step 2: Setup Environment
1. Create Firebase project at https://console.firebase.google.com
2. Get your Firebase config and update `frontend/.env`
3. Download service account key and save as `backend/services/auth-service/firebase-credentials.json`

### Step 3: Run All Services with Docker Compose
```bash
# Build and start all services
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

## Option 2: Manual Development Mode

### Terminal 1: Database
```bash
docker run -d \
  --name healthcare-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=healthcare \
  -p 5432:5432 \
  postgres:15-alpine
```

### Terminal 2: Auth Service
```bash
cd /Users/satyasivasundarsalagrama/projects/BITS/FSD/healthcare-appointment-system/backend/services/auth-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
export FIREBASE_CREDENTIALS_PATH=./firebase-credentials.json
uvicorn main:app --reload --port 8001
```

### Terminal 3: User Service
```bash
cd /Users/satyasivasundarsalagrama/projects/BITS/FSD/healthcare-appointment-system/backend/services/user-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/healthcare
export AUTH_SERVICE_URL=http://localhost:8001
uvicorn main:app --reload --port 8002
```

### Terminal 4: Doctor Service
```bash
cd /Users/satyasivasundarsalagrama/projects/BITS/FSD/healthcare-appointment-system/backend/services/doctor-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/healthcare
export AUTH_SERVICE_URL=http://localhost:8001
uvicorn main:app --reload --port 8003
```

### Terminal 5: Appointment Service
```bash
cd /Users/satyasivasundarsalagrama/projects/BITS/FSD/healthcare-appointment-system/backend/services/appointment-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/healthcare
export AUTH_SERVICE_URL=http://localhost:8001
export DOCTOR_SERVICE_URL=http://localhost:8003
export NOTIFICATION_SERVICE_URL=http://localhost:8005
uvicorn main:app --reload --port 8004
```

### Terminal 6: Notification Service
```bash
cd /Users/satyasivasundarsalagrama/projects/BITS/FSD/healthcare-appointment-system/backend/services/notification-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
export AUTH_SERVICE_URL=http://localhost:8001
uvicorn main:app --reload --port 8005
```

### Terminal 7: Frontend
```bash
cd /Users/satyasivasundarsalagrama/projects/BITS/FSD/healthcare-appointment-system/frontend
npm install
npm run dev
```

## Access Points

Once running, access:
- **Frontend**: http://localhost:5173
- **API Gateway**: http://localhost:8000
- **Auth Service Docs**: http://localhost:8001/docs
- **User Service Docs**: http://localhost:8002/docs
- **Doctor Service Docs**: http://localhost:8003/docs
- **Appointment Service Docs**: http://localhost:8004/docs
- **Notification Service Docs**: http://localhost:8005/docs

## Quick Test Without Firebase (Mock Mode)

If you don't have Firebase setup yet, you can still test the UI:

1. Frontend will run in development mode with mock data
2. Backend services will create tables automatically
3. Some features requiring authentication will show errors

## Creating Test Data

### Create a Doctor:
```bash
curl -X POST http://localhost:8003/doctors \
  -H "Content-Type: application/json" \
  -d '{
    "id": "doctor-test-id",
    "email": "doctor@test.com",
    "first_name": "John",
    "last_name": "Smith",
    "specialization": "Cardiology",
    "qualification": "MD, FACC",
    "experience_years": 15,
    "license_number": "DOC-12345",
    "consultation_fee": 150,
    "about": "Experienced cardiologist with 15 years of practice"
  }'
```

### Create Availability:
```bash
curl -X POST http://localhost:8003/doctors/doctor-test-id/availability \
  -H "Content-Type: application/json" \
  -d '{
    "day_of_week": 1,
    "start_time": "09:00",
    "end_time": "17:00",
    "slot_duration": 30
  }'
```

## Troubleshooting

### Database Connection Issues:
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check database logs
docker logs healthcare-db

# Reset database (CAUTION: loses all data)
docker stop healthcare-db
docker rm healthcare-db
# Then restart with create command above
```

### Port Already in Use:
```bash
# Find and kill process using port
lsof -ti:8001 | xargs kill -9  # Auth service
lsof -ti:8002 | xargs kill -9  # User service
# etc.
```

### CORS Issues:
Make sure all services have CORS enabled (already configured in the code).
