"""
Song Generation Service with RunPod integration
Handles YuE music generation via RunPod serverless endpoint
"""
import os
import base64
import time
from typing import Dict, Any, Optional, Callable
from dotenv import load_dotenv
import runpod

load_dotenv()

RUNPOD_API_KEY = os.getenv("RUNPOD_API_KEY")
ENDPOINT_ID = os.getenv("ENDPOINT_ID")


class SongGenerationService:
    """
    Song generation service using RunPod YuE endpoint
    
    Handles:
    - Lyrics formatting for YuE
    - RunPod request execution
    - Progress tracking
    - Audio file decoding
    """
    
    def __init__(self):
        if not RUNPOD_API_KEY or not ENDPOINT_ID:
            raise EnvironmentError(
                "Missing RUNPOD_API_KEY or ENDPOINT_ID. "
                "Add them to your .env file."
            )
        
        # Initialize RunPod
        runpod.api_key = RUNPOD_API_KEY
        self.endpoint = runpod.Endpoint(ENDPOINT_ID)
        self.default_timeout = 900  # 15 minutes in seconds
    
    def generate_song(
        self,
        genre_tags: str,
        lyrics: str,
        progress_callback: Optional[Callable[[str], None]] = None
    ) -> Dict[str, Any]:
        """
        Generate song using RunPod YuE endpoint
        
        Args:
            genre_tags: YuE genre tags (5 components)
            lyrics: Formatted lyrics with [verse] and [chorus]
            progress_callback: Optional callback for progress updates
            
        Returns:
            dict: {
                "audio_data": bytes,
                "filename": str,
                "file_size_mb": float,
                "generation_time_seconds": float
            }
        """
        # Format lyrics for YuE
        formatted_lyrics = self.format_lyrics_for_yue(lyrics)
        
        # Build request
        request_input = {
            "input": {
                "genre_tags": genre_tags,
                "lyrics": formatted_lyrics
            }
        }
        
        # Send progress update
        if progress_callback:
            progress_callback("Sending request to RunPod...")
        
        print("🎵 Generating song with YuE...")
        print(f"📝 Genre: {genre_tags}")
        print(f"📝 Lyrics: {len(formatted_lyrics)} characters")
        print("⏳ This may take 7-12 minutes...")
        
        start_time = time.time()
        
        try:
            # Send request with timeout
            if progress_callback:
                progress_callback("Waiting for YuE model (7-12 minutes)...")
            
            job_result = self.endpoint.run_sync(
                request_input,
                timeout=self.default_timeout
            )
            
            elapsed = time.time() - start_time
            print(f"⏱️ Generation took {elapsed / 60:.1f} minutes")
            
            # Parse response
            if progress_callback:
                progress_callback("Processing audio response...")
            
            result = self._parse_response(job_result, elapsed)
            
            if progress_callback:
                progress_callback("Song generation complete!")
            
            return result
            
        except Exception as e:
            error_msg = f"Song generation failed: {str(e)}"
            print(f"❌ {error_msg}")
            if progress_callback:
                progress_callback(f"Error: {error_msg}")
            raise Exception(error_msg)
    
    def format_lyrics_for_yue(self, lyrics: str) -> str:
        """
        Format lyrics for YuE model
        
        Ensures:
        - Proper section markers ([verse], [chorus])
        - Double newline separation between sections
        - No trailing whitespace issues
        
        Args:
            lyrics: Raw lyrics string
            
        Returns:
            str: Formatted lyrics
        """
        # Ensure proper formatting
        lyrics = lyrics.strip()
        
        # Ensure sections are separated by double newlines
        # Replace single newlines between sections with double
        lyrics = lyrics.replace("\n[", "\n\n[")
        
        # Remove any triple+ newlines
        while "\n\n\n" in lyrics:
            lyrics = lyrics.replace("\n\n\n", "\n\n")
        
        # Ensure ends with newline
        if not lyrics.endswith("\n"):
            lyrics += "\n"
        
        return lyrics
    
    def _parse_response(
        self,
        job_result: Dict[str, Any],
        generation_time: float
    ) -> Dict[str, Any]:
        """
        Parse RunPod response and extract audio data
        
        Args:
            job_result: Raw response from RunPod
            generation_time: Time taken for generation
            
        Returns:
            dict: Parsed response with audio data
        """
        # Handle nested output structure
        if 'output' in job_result:
            output = job_result['output']
        else:
            output = job_result
        
        # Check for errors
        if isinstance(output, dict) and 'error' in output:
            error_msg = output['error']
            stdout = output.get('stdout', '')
            raise Exception(f"RunPod handler error: {error_msg}\nStdout: {stdout}")
        
        # Check for audio
        if not isinstance(output, dict) or 'audio' not in output:
            raise Exception(f"Unexpected response format: {job_result}")
        
        # Decode audio
        audio_base64 = output['audio']
        audio_data = base64.b64decode(audio_base64)
        
        filename = output.get('filename', 'song.wav')
        file_size_mb = output.get('file_size_mb', len(audio_data) / 1024 / 1024)
        
        print(f"✅ Song generated successfully!")
        print(f"📁 Filename: {filename}")
        print(f"📊 Size: {file_size_mb:.2f} MB")
        
        return {
            "audio_data": audio_data,
            "filename": filename,
            "file_size_mb": file_size_mb,
            "generation_time_seconds": generation_time
        }
    
    def save_audio(self, audio_data: bytes, output_path: str):
        """
        Save audio data to file
        
        Args:
            audio_data: Audio file bytes
            output_path: Path to save audio
        """
        with open(output_path, 'wb') as f:
            f.write(audio_data)
        
        print(f"✅ Saved audio to {output_path}")
    
    def estimate_generation_time(self, is_first_run: bool = False) -> int:
        """
        Estimate generation time in seconds
        
        Args:
            is_first_run: Whether this is the first run (models need downloading)
            
        Returns:
            int: Estimated time in seconds
        """
        if is_first_run:
            return 720  # 12 minutes for first run (model download)
        else:
            return 420  # 7 minutes for subsequent runs
    
    def get_status_message(self, elapsed_seconds: float) -> str:
        """
        Get user-friendly status message based on elapsed time
        
        Args:
            elapsed_seconds: Time elapsed since request started
            
        Returns:
            str: Status message
        """
        minutes = elapsed_seconds / 60
        
        if minutes < 1:
            return "Initializing YuE model..."
        elif minutes < 3:
            return "Loading models and processing lyrics..."
        elif minutes < 5:
            return "Generating audio (Stage 1)..."
        elif minutes < 7:
            return "Generating audio (Stage 2)..."
        elif minutes < 10:
            return "Upsampling audio quality..."
        elif minutes < 12:
            return "Finalizing song..."
        else:
            return "Still processing (this may take up to 15 minutes)..."
