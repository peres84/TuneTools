"""
#############################################################################
### Albums API endpoints
###
### @file albums.py
### @author Sebastian Russo
### @date 2025
#############################################################################
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from typing import List

from models.album import Album, AlbumWithSongs
from db.supabase_client import supabase
from utils.middleware import get_current_user
from utils.custom_logger import log_handler
from utils.limiter import limiter as SlowLimiter
from configuration.config_loader import config
from services import AlbumService

router = APIRouter()

# Initialize service
album_service = AlbumService()


@router.get("/list", response_model=List[Album])
@SlowLimiter.limit(
    f"{config['endpoints']['albums_list_endpoint']['request_limit']}/"
    f"{config['endpoints']['albums_list_endpoint']['unit_of_time_for_limit']}"
)
async def list_albums(
    request: Request,
    limit: int = 10,
    offset: int = 0,
    user_id: str = Depends(get_current_user)
):
    """
    List user's albums in chronological order (newest first)
    
    Args:
        limit: Maximum number of albums to return (default: 10)
        offset: Offset for pagination (default: 0)
        user_id: Authenticated user ID
        
    Returns:
        List[Album]: User's albums ordered by week_start DESC
    """
    try:
        albums = album_service.list_user_albums(
            user_id=user_id,
            limit=limit,
            offset=offset
        )
        
        return albums
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to list albums: {str(e)}"
        )


@router.get("/current-week", response_model=Album)
@SlowLimiter.limit(
    f"{config['endpoints']['albums_current_endpoint']['request_limit']}/"
    f"{config['endpoints']['albums_current_endpoint']['unit_of_time_for_limit']}"
)
async def get_current_week_album(request: Request, user_id: str = Depends(get_current_user)):
    """
    Get the album for the current week
    
    If no album exists yet, returns 404.
    Use POST /api/songs/generate to create the first song and album.
    
    Args:
        user_id: Authenticated user ID
        
    Returns:
        Album: Current week's album
    """
    try:
        # Calculate current week boundaries
        week_start, week_end = album_service.get_week_boundaries()
        week_start_date = week_start.date()
        
        # Get album for current week
        album_data = album_service._get_album_by_week(user_id, week_start_date)
        
        if not album_data:
            raise HTTPException(
                status_code=404,
                detail="No album exists for current week. Generate your first song to create one!"
            )
        
        return Album(**album_data)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get current week album: {str(e)}"
        )


@router.get("/{album_id}", response_model=AlbumWithSongs)
@SlowLimiter.limit(
    f"{config['endpoints']['albums_get_endpoint']['request_limit']}/"
    f"{config['endpoints']['albums_get_endpoint']['unit_of_time_for_limit']}"
)
async def get_album_with_songs(
    request: Request,
    album_id: str,
    user_id: str = Depends(get_current_user)
):
    """
    Get album with all its songs
    
    Args:
        album_id: Album ID
        user_id: Authenticated user ID
        
    Returns:
        AlbumWithSongs: Album with songs list
    """
    try:
        # Get album with songs
        album_data = album_service.get_album_with_songs(album_id)
        
        if not album_data:
            raise HTTPException(
                status_code=404,
                detail="Album not found"
            )
        
        # Verify ownership
        if album_data['user_id'] != user_id:
            raise HTTPException(
                status_code=403,
                detail="Access denied"
            )
        
        # Convert to AlbumWithSongs model
        album = Album(**{k: v for k, v in album_data.items() if k != 'songs'})
        songs = album_data.get('songs', [])
        
        return AlbumWithSongs(
            album=album,
            songs=songs
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get album: {str(e)}"
        )
