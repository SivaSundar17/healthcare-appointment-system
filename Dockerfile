ARG SERVICE_PATH=backend/services/auth-service
ARG PORT=8001

FROM python:3.11-slim

ARG SERVICE_PATH
ARG PORT

WORKDIR /app

COPY ${SERVICE_PATH}/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY ${SERVICE_PATH}/ .
EXPOSE ${PORT}

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT}"]
