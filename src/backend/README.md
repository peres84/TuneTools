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

## Setup

```bash
# Navigate to backend directory
cd src/backend

# Install dependencies
pip install -r ../../requirements.txt

# Run development server
uvicorn main:app --reload --port 8000
```

## Environment Variables

Required in `.env` file:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:5173
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
