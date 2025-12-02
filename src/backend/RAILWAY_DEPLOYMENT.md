# Railway Deployment Guide for TuneTools Backend

This guide will help you deploy the TuneTools FastAPI backend to Railway.

## 🚨 Common Issue: "Could not determine how to build the app"

**If you see this error**, it means Railway is looking at the wrong directory!

**Quick Fix:**
1. Go to Railway Dashboard → Your Service → **Settings**
2. Find **"Root Directory"** setting
3. Set it to: `src/backend`
4. Save and redeploy

See Step 2 below for detailed instructions.

## Prerequisites

- Railway account (sign up at https://railway.app)
- GitHub account (for connecting your repository)
- All required API keys and credentials

## Step 1: Prepare Your Repository

1. **Ensure all files are committed:**
   ```bash
   git add .
   git commit -m "Prepare for Railway deployment"
   git push origin main
   ```

2. **Verify Railway configuration files exist in `src/backend/`:**
   - ✅ `railway.json`
   - ✅ `railway.toml`
   - ✅ `Dockerfile`
   - ✅ `requirements.txt`

## Step 2: Create a New Railway Project

1. Go to https://railway.app/dashboard
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Authorize Railway to access your GitHub account
5. Select your **TuneTools** repository

### ⚠️ CRITICAL: Set Root Directory

**This is the most important step!** Railway needs to know your app is in `src/backend/`:

1. After selecting your repo, Railway will create the service
2. **Immediately** go to **Settings** tab
3. Scroll to **"Service Settings"** or **"Source"** section
4. Find **"Root Directory"** field
5. Set it to: `src/backend`
6. Click **"Save"** or **"Update"**
7. Railway will now detect your Dockerfile and Python app correctly

**Without this step, Railway will fail with "could not determine how to build the app"**

## Step 3: Configure Environment Variables

In the Railway dashboard, go to your project → **Variables** tab and add:

### Required Variables

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret

# API Keys
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=your-gemini-key

# RunPod Configuration
RUNPOD_API_KEY=your-runpod-key
ENDPOINT_ID=your-endpoint-id

# News APIs
SERPAPI_API_KEY=your-serpapi-key
NEWSAPI_KEY=your-newsapi-key

# Weather API
OPENWEATHER_API_KEY=your-openweather-key

# Google Calendar OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=https://your-backend.railway.app/api/calendar/callback

# Frontend URL (for CORS)
FRONTEND_URL=https://your-frontend.vercel.app

# Server Configuration (Railway provides PORT automatically)
# PORT is set by Railway, don't override it
```

### Optional Variables

```env
# Redis (if using)
REDIS_URL=redis://...

# Logging
LOG_LEVEL=INFO
```

## Step 4: Update Google OAuth Redirect URI

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **APIs & Services** → **Credentials**
3. Edit your OAuth 2.0 Client ID
4. Add your Railway backend URL to **Authorized redirect URIs**:
   ```
   https://your-backend.railway.app/api/calendar/callback
   ```
5. Save changes

## Step 5: Deploy

Railway will automatically deploy when you push to your repository. You can also:

1. **Manual Deploy:** Click **"Deploy"** in the Railway dashboard
2. **View Logs:** Click on your service → **Deployments** → **View Logs**
3. **Check Health:** Visit `https://your-backend.railway.app/health`

## Step 6: Get Your Backend URL

1. In Railway dashboard, go to your service
2. Click **"Settings"** tab
3. Under **"Networking"**, click **"Generate Domain"**
4. Copy your Railway URL (e.g., `https://tunetools-backend-production.up.railway.app`)

## Step 7: Update Frontend Configuration

Update your frontend environment variables to point to the Railway backend:

```env
# In your frontend .env or Vercel environment variables
VITE_API_BASE_URL=https://your-backend.railway.app
```

## Step 8: Verify Deployment

Test your deployment:

```bash
# Health check
curl https://your-backend.railway.app/health

# Root endpoint
curl https://your-backend.railway.app/

# API docs
# Visit: https://your-backend.railway.app/docs
```

## Troubleshooting

### Build Fails

**Issue:** Docker build fails
**Solution:** 
- Check Railway build logs
- Verify `Dockerfile` path in `railway.json`
- Ensure all dependencies are in `requirements.txt`

### Application Crashes

**Issue:** App starts but crashes immediately
**Solution:**
- Check Railway logs for errors
- Verify all environment variables are set
- Check Supabase connection
- Verify API keys are valid

### CORS Errors

**Issue:** Frontend can't connect to backend
**Solution:**
- Add your frontend URL to `FRONTEND_URL` environment variable
- Check CORS configuration in `main.py`
- Verify the frontend is using the correct backend URL

### Port Issues

**Issue:** Application not responding
**Solution:**
- Railway automatically sets the `PORT` environment variable
- Don't override `PORT` in your environment variables
- The Dockerfile uses `$PORT` from Railway

### Database Connection Issues

**Issue:** Can't connect to Supabase
**Solution:**
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- Check Supabase project is active
- Verify network access in Supabase settings

## Railway CLI (Optional)

Install Railway CLI for local testing and deployment:

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Run locally with Railway environment
railway run python src/backend/main.py

# Deploy from CLI
railway up
```

## Monitoring & Logs

### View Logs
```bash
# Using Railway CLI
railway logs

# Or in Railway dashboard:
# Project → Service → Deployments → View Logs
```

### Metrics
Railway provides built-in metrics:
- CPU usage
- Memory usage
- Network traffic
- Request count

Access metrics in: **Project → Service → Metrics**

## Scaling

Railway offers different plans:

- **Hobby Plan:** $5/month
  - 512 MB RAM
  - 1 GB disk
  - Good for development/testing

- **Pro Plan:** $20/month
  - 8 GB RAM
  - 100 GB disk
  - Better for production

To upgrade: **Project → Settings → Plan**

## Custom Domain (Optional)

1. Go to **Project → Service → Settings**
2. Scroll to **"Networking"**
3. Click **"Custom Domain"**
4. Add your domain (e.g., `api.tunetools.com`)
5. Update DNS records as instructed
6. Update `GOOGLE_REDIRECT_URI` with new domain

## Environment-Specific Deployments

### Staging Environment

Create a separate Railway service for staging:

1. Create new service in same project
2. Connect to `staging` branch
3. Use different environment variables
4. Use different Supabase project or schema

### Production Environment

Use `main` branch with production credentials:
- Production Supabase project
- Production API keys
- Production frontend URL

## Cost Optimization

1. **Use Hobby Plan for development**
2. **Monitor usage** in Railway dashboard
3. **Set up alerts** for high usage
4. **Use caching** (Redis) to reduce API calls
5. **Optimize RunPod usage** (keep workers warm)

## Security Best Practices

1. ✅ Never commit `.env` files
2. ✅ Use Railway environment variables
3. ✅ Rotate API keys regularly
4. ✅ Use HTTPS only (Railway provides this)
5. ✅ Enable CORS only for your frontend
6. ✅ Use service role key (not anon key) for backend
7. ✅ Set up rate limiting (already configured)

## Backup & Recovery

### Database Backups
- Supabase handles automatic backups
- Export data regularly from Supabase dashboard

### Configuration Backup
- Keep `.env.example` updated
- Document all environment variables
- Store credentials securely (1Password, etc.)

## Support & Resources

- **Railway Docs:** https://docs.railway.app
- **Railway Discord:** https://discord.gg/railway
- **Railway Status:** https://status.railway.app
- **TuneTools Issues:** https://github.com/your-repo/issues

## Quick Reference

### Useful Commands

```bash
# View logs
railway logs

# Open service in browser
railway open

# Run command in Railway environment
railway run <command>

# Deploy
railway up

# Check status
railway status
```

### Important URLs

- Railway Dashboard: https://railway.app/dashboard
- API Documentation: https://your-backend.railway.app/docs
- Health Check: https://your-backend.railway.app/health
- Supabase Dashboard: https://app.supabase.com

## Next Steps

After successful deployment:

1. ✅ Test all API endpoints
2. ✅ Verify song generation works
3. ✅ Test Google Calendar integration
4. ✅ Check image generation
5. ✅ Monitor logs for errors
6. ✅ Set up monitoring/alerts
7. ✅ Update frontend to use Railway backend
8. ✅ Test end-to-end flow

---

**Deployment Checklist:**

- [ ] Repository pushed to GitHub
- [ ] Railway project created
- [ ] All environment variables configured
- [ ] Google OAuth redirect URI updated
- [ ] Domain generated
- [ ] Health check passing
- [ ] Frontend updated with backend URL
- [ ] CORS configured correctly
- [ ] All API endpoints tested
- [ ] Logs monitored for errors

**Congratulations! Your TuneTools backend is now deployed on Railway! 🚀**
