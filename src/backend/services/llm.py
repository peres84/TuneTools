"""
LLM Service with OpenAI and Gemini fallback
Generates song lyrics and genre tags following YuE guidelines
"""
import os
import json
from typing import Dict, Any, Optional
from dotenv import load_dotenv
from configuration.config_loader import config
from utils.custom_logger import log_handler

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Get LLM configuration
LLM_CONFIG = config["llm"]
PRIMARY_PROVIDER = LLM_CONFIG["primary_provider"]
FALLBACK_PROVIDER = LLM_CONFIG["fallback_provider"]
OPENAI_MODEL = LLM_CONFIG["openai_model"]
GEMINI_MODEL = LLM_CONFIG["gemini_model"]
TEMPERATURE = LLM_CONFIG["temperature"]
MAX_TOKENS = LLM_CONFIG["max_tokens"]


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
        user_preferences: Dict[str, Any],
        custom_title: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate song lyrics and genre tags from context
        
        Args:
            weather_data: Weather information
            news_articles: List of news articles
            calendar_activities: List of calendar events
            user_preferences: User's music preferences
            custom_title: Optional custom title to use instead of generating one
            
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
            user_preferences,
            custom_title
        )
        
        # Try OpenAI first
        if self.openai_available:
            try:
                log_handler.info("[AI] Trying OpenAI (primary)...")
                response = self._call_openai(prompt)
                log_handler.info("[OK] OpenAI generated song content")
                return self._parse_and_validate_response(response)
            except Exception as e:
                log_handler.warning("OpenAI failed: {str(e)}")
        
        # Fallback to Gemini
        if self.gemini_available:
            try:
                log_handler.info("[AI] Trying Gemini (fallback)...")
                response = self._call_gemini(prompt)
                log_handler.info("[OK] Gemini generated song content")
                return self._parse_and_validate_response(response)
            except Exception as e:
                log_handler.error("Gemini failed: {str(e)}")
                raise Exception("All services failed")
        
        raise Exception("No service available")
    
    def _build_song_prompt(
        self,
        weather_data: Dict[str, Any],
        news_articles: list,
        calendar_activities: list,
        user_preferences: Dict[str, Any],
        custom_title: Optional[str] = None
    ) -> str:
        """Build prompt for LLM following YuE guidelines with optional custom title"""
        from datetime import datetime, timezone
        
        title_instruction = f'Use this exact title: "{custom_title}"' if custom_title else "Generate a creative, catchy title"
        
        # Format context
        weather_summary = f"{weather_data.get('weather_condition', 'clear')}, {weather_data.get('temp_c', 20)}°C"
        
        # Filter calendar activities to only TODAY's events
        today = datetime.now(timezone.utc).date()
        today_activities = []
        
        for activity in calendar_activities:
            # Parse start_time (could be string or datetime)
            start_time = activity.get('start_time')
            if isinstance(start_time, str):
                try:
                    start_time = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
                except:
                    continue
            
            if start_time and start_time.date() == today:
                today_activities.append(activity)
        
        log_handler.info(f"[FILTER] Filtered {len(calendar_activities)} activities to {len(today_activities)} today's activities")
        
        # Adjust news count based on calendar activities
        # If no activities today, show more news (up to 5 articles)
        # If activities exist, show fewer news (3 articles)
        news_count = 5 if not today_activities else 3
        
        news_summary = "\n".join([
            f"- {article.get('title', '')}"
            for article in news_articles[:news_count]
        ])
        
        calendar_summary = "\n".join([
            f"- {activity.get('title', '')} at {activity.get('start_time', 'TBD')}"
            for activity in today_activities[:5]  # Max 5 activities
        ]) if today_activities else "No scheduled activities for today"
        
        # Get user preferences
        preferred_genres = user_preferences.get('music_genres', ['pop', 'indie'])
        vocal_preference = user_preferences.get('vocal_preference', 'female')
        mood_preference = user_preferences.get('mood_preference', 'uplifting')
        
        prompt = f"""You are a music producer creating a personalized daily news song using YuE music generation.

TODAY'S CONTEXT:
Weather: {weather_summary}
Top News:
{news_summary}
Schedule:
{calendar_summary}

User Preferences:
- Favorite Genres: {', '.join(preferred_genres)}
- Vocal Preference: {vocal_preference}
- Mood Preference: {mood_preference}

GENERATE (JSON format):
{{
    "genre_tags": "5-component tag string",
    "lyrics": "Complete lyrics with [verse] and [chorus] sections",
    "title": "{title_instruction}",
    "description": "One sentence about the song (max 100 characters)"
}}

GENRE TAGS REQUIREMENTS (CRITICAL):
A stable tagging prompt consists of EXACTLY 5 components (space-separated):
1. GENRE: Main style (pop, rock, electronic, folk, indie, jazz, r&b, hip-hop, country, blues, ambient)
2. INSTRUMENT: Key instruments (acoustic, electronic, guitar, piano, drums, synth)
3. MOOD: Emotional tone (uplifting, energetic, calm, inspiring, melancholic, motivational, relaxed)
4. GENDER: Vocal type (male, female, neutral)
5. TIMBRE: Vocal quality (bright vocal, airy vocal, warm vocal, smooth vocal, powerful vocal)

Order is flexible. You can repeat important descriptors for emphasis.
Use ONLY tags from YuE's top 200 most common tags for stability.

GOOD Examples:
- "uplifting female energetic indie-pop bright vocal electronic inspiring"
- "calm male acoustic folk warm vocal gentle soothing"
- "energetic female rock guitar driven powerful vocal dynamic"

BAD Examples:
- "happy song" (too vague, not 5 components)
- "death metal screaming chaos" (not YuE-friendly)

LYRICS REQUIREMENTS (CRITICAL):
- Structure: ONE [verse] section, then ONE [chorus] section (TOTAL: 2 sections only)
- Verse: 6-8 lines (~30 seconds when sung)
- Chorus: 4-6 lines (~30 seconds when sung)
- Total song length: ~60 seconds (verse + chorus)
- Separate sections with DOUBLE newline (\\n\\n)
- Tell a complete story in just these 2 sections: weather → news → calendar/activities → motivation
- Keep language simple, singable, and conversational
- Make it personal and relevant to TODAY
- DO NOT add extra verses or choruses

CORRECT Format:
[verse]
Line 1: Brief weather mention (one line only)
Line 2: News headline 1
Line 3: News headline 2
Line 4: Calendar activity or personal day
Line 5: Calendar activity or personal day
Line 6: Transition to chorus theme

[chorus]
Line 1: Main message/hook
Line 2: Main message/hook
Line 3: Motivational line
Line 4: Closing hook

IMPORTANT:
- Return ONLY valid JSON, no markdown, no code blocks
- Don't put too many words in a single line
- Keep it under 30 seconds per section
- Make it sound natural when sung"""

        return prompt
    
    def _call_openai(self, prompt: str) -> str:
        """Call OpenAI API"""
        import openai
        
        client = openai.OpenAI(api_key=OPENAI_API_KEY)
        
        response = client.chat.completions.create(
            model=OPENAI_MODEL,
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
            temperature=TEMPERATURE,
            max_tokens=MAX_TOKENS,
            response_format={"type": "json_object"}
        )
        
        return response.choices[0].message.content
    
    def _call_gemini(self, prompt: str) -> str:
        """Call Google Gemini API"""
        import google.generativeai as genai
        
        genai.configure(api_key=GEMINI_API_KEY)
        # Use configured Gemini model
        model = genai.GenerativeModel(GEMINI_MODEL)
        
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
            # Clean response (remove markdown code blocks if present)
            cleaned_response = response.strip()
            if cleaned_response.startswith("```"):
                # Remove markdown code blocks
                lines = cleaned_response.split("\n")
                # Remove first line (```json or ```)
                lines = lines[1:]
                # Remove last line (```)
                if lines and lines[-1].strip() == "```":
                    lines = lines[:-1]
                cleaned_response = "\n".join(lines).strip()
            
            # Parse JSON
            data = json.loads(cleaned_response)
            
            # Validate required fields
            required_fields = ["genre_tags", "lyrics", "title", "description"]
            for field in required_fields:
                if field not in data:
                    raise ValueError(f"Missing required field: {field}")
            
            # Validate lyrics structure
            lyrics = data["lyrics"]
            lyrics_lower = lyrics.lower()
            
            # Count sections
            verse_count = lyrics_lower.count("[verse]")
            chorus_count = lyrics_lower.count("[chorus]")
            
            if verse_count < 1:
                raise ValueError("Lyrics missing [verse] section")
            if chorus_count < 1:
                raise ValueError("Lyrics missing [chorus] section")
            
            # Warn if too many sections (should be exactly 1 verse + 1 chorus = ~60s)
            if verse_count > 1 or chorus_count > 1:
                log_handler.warning(f"[WARN] Song has {verse_count} verse(s) and {chorus_count} chorus(es). Expected: 1 verse + 1 chorus for ~60s song")
            
            # Validate genre tags (at least 3 components)
            genre_tags = data["genre_tags"].strip()
            components = genre_tags.split()
            if len(components) < 3:
                raise ValueError(f"Genre tags must have at least 3 components, got {len(components)}")
            
            # Validate lyrics length (rough check)
            verse_section = lyrics.split("[chorus]")[0]
            verse_lines = [line for line in verse_section.split("\n") if line.strip() and not line.strip().startswith("[")]
            if len(verse_lines) > 8:
                log_handler.warning("Warning: Verse has {len(verse_lines)} lines (max 8 recommended)")
            
            log_handler.info(f"[OK] Validated song content:")
            log_handler.info(f"   Title: {data['title']}")
            log_handler.info(f"   Description: {data['description']}")
            log_handler.info(f"   Genre: {genre_tags}")
            log_handler.info(f"   Lyrics: {len(lyrics)} characters")
            log_handler.info(f"\n--- FULL LYRICS ---")
            log_handler.info(lyrics)
            log_handler.info(f"--- END LYRICS ---\n")
            
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
