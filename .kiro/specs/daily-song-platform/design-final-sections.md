# Design Document - Final Sections to Append

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

**Note:** Due to the large number of properties (63 total), they have been documented in a separate file: `design-properties.md`. Key consolidated properties include:

### Core Business Logic Properties

**Property 7 & 8: News Distribution Weighting**
*For any* news aggregation request, 70% of returned articles should match the user's preferred categories and 30% should be general news
**Validates: Requirements 3.3, 3.4**

**Property 27: Vinyl Disk Reuse**
*For any* song added to an existing weekly album, the existing vinyl disk should be retrieved and reused (not regenerated)
**Validates: Requirements 6.8, 7.5**

**Property 32: Album Completion Status**
*For any* weekly album containing 7 songs, it should be marked as complete
**Validates: Requirements 7.6**

### Data Integrity Properties

**Property 15: Lyrics Structure Validation**
*For any* generated song lyrics, they should contain exactly 1 verse (max 8 lines) and 1 chorus (max 6 lines)
**Validates: Requirements 5.4**

**Property 16: Genre Tags Structure Validation**
*For any* generated genre tags, they should contain exactly 5 components: genre, instrument, mood, gender, and timbre
**Validates: Requirements 5.5**

**Property 25: Vinyl Disk Hole Ratio**
*For any* created vinyl disk, the center hole should have a 14% ratio to the outer diameter
**Validates: Requirements 6.6**

### System Reliability Properties

**Property 6: API Fallback on Failure**
*For any* external API failure (news, LLM, image generation), the system should attempt the configured fallback service
**Validates: Requirements 3.2, 5.3, 6.4, 15.1**

**Property 49: Data Persistence in Supabase**
*For any* generated song, all metadata, audio files, and vinyl disk images should be stored in Supabase
**Validates: Requirements 12.1, 12.2, 12.3**

**Property 51: User Data Isolation**
*For any* data storage operation, proper user isolation and access control should be enforced
**Validates: Requirements 12.5**

See `design-properties.md` for the complete list of 63 correctness properties.

## Error Handling

### Error Handling Strategy

The system implements a multi-layered error handling approach:

1. **API Layer Errors**: HTTP status codes, structured error responses, validation errors
2. **Service Layer Errors**: Custom exceptions, automatic fallbacks, retry logic
3. **External Service Errors**: Timeout handling, rate limit detection, circuit breaker pattern
4. **User-Facing Errors**: User-friendly messages, progress indicators, graceful degradation

### Fallback Logic

All external services (news APIs, LLM services, image generation) implement automatic fallback:
- Primary service attempted first
- On failure, fallback services tried in order
- All attempts logged for debugging
- User-friendly error after all fallbacks exhausted

## Testing Strategy

### Dual Testing Approach

**Unit Tests:**
- Specific examples and edge cases
- Integration points between components
- Error handling and validation
- Mocked external services

**Property-Based Tests:**
- Universal properties across all inputs
- Business logic rules (70/30 distribution, vinyl reuse)
- Data transformations (lyrics formatting, genre tags)
- API fallback behavior
- Minimum 100 iterations per property

### Testing Framework

**Frontend:** Vitest, React Testing Library, Playwright, fast-check
**Backend:** pytest, Hypothesis (100+ iterations), httpx, pytest-asyncio

### Test Organization

All tests stored in `/tests` folder:
```
/tests
├── frontend/          # Frontend tests
├── backend/           # Backend tests
├── integration/       # Integration tests
└── fixtures/          # Shared test data
```

### Property Test Format

Each property-based test tagged with:
```python
# Feature: daily-song-platform, Property X: [property description]
```

### Critical Test Areas

1. News aggregation (70/30 distribution)
2. Vinyl disk reuse logic
3. Song generation flow
4. API fallback behavior
5. Theme management
6. Data persistence and isolation

## Security Considerations

- Supabase Auth with Row Level Security (RLS)
- Encrypted calendar credentials
- HTTPS for all communications
- Rate limiting on all endpoints
- Input validation and sanitization
- User data isolation

## Performance Considerations

### Optimization Strategies

1. **Caching**: News (1hr), weather (30min), artwork (indefinite)
2. **Async Operations**: Parallel API calls, background jobs
3. **Database**: Indexes, JSONB, connection pooling
4. **Frontend**: Code splitting, lazy loading, image optimization

### Expected Metrics

- Landing page: < 2s
- Dashboard: < 1s
- News aggregation: < 3s
- Song generation: 7-12 minutes
- Playback start: < 1s

## Deployment Strategy

### Supabase Deployment

- All configuration in `/supabase` folder
- Deployed using MCP Supabase integration
- Migrations managed automatically
- Storage buckets configured

### Environment Setup

Three environments: Development, Staging, Production

### Deployment Process

1. Supabase: Initialize with MCP, run migrations, configure storage
2. Backend: Deploy to Railway/Render with environment variables
3. Frontend: Deploy to Vercel/Netlify with CDN
4. External Services: Configure API keys and OAuth

## Monitoring and Logging

- Structured JSON logging
- Performance metrics tracking
- Error rate monitoring
- Alerting on failures and timeouts

