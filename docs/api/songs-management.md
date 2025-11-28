# Songs Management API

Endpoints for updating and deleting songs.

## Base Path

`/api/songs`

**Authentication Required**: Yes (all endpoints)

---

## PATCH /{song_id}

Update song title and/or description.

**Path Parameters**:
- `song_id`: uuid

**Request:**
```json
{
  "title": "New Song Title",
  "description": "Updated description"
}
```

**Notes**:
- All fields are optional
- At least one field must be provided
- Cannot update lyrics, genre_tags, or audio_url

**Response:**
```json
{
  "id": "uuid",
  "title": "New Song Title",
  "description": "Updated description",
  ...
}
```

**Error (404):**
```json
{
  "detail": "Song not found or unauthorized"
}
```

**Rate Limit**: 10/minute

---

## DELETE /{song_id}

Delete a song.

**Path Parameters**:
- `song_id`: uuid

**Response:**
```json
{
  "message": "Song deleted successfully",
  "song_id": "uuid"
}
```

**Error (404):**
```json
{
  "detail": "Song not found or unauthorized"
}
```

**Rate Limit**: 10/minute

**Notes**:
- Deletes song from database
- Audio file deletion from storage (TODO)
- Album song_count automatically updated via trigger
- Cannot be undone

---

## Example Usage

### Update Song

```typescript
const response = await fetch(`http://localhost:8000/api/songs/${songId}`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'My Awesome Song',
    description: 'A song about my amazing day'
  })
});

const updatedSong = await response.json();
```

### Delete Song

```typescript
const response = await fetch(`http://localhost:8000/api/songs/${songId}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const result = await response.json();
console.log(result.message); // "Song deleted successfully"
```

---

**Last Updated**: November 29, 2025
