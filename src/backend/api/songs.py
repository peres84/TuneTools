"""
#############################################################################
### Songs API endpoints
### Main orchestration for song generation
###
### @file songs.py
### @author Sebastian Russo
### @date 2025
#############################################################################
"""
from fastapi import APIRouter, Depends, HTTPException, Request, File, UploadFile, Form
from typing import Optional
import time
from datetime import datetime, timedelta

from models.song import Song, SongCreate, SongResponse
from models.context import ContextData, WeatherData, NewsArticle
from db.supabase_client import supabase
from utils.middleware import get_current_user
from utils.custom_logger import log_handler
from utils.limiter import limiter as SlowLimiter
from configuration.config_loader import config

# Import all services
from services import (
    NewsAggregatorService,
    WeatherService,
    CalendarService,
    LLMService,
    AlbumService,
    SongGenerationService
)

router = APIRouter()

# Initialize services
news_service = NewsAggregatorService()
weather_service = WeatherService()
calendar_service = CalendarService()
llm_service = LLMService()
album_service = AlbumService()
song_service = SongGenerationService()


@router.post("/generate", response_model=SongResponse)
@SlowLimiter.limit(
    f"{config['endpoints']['songs_generate_endpoint']['request_limit']}/"
    f"{config['endpoints']['songs_generate_endpoint']['unit_of_time_for_limit']}"
)
async def generate_song(
    request: Request,
    location: Optional[str] = Form(None),
    custom_title: Optional[str] = Form(None),
    custom_cover: Optional[UploadFile] = File(None),
    use_default_cover: Optional[str] = Form(None),
    override_genres: Optional[str] = Form(None),
    override_vocal: Optional[str] = Form(None),
    override_mood: Optional[str] = Form(None),
    user_id: str = Depends(get_current_user)
):
    """
    Generate a personalized daily song
    
    This is the main orchestration endpoint that:
    1. Aggregates context data (news, weather, calendar)
    2. Generates lyrics and genre tags via LLM (or uses custom title)
    3. Gets or creates weekly album
    4. Generates album artwork (only for new albums)
    5. Generates song audio via RunPod
    6. Stores audio in Supabase storage
    7. Stores song metadata in database
    8. Returns song with share token
    
    Args:
        location: City name or coordinates (optional, uses user profile if not provided)
        custom_title: Custom song title (optional, AI-generated if not provided)
        custom_cover: Custom album cover image file (optional)
        use_default_cover: Use default app logo as cover (optional, "true" to enable)
        override_genres: JSON array of genres to override user preferences (optional)
        override_vocal: Vocal preference override (optional)
        override_mood: Mood preference override (optional)
        user_id: Authenticated user ID
        
    Returns:
        SongResponse: Generated song with album info
    """
    start_time = time.time()
    
    try:
        log_handler.info(f"[MUSIC] Starting song generation for user {user_id}")
        
        # Step 0: Check daily limit
        daily_limit = config['song_generation']['daily_limit_per_user']
        today = datetime.now().date()
        today_start = datetime.combine(today, datetime.min.time()).isoformat()
        
        # Count songs created today
        count_response = (
            supabase.table("songs")
            .select("id", count="exact")
            .eq("user_id", user_id)
            .gte("created_at", today_start)
            .execute()
        )
        
        songs_today = count_response.count if count_response.count else 0
        
        if songs_today >= daily_limit:
            log_handler.warning(f"[LIMIT] User {user_id} has reached daily limit ({songs_today}/{daily_limit})")
            raise HTTPException(
                status_code=429,
                detail={
                    "message": f"Daily song generation limit reached ({daily_limit} songs per day)",
                    "songs_today": songs_today,
                    "daily_limit": daily_limit,
                    "code": "DAILY_LIMIT_REACHED"
                }
            )
        
        log_handler.info(f"[LIMIT] User has generated {songs_today}/{daily_limit} songs today")
        
        # Step 1: Aggregate context data
        log_handler.info("[DATA] Step 1: Aggregating context data...")
        context_data = await _aggregate_context_data(user_id, location)
        
        # Apply preference overrides if provided (temporary, just for this song)
        if override_genres or override_vocal or override_mood:
            log_handler.info("[OVERRIDE] Applying temporary preference overrides...")
            user_prefs = context_data.get('user_preferences', {})
            if override_genres:
                import json
                user_prefs['music_genres'] = json.loads(override_genres)
                log_handler.info(f"  - Genres: {user_prefs['music_genres']}")
            if override_vocal:
                user_prefs['vocal_preference'] = override_vocal
                log_handler.info(f"  - Vocal: {override_vocal}")
            if override_mood:
                user_prefs['mood_preference'] = override_mood
                log_handler.info(f"  - Mood: {override_mood}")
            context_data['user_preferences'] = user_prefs
        log_handler.info(f"[DATA] [OK] Context aggregated:")
        log_handler.info(f"  - Weather: {context_data.get('weather', {}).get('weather_condition', 'N/A')}, {context_data.get('weather', {}).get('temp_c', 'N/A')}°C")
        log_handler.info(f"  - News: {len(context_data.get('news', []))} articles")
        log_handler.info(f"  - Calendar: {len(context_data.get('calendar', []))} activities")
        
        # Step 2: Generate lyrics and genre tags (or use custom title)
        if custom_title:
            log_handler.info(f"[AI] Step 2: Using custom title: {custom_title}")
            song_content = await llm_service.generate_song_content(
                weather_data=context_data.get('weather', {}),
                news_articles=context_data.get('news', []),
                calendar_activities=context_data.get('calendar', []),
                user_preferences=context_data.get('user_preferences', {}),
                custom_title=custom_title
            )
        else:
            log_handler.info("[AI] Step 2: Generating lyrics and genre tags...")
            song_content = await llm_service.generate_song_content(
                weather_data=context_data.get('weather', {}),
                news_articles=context_data.get('news', []),
                calendar_activities=context_data.get('calendar', []),
                user_preferences=context_data.get('user_preferences', {})
            )
        log_handler.info(f"[AI] [OK] Song content generated:")
        log_handler.info(f"  - Title: {song_content['title']}")
        log_handler.info(f"  - Description: {song_content['description']}")
        log_handler.info(f"  - Genre Tags: {song_content['genre_tags']}")
        log_handler.info(f"  - Lyrics Preview: {song_content['lyrics'][:100]}...")
        
        # Step 3: Get or create weekly album (with optional custom cover or default)
        log_handler.info("[ALBUM] Step 3: Getting weekly album...")
        custom_cover_data = None
        use_default = use_default_cover == 'true'
        
        if custom_cover:
            log_handler.info("[ALBUM] Using custom cover image")
            custom_cover_data = await custom_cover.read()
        elif use_default:
            log_handler.info("[ALBUM] Using default app logo as cover")
        
        album, image_generation_failed = await album_service.get_or_create_weekly_album(
            user_id=user_id,
            song_themes=[song_content['title']],
            user_preferences=context_data.get('user_preferences', {}),
            custom_cover_data=custom_cover_data,
            use_default_cover=use_default
        )
        log_handler.info(f"[ALBUM] [OK] Album ready: {album.name}")
        log_handler.info(f"  - Album ID: {album.id}")
        log_handler.info(f"  - Vinyl Disk URL: {album.vinyl_disk_url}")
        log_handler.info(f"  - Image Generation Failed: {image_generation_failed}")
        
        # Step 4: Generate song audio
        log_handler.info("[AUDIO] Step 4: Generating song audio...")
        genre_tags, formatted_lyrics = llm_service.format_for_yue(song_content)
        log_handler.info(f"[AUDIO] [OK] Formatted for YuE:")
        log_handler.info(f"  - Genre Tags: {genre_tags}")
        log_handler.info(f"  - Lyrics ({len(formatted_lyrics)} chars):")
        log_handler.info(f"\n{formatted_lyrics}\n")
        
        audio_result = await song_service.generate_song(
            genre_tags=genre_tags,
            lyrics=formatted_lyrics
        )
        log_handler.info(f"[AUDIO] [OK] Audio generated:")
        log_handler.info(f"  - Filename: {audio_result['filename']}")
        log_handler.info(f"  - Size: {len(audio_result['audio_data']) / 1024 / 1024:.2f} MB")
        log_handler.info(f"  - Generation Time: {audio_result['generation_time_seconds']:.1f}s")
        
        # Step 5: Store audio in Supabase storage
        log_handler.info("[SAVE] Step 5: Storing audio file...")
        audio_url = await _store_audio_file(
            user_id=user_id,
            audio_data=audio_result['audio_data'],
            filename=audio_result['filename']
        )
        log_handler.info(f"[SAVE] [OK] Audio stored: {audio_url}")
        
        # Step 6: Store song metadata in database
        log_handler.info("[WRITE] Step 6: Storing song metadata...")
        song_data = SongCreate(
            title=song_content['title'],
            description=song_content['description'],
            lyrics=formatted_lyrics,
            genre_tags=genre_tags,
            audio_url=audio_url,
            album_id=album.id,
            weather_data=context_data.get('weather'),
            news_data={'articles': context_data.get('news', [])[:3]},
            calendar_data={'activities': context_data.get('calendar', [])[:3]},
            generation_time_seconds=audio_result['generation_time_seconds'],
            llm_provider="openai"  # or "gemini" based on which was used
        )
        
        song = await _create_song_record(user_id, song_data)
        log_handler.info(f"[WRITE] [OK] Song record created:")
        log_handler.info(f"  - Song ID: {song.id}")
        log_handler.info(f"  - Share Token: {song.share_token}")
        
        elapsed = time.time() - start_time
        log_handler.info(f"[SUCCESS] === Song generation complete! ({elapsed / 60:.1f} minutes) ===")
        log_handler.info(f"[SUCCESS] Song: '{song.title}' by {user_id}")
        
        # Return song with album info
        return SongResponse(
            song=song,
            album_name=album.name,
            album_vinyl_disk_url=album.vinyl_disk_url,
            image_generation_failed=image_generation_failed
        )
        
    except Exception as e:
        log_handler.error(f"[ERROR] Song generation failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Song generation failed: {str(e)}"
        )


async def _aggregate_context_data(
    user_id: str,
    location: Optional[str] = None
) -> dict:
    """
    Aggregate context data from all sources
    
    Returns:
        dict: {
            'weather': WeatherData,
            'news': List[NewsArticle],
            'calendar': List[CalendarActivity],
            'user_preferences': dict
        }
    """
    context = {}
    
    # Get user preferences
    try:
        prefs_response = (
            supabase.table("user_preferences")
            .select("*")
            .eq("user_id", user_id)
            .maybe_single()
            .execute()
        )
        
        if prefs_response.data:
            context['user_preferences'] = prefs_response.data
        else:
            # Default preferences
            context['user_preferences'] = {
                'categories': ['technology', 'business'],
                'music_genres': ['pop', 'indie'],
                'vocal_preference': 'female',
                'mood_preference': 'uplifting'
            }
    except Exception as e:
        log_handler.warning(f"[WARN] Failed to get user preferences: {str(e)}")
        context['user_preferences'] = {
            'categories': ['general'],
            'music_genres': ['pop'],
            'vocal_preference': 'neutral',
            'mood_preference': 'calm'
        }
    
    # Get weather data
    try:
        if location:
            weather = await weather_service.get_weather_by_city(location)
        else:
            # Default to a major city or use user's location from profile
            weather = await weather_service.get_weather_by_city("New York")
        
        context['weather'] = weather.dict()
        log_handler.info(f"[OK] Weather: {weather.weather_condition}, {weather.temp_c}°C")
    except Exception as e:
        log_handler.warning(f"[WARN] Failed to get weather: {str(e)}")
        context['weather'] = None
    
    # Get news articles
    try:
        user_categories = context['user_preferences'].get('categories', ['general'])
        news_articles = await news_service.fetch_news(
            user_categories=user_categories,
            location="US",
            max_articles=10
        )
        
        context['news'] = [article.dict() for article in news_articles]
        log_handler.info(f"[OK] News: {len(news_articles)} articles")
    except Exception as e:
        log_handler.warning(f"[WARN] Failed to get news: {str(e)}")
        context['news'] = []
    
    # Get calendar activities
    try:
        activities = await calendar_service.get_calendar_activities(
            user_id=user_id,
            days_ahead=1
        )
        
        context['calendar'] = [activity.dict() for activity in activities]
        log_handler.info(f"[OK] Calendar: {len(activities)} activities")
    except Exception as e:
        log_handler.warning(f"[WARN] Failed to get calendar: {str(e)}")
        context['calendar'] = []
    
    return context


async def _store_audio_file(
    user_id: str,
    audio_data: bytes,
    filename: str
) -> str:
    """
    Store audio file in Supabase storage
    
    Returns:
        str: Public URL of stored audio file
    """
    # Generate unique filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    storage_filename = f"{user_id}/{timestamp}_{filename}"
    
    try:
        # Upload to audio_files bucket
        response = supabase.storage.from_("audio_files").upload(
            storage_filename,
            audio_data,
            file_options={"content-type": "audio/wav"}
        )
        
        # Store the storage path (not a URL) for security
        # We'll generate signed URLs when needed
        log_handler.info(f"[OK] Audio uploaded: {storage_filename}")
        
        # Return the storage path (will be converted to signed URL when retrieved)
        return storage_filename
        
    except Exception as e:
        raise Exception(f"Failed to store audio file: {str(e)}")


async def _create_song_record(
    user_id: str,
    song_data: SongCreate
) -> Song:
    """
    Create song record in database
    
    Automatically generates unique share token
    
    Returns:
        Song: Created song with share token
    """
    try:
        # Convert Pydantic models to JSON-serializable dicts
        import json
        from datetime import datetime
        
        def serialize_datetime(obj):
            """Convert datetime objects to ISO format strings"""
            if isinstance(obj, datetime):
                return obj.isoformat()
            raise TypeError(f"Object of type {type(obj)} is not JSON serializable")
        
        # Serialize context data to ensure datetime objects are converted
        weather_data_json = json.loads(json.dumps(song_data.weather_data, default=serialize_datetime)) if song_data.weather_data else None
        news_data_json = json.loads(json.dumps(song_data.news_data, default=serialize_datetime)) if song_data.news_data else None
        calendar_data_json = json.loads(json.dumps(song_data.calendar_data, default=serialize_datetime)) if song_data.calendar_data else None
        
        # Prepare data for insertion
        insert_data = {
            "user_id": user_id,
            "album_id": str(song_data.album_id),
            "title": song_data.title,
            "description": song_data.description,
            "lyrics": song_data.lyrics,
            "genre_tags": song_data.genre_tags,
            "audio_url": song_data.audio_url,
            "weather_data": weather_data_json,
            "news_data": news_data_json,
            "calendar_data": calendar_data_json,
            "generation_time_seconds": song_data.generation_time_seconds,
            "llm_provider": song_data.llm_provider
        }
        
        # Insert song (share_token auto-generated by trigger)
        response = (
            supabase.table("songs")
            .insert(insert_data)
            .execute()
        )
        
        if not response.data:
            raise Exception("Failed to create song record")
        
        song = Song(**response.data[0])
        log_handler.info(f"[OK] Song created: {song.title} (share: {song.share_token})")
        
        return song
        
    except Exception as e:
        raise Exception(f"Failed to create song record: {str(e)}")


@router.get("/list")
@SlowLimiter.limit(
    f"{config['endpoints']['songs_list_endpoint']['request_limit']}/"
    f"{config['endpoints']['songs_list_endpoint']['unit_of_time_for_limit']}"
)
async def list_songs(
    request: Request,
    limit: int = 10,
    offset: int = 0,
    user_id: str = Depends(get_current_user)
):
    """
    List user's songs with pagination
    
    Args:
        limit: Maximum number of songs to return
        offset: Offset for pagination
        user_id: Authenticated user ID
        
    Returns:
        List of songs
    """
    try:
        # Use a fresh client to avoid JWT expiration issues
        from db.supabase_client import get_supabase_client
        client = get_supabase_client()
        
        response = (
            client.table("songs")
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(limit)
            .offset(offset)
            .execute()
        )
        
        songs = response.data or []
        
        # Generate signed URLs for all songs
        for song in songs:
            audio_url = song.get('audio_url')
            if audio_url:
                # Extract storage path from URL if it's a full URL
                storage_path = audio_url
                if storage_path.startswith('http'):
                    if '/audio_files/' in storage_path:
                        storage_path = storage_path.split('/audio_files/')[1].split('?')[0]
                    else:
                        continue
                
                try:
                    signed_url = supabase.storage.from_("audio_files").create_signed_url(
                        storage_path,
                        86400  # 24 hour expiry (allows browser caching)
                    )
                    if signed_url and 'signedURL' in signed_url:
                        song['audio_url'] = signed_url['signedURL']
                except Exception as e:
                    log_handler.warning(f"Failed to generate signed URL for song {song.get('id')}: {str(e)}")
        
        return {"songs": songs, "total": len(songs)}
        
    except Exception as e:
        log_handler.error(f"Failed to list songs: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to list songs: {str(e)}"
        )


@router.get("/today")
@SlowLimiter.limit(
    f"{config['endpoints']['songs_today_endpoint']['request_limit']}/"
    f"{config['endpoints']['songs_today_endpoint']['unit_of_time_for_limit']}"
)
async def get_today_song(request: Request, user_id: str = Depends(get_current_user)):
    """
    Get today's songs for the user with daily limit info
    
    Args:
        user_id: Authenticated user ID
        
    Returns:
        Dict with songs, count, and limit information
    """
    try:
        # Get today's date at midnight
        today = datetime.now().date()
        today_start = datetime.combine(today, datetime.min.time()).isoformat()
        daily_limit = config['song_generation']['daily_limit_per_user']
        
        # Query for all songs created today
        response = (
            supabase.table("songs")
            .select("*")
            .eq("user_id", user_id)
            .gte("created_at", today_start)
            .order("created_at", desc=True)
            .execute()
        )
        
        songs_today = response.data if response.data else []
        count = len(songs_today)
        
        # Calculate time until midnight (reset time)
        tomorrow = datetime.combine(today + timedelta(days=1), datetime.min.time())
        now = datetime.now()
        hours_until_reset = int((tomorrow - now).total_seconds() / 3600)
        minutes_until_reset = int(((tomorrow - now).total_seconds() % 3600) / 60)
        
        return {
            "songs": [Song(**song) for song in songs_today],
            "count": count,
            "daily_limit": daily_limit,
            "limit_reached": count >= daily_limit,
            "hours_until_reset": hours_until_reset,
            "minutes_until_reset": minutes_until_reset
        }
            
    except Exception as e:
        log_handler.error(f"Error fetching today's songs: {str(e)}")
        # Return empty data instead of raising error
        return {
            "songs": [],
            "count": 0,
            "daily_limit": config['song_generation']['daily_limit_per_user'],
            "limit_reached": False,
            "hours_until_reset": 0,
            "minutes_until_reset": 0
        }


@router.get("/{song_id}")
@SlowLimiter.limit(
    f"{config['endpoints']['songs_get_endpoint']['request_limit']}/"
    f"{config['endpoints']['songs_get_endpoint']['unit_of_time_for_limit']}"
)
async def get_song(
    request: Request,
    song_id: str
):
    """
    Get specific song by ID with album information (PUBLIC - no auth required for sharing)
    
    Args:
        song_id: Song ID
        
    Returns:
        dict: { song: Song, album: Album }
    """
    try:
        # Fetch song (no user_id filter - public access)
        song_response = (
            supabase.table("songs")
            .select("*")
            .eq("id", song_id)
            .maybe_single()
            .execute()
        )
        
        if not song_response.data:
            raise HTTPException(status_code=404, detail="Song not found")
        
        song = Song(**song_response.data)
        
        # Generate signed URL for audio (valid for 1 hour)
        if song.audio_url:
            # Extract storage path from URL if it's a full URL
            storage_path = song.audio_url
            if storage_path.startswith('http'):
                # Extract path from URL: .../audio_files/user-id/filename.mp3
                if '/audio_files/' in storage_path:
                    storage_path = storage_path.split('/audio_files/')[1].split('?')[0]
                else:
                    log_handler.warning(f"Could not extract storage path from URL: {storage_path}")
            
            # Generate signed URL (24 hours for better caching)
            try:
                signed_url = supabase.storage.from_("audio_files").create_signed_url(
                    storage_path,
                    86400  # 24 hour expiry (allows browser caching)
                )
                if signed_url and 'signedURL' in signed_url:
                    song.audio_url = signed_url['signedURL']
                    log_handler.info(f"Generated signed URL for song {song_id}")
                else:
                    log_handler.error(f"Signed URL response missing signedURL key: {signed_url}")
            except Exception as e:
                log_handler.error(f"Failed to generate signed URL for song {song_id}: {str(e)}")
        
        # Fetch album if song has album_id
        album = None
        if song.album_id:
            try:
                album_response = (
                    supabase.table("albums")
                    .select("*")
                    .eq("id", str(song.album_id))
                    .maybe_single()
                    .execute()
                )
                if album_response.data:
                    album = album_response.data
            except Exception as e:
                log_handler.warning(f"Failed to fetch album for song {song_id}: {str(e)}")
        
        return {
            "song": song,
            "album": album
        }
        
    except HTTPException:
        raise
    except Exception as e:
        log_handler.error(f"Failed to get song {song_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get song: {str(e)}"
        )

