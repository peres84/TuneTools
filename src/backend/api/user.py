"""
User API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from uuid import UUID

from models.user import (
    UserProfile,
    UserPreferences,
    UserPreferencesCreate,
    UserPreferencesUpdate
)
from db.supabase_client import supabase
from utils.middleware import get_current_user

router = APIRouter()


@router.get("/profile", response_model=UserProfile)
async def get_user_profile(user_id: str = Depends(get_current_user)):
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
async def get_user_preferences(user_id: str = Depends(get_current_user)):
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
async def update_user_preferences(
    preferences: UserPreferencesUpdate,
    user_id: str = Depends(get_current_user)
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
    try:
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
            supabase.table("user_preferences")
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
async def create_user_preferences(
    preferences: UserPreferencesCreate,
    user_id: str = Depends(get_current_user)
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
    try:
        # Check if preferences already exist
        existing = (
            supabase.table("user_preferences")
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
            supabase.table("user_preferences")
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
