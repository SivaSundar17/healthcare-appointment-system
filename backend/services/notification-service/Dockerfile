FROM python:3.11-slim

WORKDIR /app

COPY backend/services/notification-service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/services/notification-service/main.py ./

EXPOSE 8005

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8005"]
