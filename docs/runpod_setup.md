# **YuE Serverless on RunPod - Complete Setup Guide** 🎵

---

## **Project Overview**

Deploy YuE (AI Music Generation) on RunPod Serverless with lazy-loading models and persistent volume caching.

---

## **Architecture**

```
Docker Image (~9GB):           RunPod Volume (/runpod-volume):
├── YuE code ✅                ├── YuE-s1-7B-anneal-en-cot/ (12GB)
├── All dependencies ✅        └── YuE-s2-1B-general/ (4GB)
├── xcodec (Git LFS) ✅
└── handler.py ✅              Fallback: /tmp/models (ephemeral)
```

**Key Features:**

- ✅ Lazy model loading (downloads on first request)
- ✅ Persistent storage on RunPod volume
- ✅ Automatic fallback to /tmp if volume unavailable
- ✅ Git LFS support for xcodec
- ✅ Improved error handling

---

## **Project Structure**

```
tests/
├── Dockerfile
├── handler.py
├── test_endpoint.py
└── README.md
```

---

## **File 1: Dockerfile**

Create `Dockerfile`:

```dockerfile
FROM runpod/pytorch:2.2.0-py3.10-cuda12.1.1-devel-ubuntu22.04

# Install system dependencies + git-lfs
RUN apt-get update && apt-get install -y \
    git \
    git-lfs \
    libsndfile1 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Initialize Git LFS
RUN git lfs install

# Install core Python dependencies
RUN pip install --no-cache-dir \
    transformers==4.36.0 \
    accelerate==0.25.0 \
    bitsandbytes==0.41.3 \
    runpod==1.6.2 \
    huggingface_hub \
    sentencepiece \
    soundfile \
    librosa \
    numpy \
    scipy \
    torchaudio \
    einops \
    protobuf \
    packaging

# Install flash-attention
RUN pip install --no-cache-dir \
    https://github.com/Dao-AILab/flash-attention/releases/download/v2.7.4.post1/flash_attn-2.7.4.post1+cu12torch2.2cxx11abiFALSE-cp310-cp310-linux_x86_64.whl \
    || pip install flash-attn --no-build-isolation

# Clone YuE repository
WORKDIR /app
RUN git clone https://github.com/multimodal-art-projection/YuE.git

# Install YuE requirements
WORKDIR /app/YuE
RUN pip install --no-cache-dir -r requirements.txt || echo "Some YuE deps may have failed"

# Clone xcodec WITH LFS
WORKDIR /app/YuE/inference
RUN git clone https://huggingface.co/m-a-p/xcodec_mini_infer && \
    cd xcodec_mini_infer && \
    git lfs pull

# Copy handler
WORKDIR /workspace
COPY handler.py /workspace/handler.py

# Environment variables
ENV TRANSFORMERS_CACHE=/workspace/.cache
ENV HF_HOME=/workspace/.cache
ENV PYTHONUNBUFFERED=1

# Start handler
CMD ["python", "-u", "/workspace/handler.py"]
```

---

## **File 2: handler.py**

Create `handler.py`:

```python
import runpod
import subprocess
import os
import base64
import sys
import traceback
from huggingface_hub import snapshot_download

# ---------------------------------------------------------------------------- #
#                                Global Variables                              #
# ---------------------------------------------------------------------------- #
STAGE1_PATH = None
STAGE2_PATH = None
INIT_ERROR = None

# ---------------------------------------------------------------------------- #
#                               Helper Functions                               #
# ---------------------------------------------------------------------------- #
def ensure_models_ready():
    """
    Ensure all models are available.
    Smart Logic:
    1. If /runpod-volume exists, download/load from there (Persistent).
    2. If not, fallback to /tmp (Ephemeral).
    """
    # Check if Network Volume is mounted
    volume_mount = '/runpod-volume'
    if os.path.exists(volume_mount):
        base_dir = volume_mount
        print(f"✅ Network Volume detected at {base_dir}")
    else:
        base_dir = '/tmp/models'
        print(f"⚠️ No Volume found. Using ephemeral storage at {base_dir}")

    os.makedirs(base_dir, exist_ok=True)

    # --- Stage 1 Model (12GB) ---
    print("🔍 Checking Stage 1 model...")
    s1_path = f'{base_dir}/YuE-s1-7B-anneal-en-cot'

    if not os.path.exists(s1_path):
        print(f"📦 Cache miss. Downloading Stage 1 to {s1_path}...")
        print("   (This will be saved to volume for future runs)")
        snapshot_download(
            'm-a-p/YuE-s1-7B-anneal-en-cot',
            local_dir=s1_path,
            local_dir_use_symlinks=False
        )
    else:
        print(f"✅ Found Stage 1 in storage: {s1_path}")

    # --- Stage 2 Model (4GB) ---
    print("🔍 Checking Stage 2 model...")
    s2_path = f'{base_dir}/YuE-s2-1B-general'
    if not os.path.exists(s2_path):
        print(f"📦 Downloading Stage 2 to {s2_path}...")
        snapshot_download(
            'm-a-p/YuE-s2-1B-general',
            local_dir=s2_path,
            local_dir_use_symlinks=False
        )
        print("✅ Stage 2 downloaded")
    else:
        print(f"✅ Found Stage 2 in storage: {s2_path}")

    return s1_path, s2_path

# ---------------------------------------------------------------------------- #
#                                   Handler                                    #
# ---------------------------------------------------------------------------- #
def generate_song(job):
    """
    YuE Song Generator Handler
    """
    global STAGE1_PATH, STAGE2_PATH, INIT_ERROR

    # --- 1. LAZY LOADING ---
    if STAGE1_PATH is None or STAGE2_PATH is None:
        if INIT_ERROR:
             return {"error": f"Worker previously failed to initialize: {INIT_ERROR}"}

        try:
            print("🚀 First request received - Initializing models now...")
            STAGE1_PATH, STAGE2_PATH = ensure_models_ready()
            print("✅ Initialization complete. Starting generation...")
        except Exception as e:
            INIT_ERROR = str(e)
            print(f"❌ Failed to initialize models: {INIT_ERROR}")
            traceback.print_exc()
            return {"error": f"Model download failed: {INIT_ERROR}"}

    # --- 2. GENERATION LOGIC ---
    try:
        input_data = job['input']
        genre_tags = input_data.get('genre_tags', '')
        lyrics = input_data.get('lyrics', '')

        print(f"🎵 Generating song")
        print(f"📝 Genre: {genre_tags}")
        print(f"📝 Lyrics length: {len(lyrics)} characters")

        # Create output directory
        os.makedirs('/tmp/output', exist_ok=True)

        # Write input files
        with open('/tmp/genre.txt', 'w', encoding='utf-8') as f:
            f.write(genre_tags)

        with open('/tmp/lyrics.txt', 'w', encoding='utf-8') as f:
            f.write(lyrics)

        print("🚀 Starting YuE inference...")

        # Run YuE
        result = subprocess.run([
            'python', 'infer.py',
            '--cuda_idx', '0',
            '--stage1_model', STAGE1_PATH,
            '--stage2_model', STAGE2_PATH,
            '--stage2_batch_size', '4',
            '--max_new_tokens', '2500',
            '--run_n_segments', '2',
            '--genre_txt', '/tmp/genre.txt',
            '--lyrics_txt', '/tmp/lyrics.txt',
            '--output_dir', '/tmp/output',
            '--repetition_penalty', '1.1'
        ], capture_output=True, text=True, check=True, cwd='/app/YuE/inference')

        print("✅ Generation complete!")

        # Find generated audio file
        output_files = [f for f in os.listdir('/tmp/output')
                        if f.endswith(('.wav', '.mp3', '.flac'))]

        if not output_files:
            return {
                "error": "No audio file generated",
                "stdout": result.stdout,
                "stderr": result.stderr
            }

        output_path = f'/tmp/output/{output_files[0]}'
        file_size = os.path.getsize(output_path)

        print(f"📦 Audio: {output_files[0]} ({file_size/1024/1024:.1f}MB)")

        # Encode audio as base64
        with open(output_path, 'rb') as f:
            audio_data = base64.b64encode(f.read()).decode('utf-8')

        # Cleanup /tmp/output
        try:
            os.remove(output_path)
        except:
            pass

        return {
            'audio': audio_data,
            'filename': output_files[0],
            'file_size_mb': round(file_size / 1024 / 1024, 2),
            'status': 'success'
        }

    except subprocess.CalledProcessError as e:
        # --- IMPROVED ERROR LOGGING ---
        print(f"❌ YuE Subprocess Failed!", file=sys.stderr)
        print(f"👇 STDOUT:\n{e.stdout}", file=sys.stderr)
        print(f"👇 STDERR:\n{e.stderr}", file=sys.stderr)
        return {
            "error": f"Generation failed: {e.stderr}",
            "stdout": e.stdout
        }
    except Exception as e:
        return {"error": str(e), "traceback": traceback.format_exc()}

# ---------------------------------------------------------------------------- #
#                                 Entry Point                                  #
# ---------------------------------------------------------------------------- #
runpod.serverless.start({'handler': generate_song})
```

---

## **File 3: test.py**

Create `test_endpoint.py`:

```python
import runpod
import base64
import time
from dotenv import load_dotenv
import os

# =============================================================================
# CONFIGURATION - Replace with your actual credentials
# =============================================================================
# Load environment variables from a .env file
load_dotenv()

RUNPOD_API_KEY = os.getenv("RUNPOD_API_KEY")
ENDPOINT_ID = os.getenv("ENDPOINT_ID")

if not RUNPOD_API_KEY or not ENDPOINT_ID:
    raise EnvironmentError(
        "Missing RUNPOD_API_KEY or ENDPOINT_ID. "
        "Create a .env file with: RUNPOD_API_KEY=your_key_here\\nENDPOINT_ID=your_endpoint_id"
    )

# Initialize RunPod
runpod.api_key = RUNPOD_API_KEY
endpoint = runpod.Endpoint(ENDPOINT_ID)

# =============================================================================
# TEST INPUT
# =============================================================================
test_input = {
    "input": {
        "genre_tags": "uplifting female indie-pop bright vocal electronic",
        "lyrics": """[verse]
Morning sun breaks through the clouds today
Coffee brewing, washing worries away
Berlin streets are calling out my name
Every step I take, I feel the change

[chorus]
This is my moment to shine so bright
Turn the darkness into light
Every heartbeat feels so right
Today I'm reaching new heights
"""
    }
}

# =============================================================================
# RUN TEST
# =============================================================================
print("🎵 Generating song...")
print("⏳ First run: ~12 minutes (downloading models)")
print("⏳ After that: ~7 minutes")

start_time = time.time()

try:
    # Run synchronous request with 20 min timeout
    job_result = endpoint.run_sync(test_input, timeout=1200)

    elapsed = (time.time() - start_time) / 60
    print(f"\n⏱️ Total time: {elapsed:.1f} minutes")

    # DEBUG: Print raw response structure
    print(f"🔍 Raw Response Keys: {job_result.keys()}")

    # Handle potential nested 'output' structure
    if 'output' in job_result:
        output = job_result['output']  # SDK wraps in output
    else:
        output = job_result  # Direct output

    # Check for audio in response
    if isinstance(output, dict) and 'audio' in output:
        filename = output.get('filename', 'song.wav')

        # Decode and save audio
        with open(filename, 'wb') as f:
            f.write(base64.b64decode(output['audio']))

        file_size = output.get('file_size_mb', 'unknown')
        print(f"✅ Success!")
        print(f"📁 Saved as: {filename}")
        print(f"📊 File size: {file_size} MB")
        print(f"🎧 Play it now!")

    # Handle errors from handler
    elif isinstance(output, dict) and 'error' in output:
        print(f"❌ Handler Error: {output['error']}")
        if 'stdout' in output:
            print(f"\n👇 STDOUT:\n{output['stdout']}")
        if 'traceback' in output:
            print(f"\n👇 TRACEBACK:\n{output['traceback']}")

    else:
        print(f"❌ Unexpected response format:")
        print(job_result)

except TimeoutError:
    print("❌ Local script timed out after 20 minutes")
    print("   (RunPod job might still be running)")
except Exception as e:
    print(f"❌ Request failed: {str(e)}")
    import traceback
    traceback.print_exc()
```

---

## **Build and Deploy**

### **Step 1: Build Docker Image**

```bash
# Build v14
docker build -t peresjav/yue-serverless:v1 .

# Tag as latest
docker tag peresjav/yue-serverless:v1 peresjav/yue-serverless:latest

# Push v14
docker push peresjav/yue-serverless:v1

# Push latest
docker push peresjav/yue-serverless:latest
```

**Expected build time:** 10-12 minutes

---

### **Step 2: Configure RunPod Endpoint**

#### **Endpoint Settings (EU-RO-1):**

| Setting               | Value                                                  | Notes                        |
| --------------------- | ------------------------------------------------------ | ---------------------------- |
| **Container Image**   | `peresjav/yue-serverless:v1`                           | Latest version               |
| **Container Disk**    | `40 GB`                                                | Required for model downloads |
| **GPU Count**         | `1`                                                    | RTX 4090                     |
| **Idle Timeout**      | `90 sec`                                               | Keeps workers warm           |
| **Execution Timeout** | `900 sec`                                              | 15 minutes                   |
| **FlashBoot**         | ✅ Enabled                                             | Faster cold starts           |
| **Data Centers**      | `EU-RO-1`                                              | Your region                  |
| **Network Volume**    | Optional/Remove                                        | Not required anymore         |
| **Model Cache**       | `https://huggingface.co/m-a-p/YuE-s1-7B-anneal-en-cot` | Optional beta feature        |

#### **Your Specific Configuration:**

- Endpoint ID: `xhykn3pmm80bvp`
- Region: EU-RO-1 (Romania)
- GPU: RTX 4090
- Volume: Can be removed (not used)

---

### **Step 3: Deploy New Release**

1. Go to: https://www.runpod.io/console/serverless
2. Click on `yue-song-generator`
3. Go to **"Releases"** tab
4. Click **"New Release"**
5. Container Image: `peresjav/yue-serverless:v1`
6. Click **"Deploy New Release"**
7. Wait 2-3 minutes for deployment

---

### **Step 4: Terminate Old Workers**

1. Go to **"Workers"** tab
2. Click trash icon 🗑️ on each old worker
3. Fresh workers will start on next request

---

## **Testing**

```bash
# Run test
python test_endpoint.py
```

### **Expected Results:**

**First Request (Cold Start):**

```
🎵 Generating song...
⏳ First run: ~12 minutes (downloading models)

✅ Network Volume detected at /runpod-volume
🔍 Checking Stage 1 model...
📦 Downloading Stage 1 to /runpod-volume/YuE-s1-7B-anneal-en-cot...
✅ Stage 1 downloaded

🔍 Checking Stage 2 model...
📦 Downloading Stage 2 to /runpod-volume/YuE-s2-1B-general...
✅ Stage 2 downloaded

🚀 Starting YuE inference...
✅ Generation complete!

⏱️ Total time: 12.3 minutes
✅ Success!
📁 Saved as: song.wav
📊 File size: 8.5 MB
```

**Subsequent Requests:**

```
⏱️ Total time: 7.2 minutes
✅ Success!
```

---

## **Performance Metrics**

| Metric              | First Run | Subsequent     |
| ------------------- | --------- | -------------- |
| **Model Download**  | 10-12 min | 0 min (cached) |
| **Generation Time** | 7-9 min   | 7-9 min        |
| **Total Time**      | ~12 min   | ~7 min         |
| **Cost (RTX 4090)** | ~$0.25    | ~$0.14         |

---

## **Troubleshooting**

### **"No space left on device"**

**Solution:** Increase Container Disk to 40-50 GB in endpoint settings

### **"Model download failed"**

**Solution:** Check worker logs, verify HuggingFace connection, increase timeout

### **"Worker initialization failed"**

**Solution:** Check that Container Disk is 40GB+, verify all dependencies installed

### **Timeout after 15 minutes**

**Solution:** Increase Execution Timeout to 900-1200 seconds

### **Models downloading every time**

**Solution:**

- Check if `/runpod-volume` exists in logs
- If using /tmp, models are ephemeral per worker
- Consider keeping idle timeout at 60-90 sec to reuse workers

---

## **Cost Analysis**

### **Per Song Generation:**

| Component          | Time       | Cost (RTX 4090 @ $0.80/hr) |
| ------------------ | ---------- | -------------------------- |
| First run download | 10 min     | ~$0.13                     |
| Generation         | 7 min      | ~$0.09                     |
| **Total first**    | **17 min** | **~$0.23**                 |
| **Subsequent**     | **7 min**  | **~$0.09**                 |

---

## **Advanced Configuration**

### **Environment Variables**

You can add these to Dockerfile or endpoint settings:

```dockerfile
ENV TRANSFORMERS_CACHE=/workspace/.cache
ENV HF_HOME=/workspace/.cache
ENV PYTHONUNBUFFERED=1
ENV HF_HUB_ENABLE_HF_TRANSFER=1  # Faster downloads
```

---

## **Support & Resources**

- **RunPod Docs:** https://docs.runpod.io/serverless/overview
- **YuE GitHub:** https://github.com/multimodal-art-projection/YuE
- **HuggingFace Models:** https://huggingface.co/m-a-p

---

**🎉 Congratulations! Your YuE Serverless deployment is complete!** 🎵

Generate your first AI song with `python test_endpoint.py`! 🚀
