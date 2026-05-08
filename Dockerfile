ARG SERVICE_NAME=auth-service
FROM python:3.11-slim

WORKDIR /app

COPY backend/services/${SERVICE_NAME}/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/services/${SERVICE_NAME}/ .
ARG PORT=8001
EXPOSE ${PORT}

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "${PORT}"]
