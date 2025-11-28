# Share API

Public endpoint for accessing shared songs.

## Base Path

`/api/share`

**Authentication Required**: No (public access)

---

## GET /song/{share_token}

Get song by share token (public access).

**Path Parameters**:
- `share_token`: string - Unique share token

**Response:**
```json
{
  "song": {
    "id": "uuid",
    "title": "Morning Sunshine",
    "description": "An uplifting morning anthem",
    "lyrics": "[verse]\n...\n\n[chorus]\n...",
    "genre_tags": "uplifting female energetic indie-pop bright vocal",
    "audio_url": "https://...",
    "share_token": "abc123xyz",
    "created_at": "2025-11-29T10:00:00Z",
    "weather_data": {
      "temp_c": 22,
      "weather_condition": "Clear",
      "location": "Berlin"
    },
    "news_data": {
      "articles": [...]
    },
    "calendar_data": {
      "activities": [...]
    }
  },
  "album": {
    "id": "uuid",
    "name": "Week of Nov 25 - Dec 1",
    "vinyl_disk_url": "https://...",
    "week_start": "2025-11-25",
    "week_end": "2025-12-01"
  },
  "branding": {
    "message": "my daily song",
    "platform": "TuneTools"
  }
}
```

**Error (404):**
```json
{
  "detail": "Song not found. The share link may be invalid or expired."
}
```

**Rate Limit**: 100/minute

**Notes**:
- No authentication required
- Share tokens are unique and permanent
- Used for social media sharing
- Includes branding for shared page display

---

## Share URL Format

**Frontend URL**:
```
https://tunetools.app/share/{share_token}
```

**Example**:
```
https://tunetools.app/share/abc123xyz789
```

---

## Social Media Integration

The shared page includes Open Graph meta tags for rich previews:

```html
<meta property="og:title" content="Morning Sunshine - my daily song" />
<meta property="og:description" content="An uplifting morning anthem" />
<meta property="og:image" content="https://.../vinyl_disk.png" />
<meta property="og:url" content="https://tunetools.app/share/abc123" />
<meta property="og:type" content="music.song" />
```

---

## Example Usage

### Get Shared Song

```typescript
const shareToken = 'abc123xyz789';

const response = await fetch(`http://localhost:8000/api/share/song/${shareToken}`);
const data = await response.json();

console.log('Song:', data.song.title);
console.log('Album:', data.album.name);
console.log('Audio URL:', data.song.audio_url);
```

### Generate Share Link

```typescript
// After generating a song
const song = await generateSong();
const shareUrl = `https://tunetools.app/share/${song.share_token}`;

// Copy to clipboard
navigator.clipboard.writeText(shareUrl);

// Share on social media
const twitterUrl = `https://twitter.com/intent/tweet?text=Check out my daily song!&url=${encodeURIComponent(shareUrl)}`;
window.open(twitterUrl, '_blank');
```

---

**Last Updated**: November 29, 2025
