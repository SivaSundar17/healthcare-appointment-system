#!/bin/bash
set -e

echo "=== Starting Entrypoint Script ==="
echo "PYTHONPATH: $PYTHONPATH"
echo "DATABASE_URL set: $(if [ -n "$DATABASE_URL" ]; then echo 'YES'; else echo 'NO'; fi)"
echo "JWT_SECRET_KEY set: $(if [ -n "$JWT_SECRET_KEY" ]; then echo 'YES'; else echo 'NO'; fi)"

# Create symlinks for service directories (replace hyphens with underscores for Python imports)
echo "=== Creating Python-compatible symlinks ==="
cd /app
ln -sf auth-service auth_service
ln -sf doctor-service doctor_service
ln -sf appointment-service appointment_service
ln -sf user-service user_service
ln -sf notification-service notification_service

# Test database connection
echo "=== Testing Database Connection ==="
python3 -c "
import os
import sys
try:
    from sqlalchemy import create_engine, text
    db_url = os.environ.get('DATABASE_URL', 'NOT SET')
    if db_url != 'NOT SET':
        engine = create_engine(db_url)
        with engine.connect() as conn:
            result = conn.execute(text('SELECT 1'))
            print('Database connection: SUCCESS')
    else:
        print('DATABASE_URL not set!')
        sys.exit(1)
except Exception as e:
    print(f'Database connection: FAILED - {e}')
    sys.exit(1)
" || echo "Database test failed, but continuing..."

# Test imports for each service
echo "=== Testing Service Imports ==="
for service in auth_service doctor_service appointment_service user_service notification_service; do
    echo "Testing $service..."
    python3 -c "import sys; sys.path.insert(0, '/app'); from $service.main import app; print('$service: OK')" 2>&1 || echo "$service: FAILED - check logs"
done

echo "=== Starting Supervisord ==="
exec supervisord -c /etc/supervisor/conf.d/supervisord.conf
