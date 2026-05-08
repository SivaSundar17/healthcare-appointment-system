#!/bin/bash

# Run all services in foreground with output visible
BASE_DIR="/Users/satyasivasundarsalagrama/projects/BITS/FSD/healthcare-appointment-system"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Starting Healthcare Appointment System...${NC}"

# Check PostgreSQL
if ! pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
    echo -e "${RED}PostgreSQL not running. Starting it...${NC}"
    brew services start postgresql@15 2>/dev/null || echo "Please start PostgreSQL manually"
    sleep 3
fi

# Ensure database exists
createdb healthcare 2>/dev/null || echo "Database 'healthcare' already exists or needs PostgreSQL running"

echo ""
echo "=========================================="
echo "STARTING BACKEND SERVICES"
echo "=========================================="

# Auth Service
echo -e "${YELLOW}[1/5] Starting Auth Service on port 8001...${NC}"
cd "$BASE_DIR/backend/services/auth-service"
export FIREBASE_CREDENTIALS_PATH=./firebase-credentials.json
export DATABASE_URL="postgresql://$(whoami)@localhost:5432/healthcare"

# Check dependencies
python3 -c "import fastapi" 2>/dev/null || pip3 install -q fastapi uvicorn firebase-admin python-jose python-dotenv

python3 -c "
from main import app
import uvicorn
print('Auth Service starting on http://localhost:8001')
uvicorn.run(app, host='0.0.0.0', port=8001, log_level='info')
" &
AUTH_PID=$!
echo $AUTH_PID > /tmp/auth.pid
sleep 4

if curl -s http://localhost:8001/health >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Auth Service running (PID: $AUTH_PID)${NC}"
else
    echo -e "${RED}⚠️  Auth Service may have issues - checking logs...${NC}"
fi

# User Service
echo -e "${YELLOW}[2/5] Starting User Service on port 8002...${NC}"
cd "$BASE_DIR/backend/services/user-service"
export DATABASE_URL="postgresql://$(whoami)@localhost:5432/healthcare"
export AUTH_SERVICE_URL=http://localhost:8001

python3 -c "import sqlalchemy" 2>/dev/null || pip3 install -q fastapi uvicorn sqlalchemy psycopg2-binary pydantic requests python-dotenv

python3 -c "
from main import app
import uvicorn
print('User Service starting on http://localhost:8002')
uvicorn.run(app, host='0.0.0.0', port=8002, log_level='info')
" &
USER_PID=$!
echo $USER_PID > /tmp/user.pid
sleep 4

if curl -s http://localhost:8002/health >/dev/null 2>&1; then
    echo -e "${GREEN}✅ User Service running (PID: $USER_PID)${NC}"
else
    echo -e "${RED}⚠️  User Service may have issues${NC}"
fi

# Doctor Service
echo -e "${YELLOW}[3/5] Starting Doctor Service on port 8003...${NC}"
cd "$BASE_DIR/backend/services/doctor-service"
export DATABASE_URL="postgresql://$(whoami)@localhost:5432/healthcare"
export AUTH_SERVICE_URL=http://localhost:8001

python3 -c "from main import app; import uvicorn; uvicorn.run(app, host='0.0.0.0', port=8003, log_level='info')" &
DOCTOR_PID=$!
echo $DOCTOR_PID > /tmp/doctor.pid
sleep 4

if curl -s http://localhost:8003/health >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Doctor Service running (PID: $DOCTOR_PID)${NC}"
else
    echo -e "${RED}⚠️  Doctor Service may have issues${NC}"
fi

# Appointment Service
echo -e "${YELLOW}[4/5] Starting Appointment Service on port 8004...${NC}"
cd "$BASE_DIR/backend/services/appointment-service"
export DATABASE_URL="postgresql://$(whoami)@localhost:5432/healthcare"
export AUTH_SERVICE_URL=http://localhost:8001
export DOCTOR_SERVICE_URL=http://localhost:8003
export NOTIFICATION_SERVICE_URL=http://localhost:8005

python3 -c "from main import app; import uvicorn; uvicorn.run(app, host='0.0.0.0', port=8004, log_level='info')" &
APPOINTMENT_PID=$!
echo $APPOINTMENT_PID > /tmp/appointment.pid
sleep 4

if curl -s http://localhost:8004/health >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Appointment Service running (PID: $APPOINTMENT_PID)${NC}"
else
    echo -e "${RED}⚠️  Appointment Service may have issues${NC}"
fi

# Notification Service
echo -e "${YELLOW}[5/5] Starting Notification Service on port 8005...${NC}"
cd "$BASE_DIR/backend/services/notification-service"
export AUTH_SERVICE_URL=http://localhost:8001

python3 -c "from main import app; import uvicorn; uvicorn.run(app, host='0.0.0.0', port=8005, log_level='info')" &
NOTIFICATION_PID=$!
echo $NOTIFICATION_PID > /tmp/notification.pid
sleep 4

if curl -s http://localhost:8005/health >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Notification Service running (PID: $NOTIFICATION_PID)${NC}"
else
    echo -e "${RED}⚠️  Notification Service may have issues${NC}"
fi

echo ""
echo "=========================================="
echo "SERVICE STATUS SUMMARY"
echo "=========================================="

# Check all services
echo "Checking all services..."
for port in 8001 8002 8003 8004 8005; do
    service_name=$(case $port in
        8001) echo "Auth" ;;
        8002) echo "User" ;;
        8003) echo "Doctor" ;;
        8004) echo "Appointment" ;;
        8005) echo "Notification" ;;
    esac)
    
    response=$(curl -s http://localhost:$port/health 2>/dev/null)
    if [ ! -z "$response" ]; then
        echo -e "${GREEN}✅ $service_name Service (Port $port): Running${NC}"
        echo "   Response: $response"
    else
        echo -e "${RED}❌ $service_name Service (Port $port): Not responding${NC}"
    fi
done

echo ""
echo -e "${YELLOW}==========================================${NC}"
echo -e "${YELLOW}STARTING FRONTEND${NC}"
echo -e "${YELLOW}==========================================${NC}"

cd "$BASE_DIR/frontend"

# Check npm modules
if [ ! -d "node_modules" ]; then
    echo "Installing npm dependencies..."
    npm install
fi

echo "Starting Vite dev server..."
npm run dev &
FRONTEND_PID=$!
echo $FRONTEND_PID > /tmp/frontend.pid

sleep 5

echo ""
echo -e "${GREEN}==========================================${NC}"
echo -e "${GREEN}ALL SERVICES STARTED!${NC}"
echo -e "${GREEN}==========================================${NC}"
echo ""
echo "Access Points:"
echo "  🌐 Frontend:          http://localhost:5173"
echo "  📚 Auth API Docs:     http://localhost:8001/docs"
echo "  📚 User API Docs:     http://localhost:8002/docs"
echo "  📚 Doctor API Docs:   http://localhost:8003/docs"
echo "  📚 Appointment API:   http://localhost:8004/docs"
echo "  📚 Notification API:  http://localhost:8005/docs"
echo ""
echo ""
echo "To stop all services:"
echo "  kill $(cat /tmp/auth.pid /tmp/user.pid /tmp/doctor.pid /tmp/appointment.pid /tmp/notification.pid /tmp/frontend.pid 2>/dev/null)"
echo ""

# Keep script running
wait
