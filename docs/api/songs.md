# Songs API

Endpoints for song generation, listing, and retrieval.

## Base Path

`/api/songs`

**Authentication Required**: Yes (all endpoints)

---

## POST /generate

Generate a personalized daily song based on context data.

### Request

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

**Form Data:**
```
location: string (optional) - City name or coordinates
custom_title: string (optional) - Custom song title
custom_cover: file (optional) - Custom album cover image
override_genres: string (optional) - JSON array of genres
override_vocal: string (optional) - "male", "female", or "neutral"
override_mood: string (optional) - Mood preference
```

### Response

**Success (200 OK):**
```json
{
  "song": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "user-uuid",
    "album_id": "album-uuid",
    "title": "Morning Sunshine",
    "description": "An uplifting morning anthem connecting tech news and sunny weather",
    "lyrics": "[verse]\nMorning breaks with sunshine streaming through\n...\n\n[chorus]\nThis is your soundtrack for the day\n...",
    "genre_tags": "uplifting female energetic indie-pop bright vocal electronic inspiring",
    "audio_url": "https://lwkeiqewoptaokqyzrrw.supabase.co/storage/v1/object/public/audio_files/...",
    "share_token": "abc123xyz789",
    "created_at": "2025-11-29T10:00:00Z",
    "weather_data": {
      "temp_c": 22,
      "weather_condition": "Clear",
      "location": "Berlin"
    },
    "news_data": {
      "articles": [
        {
          "title": "Tech Summit Announces AI Breakthrough",
          "source": "TechCrunch",
          "url": "https://..."
        }
      ]
    },
    "calendar_data": {
      "activities": [
        {
          "title": "Team Meeting",
          "start_time": "2025-11-29T10:00:00Z"
        }
      ]
    },
    "generation_time_seconds": 420.5,
    "llm_provider": "openai"
  },
  "album_name": "Week of Nov 25 - Dec 1",
  "album_vinyl_disk_url": "https://lwkeiqewoptaokqyzrrw.supabase.co/storage/v1/object/public/vinyl_disks/...",
  "image_generation_failed": false
}
```

**Error (500 Internal Server Error):**
```json
{
  "detail": "Song generation failed: RunPod timeout"
}
```

### Rate Limit

3 requests per hour (configurable)

### Generation Process

The endpoint orchestrates the following steps:

1. **Context Aggregation** (~5 seconds)
   - Fetch user preferences
   - Get weather data (30-min cache)
   - Fetch news articles (1-hour cache, 70/30 distribution)
   - Retrieve calendar activities

2. **LLM Generation** (~10-30 seconds)
   - Generate song title, description
   - Create YuE-compliant genre tags (5 components)
   - Generate structured lyrics ([verse], [chorus])
   - Validate format

3. **Album Management** (~2-5 seconds)
   - Get or create weekly album
   - Generate album artwork (only for new albums)
   - Create vinyl disk overlay
   - Upload to storage

4. **Audio Generation** (~7-12 minutes)
   - Send request to RunPod YuE endpoint
   - Wait for audio generation
   - Decode base64 audio
   - Upload to Supabase storage

5. **Database Storage** (~1 second)
   - Store song metadata
   - Generate unique share token
   - Update album song count

**Total Time**: 7-13 minutes (first run may take 12 minutes for model download)

### Notes

- Only one song per day per user recommended
- Check `/api/songs/today` before generating
- Generation is expensive (~$0.09-0.23 per song)
- Progress updates not yet implemented (consider WebSocket)

---

## GET /list

List user's songs with pagination.

### Request

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
```
limit: integer (default: 10) - Max songs to return
offset: integer (default: 0) - Pagination offset
```

### Response

**Success (200 OK):**
```json
{
  "songs": [
    {
      "id": "uuid",
      "title": "Morning Sunshine",
      "description": "An uplifting morning anthem",
      "audio_url": "https://...",
      "share_token": "abc123",
      "created_at": "2025-11-29T10:00:00Z",
      ...
    }
  ],
  "total": 25
}
```

### Rate Limit

20 requests per minute

### Example

```
GET /api/songs/list?limit=10&offset=0
```

---

## GET /today

Get today's song for the authenticated user.

### Request

**Headers:**
```
Authorization: Bearer <jwt_token>
```

### Response

**Success (200 OK):**
```json
{
  "id": "uuid",
  "title": "Morning Sunshine",
  "description": "An uplifting morning anthem",
  "lyrics": "[verse]\n...\n\n[chorus]\n...",
  "genre_tags": "uplifting female energetic indie-pop bright vocal",
  "audio_url": "https://...",
  "share_token": "abc123",
  "created_at": "2025-11-29T10:00:00Z",
  ...
}
```

**No Song Today (200 OK):**
```json
null
```

### Rate Limit

20 requests per minute

### Notes

- Returns `null` if no song exists for today (not an error)
- "Today" is based on server timezone
- Use this to check before generating new song

---

## GET /{song_id}

Get specific song by ID.

### Request

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Path Parameters:**
```
song_id: uuid - Song ID
```

### Response

**Success (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Morning Sunshine",
  "description": "An uplifting morning anthem",
  "lyrics": "[verse]\n...\n\n[chorus]\n...",
  "genre_tags": "uplifting female energetic indie-pop bright vocal",
  "audio_url": "https://...",
  "share_token": "abc123",
  "created_at": "2025-11-29T10:00:00Z",
  "weather_data": {...},
  "news_data": {...},
  "calendar_data": {...},
  "generation_time_seconds": 420.5,
  "llm_provider": "openai"
}
```

**Error (404 Not Found):**
```json
{
  "detail": "Song not found"
}
```

### Rate Limit

50 requests per minute

### Notes

- Only returns songs owned by authenticated user
- Use share token for public access (see Share API)

---

## Example Usage

### Generate Song

```typescript
const formData = new FormData();
formData.append('location', 'Berlin');

const response = await fetch('http://localhost:8000/api/songs/generate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const data = await response.json();
console.log('Song generated:', data.song.title);
console.log('Share URL:', `https://tunetools.app/share/${data.song.share_token}`);
```

### Generate with Custom Title

```typescript
const formData = new FormData();
formData.append('custom_title', 'My Amazing Day');
formData.append('location', 'New York');

const response = await fetch('http://localhost:8000/api/songs/generate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

### Generate with Custom Cover

```typescript
const formData = new FormData();
const fileInput = document.querySelector('input[type="file"]');
formData.append('custom_cover', fileInput.files[0]);

const response = await fetch('http://localhost:8000/api/songs/generate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

### Check Today's Song

```typescript
const response = await fetch('http://localhost:8000/api/songs/today', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const song = await response.json();

if (song) {
  console.log('Already generated today:', song.title);
} else {
  console.log('No song yet, generate one!');
}
```

### List Songs

```typescript
const response = await fetch('http://localhost:8000/api/songs/list?limit=10&offset=0', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
console.log(`Found ${data.total} songs`);
data.songs.forEach(song => {
  console.log(`- ${song.title} (${song.created_at})`);
});
```

---

## Troubleshooting

### "RunPod timeout"
- RunPod endpoint may be down
- Check RunPod dashboard
- Verify `RUNPOD_API_KEY` and `ENDPOINT_ID`

### "LLM generation failed"
- Check API keys (OpenAI or Gemini)
- Verify API quota not exceeded
- Check backend logs for details

### "Image generation failed"
- Non-critical, song still generated
- Album uses default artwork
- Check DALL-E/Gemini API keys

### Generation takes too long
- First run: 12 minutes (model download)
- Subsequent runs: 7 minutes
- This is normal for YuE model complexity

---

**Last Updated**: November 29, 2025
