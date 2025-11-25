"""
User-related Pydantic models
"""
from pydantic import BaseModel, Field, validator
from typing import List
from datetime import datetime
from uuid import UUID


class UserProfile(BaseModel):
    """User profile model"""
    id: UUID
    created_at: datetime
    updated_at: datetime
    onboarding_completed: bool = False

    class Config:
        from_attributes = True


class UserPreferences(BaseModel):
    """User preferences for news and music generation"""
    id: UUID | None = None
    user_id: UUID
    categories: List[str] = Field(
        ...,
        min_items=1,
        description="News categories (e.g., technology, sports, business)"
    )
    music_genres: List[str] = Field(
        ...,
        min_items=1,
        description="Preferred music genres"
    )
    vocal_preference: str = Field(
        ...,
        description="Vocal preference: male, female, or neutral"
    )
    mood_preference: str = Field(
        ...,
        description="Mood preference for songs"
    )
    created_at: datetime | None = None
    updated_at: datetime | None = None

    @validator("vocal_preference")
    def validate_vocal_preference(cls, v):
        """Validate vocal preference is one of allowed values"""
        allowed = ["male", "female", "neutral"]
        if v not in allowed:
            raise ValueError(f"vocal_preference must be one of {allowed}")
        return v

    @validator("categories")
    def validate_categories(cls, v):
        """Ensure categories list is not empty"""
        if not v or len(v) == 0:
            raise ValueError("At least one category must be selected")
        return v

    @validator("music_genres")
    def validate_music_genres(cls, v):
        """Ensure music genres list is not empty"""
        if not v or len(v) == 0:
            raise ValueError("At least one music genre must be selected")
        return v

    class Config:
        from_attributes = True


class UserPreferencesCreate(BaseModel):
    """Model for creating user preferences"""
    categories: List[str] = Field(..., min_items=1)
    music_genres: List[str] = Field(..., min_items=1)
    vocal_preference: str
    mood_preference: str

    @validator("vocal_preference")
    def validate_vocal_preference(cls, v):
        allowed = ["male", "female", "neutral"]
        if v not in allowed:
            raise ValueError(f"vocal_preference must be one of {allowed}")
        return v


class UserPreferencesUpdate(BaseModel):
    """Model for updating user preferences"""
    categories: List[str] | None = None
    music_genres: List[str] | None = None
    vocal_preference: str | None = None
    mood_preference: str | None = None

    @validator("vocal_preference")
    def validate_vocal_preference(cls, v):
        if v is not None:
            allowed = ["male", "female", "neutral"]
            if v not in allowed:
                raise ValueError(f"vocal_preference must be one of {allowed}")
        return v
