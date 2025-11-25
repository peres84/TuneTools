"""
Album-related Pydantic models
"""
from pydantic import BaseModel, Field, validator
from datetime import datetime, date
from uuid import UUID
from typing import List


class Album(BaseModel):
    """Album model"""
    id: UUID
    user_id: UUID
    name: str = Field(..., min_length=1, max_length=200)
    week_start: date
    week_end: date
    vinyl_disk_url: str = Field(..., min_length=1)
    song_count: int = Field(default=0, ge=0, le=7)
    is_complete: bool = False
    created_at: datetime
    updated_at: datetime

    @validator("week_end")
    def validate_week_end_after_start(cls, v, values):
        """Ensure week_end is after week_start"""
        if "week_start" in values and v <= values["week_start"]:
            raise ValueError("week_end must be after week_start")
        return v

    @validator("is_complete")
    def validate_completion_status(cls, v, values):
        """Ensure is_complete matches song_count"""
        if "song_count" in values:
            expected_complete = values["song_count"] >= 7
            if v != expected_complete:
                # Auto-correct the completion status
                return expected_complete
        return v

    class Config:
        from_attributes = True


class AlbumCreate(BaseModel):
    """Model for creating an album"""
    name: str = Field(..., min_length=1, max_length=200)
    week_start: date
    week_end: date
    vinyl_disk_url: str = Field(..., min_length=1)

    @validator("week_end")
    def validate_week_end_after_start(cls, v, values):
        """Ensure week_end is after week_start"""
        if "week_start" in values and v <= values["week_start"]:
            raise ValueError("week_end must be after week_start")
        return v


class AlbumWithSongs(BaseModel):
    """Album model with associated songs"""
    album: Album
    songs: List["Song"] = []

    class Config:
        from_attributes = True


# Import Song for type hint (avoid circular import)
from .song import Song
AlbumWithSongs.model_rebuild()
