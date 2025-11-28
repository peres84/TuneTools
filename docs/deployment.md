# TuneTools Deployment Guide

Complete guide for deploying TuneTools to production.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Supabase Setup](#supabase-setup)
3. [Backend Deployment](#backend-deployment)
4. [Frontend Deployment](#frontend-deployment)
5. [External Services Configuration](#external-services-configuration)
6. [Environment Variables Reference](#environment-variables-reference)
7. [Post-Deployment Verification](#post-deployment-verification)

---

## Prerequisites

Before deploying, ensure you have:

- Supabase account (https://supabase.com)
- Backend hosting platform account (Render, Railway, or similar)
- Frontend hosting platform account (Vercel, Netlify, or similar)
- All required API keys (see External Services Configuration)

---

## Supabase Setup

### 1. Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Choose organization: `kiroween_hckthn`
4. Project name: `tune_tools_db`
5. Database password: (save this securely)
6. Region: `eu-west-1` (or closest to your users)
7. Click "Create new project"

### 2. Apply Database Migrations

**Option A: Using Supabase Dashboard (Recommended)**

1. Go to SQL Editor in Supabase Dashboard
2. Run each migration file in order:
   - `supabase/migrations/20251125000001_create_user_profiles.sql`
   - `supabase/migrations/20251125000002_create_user_preferences.sql`
   - `supabase/migrations/20251125000003_create_calendar_integrations.sql`
   - `supabase/migrations/20251125000004_create_albums.sql`
   - `supabase/migrations/20251125000005_create_songs.sql`
   - `supabase/migrations/20251125000006_create_storage_buckets.sql`

**Option B: Using Supabase CLI**

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref lwkeiqewoptaokqyzrrw

# Apply migrations
supabase db push
```

### 3. Get Supabase Credentials

1. Go to Project Settings > API
2. Copy the following:
   - **Project URL**: `https://lwkeiqewoptaokqyzrrw.supabase.co`
   - **Anon/Public Key**: For frontend
   - **Service Role Key**: For backend (keep secret!)
3. Go to Project Settings > API > JWT Settings
4. Copy **JWT Secret**: For backend token validation

### 4. Verify Storage Buckets

1. Go to Storage in Supabase Dashboard
2. Verify two buckets exist:
   - `audio_files` (Private)
   - `vinyl_disks` (Public)
3. Check RLS policies are enabled

---

## Backend Deployment

### Recommended Platform: Render.com

#### 1. Prepare Repository

Ensure your repository has:
- `src/backend/` directory
- `requirements.txt` in project root
- `.gitignore` excluding `.env` files

#### 2. Create Render Web Service

1. Go to https://render.com/dashboard
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `tunetools-backend`
   - **Region**: Same as Supabase (eu-west-1)
   - **Branch**: `main`
   - **Root Directory**: `src/backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r ../../requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: `Starter` (or higher for production)

#### 3. Set Environment Variables

In Render dashboard, add all environment variables from [Environment Variables Reference](#environment-variables-reference).

**Critical Variables:**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET`
- `FRONTEND_URL` (update after frontend deployment)
- All API keys

#### 4. Deploy

1. Click "Create Web Service"
2. Wait for deployment to complete
3. Copy the service URL (e.g., `https://tunetools-backend.onrender.com`)

---

## Frontend Deployment

### Recommended Platform: Vercel

#### 1. Prepare Repository

Ensure `src/frontend/` has:
- `package.json`
- `vite.config.ts`
- Build output configured for `dist/`

#### 2. Deploy to Vercel

1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `src/frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

#### 3. Set Environment Variables

In Vercel dashboard, add:

```env
VITE_SUPABASE_URL=https://lwkeiqewoptaokqyzrrw.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_API_BASE_URL=https://tunetools-backend.onrender.com
```

#### 4. Deploy

1. Click "Deploy"
2. Wait for deployment
3. Copy the deployment URL (e.g., `https://tunetools.vercel.app`)

#### 5. Update Backend CORS

Go back to Render and update `FRONTEND_URL`:
```env
FRONTEND_URL=https://tunetools.vercel.app
```

Redeploy backend for CORS changes to take effect.

---

## External Services Configuration

### Required Services

#### 1. RunPod (Audio Generation) - **CRITICAL**

**Purpose**: YuE model inference for song generation

**Setup:**
1. Sign up at https://www.runpod.io
2. Go to Console → Serverless
3. Create new endpoint:
   - **Name**: `yue-song-generator`
   - **Docker Image**: Your built image (see `tests/runpod_severless_ep/Dockerfile`)
   - **GPU**: RTX 4090 or similar
   - **Container Disk**: 40GB minimum
   - **Execution Timeout**: 900 seconds (15 minutes)
   - **Idle Timeout**: 90 seconds
4. Copy **API Key** and **Endpoint ID**

**Environment Variables:**
```env
RUNPOD_API_KEY=your_runpod_api_key
ENDPOINT_ID=your_endpoint_id
```

**Cost Estimate**: ~$0.09-0.23 per song (7-12 minutes on RTX 4090)

**Documentation**: See `docs/runpod_setup.md`

#### 2. OpenWeather API (Weather Data)

**Purpose**: Fetch weather data for song context

**Setup:**
1. Sign up at https://openweathermap.org
2. Go to API Keys
3. Copy your API key

**Environment Variable:**
```env
OPENWEATHER_API_KEY=your_openweather_key
```

**Free Tier**: 1,000 calls/day

#### 3. News APIs (News Aggregation)

**Primary: NewsAPI**

**Setup:**
1. Sign up at https://newsapi.org
2. Copy API key

**Environment Variable:**
```env
NEWSAPI_API_KEY=your_newsapi_key
```

**Free Tier**: 100 requests/day

**Optional Fallbacks:**

**SerpAPI** (https://serpapi.com):
```env
SERPAPI_API_KEY=your_serpapi_key
```

**WorldNewsAPI** (https://worldnewsapi.com):
```env
WORLDNEWS_API_KEY=your_worldnews_key
```

#### 4. LLM APIs (Lyrics Generation)

**Primary: OpenAI GPT-4**

**Setup:**
1. Sign up at https://platform.openai.com
2. Go to API Keys
3. Create new key

**Environment Variable:**
```env
OPENAI_API_KEY=sk-your_openai_key
```

**Fallback: Google Gemini**

**Setup:**
1. Go to https://aistudio.google.com/app/apikey
2. Create API key

**Environment Variable:**
```env
GEMINI_API_KEY=your_gemini_key
```

**Note**: At least one LLM API is required. Gemini is free tier available.

#### 5. Google Calendar OAuth (Optional)

**Purpose**: Sync user calendar events for song context

**Setup:**
1. Go to https://console.cloud.google.com
2. Create new project or select existing
3. Enable Google Calendar API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: `https://tunetools-backend.onrender.com/api/calendar/callback`
5. Copy Client ID and Client Secret

**Environment Variables:**
```env
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=https://tunetools-backend.onrender.com/api/calendar/callback
GOOGLE_CLOUD_API_KEY=your_google_cloud_key
```

**Note**: Calendar integration is optional and can be skipped during onboarding.

---

## Environment Variables Reference

### Backend Environment Variables

**File**: `src/backend/.env` (local) or Render Environment Variables (production)

```env
# Supabase Configuration (REQUIRED)
SUPABASE_URL=https://lwkeiqewoptaokqyzrrw.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret
SUPABASE_PROJECT_ID=lwkeiqewoptaokqyzrrw

# CORS Configuration (REQUIRED)
FRONTEND_URL=https://tunetools.vercel.app

# RunPod Credentials (REQUIRED for audio generation)
RUNPOD_API_KEY=your_runpod_api_key
ENDPOINT_ID=your_endpoint_id

# Weather API (REQUIRED)
OPENWEATHER_API_KEY=your_openweather_key

# News APIs (At least one REQUIRED)
NEWSAPI_API_KEY=your_newsapi_key
SERPAPI_API_KEY=your_serpapi_key (optional)
WORLDNEWS_API_KEY=your_worldnews_key (optional)

# LLM APIs (At least one REQUIRED)
OPENAI_API_KEY=sk-your_openai_key
GEMINI_API_KEY=your_gemini_key

# Google Calendar OAuth (OPTIONAL)
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=https://tunetools-backend.onrender.com/api/calendar/callback
GOOGLE_CLOUD_API_KEY=your_google_cloud_key
```

### Frontend Environment Variables

**File**: `src/frontend/.env` (local) or Vercel Environment Variables (production)

```env
# Supabase Configuration (REQUIRED)
VITE_SUPABASE_URL=https://lwkeiqewoptaokqyzrrw.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# Backend API URL (REQUIRED)
VITE_API_BASE_URL=https://tunetools-backend.onrender.com
```

**Important**: All frontend variables MUST have `VITE_` prefix (Vite requirement).

---

## Post-Deployment Verification

### 1. Backend Health Check

```bash
curl https://tunetools-backend.onrender.com/health
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

### 2. Frontend Access

1. Visit `https://tunetools.vercel.app`
2. Verify landing page loads
3. Test signup/login flow
4. Check browser console for errors

### 3. Database Connection

1. Go to Supabase Dashboard
2. Check Table Editor
3. Verify tables exist and RLS is enabled

### 4. Storage Buckets

1. Go to Supabase Storage
2. Verify `audio_files` and `vinyl_disks` buckets exist
3. Test file upload (create test song)

### 5. API Endpoints

Test key endpoints:

```bash
# Get user profile (requires auth token)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://tunetools-backend.onrender.com/api/user/profile

# Get albums
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://tunetools-backend.onrender.com/api/albums/list
```

### 6. Song Generation (Full Pipeline Test)

1. Login to frontend
2. Complete onboarding
3. Click "Generate Your Daily Song"
4. Monitor progress (7-12 minutes)
5. Verify song plays and displays correctly

---

## Troubleshooting

### Backend Issues

**Issue**: `502 Bad Gateway` or `503 Service Unavailable`
- **Solution**: Check Render logs, verify environment variables are set

**Issue**: `Database connection failed`
- **Solution**: Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are correct

**Issue**: `JWT validation failed`
- **Solution**: Verify `SUPABASE_JWT_SECRET` matches your Supabase project

### Frontend Issues

**Issue**: `CORS error` in browser console
- **Solution**: Verify `FRONTEND_URL` is set correctly in backend environment variables

**Issue**: `Failed to fetch` errors
- **Solution**: Verify `VITE_API_BASE_URL` points to correct backend URL

### Song Generation Issues

**Issue**: `RunPod timeout` or `Generation failed`
- **Solution**: Verify `RUNPOD_API_KEY` and `ENDPOINT_ID` are correct
- **Solution**: Check RunPod endpoint is active and has GPU workers

**Issue**: `LLM generation failed`
- **Solution**: Verify at least one LLM API key is valid (OpenAI or Gemini)

---

## Monitoring and Maintenance

### Logs

**Backend Logs**: Render Dashboard → Logs tab
**Frontend Logs**: Vercel Dashboard → Deployments → View Function Logs
**Database Logs**: Supabase Dashboard → Logs

### Cost Monitoring

**RunPod**: Console → Billing (monitor GPU usage)
**Supabase**: Dashboard → Usage (monitor database size, bandwidth)
**API Services**: Check respective dashboards for usage

### Scaling Considerations

**Backend**:
- Upgrade Render instance type for more concurrent requests
- Consider Redis for caching (news, weather)

**Database**:
- Monitor Supabase usage limits
- Upgrade plan if approaching limits

**RunPod**:
- Increase max workers for concurrent song generation
- Consider dedicated GPU for lower latency

---

## Security Best Practices

1. **Never commit `.env` files** to version control
2. **Rotate API keys** regularly
3. **Use service role key only in backend** (never expose to frontend)
4. **Enable RLS policies** on all Supabase tables
5. **Monitor API usage** for unusual activity
6. **Set up rate limiting** (already configured in backend)
7. **Use HTTPS only** for all services

---

## Rollback Procedure

If deployment fails:

1. **Revert to previous deployment** in Vercel/Render
2. **Check logs** for error details
3. **Verify environment variables** haven't changed
4. **Test locally** before redeploying

---

## Support and Resources

- **Supabase Docs**: https://supabase.com/docs
- **Render Docs**: https://render.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **RunPod Docs**: https://docs.runpod.io
- **Project Docs**: See `/docs` folder for API documentation

---

## Deployment Checklist

- [ ] Supabase project created
- [ ] All migrations applied
- [ ] Storage buckets configured
- [ ] Backend deployed to Render
- [ ] Frontend deployed to Vercel
- [ ] All environment variables set
- [ ] RunPod endpoint configured
- [ ] API keys obtained and tested
- [ ] Health check passes
- [ ] Test song generation works
- [ ] CORS configured correctly
- [ ] Monitoring set up
- [ ] Documentation updated with production URLs

---

**Last Updated**: November 29, 2025
**Version**: 1.0.0
