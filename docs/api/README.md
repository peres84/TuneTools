# TuneTools API Documentation

Complete API reference for TuneTools backend.

## Base URL

- **Development**: `http://localhost:8000`
- **Production**: `https://tunetools-backend.onrender.com`

## Authentication

Most endpoints require JWT authentication via Supabase.

**Header Format:**
```
Authorization: Bearer <jwt_token>
```

Get JWT token from:
- Signup: `POST /api/auth/signup`
- Login: `POST /api/auth/login`

## API Endpoints

### Core Endpoints
- [Root & Health](./root.md) - Health checks and status
- [Authentication](./auth.md) - Signup, login, session management
- [User Management](./user.md) - Profile, preferences, news, stats

### Song & Album Endpoints
- [Songs](./songs.md) - Song generation, listing, retrieval
- [Songs Management](./songs-management.md) - Update, delete songs
- [Albums](./albums.md) - Album listing, retrieval
- [Albums Management](./albums-management.md) - Update, delete albums

### Integration Endpoints
- [Calendar](./calendar.md) - Google Calendar OAuth and activities
- [Share](./share.md) - Public song sharing

## Rate Limits

All endpoints have rate limiting configured. Limits vary by endpoint:

- **Root**: 25 requests/minute
- **Auth Signup**: 5 requests/minute
- **Auth Login**: 10 requests/minute
- **Song Generation**: 3 requests/hour (configurable)
- **Most GET endpoints**: 20-50 requests/minute

Rate limit exceeded returns:
```json
{
  "error": "Rate limit exceeded",
  "detail": "Too many requests"
}
```

## Error Responses

### Standard Error Format

```json
{
  "detail": "Error message describing what went wrong"
}
```

### Common HTTP Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - Authenticated but not authorized
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource already exists
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

## Data Models

### User Models

**UserProfile**
```json
{
  "id": "uuid",
  "created_at": "2025-11-29T10:00:00Z",
  "updated_at": "2025-11-29T10:00:00Z",
  "onboarding_completed": true
}
```

**UserPreferences**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "categories": ["technology", "business"],
  "music_genres": ["pop", "indie", "electronic"],
  "vocal_preference": "female",
  "mood_preference": "uplifting",
  "created_at": "2025-11-29T10:00:00Z",
  "updated_at": "2025-11-29T10:00:00Z"
}
```

### Song Models

**Song**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "album_id": "uuid",
  "title": "Morning Sunshine",
  "description": "An uplifting morning anthem",
  "lyrics": "[verse]\n...\n\n[chorus]\n...",
  "genre_tags": "uplifting female energetic indie-pop bright vocal",
  "audio_url": "https://...",
  "share_token": "abc123xyz",
  "created_at": "2025-11-29T10:00:00Z",
  "weather_data": {...},
  "news_data": {...},
  "calendar_data": {...},
  "generation_time_seconds": 420.5,
  "llm_provider": "openai"
}
```

### Album Models

**Album**
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

## Pagination

Endpoints that return lists support pagination:

**Query Parameters:**
- `limit` - Maximum items to return (default varies by endpoint)
- `offset` - Number of items to skip (default: 0)

**Example:**
```
GET /api/songs/list?limit=10&offset=20
```

## CORS

CORS is configured to allow requests from:
- `http://localhost:5173` (Vite dev server)
- `http://localhost:3000` (React dev server)
- Production frontend URL (configured via `FRONTEND_URL` env var)

## Interactive Documentation

When the backend is running, visit:

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

These provide interactive API testing and complete schema documentation.

## SDK / Client Libraries

Currently, no official SDK is provided. Use standard HTTP clients:

**JavaScript/TypeScript:**
```typescript
const response = await fetch('http://localhost:8000/api/songs/list', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
const data = await response.json();
```

**Python:**
```python
import requests

response = requests.get(
    'http://localhost:8000/api/songs/list',
    headers={'Authorization': f'Bearer {token}'}
)
data = response.json()
```

## Webhooks

Currently not supported. All interactions are request/response based.

## Versioning

Current API version: `v1.0.0`

API versioning is not yet implemented. Breaking changes will be communicated via:
- Release notes
- Migration guides
- Deprecation warnings

## Support

For API issues or questions:
- Check the [Deployment Guide](../deployment.md)
- Review endpoint-specific documentation
- Check backend logs for detailed error messages

---

**Last Updated**: November 29, 2025
**API Version**: 1.0.0
