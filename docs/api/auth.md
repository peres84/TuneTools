# Authentication API

Endpoints for user authentication and session management.

## Base Path

`/api/auth`

---

## POST /signup

Create a new user account.

### Request

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Validation:**
- Email must be valid format
- Password must be at least 8 characters

### Response

**Success (200 OK):**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "email_confirmed_at": null
  },
  "session": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "v1.MRjVpBLa...",
    "expires_at": 1732886400
  },
  "message": "Signup successful. Please check your email to confirm your account."
}
```

**Error (409 Conflict):**
```json
{
  "detail": "This email is already registered. Please log in instead."
}
```

**Error (400 Bad Request):**
```json
{
  "detail": "Signup failed"
}
```

### Rate Limit

5 requests per minute

### Notes

- User profile is automatically created via database trigger
- Email confirmation required before login
- Check email for confirmation link

---

## POST /login

Authenticate existing user.

### Request

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

### Response

**Success (200 OK):**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "email_confirmed_at": "2025-11-29T10:00:00Z"
  },
  "session": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "v1.MRjVpBLa...",
    "expires_at": 1732886400,
    "expires_in": 3600
  },
  "onboarding_completed": false,
  "message": "Login successful"
}
```

**Error (401 Unauthorized):**
```json
{
  "detail": "Invalid email or password"
}
```

**Error (403 Forbidden):**
```json
{
  "detail": "Please check your email and click the confirmation link before logging in."
}
```

### Rate Limit

10 requests per minute

### Notes

- Returns `onboarding_completed` flag to determine if user needs onboarding
- JWT token expires in 1 hour by default
- Use `refresh_token` to get new access token

---

## Authentication Flow

### 1. New User Signup

```
1. POST /api/auth/signup
2. User receives confirmation email
3. User clicks confirmation link
4. POST /api/auth/login
5. Check onboarding_completed flag
6. If false, redirect to onboarding
7. If true, redirect to dashboard
```

### 2. Returning User Login

```
1. POST /api/auth/login
2. Receive JWT token
3. Store token in localStorage/sessionStorage
4. Include token in Authorization header for all requests
```

### 3. Token Usage

**All authenticated requests:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Token Expiration

When token expires (401 response):
1. Use refresh token to get new access token
2. Or prompt user to login again

---

## Security Best Practices

1. **Never log tokens** - Tokens grant full access to user account
2. **Use HTTPS only** - Never send tokens over HTTP
3. **Store securely** - Use httpOnly cookies or secure storage
4. **Validate on backend** - All protected endpoints validate JWT
5. **Short expiration** - Tokens expire in 1 hour
6. **Rotate tokens** - Use refresh tokens to get new access tokens

---

## Example Usage

### JavaScript/TypeScript

```typescript
// Signup
const signupResponse = await fetch('http://localhost:8000/api/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'securepassword123'
  })
});
const signupData = await signupResponse.json();

// Login
const loginResponse = await fetch('http://localhost:8000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'securepassword123'
  })
});
const loginData = await loginResponse.json();

// Store token
localStorage.setItem('access_token', loginData.session.access_token);

// Use token in requests
const response = await fetch('http://localhost:8000/api/user/profile', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
  }
});
```

### Python

```python
import requests

# Signup
signup_response = requests.post(
    'http://localhost:8000/api/auth/signup',
    json={
        'email': 'user@example.com',
        'password': 'securepassword123'
    }
)
signup_data = signup_response.json()

# Login
login_response = requests.post(
    'http://localhost:8000/api/auth/login',
    json={
        'email': 'user@example.com',
        'password': 'securepassword123'
    }
)
login_data = login_response.json()

# Store token
token = login_data['session']['access_token']

# Use token in requests
response = requests.get(
    'http://localhost:8000/api/user/profile',
    headers={'Authorization': f'Bearer {token}'}
)
```

---

## Troubleshooting

### "Email already registered"
- User already exists
- Use login endpoint instead
- Or use password reset flow

### "Email not confirmed"
- Check spam folder for confirmation email
- Resend confirmation email (not yet implemented)
- Contact support

### "Invalid email or password"
- Check credentials are correct
- Email is case-insensitive
- Password is case-sensitive

### Token expired
- Use refresh token to get new access token
- Or login again

---

**Last Updated**: November 29, 2025
