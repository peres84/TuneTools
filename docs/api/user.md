# User API

Endpoints for user profile, preferences, and data management.

## Base Path

`/api/user`

**Authentication Required**: Yes (all endpoints)

---

## GET /profile

Get current user's profile.

**Response:**
```json
{
  "id": "uuid",
  "created_at": "2025-11-29T10:00:00Z",
  "updated_at": "2025-11-29T10:00:00Z",
  "onboarding_completed": true
}
```

**Rate Limit**: 20/minute

---

## GET /preferences

Get current user's preferences.

**Response:**
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

**Rate Limit**: 20/minute

---

## POST /preferences

Create user preferences (onboarding).

**Request:**
```json
{
  "categories": ["technology", "business", "sports"],
  "music_genres": ["pop", "indie"],
  "vocal_preference": "female",
  "mood_preference": "uplifting"
}
```

**Response**: Same as GET /preferences

**Rate Limit**: 10/minute

**Notes**:
- Sets `onboarding_completed` to true
- Can only be called once per user
- Use PUT to update after creation

---

## PUT /preferences

Update user preferences.

**Request** (all fields optional):
```json
{
  "categories": ["technology", "art"],
  "music_genres": ["rock", "jazz"],
  "vocal_preference": "male",
  "mood_preference": "calm"
}
```

**Response**: Updated preferences

**Rate Limit**: 10/minute

---

## GET /news

Get personalized news articles.

**Query Parameters**:
- `max_articles`: integer (default: 12)

**Response:**
```json
{
  "articles": [
    {
      "title": "Tech Summit Announces AI Breakthrough",
      "description": "Major AI advancement revealed...",
      "url": "https://...",
      "source": "TechCrunch",
      "published_at": "2025-11-29T09:00:00Z",
      "image_url": "https://...",
      "category": "technology"
    }
  ],
  "categories": ["technology", "business"]
}
```

**Rate Limit**: 10/minute

**Notes**:
- 70% from user's preferred categories
- 30% from general news
- Cached for 1 hour

---

## GET /stats

Get user statistics.

**Response:**
```json
{
  "songs_count": 25,
  "albums_count": 4
}
```

**Rate Limit**: 20/minute

---

## GET /check-email

Check if email is already registered (public endpoint).

**Query Parameters**:
- `email`: string (required)

**Response:**
```json
{
  "exists": true,
  "confirmed": true
}
```

**Rate Limit**: 20/minute

**Notes**:
- No authentication required
- Used during signup for UX

---

## POST /change-password

Change user password.

**Request:**
```json
{
  "current_password": "oldpassword",
  "new_password": "newpassword123"
}
```

**Response:**
```json
{
  "message": "Password changed successfully"
}
```

**Rate Limit**: 5/hour

---

## GET /export-data

Export all user data (GDPR compliance).

**Response:**
```json
{
  "export_date": "2025-11-29T10:00:00Z",
  "user_id": "uuid",
  "profile": {...},
  "preferences": {...},
  "songs": [...],
  "albums": [...],
  "total_songs": 25,
  "total_albums": 4
}
```

**Rate Limit**: 3/hour

---

## DELETE /account

Permanently delete user account and all data.

**Response:**
```json
{
  "message": "Account deleted successfully"
}
```

**Rate Limit**: 2/hour

**Warning**: This action is irreversible. All songs, albums, and data will be permanently deleted.

---

**Last Updated**: November 29, 2025
