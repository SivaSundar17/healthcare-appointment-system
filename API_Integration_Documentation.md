# API Integration Documentation

## Overview

This document provides comprehensive integration guidelines for the Healthcare Appointment System APIs. The system follows a microservices architecture with four main services, each handling specific domain functionality.

## Service Architecture

```
Frontend Application
    │
    ▼ HTTP/HTTPS Requests
    │
┌─────────────┬─────────────┬─────────────┬─────────────┐
│ Auth Service │ User Service │Doctor Service│Appt Service │
│   :8001     │   :8002     │   :8003     │   :8004     │
└─────────────┴─────────────┴─────────────┴─────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│        PostgreSQL Database          │
└─────────────────────────────────────────┘
```

## Base URLs

**Development Environment:**
- Auth Service: `http://localhost:8001`
- User Service: `http://localhost:8002`
- Doctor Service: `http://localhost:8003`
- Appointment Service: `http://localhost:8004`
- Notification Service: `http://localhost:8005`

**Production Environment:**
- Auth Service: `https://auth-service-xxxx.onrender.com`
- User Service: `https://user-service-xxxx.onrender.com`
- Doctor Service: `https://doctor-service-xxxx.onrender.com`
- Appointment Service: `https://appointment-service-xxxx.onrender.com`

## Authentication

### JWT Token Format
```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "role": "patient|doctor|admin",
  "exp": 1640995200,
  "iat": 1640908800
}
```

### Authorization Header
```
Authorization: Bearer <jwt_token>
```

## API Endpoints

### 1. Authentication Service (Port 8001)

#### User Registration
```http
POST /signup
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "password": "securePassword123",
  "first_name": "John",
  "last_name": "Doe",
  "role": "patient"
}
```

**Response:**
```json
{
  "uid": "1",
  "email": "john.doe@example.com",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "role": "patient",
  "first_name": "John",
  "last_name": "Doe"
}
```

#### User Login
```http
POST /login
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "uid": "1",
  "email": "john.doe@example.com",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "role": "patient",
  "first_name": "John",
  "last_name": "Doe"
}
```

#### Token Verification
```http
GET /verify-token?token=<jwt_token>
```

**Response:**
```json
{
  "uid": "1",
  "email": "john.doe@example.com",
  "role": "patient",
  "first_name": "John",
  "last_name": "Doe"
}
```

### 2. User Service (Port 8002)

#### Create Patient Profile
```http
POST /patients
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "id": 1,
  "email": "john.doe@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1234567890",
  "date_of_birth": "1990-01-01",
  "gender": "Male",
  "address": "123 Main St, City, State",
  "blood_group": "O+",
  "allergies": "Penicillin",
  "emergency_contact": "+1234567891"
}
```

**Response:**
```json
{
  "id": 1,
  "email": "john.doe@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1234567890",
  "date_of_birth": "1990-01-01",
  "gender": "Male",
  "address": "123 Main St, City, State",
  "blood_group": "O+",
  "allergies": "Penicillin",
  "emergency_contact": "+1234567891",
  "created_at": "2024-01-01T10:00:00Z",
  "updated_at": "2024-01-01T10:00:00Z"
}
```

#### Get Patient Profile
```http
GET /patients/1
Authorization: Bearer <jwt_token>
```

#### Update Patient Profile
```http
PUT /patients/1
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "phone": "+1234567890",
  "address": "456 New St, Updated City, State"
}
```

#### Get Medical Records
```http
GET /medical-records/1
Authorization: Bearer <jwt_token>
```

**Response:**
```json
[
  {
    "id": 1,
    "patient_id": 1,
    "doctor_id": 2,
    "record_date": "2024-01-15",
    "diagnosis": "Common Cold",
    "prescription": "Rest and fluids",
    "notes": "Patient advised to rest for 3 days",
    "created_at": "2024-01-15T14:30:00Z"
  }
]
```

### 3. Doctor Service (Port 8003)

#### Create Doctor Profile
```http
POST /doctors
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "id": 2,
  "email": "dr.smith@example.com",
  "first_name": "Sarah",
  "last_name": "Smith",
  "specialization": "Cardiology",
  "phone": "+1234567890",
  "consultation_fee": 150.00
}
```

**Response:**
```json
{
  "id": 2,
  "email": "dr.smith@example.com",
  "first_name": "Sarah",
  "last_name": "Smith",
  "specialization": "Cardiology",
  "phone": "+1234567890",
  "consultation_fee": 150.00,
  "is_active": true,
  "rating": 0.0,
  "review_count": 0,
  "created_at": "2024-01-01T10:00:00Z"
}
```

#### Get All Doctors
```http
GET /doctors?skip=0&limit=10&specialization=Cardiology
```

**Response:**
```json
[
  {
    "id": 2,
    "email": "dr.smith@example.com",
    "first_name": "Sarah",
    "last_name": "Smith",
    "specialization": "Cardiology",
    "consultation_fee": 150.00,
    "rating": 4.5,
    "review_count": 25,
    "is_active": true
  }
]
```

#### Get Specializations
```http
GET /specializations
```

**Response:**
```json
["Cardiology", "Dermatology", "Pediatrics", "Orthopedics"]
```

#### Add Availability
```http
POST /doctors/2/availability
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "type": "recurring",
  "day_of_week": 1,
  "start_time": "09:00",
  "end_time": "17:00",
  "slot_duration": 30
}
```

**Response:**
```json
{
  "id": 1,
  "doctor_id": 2,
  "day_of_week": 1,
  "date": null,
  "start_time": "09:00:00",
  "end_time": "17:00:00",
  "is_available": true,
  "slot_duration": 30
}
```

#### Get Available Slots
```http
GET /doctors/2/slots?date=2024-01-15
```

**Response:**
```json
{
  "slots": [
    {
      "start_time": "09:00",
      "end_time": "09:30",
      "is_available": true
    },
    {
      "start_time": "09:30",
      "end_time": "10:00",
      "is_available": true
    }
  ]
}
```

#### Add Doctor Review
```http
POST /doctors/2/reviews
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "patient_id": 1,
  "rating": 5,
  "review": "Excellent doctor, very professional and caring."
}
```

### 4. Appointment Service (Port 8004)

#### Create Appointment
```http
POST /appointments
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "patient_id": 1,
  "doctor_id": 2,
  "appointment_date": "2024-01-15",
  "start_time": "10:00",
  "end_time": "10:30",
  "reason": "Regular checkup",
  "notes": "Patient reports mild headache"
}
```

**Response:**
```json
{
  "id": 1,
  "patient_id": 1,
  "doctor_id": 2,
  "appointment_date": "2024-01-15",
  "start_time": "10:00:00",
  "end_time": "10:30:00",
  "status": "scheduled",
  "reason": "Regular checkup",
  "notes": "Patient reports mild headache",
  "created_at": "2024-01-10T09:00:00Z",
  "updated_at": "2024-01-10T09:00:00Z"
}
```

#### Get Patient Appointments
```http
GET /appointments/patient/1?status=scheduled
Authorization: Bearer <jwt_token>
```

#### Get Doctor Appointments
```http
GET /appointments/doctor/2?status=scheduled
Authorization: Bearer <jwt_token>
```

#### Update Appointment
```http
PUT /appointments/1
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "status": "confirmed",
  "notes": "Appointment confirmed with patient"
}
```

#### Cancel Appointment
```http
POST /appointments/1/cancel
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "reason": "Patient needs to reschedule due to emergency"
}
```

#### Complete Appointment
```http
POST /appointments/1/complete
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "diagnosis": "Hypertension",
  "prescription": "Lisinopril 10mg daily",
  "notes": "Patient advised to follow up in 2 weeks"
}
```

## Error Handling

### Standard Error Response Format
```json
{
  "detail": "Error description message"
}
```

### Common HTTP Status Codes
- **200 OK**: Request successful
- **201 Created**: Resource created successfully
- **400 Bad Request**: Invalid request data
- **401 Unauthorized**: Authentication required or invalid
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server error occurred

### Error Examples
```json
// Authentication Error
{
  "detail": "Invalid email or password"
}

// Validation Error
{
  "detail": [
    {
      "loc": ["email"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}

// Not Found Error
{
  "detail": "Doctor not found"
}
```

## Integration Examples

### JavaScript/React Integration

```javascript
// API Configuration
const API_BASE_URLS = {
  auth: 'http://localhost:8001',
  user: 'http://localhost:8002',
  doctor: 'http://localhost:8003',
  appointment: 'http://localhost:8004'
};

// Axios Setup with Authentication
import axios from 'axios';

const apiClient = axios.create({
  baseURL: API_BASE_URLS.auth,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add Authorization Interceptor
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Login Function
const login = async (email, password) => {
  try {
    const response = await apiClient.post('/login', { email, password });
    const { token, uid, role } = response.data;
    
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user_id', uid);
    localStorage.setItem('user_role', role);
    
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Login failed');
  }
};

// Get Doctors Function
const getDoctors = async (specialization = '') => {
  try {
    const response = await axios.get(`${API_BASE_URLS.doctor}/doctors`, {
      params: { specialization }
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Failed to fetch doctors');
  }
};

// Book Appointment Function
const bookAppointment = async (appointmentData) => {
  try {
    const response = await axios.post(`${API_BASE_URLS.appointment}/appointments`, appointmentData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Failed to book appointment');
  }
};
```

### Python Integration

```python
import requests
import json

class HealthcareAPI:
    def __init__(self, base_urls):
        self.auth_url = base_urls['auth']
        self.user_url = base_urls['user']
        self.doctor_url = base_urls['doctor']
        self.appointment_url = base_urls['appointment']
        self.token = None
    
    def login(self, email, password):
        """Authenticate user and store token"""
        response = requests.post(
            f"{self.auth_url}/login",
            json={"email": email, "password": password}
        )
        
        if response.status_code == 200:
            data = response.json()
            self.token = data['token']
            return data
        else:
            raise Exception(f"Login failed: {response.json().get('detail', 'Unknown error')}")
    
    def get_headers(self):
        """Get headers with authentication"""
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f"Bearer {self.token}"
        return headers
    
    def get_doctors(self, specialization=None):
        """Get list of doctors with optional specialization filter"""
        params = {}
        if specialization:
            params['specialization'] = specialization
        
        response = requests.get(
            f"{self.doctor_url}/doctors",
            headers=self.get_headers(),
            params=params
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"Failed to fetch doctors: {response.json().get('detail', 'Unknown error')}")
    
    def book_appointment(self, appointment_data):
        """Create new appointment"""
        response = requests.post(
            f"{self.appointment_url}/appointments",
            json=appointment_data,
            headers=self.get_headers()
        )
        
        if response.status_code == 201:
            return response.json()
        else:
            raise Exception(f"Failed to book appointment: {response.json().get('detail', 'Unknown error')}")

# Usage Example
api = HealthcareAPI({
    'auth': 'http://localhost:8001',
    'user': 'http://localhost:8002',
    'doctor': 'http://localhost:8003',
    'appointment': 'http://localhost:8004'
})

# Login
user_data = api.login('user@example.com', 'password123')
print(f"Logged in as: {user_data['first_name']}")

# Get doctors
doctors = api.get_doctors(specialization='Cardiology')
print(f"Found {len(doctors)} cardiologists")

# Book appointment
appointment = api.book_appointment({
    'patient_id': user_data['uid'],
    'doctor_id': doctors[0]['id'],
    'appointment_date': '2024-01-15',
    'start_time': '10:00',
    'end_time': '10:30',
    'reason': 'Regular checkup'
})
print(f"Appointment booked: {appointment['id']}")
```

## Testing

### Postman Collection

Import the following Postman collection for testing all endpoints:

```json
{
  "info": {
    "name": "Healthcare Appointment System",
    "description": "API collection for healthcare appointment system"
  },
  "variable": [
    {
      "key": "auth_url",
      "value": "http://localhost:8001"
    },
    {
      "key": "user_url",
      "value": "http://localhost:8002"
    },
    {
      "key": "doctor_url",
      "value": "http://localhost:8003"
    },
    {
      "key": "appointment_url",
      "value": "http://localhost:8004"
    },
    {
      "key": "jwt_token",
      "value": ""
    }
  ],
  "item": [
    {
      "name": "Authentication",
      "item": [
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"john.doe@example.com\",\n  \"password\": \"password123\"\n}"
            },
            "url": {
              "raw": "{{auth_url}}/login"
            }
          }
        }
      ]
    }
  ]
}
```

### cURL Examples

```bash
# Login
curl -X POST http://localhost:8001/login \
  -H "Content-Type: application/json" \
  -d '{"email": "john.doe@example.com", "password": "password123"}'

# Get Doctors
curl -X GET http://localhost:8003/doctors \
  -H "Authorization: Bearer <jwt_token>"

# Create Appointment
curl -X POST http://localhost:8004/appointments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt_token>" \
  -d '{
    "patient_id": 1,
    "doctor_id": 2,
    "appointment_date": "2024-01-15",
    "start_time": "10:00",
    "end_time": "10:30",
    "reason": "Regular checkup"
  }'
```

## Rate Limiting

Currently, the system does not implement strict rate limiting. However, recommended limits for production:

- **Authentication endpoints**: 5 requests per minute per IP
- **Data endpoints**: 100 requests per minute per authenticated user
- **Search endpoints**: 20 requests per minute per IP

## WebSocket Integration (Future)

Real-time notifications can be implemented using WebSocket connections:

```javascript
// WebSocket Connection for Real-time Updates
const ws = new WebSocket('ws://localhost:8005/ws');

ws.onopen = function(event) {
  console.log('Connected to notification service');
};

ws.onmessage = function(event) {
  const notification = JSON.parse(event.data);
  handleNotification(notification);
};

// Handle different notification types
function handleNotification(notification) {
  switch(notification.type) {
    case 'appointment_created':
      showNotification('New appointment booked', 'success');
      break;
    case 'appointment_cancelled':
      showNotification('Appointment cancelled', 'warning');
      break;
    case 'appointment_reminder':
      showNotification('Appointment reminder', 'info');
      break;
  }
}
```

## Security Considerations

### HTTPS in Production
Always use HTTPS URLs in production:
- `https://auth-service-xxxx.onrender.com`
- `https://user-service-xxxx.onrender.com`
- etc.

### Token Security
- Store JWT tokens securely (HttpOnly cookies recommended)
- Implement token refresh mechanism
- Set appropriate expiration times
- Validate tokens on every request

### Input Validation
- All inputs are validated using Pydantic models
- SQL injection prevented through parameterized queries
- XSS protection through input sanitization

## Support

For API integration support:
1. Check the interactive API documentation at `http://localhost:8001/docs`
2. Review error messages for specific issues
3. Test endpoints using provided examples
4. Ensure proper authentication headers are included

## Changelog

### v1.0.0 (Current)
- Initial API release
- Basic CRUD operations for all entities
- JWT authentication
- Role-based access control
- Real-time availability checking

### Planned Features
- WebSocket notifications
- Advanced filtering and search
- Bulk operations
- Analytics endpoints
- Integration APIs for third-party systems
