"""
Share API endpoints
Public access to songs via share tokens
"""
from fastapi import APIRouter, HTTPException
from typing import Optional

from models.song import Song
from db.supabase_client import supabase

router = APIRouter()


@router.get("/song/{share_token}")
async def get_shared_song(share_token: str):
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
            .single()
            .execute()
        )
        
        if not song_response.data:
            raise HTTPException(
                status_code=404,
                detail="Song not found. The share link may be invalid or expired."
            )
        
        song_data = song_response.data
        album_data = song_data.pop("albums", None)
        
        # Build response with song and album data
        response = {
            "song": {
                "id": song_data.get("id"),
                "title": song_data.get("title"),
                "description": song_data.get("description"),
                "lyrics": song_data.get("lyrics"),
                "genre_tags": song_data.get("genre_tags"),
                "audio_url": song_data.get("audio_url"),
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
