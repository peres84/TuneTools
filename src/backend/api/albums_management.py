"""
#############################################################################
### Albums Management API endpoints
### CRUD operations for albums (update, delete, update vinyl disk)
###
### @file albums_management.py
### @author Sebastian Russo
### @date 2025
#############################################################################
"""
from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File
from pydantic import BaseModel
from datetime import datetime

from db.supabase_client import supabase
from utils.middleware import get_current_user
from utils.custom_logger import log_handler
from utils.limiter import limiter as SlowLimiter
from services.vinyl_disk import VinylDiskService

router = APIRouter()
vinyl_service = VinylDiskService()


class AlbumUpdateRequest(BaseModel):
    name: str | None = None


@router.patch("/{album_id}")
@SlowLimiter.limit("10/minute")
async def update_album(
    request: Request,
    album_id: str,
    update_data: AlbumUpdateRequest,
    user_id: str = Depends(get_current_user)
):
    """
    Update album name
    
    Args:
        album_id: Album ID to update
        update_data: Fields to update
        user_id: Authenticated user ID
        
    Returns:
        Updated album data
    """
    try:
        if not update_data.name:
            raise HTTPException(status_code=400, detail="Album name is required")
        
        # Update album (RLS ensures user owns the album)
        response = (
            supabase.table("albums")
            .update({"name": update_data.name})
            .eq("id", album_id)
            .eq("user_id", user_id)
            .execute()
        )
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Album not found or unauthorized")
        
        log_handler.info(f"[UPDATE] Album {album_id} updated by user {user_id}")
        
        return response.data[0]
        
    except HTTPException:
        raise
    except Exception as e:
        log_handler.error(f"[ERROR] Failed to update album: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update album: {str(e)}")


@router.delete("/{album_id}")
@SlowLimiter.limit("10/minute")
async def delete_album(
    request: Request,
    album_id: str,
    user_id: str = Depends(get_current_user)
):
    """
    Delete an album and all its songs
    
    Args:
        album_id: Album ID to delete
        user_id: Authenticated user ID
        
    Returns:
        Success message
    """
    try:
        # Get album info before deletion
        album_response = (
            supabase.table("albums")
            .select("vinyl_disk_url, song_count")
            .eq("id", album_id)
            .eq("user_id", user_id)
            .single()
            .execute()
        )
        
        if not album_response.data:
            raise HTTPException(status_code=404, detail="Album not found or unauthorized")
        
        # Delete album (CASCADE will delete all songs)
        delete_response = (
            supabase.table("albums")
            .delete()
            .eq("id", album_id)
            .eq("user_id", user_id)
            .execute()
        )
        
        # TODO: Delete vinyl disk from storage
        # vinyl_disk_url = album_response.data['vinyl_disk_url']
        # Extract filename and delete from vinyl_disks bucket
        
        log_handler.info(f"[DELETE] Album {album_id} deleted by user {user_id}")
        
        return {
            "message": "Album and all its songs deleted successfully",
            "album_id": album_id,
            "songs_deleted": album_response.data['song_count']
        }
        
    except HTTPException:
        raise
    except Exception as e:
        log_handler.error(f"[ERROR] Failed to delete album: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete album: {str(e)}")


@router.post("/{album_id}/vinyl-disk")
@SlowLimiter.limit("5/minute")
async def update_vinyl_disk(
    request: Request,
    album_id: str,
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user)
):
    """
    Update album vinyl disk with a new image
    
    Args:
        album_id: Album ID to update
        file: Image file to convert to vinyl disk
        user_id: Authenticated user ID
        
    Returns:
        Updated album data with new vinyl disk URL
    """
    try:
        # Validate file type
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Verify user owns the album
        album_response = (
            supabase.table("albums")
            .select("id, week_start")
            .eq("id", album_id)
            .eq("user_id", user_id)
            .single()
            .execute()
        )
        
        if not album_response.data:
            raise HTTPException(status_code=404, detail="Album not found or unauthorized")
        
        # Read uploaded image
        image_data = await file.read()
        
        # Convert to vinyl disk
        log_handler.info(f"[VINYL] Creating vinyl disk from uploaded image...")
        vinyl_data = vinyl_service.create_vinyl_disk(image_data)
        
        # Upload to Supabase storage
        week_start = album_response.data['week_start']
        filename = f"{user_id}/{week_start}_vinyl.png"
        
        # Delete old vinyl disk first
        try:
            supabase.storage.from_("vinyl_disks").remove([filename])
        except:
            pass  # Ignore if file doesn't exist
        
        # Upload new vinyl disk
        upload_response = supabase.storage.from_("vinyl_disks").upload(
            filename,
            vinyl_data,
            file_options={"content-type": "image/png", "upsert": "true"}
        )
        
        # Get public URL
        vinyl_disk_url = supabase.storage.from_("vinyl_disks").get_public_url(filename)
        
        # Update album with new vinyl disk URL
        update_response = (
            supabase.table("albums")
            .update({"vinyl_disk_url": vinyl_disk_url})
            .eq("id", album_id)
            .eq("user_id", user_id)
            .execute()
        )
        
        log_handler.info(f"[UPDATE] Vinyl disk updated for album {album_id}")
        
        return update_response.data[0]
        
    except HTTPException:
        raise
    except Exception as e:
        log_handler.error(f"[ERROR] Failed to update vinyl disk: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update vinyl disk: {str(e)}")
