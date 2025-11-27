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
    ) -> bytes:
        """
        Generate album artwork for a weekly album
        
        Args:
            week_start: Week start date (YYYY-MM-DD)
            week_end: Week end date (YYYY-MM-DD)
            song_themes: List of themes from songs in the album
            user_preferences: User's music preferences
            
        Returns:
            bytes: PNG image data
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
                print("🎨 Trying Gemini Imagen (primary)...")
                image_data = self._generate_with_gemini(prompt)
                print("✅ Gemini generated artwork")
                return image_data
            except Exception as e:
                print(f"⚠️ Gemini failed: {str(e)}")
        
        # Fallback to OpenAI DALL-E
        if self.openai_available:
            try:
                print("🎨 Trying OpenAI DALL-E (fallback)...")
                image_data = self._generate_with_dalle(prompt)
                print("✅ DALL-E generated artwork")
                return image_data
            except Exception as e:
                print(f"❌ DALL-E failed: {str(e)}")
                raise Exception("All image generation services failed")
        
        raise Exception("No image generation service available")
    
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
        Generate image using Google Gemini Imagen
        
        Note: As of now, Gemini image generation is in preview.
        This implementation uses the Imagen API endpoint.
        """
        import google.generativeai as genai
        
        genai.configure(api_key=GEMINI_API_KEY)
        
        # Use configured Gemini model for image generation
        # Note: Actual Imagen API may differ - adjust as needed
        model = genai.GenerativeModel(GEMINI_MODEL)
        
        # For now, we'll use DALL-E style approach
        # Gemini Imagen API integration would go here
        raise NotImplementedError(
            "Gemini Imagen API integration pending. "
            "Will fallback to DALL-E."
        )
    
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
        
        print(f"✅ Saved artwork to {output_path}")
    
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
