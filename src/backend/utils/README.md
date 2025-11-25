# Backend Utilities

## Authentication Middleware

### Overview

The authentication system validates Supabase JWT tokens and extracts user information for protected endpoints.

### Components

#### 1. `AuthMiddleware` Class

Core authentication logic:

```python
from utils.middleware import AuthMiddleware

# Verify a token
payload = AuthMiddleware.verify_token(token_string)

# Extract user ID from payload
user_id = AuthMiddleware.extract_user_id(payload)

# Do both in one step
user_id = AuthMiddleware.get_user_from_token(credentials)
```

#### 2. `get_current_user` Dependency

Use this for **protected endpoints** that require authentication:

```python
from fastapi import Depends
from utils.middleware import get_current_user

@app.get("/api/user/profile")
async def get_profile(user_id: str = Depends(get_current_user)):
    # user_id is automatically extracted from JWT token
    # If token is invalid/missing, returns 401 error
    return {"user_id": user_id}
```

#### 3. `optional_auth` Dependency

Use this for **public endpoints** that can optionally use authentication:

```python
from fastapi import Depends
from typing import Optional
from utils.middleware import optional_auth

@app.get("/api/share/song/{share_token}")
async def get_shared_song(
    share_token: str,
    user_id: Optional[str] = Depends(optional_auth)
):
    # user_id is None if not authenticated
    # user_id is populated if valid token provided
    if user_id:
        # Show personalized content
        pass
    else:
        # Show public content
        pass
```

### Error Handling

The middleware returns appropriate HTTP errors:

| Error | Status Code | Description |
|-------|-------------|-------------|
| Missing token | 401 | No Authorization header |
| Invalid format | 401 | Malformed token |
| Expired token | 401 | Token has expired |
| Invalid signature | 401 | Token signature verification failed |
| Missing user ID | 401 | Token payload missing 'sub' claim |

### Token Format

Tokens must be sent in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

### Token Payload

Expected JWT payload structure:

```json
{
  "sub": "user-uuid-here",
  "aud": "authenticated",
  "exp": 1234567890,
  "iat": 1234567890,
  "email": "user@example.com",
  "role": "authenticated"
}
```

### Usage Examples

#### Protected Route (Authentication Required)

```python
from fastapi import APIRouter, Depends
from utils.middleware import get_current_user

router = APIRouter()

@router.post("/api/songs/generate")
async def generate_song(
    user_id: str = Depends(get_current_user)
):
    # Only authenticated users can access this
    return {"message": "Generating song", "user_id": user_id}
```

#### Public Route with Optional Auth

```python
from fastapi import APIRouter, Depends
from typing import Optional
from utils.middleware import optional_auth

router = APIRouter()

@router.get("/api/albums/list")
async def list_albums(
    user_id: Optional[str] = Depends(optional_auth)
):
    if user_id:
        # Return user's albums
        return {"albums": get_user_albums(user_id)}
    else:
        # Return public albums or error
        return {"albums": []}
```

#### Manual Token Verification

```python
from fastapi import Header
from utils.auth import verify_jwt_token, get_user_id_from_token

@app.get("/custom-auth")
async def custom_auth(authorization: str = Header(None)):
    # Manual verification (not recommended, use Depends instead)
    payload = verify_jwt_token(authorization)
    user_id = get_user_id_from_token(authorization)
    return {"user_id": user_id}
```

### Testing Authentication

#### Valid Token Test

```bash
curl -H "Authorization: Bearer <valid_token>" \
     http://localhost:8000/protected-example
```

Expected response:
```json
{
  "message": "This is a protected endpoint",
  "user_id": "user-uuid",
  "authenticated": true
}
```

#### Missing Token Test

```bash
curl http://localhost:8000/protected-example
```

Expected response (401):
```json
{
  "detail": "Not authenticated"
}
```

#### Invalid Token Test

```bash
curl -H "Authorization: Bearer invalid_token" \
     http://localhost:8000/protected-example
```

Expected response (401):
```json
{
  "detail": "Invalid token: ..."
}
```

### Security Best Practices

1. **Never log tokens** - Tokens contain sensitive information
2. **Use HTTPS in production** - Tokens should never be sent over HTTP
3. **Set appropriate token expiration** - Configure in Supabase Auth settings
4. **Validate on every request** - Don't cache authentication results
5. **Use RLS in Supabase** - Backend auth + database RLS = defense in depth

### Token Refresh

Token refresh is handled client-side by Supabase JS SDK. When a token expires:

1. Frontend detects 401 error
2. Supabase SDK automatically refreshes token
3. Frontend retries request with new token

Backend doesn't need to handle refresh logic.
