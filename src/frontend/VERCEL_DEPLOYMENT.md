# Vercel Deployment Guide for TuneTools Frontend

This guide will help you deploy the TuneTools React frontend to Vercel.

## Prerequisites

- Vercel account (sign up at https://vercel.com)
- GitHub account (for connecting your repository)
- Backend deployed (Railway or other platform)

## Step 1: Prepare Your Repository

1. **Ensure all files are committed:**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Verify frontend files exist in `src/frontend/`:**
   - ✅ `package.json`
   - ✅ `vite.config.ts`
   - ✅ `index.html`
   - ✅ `tsconfig.json`

## Step 2: Create a New Vercel Project

1. Go to https://vercel.com/dashboard
2. Click **"Add New..."** → **"Project"**
3. Import your **TuneTools** repository from GitHub
4. **Important Configuration:**
   - **Framework Preset:** Vite
   - **Root Directory:** `src/frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

## Step 3: Configure Environment Variables

In the Vercel dashboard, go to your project → **Settings** → **Environment Variables** and add:

### Required Variables

```env
# Backend API URL (your Railway backend)
VITE_API_BASE_URL=https://your-backend.railway.app

# Supabase Configuration (for client-side auth)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Important:** 
- Use `VITE_` prefix for all environment variables (Vite requirement)
- Don't use service role keys in frontend (security risk)
- Use the anon key for Supabase client-side operations

## Step 4: Deploy

1. Click **"Deploy"** in Vercel
2. Vercel will automatically build and deploy your frontend
3. Wait for deployment to complete (~2-3 minutes)

## Step 5: Get Your Frontend URL

After deployment:
1. Vercel will provide a URL like: `https://tunetools.vercel.app`
2. Copy this URL

## Step 6: Update Backend CORS

Update your Railway backend environment variables:

```env
FRONTEND_URL=https://tunetools.vercel.app
```

This allows your backend to accept requests from your Vercel frontend.

## Step 7: Update Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **APIs & Services** → **Credentials**
3. Edit your OAuth 2.0 Client ID
4. Add to **Authorized JavaScript origins**:
   ```
   https://tunetools.vercel.app
   ```
5. Verify **Authorized redirect URIs** includes:
   ```
   https://your-backend.railway.app/api/calendar/callback
   ```

## Step 8: Test Your Deployment

Visit your Vercel URL and test:

1. ✅ Landing page loads
2. ✅ Sign up / Login works
3. ✅ Dashboard loads
4. ✅ Song generation works
5. ✅ Calendar integration works
6. ✅ Sharing works

## Troubleshooting

### Build Fails with TypeScript Errors

**Issue:** `error TS6133: 'X' is declared but its value is never read`
**Solution:** 
- Remove unused imports
- Fix TypeScript errors locally first
- Run `npm run build` locally to catch errors

### Build Fails with Missing Dependencies

**Issue:** `Cannot find module 'X'`
**Solution:**
- Ensure all dependencies are in `package.json`
- Run `npm install` locally to verify
- Check `package-lock.json` is committed

### Environment Variables Not Working

**Issue:** API calls fail or use wrong URL
**Solution:**
- Verify all variables have `VITE_` prefix
- Redeploy after adding variables
- Check browser console for actual values

### CORS Errors

**Issue:** `Access-Control-Allow-Origin` errors
**Solution:**
- Add Vercel URL to backend `FRONTEND_URL`
- Redeploy backend after updating CORS
- Check backend logs for CORS configuration

### 404 on Page Refresh

**Issue:** Refreshing a page shows 404
**Solution:**
- Vercel should handle this automatically for Vite
- If not, add `vercel.json` with rewrites (see below)

## Advanced Configuration

### Custom Domain

1. Go to **Project Settings** → **Domains**
2. Add your custom domain
3. Update DNS records as instructed
4. Update `FRONTEND_URL` in backend
5. Update Google OAuth origins

### Vercel Configuration File (Optional)

Create `src/frontend/vercel.json` if you need custom routing:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### Environment-Specific Deployments

**Preview Deployments:**
- Vercel automatically creates preview deployments for PRs
- Each preview gets a unique URL
- Use for testing before production

**Production Deployment:**
- Only `main` branch deploys to production
- Configure in **Project Settings** → **Git**

## Performance Optimization

### Enable Vercel Analytics

1. Go to **Project Settings** → **Analytics**
2. Enable **Web Analytics**
3. Monitor Core Web Vitals

### Enable Vercel Speed Insights

1. Install package:
   ```bash
   npm install @vercel/speed-insights
   ```

2. Add to `src/main.tsx`:
   ```typescript
   import { SpeedInsights } from '@vercel/speed-insights/react'
   
   // In your root component
   <SpeedInsights />
   ```

### Image Optimization

Vercel automatically optimizes images. Use the `next/image` equivalent or ensure images are properly sized.

## Monitoring

### View Logs

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# View logs
vercel logs
```

### Deployment Status

Check deployment status:
- **Dashboard:** https://vercel.com/dashboard
- **Deployments:** Project → Deployments tab
- **Real-time logs:** Click on any deployment

## Cost

Vercel offers:
- **Hobby Plan:** Free
  - 100 GB bandwidth/month
  - Unlimited deployments
  - Good for personal projects

- **Pro Plan:** $20/month
  - 1 TB bandwidth/month
  - Team collaboration
  - Better for production

## Security Best Practices

1. ✅ Never commit `.env` files
2. ✅ Use Vercel environment variables
3. ✅ Use HTTPS only (Vercel provides this)
4. ✅ Use anon key (not service role) for Supabase
5. ✅ Enable security headers (see vercel.json above)
6. ✅ Keep dependencies updated

## Quick Reference

### Useful Commands

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy from CLI
vercel

# Deploy to production
vercel --prod

# View logs
vercel logs

# List deployments
vercel ls
```

### Important URLs

- Vercel Dashboard: https://vercel.com/dashboard
- Vercel Docs: https://vercel.com/docs
- Vercel Status: https://www.vercel-status.com

## Deployment Checklist

- [ ] Repository pushed to GitHub
- [ ] Vercel project created
- [ ] Root directory set to `src/frontend`
- [ ] All environment variables configured
- [ ] Backend URL added to `VITE_API_BASE_URL`
- [ ] Supabase credentials added
- [ ] Build successful
- [ ] Health check passing
- [ ] Backend CORS updated with Vercel URL
- [ ] Google OAuth origins updated
- [ ] All pages tested
- [ ] Song generation tested
- [ ] Sharing tested

**Congratulations! Your TuneTools frontend is now deployed on Vercel! 🚀**

---

## Full Stack Deployment Summary

After completing both deployments:

- **Backend:** https://your-backend.railway.app
- **Frontend:** https://tunetools.vercel.app
- **Database:** Supabase (managed)
- **Audio Generation:** RunPod (serverless)
- **Image Generation:** Gemini API

Your TuneTools application is now fully deployed and accessible to users!
