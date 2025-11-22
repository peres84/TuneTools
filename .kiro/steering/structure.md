# Project Structure

## Root Directory

```
TuneTools/
├── .env                    # Environment variables (gitignored)
├── .example.env            # Template for required env vars
├── .gitignore              # Python, venv, secrets exclusions
├── LICENSE                 # Project license
├── README.md               # Project overview and setup instructions
├── docs/                   # Documentation and API references
├── images/                 # Project assets and logos
├── tests/                  # Test scripts and RunPod deployment
└── venv/                   # Python virtual environment (gitignored)
```

## Documentation (`docs/`)

- `api_weather.md` - Weather API integration notes
- `calendar_api.md` - Google Calendar API setup
- `docker_commands.md` - Docker build/deploy commands
- `news_apis.md` - News API integration references
- `pricing.md` - Cost analysis for RunPod deployment
- `prompt_guidelines.md` - YuE genre tag and lyrics formatting rules
- `runpod_setup.md` - Complete RunPod serverless deployment guide
- `valid_arguments_YuE.md` - YuE inference CLI arguments
- `Yue_Models.md` - Required model specifications and sizes

## Images (`images/`)

Project branding and visual assets:
- Logo variations (colored, minimalist, disk-themed)
- Album artwork templates
- UI mockups and screenshots

## Tests (`tests/`)

### Core Test Scripts
- `news_test.py` - News API integration testing
- `weather_test.py` - Weather API testing
- `image_generator.py` - Gemini image generation template
- `create_vinyl_disk.py` - Album artwork generation

### RunPod Serverless (`tests/runpod_severless_ep/`)

**Primary deployment code:**
- `handler.py` - RunPod serverless handler with lazy model loading
- `test_endpoint.py` - Client script to test deployed endpoint
- `Dockerfile` - Container image definition for RunPod
- `*.mp3` - Sample output files

### Frontend Tests (`tests/frontend/`)
- `disk_scrolling.html` - UI prototype for album display

## Code Organization Patterns

### Handler Pattern (`handler.py`)
- Global state for model paths (lazy initialization)
- `ensure_models_ready()` - Smart model downloading with volume detection
- `generate_song(job)` - Main request handler
- Error handling with detailed logging (stdout/stderr capture)

### Test Pattern (`test_endpoint.py`)
- Environment variable loading via `python-dotenv`
- Synchronous RunPod API calls with timeout handling
- Base64 audio decoding and file saving
- Timing and cost metrics logging

### Input/Output Convention
- **Input**: JSON with `genre_tags` and `lyrics` fields
- **Output**: JSON with `audio` (base64), `filename`, `file_size_mb`, `status`
- **Temporary files**: `/tmp/genre.txt`, `/tmp/lyrics.txt`, `/tmp/output/`

## YuE Integration

YuE repository expected at `/app/YuE/` in Docker container:
- `/app/YuE/inference/infer.py` - Main inference script
- `/app/YuE/inference/xcodec_mini_infer/` - Audio codec (Git LFS)

## Configuration Files

- `.env` - Local secrets (never commit)
- `.example.env` - Template showing required variables
- `.gitignore` - Excludes venv, __pycache__, .env, model caches
- `.kiro/` - Kiro AI assistant artifacts (specs, steering, hooks)

## Naming Conventions

- **Python files**: `snake_case.py`
- **Directories**: `lowercase` or `snake_case`
- **Environment variables**: `UPPER_SNAKE_CASE`
- **Docker tags**: `username/image:version`
- **Model paths**: HuggingFace format `org/model-name`

## Important Notes

- **No `.kiro/` in gitignore** - Required for hackathon submission
- **Tests directory** - Contains both test scripts AND deployment code
- **Docs are comprehensive** - Check docs/ before implementing integrations
- **Handler is production code** - Located in tests/ but used in deployment
