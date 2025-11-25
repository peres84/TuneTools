"""
Business logic services for TuneTools backend
"""
from .news_aggregator import NewsAggregatorService
from .weather import WeatherService
from .calendar import CalendarService

# TODO: Import other services as they are created
# from .llm import LLMService
# from .image_generation import ImageGenerationService
# from .vinyl_disk import VinylDiskService
# from .song_generation import SongGenerationService
# from .album import AlbumService

__all__ = [
    "NewsAggregatorService",
    "WeatherService",
    "CalendarService",
]
