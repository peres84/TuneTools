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
from fastapi import APIRouter, Depends, HTTPException, Request
from typing import Optional
import time
from datetime import datetime

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
    location: Optional[str] = None,
    user_id: str = Depends(get_current_user)
):
    """
    Generate a personalized daily song
    
    This is the main orchestration endpoint that:
    1. Aggregates context data (news, weather, calendar)
    2. Generates lyrics and genre tags via LLM
    3. Gets or creates weekly album
    4. Generates album artwork (only for new albums)
    5. Generates song audio via RunPod
    6. Stores audio in Supabase storage
    7. Stores song metadata in database
    8. Returns song with share token
    
    Args:
        location: City name or coordinates (optional, uses user profile if not provided)
        user_id: Authenticated user ID
        
    Returns:
        SongResponse: Generated song with album info
    """
    start_time = time.time()
    
    try:
        log_handler.info(f"🎵 Starting song generation for user {user_id}")
        
        # Step 1: Aggregate context data
        log_handler.info("📊 Step 1: Aggregating context data...")
        context_data = await _aggregate_context_data(user_id, location)
        
        # Step 2: Generate lyrics and genre tags
        log_handler.info("🤖 Step 2: Generating lyrics and genre tags...")
        song_content = llm_service.generate_song_content(
            weather_data=context_data.get('weather', {}),
            news_articles=context_data.get('news', []),
            calendar_activities=context_data.get('calendar', []),
            user_preferences=context_data.get('user_preferences', {})
        )
        
        # Step 3: Get or create weekly album
        log_handler.info("📀 Step 3: Getting weekly album...")
        album = album_service.get_or_create_weekly_album(
            user_id=user_id,
            song_themes=[song_content['title']],
            user_preferences=context_data.get('user_preferences', {})
        )
        
        # Step 4: Generate song audio
        log_handler.info("🎼 Step 4: Generating song audio...")
        genre_tags, formatted_lyrics = llm_service.format_for_yue(song_content)
        
        audio_result = song_service.generate_song(
            genre_tags=genre_tags,
            lyrics=formatted_lyrics
        )
        
        # Step 5: Store audio in Supabase storage
        log_handler.info("💾 Step 5: Storing audio file...")
        audio_url = await _store_audio_file(
            user_id=user_id,
            audio_data=audio_result['audio_data'],
            filename=audio_result['filename']
        )
        
        # Step 6: Store song metadata in database
        log_handler.info("📝 Step 6: Storing song metadata...")
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
        
        elapsed = time.time() - start_time
        log_handler.info(f"✅ Song generation complete! ({elapsed / 60:.1f} minutes)")
        
        # Return song with album info
        return SongResponse(
            song=song,
            album_name=album.name,
            album_vinyl_disk_url=album.vinyl_disk_url
        )
        
    except Exception as e:
        log_handler.error(f"❌ Song generation failed: {str(e)}")
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
            .single()
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
        log_handler.warning(f"⚠️ Failed to get user preferences: {str(e)}")
        context['user_preferences'] = {
            'categories': ['general'],
            'music_genres': ['pop'],
            'vocal_preference': 'neutral',
            'mood_preference': 'calm'
        }
    
    # Get weather data
    try:
        if location:
            weather = weather_service.get_weather_by_city(location)
        else:
            # Default to a major city or use user's location from profile
            weather = weather_service.get_weather_by_city("New York")
        
        context['weather'] = weather.dict()
        log_handler.info(f"✅ Weather: {weather.weather_condition}, {weather.temp_c}°C")
    except Exception as e:
        log_handler.warning(f"⚠️ Failed to get weather: {str(e)}")
        context['weather'] = None
    
    # Get news articles
    try:
        user_categories = context['user_preferences'].get('categories', ['general'])
        news_articles = news_service.fetch_news(
            user_categories=user_categories,
            location="US",
            max_articles=10
        )
        
        context['news'] = [article.dict() for article in news_articles]
        log_handler.info(f"✅ News: {len(news_articles)} articles")
    except Exception as e:
        log_handler.warning(f"⚠️ Failed to get news: {str(e)}")
        context['news'] = []
    
    # Get calendar activities
    try:
        activities = await calendar_service.get_calendar_activities(
            user_id=user_id,
            days_ahead=1
        )
        
        context['calendar'] = [activity.dict() for activity in activities]
        log_handler.info(f"✅ Calendar: {len(activities)} activities")
    except Exception as e:
        log_handler.warning(f"⚠️ Failed to get calendar: {str(e)}")
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
        
        # Get public URL
        public_url = supabase.storage.from_("audio_files").get_public_url(storage_filename)
        
        log_handler.info(f"✅ Audio uploaded: {storage_filename}")
        
        return public_url
        
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
        # Prepare data for insertion
        insert_data = {
            "user_id": user_id,
            "album_id": str(song_data.album_id),
            "title": song_data.title,
            "description": song_data.description,
            "lyrics": song_data.lyrics,
            "genre_tags": song_data.genre_tags,
            "audio_url": song_data.audio_url,
            "weather_data": song_data.weather_data,
            "news_data": song_data.news_data,
            "calendar_data": song_data.calendar_data,
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
        log_handler.info(f"✅ Song created: {song.title} (share: {song.share_token})")
        
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
        response = (
            supabase.table("songs")
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(limit)
            .offset(offset)
            .execute()
        )
        
        return {"songs": response.data or [], "total": len(response.data or [])}
        
    except Exception as e:
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
    Get today's song for the user
    
    Args:
        user_id: Authenticated user ID
        
    Returns:
        Song or None if no song exists for today
    """
    try:
        # Get today's date at midnight
        today = datetime.now().date()
        today_start = datetime.combine(today, datetime.min.time()).isoformat()
        
        # Query for songs created today
        response = (
            supabase.table("songs")
            .select("*")
            .eq("user_id", user_id)
            .gte("created_at", today_start)
            .limit(1)
            .execute()
        )
        
        # Return the first song if it exists
        if response.data and len(response.data) > 0:
            return Song(**response.data[0])
        
        # Return None if no song for today (this is valid, not an error)
        return None
            
    except Exception as e:
        log_handler.error(f"Error fetching today's song: {str(e)}")
        # Return None instead of raising error - no song today is valid
        return None


@router.get("/{song_id}")
@SlowLimiter.limit(
    f"{config['endpoints']['songs_get_endpoint']['request_limit']}/"
    f"{config['endpoints']['songs_get_endpoint']['unit_of_time_for_limit']}"
)
async def get_song(
    request: Request,
    song_id: str,
    user_id: str = Depends(get_current_user)
):
    """
    Get specific song by ID
    
    Args:
        song_id: Song ID
        user_id: Authenticated user ID
        
    Returns:
        Song
    """
    try:
        response = (
            supabase.table("songs")
            .select("*")
            .eq("id", song_id)
            .eq("user_id", user_id)
            .single()
            .execute()
        )
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Song not found")
        
        return Song(**response.data)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get song: {str(e)}"
        )
