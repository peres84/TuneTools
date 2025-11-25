"""
LLM Service with OpenAI and Gemini fallback
Generates song lyrics and genre tags following YuE guidelines
"""
import os
import json
from typing import Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")


class LLMService:
    """
    LLM service for generating song lyrics and genre tags
    
    Primary: OpenAI GPT-4
    Fallback: Google Gemini
    """
    
    def __init__(self):
        self.openai_available = bool(OPENAI_API_KEY)
        self.gemini_available = bool(GEMINI_API_KEY)
        
        if not self.openai_available and not self.gemini_available:
            raise EnvironmentError(
                "No LLM API keys configured. "
                "Add OPENAI_API_KEY or GEMINI_API_KEY to .env"
            )
    
    def generate_song_content(
        self,
        weather_data: Dict[str, Any],
        news_articles: list,
        calendar_activities: list,
        user_preferences: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate song lyrics and genre tags from context
        
        Args:
            weather_data: Weather information
            news_articles: List of news articles
            calendar_activities: List of calendar events
            user_preferences: User's music preferences
            
        Returns:
            dict: {
                "genre_tags": str,
                "lyrics": str,
                "title": str,
                "description": str
            }
        """
        # Build context prompt
        prompt = self._build_song_prompt(
            weather_data,
            news_articles,
            calendar_activities,
            user_preferences
        )
        
        # Try OpenAI first
        if self.openai_available:
            try:
                print("🤖 Trying OpenAI (primary)...")
                response = self._call_openai(prompt)
                print("✅ OpenAI generated song content")
                return self._parse_and_validate_response(response)
            except Exception as e:
                print(f"⚠️ OpenAI failed: {str(e)}")
        
        # Fallback to Gemini
        if self.gemini_available:
            try:
                print("🤖 Trying Gemini (fallback)...")
                response = self._call_gemini(prompt)
                print("✅ Gemini generated song content")
                return self._parse_and_validate_response(response)
            except Exception as e:
                print(f"❌ Gemini failed: {str(e)}")
                raise Exception("All LLM services failed")
        
        raise Exception("No LLM service available")
    
    def _build_song_prompt(
        self,
        weather_data: Dict[str, Any],
        news_articles: list,
        calendar_activities: list,
        user_preferences: Dict[str, Any]
    ) -> str:
        """Build prompt for LLM following YuE guidelines"""
        
        # Format context
        weather_summary = f"{weather_data.get('weather_condition', 'clear')}, {weather_data.get('temp_c', 20)}°C"
        
        news_summary = "\n".join([
            f"- {article.get('title', '')}"
            for article in news_articles[:3]
        ])
        
        calendar_summary = "\n".join([
            f"- {activity.get('title', '')}"
            for activity in calendar_activities[:3]
        ]) if calendar_activities else "No scheduled activities"
        
        # Get user preferences
        preferred_genres = user_preferences.get('music_genres', ['pop', 'indie'])
        vocal_preference = user_preferences.get('vocal_preference', 'female')
        mood_preference = user_preferences.get('mood_preference', 'uplifting')
        
        prompt = f"""Create a personalized daily song based on today's context.

CONTEXT:
Weather: {weather_summary}
Top News:
{news_summary}
Schedule:
{calendar_summary}

User Preferences:
- Genres: {', '.join(preferred_genres)}
- Vocal: {vocal_preference}
- Mood: {mood_preference}

GENERATE (in JSON format):
{{
    "genre_tags": "5-component tag string for YuE music generation",
    "lyrics": "Complete lyrics with [verse] and [chorus] sections",
    "title": "Song title (max 50 characters)",
    "description": "One sentence about the song (max 100 characters)"
}}

REQUIREMENTS FOR GENRE TAGS:
- Must include 5 components (space-separated): genre, instrument, mood, gender, timbre
- Use YuE-friendly tags from: pop, rock, electronic, folk, indie, acoustic, jazz, r&b
- Mood tags: uplifting, energetic, calm, inspiring, melancholic, motivational
- Vocal tags: bright vocal, airy vocal, warm vocal, smooth vocal, powerful vocal
- Gender: male, female, neutral
- Example: "uplifting female energetic indie-pop bright vocal electronic inspiring"

REQUIREMENTS FOR LYRICS:
- Structure: [verse] section followed by [chorus] section
- Verse: Maximum 8 lines
- Chorus: Maximum 6 lines
- Each section should be ~30 seconds when sung
- Separate sections with double newline (\\n\\n)
- Tell a story: weather → news → user's day → motivation
- Make it personal and relevant to today's context
- Keep language simple and singable

Example format:
[verse]
Line 1 of verse
Line 2 of verse
...

[chorus]
Line 1 of chorus
Line 2 of chorus
...

Return ONLY valid JSON, no additional text."""

        return prompt
    
    def _call_openai(self, prompt: str) -> str:
        """Call OpenAI API"""
        import openai
        
        client = openai.OpenAI(api_key=OPENAI_API_KEY)
        
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": "You are a music producer creating personalized daily songs. Generate song specifications in JSON format following YuE music generation guidelines."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.8,
            max_tokens=1500,
            response_format={"type": "json_object"}
        )
        
        return response.choices[0].message.content
    
    def _call_gemini(self, prompt: str) -> str:
        """Call Google Gemini API"""
        import google.generativeai as genai
        
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        response = model.generate_content(
            prompt,
            generation_config={
                "temperature": 0.8,
                "max_output_tokens": 1500,
            }
        )
        
        return response.text
    
    def _parse_and_validate_response(self, response: str) -> Dict[str, Any]:
        """
        Parse and validate LLM response
        
        Validates:
        - JSON format
        - Required fields present
        - Lyrics structure ([verse] and [chorus])
        - Genre tags have at least 3 components
        """
        try:
            # Parse JSON
            data = json.loads(response)
            
            # Validate required fields
            required_fields = ["genre_tags", "lyrics", "title", "description"]
            for field in required_fields:
                if field not in data:
                    raise ValueError(f"Missing required field: {field}")
            
            # Validate lyrics structure
            lyrics = data["lyrics"]
            if "[verse]" not in lyrics.lower():
                raise ValueError("Lyrics missing [verse] section")
            if "[chorus]" not in lyrics.lower():
                raise ValueError("Lyrics missing [chorus] section")
            
            # Validate genre tags (at least 3 components)
            genre_tags = data["genre_tags"].strip()
            components = genre_tags.split()
            if len(components) < 3:
                raise ValueError(f"Genre tags must have at least 3 components, got {len(components)}")
            
            # Validate lyrics length (rough check)
            verse_section = lyrics.split("[chorus]")[0]
            verse_lines = [line for line in verse_section.split("\n") if line.strip() and not line.strip().startswith("[")]
            if len(verse_lines) > 8:
                print(f"⚠️ Warning: Verse has {len(verse_lines)} lines (max 8 recommended)")
            
            print(f"✅ Validated song content:")
            print(f"   Title: {data['title']}")
            print(f"   Genre: {genre_tags}")
            print(f"   Lyrics: {len(lyrics)} characters")
            
            return data
            
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON response: {str(e)}")
        except Exception as e:
            raise ValueError(f"Validation failed: {str(e)}")
    
    def format_for_yue(self, song_content: Dict[str, Any]) -> tuple[str, str]:
        """
        Format song content for YuE inference
        
        Args:
            song_content: Validated song content
            
        Returns:
            tuple: (genre_tags, formatted_lyrics)
        """
        genre_tags = song_content["genre_tags"].strip()
        lyrics = song_content["lyrics"].strip()
        
        # Ensure proper formatting
        if not lyrics.endswith("\n"):
            lyrics += "\n"
        
        return genre_tags, lyrics
