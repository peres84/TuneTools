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
        
        # Debug: Check for verse and chorus sections
        has_verse = '[verse]' in lyrics.lower()
        has_chorus = '[chorus]' in lyrics.lower()
        print(f"🔍 Lyrics validation: verse={has_verse}, chorus={has_chorus}")
        
        if not has_verse or not has_chorus:
            print(f"⚠️ WARNING: Missing sections! Full lyrics:\n{lyrics}")
        
        # Debug: Show full lyrics for verification
        print(f"📄 Full lyrics:\n{lyrics}")
        
        # Create output directory
        os.makedirs('/tmp/output', exist_ok=True)
        
        # Write input files
        with open('/tmp/genre.txt', 'w', encoding='utf-8') as f:
            f.write(genre_tags)
        
        with open('/tmp/lyrics.txt', 'w', encoding='utf-8') as f:
            f.write(lyrics)
        
        print("🚀 Starting YuE inference...")
        
        # Run YuE
        # Note: Increased max_new_tokens from 2500 to 4000 to generate longer songs (~60s instead of ~25s)
        result = subprocess.run([
            'python', 'infer.py',
            '--cuda_idx', '0',
            '--stage1_model', STAGE1_PATH,
            '--stage2_model', STAGE2_PATH,
            '--stage2_batch_size', '4',
            '--max_new_tokens', '4000',  # Increased from 2500 to support 60-second songs (verse + chorus)
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