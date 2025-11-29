# TuneTools Backend

FastAPI backend for TuneTools daily song generation platform.

## Structure

```
backend/
├── api/          # API endpoints (routers)
├── services/     # Business logic services
├── models/       # Pydantic data models
├── db/           # Database utilities (Supabase client)
├── utils/        # Helper functions (auth, etc.)
└── main.py       # FastAPI application entry point
```

## Pydantic Models

### User Models (`models/user.py`)
- `UserProfile` - User account data
- `UserPreferences` - News/music preferences with validation
- `UserPreferencesCreate` - Create preferences payload
- `UserPreferencesUpdate` - Update preferences payload

### Song Models (`models/song.py`)
- `Song` - Complete song with metadata
- `SongCreate` - Create song payload
- `SongMetadata` - Generation metadata
- `SongResponse` - Song with album info

### Album Models (`models/album.py`)
- `Album` - Weekly album collection
- `AlbumCreate` - Create album payload
- `AlbumWithSongs` - Album with associated songs

### Context Models (`models/context.py`)
- `WeatherData` - Weather information
- `NewsArticle` - News article data
- `CalendarActivity` - Calendar event
- `ContextData` - Aggregated context for generation

## Quick Start

### Using Start Scripts (Recommended)

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

The scripts will:
- Check for `.env` file
- Create virtual environment if needed
- Install dependencies
- Start the server on port 8000

### Manual Setup

```bash
# Navigate to backend directory
cd src/backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# Linux/Mac:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn main:app --reload --port 8000
```

## Environment Variables

Create a `.env` file (copy from `.env.example`):

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret
SUPABASE_PROJECT_ID=your_project_id

# RunPod
RUNPOD_API_KEY=your_runpod_key
ENDPOINT_ID=your_endpoint_id

# APIs
OPENWEATHER_API_KEY=your_key
SERPAPI_API_KEY=your_key
NEWSAPI_API_KEY=your_key
WORLDNEWS_API_KEY=your_key

# Google OAuth
GOOGLE_CLOUD_API_KEY=your_key
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/calendar/callback

# CORS
FRONTEND_URL=http://localhost:5173

# LLM APIs
OPENAI_API_KEY=your_key
GEMINI_API_KEY=your_key
```

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Authentication

All protected endpoints require JWT token in Authorization header:
```
Authorization: Bearer <supabase_jwt_token>
```

Token validation is handled by `utils/auth.py`

## Deployment

### Docker

Use Docker Compose for local containerized development:

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Render (Production)

See deployment guides:
- **Quick Start:** `docs/deployment-render-setup.md`
- **Complete Guide:** `docs/deployment-checklist.md`
- **Render Details:** `RENDER-DEPLOYMENT.md`

**Key Steps:**
1. Connect GitHub repository to Render
2. Set **Root Directory** to `src/backend`
3. Add environment variables
4. Deploy

## Scripts

| Script | Platform | Purpose |
|--------|----------|---------|
| `start.sh` | Linux/Mac | Start development server with auto-setup |
| `start.bat` | Windows | Start development server with auto-setup |

Both scripts automatically:
- Check for `.env` file
- Create virtual environment if needed
- Install dependencies
- Start server on port 8000

## Project Structure

```
src/backend/
├── api/                    # API endpoints (routers)
│   ├── auth.py            # Authentication endpoints
│   ├── user.py            # User profile & preferences
│   ├── songs.py           # Song generation & listing
│   ├── albums.py          # Album management
│   ├── calendar.py        # Google Calendar integration
│   └── share.py           # Song sharing
├── services/              # Business logic
│   ├── song_generation.py # Song generation pipeline
│   ├── llm.py            # LLM integration
│   ├── calendar.py       # Calendar service
│   ├── weather.py        # Weather API
│   └── news_aggregator.py # News aggregation
├── models/                # Pydantic models
│   ├── user.py           # User models
│   ├── song.py           # Song models
│   ├── album.py          # Album models
│   └── context.py        # Context models
├── db/                    # Database
│   └── supabase_client.py # Supabase client
├── utils/                 # Utilities
│   ├── auth.py           # JWT validation
│   ├── middleware.py     # Auth middleware
│   ├── custom_logger.py  # Logging
│   └── error_handler.py  # Error handling
├── configuration/         # Configuration
│   ├── config_file.json  # App config
│   └── config_loader.py  # Config loader
├── main.py               # FastAPI app entry point
├── requirements.txt      # Python dependencies
├── Dockerfile           # Docker image definition
├── docker-compose.yml   # Docker Compose config
├── render.yaml          # Render deployment config
├── runtime.txt          # Python version for Render
├── .pylintrc            # Linting configuration
├── start.sh             # Start script (Linux/Mac)
└── start.bat            # Start script (Windows)
```

## Additional Documentation

- **API Documentation:** `../../docs/api/` - Complete API reference
- **Deployment Checklist:** `../../docs/deployment-checklist.md` - Full deployment guide
- **Render Setup:** `../../docs/deployment-render-setup.md` - Render quick start
- **Render Details:** `RENDER-DEPLOYMENT.md` - Render-specific configuration
