# Albums API

Endpoints for album listing and retrieval.

## Base Path

`/api/albums`

**Authentication Required**: Yes (all endpoints)

---

## GET /list

List user's albums in chronological order (newest first).

**Query Parameters**:
- `limit`: integer (default: 10)
- `offset`: integer (default: 0)

**Response:**
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "name": "Week of Nov 25 - Dec 1",
    "week_start": "2025-11-25",
    "week_end": "2025-12-01",
    "vinyl_disk_url": "https://...",
    "song_count": 5,
    "is_complete": false,
    "created_at": "2025-11-25T00:00:00Z",
    "updated_at": "2025-11-29T10:00:00Z"
  }
]
```

**Rate Limit**: 20/minute

---

## GET /current-week

Get the album for the current week.

**Response:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "name": "Week of Nov 25 - Dec 1",
  "week_start": "2025-11-25",
  "week_end": "2025-12-01",
  "vinyl_disk_url": "https://...",
  "song_count": 5,
  "is_complete": false,
  "created_at": "2025-11-25T00:00:00Z",
  "updated_at": "2025-11-29T10:00:00Z"
}
```

**Error (404):**
```json
{
  "detail": "No album exists for current week. Generate your first song to create one!"
}
```

**Rate Limit**: 20/minute

**Notes**:
- Week runs Monday-Sunday
- Album created automatically on first song generation

---

## GET /{album_id}

Get album with all its songs.

**Path Parameters**:
- `album_id`: uuid

**Response:**
```json
{
  "album": {
    "id": "uuid",
    "user_id": "uuid",
    "name": "Week of Nov 25 - Dec 1",
    "week_start": "2025-11-25",
    "week_end": "2025-12-01",
    "vinyl_disk_url": "https://...",
    "song_count": 5,
    "is_complete": false,
    "created_at": "2025-11-25T00:00:00Z",
    "updated_at": "2025-11-29T10:00:00Z"
  },
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
  ]
}
```

**Rate Limit**: 50/minute

---

**Last Updated**: November 29, 2025
