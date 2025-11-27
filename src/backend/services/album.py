"""
Album Service for weekly album management
Handles album creation, vinyl disk generation, and completion tracking
"""
import os
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from uuid import UUID

from db.supabase_client import supabase
from models.album import Album, AlbumCreate
from .image_generation import ImageGenerationService
from .vinyl_disk import VinylDiskService


class AlbumService:
    """
    Album service for managing weekly album collections
    
    Features:
    - Week boundary calculation
    - Get or create weekly album
    - Album artwork generation (once per week)
    - Vinyl disk reuse for existing albums
    - Album completion detection (7 songs)
    """
    
    def __init__(self):
        self.image_service = ImageGenerationService()
        self.vinyl_service = VinylDiskService()
    
    def get_week_boundaries(self, date: Optional[datetime] = None) -> tuple[datetime, datetime]:
        """
        Calculate week boundaries (Monday to Sunday)
        
        Args:
            date: Date to calculate boundaries for (default: today)
            
        Returns:
            tuple: (week_start, week_end) as datetime objects
        """
        if date is None:
            date = datetime.now()
        
        # Get Monday of current week (weekday 0 = Monday)
        days_since_monday = date.weekday()
        week_start = date - timedelta(days=days_since_monday)
        week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Get Sunday of current week
        week_end = week_start + timedelta(days=6)
        week_end = week_end.replace(hour=23, minute=59, second=59, microsecond=999999)
        
        return week_start, week_end
    
    def get_or_create_weekly_album(
        self,
        user_id: str,
        song_themes: List[str],
        user_preferences: Dict[str, Any],
        date: Optional[datetime] = None,
        custom_cover_data: Optional[bytes] = None
    ) -> tuple[Album, bool]:
        """
        Get existing weekly album or create new one
        
        Args:
            user_id: User ID
            song_themes: Themes from songs for artwork generation
            user_preferences: User's music preferences
            date: Date to get album for (default: today)
            
        Returns:
            tuple: (Album, image_generation_failed: bool)
        """
        # Calculate week boundaries
        week_start, week_end = self.get_week_boundaries(date)
        week_start_date = week_start.date()
        
        print(f"📅 Week: {week_start_date} to {week_end.date()}")
        
        # Check if album exists for this week
        existing_album = self._get_album_by_week(user_id, week_start_date)
        
        if existing_album:
            print(f"[OK] Found existing album: {existing_album['name']}")
            return Album(**existing_album), False
        
        # Create new album
        print("🆕 Creating new weekly album...")
        album, image_failed = self._create_new_album(
            user_id,
            week_start,
            week_end,
            song_themes,
            user_preferences,
            custom_cover_data
        )
        return album, image_failed
    
    def _get_album_by_week(self, user_id: str, week_start_date) -> Optional[Dict[str, Any]]:
        """Get album for specific week"""
        try:
            response = (
                supabase.table("albums")
                .select("*")
                .eq("user_id", user_id)
                .eq("week_start", week_start_date.isoformat())
                .single()
                .execute()
            )
            
            return response.data if response.data else None
            
        except Exception as e:
            # No album found
            return None
    
    def _create_new_album(
        self,
        user_id: str,
        week_start: datetime,
        week_end: datetime,
        song_themes: List[str],
        user_preferences: Dict[str, Any],
        custom_cover_data: Optional[bytes] = None
    ) -> tuple[Album, bool]:
        """Create new weekly album with artwork and vinyl disk"""
        
        # Generate album name
        album_name = f"Week of {week_start.strftime('%B %d, %Y')}"
        
        # Use custom cover or generate artwork
        if custom_cover_data:
            print("[IMAGE] Using custom cover image")
            artwork_data = custom_cover_data
            image_failed = False
        else:
            print("[IMAGE] Generating album artwork...")
            artwork_data, image_failed = self.image_service.generate_album_artwork(
                week_start=week_start.date().isoformat(),
                week_end=week_end.date().isoformat(),
                song_themes=song_themes,
                user_preferences=user_preferences
            )
        
        # Transform to vinyl disk
        print("[MUSIC] Creating vinyl disk...")
        vinyl_data = self.vinyl_service.create_vinyl_disk(artwork_data)
        
        # Upload vinyl disk to Supabase storage
        vinyl_disk_url = self._upload_vinyl_disk(
            user_id,
            week_start.date().isoformat(),
            vinyl_data
        )
        
        # Create album record
        album_data = {
            "user_id": user_id,
            "name": album_name,
            "week_start": week_start.date().isoformat(),
            "week_end": week_end.date().isoformat(),
            "vinyl_disk_url": vinyl_disk_url,
            "song_count": 0,
            "is_complete": False
        }
        
        response = (
            supabase.table("albums")
            .insert(album_data)
            .execute()
        )
        
        if not response.data:
            raise Exception("Failed to create album")
        
        print(f"[OK] Created album: {album_name}")
        
        return Album(**response.data[0]), image_failed
    
    def _upload_vinyl_disk(
        self,
        user_id: str,
        week_start: str,
        vinyl_data: bytes
    ) -> str:
        """
        Upload vinyl disk to Supabase storage
        
        Args:
            user_id: User ID
            week_start: Week start date (YYYY-MM-DD)
            vinyl_data: PNG image bytes
            
        Returns:
            str: Public URL of uploaded vinyl disk
        """
        # Generate filename
        filename = f"{user_id}/{week_start}_vinyl.png"
        
        print(f"📤 Uploading vinyl disk to storage: {filename}")
        
        try:
            # Try to upload, if file exists, remove it first and re-upload
            try:
                response = supabase.storage.from_("vinyl_disks").upload(
                    filename,
                    vinyl_data,
                    file_options={"content-type": "image/png"}
                )
            except Exception as upload_error:
                # If file already exists (409 Duplicate), remove and retry
                if "already exists" in str(upload_error).lower() or "409" in str(upload_error):
                    print(f"[WARN] File exists, removing and re-uploading: {filename}")
                    try:
                        supabase.storage.from_("vinyl_disks").remove([filename])
                    except:
                        pass  # Ignore if removal fails
                    
                    # Retry upload
                    response = supabase.storage.from_("vinyl_disks").upload(
                        filename,
                        vinyl_data,
                        file_options={"content-type": "image/png"}
                    )
                else:
                    raise upload_error
            
            # Get public URL
            public_url = supabase.storage.from_("vinyl_disks").get_public_url(filename)
            
            print(f"[OK] Vinyl disk uploaded: {public_url}")
            
            return public_url
            
        except Exception as e:
            raise Exception(f"Failed to upload vinyl disk: {str(e)}")
    
    def check_album_artwork_exists(self, user_id: str, week_start_date) -> bool:
        """
        Check if album artwork already exists for the week
        
        Args:
            user_id: User ID
            week_start_date: Week start date
            
        Returns:
            bool: True if artwork exists
        """
        album = self._get_album_by_week(user_id, week_start_date)
        return album is not None and album.get('vinyl_disk_url') is not None
    
    def get_vinyl_disk_url(self, album_id: UUID) -> Optional[str]:
        """
        Get vinyl disk URL for existing album (for reuse)
        
        Args:
            album_id: Album ID
            
        Returns:
            str: Vinyl disk URL or None
        """
        try:
            response = (
                supabase.table("albums")
                .select("vinyl_disk_url")
                .eq("id", str(album_id))
                .single()
                .execute()
            )
            
            if response.data:
                return response.data.get('vinyl_disk_url')
            
            return None
            
        except Exception:
            return None
    
    def check_album_completion(self, album_id: UUID) -> bool:
        """
        Check if album is complete (7 songs)
        
        Args:
            album_id: Album ID
            
        Returns:
            bool: True if album has 7 or more songs
        """
        try:
            response = (
                supabase.table("albums")
                .select("song_count, is_complete")
                .eq("id", str(album_id))
                .single()
                .execute()
            )
            
            if response.data:
                song_count = response.data.get('song_count', 0)
                is_complete = song_count >= 7
                
                # Update is_complete flag if needed
                if is_complete != response.data.get('is_complete'):
                    supabase.table("albums").update(
                        {"is_complete": is_complete}
                    ).eq("id", str(album_id)).execute()
                
                return is_complete
            
            return False
            
        except Exception:
            return False
    
    def get_album_with_songs(self, album_id: UUID) -> Optional[Dict[str, Any]]:
        """
        Get album with all its songs
        
        Args:
            album_id: Album ID
            
        Returns:
            dict: Album data with songs list
        """
        try:
            # Get album
            album_response = (
                supabase.table("albums")
                .select("*")
                .eq("id", str(album_id))
                .single()
                .execute()
            )
            
            if not album_response.data:
                return None
            
            # Get songs
            songs_response = (
                supabase.table("songs")
                .select("*")
                .eq("album_id", str(album_id))
                .order("created_at")
                .execute()
            )
            
            album_data = album_response.data
            album_data['songs'] = songs_response.data or []
            
            return album_data
            
        except Exception as e:
            print(f"[ERROR] Failed to get album with songs: {str(e)}")
            return None
    
    def list_user_albums(
        self,
        user_id: str,
        limit: int = 10,
        offset: int = 0
    ) -> List[Album]:
        """
        List user's albums in chronological order (newest first)
        
        Args:
            user_id: User ID
            limit: Maximum number of albums to return
            offset: Offset for pagination
            
        Returns:
            List[Album]: User's albums
        """
        try:
            response = (
                supabase.table("albums")
                .select("*")
                .eq("user_id", user_id)
                .order("week_start", desc=True)
                .limit(limit)
                .offset(offset)
                .execute()
            )
            
            return [Album(**album) for album in response.data] if response.data else []
            
        except Exception as e:
            print(f"[ERROR] Failed to list albums: {str(e)}")
            return []
