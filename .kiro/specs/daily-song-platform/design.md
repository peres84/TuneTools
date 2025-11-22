# Design Document

## Overview

TuneTools is a full-stack web application that transforms daily news, weather, and calendar activities into personalized songs. The system follows a microservices-inspired architecture with a FastAPI backend, React frontend, Supabase for data persistence and authentication, and integrates with multiple external services (news APIs, weather APIs, calendar APIs, LLM services, and the RunPod YuE music generation endpoint).

**Authentication Architecture:** Authentication is handled entirely in the frontend using the Supabase JavaScript SDK (@supabase/supabase-js). User sessions are automatically persisted in browser localStorage by the Supabase SDK. The backend validates JWT tokens from Supabase Auth in request headers for all protected endpoints. This approach simplifies the authentication flow and leverages Supabase's built-in session management.

The application flow:
1. User authenticates via frontend (Supabase JS SDK) and completes onboarding (preferences, calendar integration)
2. Frontend stores session in localStorage automatically
3. System aggregates contextual data (news 70/30 weighted by preferences, weather, calendar)
4. LLM analyzes context and generates song lyrics + genre tags
5. Weekly album artwork is generated once per week and stored
6. RunPod endpoint generates audio using YuE model
7. Song and metadata are stored in Supabase
8. User views/plays song in interactive UI with rotating vinyl disk
9. Songs are shareable via unique URLs

## Project Structure

```
/
├── src/
│   ├── frontend/          # React application
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── styles/
│   │   └── utils/
│   └── backend/           # FastAPI application
│       ├── api/           # API routes
│       ├── services/      # Business logic services
│       ├── models/        # Pydantic models
│       ├── db/            # Database utilities
│       └── utils/         # Helper functions
├── supabase/              # Supabase configuration and migrations
│   ├── migrations/
│   ├── functions/
│   └── config.toml
├── tests/                 # All test files
│   ├── frontend/          # Frontend tests
│   ├── backend/           # Backend tests
│   ├── integration/       # Integration tests
│   └── e2e/               # End-to-end tests
├── docs/                  # All documentation
│   ├── api/               # API documentation
│   ├── setup/             # Setup guides
│   └── architecture/      # Architecture docs
├── images/                # All assets (logos, palettes, examples)
│   ├── logo-disk.png
│   ├── palette.png
│   └── examples/
└── scripts/               # Utility scripts
    └── create_vinyl_disk.py

```

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                         │
│  - Landing Page                                                  │
│  - Authentication (Supabase JS SDK - client-side)                │
│  - Session Management (localStorage)                             │
│  - Onboarding Flow                                               │
│  - Dashboard (News, Calendar, Songs, Settings, Profile)          │
│  - Song Player Page (animated background, rotating vinyl)        │
│  - Theme Provider (Dark/Light)                                   │
└────────────────────────┬────────────────────────────────────────┘
                         │ REST API (with JWT auth)
┌────────────────────────▼────────────────────────────────────────┐
│                      Backend (FastAPI)                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ API Routes                                                │   │
│  │  - /user/* (preferences, profile)                        │   │
│  │  - /news/* (fetch aggregated news)                       │   │
│  │  - /weather/* (fetch weather data)                       │   │
│  │  - /calendar/* (sync, fetch activities)                  │   │
│  │  - /songs/* (generate, list, get by id)                  │   │
│  │  - /albums/* (list, get by id)                           │   │
│  │  - /share/* (public song access)                         │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Services Layer                                            │   │
│  │  - NewsAggregatorService (SerpAPI → fallbacks)           │   │
│  │  - WeatherService                                         │   │
│  │  - CalendarService (Google Calendar integration)         │   │
│  │  - LLMService (OpenAI → Gemini fallback)                 │   │
│  │  - ImageGenerationService (Gemini → OpenAI fallback)     │   │
│  │  - VinylDiskService (create_vinyl_disk.py wrapper)       │   │
│  │  - SongGenerationService (RunPod YuE endpoint)           │   │
│  │  - AlbumService (weekly album management)                │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                    External Services                             │
│  - Supabase (Database + Auth + Storage)                         │
│  - SerpAPI / NewsAPI / WorldNewsAPI                             │
│  - Weather API                                                   │
│  - Google Calendar API                                           │
│  - OpenAI API (GPT-4 for lyrics, DALL-E for images)            │
│  - Gemini API (text + image generation fallback)                │
│  - RunPod Serverless Endpoint (YuE music generation)            │
└─────────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend:**
- React 18+ with TypeScript
- Vite for build tooling
- TanStack Query (React Query) for data fetching
- React Router for navigation
- Tailwind CSS for styling
- Framer Motion for animations
- Zustand for state management
- Supabase JS client (@supabase/supabase-js) for authentication and data
- localStorage for session persistence

**Backend:**
- FastAPI (Python 3.11+)
- Pydantic for data validation
- SQLAlchemy (if needed for complex queries)
- Supabase Python client
- httpx for async HTTP requests
- Pillow for image processing (vinyl disk creation)
- python-dotenv for configuration

**Infrastructure:**
- Supabase (PostgreSQL database, Auth, Storage)
  - All Supabase configuration stored in `/supabase` folder
  - Deployed using MCP Supabase integration
- RunPod Serverless (YuE model hosting)
- Vercel/Netlify (Frontend hosting)
- Railway/Render (Backend hosting)

## Components and Interfaces

### Frontend Components

#### 1. Landing Page Component
```typescript
interface LandingPageProps {
  onSignup: () => void;
  onLogin: () => void;
}

// Features:
// - Hero section with TuneTools logo and tagline
// - Animated demo of song generation process
// - Example song player
// - Call-to-action buttons
```

#### 2. Authentication Components
```typescript
interface AuthFormProps {
  mode: 'signup' | 'login';
  onSuccess: (user: User) => void;
  onError: (error: Error) => void;
}

// Uses Supabase JS SDK directly in frontend
// Email/password authentication via supabase.auth.signUp() and supabase.auth.signInWithPassword()
// OAuth providers (Google, optional) via supabase.auth.signInWithOAuth()
// Session automatically stored in localStorage by Supabase SDK
// Session restoration via supabase.auth.getSession() on app load
```

#### 2a. Auth Context Provider
```typescript
interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

// Wraps app with Supabase auth state
// Listens to auth state changes via supabase.auth.onAuthStateChange()
// Provides authentication methods to all components
// Handles session persistence automatically via Supabase SDK
```

#### 3. Onboarding Flow Components
```typescript
interface OnboardingStep1Props {
  onComplete: (preferences: UserPreferences) => void;
}

interface UserPreferences {
  categories: string[]; // e.g., ['art', 'technology', 'sports']
  musicGenres: string[]; // e.g., ['pop', 'indie', 'electronic']
  vocalPreference: 'male' | 'female' | 'neutral';
  moodPreference: string; // e.g., 'upbeat', 'calm', 'energetic'
}

interface OnboardingStep2Props {
  onComplete: (calendarAuth: CalendarAuth) => void;
  onSkip: () => void;
}

interface CalendarAuth {
  provider: 'google';
  accessToken: string;
  refreshToken: string;
}
```

#### 4. Dashboard Layout Component
```typescript
interface DashboardLayoutProps {
  children: React.ReactNode;
  currentTab: 'home' | 'news' | 'calendar' | 'songs' | 'settings' | 'profile';
}

// Features:
// - Sidebar navigation
// - Theme toggle
// - User avatar/menu
// - Responsive (hamburger menu on mobile)
```

#### 5. Song Generation Component
```typescript
interface SongGeneratorProps {
  onGenerationStart: () => void;
  onGenerationComplete: (song: Song) => void;
  onGenerationError: (error: Error) => void;
}

// Features:
// - "Generate Your Daily Song" button
// - Loading state with progress indicators
// - Display of generated song
```

#### 6. Song Player Component
```typescript
interface SongPlayerProps {
  song: Song;
  album: Album;
  isSharedView?: boolean;
}

interface Song {
  id: string;
  title: string;
  description: string;
  lyrics: string;
  genreTags: string;
  audioUrl: string;
  createdAt: string;
  albumId: string;
  metadata: {
    weather: string;
    newsTopics: string[];
    activities: string[];
  };
}

interface Album {
  id: string;
  name: string;
  weekStart: string;
  weekEnd: string;
  vinylDiskUrl: string;
  songCount: number;
}

// Features:
// - Animated gradient background (wave motion)
// - Centered vinyl disk with rotation animation
// - Audio controls (play/pause, progress, volume)
// - Song metadata display
// - Social sharing buttons
```

#### 7. Album Collection Component
```typescript
interface AlbumCollectionProps {
  albums: Album[];
  onAlbumClick: (albumId: string) => void;
}

// Features:
// - Grid layout of album covers
// - Album metadata (name, date range, song count)
// - Hover effects
```

#### 8. Theme Provider
```typescript
interface ThemeContextValue {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

// Features:
// - System preference detection
// - Persistent theme storage
// - TuneTools brand color adaptation
```

#### 9. API Service Utilities
```typescript
interface ApiClientConfig {
  baseUrl: string;
  supabaseClient: SupabaseClient;
}

class ApiClient {
  private baseUrl: string;
  private supabase: SupabaseClient;

  constructor(config: ApiClientConfig);

  /**
   * Makes authenticated API request with JWT token
   * Automatically includes Authorization header with current session token
   */
  async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T>;

  /**
   * Gets current session token from Supabase
   */
  private async getAuthToken(): Promise<string | null>;
}

// Features:
// - Automatic JWT token inclusion in all requests
// - Token refresh handling
// - Error handling for 401 responses
// - Type-safe request/response handling
```

### Backend API Endpoints

**Note:** Authentication is handled entirely in the frontend using Supabase JS SDK. The backend validates JWT tokens from Supabase Auth in request headers.

#### Authentication Middleware
```python
# All protected endpoints require Authorization header with JWT token
# Middleware validates token with Supabase and extracts user_id
# Token format: "Bearer <jwt_token>"

async def verify_supabase_token(authorization: str) -> str:
    """
    Validates JWT token from Supabase Auth
    Returns user_id if valid, raises 401 if invalid
    """
    pass
```

#### User Endpoints
```python
GET /api/user/preferences
Response: { preferences: UserPreferences }

PUT /api/user/preferences
Request: { preferences: UserPreferences }
Response: { success: bool }

POST /api/user/calendar/connect
Request: { provider: str, authCode: str }
Response: { success: bool, calendarAuth: CalendarAuth }

GET /api/user/profile
Response: { profile: UserProfile }
```

#### News Endpoints
```python
GET /api/news/aggregated
Query: { date?: str }
Response: { 
  news: NewsArticle[],
  sources: { preferred: NewsArticle[], general: NewsArticle[] }
}

interface NewsArticle {
  title: str
  description: str
  url: str
  source: str
  publishedAt: str
  category: str
}
```

#### Weather Endpoints
```python
GET /api/weather/current
Query: { lat: float, lon: float }
Response: {
  temperature: float,
  condition: str,
  description: str,
  location: str
}
```

#### Calendar Endpoints
```python
GET /api/calendar/activities
Query: { date: str }
Response: {
  activities: CalendarActivity[]
}

interface CalendarActivity {
  title: str
  startTime: str
  endTime: str
  description?: str
}
```

#### Song Endpoints
```python
POST /api/songs/generate
Request: {
  date: str,
  forceRegenerate?: bool
}
Response: {
  song: Song,
  album: Album,
  generationTime: float
}

GET /api/songs/list
Query: { limit?: int, offset?: int }
Response: {
  songs: Song[],
  total: int
}

GET /api/songs/{song_id}
Response: { song: Song, album: Album }

GET /api/songs/today
Response: { song: Song | null, album: Album | null }
```

#### Album Endpoints
```python
GET /api/albums/list
Response: { albums: Album[] }

GET /api/albums/{album_id}
Response: { 
  album: Album,
  songs: Song[]
}

GET /api/albums/current-week
Response: { album: Album, songs: Song[] }
```

#### Share Endpoints
```python
GET /api/share/song/{share_token}
Response: {
  song: Song,
  album: Album,
  isPublic: bool
}
```

### Backend Services

#### NewsAggregatorService
```python
class NewsAggregatorService:
    def __init__(self):
        self.primary_api = SerpAPIClient()
        self.fallback_apis = [NewsAPIClient(), WorldNewsAPIClient()]
    
    async def fetch_news(
        self,
        user_preferences: UserPreferences,
        location: str
    ) -> AggregatedNews:
        """
        Fetches news with 70% preferred categories, 30% general
        Implements fallback logic
        """
        pass
    
    async def _fetch_from_api(
        self,
        api_client: NewsAPIClient,
        categories: list[str],
        location: str
    ) -> list[NewsArticle]:
        """Fetch from specific API with error handling"""
        pass
```

#### LLMService
```python
class LLMService:
    def __init__(self):
        self.primary_client = OpenAIClient()
        self.fallback_client = GeminiClient()
    
    async def generate_song_content(
        self,
        context: SongContext
    ) -> SongContent:
        """
        Generates lyrics and genre tags
        Returns: { lyrics: str, genreTags: str, title: str, description: str }
        """
        pass
    
    def _build_song_prompt(self, context: SongContext) -> str:
        """
        Builds prompt following YuE guidelines:
        - 1 verse (max 8 lines)
        - 1 chorus (max 6 lines)
        - Genre tags: genre instrument mood gender timbre
        """
        pass

interface SongContext:
    weather: WeatherData
    news: list[NewsArticle]
    activities: list[CalendarActivity]
    user_preferences: UserPreferences
```

#### ImageGenerationService
```python
class ImageGenerationService:
    def __init__(self):
        self.primary_client = GeminiImageClient()  # nano banana
        self.fallback_client = OpenAIImageClient()  # DALL-E
    
    async def generate_album_artwork(
        self,
        context: AlbumContext
    ) -> bytes:
        """
        Generates base image for album artwork
        Returns raw image bytes
        """
        pass
    
    def _build_artwork_prompt(self, context: AlbumContext) -> str:
        """
        Creates prompt for visually distinctive album art
        Based on week's themes and news topics
        """
        pass
```

#### VinylDiskService
```python
class VinylDiskService:
    def __init__(self):
        self.disk_script_path = "scripts/create_vinyl_disk.py"
    
    async def create_vinyl_disk(
        self,
        base_image_bytes: bytes,
        output_path: str,
        disk_size: int = 1000,
        hole_ratio: float = 0.14
    ) -> str:
        """
        Applies vinyl disk transformation to base image
        Returns path to vinyl disk image
        """
        pass
```

#### SongGenerationService
```python
class SongGenerationService:
    def __init__(self):
        self.runpod_endpoint = RunPodEndpoint(
            api_key=os.getenv("RUNPOD_API_KEY"),
            endpoint_id=os.getenv("ENDPOINT_ID")
        )
    
    async def generate_audio(
        self,
        lyrics: str,
        genre_tags: str
    ) -> bytes:
        """
        Sends request to RunPod YuE endpoint
        Returns audio file bytes (WAV format)
        Timeout: 15 minutes (900 seconds)
        """
        pass
    
    def _format_lyrics_for_yue(self, lyrics: str) -> str:
        """
        Formats lyrics with proper structure:
        [verse]
        ...
        
        [chorus]
        ...
        """
        pass
```

#### AlbumService
```python
class AlbumService:
    def __init__(self, supabase_client: SupabaseClient):
        self.db = supabase_client
    
    async def get_or_create_weekly_album(
        self,
        user_id: str,
        date: datetime
    ) -> Album:
        """
        Gets existing album for the week or creates new one
        Generates vinyl disk artwork for new albums
        """
        pass
    
    def _get_week_boundaries(self, date: datetime) -> tuple[datetime, datetime]:
        """Returns (week_start, week_end) for given date"""
        pass
    
    async def _create_album_artwork(
        self,
        user_id: str,
        week_start: datetime,
        context: AlbumContext
    ) -> str:
        """
        Generates and stores vinyl disk artwork
        Returns Supabase storage URL
        """
        pass
```

## Data Models

### Supabase Project Structure

All Supabase-related files will be organized in the `/supabase` folder:

```
/supabase
  /migrations          # Database migration files
  /functions          # Edge functions (if needed)
  /seed.sql           # Seed data for development
  config.toml         # Supabase configuration
```

Deployment will be managed using MCP Supabase integration for automated schema deployment and management.

### Database Schema (Supabase/PostgreSQL)

```sql
-- Users table (managed by Supabase Auth)
-- Extended with custom profile data

CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    onboarding_completed BOOLEAN DEFAULT FALSE
);

CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    categories TEXT[] NOT NULL,
    music_genres TEXT[] NOT NULL,
    vocal_preference TEXT NOT NULL CHECK (vocal_preference IN ('male', 'female', 'neutral')),
    mood_preference TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE TABLE calendar_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('google')),
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, provider)
);

CREATE TABLE albums (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    vinyl_disk_url TEXT NOT NULL,
    song_count INTEGER DEFAULT 0,
    is_complete BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, week_start)
);

CREATE INDEX idx_albums_user_week ON albums(user_id, week_start);

CREATE TABLE songs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    album_id UUID REFERENCES albums(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    lyrics TEXT NOT NULL,
    genre_tags TEXT NOT NULL,
    audio_url TEXT NOT NULL,
    share_token TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Context metadata (JSONB for flexibility)
    weather_data JSONB,
    news_data JSONB,
    calendar_data JSONB,
    
    -- Generation metadata
    generation_time_seconds FLOAT,
    llm_provider TEXT,
    
    UNIQUE(user_id, created_at::DATE)
);

CREATE INDEX idx_songs_user ON songs(user_id);
CREATE INDEX idx_songs_album ON songs(album_id);
CREATE INDEX idx_songs_share_token ON songs(share_token);
CREATE INDEX idx_songs_created_at ON songs(created_at);

-- Storage buckets (configured in Supabase)
-- - audio_files: stores WAV/MP3 files
-- - vinyl_disks: stores album artwork PNG files
```

### Pydantic Models (Backend)

```python
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List

class UserPreferences(BaseModel):
    categories: List[str]
    music_genres: List[str]
    vocal_preference: str = Field(pattern="^(male|female|neutral)$")
    mood_preference: str

class WeatherData(BaseModel):
    temperature: float
    condition: str
    description: str
    location: str

class NewsArticle(BaseModel):
    title: str
    description: str
    url: str
    source: str
    published_at: datetime
    category: str

class CalendarActivity(BaseModel):
    title: str
    start_time: datetime
    end_time: datetime
    description: Optional[str] = None

class SongContext(BaseModel):
    weather: WeatherData
    news: List[NewsArticle]
    activities: List[CalendarActivity]
    user_preferences: UserPreferences

class SongContent(BaseModel):
    title: str
    description: str
    lyrics: str
    genre_tags: str

class Album(BaseModel):
    id: str
    user_id: str
    name: str
    week_start: datetime
    week_end: datetime
    vinyl_disk_url: str
    song_count: int
    is_complete: bool
    created_at: datetime

class Song(BaseModel):
    id: str
    user_id: str
    album_id: str
    title: str
    description: str
    lyrics: str
    genre_tags: str
    audio_url: str
    share_token: str
    created_at: datetime
    weather_data: dict
    news_data: dict
    calendar_data: dict
    generation_time_seconds: Optional[float] = None
    llm_provider: Optional[str] = None

class SongGenerationRequest(BaseModel):
    date: str
    force_regenerate: bool = False

class SongGenerationResponse(BaseModel):
    song: Song
    album: Album
    generation_time: float
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Authentication Properties

Property 1: Session Storage in localStorage
*For any* successful authentication (signup or login), the Supabase SDK SHALL store the session in browser localStorage automatically
**Validates: Requirements 2.2**

Property 2: Session Restoration on App Load
*For any* application load with an existing session in localStorage, the Supabase SDK SHALL restore the authentication state and provide the user object
**Validates: Requirements 2.9**

Property 3: First Login Onboarding Redirect
*For any* user who has just completed signup and has not completed onboarding, the System SHALL redirect them to the onboarding flow
**Validates: Requirements 2.3**

