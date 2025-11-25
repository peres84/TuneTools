"""
Song-related Pydantic models
"""
from pydantic import BaseModel, Field, validator
from typing import Dict, Any
from datetime import datetime
from uuid import UUID


class SongMetadata(BaseModel):
    """Song generation metadata"""
    weather_data: Dict[str, Any] | None = None
    news_data: Dict[str, Any] | None = None
    calendar_data: Dict[str, Any] | None = None
    generation_time_seconds: float | None = None
    llm_provider: str | None = None


class Song(BaseModel):
    """Song model"""
    id: UUID
    user_id: UUID
    album_id: UUID
    title: str = Field(..., min_length=1, max_length=200)
    description: str | None = None
    lyrics: str = Field(..., min_length=1)
    genre_tags: str = Field(..., min_length=1)
    audio_url: str = Field(..., min_length=1)
    share_token: str = Field(..., min_length=1)
    created_at: datetime
    
    # Metadata
    weather_data: Dict[str, Any] | None = None
    news_data: Dict[str, Any] | None = None
    calendar_data: Dict[str, Any] | None = None
    generation_time_seconds: float | None = None
    llm_provider: str | None = None

    @validator("lyrics")
    def validate_lyrics_structure(cls, v):
        """Validate lyrics contain verse and chorus markers"""
        if "[verse]" not in v.lower() or "[chorus]" not in v.lower():
            raise ValueError("Lyrics must contain [verse] and [chorus] sections")
        return v

    @validator("genre_tags")
    def validate_genre_tags_structure(cls, v):
        """Validate genre tags have 5 components"""
        components = v.strip().split()
        if len(components) < 3:
            raise ValueError("Genre tags must have at least 3 components")
        return v

    class Config:
        from_attributes = True


class SongCreate(BaseModel):
    """Model for creating a song"""
    title: str = Field(..., min_length=1, max_length=200)
    description: str | None = None
    lyrics: str = Field(..., min_length=1)
    genre_tags: str = Field(..., min_length=1)
    audio_url: str = Field(..., min_length=1)
    album_id: UUID
    
    # Metadata
    weather_data: Dict[str, Any] | None = None
    news_data: Dict[str, Any] | None = None
    calendar_data: Dict[str, Any] | None = None
    generation_time_seconds: float | None = None
    llm_provider: str | None = None

    @validator("lyrics")
    def validate_lyrics_structure(cls, v):
        """Validate lyrics contain verse and chorus markers"""
        if "[verse]" not in v.lower() or "[chorus]" not in v.lower():
            raise ValueError("Lyrics must contain [verse] and [chorus] sections")
        return v


class SongResponse(BaseModel):
    """Response model for song with album info"""
    song: Song
    album_name: str
    album_vinyl_disk_url: str
