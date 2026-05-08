# Healthcare Appointment System

A full-stack healthcare appointment booking platform built with microservices architecture.

## Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Python FastAPI (Microservices)
- **Database**: PostgreSQL
- **Auth**: Firebase Authentication
- **Real-time**: Socket.io
- **API Gateway**: Nginx + FastAPI

## Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────────┐
│   React     │──────▶│  API Gateway │──────▶│  Auth Service   │
│  Frontend   │◀──────│   (Nginx)    │◀──────│  (Firebase JWT) │
└─────────────┘      └──────────────┘       └─────────────────┘
                              │
           ┌──────────────────┼──────────────────┐
           │                  │                  │
     ┌─────────────┐  ┌─────────────┐  ┌──────────────┐
     │User Service │  │Doctor Svc   │  │Appointment   │
     │             │  │             │  │   Service    │
     └─────────────┘  └─────────────┘  └──────────────┘
           │                  │                  │
           └──────────────────┼──────────────────┘
                              │
                    ┌──────────────┐
                    │ Notification │
                    │  Service     │
                    └──────────────┘
                              │
                    ┌──────────────┐
                    │  PostgreSQL  │
                    └──────────────┘
```

## Microservices

1. **Auth Service** (Port 8001): Firebase Auth integration, JWT validation
2. **User Service** (Port 8002): Patient profiles, medical records
3. **Doctor Service** (Port 8003): Doctor profiles, specializations, availability
4. **Appointment Service** (Port 8004): Booking, scheduling, status management
5. **Notification Service** (Port 8005): Real-time notifications via Socket.io

## Quick Start

```bash
# Start all services
docker-compose up -d

# Or start individually:
cd frontend && npm install && npm run dev
cd backend/services/auth-service && pip install -r requirements.txt && uvicorn main:app --reload --port 8001
```

## API Documentation

Each service exposes OpenAPI docs at `/docs` endpoint.

## Test Credentials

- Patient: patient@test.com / 123456
- Doctor: doctor@test.com / 123456
