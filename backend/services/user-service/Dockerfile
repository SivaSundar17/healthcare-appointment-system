FROM python:3.11-slim

WORKDIR /app

COPY backend/services/user-service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/services/user-service/main.py backend/services/user-service/models.py ./

EXPOSE 8002

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8002"]
