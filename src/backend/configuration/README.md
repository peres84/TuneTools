# TuneTools Backend Configuration

This directory contains centralized configuration for the TuneTools backend.

## Files

- **config_file.json**: Main configuration file with all settings
- **config_loader.py**: Loads and validates configuration
- **__init__.py**: Exports config for easy importing

## Configuration Structure

### App Settings
```json
{
  "app": {
    "title": "TuneTools API",
    "description": "AI-powered daily song generation platform",
    "version": "1.0.0"
  }
}
```

### Logging
```json
{
  "logging": {
    "logging_level": "info",  // debug, info, warning, error, critical
    "dir_name": "logs",
    "log_file_name": "tunetools"
  }
}
```

### Network
```json
{
  "network": {
    "uvicorn_app_reference": "main:app",
    "server_port": 8000,
    "host": "0.0.0.0",
    "reload": true,  // Set to false in production
    "workers": 1,
    "proxy_headers": true
  }
}
```

### LLM Configuration
```json
{
  "llm": {
    "primary_provider": "openai",  // or "gemini"
    "fallback_provider": "gemini",
    "openai_model": "gpt-4o-mini",
    "gemini_model": "gemini-pro",  // or "gemini-2.0-flash"
    "temperature": 0.8,
    "max_tokens": 1500
  }
}
```

### Image Generation
```json
{
  "image_generation": {
    "primary_provider": "gemini",
    "fallback_provider": "openai",
    "gemini_model": "gemini-pro",
    "openai_model": "dall-e-3",
    "image_size": "1024x1024"
  }
}
```

### Song Generation
```json
{
  "song_generation": {
    "runpod_timeout_seconds": 900,
    "max_retries": 3
  }
}
```

### News Aggregation
```json
{
  "news": {
    "primary_api": "serpapi",
    "fallback_apis": ["newsapi", "worldnews"],
    "preferred_articles_count": 7,
    "general_articles_count": 3,
    "cache_ttl_seconds": 3600
  }
}
```

### Weather
```json
{
  "weather": {
    "default_location": "New York",
    "cache_ttl_seconds": 1800
  }
}
```

### Albums
```json
{
  "albums": {
    "songs_per_album": 7,
    "week_start_day": "monday"
  }
}
```

## Usage

### In Python Code
```python
from configuration.config_loader import config

# Access configuration
llm_model = config["llm"]["openai_model"]
server_port = config["network"]["server_port"]
log_level = config["logging"]["logging_level"]
```

### Running the Server
```bash
# From src/backend directory
python run.py
```

This will automatically load configuration and start the server with the specified settings.

## Benefits

1. **Centralized Configuration**: All settings in one place
2. **Easy Model Changes**: Change AI models without touching code
3. **Environment-Specific**: Different configs for dev/prod
4. **Type Safety**: JSON validation ensures correct structure
5. **Documentation**: Self-documenting configuration file
