# Render Setup Guide (Quick Start)

## TL;DR - 3 Steps to Deploy

### 1. Connect GitHub to Render
- Go to [Render Dashboard](https://dashboard.render.com/)
- New → Web Service
- Connect repository: **TuneTools**

### 2. Set Root Directory
⭐ **CRITICAL:** Set **Root Directory** to `src/backend`

This tells Render to use `src/backend/render.yaml` and makes all paths relative to the backend folder.

### 3. Add Environment Variables
Copy from `.env.production.example` and update:
- `FRONTEND_URL` → Your Vercel URL
- `GOOGLE_REDIRECT_URI` → Your Render URL + `/api/calendar/callback`

---

## Detailed Configuration

### Root Directory Setting

```
┌─────────────────────────────────────┐
│ Root Directory                      │
│ ┌─────────────────────────────────┐ │
│ │ src/backend                     │ │ ← Enter this
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Why this matters:**
- ✅ Render finds `src/backend/render.yaml` automatically
- ✅ Paths in render.yaml work correctly (`requirements.txt` not `src/backend/requirements.txt`)
- ✅ Only backend files are deployed (faster builds)
- ✅ Cleaner configuration

### Build Settings (Auto-Detected)

Render reads from `src/backend/render.yaml`:

```yaml
Build Command: pip install --upgrade pip && pip install -r requirements.txt
Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT --workers 1 --proxy-headers --forwarded-allow-ips='*'
```

### Environment Variables

**Required:**
```bash
SUPABASE_URL=https://lwkeiqewoptaokqyzrrw.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_key
SUPABASE_JWT_SECRET=your_secret
SUPABASE_PROJECT_ID=lwkeiqewoptaokqyzrrw
RUNPOD_API_KEY=your_key
ENDPOINT_ID=your_endpoint
```

**Production-Specific (Update these!):**
```bash
FRONTEND_URL=https://your-app.vercel.app
GOOGLE_REDIRECT_URI=https://your-app.onrender.com/api/calendar/callback
```

**API Keys (same as local):**
```bash
OPENWEATHER_API_KEY=your_key
SERPAPI_API_KEY=your_key
NEWSAPI_API_KEY=your_key
WORLDNEWS_API_KEY=your_key
GOOGLE_CLOUD_API_KEY=your_key
GOOGLE_CLIENT_ID=your_id
GOOGLE_CLIENT_SECRET=your_secret
OPENAI_API_KEY=your_key
GEMINI_API_KEY=your_key
```

---

## Visual Guide

### Step 1: Create Web Service
![Create Service](https://render.com/docs/images/create-web-service.png)

### Step 2: Configure Root Directory
```
Repository: TuneTools
Branch: main
Root Directory: src/backend  ← IMPORTANT!
Runtime: Python 3
```

### Step 3: Verify Auto-Detection
Render should show:
```
✅ Found render.yaml
✅ Build Command: pip install --upgrade pip && pip install -r requirements.txt
✅ Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT ...
```

### Step 4: Add Environment Variables
Click "Environment" tab → Add all variables from list above

### Step 5: Deploy
Click "Create Web Service" → Monitor logs → Get URL

---

## After Deployment

### 1. Test Health Check
```bash
curl https://your-app.onrender.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected",
  "services": {
    "supabase": "ok",
    "runpod": "ok"
  }
}
```

### 2. Test API Docs
Visit: `https://your-app.onrender.com/docs`

### 3. Update External Services

**Google OAuth:**
- Add redirect URI: `https://your-app.onrender.com/api/calendar/callback`

**Supabase:**
- Update Site URL: `https://your-app.vercel.app`
- Add redirect URL: `https://your-app.vercel.app/**`

### 4. Deploy Frontend
Update `VITE_API_BASE_URL` in Vercel to your Render URL

---

## Troubleshooting

### "render.yaml not found"
**Problem:** Render can't find configuration  
**Solution:** Verify Root Directory is set to `src/backend`

### "requirements.txt not found"
**Problem:** Wrong path in build command  
**Solution:** With Root Directory = `src/backend`, path should be just `requirements.txt`

### "main.py not found"
**Problem:** Wrong start command  
**Solution:** With Root Directory = `src/backend`, no `cd` needed, just `uvicorn main:app`

### CORS Errors
**Problem:** Frontend can't connect  
**Solution:** Set `FRONTEND_URL` environment variable in Render

### Build Succeeds but Service Won't Start
**Problem:** Missing environment variables  
**Solution:** Check Render logs, add missing variables

---

## Comparison: With vs Without Root Directory

### ✅ With Root Directory (Recommended)

**Render Settings:**
```
Root Directory: src/backend
```

**render.yaml:**
```yaml
buildCommand: pip install -r requirements.txt
startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT
```

**Pros:**
- Clean paths
- Faster builds
- Isolated deployment
- Standard practice

---

### ❌ Without Root Directory (Not Recommended)

**Render Settings:**
```
Root Directory: (empty)
```

**render.yaml (must be at repo root):**
```yaml
buildCommand: pip install -r src/backend/requirements.txt
startCommand: cd src/backend && uvicorn main:app --host 0.0.0.0 --port $PORT
```

**Cons:**
- Messy paths
- Processes entire repo
- Extra `cd` commands
- Less maintainable

---

## Local Development

Before deploying, test locally:

**Windows:**
```cmd
cd src/backend
start.bat
```

**Linux/Mac:**
```bash
cd src/backend
chmod +x start.sh
./start.sh
```

**Docker Compose:**
```bash
cd src/backend
docker-compose up -d
docker-compose logs -f
```

---

## Related Documentation

- **Complete Deployment Guide:** `deployment-checklist.md`
- **Quick Reference:** `deployment-quick-reference.md`
- **Backend Render Guide:** `../src/backend/RENDER-DEPLOYMENT.md`
- **Backend README:** `../src/backend/README.md`
