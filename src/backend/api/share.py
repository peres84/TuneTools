"""
#############################################################################
### Share API endpoints
### Public access to songs via share tokens
###
### @file share.py
### @author Sebastian Russo
### @date 2025
#############################################################################
"""
from fastapi import APIRouter, HTTPException, Request
from typing import Optional

from models.song import Song
from db.supabase_client import supabase
from utils.custom_logger import log_handler
from utils.limiter import limiter as SlowLimiter
from configuration.config_loader import config

router = APIRouter()


@router.get("/song/{share_token}")
@SlowLimiter.limit(
    f"{config['endpoints']['share_get_endpoint']['request_limit']}/"
    f"{config['endpoints']['share_get_endpoint']['unit_of_time_for_limit']}"
)
async def get_shared_song(request: Request, share_token: str):
    """
    Get song by share token (public access, no authentication required)
    
    This endpoint allows anyone with the share token to access the song.
    It returns the song data along with album information for display.
    
    Args:
        share_token: Unique share token for the song
        
    Returns:
        dict: Song data with album information
        
    Raises:
        HTTPException: 404 if song not found
    """
    try:
        # Query song by share_token
        song_response = (
            supabase.table("songs")
            .select("*, albums(*)")
            .eq("share_token", share_token)
            .maybe_single()
            .execute()
        )
        
        if not song_response.data:
            raise HTTPException(
                status_code=404,
                detail="Song not found. The share link may be invalid or expired."
            )
        
        song_data = song_response.data
        album_data = song_data.pop("albums", None)
        
        # Generate signed URL for audio (valid for 1 hour)
        audio_url = song_data.get("audio_url")
        if audio_url:
            # Extract storage path from URL if it's a full URL
            storage_path = audio_url
            if storage_path.startswith('http'):
                if '/audio_files/' in storage_path:
                    storage_path = storage_path.split('/audio_files/')[1].split('?')[0]
                else:
                    log_handler.warning(f"Could not extract storage path from URL: {storage_path}")
            
            try:
                signed_url = supabase.storage.from_("audio_files").create_signed_url(
                    storage_path,
                    3600  # 1 hour expiry
                )
                if signed_url and 'signedURL' in signed_url:
                    audio_url = signed_url['signedURL']
                    log_handler.info(f"Generated signed URL for shared song {share_token}")
            except Exception as e:
                log_handler.error(f"Failed to generate signed URL for shared song {share_token}: {str(e)}")
        
        # Build response with song and album data
        response = {
            "song": {
                "id": song_data.get("id"),
                "title": song_data.get("title"),
                "description": song_data.get("description"),
                "lyrics": song_data.get("lyrics"),
                "genre_tags": song_data.get("genre_tags"),
                "audio_url": audio_url,
                "share_token": song_data.get("share_token"),
                "created_at": song_data.get("created_at"),
                "weather_data": song_data.get("weather_data"),
                "news_data": song_data.get("news_data"),
                "calendar_data": song_data.get("calendar_data"),
            },
            "album": {
                "id": album_data.get("id") if album_data else None,
                "name": album_data.get("name") if album_data else None,
                "vinyl_disk_url": album_data.get("vinyl_disk_url") if album_data else None,
                "week_start": album_data.get("week_start") if album_data else None,
                "week_end": album_data.get("week_end") if album_data else None,
            } if album_data else None,
            "branding": {
                "message": "my daily song",
                "platform": "TuneTools"
            }
        }
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve shared song: {str(e)}"
        )
