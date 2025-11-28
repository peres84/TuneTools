# Calendar API

Endpoints for Google Calendar integration.

## Base Path

`/api/calendar`

**Authentication Required**: Yes (all endpoints except callback)

---

## GET /authorize

Get Google Calendar OAuth authorization URL.

**Response:**
```json
{
  "authorization_url": "https://accounts.google.com/o/oauth2/v2/auth?...",
  "message": "Visit this URL to authorize calendar access"
}
```

**Rate Limit**: 10/minute

**Notes**:
- User must visit the URL to grant calendar access
- After authorization, Google redirects to `/callback`

---

## GET /callback

Handle OAuth callback from Google (public endpoint).

**Query Parameters**:
- `code`: string - Authorization code from Google
- `state`: string - User ID

**Response**: Redirects to frontend

**Success Redirect**:
```
https://tunetools.app/settings?calendar=success
```

**Error Redirect**:
```
https://tunetools.app/settings?calendar=error&message=Error+message
```

**Notes**:
- No authentication required (public callback)
- Automatically stores credentials in database
- Frontend should handle query parameters

---

## GET /status

Check if user has connected Google Calendar.

**Response:**
```json
{
  "connected": true,
  "provider": "google",
  "connected_at": "2025-11-29T10:00:00Z"
}
```

**Rate Limit**: 20/minute

---

## GET /activities

Get calendar activities for specified days.

**Query Parameters**:
- `days_ahead`: integer (default: 1, min: 1, max: 30)

**Response:**
```json
{
  "activities": {
    "2025-11-29": [
      {
        "title": "Team Meeting",
        "start_time": "2025-11-29T10:00:00Z",
        "end_time": "2025-11-29T11:00:00Z",
        "location": "Conference Room A",
        "description": "Weekly team sync",
        "is_all_day": false
      }
    ],
    "2025-11-30": [...]
  },
  "total_count": 5
}
```

**Rate Limit**: 10/minute

**Notes**:
- Returns activities grouped by date
- Automatically refreshes expired tokens
- Returns empty object if calendar not connected

---

## DELETE /revoke

Revoke calendar access and delete stored credentials.

**Response:**
```json
{
  "success": true,
  "message": "Calendar access revoked successfully"
}
```

**Rate Limit**: 5/minute

**Notes**:
- Deletes credentials from database
- Does not revoke access on Google's side
- User can reconnect anytime

---

## OAuth Flow

### 1. Initiate Authorization

```typescript
// Get authorization URL
const response = await fetch('http://localhost:8000/api/calendar/authorize', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const data = await response.json();

// Redirect user to Google
window.location.href = data.authorization_url;
```

### 2. Handle Callback

```typescript
// In your settings page
const urlParams = new URLSearchParams(window.location.search);
const calendarStatus = urlParams.get('calendar');

if (calendarStatus === 'success') {
  console.log('Calendar connected successfully!');
} else if (calendarStatus === 'error') {
  const errorMessage = urlParams.get('message');
  console.error('Calendar connection failed:', errorMessage);
}
```

### 3. Check Status

```typescript
const response = await fetch('http://localhost:8000/api/calendar/status', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const data = await response.json();

if (data.connected) {
  console.log('Calendar is connected');
} else {
  console.log('Calendar not connected');
}
```

### 4. Fetch Activities

```typescript
const response = await fetch('http://localhost:8000/api/calendar/activities?days_ahead=7', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const data = await response.json();

Object.entries(data.activities).forEach(([date, activities]) => {
  console.log(`${date}: ${activities.length} activities`);
  activities.forEach(activity => {
    console.log(`  - ${activity.title} at ${activity.start_time}`);
  });
});
```

---

## Troubleshooting

### "Calendar not connected"
- User hasn't authorized calendar access
- Use `/authorize` to get authorization URL

### "Token expired"
- Tokens are automatically refreshed
- If refresh fails, user needs to reconnect

### "No activities returned"
- User may have no events in specified timeframe
- Check `days_ahead` parameter
- Verify calendar has events

---

## Environment Variables Required

```env
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=https://tunetools-backend.onrender.com/api/calendar/callback
GOOGLE_CLOUD_API_KEY=your_google_cloud_key
```

---

**Last Updated**: November 29, 2025
