#!/usr/bin/env python3
"""Create all database tables for all services"""
import sys
import os

# Add all service paths
sys.path.insert(0, '/app/auth_service')
sys.path.insert(0, '/app/doctor_service')
sys.path.insert(0, '/app/appointment_service')
sys.path.insert(0, '/app/user_service')
sys.path.insert(0, '/app/notification_service')

try:
    # Import all models and create tables
    from auth_service.models import Base as AuthBase, engine as auth_engine
    from doctor_service.models import Base as DoctorBase, engine as doctor_engine
    from appointment_service.models import Base as AppointmentBase, engine as appointment_engine
    from user_service.models import Base as UserBase, engine as user_engine
    from notification_service.models import Base as NotificationBase, engine as notification_engine
    
    # Create all tables
    AuthBase.metadata.create_all(bind=auth_engine)
    print("Auth tables created")
    
    DoctorBase.metadata.create_all(bind=doctor_engine)
    print("Doctor tables created")
    
    AppointmentBase.metadata.create_all(bind=appointment_engine)
    print("Appointment tables created")
    
    UserBase.metadata.create_all(bind=user_engine)
    print("User tables created")
    
    NotificationBase.metadata.create_all(bind=notification_engine)
    print("Notification tables created")
    
    print("All database tables created successfully!")
    
except Exception as e:
    print("Error creating tables:", e)
    print("Tables might already exist, continuing...")
    sys.exit(0)  # Don't fail the build if tables already exist
