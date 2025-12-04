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
    
    async def generate_song_content(
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
                response = await self._call_openai(prompt)
                log_handler.info("[OK] OpenAI generated song content")
                log_handler.info(f"[DEBUG] Raw OpenAI response length: {len(response)} chars")
                return self._parse_and_validate_response(response)
            except Exception as e:
                log_handler.warning("OpenAI failed: {str(e)}")
        
        # Fallback to Gemini
        if self.gemini_available:
            try:
                log_handler.info("[AI] Trying Gemini (fallback)...")
                response = await self._call_gemini(prompt)
                log_handler.info("[OK] Gemini generated song content")
                log_handler.info(f"[DEBUG] Raw Gemini response length: {len(response)} chars")
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

LYRICS REQUIREMENTS (CRITICAL - MUST INCLUDE BOTH SECTIONS):
- Structure: EXACTLY ONE [verse] section, then EXACTLY ONE [chorus] section (TOTAL: 2 sections ONLY)
- Verse: EXACTLY 4 lines (concise and focused)
- Chorus: 4-6 lines maximum (catchy and memorable)
- Total song length: ~60 seconds when sung
- Separate sections with DOUBLE newline (\\n\\n)
- Tell a complete story in just these 2 sections: weather → news → calendar/activities → motivation
- Keep language simple, singable, and conversational
- Make it personal and relevant to TODAY
- DO NOT add extra verses, choruses, bridges, outros, or any other sections
- DO NOT repeat sections (no [verse] [chorus] [verse] [chorus] pattern)
- SIMPLE STRUCTURE ONLY: [verse] then [chorus], nothing else
- BOTH [verse] AND [chorus] sections are MANDATORY - the song is incomplete without both

CORRECT Format (SIMPLE STRUCTURE - NO REPEATS):
[verse]
Line 1: Brief weather mention
Line 2: News headline or calendar activity
Line 3: News headline or calendar activity  
Line 4: Transition to chorus

[chorus]
Line 1: Main message/hook
Line 2: Main message/hook (can repeat line 1 for emphasis)
Line 3: Motivational line
Line 4: Closing hook
Line 5-6: Optional additional hook lines (max 6 lines total)

WRONG Examples (DO NOT DO THIS):
❌ [verse] [chorus] [verse] [chorus] - NO REPEATING SECTIONS
❌ [verse] [chorus] [bridge] [outro] - NO EXTRA SECTIONS
❌ Multiple verses or choruses - ONLY ONE OF EACH

RIGHT Example:
✅ [verse] [chorus] - SIMPLE AND COMPLETE

CRITICAL VALIDATION CHECKLIST (MUST PASS ALL):
✓ Does your response include EXACTLY ONE [verse] section? (REQUIRED)
✓ Does your response include EXACTLY ONE [chorus] section? (REQUIRED)
✓ Are both sections separated by a double newline?
✓ Is the verse EXACTLY 4 lines?
✓ Is the chorus 4-6 lines maximum?
✓ Are there NO other sections (no [bridge], [outro], [intro], etc.)?
✓ Are there NO repeated sections (no second verse or chorus)?

IMPORTANT:
- Return ONLY valid JSON, no markdown, no code blocks
- Don't put too many words in a single line
- Make it sound natural when sung
- VERIFY the structure is EXACTLY: [verse] (4 lines) then [chorus] (4-6 lines)
- If you add ANY extra sections or repeat sections, the lyrics will be REJECTED"""

        return prompt
    
    async def _call_openai(self, prompt: str) -> str:
        """Call OpenAI API"""
        import openai
        
        client = openai.AsyncOpenAI(api_key=OPENAI_API_KEY)
        
        response = await client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "You are a music producer creating personalized daily songs. Generate song specifications in JSON format following YuE music generation guidelines. CRITICAL RULES: 1) EXACTLY ONE [verse] section (4 lines), 2) EXACTLY ONE [chorus] section (4-6 lines), 3) NO repeating sections, 4) NO bridges, outros, or intros, 5) SIMPLE structure: [verse] then [chorus] only. Any deviation will be rejected."
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
    
    async def _call_gemini(self, prompt: str) -> str:
        """Call Google Gemini API (wrapped in thread to prevent blocking)"""
        import google.generativeai as genai
        import asyncio
        
        def _sync_gemini_call():
            genai.configure(api_key=GEMINI_API_KEY)
            # Use configured Gemini model
            model = genai.GenerativeModel(
                GEMINI_MODEL,
                system_instruction="You are a music producer creating personalized daily songs. CRITICAL RULES: 1) EXACTLY ONE [verse] section (4 lines), 2) EXACTLY ONE [chorus] section (4-6 lines), 3) NO repeating sections, 4) NO bridges, outros, or intros, 5) SIMPLE structure: [verse] then [chorus] only. Any deviation will be rejected."
            )
            
            response = model.generate_content(
                prompt,
                generation_config={
                    "temperature": 0.8,
                    "max_output_tokens": 1500,
                }
            )
            
            log_handler.info(f"[DEBUG] Gemini response candidates: {len(response.candidates) if hasattr(response, 'candidates') else 'N/A'}")
            
            return response.text
        
        # Run in thread pool to prevent blocking
        return await asyncio.to_thread(_sync_gemini_call)
    
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
            bridge_count = lyrics_lower.count("[bridge]")
            outro_count = lyrics_lower.count("[outro]")
            intro_count = lyrics_lower.count("[intro]")
            
            log_handler.info(f"[DEBUG] Lyrics validation - Verse: {verse_count}, Chorus: {chorus_count}, Bridge: {bridge_count}, Outro: {outro_count}, Intro: {intro_count}")
            log_handler.info(f"[DEBUG] Total lyrics length: {len(lyrics)} characters")
            
            # Check for required sections
            if verse_count < 1:
                log_handler.error(f"[ERROR] Lyrics missing [verse] section. Lyrics preview: {lyrics[:200]}")
                raise ValueError("Lyrics missing [verse] section")
            if chorus_count < 1:
                log_handler.error(f"[ERROR] Lyrics missing [chorus] section. Lyrics preview: {lyrics[:200]}")
                raise ValueError("Lyrics missing [chorus] section")
            
            # Reject if too many sections (should be exactly 1 verse + 1 chorus)
            if verse_count > 1:
                log_handler.error(f"[ERROR] Too many verses! Found {verse_count}, expected 1. Rejecting lyrics.")
                raise ValueError(f"Too many verses: {verse_count}. Only 1 verse allowed for 60-second songs.")
            if chorus_count > 1:
                log_handler.error(f"[ERROR] Too many choruses! Found {chorus_count}, expected 1. Rejecting lyrics.")
                raise ValueError(f"Too many choruses: {chorus_count}. Only 1 chorus allowed for 60-second songs.")
            
            # Reject if extra sections found
            if bridge_count > 0 or outro_count > 0 or intro_count > 0:
                log_handler.error(f"[ERROR] Extra sections found! Bridge: {bridge_count}, Outro: {outro_count}, Intro: {intro_count}. Only [verse] and [chorus] allowed.")
                raise ValueError(f"Extra sections not allowed. Found: bridge={bridge_count}, outro={outro_count}, intro={intro_count}. Only [verse] and [chorus] permitted.")
            
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
            
            # Split lyrics into sections for detailed logging
            sections = lyrics.split('[chorus]')
            verse_section = sections[0] if len(sections) > 0 else ""
            chorus_section = sections[1] if len(sections) > 1 else ""
            
            verse_lines = [line for line in verse_section.split('\n') if line.strip() and not line.strip().startswith('[')]
            chorus_lines = [line for line in chorus_section.split('\n') if line.strip()]
            
            log_handler.info(f"[OK] Validated song content:")
            log_handler.info(f"   Title: {data['title']}")
            log_handler.info(f"   Description: {data['description']}")
            log_handler.info(f"   Genre: {genre_tags}")
            log_handler.info(f"   Lyrics: {len(lyrics)} characters")
            log_handler.info(f"   Verse lines: {len(verse_lines)}")
            log_handler.info(f"   Chorus lines: {len(chorus_lines)}")
            log_handler.info(f"\n--- FULL LYRICS ---")
            log_handler.info(lyrics)
            log_handler.info(f"--- END LYRICS ---\n")
            log_handler.info(f"[DEBUG] Verse section ({len(verse_lines)} lines):")
            for i, line in enumerate(verse_lines, 1):
                log_handler.info(f"  {i}. {line}")
            log_handler.info(f"[DEBUG] Chorus section ({len(chorus_lines)} lines):")
            for i, line in enumerate(chorus_lines, 1):
                log_handler.info(f"  {i}. {line}")
            
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
