from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import socketio
import requests
import os

app = FastAPI(title="Notification Service", version="1.0.0")

# Socket.io server
sio = socketio.AsyncServer(
    cors_allowed_origins="*",
    async_mode="asgi"
)

# Wrap FastAPI with Socket.io
socket_app = socketio.ASGIApp(sio, app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://localhost:8001")

# In-memory storage for notifications (use Redis in production)
notifications_db = {}
user_sockets = {}

class NotificationCreate(BaseModel):
    user_id: str
    title: str
    message: str
    type: str  # appointment_booked, appointment_confirmed, appointment_cancelled, reminder, etc.
    data: Optional[dict] = None

class NotificationResponse(BaseModel):
    id: str
    user_id: str
    title: str
    message: str
    type: str
    data: Optional[dict]
    is_read: bool
    created_at: datetime

# Token verification
def verify_token(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    token = authorization.split(" ")[1]
    try:
        # Call Auth Service to verify JWT token (new endpoint format)
        response = requests.get(
            f"{AUTH_SERVICE_URL}/verify-token",
            params={"token": token},
            timeout=5
        )
        if response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid token")
        return response.json()
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token verification failed: {str(e)}")

# Socket.io events
@sio.event
async def connect(sid, environ, auth):
    """Handle client connection"""
    user_id = auth.get("user_id") if auth else None
    if user_id:
        user_sockets[user_id] = sid
        await sio.save_session(sid, {"user_id": user_id})
        print(f"User {user_id} connected with sid {sid}")
    else:
        print(f"Anonymous client connected: {sid}")

@sio.event
async def disconnect(sid):
    """Handle client disconnection"""
    session = await sio.get_session(sid)
    user_id = session.get("user_id") if session else None
    if user_id and user_id in user_sockets:
        del user_sockets[user_id]
    print(f"Client disconnected: {sid}")

@sio.event
async def join_room(sid, data):
    """Join a room (e.g., user-specific notifications)"""
    user_id = data.get("user_id")
    if user_id:
        sio.enter_room(sid, user_id)
        await sio.emit("joined", {"room": user_id}, to=sid)

@sio.event
async def leave_room(sid, data):
    """Leave a room"""
    user_id = data.get("user_id")
    if user_id:
        sio.leave_room(sid, user_id)

# HTTP endpoints
@app.post("/send")
async def send_notification(notification: NotificationCreate):
    """Send notification to a user (HTTP endpoint for other services)"""
    notification_id = f"{notification.user_id}_{datetime.utcnow().timestamp()}"
    
    notification_data = {
        "id": notification_id,
        "user_id": notification.user_id,
        "title": notification.title,
        "message": notification.message,
        "type": notification.type,
        "data": notification.data or {},
        "is_read": False,
        "created_at": datetime.utcnow()
    }
    
    # Store notification
    if notification.user_id not in notifications_db:
        notifications_db[notification.user_id] = []
    notifications_db[notification.user_id].append(notification_data)
    
    # Send real-time notification if user is online
    if notification.user_id in user_sockets:
        sid = user_sockets[notification.user_id]
        await sio.emit("notification", notification_data, to=sid)
        print(f"Real-time notification sent to {notification.user_id}")
    
    # Also emit to room for multi-device support
    await sio.emit("notification", notification_data, room=notification.user_id)
    
    return {"message": "Notification sent", "id": notification_id}

@app.post("/broadcast")
async def broadcast_notification(notification: NotificationCreate):
    """Broadcast notification to all users"""
    await sio.emit("broadcast", {
        "title": notification.title,
        "message": notification.message,
        "type": notification.type,
        "data": notification.data or {},
        "created_at": datetime.utcnow().isoformat()
    })
    return {"message": "Broadcast sent"}

@app.get("/notifications/{user_id}", response_model=List[NotificationResponse])
async def get_notifications(
    user_id: str,
    unread_only: bool = False,
    auth_user: dict = Depends(verify_token)
):
    """Get all notifications for a user"""
    # Verify user can access their own notifications
    if auth_user["uid"] != user_id:
        raise HTTPException(status_code=403, detail="Can only access own notifications")
    
    notifications = notifications_db.get(user_id, [])
    
    if unread_only:
        notifications = [n for n in notifications if not n["is_read"]]
    
    # Sort by created_at descending
    notifications = sorted(notifications, key=lambda x: x["created_at"], reverse=True)
    
    return notifications

@app.post("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    auth_user: dict = Depends(verify_token)
):
    """Mark a notification as read"""
    user_id = auth_user["uid"]
    notifications = notifications_db.get(user_id, [])
    
    for notification in notifications:
        if notification["id"] == notification_id:
            notification["is_read"] = True
            return {"message": "Notification marked as read"}
    
    raise HTTPException(status_code=404, detail="Notification not found")

@app.post("/notifications/{user_id}/read-all")
async def mark_all_notifications_read(
    user_id: str,
    auth_user: dict = Depends(verify_token)
):
    """Mark all notifications as read for a user"""
    if auth_user["uid"] != user_id:
        raise HTTPException(status_code=403, detail="Can only modify own notifications")
    
    notifications = notifications_db.get(user_id, [])
    for notification in notifications:
        notification["is_read"] = True
    
    return {"message": f"All notifications marked as read for user {user_id}"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "notification",
        "connected_users": len(user_sockets)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(socket_app, host="0.0.0.0", port=8005)
