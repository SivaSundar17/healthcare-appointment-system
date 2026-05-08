-- Healthcare Appointment System - Initial Database Schema
-- Run this script to create all tables with proper structure
-- Uses PostgreSQL-only authentication (no Firebase)

-- Drop tables if they exist (in correct order due to dependencies)
DROP TABLE IF EXISTS appointment_history CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS medical_records CASCADE;
DROP TABLE IF EXISTS doctor_reviews CASCADE;
DROP TABLE IF EXISTS availability CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
DROP TABLE IF EXISTS doctors CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table (managed by auth-service)
-- This replaces Firebase authentication
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    password_hash VARCHAR NOT NULL,
    role VARCHAR NOT NULL CHECK (role IN ('patient', 'doctor', 'admin')),
    first_name VARCHAR,
    last_name VARCHAR,
    phone VARCHAR,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create doctors table (managed by doctor-service)
-- References users table for authentication
-- Using INTEGER id that references users.id (Full PostgreSQL with integer IDs)
CREATE TABLE doctors (
    id INTEGER PRIMARY KEY REFERENCES users(id),  -- users.id (integer from PostgreSQL)
    email VARCHAR,
    first_name VARCHAR,
    last_name VARCHAR,
    specialization VARCHAR,
    consultation_fee FLOAT,
    phone VARCHAR,
    is_active BOOLEAN DEFAULT TRUE,
    rating FLOAT DEFAULT 0.0,
    review_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create patients table (managed by user-service)
-- References users table for authentication
-- Using INTEGER id that references users.id (Full PostgreSQL with integer IDs)
CREATE TABLE patients (
    id INTEGER PRIMARY KEY REFERENCES users(id),  -- users.id (integer from PostgreSQL)
    email VARCHAR,
    first_name VARCHAR,
    last_name VARCHAR,
    phone VARCHAR,
    date_of_birth DATE,
    gender VARCHAR,
    address TEXT,
    blood_group VARCHAR,
    allergies TEXT,
    emergency_contact VARCHAR,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create availability table (managed by doctor-service)
CREATE TABLE availability (
    id SERIAL PRIMARY KEY,
    doctor_id VARCHAR,
    day_of_week INTEGER,
    start_time TIME,
    end_time TIME,
    is_available BOOLEAN DEFAULT TRUE,
    valid_from DATE,
    valid_to DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create appointments table (managed by appointment-service)
-- Note: No ForeignKey constraints to allow doctors to book appointments with other doctors
CREATE TABLE appointments (
    id SERIAL PRIMARY KEY,
    patient_id VARCHAR,
    doctor_id VARCHAR,
    appointment_date DATE,
    start_time TIME,
    end_time TIME,
    status VARCHAR DEFAULT 'scheduled',
    reason TEXT,
    notes TEXT,
    prescription TEXT,
    symptoms TEXT,
    diagnosis TEXT,
    amount FLOAT,
    payment_status VARCHAR DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cancelled_by VARCHAR,
    cancellation_reason TEXT
);

-- Create appointment_history table (managed by appointment-service)
CREATE TABLE appointment_history (
    id SERIAL PRIMARY KEY,
    appointment_id INTEGER REFERENCES appointments(id),
    status_from VARCHAR,
    status_to VARCHAR,
    changed_by VARCHAR,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create medical_records table (managed by user-service)
CREATE TABLE medical_records (
    id SERIAL PRIMARY KEY,
    patient_id VARCHAR,
    doctor_id VARCHAR,
    record_date DATE,
    diagnosis TEXT,
    prescription TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create doctor_reviews table (managed by doctor-service)
CREATE TABLE doctor_reviews (
    id SERIAL PRIMARY KEY,
    doctor_id VARCHAR,
    patient_id VARCHAR,
    rating INTEGER,
    review TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_availability_doctor_id ON availability(doctor_id);
CREATE INDEX idx_medical_records_patient_id ON medical_records(patient_id);
CREATE INDEX idx_doctor_reviews_doctor_id ON doctor_reviews(doctor_id);

-- Add comments for documentation
COMMENT ON TABLE appointments IS 'No ForeignKey constraints to patients/doctors - allows doctors to book appointments with other doctors';
COMMENT ON COLUMN appointments.patient_id IS 'References user ID - can be patient or doctor';
COMMENT ON COLUMN appointments.doctor_id IS 'References doctor ID from doctor-service';
COMMENT ON TABLE users IS 'Central authentication table - replaces Firebase';
COMMENT ON COLUMN users.role IS 'User role: patient, doctor, or admin';
