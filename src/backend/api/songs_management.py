"""
#############################################################################
### Songs Management API endpoints
### CRUD operations for songs (update, delete)
###
### @file songs_management.py
### @author Sebastian Russo
### @date 2025
#############################################################################
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

from db.supabase_client import supabase
from utils.middleware import get_current_user
from utils.custom_logger import log_handler
from utils.limiter import limiter as SlowLimiter
from configuration.config_loader import config

router = APIRouter()


class SongUpdateRequest(BaseModel):
    title: str | None = None
    description: str | None = None


@router.patch("/{song_id}")
@SlowLimiter.limit("10/minute")
async def update_song(
    request: Request,
    song_id: str,
    update_data: SongUpdateRequest,
    user_id: str = Depends(get_current_user)
):
    """
    Update song title and/or description
    
    Args:
        song_id: Song ID to update
        update_data: Fields to update
        user_id: Authenticated user ID
        
    Returns:
        Updated song data
    """
    try:
        # Build update dict with only provided fields
        updates = {}
        if update_data.title is not None:
            updates['title'] = update_data.title
        if update_data.description is not None:
            updates['description'] = update_data.description
        
        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        # Update song (RLS ensures user owns the song)
        response = (
            supabase.table("songs")
            .update(updates)
            .eq("id", song_id)
            .eq("user_id", user_id)
            .execute()
        )
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Song not found or unauthorized")
        
        log_handler.info(f"[UPDATE] Song {song_id} updated by user {user_id}")
        
        return response.data[0]
        
    except HTTPException:
        raise
    except Exception as e:
        log_handler.error(f"[ERROR] Failed to update song: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update song: {str(e)}")


@router.delete("/{song_id}")
@SlowLimiter.limit("10/minute")
async def delete_song(
    request: Request,
    song_id: str,
    user_id: str = Depends(get_current_user)
):
    """
    Delete a song
    
    Args:
        song_id: Song ID to delete
        user_id: Authenticated user ID
        
    Returns:
        Success message
    """
    try:
        # Get song info before deletion (for cleanup)
        song_response = (
            supabase.table("songs")
            .select("audio_url, album_id")
            .eq("id", song_id)
            .eq("user_id", user_id)
            .single()
            .execute()
        )
        
        if not song_response.data:
            raise HTTPException(status_code=404, detail="Song not found or unauthorized")
        
        song_data = song_response.data
        audio_url = song_data.get('audio_url')
        
        # Delete song from database (RLS ensures user owns the song)
        # Trigger will automatically update album song_count
        delete_response = (
            supabase.table("songs")
            .delete()
            .eq("id", song_id)
            .eq("user_id", user_id)
            .execute()
        )
        
        log_handler.info(f"[DELETE] Song {song_id} deleted from database by user {user_id}")
        
        # Delete audio file from storage
        if audio_url:
            try:
                # Extract storage path from URL if it's a full URL
                storage_path = audio_url
                if storage_path.startswith('http'):
                    if '/audio_files/' in storage_path:
                        storage_path = storage_path.split('/audio_files/')[1].split('?')[0]
                
                # Delete from storage
                supabase.storage.from_("audio_files").remove([storage_path])
                log_handler.info(f"[DELETE] Audio file deleted: {storage_path}")
            except Exception as e:
                # Log error but don't fail the request since DB record is already deleted
                log_handler.warning(f"[DELETE] Failed to delete audio file {audio_url}: {str(e)}")
        
        return {"message": "Song deleted successfully", "song_id": song_id}
        
    except HTTPException:
        raise
    except Exception as e:
        log_handler.error(f"[ERROR] Failed to delete song: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete song: {str(e)}")
