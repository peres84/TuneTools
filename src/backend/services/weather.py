"""
Weather Service with caching
"""
import os
import requests
from typing import Dict, Optional
from datetime import datetime
from dotenv import load_dotenv
import time

from models.context import WeatherData

load_dotenv()

OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")

if not OPENWEATHER_API_KEY:
    raise EnvironmentError(
        "Missing OPENWEATHER_API_KEY. "
        "Add it to your .env file."
    )


class WeatherService:
    """
    Weather service with location-based fetching and caching
    
    Cache TTL: 30 minutes
    """
    
    def __init__(self):
        self.cache: Dict[str, tuple[WeatherData, float]] = {}
        self.cache_ttl = 1800  # 30 minutes in seconds
    
    def get_weather_by_city(self, city_name: str) -> WeatherData:
        """
        Get weather data by city name
        
        Args:
            city_name: Name of the city
            
        Returns:
            WeatherData: Current weather information
        """
        # Check cache
        cache_key = f"city:{city_name.lower()}"
        if cache_key in self.cache:
            cached_data, cached_time = self.cache[cache_key]
            if time.time() - cached_time < self.cache_ttl:
                print(f"[OK] Returning cached weather for {city_name}")
                return cached_data
        
        # Fetch from API
        print(f"[WEATHER]  Fetching weather for {city_name}")
        
        url = f"https://api.openweathermap.org/data/2.5/weather"
        params = {
            "q": city_name,
            "appid": OPENWEATHER_API_KEY
        }
        
        try:
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            weather_data = self._parse_weather_data(data)
            
            # Cache result
            self.cache[cache_key] = (weather_data, time.time())
            
            return weather_data
            
        except requests.exceptions.RequestException as e:
            raise Exception(f"Failed to fetch weather: {str(e)}")
    
    def get_weather_by_coords(self, latitude: float, longitude: float) -> WeatherData:
        """
        Get weather data by coordinates
        
        Args:
            latitude: Latitude coordinate
            longitude: Longitude coordinate
            
        Returns:
            WeatherData: Current weather information
        """
        # Check cache
        cache_key = f"coords:{latitude},{longitude}"
        if cache_key in self.cache:
            cached_data, cached_time = self.cache[cache_key]
            if time.time() - cached_time < self.cache_ttl:
                print(f"[OK] Returning cached weather for {latitude},{longitude}")
                return cached_data
        
        # Fetch from API
        print(f"[WEATHER]  Fetching weather for coordinates {latitude},{longitude}")
        
        url = f"https://api.openweathermap.org/data/2.5/weather"
        params = {
            "lat": latitude,
            "lon": longitude,
            "appid": OPENWEATHER_API_KEY
        }
        
        try:
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            weather_data = self._parse_weather_data(data)
            
            # Cache result
            self.cache[cache_key] = (weather_data, time.time())
            
            return weather_data
            
        except requests.exceptions.RequestException as e:
            raise Exception(f"Failed to fetch weather: {str(e)}")
    
    def _parse_weather_data(self, data: dict) -> WeatherData:
        """
        Parse weather data from API response
        
        Args:
            data: Raw API response
            
        Returns:
            WeatherData: Parsed weather data
        """
        # Extract coordinates
        lat = data["coord"]["lat"]
        lon = data["coord"]["lon"]
        
        # Extract location info
        city_name = data["name"]
        country_code = data["sys"]["country"]
        
        # Extract temperature (convert from Kelvin)
        k_temp = data["main"]["temp"]
        c_temp = k_temp - 273.15
        f_temp = (k_temp - 273.15) * 9 / 5 + 32
        
        # Weather condition
        weather_condition = data["weather"][0]["description"]
        weather_icon = data["weather"][0]["icon"]
        
        # Humidity
        humidity = data["main"]["humidity"]
        
        # Wind
        mph_wind_speed = data["wind"]["speed"]
        kph_wind_speed = mph_wind_speed * 1.60934
        
        # Precipitation (rain + snow in last hour)
        mm_precipitation = 0.0
        if "rain" in data and "1h" in data["rain"]:
            mm_precipitation += data["rain"]["1h"]
        if "snow" in data and "1h" in data["snow"]:
            mm_precipitation += data["snow"]["1h"]
        in_precipitation = mm_precipitation * 0.0393701
        
        # Current time
        utc_time = datetime.fromtimestamp(data["dt"])
        local_time = utc_time
        
        return WeatherData(
            location=f"{city_name}, {country_code}",
            city=city_name,
            country=country_code,
            temp_c=round(c_temp, 1),
            temp_f=round(f_temp, 1),
            weather_condition=weather_condition,
            humidity=humidity,
            wind_speed_kph=round(kph_wind_speed, 1),
            wind_speed_mph=round(mph_wind_speed, 1),
            precipitation_mm=round(mm_precipitation, 2),
            precipitation_in=round(in_precipitation, 2),
            icon=weather_icon,
            local_time=local_time.strftime("%A %d, %B %H:%M")
        )
    
    def clear_cache(self):
        """Clear the weather cache"""
        self.cache.clear()
        print("[DELETE] Weather cache cleared")
