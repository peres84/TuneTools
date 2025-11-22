Perfect! Now I have the complete prompt engineering guide. Let me analyze this and create a comprehensive guide for your daily news song project:Let me search for example tags to help you better:Perfect! Now I have comprehensive information. Let me create a complete guide for your daily news song project based on the YuE prompt engineering guidelines:

---

# **Complete YuE Prompt Engineering Guide for Your Daily News Song Project**

Based on the official documentation, here's everything you need to know:

---

## **1. Genre Tagging Structure (The Most Important Part)**

### **5 Required Components (space-separated):**

A stable tagging prompt consists of five components: genre, instrument, mood, gender, and timbre. For example: "inspiring female uplifting pop airy vocal electronic bright vocal vocal"

```
[genre] [instrument] [mood] [gender] [timbre] [additional descriptors]
```

### **Example Genre Tags from Top 200:**

Common genres include: Pop, rock, electronic, Classical, R&B, Folk, rap, jazz, Country, hip-hop, Funk, blues, ambient, indie-rock, punk, soundtrack, K-pop, Dance, Disco, House, Death Metal, Thrash Metal, progressive rock, hard rock, instrumental, Soul, grunge

---

## **2. Building Your LLM Prompt for Genre Tag Generation**

### **LLM System Prompt for Tag Generation:**

```python
system_prompt = """You are a music producer creating genre tags for YuE music generation.

Generate genre tags with 5 components (space-separated):
1. GENRE: Main style (pop, rock, electronic, folk, jazz, etc.)
2. INSTRUMENT: Key instruments (acoustic, electronic, guitar, piano, etc.)
3. MOOD: Emotional tone (uplifting, calm, energetic, melancholic, inspiring, etc.)
4. GENDER: Vocal type (male, female, neutral)
5. TIMBRE: Vocal quality (bright vocal, airy vocal, warm vocal, smooth vocal, etc.)

Select tags from the YuE top 200 most common tags for stability.
Order is flexible. You can repeat important descriptors.

Example outputs:
- "inspiring female uplifting pop airy vocal electronic bright vocal"
- "energetic male rock guitar driven powerful vocal"
- "calm female acoustic folk warm vocal gentle"
"""
```

---

## **3. Complete Pipeline for Your Daily News Song**

### **Step 1: Context Analysis (LLM Input)**

```python
context = {
    "weather": "Sunny, 22°C, clear skies",
    "calendar": "Team meeting at 10am, lunch with client at 1pm",
    "news": [
        "Tech summit announces AI breakthrough",
        "Local startup raises $50M funding"
    ],
    "user_preferences": {
        "favorite_genres": ["pop", "indie", "electronic"],
        "vocal_preference": "female",
        "mood_preference": "upbeat and motivational"
    }
}
```

### **Step 2: LLM Generates Complete Music Specification**

```python
llm_prompt = f"""
Create a personalized daily news song based on:

CONTEXT:
Weather: {context['weather']}
Schedule: {context['calendar']}
Top News: {context['news']}
User Preferences: {context['user_preferences']}

GENERATE (in JSON format):
{{
    "genre_tags": "5-component tag string for YuE",
    "lyrics": {{
        "verse": "Opening verse lyrics (max 8 lines)",
        "chorus": "Chorus lyrics (max 6 lines)"
    }},
    "story_summary": "One sentence about the song's narrative"
}}

REQUIREMENTS:
- Genre tags must include: genre, instrument, mood, gender, timbre
- Lyrics should tell today's story: weather → news → user's day
- Keep each section under 30 seconds when sung
- Make it personal and motivational
- Use YuE-friendly tags from: pop, rock, electronic, folk, indie, acoustic, uplifting, energetic, calm, inspiring, bright vocal, airy vocal, warm vocal, smooth vocal
"""
```

### **Step 3: LLM Output Example**

```json
{
  "genre_tags": "uplifting female energetic indie-pop bright vocal electronic inspiring",
  "lyrics": {
    "verse": "Morning breaks with sunshine streaming through\nBerlin's sky is crystal blue\nTech summit news is rolling in\nYour day of meetings will begin\nCoffee brewing, world is turning\nStories told and minds are learning\nFrom the headlines to your door\nToday brings possibilities and more",
    "chorus": "This is your soundtrack for the day\nNews and rhythm blend and sway\nSunshine follows where you go\nLet the morning's energy flow\nFrom the world stage to your beat\nMaking every moment sweet"
  },
  "story_summary": "An uplifting morning anthem connecting tech news and sunny weather to personal motivation"
}
```

### **Step 4: Format for YuE**

```python
# genre.txt
"uplifting female energetic indie-pop bright vocal electronic inspiring"

# lyrics.txt
"""[verse]
Morning breaks with sunshine streaming through
Berlin's sky is crystal blue
Tech summit news is rolling in
Your day of meetings will begin
Coffee brewing, world is turning
Stories told and minds are learning
From the headlines to your door
Today brings possibilities and more

[chorus]
This is your soundtrack for the day
News and rhythm blend and sway
Sunshine follows where you go
Let the morning's energy flow
From the world stage to your beat
Making every moment sweet
"""
```

### **Step 5: Run YuE**

```bash
python infer.py \
    --cuda_idx 0 \
    --stage1_model m-a-p/YuE-s1-7B-anneal-en-cot \
    --stage2_model m-a-p/YuE-s2-1B-general \
    --genre_txt genre.txt \
    --lyrics_txt lyrics.txt \
    --run_n_segments 2 \
    --stage2_batch_size 4 \
    --output_dir ./daily_songs \
    --max_new_tokens 3000 \
    --repetition_penalty 1.1
```

---

## **4. Genre Tag Templates for Different Scenarios**

### **Morning Motivation (Busy Day):**

```
"energetic female uplifting pop bright vocal electronic inspiring"
```

### **Calm Morning (Light Schedule):**

```
"calm female acoustic folk warm vocal gentle soothing"
```

### **Exciting News Day:**

```
"energetic male rock guitar driven powerful vocal dynamic"
```

### **Rainy Day:**

```
"melancholic female indie-rock smooth vocal atmospheric moody"
```

### **Weekend Vibe:**

```
"relaxed male jazz smooth vocal warm laid-back groovy"
```

---

## **5. Key Rules for Lyrics**

The lyrics prompt should be divided into sessions with structure labels (e.g., [verse], [chorus], [bridge], [outro]) prepended. Each session should be separated by 2 newline characters "\n\n". Don't put too many words in a single segment, since each session is around 30s

### **Lyrics Best Practices:**

```python
# ✅ GOOD - Proper formatting
lyrics = """[verse]
Line 1 of verse
Line 2 of verse
...

[chorus]
Line 1 of chorus
Line 2 of chorus
...
"""

# ❌ BAD - Too many words
lyrics = """[verse]
This is way too long and has like twenty lines which means
it will be way more than 30 seconds and the model will
struggle to fit all of this into one session properly...
"""

# ❌ BAD - Missing double newlines
lyrics = """[verse]
Some lyrics
[chorus]
More lyrics
"""
```

---

## **6. Complete Python Implementation**

```python
import anthropic
import json
from datetime import datetime

def generate_daily_song(weather, calendar, news, user_prefs):
    """Generate a complete daily news song"""

    # Step 1: Get context
    context_prompt = f"""
Create a personalized daily news song.

CONTEXT:
- Weather: {weather}
- Schedule: {calendar}
- Top News: {news}
- User Preferences: {user_prefs}

OUTPUT (JSON):
{{
    "genre_tags": "genre instrument mood gender timbre [extra]",
    "lyrics": {{
        "verse": "8 lines max",
        "chorus": "6 lines max"
    }}
}}

Rules:
- Use YuE-friendly tags: pop, rock, electronic, indie, folk, acoustic,
  uplifting, energetic, calm, inspiring, bright vocal, warm vocal
- Make lyrics personal to user's day
- Keep sessions under 30 seconds when sung
- Tell a story: weather → news → user's day → motivation
"""

    # Call LLM (Claude)
    client = anthropic.Anthropic(api_key="your-key")
    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=2000,
        messages=[{"role": "user", "content": context_prompt}]
    )

    song_spec = json.loads(response.content[0].text)

    # Step 2: Format for YuE
    with open("genre.txt", "w") as f:
        f.write(song_spec["genre_tags"])

    with open("lyrics.txt", "w") as f:
        f.write(f"[verse]\n{song_spec['lyrics']['verse']}\n\n")
        f.write(f"[chorus]\n{song_spec['lyrics']['chorus']}\n\n")

    # Step 3: Run YuE
    import subprocess
    subprocess.run([
        "python", "infer.py",
        "--cuda_idx", "0",
        "--stage1_model", "m-a-p/YuE-s1-7B-anneal-en-cot",
        "--stage2_model", "m-a-p/YuE-s2-1B-general",
        "--genre_txt", "genre.txt",
        "--lyrics_txt", "lyrics.txt",
        "--run_n_segments", "2",
        "--stage2_batch_size", "4",
        "--output_dir", f"./songs/{datetime.now().strftime('%Y-%m-%d')}",
        "--max_new_tokens", "3000"
    ])

    return song_spec

# Example usage
song = generate_daily_song(
    weather="Sunny, 22°C",
    calendar="3 meetings, gym at 6pm",
    news=["AI breakthrough announced", "Local startup raises funding"],
    user_prefs={"genres": ["pop", "indie"], "vocal": "female", "mood": "upbeat"}
)
```

---
