#!/bin/bash

echo "Starting Healthcare Appointment System Services..."
BASE_DIR="/Users/satyasivasundarsalagrama/projects/BITS/FSD/healthcare-appointment-system"

# Function to check if port is available
check_port() {
    lsof -ti:$1 >/dev/null 2>&1
    return $?
}

# Kill existing processes on required ports
for port in 8001 8002 8003 8004 8005 5173; do
    pid=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$pid" ]; then
        echo "Killing process on port $port (PID: $pid)"
        kill -9 $pid 2>/dev/null
    fi
done

sleep 2

# Start Auth Service (Port 8001)
echo "🚀 Starting Auth Service on Port 8001..."
cd "$BASE_DIR/backend/services/auth-service"
export FIREBASE_CREDENTIALS_PATH=./firebase-credentials.json
python3 -c "
from main import app
import uvicorn
uvicorn.run(app, host='0.0.0.0', port=8001)
" > /tmp/auth.log 2>&1 &
AUTH_PID=$!
echo $AUTH_PID > /tmp/auth.pid

sleep 3

# Check if Auth is running
if curl -s http://localhost:8001/health >/dev/null 2>&1; then
    echo "✅ Auth Service running (PID: $AUTH_PID)"
else
    echo "❌ Auth Service failed to start"
    cat /tmp/auth.log
fi

# Start User Service (Port 8002)
echo "🚀 Starting User Service on Port 8002..."
cd "$BASE_DIR/backend/services/user-service"
export DATABASE_URL="postgresql://$(whoami)@localhost:5432/healthcare"
export AUTH_SERVICE_URL=http://localhost:8001
python3 -c "
from main import app
import uvicorn
uvicorn.run(app, host='0.0.0.0', port=8002)
" > /tmp/user.log 2>&1 &
USER_PID=$!
echo $USER_PID > /tmp/user.pid

sleep 3

if curl -s http://localhost:8002/health >/dev/null 2>&1; then
    echo "✅ User Service running (PID: $USER_PID)"
else
    echo "❌ User Service failed to start"
fi

# Start Doctor Service (Port 8003)
echo "🚀 Starting Doctor Service on Port 8003..."
cd "$BASE_DIR/backend/services/doctor-service"
export DATABASE_URL="postgresql://$(whoami)@localhost:5432/healthcare"
export AUTH_SERVICE_URL=http://localhost:8001
python3 -c "
from main import app
import uvicorn
uvicorn.run(app, host='0.0.0.0', port=8003)
" > /tmp/doctor.log 2>&1 &
DOCTOR_PID=$!
echo $DOCTOR_PID > /tmp/doctor.pid

sleep 3

if curl -s http://localhost:8003/health >/dev/null 2>&1; then
    echo "✅ Doctor Service running (PID: $DOCTOR_PID)"
else
    echo "❌ Doctor Service failed to start"
fi

# Start Appointment Service (Port 8004)
echo "🚀 Starting Appointment Service on Port 8004..."
cd "$BASE_DIR/backend/services/appointment-service"
export DATABASE_URL="postgresql://$(whoami)@localhost:5432/healthcare"
export AUTH_SERVICE_URL=http://localhost:8001
export DOCTOR_SERVICE_URL=http://localhost:8003
export NOTIFICATION_SERVICE_URL=http://localhost:8005
python3 -c "
from main import app
import uvicorn
uvicorn.run(app, host='0.0.0.0', port=8004)
" > /tmp/appointment.log 2>&1 &
APPOINTMENT_PID=$!
echo $APPOINTMENT_PID > /tmp/appointment.pid

sleep 3

if curl -s http://localhost:8004/health >/dev/null 2>&1; then
    echo "✅ Appointment Service running (PID: $APPOINTMENT_PID)"
else
    echo "❌ Appointment Service failed to start"
fi

# Start Notification Service (Port 8005)
echo "🚀 Starting Notification Service on Port 8005..."
cd "$BASE_DIR/backend/services/notification-service"
export AUTH_SERVICE_URL=http://localhost:8001
python3 -c "
from main import app
import uvicorn
uvicorn.run(app, host='0.0.0.0', port=8005)
" > /tmp/notification.log 2>&1 &
NOTIFICATION_PID=$!
echo $NOTIFICATION_PID > /tmp/notification.pid

sleep 3

if curl -s http://localhost:8005/health >/dev/null 2>&1; then
    echo "✅ Notification Service running (PID: $NOTIFICATION_PID)"
else
    echo "❌ Notification Service failed to start"
fi

echo ""
echo "=========================================="
echo "All services starting..."
echo "=========================================="
echo "Check status with: ./check_services.sh"
echo "Stop all with: ./stop_services.sh"
