FROM python:3.11-slim

WORKDIR /app

COPY backend/services/appointment-service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/services/appointment-service/main.py backend/services/appointment-service/models.py ./

EXPOSE 8004

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8004"]
