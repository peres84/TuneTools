"""
Image Generation Service with Gemini and OpenAI fallback
Generates album artwork for weekly albums
"""
import os
import base64
import requests
from typing import Optional
from dotenv import load_dotenv
from io import BytesIO
from PIL import Image
from configuration.config_loader import config
from utils.custom_logger import log_handler

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Get image generation configuration
IMG_CONFIG = config["image_generation"]
PRIMARY_PROVIDER = IMG_CONFIG["primary_provider"]
FALLBACK_PROVIDER = IMG_CONFIG["fallback_provider"]
GEMINI_MODEL = IMG_CONFIG["gemini_model"]
OPENAI_MODEL = IMG_CONFIG["openai_model"]
IMAGE_SIZE = IMG_CONFIG["image_size"]


class ImageGenerationService:
    """
    Image generation service for album artwork
    
    Primary: Google Gemini Imagen
    Fallback: OpenAI DALL-E
    """
    
    def __init__(self):
        self.gemini_available = bool(GEMINI_API_KEY)
        self.openai_available = bool(OPENAI_API_KEY)
        
        if not self.gemini_available and not self.openai_available:
            raise EnvironmentError(
                "No image generation API keys configured. "
                "Add GEMINI_API_KEY or OPENAI_API_KEY to .env"
            )
    
    def generate_album_artwork(
        self,
        week_start: str,
        week_end: str,
        song_themes: list[str],
        user_preferences: dict
    ) -> tuple[bytes, bool]:
        """
        Generate album artwork for a weekly album
        
        Args:
            week_start: Week start date (YYYY-MM-DD)
            week_end: Week end date (YYYY-MM-DD)
            song_themes: List of themes from songs in the album
            user_preferences: User's music preferences
            
        Returns:
            tuple: (PNG image data, image_generation_failed: bool)
        """
        # Build artwork prompt
        prompt = self._build_artwork_prompt(
            week_start,
            week_end,
            song_themes,
            user_preferences
        )
        
        # Try Gemini first (primary)
        if self.gemini_available:
            try:
                log_handler.info("[IMAGE] Trying Gemini Imagen (primary)...")
                image_data = self._generate_with_gemini(prompt)
                log_handler.info("[OK] Gemini generated artwork")
                return image_data, False
            except Exception as e:
                log_handler.warning("Gemini failed: {str(e)}")
        
        # Fallback to OpenAI DALL-E
        if self.openai_available:
            try:
                log_handler.info("[IMAGE] Trying OpenAI DALL-E (fallback)...")
                image_data = self._generate_with_dalle(prompt)
                log_handler.info("[OK] DALL-E generated artwork")
                return image_data, False
            except Exception as e:
                log_handler.error("DALL-E failed: {str(e)}")
        
        # Final fallback: Use default placeholder image
        log_handler.warning("All image services failed, using default placeholder")
        return self._generate_default_placeholder(), True
    
    def _build_artwork_prompt(
        self,
        week_start: str,
        week_end: str,
        song_themes: list[str],
        user_preferences: dict
    ) -> str:
        """Build prompt for album artwork generation"""
        
        # Extract themes
        themes_text = ", ".join(song_themes[:3]) if song_themes else "daily life"
        
        # Get user's preferred genres for style
        genres = user_preferences.get('music_genres', ['pop', 'indie'])
        genre_style = genres[0] if genres else 'modern'
        
        prompt = f"""Create an album cover artwork for a weekly music collection.

Style: {genre_style} music aesthetic, modern and vibrant
Themes: {themes_text}
Time period: Week of {week_start} to {week_end}

Requirements:
- Square format (1:1 aspect ratio)
- Vibrant colors that match {genre_style} music style
- Abstract or minimalist design
- No text or typography
- Professional album cover quality
- Suitable for vinyl disk transformation

Visual elements:
- Incorporate themes: {themes_text}
- Modern, clean aesthetic
- Eye-catching and memorable
- Suitable for music streaming platforms"""

        return prompt
    
    def _generate_with_gemini(self, prompt: str) -> bytes:
        """
        Generate image using Gemini 2.5 Flash Image
        
        Uses the official Gemini 2.5 Flash Image model with Imagen 3 integration.
        This model is available in the free tier of the Gemini API.
        """
        import google.generativeai as genai
        
        # Configure Gemini
        genai.configure(api_key=GEMINI_API_KEY)
        
        # Use Gemini 2.5 Flash Image model (supports image generation)
        model = genai.GenerativeModel(GEMINI_MODEL)
        
        # Generate image
        response = model.generate_content([prompt])
        
        # Extract image data from response
        if not response.parts:
            raise ValueError("No image generated in response")
        
        # Get the first part which should be the image
        image_part = response.parts[0]
        
        # Check if it's inline data (image)
        if hasattr(image_part, 'inline_data'):
            image_data = image_part.inline_data.data
            # Decode base64 if needed
            if isinstance(image_data, str):
                image_data = base64.b64decode(image_data)
            return image_data
        else:
            raise ValueError("Response does not contain image data")
    
    
    def _generate_with_dalle(self, prompt: str) -> bytes:
        """Generate image using OpenAI DALL-E"""
        import openai
        
        client = openai.OpenAI(api_key=OPENAI_API_KEY)
        
        response = client.images.generate(
            model=OPENAI_MODEL,
            prompt=prompt,
            size=IMAGE_SIZE,
            quality="standard",
            n=1,
        )
        
        # Get image URL
        image_url = response.data[0].url
        
        # Download image
        image_response = requests.get(image_url, timeout=30)
        image_response.raise_for_status()
        
        return image_response.content
    
    def save_image(self, image_data: bytes, output_path: str):
        """
        Save image data to file
        
        Args:
            image_data: PNG image bytes
            output_path: Path to save image
        """
        with open(output_path, 'wb') as f:
            f.write(image_data)
        
        log_handler.info(f"[OK] Saved artwork to {output_path}")
    
    def resize_to_square(self, image_data: bytes, size: int = 1000) -> bytes:
        """
        Resize image to square format
        
        Args:
            image_data: Input image bytes
            size: Target size in pixels
            
        Returns:
            bytes: Resized PNG image data
        """
        # Load image
        img = Image.open(BytesIO(image_data))
        
        # Convert to RGB if needed
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Resize to square
        img_resized = img.resize((size, size), Image.Resampling.LANCZOS)
        
        # Save to bytes
        output = BytesIO()
        img_resized.save(output, format='PNG')
        
        return output.getvalue()
    
    def _generate_default_placeholder(self) -> bytes:
        """
        Use default asset image when all services fail
        
        Returns:
            bytes: PNG image data from assets folder
        """
        import random
        
        # Get path to assets folder
        current_dir = os.path.dirname(os.path.abspath(__file__))
        backend_dir = os.path.dirname(current_dir)
        assets_dir = os.path.join(backend_dir, 'assets')
        
        # Available fallback images
        fallback_images = [
            'logo-disk-vinyl-output.png',
            'logo-disk.png'
        ]
        
        # Pick a random fallback image
        selected_image = random.choice(fallback_images)
        image_path = os.path.join(assets_dir, selected_image)
        
        try:
            with open(image_path, 'rb') as f:
                image_data = f.read()
            
            log_handler.info(f"[OK] Using fallback asset: {selected_image}")
            return image_data
            
        except Exception as e:
            log_handler.error("Failed to load fallback asset: {str(e)}")
            # Last resort: create a simple colored square
            img = Image.new('RGB', (1024, 1024), color=(138, 43, 226))
            output = BytesIO()
            img.save(output, format='PNG')
            return output.getvalue()
