# Deployment Guide - Healthcare Appointment System

## Option 1: Render.com (Recommended)

### Prerequisites
- GitHub account
- Render.com account (free tier available)

### Step 1: Push Code to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/healthcare-appointment-system.git
git push -u origin main
```

### Step 2: Deploy PostgreSQL Database
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "PostgreSQL"
3. Fill in:
   - Name: `healthcare-db`
   - Database Name: `healthcare`
   - User: `healthcare_user`
   - Select free tier
4. Click "Create Database"
5. **Save the Internal Database URL** - you'll need it

### Step 3: Deploy Backend Services

#### Auth Service (Port 8001)
1. Click "New +" → "Web Service"
2. Connect your GitHub repo
3. Configure:
   - Name: `healthcare-auth-service`
   - Root Directory: `backend/services/auth-service`
   - Runtime: `Python 3`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add Environment Variables:
   ```
   DATABASE_URL=<your_db_url_from_step2>
   JWT_SECRET_KEY=your-secret-key-here
   ```
5. Click "Create Web Service"

#### Repeat for other services:
- **User Service** (port 8002): `backend/services/user-service`
- **Doctor Service** (port 8003): `backend/services/doctor-service`
- **Appointment Service** (port 8004): `backend/services/appointment-service`
- **Notification Service** (port 8005): `backend/services/notification-service`

### Step 4: Deploy Frontend
1. Click "New +" → "Static Site"
2. Connect GitHub repo
3. Configure:
   - Name: `healthcare-frontend`
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
4. Add Environment Variables:
   ```
   VITE_API_URL=https://healthcare-auth-service.onrender.com
   ```
5. Click "Create Static Site"

### Step 5: Update CORS and API URLs
Update each backend service to allow your frontend domain in CORS settings.

---

## Option 2: Railway.app

### Step 1: Deploy with Railway
1. Go to [Railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repo
4. Railway will auto-detect Dockerfiles

### Step 2: Add PostgreSQL
1. Click "New" → "Database" → "PostgreSQL"
2. Railway will automatically inject `DATABASE_URL`

### Step 3: Configure Services
For each service, set:
- Root directory in settings
- Environment variables

---

## Option 3: Firebase (Requires Rewrite)

If you want to use Firebase/Firestore, you would need to:
1. Replace PostgreSQL with Firestore
2. Rewrite all backend services to use Firestore instead of SQLAlchemy
3. Use Firebase Auth instead of custom JWT
4. Deploy frontend to Firebase Hosting

**Not recommended** unless you want to rebuild the backend.

---

## Recommended: Use Render.com
- ✅ Easy to set up
- ✅ Free tier available
- ✅ Supports PostgreSQL
- ✅ Supports multiple services
- ✅ No code changes required

## After Deployment
1. Run database migrations (create tables)
2. Test all endpoints
3. Update frontend API URLs to point to Render services
