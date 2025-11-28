# Root & Health API

Basic endpoints for health checks and status.

## Base Path

`/`

---

## GET /

Root endpoint to verify API is operational.

**Authentication Required**: No

**Response:**
```json
{
  "message": "Backend running successfully, ready to use other endpoints",
  "status": "ok",
  "version": "1.0.0"
}
```

**Rate Limit**: 25/minute

**Notes**:
- Public endpoint
- Use for basic connectivity testing
- Returns API version

---

## GET /health

Detailed health check endpoint.

**Authentication Required**: No

**Response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "services": {
    "supabase": "ok",
    "runpod": "ok"
  }
}
```

**Rate Limit**: 25/minute

**Notes**:
- Public endpoint
- Use for monitoring and alerting
- Checks database connectivity
- Verifies external service configuration

---

## Example Usage

### Basic Health Check

```bash
curl http://localhost:8000/
```

### Detailed Health Check

```bash
curl http://localhost:8000/health
```

### Monitoring Script

```bash
#!/bin/bash
# health-check.sh

BACKEND_URL="https://tunetools-backend.onrender.com"

response=$(curl -s "$BACKEND_URL/health")
status=$(echo $response | jq -r '.status')

if [ "$status" = "healthy" ]; then
  echo "✅ Backend is healthy"
  exit 0
else
  echo "❌ Backend is unhealthy: $response"
  exit 1
fi
```

---

**Last Updated**: November 29, 2025
