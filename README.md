# TuneTools

TuneTools composes short, personalized songs from real-world context: news, weather, calendar events, and user preferences.

TuneTools is a prototype pipeline that:

- extracts context (news, weather, calendar)
- generates a music specification and lyrics via an LLM
- generate image for the song
- formats inputs for the YuE music pipeline
- runs YuE inference (stage1 -> stage2 -> upsampler) to produce audio

This project was created for hackathon use (Kiroween / Frankenstein category) — see the **Kiroween Submission** section below for requirements about including Kiro artifacts.

**Quick Overview**

- **Purpose:** Generate daily, context-aware music (news + weather + calendar -> short song)
- **Inputs:** News articles, weather data, calendar events, user preferences
- **Core components:** LLM-based spec/lyrics generator, YuE inference glue, RunPod-friendly handler

**Project Structure**

```
TuneTools/
├── src/
│   ├── frontend/         # React + TypeScript frontend
│   └── backend/          # FastAPI backend
├── supabase/             # Database schema and migrations
│   ├── migrations/       # SQL migration files
│   └── config.toml       # Supabase configuration
├── scripts/              # Utility scripts
│   └── create_vinyl_disk.py
├── tests/                # Test scripts
│   ├── weather_test.py
│   ├── news_test.py
│   └── runpod_severless_ep/
├── docs/                 # Documentation
├── images/               # Project assets
├── .env                  # Environment variables
├── requirements.txt      # Python dependencies
└── README.md             # This file
```

**Important Files**

- `tests/runpod_severless_ep/handler.py`: RunPod handler that lazily downloads models and runs YuE
- `tests/runpod_severless_ep/test_endpoint.py`: example client to call the RunPod endpoint
- `tests/weather_test.py`: weather API integration test
- `tests/news_test.py`: news API integration test
- `scripts/create_vinyl_disk.py`: vinyl disk image generator
- `docs/`: notes about calendar API, prompt guidelines, required models

**Note about models**: The repo expects YuE models (stage1, stage2, upsampler). See `docs/Yue_Models.md` for recommended models and sizes.

**Security / Secrets**

- Keep API keys out of the repo. Use a local `.env` file or CI secrets for `RUNPOD_API_KEY`, `ENDPOINT_ID`, and other credentials.

**How it works (high level)**

1. Collect context: calendar events (Google Calendar), current weather, and top news headlines.
2. Send context to an LLM to produce:
   - a 5-component genre tag for YuE (genre, instrument, mood, gender, timbre)
   - structured lyrics (verse/chorus)
3. Save `genre.txt` and `lyrics.txt` and run the YuE inference pipeline to synthesize audio.
4. Return the generated audio (Base64) from the serverless handler.
5. generate image using gemini banana for the song.

**Running locally (developer)**

- Create a Python virtual environment and install dependencies (add packages as needed):

`python -m venv .venv`

`.\.venv\Scripts\Activate.ps1`

`pip install -r requirements.txt` # if you add one

- To test the RunPod example client, set up a `.env` with `RUNPOD_API_KEY` and `ENDPOINT_ID` and run:

`python tests/runpod_severless_ep/test_endpoint.py`

Note: First run will download models (large) when the handler is called.

**RunPod handler (notes)**

- The handler located at `tests/runpod_severless_ep/handler.py` lazily downloads models to `/runpod-volume` (if available) or `/tmp/models` and then runs `infer.py` inside `/app/YuE/inference`.
- The handler encodes audio to Base64 and returns it in the response. See the example client in `test_endpoint.py` for usage.

# TuneTools

**Project**: TuneTools — generate short personalized songs from news, weather, calendar events, and user preferences.

**Overview**

- **Purpose**: Convert daily context into short, shareable songs.
- **Inputs**: News headlines, weather, Google Calendar events, user preferences.
- **Core components**: LLM-based spec & lyrics generator, YuE inference pipeline glue, serverless RunPod handler, optional Gemini artwork.

**Repository Layout**

- **`README.md`**: Project overview and instructions.
- **`docs/`**: Integration notes (calendar API, prompts, models).
- **`scripts/generate_image.py`**: Template to generate cover artwork via Gemini (image-generation placeholder).
- **`tests/runpod_severless_ep/handler.py`**: RunPod serverless handler that downloads models and runs YuE.
- **`tests/runpod_severless_ep/test_endpoint.py`**: Example client for the RunPod endpoint.
- **`tests/news_test.py`**: Small helper for news-related tests.

**Quick Start (developer)**

- **Create venv**: `python -m venv .venv`
- **Activate (PowerShell)**: `.\.venv\Scripts\Activate.ps1`
- **Install deps**: `pip install -r requirements.txt` (add `requirements.txt` for reproducibility)
- **Run example client** (set env vars first): `python tests/runpod_severless_ep/test_endpoint.py`

Notes: the first generation run will download large YuE models if they are not cached.

**How it works (high level)**

1. Gather context (weather, calendar, news).
2. Use an LLM to produce a 5-component genre tag and structured lyrics (verse/chorus).
3. Save `genre.txt` and `lyrics.txt` and run the YuE inference pipeline to synthesize audio.
4. The handler encodes audio as Base64 and returns it in the response.

**RunPod Handler**

- **Location**: `tests/runpod_severless_ep/handler.py`.
- **Behavior**: Lazily downloads models to `/runpod-volume` or `/tmp/models`, runs `infer.py` under `/app/YuE/inference`, and returns Base64-encoded audio.
- **Client example**: `tests/runpod_severless_ep/test_endpoint.py` demonstrates calling the handler and saving the result locally.

**Image Generation (Gemini)**

- **Script**: `scripts/generate_image.py` (template).
- **Env**: set `GEMINI_API_KEY` or `GOOGLE_API_KEY` before running.
- **Example (PowerShell)**:

```powershell
setx GEMINI_API_KEY "your_api_key_here"
.\.venv\Scripts\Activate.ps1
python scripts\generate_image.py --title "Morning Anthem" --genre "uplifting female indie-pop bright vocal" --lyrics_file sample_lyrics.txt --out cover.png
```

- **Notes**: `generate_image.py` contains a `NotImplementedError` placeholder for the actual Gemini call. Replace `generate_image_from_gemini` with your preferred Gemini SDK/REST call and credentials.

**Kiroween / Hackathon Submission (Frankenstein category)**

- **Requirement**: Include a `/.kiro` directory at the repository root containing Kiro specs, steering docs, vibe-coding transcripts, and hook code. Do NOT add `/.kiro` or its subfolders to `.gitignore`.
- **What to submit**:
  - Public repo URL with OSI-approved license
  - Live/demo URL (if available)
  - A 3-minute public demo video (YouTube/Vimeo)
  - Identify category (Frankenstein) and list Kiro features used (vibe coding, hooks, steering docs, MCP)
- **Suggested repo layout for submission**:
  - `/.kiro/` — Kiro specs and artifacts
  - `docs/kiro/` — written explanation of Kiro usage
  - `demo/` — demo scripts or generated outputs

Failure to include `/.kiro` may disqualify the submission.

---

**Last updated**: Nov 22, 2025
