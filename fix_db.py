#!/usr/bin/env python3
"""Fix database column types from VARCHAR to INTEGER"""
import os
import sys

# Get DATABASE_URL from environment or use Render URL
# Set this before running: export DATABASE_URL='postgresql://...'
# Use your Render database URL directly
DATABASE_URL = 'postgresql://healthcare_user:0YXeJlTTYQSwFuIf6uau24tmqYSgKm54@dpg-d7uu4i77f7vs73d14b20-a.oregon-postgres.render.com/healthcare_xkpc'

# Or set via environment: export DATABASE_URL='your-url'
if os.getenv('DATABASE_URL'):
    DATABASE_URL = os.getenv('DATABASE_URL')

try:
    from sqlalchemy import create_engine, text
    
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        print("Connected to database. Fixing column types...")
        
        # Fix appointments table
        conn.execute(text("""
            ALTER TABLE appointments 
            ALTER COLUMN patient_id TYPE INTEGER USING patient_id::INTEGER,
            ALTER COLUMN doctor_id TYPE INTEGER USING doctor_id::INTEGER
        """))
        print("✓ Fixed appointments table")
        
        # Fix medical_records table
        conn.execute(text("""
            ALTER TABLE medical_records 
            ALTER COLUMN patient_id TYPE INTEGER USING patient_id::INTEGER,
            ALTER COLUMN doctor_id TYPE INTEGER USING doctor_id::INTEGER
        """))
        print("✓ Fixed medical_records table")
        
        conn.commit()
        print("\nDatabase fixed successfully!")
        
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
