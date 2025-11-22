# TuneTools

TuneTools composes short, personalized songs from real-world context: news, weather, calendar events, and user preferences.

TuneTools is a prototype pipeline that:

- extracts context (news, weather, calendar)
- generates a music specification and lyrics via an LLM
- formats inputs for the YuE music pipeline
- runs YuE inference (stage1 -> stage2 -> upsampler) to produce audio

This project was created for hackathon use (Kiroween / Frankenstein category) — see the **Kiroween Submission** section below for requirements about including Kiro artifacts.

**Quick Overview**

- **Purpose:** Generate daily, context-aware music (news + weather + calendar -> short song)
- **Inputs:** News articles, weather data, calendar events, user preferences
- **Core components:** LLM-based spec/lyrics generator, YuE inference glue, RunPod-friendly handler

**Repository Layout (important files)**

- `README.md`: this file
- `docs/`: notes about calendar API, prompt guidelines, required models
- `tests/runpod_severless_ep/handler.py`: RunPod handler that lazily downloads models and runs YuE
- `tests/runpod_severless_ep/test_endpoint.py`: example client to call the RunPod endpoint
- `tests/news_test.py`: small test helper (scan for news articles)

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

**Kiroween / Hackathon Submission (Important)**
🎃 Welcome to Kiroween 👻

This project will be submitted to the Kiroween hackathon (Frankenstein category). To comply with Kiroween rules and maximize scores, follow these requirements when preparing your submission:

- **Include a `/.kiro` directory at the root of the repository.** This directory should contain any Kiro specs, steering docs, hooks, or other Kiro artifacts you used while developing the project. Do NOT add `/.kiro` or its subfolders to `.gitignore`.
- **Upload Kiro files**: Provide your `.kiro` folder, steering documents, example vibe-coding transcripts, and any hook code you used for automation. Judges will look for evidence of Kiro usage (vibe coding, specs, hooks, MCP usage).
- **Category:** Frankenstein — stitch together LLM prompts, YuE models, RunPod serverless, and calendar/news/weather APIs.
- **What to submit:** A public repo URL (with an OSI-approved license), a live/demo URL (if available), and a 3-minute demo video on YouTube/Vimeo (public). Include a README section describing how you used Kiro (vibe coding transcripts, hooks, specs, steering docs).

Suggested structure inside repo for submission:

- `/.kiro/` — Kiro specs, steering docs, hooks, or transcripts
- `docs/kiro/` — textual explanation of how Kiro was used (optional)
- `demo/` — short demo script or recorded outputs

Failure to include `/.kiro` or including it in `.gitignore` may disqualify the submission.

**Example README Submission Checklist (what judges expect)**

- Public repo with license
- `/.kiro` present and not ignored
- Short demo video link (3 minutes)
- Clear explanation of which Kiroween category (Frankenstein) and how Kiro was used (vibe coding, hooks, steering, MCP)

**Development notes & next steps**

- Add a `requirements.txt` or `pyproject.toml` for reproducible installs.
- Add a short script to generate `genre.txt` and `lyrics.txt` from sample inputs for local testing.
- Add a small CI job (optional) to lint and run the small tests in `tests/`.

If you want, I can:

- run the small Python tests in `tests/` now, or
- scaffold a `/.kiro` example with a simple spec and one vibe-coding transcript for submission.

---

Last updated: Nov 22, 2025

**Image generation (Gemini)**

You can generate cover artwork for each generated song using Gemini (Google's image models). Below is a short workflow and a template script included in `scripts/generate_image.py`.

Quick steps:

- Set your Gemini API key in the environment variable `GEMINI_API_KEY` or `GOOGLE_API_KEY`.
- Create a short prompt from the song's `title`, `genre` tags, and a lyrics excerpt.
- Run `scripts/generate_image.py` with `--title`, `--genre`, and `--lyrics_file` to produce an image file.

Example (PowerShell):

```powershell
setx GEMINI_API_KEY "your_api_key_here"
.\.venv\Scripts\Activate.ps1
python scripts\generate_image.py --title "Morning Anthem" --genre "uplifting female indie-pop bright vocal" --lyrics_file sample_lyrics.txt --out cover.png
```

Notes:

- The included `scripts/generate_image.py` is a template and contains a `NotImplementedError` placeholder for the actual Gemini call. Replace the `generate_image_from_gemini` function with the SDK or REST call you prefer (for example `google.generativeai` client).
- Prompt tips: include the title, a 2–4 line lyric excerpt, genre tags, and art direction (color palette, lighting, 1:1 aspect, style). Keep prompts focused and experiment with style tokens like "cinematic", "photo-real", "illustration", "film grain".

If you want, I can implement the Gemini call in `scripts/generate_image.py` for a specific client (provide the preferred SDK or API endpoint) and run a quick local test (you'll need to provide a valid `GEMINI_API_KEY`).
