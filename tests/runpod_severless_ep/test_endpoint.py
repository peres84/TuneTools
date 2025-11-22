import runpod
import base64
import time
from dotenv import load_dotenv
import os

# Load environment variables from a .env file
load_dotenv()

RUNPOD_API_KEY = os.getenv("RUNPOD_API_KEY")
ENDPOINT_ID = os.getenv("ENDPOINT_ID")

if not RUNPOD_API_KEY or not ENDPOINT_ID:
    raise EnvironmentError(
        "Missing RUNPOD_API_KEY or ENDPOINT_ID. "
        "Create a .env file with: RUNPOD_API_KEY=your_key_here\\nENDPOINT_ID=your_endpoint_id"
    )

# Initialize
runpod.api_key = RUNPOD_API_KEY
endpoint = runpod.Endpoint(ENDPOINT_ID)

# Test input
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

print("🎵 Generating song...")
print("⏳ First run: ~12 minutes (downloading models)")
print("⏳ After that: ~7 minutes")

start_time = time.time()

try:
    # Run Sync (Blocking) with 15 min timeout
    # Note: If your internet drops, this script might fail, but the job continues on RunPod.
    job_result = endpoint.run_sync(test_input, timeout=1200)
    
    elapsed = (time.time() - start_time) / 60
    print(f"\n⏱️ Total time: {elapsed:.1f} minutes")
    
    # 🔍 DEBUG: Print raw keys to see what we got back
    print(f"🔍 Raw Response Keys: {job_result.keys()}")

    # Handle potential nested 'output' structure
    if 'output' in job_result:
        output = job_result['output'] # SDK sometimes wraps it here
    else:
        output = job_result # Or it returns direct output

    # Check for audio
    if isinstance(output, dict) and 'audio' in output:
        filename = output.get('filename', 'yu_song_output.wav')
        
        # Decode and Save
        with open(filename, 'wb') as f:
            f.write(base64.b64decode(output['audio']))
        
        file_size = output.get('file_size_mb', 'unknown')
        print(f"✅ Success!")
        print(f"📁 Saved as: {filename}")
        print(f"📊 File size: {file_size} MB")
    
    # Handle Application Errors (from your handler)
    elif isinstance(output, dict) and 'error' in output:
        print(f"❌ Handler Error: {output['error']}")
        if 'stdout' in output:
            print(f"👇 STDOUT:\n{output['stdout']}")
            
    else:
        print(f"❌ Unexpected Response format: {job_result}")
        
except TimeoutError:
    print("❌ Local script timed out, but RunPod job might still be running.")
except Exception as e:
    print(f"❌ Request failed: {str(e)}")