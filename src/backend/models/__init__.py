"""
Pydantic models for TuneTools backend
"""
from .user import UserProfile, UserPreferences
from .song import Song, SongCreate, SongMetadata
from .album import Album, AlbumCreate
from .context import WeatherData, NewsArticle, CalendarActivity, ContextData

__all__ = [
    "UserProfile",
    "UserPreferences",
    "Song",
    "SongCreate",
    "SongMetadata",
    "Album",
    "AlbumCreate",
    "WeatherData",
    "NewsArticle",
    "CalendarActivity",
    "ContextData",
]
