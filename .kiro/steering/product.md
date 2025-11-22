# Product Overview

TuneTools generates personalized, context-aware songs from real-world data.

## Purpose

Convert daily context (news, weather, calendar events) into short, shareable songs using AI music generation.

## Core Workflow

1. **Context Collection**: Gather news headlines, weather data, and calendar events
2. **LLM Processing**: Generate music specification (5-component genre tags) and structured lyrics
3. **Audio Generation**: Run YuE inference pipeline (stage1 → stage2 → upsampler)
4. **Image Generation**: Create cover artwork using Gemini (optional)
5. **Output**: Base64-encoded audio file with metadata

## Key Components

- **YuE Pipeline**: Multi-stage AI music generation (stage1: 7B model, stage2: 1B model, upsampler)
- **RunPod Handler**: Serverless deployment with lazy model loading and persistent caching
- **Context APIs**: Integration points for news, weather, and calendar data
- **LLM Generator**: Produces genre tags and lyrics from context

## Target Use Case

Daily personalized music generation for hackathon/prototype demonstration (Kiroween submission).

## Technical Constraints

- First generation: ~12 minutes (model download)
- Subsequent generations: ~7 minutes
- Model storage: ~18.5 GB (3 models)
- Output format: WAV/MP3/FLAC audio files
