# Albums Management API

Endpoints for updating and deleting albums.

## Base Path

`/api/albums`

**Authentication Required**: Yes (all endpoints)

---

## PATCH /{album_id}

Update album name.

**Path Parameters**:
- `album_id`: uuid

**Request:**
```json
{
  "name": "My Custom Album Name"
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "My Custom Album Name",
  "week_start": "2025-11-25",
  "week_end": "2025-12-01",
  ...
}
```

**Error (404):**
```json
{
  "detail": "Album not found or unauthorized"
}
```

**Rate Limit**: 10/minute

---

## DELETE /{album_id}

Delete an album and all its songs.

**Path Parameters**:
- `album_id`: uuid

**Response:**
```json
{
  "message": "Album and all its songs deleted successfully",
  "album_id": "uuid",
  "songs_deleted": 5
}
```

**Error (404):**
```json
{
  "detail": "Album not found or unauthorized"
}
```

**Rate Limit**: 10/minute

**Warning**: This deletes the album AND all songs in it. Cannot be undone.

---

## POST /{album_id}/vinyl-disk

Update album vinyl disk with a new image.

**Path Parameters**:
- `album_id`: uuid

**Request:**
```
Content-Type: multipart/form-data

file: image file (PNG, JPEG, WebP)
```

**Response:**
```json
{
  "id": "uuid",
  "name": "Week of Nov 25 - Dec 1",
  "vinyl_disk_url": "https://.../new_vinyl.png",
  ...
}
```

**Error (400):**
```json
{
  "detail": "File must be an image"
}
```

**Rate Limit**: 5/minute

**Notes**:
- Accepts PNG, JPEG, or WebP images
- Image is converted to vinyl disk format (14% hole ratio)
- Old vinyl disk is replaced
- Max file size: 10MB

---

## Example Usage

### Update Album Name

```typescript
const response = await fetch(`http://localhost:8000/api/albums/${albumId}`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'My Best Week Ever'
  })
});

const updatedAlbum = await response.json();
```

### Delete Album

```typescript
const confirmed = confirm('Delete album and all songs? This cannot be undone.');

if (confirmed) {
  const response = await fetch(`http://localhost:8000/api/albums/${albumId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const result = await response.json();
  console.log(`Deleted ${result.songs_deleted} songs`);
}
```

### Update Vinyl Disk

```typescript
const fileInput = document.querySelector('input[type="file"]');
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch(`http://localhost:8000/api/albums/${albumId}/vinyl-disk`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const updatedAlbum = await response.json();
console.log('New vinyl disk:', updatedAlbum.vinyl_disk_url);
```

---

**Last Updated**: November 29, 2025
