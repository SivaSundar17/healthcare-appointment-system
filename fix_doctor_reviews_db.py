#!/usr/bin/env python3
"""
Script to fix doctor_reviews table schema by changing VARCHAR to INTEGER for doctor_id and patient_id
"""

import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def fix_doctor_reviews_schema():
    """Fix doctor_reviews table schema to use INTEGER types"""
    
    # Get database URL from environment or use default
    database_url = os.getenv("DATABASE_URL", "postgresql://localhost:5432/postgres")
    
    try:
        # Connect to database
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()
        
        print("Connected to database successfully")
        
        # Check current schema
        cursor.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'doctor_reviews' 
            ORDER BY ordinal_position;
        """)
        
        columns = cursor.fetchall()
        print("\nCurrent doctor_reviews table schema:")
        for col in columns:
            print(f"  {col[0]}: {col[1]}")
        
        # Fix the schema by altering columns
        print("\nFixing schema...")
        
        # Drop existing data (since we're changing types, we need to clear the table)
        cursor.execute("DELETE FROM doctor_reviews")
        print("  - Cleared existing data")
        
        # Alter doctor_id column with explicit casting
        cursor.execute("ALTER TABLE doctor_reviews ALTER COLUMN doctor_id TYPE INTEGER USING doctor_id::integer")
        print("  - Changed doctor_id to INTEGER")
        
        # Alter patient_id column with explicit casting
        cursor.execute("ALTER TABLE doctor_reviews ALTER COLUMN patient_id TYPE INTEGER USING patient_id::integer")
        print("  - Changed patient_id to INTEGER")
        
        # Commit changes
        conn.commit()
        
        # Verify the changes
        cursor.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'doctor_reviews' 
            ORDER BY ordinal_position;
        """)
        
        new_columns = cursor.fetchall()
        print("\nUpdated doctor_reviews table schema:")
        for col in new_columns:
            print(f"  {col[0]}: {col[1]}")
        
        print("\n✅ Schema fixed successfully!")
        print("Note: Existing review data was cleared due to type conversion")
        
    except Exception as e:
        print(f"❌ Error fixing schema: {e}")
        if conn:
            conn.rollback()
        return False
        
    finally:
        if conn:
            cursor.close()
            conn.close()
            print("\nDatabase connection closed")
    
    return True

if __name__ == "__main__":
    print("Fixing doctor_reviews table schema...")
    fix_doctor_reviews_schema()
