# Design Document - Additional Sections

## Error Handling

### Error Handling Strategy

The system implements a multi-layered error handling approach:

1. **API Layer Errors**
   - HTTP status codes for client errors (4xx) and server errors (5xx)
   - Structured error responses with error codes and messages
   - Request validation errors with detailed field information

2. **Service Layer Errors**
   - Custom exception classes for different error types
   - Automatic fallback to secondary services
   - Retry logic with exponential backoff for transient failures

3. **External Service Errors**
   - Timeout handling for long-running operations (RunPod)
   - Rate limit detection and queueing
   - Circuit breaker pattern for failing services

4. **User-Facing Errors**
   - User-friendly error messages
   - Progress indicators for long operations
   - Graceful degradation when features are unavailable

### Error Types and Handling

```python
class TuneToolsException(Exception):
    """Base exception for TuneTools"""
    pass

class APIFailureException(TuneToolsException):
    """Raised when all API fallbacks are exhausted"""
    def __init__(self, service: str, attempts: list[str]):
        self.service = service
        self.attempts = attempts

class RateLimitException(TuneToolsException):
    """Raised when rate limits are reached"""
    def __init__(self, service: str, retry_after: int):
        self.service = service
        self.retry_after = retry_after

class ValidationException(TuneToolsException):
    """Raised when data validation fails"""
    def __init__(self, field: str, message: str):
        self.field = field
        self.message = message

class GenerationTimeoutException(TuneToolsException):
    """Raised when song generation times out"""
    def __init__(self, elapsed_time: float):
        self.elapsed_time = elapsed_time
```

### Fallback Logic Implementation

```python
async def fetch_with_fallback(
    primary_fn: Callable,
    fallback_fns: list[Callable],
    service_name: str
) -> Any:
    """
    Generic fallback logic for external services
    """
    attempts = []
    
    try:
        result = await primary_fn()
        attempts.append(f"{service_name}_primary")
        return result
    except Exception as e:
        logger.warning(f"Primary {service_name} failed: {e}")
        attempts.append(f"{service_name}_primary_failed")
    
    for i, fallback_fn in enumerate(fallback_fns):
        try:
            result = await fallback_fn()
            attempts.append(f"{service_name}_fallback_{i}")
            return result
        except Exception as e:
            logger.warning(f"Fallback {i} for {service_name} failed: {e}")
            attempts.append(f"{service_name}_fallback_{i}_failed")
    
    raise APIFailureException(service_name, attempts)
```

## Testing Strategy

### Testing Approach

The TuneTools platform will use a dual testing approach combining unit tests and property-based tests:

**Unit Tests:**
- Test specific examples and edge cases
- Verify integration points between components
- Test error handling and validation logic
- Mock external services for isolated testing

**Property-Based Tests:**
- Verify universal properties across all inputs
- Test business logic rules (70/30 news distribution, vinyl disk reuse)
- Validate data transformations (lyrics formatting, genre tag structure)
- Test API fallback behavior with random failure scenarios

### Testing Framework Selection

**Frontend:**
- Vitest for unit tests
- React Testing Library for component tests
- Playwright for E2E tests
- fast-check for property-based tests

**Backend:**
- pytest for unit tests
- Hypothesis for property-based tests (minimum 100 iterations per property)
- httpx for API testing
- pytest-asyncio for async tests

### Property-Based Testing Configuration

Each property-based test will:
- Run a minimum of 100 iterations
- Be tagged with a comment referencing the design document property
- Use the format: `# Feature: daily-song-platform, Property X: [property text]`

Example:
```python
from hypothesis import given, strategies as st

# Feature: daily-song-platform, Property 7: News Distribution Weighting (Preferred)
@given(
    user_preferences=st.builds(UserPreferences),
    news_articles=st.lists(st.builds(NewsArticle), min_size=10, max_size=100)
)
@settings(max_examples=100)
async def test_news_distribution_preferred_70_percent(user_preferences, news_articles):
    """
    For any news aggregation request, 70% of returned articles 
    should match the user's preferred categories
    """
    result = await news_aggregator.fetch_news(user_preferences, "US")
    
    preferred_count = sum(
        1 for article in result 
        if article.category in user_preferences.categories
    )
    
    preferred_ratio = preferred_count / len(result)
    assert 0.65 <= preferred_ratio <= 0.75  # Allow 5% tolerance
```

### Test Organization

```
/tests
├── frontend/
│   ├── components/          # Component unit tests
│   ├── integration/         # Frontend integration tests
│   ├── e2e/                 # End-to-end tests
│   └── properties/          # Property-based tests
├── backend/
│   ├── api/                 # API endpoint tests
│   ├── services/            # Service layer tests
│   ├── models/              # Data model tests
│   └── properties/          # Property-based tests
├── integration/
│   ├── supabase/            # Database integration tests
│   ├── external_apis/       # External API integration tests
│   └── end_to_end/          # Full flow tests
└── fixtures/                # Shared test fixtures and data
```

### Critical Test Coverage Areas

1. **News Aggregation (70/30 Distribution)**
   - Property test: verify distribution ratio across random inputs
   - Unit test: specific examples with known categories
   - Edge case: user with no preferred categories

2. **Vinyl Disk Reuse**
   - Property test: any song in same week reuses artwork
   - Unit test: first song generates, second reuses
   - Edge case: week boundary transitions

3. **Song Generation Flow**
   - Integration test: full flow from context to audio
   - Property test: lyrics structure validation
   - Unit test: YuE format compliance

4. **API Fallback Logic**
   - Property test: fallback occurs on any failure
   - Unit test: specific failure scenarios
   - Integration test: rate limit handling

5. **Theme Management**
   - Property test: theme persists across sessions
   - Unit test: brand color adaptation
   - E2E test: theme toggle in UI

## Security Considerations

### Authentication and Authorization

- Supabase Auth for user authentication
- Row Level Security (RLS) policies in Supabase
- JWT tokens for API authentication
- Secure session management

### Data Protection

- Encrypted storage of calendar credentials
- HTTPS for all API communications
- Secure environment variable management
- Input validation and sanitization

### API Security

- Rate limiting on all endpoints
- CORS configuration for frontend
- API key rotation for external services
- Request size limits

### Privacy

- User data isolation in database
- Minimal calendar data access
- Optional calendar integration
- User-controlled data sharing

## Performance Considerations

### Optimization Strategies

1. **Caching**
   - News articles cached for 1 hour
   - Weather data cached for 30 minutes
   - Album artwork cached indefinitely
   - User preferences cached in memory

2. **Async Operations**
   - All external API calls are async
   - Parallel fetching of news, weather, calendar
   - Background job for song generation

3. **Database Optimization**
   - Indexes on frequently queried fields
   - JSONB for flexible metadata storage
   - Connection pooling
   - Query optimization

4. **Frontend Optimization**
   - Code splitting by route
   - Lazy loading of components
   - Image optimization for vinyl disks
   - React Query for data caching

### Expected Performance Metrics

- Landing page load: < 2 seconds
- Dashboard load: < 1 second
- News aggregation: < 3 seconds
- Song generation: 7-12 minutes (RunPod processing)
- Song playback start: < 1 second

## Deployment Strategy

### Environment Configuration

Three environments:
- Development (local)
- Staging (pre-production)
- Production

### Deployment Process

1. **Supabase Setup**
   - Initialize project using MCP Supabase
   - Run migrations from `/supabase/migrations`
   - Configure storage buckets
   - Set up RLS policies

2. **Backend Deployment**
   - Deploy to Railway/Render
   - Configure environment variables
   - Set up health check endpoints
   - Configure logging and monitoring

3. **Frontend Deployment**
   - Deploy to Vercel/Netlify
   - Configure environment variables
   - Set up custom domain
   - Enable CDN

4. **External Services**
   - Configure API keys for all services
   - Set up RunPod endpoint
   - Configure OAuth for calendar integration

### Environment Variables

```bash
# Backend
SUPABASE_URL=
SUPABASE_KEY=
SUPABASE_SERVICE_KEY=

# News APIs
SERPAPI_KEY=
NEWSAPI_KEY=
WORLDNEWSAPI_KEY=

# Weather API
WEATHER_API_KEY=

# LLM Services
OPENAI_API_KEY=
GEMINI_API_KEY=

# Image Generation
GEMINI_IMAGE_API_KEY=

# RunPod
RUNPOD_API_KEY=
RUNPOD_ENDPOINT_ID=

# Google Calendar
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Frontend
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_BASE_URL=
```

## Monitoring and Logging

### Logging Strategy

- Structured logging with JSON format
- Log levels: DEBUG, INFO, WARNING, ERROR, CRITICAL
- Request/response logging for all API calls
- Performance metrics logging

### Monitoring Metrics

- API response times
- External service success/failure rates
- Song generation completion rate
- User engagement metrics
- Error rates by type

### Alerting

- Alert on high error rates
- Alert on API failures
- Alert on RunPod timeouts
- Alert on database connection issues

