# TuneTools Frontend

React + TypeScript + Vite frontend for TuneTools daily song generation platform.

## Quick Start

### Development

```bash
# Navigate to frontend directory
cd src/frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

Visit: http://localhost:5173

### Build for Production

```bash
npm run build
npm run preview  # Preview production build
```

## Tech Stack

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS
- **TanStack Query** - Data fetching and caching
- **Zustand** - State management
- **React Router** - Client-side routing
- **Supabase JS** - Authentication and database client
- **Axios** - HTTP client
- **Heroicons** - Icon library

## Project Structure

```
src/frontend/
├── public/                 # Static assets
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── AlbumCollection.tsx
│   │   ├── OnboardingStep*.tsx
│   │   ├── SongGenerator.tsx
│   │   └── SongList.tsx
│   ├── pages/             # Page components
│   │   ├── DashboardPage.tsx
│   │   ├── CalendarPage.tsx
│   │   ├── MySongsPage.tsx
│   │   ├── SettingsPage.tsx
│   │   └── ...
│   ├── contexts/          # React contexts
│   │   └── AuthContext.tsx
│   ├── services/          # API services
│   │   ├── api.ts        # Axios instance
│   │   └── supabase.ts   # Supabase client
│   ├── App.tsx           # Main app component
│   └── main.tsx          # Entry point
├── .env                   # Environment variables (gitignored)
├── .env.example          # Environment template
├── .env.production.example # Production env template
├── vercel.json           # Vercel deployment config
├── vite.config.ts        # Vite configuration
├── tailwind.config.js    # Tailwind configuration
└── package.json          # Dependencies and scripts

```

## Environment Variables

Create a `.env` file (copy from `.env.example`):

```bash
# Supabase
VITE_SUPABASE_URL=https://lwkeiqewoptaokqyzrrw.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# Backend API
VITE_API_BASE_URL=http://localhost:8000
# Production: https://your-app.onrender.com
```

**Important:** All environment variables must start with `VITE_` prefix to be accessible in the app.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (port 5173) |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |

## Key Features

### Authentication
- Supabase Auth integration
- JWT token management
- Protected routes
- Auth context provider

### API Integration
- Axios instance with interceptors
- Automatic token injection
- Error handling
- Base URL configuration

### State Management
- TanStack Query for server state
- Zustand for client state
- React Context for auth state

### Routing
- React Router v6
- Protected routes
- OAuth callback handling
- 404 page

### UI Components
- Responsive design
- Dark mode support
- Loading states
- Error boundaries
- Toast notifications

## Deployment

### Vercel (Recommended)

See detailed guide: `VERCEL-DEPLOYMENT.md`

**Quick Steps:**
1. Connect GitHub to Vercel
2. Set **Root Directory** to `src/frontend`
3. Add environment variables
4. Deploy

**Environment Variables for Vercel:**
```bash
VITE_SUPABASE_URL=https://lwkeiqewoptaokqyzrrw.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_BASE_URL=https://your-app.onrender.com
```

### Other Platforms

The app can be deployed to any static hosting platform:
- Netlify
- Cloudflare Pages
- GitHub Pages
- AWS S3 + CloudFront

Just build with `npm run build` and deploy the `dist/` folder.

## Development Tips

### Hot Module Replacement (HMR)

Vite provides instant HMR. Changes appear immediately without full page reload.

### Path Aliases

Use `@/` for imports:
```typescript
import { Button } from '@/components/Button'
```

Configured in `vite.config.ts`:
```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
}
```

### API Proxy

Development server proxies `/api` requests to backend:
```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8000',
      changeOrigin: true,
    },
  },
}
```

### TypeScript

Strict mode enabled. Fix type errors before building:
```bash
npm run build  # Runs tsc -b && vite build
```

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port 5173
# Windows
netstat -ano | findstr :5173
taskkill /PID <pid> /F

# Linux/Mac
lsof -ti:5173 | xargs kill -9
```

### Environment Variables Not Working

1. Ensure variables start with `VITE_` prefix
2. Restart dev server after changing `.env`
3. Check `import.meta.env.VITE_*` syntax

### Build Fails

```bash
# Clear cache and reinstall
rm -rf node_modules dist
npm install
npm run build
```

### CORS Errors

Ensure backend `FRONTEND_URL` is set correctly:
```bash
# Backend .env
FRONTEND_URL=http://localhost:5173
```

## Additional Documentation

- **Vercel Deployment:** `VERCEL-DEPLOYMENT.md` - Complete Vercel guide
- **Complete Deployment:** `../../docs/deployment-checklist.md` - Full deployment guide
- **Quick Reference:** `../../docs/deployment-quick-reference.md` - Quick deployment steps
- **API Documentation:** `../../docs/api/` - Backend API reference
