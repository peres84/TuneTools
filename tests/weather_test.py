"""
Weather API Test Script
Fetches current weather data using OpenWeatherMap API
"""
import os
import requests
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables
load_dotenv()

OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")

if not OPENWEATHER_API_KEY:
    raise EnvironmentError(
        "Missing OPENWEATHER_API_KEY. "
        "Add it to your .env file: OPENWEATHER_API_KEY=your_api_key_here"
    )


def get_weather_by_city(city_name):
    """
    Get current weather data by city name

    Args:
        city_name (str): Name of the city

    Returns:
        dict: Weather data including temperature, humidity, wind, precipitation
    """
    if not city_name or city_name.strip() == "":
        raise ValueError("City name cannot be empty")

    url = f"https://api.openweathermap.org/data/2.5/weather?q={city_name}&appid={OPENWEATHER_API_KEY}"

    try:
        response = requests.get(url, timeout=10)

        if response.status_code == 200:
            data = response.json()
            return parse_weather_data(data)
        elif response.status_code == 404:
            raise Exception(f"City '{city_name}' not found")
        else:
            raise Exception(f"API Error: {response.status_code} - {response.text}")

    except requests.exceptions.RequestException as e:
        raise Exception(f"Network error: {str(e)}")


def get_weather_by_coords(latitude, longitude):
    """
    Get current weather data by latitude and longitude

    Args:
        latitude (float): Latitude coordinate
        longitude (float): Longitude coordinate

    Returns:
        dict: Weather data including temperature, humidity, wind, precipitation
    """
    url = f"https://api.openweathermap.org/data/2.5/weather?lat={latitude}&lon={longitude}&appid={OPENWEATHER_API_KEY}"

    try:
        response = requests.get(url, timeout=10)

        if response.status_code == 200:
            data = response.json()
            return parse_weather_data(data)
        else:
            raise Exception(f"API Error: {response.status_code} - {response.text}")

    except requests.exceptions.RequestException as e:
        raise Exception(f"Network error: {str(e)}")


def parse_weather_data(data):
    """
    Parse and extract relevant weather data from API response

    Args:
        data (dict): Raw API response

    Returns:
        dict: Parsed weather data with temperature, humidity, wind, precipitation
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

    return {
        "coord": {"lat": lat, "lon": lon},
        "location": f"{city_name}, {country_code}",
        "city": city_name,
        "country": country_code,
        "utc_time": utc_time.isoformat(),
        "local_time": local_time.strftime("%A %d, %B %H:%M"),
        "icon": weather_icon,
        # Temperature
        "temp_c": round(c_temp, 1),
        "temp_f": round(f_temp, 1),
        "temp_k": round(k_temp, 1),
        # Weather condition
        "weather_condition": weather_condition,
        # Wind
        "wind_speed_kph": round(kph_wind_speed, 1),
        "wind_speed_mph": round(mph_wind_speed, 1),
        # Humidity
        "humidity": humidity,
        # Precipitation
        "precipitation_mm": round(mm_precipitation, 2),
        "precipitation_in": round(in_precipitation, 2),
    }


def print_weather_summary(weather_data):
    """Print a formatted weather summary"""
    print("\n" + "=" * 60)
    print(f"🌍 Weather for {weather_data['location']}")
    print("=" * 60)
    print(f"📅 Time: {weather_data['local_time']}")
    print(f"🌤️  Condition: {weather_data['weather_condition'].title()}")
    print(
        f"🌡️  Temperature: {weather_data['temp_c']}°C / {weather_data['temp_f']}°F"
    )
    print(f"💧 Humidity: {weather_data['humidity']}%")
    print(f"🌧️  Precipitation: {weather_data['precipitation_mm']} mm")
    print(f"💨 Wind: {weather_data['wind_speed_kph']} km/h")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    # Test 1: Get weather by city name
    print("🧪 Test 1: Weather by City Name")
    try:
        weather = get_weather_by_city("Berlin")
        print_weather_summary(weather)
    except Exception as e:
        print(f"❌ Error: {str(e)}\n")

    # Test 2: Get weather by coordinates (Berlin)
    print("🧪 Test 2: Weather by Coordinates")
    try:
        weather = get_weather_by_coords(52.5200, 13.4050)
        print_weather_summary(weather)
    except Exception as e:
        print(f"❌ Error: {str(e)}\n")

    # Test 3: Invalid city
    print("🧪 Test 3: Invalid City (should fail)")
    try:
        weather = get_weather_by_city("InvalidCityName12345")
        print_weather_summary(weather)
    except Exception as e:
        print(f"✅ Expected error: {str(e)}\n")
