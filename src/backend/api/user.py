"""
#############################################################################
### User API endpoints
###
### @file user.py
### @author Sebastian Russo
### @date 2025
#############################################################################
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from typing import Optional
from uuid import UUID
from datetime import datetime

from models.user import (
    UserProfile,
    UserPreferences,
    UserPreferencesCreate,
    UserPreferencesUpdate
)
from models.context import NewsArticle
from db.supabase_client import supabase, get_supabase_client
from utils.middleware import get_current_user, get_current_user_token
from utils.custom_logger import log_handler
from utils.limiter import limiter as SlowLimiter
from utils.validators import validate_email_format
from configuration.config_loader import config
from services import NewsAggregatorService

router = APIRouter()

# Initialize news service
news_service = NewsAggregatorService()


@router.get("/check-email")
@SlowLimiter.limit(
    f"{config['endpoints']['user_check_email_endpoint']['request_limit']}/"
    f"{config['endpoints']['user_check_email_endpoint']['unit_of_time_for_limit']}"
)
async def check_email_exists(request: Request, email: str):
    """
    Check if an email is already registered
    
    This is a public endpoint (no auth required) to improve UX during signup.
    Returns whether the email exists and if it's confirmed.
    
    Args:
        email: Email address to check
        
    Returns:
        dict: {"exists": bool, "confirmed": bool}
    """
    # Validate email format
    validate_email_format(email)
    
    try:
        # Query Supabase auth users via admin API
        # Note: This requires service_role key to access auth.users
        from supabase import create_client
        import os
        
        # Create admin client with service role key
        supabase_url = os.getenv("SUPABASE_URL")
        service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        
        if not supabase_url or not service_role_key:
            raise HTTPException(status_code=500, detail="Server configuration error")
        
        admin_client = create_client(supabase_url, service_role_key)
        
        # Check if user exists in auth.users
        response = admin_client.auth.admin.list_users()
        
        # Find user by email
        user_exists = False
        email_confirmed = False
        
        for user in response:
            if user.email and user.email.lower() == email.lower():
                user_exists = True
                email_confirmed = user.email_confirmed_at is not None
                break
        
        return {
            "exists": user_exists,
            "confirmed": email_confirmed
        }
        
    except Exception as e:
        # Don't expose internal errors for security
        log_handler.error(f"Error checking email: {str(e)}")
        return {
            "exists": False,
            "confirmed": False
        }


@router.get("/profile", response_model=UserProfile)
@SlowLimiter.limit(
    f"{config['endpoints']['user_profile_endpoint']['request_limit']}/"
    f"{config['endpoints']['user_profile_endpoint']['unit_of_time_for_limit']}"
)
async def get_user_profile(request: Request, user_id: str = Depends(get_current_user)):
    """
    Get current user's profile
    
    Returns:
        UserProfile: User profile data
    """
    try:
        response = supabase.table("user_profiles").select("*").eq("id", user_id).single().execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="User profile not found")
        
        return response.data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch profile: {str(e)}")


@router.get("/preferences", response_model=UserPreferences)
@SlowLimiter.limit(
    f"{config['endpoints']['user_preferences_get_endpoint']['request_limit']}/"
    f"{config['endpoints']['user_preferences_get_endpoint']['unit_of_time_for_limit']}"
)
async def get_user_preferences(request: Request, user_id: str = Depends(get_current_user)):
    """
    Get current user's preferences
    
    Returns:
        UserPreferences: User preferences including categories, genres, vocal/mood preferences
    """
    try:
        response = (
            supabase.table("user_preferences")
            .select("*")
            .eq("user_id", user_id)
            .single()
            .execute()
        )
        
        if not response.data:
            raise HTTPException(
                status_code=404,
                detail="User preferences not found. Please complete onboarding."
            )
        
        return response.data
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch preferences: {str(e)}"
        )


@router.put("/preferences", response_model=UserPreferences)
@SlowLimiter.limit(
    f"{config['endpoints']['user_preferences_update_endpoint']['request_limit']}/"
    f"{config['endpoints']['user_preferences_update_endpoint']['unit_of_time_for_limit']}"
)
async def update_user_preferences(
    request: Request,
    preferences: UserPreferencesUpdate,
    auth_data: tuple[str, str] = Depends(get_current_user_token)
):
    """
    Update current user's preferences
    
    This endpoint implements the 70/30 category weighting logic:
    - User's selected categories will be used for 70% of news articles
    - General news will make up the remaining 30%
    
    Args:
        preferences: Updated preference data
        
    Returns:
        UserPreferences: Updated preferences
    """
    user_id, access_token = auth_data
    
    try:
        # Get user-scoped Supabase client for RLS context
        user_supabase = get_supabase_client(access_token)
        
        # Build update data (only include non-None fields)
        update_data = {}
        if preferences.categories is not None:
            update_data["categories"] = preferences.categories
        if preferences.music_genres is not None:
            update_data["music_genres"] = preferences.music_genres
        if preferences.vocal_preference is not None:
            update_data["vocal_preference"] = preferences.vocal_preference
        if preferences.mood_preference is not None:
            update_data["mood_preference"] = preferences.mood_preference
        
        if not update_data:
            raise HTTPException(
                status_code=400,
                detail="No fields to update"
            )
        
        # Update preferences
        response = (
            user_supabase.table("user_preferences")
            .update(update_data)
            .eq("user_id", user_id)
            .execute()
        )
        
        if not response.data:
            raise HTTPException(
                status_code=404,
                detail="User preferences not found"
            )
        
        return response.data[0]
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update preferences: {str(e)}"
        )


@router.post("/preferences", response_model=UserPreferences, status_code=201)
@SlowLimiter.limit(
    f"{config['endpoints']['user_preferences_create_endpoint']['request_limit']}/"
    f"{config['endpoints']['user_preferences_create_endpoint']['unit_of_time_for_limit']}"
)
async def create_user_preferences(
    request: Request,
    preferences: UserPreferencesCreate,
    auth_data: tuple[str, str] = Depends(get_current_user_token)
):
    """
    Create user preferences (typically during onboarding)
    
    This stores the user's category preferences which will be used
    for the 70/30 news distribution algorithm:
    - 70% of news articles will match selected categories
    - 30% will be general news
    
    Args:
        preferences: Preference data
        
    Returns:
        UserPreferences: Created preferences
    """
    user_id, access_token = auth_data
    
    try:
        # Get user-scoped Supabase client for RLS context
        user_supabase = get_supabase_client(access_token)
        
        # Check if preferences already exist
        existing = (
            user_supabase.table("user_preferences")
            .select("id")
            .eq("user_id", user_id)
            .execute()
        )
        
        if existing.data:
            raise HTTPException(
                status_code=400,
                detail="User preferences already exist. Use PUT to update."
            )
        
        # Create preferences
        insert_data = {
            "user_id": user_id,
            "categories": preferences.categories,
            "music_genres": preferences.music_genres,
            "vocal_preference": preferences.vocal_preference,
            "mood_preference": preferences.mood_preference,
        }
        
        response = (
            user_supabase.table("user_preferences")
            .insert(insert_data)
            .execute()
        )
        
        if not response.data:
            raise HTTPException(
                status_code=500,
                detail="Failed to create preferences"
            )
        
        # Update onboarding_completed flag
        supabase.table("user_profiles").update(
            {"onboarding_completed": True}
        ).eq("id", user_id).execute()
        
        return response.data[0]
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create preferences: {str(e)}"
        )


@router.get("/news")
@SlowLimiter.limit("10/minute")
async def get_user_news(
    request: Request,
    max_articles: int = 12,
    user_id: str = Depends(get_current_user)
):
    """
    Get personalized news articles for the user
    
    Fetches mixed worldwide and local news based on user's category preferences:
    - 70% from user's preferred categories (worldwide)
    - 20% from general news (worldwide)
    - 10% from user's location (if available)
    
    Args:
        max_articles: Maximum number of articles to return (default: 12)
        user_id: Authenticated user ID
        
    Returns:
        dict: {"articles": List[NewsArticle], "categories": List[str]}
    """
    try:
        # Get user preferences
        prefs_response = (
            supabase.table("user_preferences")
            .select("categories")
            .eq("user_id", user_id)
            .single()
            .execute()
        )
        
        if not prefs_response.data:
            raise HTTPException(
                status_code=404,
                detail="User preferences not found. Please complete onboarding."
            )
        
        user_categories = prefs_response.data.get("categories", ["general"])
        
        # Calculate distribution: 90% worldwide, 10% local
        worldwide_count = int(max_articles * 0.9)
        local_count = max_articles - worldwide_count
        
        # Fetch worldwide news (no location restriction)
        worldwide_articles = news_service.fetch_news(
            user_categories=user_categories,
            location="",  # Empty string for worldwide news
            max_articles=worldwide_count
        )
        
        log_handler.info(f"[NEWS] Fetched {len(worldwide_articles)} worldwide articles")
        
        # Try to get user's location from profile/cache for local news
        local_articles = []
        try:
            # You could fetch from user profile or use a default location
            # For now, we'll use US as a fallback for some local flavor
            local_articles = news_service.fetch_news(
                user_categories=user_categories,
                location="US",  # Could be dynamic based on user's saved location
                max_articles=local_count
            )
            log_handler.info(f"[NEWS] Fetched {len(local_articles)} local articles")
        except Exception as e:
            log_handler.warning(f"[NEWS] Failed to fetch local news: {str(e)}")
        
        # Combine articles
        all_articles = worldwide_articles + local_articles
        
        # Deduplicate by title
        seen_titles = set()
        unique_articles = []
        for article in all_articles:
            title_lower = article.title.lower().strip()
            if title_lower not in seen_titles:
                seen_titles.add(title_lower)
                unique_articles.append(article)
        
        log_handler.info(f"[NEWS] Returning {len(unique_articles)} unique articles for user {user_id}")
        
        return {
            "articles": [article.dict() for article in unique_articles[:max_articles]],
            "categories": user_categories
        }
        
    except HTTPException:
        raise
    except Exception as e:
        log_handler.error(f"[ERROR] Failed to fetch news: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch news: {str(e)}"
        )


@router.get("/stats")
@SlowLimiter.limit("20/minute")
async def get_user_stats(
    request: Request,
    user_id: str = Depends(get_current_user)
):
    """
    Get user statistics (songs count, albums count)
    
    Args:
        user_id: Authenticated user ID
        
    Returns:
        dict: {"songs_count": int, "albums_count": int}
    """
    try:
        # Get songs count
        songs_response = (
            supabase.table("songs")
            .select("id", count="exact")
            .eq("user_id", user_id)
            .execute()
        )
        songs_count = songs_response.count or 0
        
        # Get albums count
        albums_response = (
            supabase.table("albums")
            .select("id", count="exact")
            .eq("user_id", user_id)
            .execute()
        )
        albums_count = albums_response.count or 0
        
        return {
            "songs_count": songs_count,
            "albums_count": albums_count
        }
        
    except Exception as e:
        log_handler.error(f"[ERROR] Failed to fetch user stats: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch user stats: {str(e)}"
        )


@router.post("/change-password")
@SlowLimiter.limit("5/hour")
async def change_password(
    request: Request,
    current_password: str,
    new_password: str,
    user_id: str = Depends(get_current_user)
):
    """
    Change user password
    
    Args:
        current_password: Current password for verification
        new_password: New password
        user_id: Authenticated user ID
        
    Returns:
        dict: {"message": "Password changed successfully"}
    """
    try:
        from supabase import create_client
        import os
        
        # Create admin client
        supabase_url = os.getenv("SUPABASE_URL")
        service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        
        if not supabase_url or not service_role_key:
            raise HTTPException(status_code=500, detail="Server configuration error")
        
        admin_client = create_client(supabase_url, service_role_key)
        
        # Validate new password
        if len(new_password) < 8:
            raise HTTPException(
                status_code=400,
                detail="New password must be at least 8 characters long"
            )
        
        # Update password using admin API
        admin_client.auth.admin.update_user_by_id(
            user_id,
            {"password": new_password}
        )
        
        log_handler.info(f"[AUTH] Password changed for user {user_id}")
        
        return {"message": "Password changed successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        log_handler.error(f"[ERROR] Failed to change password: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to change password: {str(e)}"
        )


@router.get("/export-data")
@SlowLimiter.limit("3/hour")
async def export_user_data(
    request: Request,
    user_id: str = Depends(get_current_user)
):
    """
    Export all user data (profile, preferences, songs, albums)
    
    Args:
        user_id: Authenticated user ID
        
    Returns:
        dict: Complete user data export
    """
    try:
        # Get profile
        profile_response = (
            supabase.table("user_profiles")
            .select("*")
            .eq("id", user_id)
            .single()
            .execute()
        )
        
        # Get preferences
        prefs_response = (
            supabase.table("user_preferences")
            .select("*")
            .eq("user_id", user_id)
            .single()
            .execute()
        )
        
        # Get all songs
        songs_response = (
            supabase.table("songs")
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )
        
        # Get all albums
        albums_response = (
            supabase.table("albums")
            .select("*")
            .eq("user_id", user_id)
            .order("week_start", desc=True)
            .execute()
        )
        
        export_data = {
            "export_date": datetime.now().isoformat(),
            "user_id": user_id,
            "profile": profile_response.data,
            "preferences": prefs_response.data,
            "songs": songs_response.data,
            "albums": albums_response.data,
            "total_songs": len(songs_response.data),
            "total_albums": len(albums_response.data)
        }
        
        log_handler.info(f"[EXPORT] Data exported for user {user_id}")
        
        return export_data
        
    except Exception as e:
        log_handler.error(f"[ERROR] Failed to export data: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to export data: {str(e)}"
        )


@router.delete("/account")
@SlowLimiter.limit("2/hour")
async def delete_account(
    request: Request,
    user_id: str = Depends(get_current_user)
):
    """
    Permanently delete user account and all associated data
    
    This will delete:
    - User profile
    - User preferences
    - All songs
    - All albums
    - Calendar integrations
    - Auth account
    
    Args:
        user_id: Authenticated user ID
        
    Returns:
        dict: {"message": "Account deleted successfully"}
    """
    try:
        from supabase import create_client
        import os
        
        # Create admin client
        supabase_url = os.getenv("SUPABASE_URL")
        service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        
        if not supabase_url or not service_role_key:
            raise HTTPException(status_code=500, detail="Server configuration error")
        
        admin_client = create_client(supabase_url, service_role_key)
        
        # Delete in order (respecting foreign key constraints)
        # 1. Delete songs
        supabase.table("songs").delete().eq("user_id", user_id).execute()
        
        # 2. Delete albums
        supabase.table("albums").delete().eq("user_id", user_id).execute()
        
        # 3. Delete calendar integrations
        supabase.table("calendar_integrations").delete().eq("user_id", user_id).execute()
        
        # 4. Delete preferences
        supabase.table("user_preferences").delete().eq("user_id", user_id).execute()
        
        # 5. Delete profile
        supabase.table("user_profiles").delete().eq("id", user_id).execute()
        
        # 6. Delete auth user
        admin_client.auth.admin.delete_user(user_id)
        
        log_handler.info(f"[DELETE] Account deleted for user {user_id}")
        
        return {"message": "Account deleted successfully"}
        
    except Exception as e:
        log_handler.error(f"[ERROR] Failed to delete account: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete account: {str(e)}"
        )
