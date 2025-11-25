"""
Context data models for song generation
"""
from pydantic import BaseModel, Field
from typing import List, Dict, Any
from datetime import datetime


class WeatherData(BaseModel):
    """Weather data model"""
    location: str
    city: str
    country: str
    temp_c: float
    temp_f: float
    weather_condition: str
    humidity: int = Field(..., ge=0, le=100)
    wind_speed_kph: float
    wind_speed_mph: float
    precipitation_mm: float
    precipitation_in: float
    icon: str
    local_time: str

    class Config:
        from_attributes = True


class NewsArticle(BaseModel):
    """News article model"""
    title: str = Field(..., min_length=1)
    description: str | None = None
    content: str | None = None
    url: str
    source: str
    author: str | None = None
    published_at: str
    image_url: str | None = None

    class Config:
        from_attributes = True


class CalendarActivity(BaseModel):
    """Calendar activity model"""
    title: str = Field(..., min_length=1)
    start_time: datetime
    end_time: datetime | None = None
    location: str | None = None
    description: str | None = None
    is_all_day: bool = False

    class Config:
        from_attributes = True


class ContextData(BaseModel):
    """Aggregated context data for song generation"""
    weather: WeatherData | None = None
    news: List[NewsArticle] = []
    calendar_activities: List[CalendarActivity] = []
    user_preferences: Dict[str, Any] | None = None

    class Config:
        from_attributes = True
