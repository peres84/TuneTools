# Technology Stack

## Language & Runtime

- **Python 3.10+** (primary language)
- **PowerShell** (Windows environment)

## Core Dependencies

### AI/ML Frameworks
- `transformers==4.36.0` - HuggingFace model loading
- `accelerate==0.25.0` - Model acceleration
- `bitsandbytes==0.41.3` - Quantization support
- `flash-attn` - Attention optimization
- `torch` / `torchaudio` - PyTorch framework

### Audio Processing
- `soundfile` - Audio I/O
- `librosa` - Audio analysis
- `scipy` - Signal processing

### Serverless Infrastructure
- `runpod==1.6.2` - RunPod SDK for serverless deployment
- `huggingface_hub` - Model downloading and caching

### Utilities
- `python-dotenv` - Environment variable management
- `sentencepiece` - Tokenization
- `einops` - Tensor operations

## YuE Models (Required)

1. **YuE-s1-7B-anneal-en-cot** (~12GB) - Stage 1: English, Chain-of-Thought mode
2. **YuE-s2-1B-general** (~4GB) - Stage 2: Audio generation
3. **YuE-upsampler** (~2.5GB) - Stage 3: Quality enhancement

Total: ~18.5 GB

## Environment Setup

### Local Development

```powershell
# Create virtual environment
python -m venv .venv

# Activate (PowerShell)
.\.venv\Scripts\Activate.ps1

# Install dependencies (if requirements.txt exists)
pip install -r requirements.txt
```

### Environment Variables

Required in `.env` file:
- `RUNPOD_API_KEY` - RunPod API authentication
- `ENDPOINT_ID` - RunPod endpoint identifier
- `GEMINI_API_KEY` or `GOOGLE_API_KEY` - For image generation (optional)

## Common Commands

### Testing RunPod Endpoint
```powershell
python tests\runpod_severless_ep\test_endpoint.py
```

### Running Tests
```powershell
python tests\news_test.py
python tests\weather_test.py
```

### Image Generation (Template)
```powershell
python tests\image_generator.py --title "Song Title" --genre "genre tags" --lyrics_file lyrics.txt --out cover.png
```

## Docker Deployment

Base image: `runpod/pytorch:2.2.0-py3.10-cuda12.1.1-devel-ubuntu22.04`

Build and push:
```bash
docker build -t username/yue-serverless:v1 .
docker push username/yue-serverless:v1
```

## RunPod Configuration

- **Container Disk**: 40GB minimum (for model downloads)
- **GPU**: RTX 4090 or equivalent
- **Execution Timeout**: 900 seconds (15 minutes)
- **Idle Timeout**: 90 seconds (keeps workers warm)
- **Region**: EU-RO-1 (or preferred datacenter)

## Model Caching Strategy

- **Persistent**: `/runpod-volume` (if network volume mounted)
- **Fallback**: `/tmp/models` (ephemeral, per-worker)
- **Lazy Loading**: Models download on first request only

## Performance Metrics

- First run (cold start): ~12 minutes
- Subsequent runs (warm): ~7 minutes
- Cost per song (RTX 4090): ~$0.09-0.23
