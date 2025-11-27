# Implementation Plan

- [ ] 1. Set up project structure and Supabase configuration
  - Create folder structure: `/src/frontend`, `/src/backend`, `/supabase`, `/tests`, `/docs`, `/images`, `/scripts`
  - Move existing test files to `/tests` folder
  - Move existing docs to `/docs` folder
  - Move existing images to `/images` folder
  - Move `create_vinyl_disk.py` to `/scripts` folder
  - Initialize Supabase project in `/supabase` folder
  - Create `supabase/config.toml` configuration file
  - _Requirements: Project Organization_

- [ ] 2. Create Supabase database schema and migrations
  - Create migration file for `user_profiles` table
  - Create migration file for `user_preferences` table
  - Create migration file for `calendar_integrations` table
  - Create migration file for `albums` table
  - Create migration file for `songs` table with JSONB metadata fields
  - Create indexes for performance optimization
  - Configure Row Level Security (RLS) policies for all tables
  - Create storage buckets: `audio_files` and `vinyl_disks`
  - _Requirements: 12.1, 12.2, 12.3, 12.5_

- [ ]* 2.1 Write property test for user data isolation
  - **Property 51: User Data Isolation**
  - **Validates: Requirements 12.5**

- [ ] 3. Set up FastAPI backend structure
  - Initialize FastAPI application in `/src/backend`
  - Create folder structure: `api/`, `services/`, `models/`, `db/`, `utils/`
  - Set up Pydantic models for all data types (UserPreferences, Song, Album, etc.)
  - Configure CORS for frontend communication
  - Set up environment variable loading with python-dotenv
  - Create Supabase client initialization
  - _Requirements: Backend Architecture_

- [ ]* 3.1 Write unit tests for Pydantic models
  - Test UserPreferences validation
  - Test Song model validation
  - Test Album model validation
  - _Requirements: Data Models_

- [ ] 4. Implement JWT token validation middleware for backend
  - Create authentication middleware to validate Supabase JWT tokens
  - Extract user_id from validated tokens
  - Implement token verification using Supabase Admin API
  - Apply middleware to all protected endpoints
  - Handle token expiration and refresh
  - _Requirements: Backend Security_

- [ ]* 4.1 Write unit tests for JWT validation middleware
  - Test valid token extraction
  - Test invalid token rejection
  - Test expired token handling
  - Test missing token handling
  - _Requirements: Backend Security_

- [ ] 5. Implement user preferences management
  - Create `/api/user/preferences` GET endpoint
  - Create `/api/user/preferences` PUT endpoint
  - Implement 70/30 category weighting logic in preference storage
  - Create `/api/user/profile` GET endpoint
  - _Requirements: 2.4_

- [ ]* 5.1 Write property test for preference storage weighting
  - **Property 3: Preference Storage with Correct Weighting**
  - **Validates: Requirements 2.4**

- [ ] 6. Implement NewsAggregatorService with fallback logic
  - Create `NewsAggregatorService` class in `/src/backend/services/`
  - Implement SerpAPI client as primary
  - Implement NewsAPI client as fallback
  - Implement WorldNewsAPI client as second fallback
  - Implement generic fallback logic with retry
  - Implement 70/30 news distribution algorithm
  - Implement news caching (1 hour TTL)
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.7_

- [ ]* 6.1 Write property test for primary API usage
  - **Property 5: Primary API Usage**
  - **Validates: Requirements 3.1**

- [ ]* 6.2 Write property test for API fallback behavior
  - **Property 6: API Fallback on Failure**
  - **Validates: Requirements 3.2, 5.3, 6.4, 15.1**

- [ ]* 6.3 Write property test for 70% preferred news distribution
  - **Property 7: News Distribution Weighting (Preferred)**
  - **Validates: Requirements 3.3**

- [ ]* 6.4 Write property test for 30% general news distribution
  - **Property 8: News Distribution Weighting (General)**
  - **Validates: Requirements 3.4**

- [ ]* 6.5 Write property test for news caching behavior
  - **Property 10: News Caching Behavior**
  - **Validates: Requirements 3.7**

- [ ] 7. Implement WeatherService and CalendarService
  - Create `WeatherService` class with location-based weather fetching
  - Implement weather data caching (30 minutes TTL)
  - Create `CalendarService` class for Google Calendar integration
  - Implement OAuth flow for calendar authorization
  - Implement secure credential storage in Supabase
  - _Requirements: 4.2, 4.3, 2.6_

- [ ]* 7.1 Write property test for weather data retrieval
  - **Property 11: Weather Data Retrieval**
  - **Validates: Requirements 4.2**

- [ ]* 7.2 Write property test for calendar activity retrieval
  - **Property 12: Calendar Activity Retrieval**
  - **Validates: Requirements 4.3**

- [ ]* 7.3 Write property test for secure credential storage
  - **Property 4: Secure Credential Storage**
  - **Validates: Requirements 2.6**

- [ ] 8. Implement LLMService with OpenAI and Gemini fallback
  - Create `LLMService` class in `/src/backend/services/`
  - Implement OpenAI client as primary LLM
  - Implement Gemini client as fallback
  - Create song prompt builder following YuE guidelines
  - Implement lyrics generation (1 verse max 8 lines, 1 chorus max 6 lines)
  - Implement genre tags generation (5 components: genre, instrument, mood, gender, timbre)
  - Implement YuE format validation and formatting
  - _Requirements: 5.2, 5.3, 5.4, 5.5, 5.6_

- [ ]* 8.1 Write property test for primary LLM usage
  - **Property 14: Primary LLM Service Usage**
  - **Validates: Requirements 5.2**

- [ ]* 8.2 Write property test for lyrics structure validation
  - **Property 15: Lyrics Structure Validation**
  - **Validates: Requirements 5.4**

- [ ]* 8.3 Write property test for genre tags structure validation
  - **Property 16: Genre Tags Structure Validation**
  - **Validates: Requirements 5.5**

- [ ]* 8.4 Write property test for YuE format compliance
  - **Property 17: YuE Format Compliance**
  - **Validates: Requirements 5.6**

- [ ] 9. Implement ImageGenerationService and VinylDiskService
  - Create `ImageGenerationService` class
  - Implement Gemini Imagen client as primary
  - Implement OpenAI DALL-E client as fallback
  - Create album artwork prompt builder
  - Create `VinylDiskService` class wrapping `/scripts/create_vinyl_disk.py`
  - Implement vinyl disk transformation with 14% hole ratio
  - _Requirements: 6.3, 6.4, 6.5, 6.6_

- [ ]* 9.1 Write property test for primary image service usage
  - **Property 23: Primary Image Service Usage**
  - **Validates: Requirements 6.3**

- [ ]* 9.2 Write property test for vinyl disk transformation
  - **Property 24: Vinyl Disk Transformation**
  - **Validates: Requirements 6.5**

- [ ]* 9.3 Write property test for vinyl disk hole ratio
  - **Property 25: Vinyl Disk Hole Ratio**
  - **Validates: Requirements 6.6**

- [ ] 10. Implement SongGenerationService with RunPod integration
  - Create `SongGenerationService` class
  - Implement RunPod endpoint client
  - Implement lyrics formatting for YuE model
  - Implement request sending with 15-minute timeout
  - Implement progress tracking and status updates
  - Handle audio file response (base64 decoding)
  - _Requirements: 5.7, 5.8_

- [ ]* 10.1 Write property test for RunPod request execution
  - **Property 18: RunPod Request Execution**
  - **Validates: Requirements 5.7**

- [ ]* 10.2 Write unit tests for SongGenerationService
  - Test lyrics formatting
  - Test timeout handling
  - Test audio file decoding
  - _Requirements: 5.7, 5.8_

- [ ] 11. Implement AlbumService with weekly album management
  - Create `AlbumService` class
  - Implement week boundary calculation
  - Implement get_or_create_weekly_album logic
  - Implement album artwork existence check
  - Implement vinyl disk generation for new albums
  - Implement vinyl disk reuse for existing albums
  - Implement album completion detection (7 songs)
  - Store vinyl disks in Supabase storage
  - _Requirements: 6.1, 6.2, 6.7, 6.8, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [ ]* 11.1 Write property test for album artwork existence check
  - **Property 21: Album Artwork Existence Check**
  - **Validates: Requirements 6.1**

- [ ]* 11.2 Write property test for vinyl disk reuse
  - **Property 27: Vinyl Disk Reuse**
  - **Validates: Requirements 6.8, 7.5**

- [ ]* 11.3 Write property test for album completion status
  - **Property 32: Album Completion Status**
  - **Validates: Requirements 7.6**

- [ ]* 11.4 Write property test for vinyl disk storage
  - **Property 26: Vinyl Disk Storage with Album Reference**
  - **Validates: Requirements 6.7**

- [ ] 12. Implement song generation orchestration endpoint
  - Create `/api/songs/generate` POST endpoint
  - Implement context data aggregation (news, weather, calendar)
  - Orchestrate LLM service for lyrics and tags
  - Orchestrate album service for weekly album
  - Orchestrate image generation (only for new albums)
  - Orchestrate RunPod song generation
  - Store audio file in Supabase storage
  - Store song metadata in database
  - Generate unique share token
  - _Requirements: 5.1, 5.9, 6.1, 6.2, 7.1, 12.1, 12.2_

- [ ]* 12.1 Write property test for context data aggregation
  - **Property 13: Context Data Aggregation**
  - **Validates: Requirements 5.1**

- [ ]* 12.2 Write property test for song metadata creation
  - **Property 20: Song Metadata Creation**
  - **Validates: Requirements 5.9**

- [ ]* 12.3 Write property test for data persistence
  - **Property 49: Data Persistence in Supabase**
  - **Validates: Requirements 12.1, 12.2, 12.3**

- [ ]* 12.4 Write integration test for full song generation flow
  - Test complete flow from request to stored song
  - Verify all services are called correctly
  - Verify data is stored in Supabase
  - _Requirements: 5.1-5.9_

- [ ] 13. Checkpoint - Ensure all backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 14. Implement song and album retrieval endpoints
  - Create `/api/songs/list` GET endpoint with pagination
  - Create `/api/songs/{song_id}` GET endpoint
  - Create `/api/songs/today` GET endpoint
  - Create `/api/albums/list` GET endpoint
  - Create `/api/albums/{album_id}` GET endpoint with songs
  - Create `/api/albums/current-week` GET endpoint
  - Implement chronological ordering for albums
  - _Requirements: 7.7, 10.1, 10.2, 10.3, 10.4_

- [ ]* 14.1 Write property test for album chronological ordering
  - **Property 33: Album Chronological Ordering**
  - **Validates: Requirements 7.7**

- [x] 15. Implement share endpoint for public song access
  - Create `/api/share/song/{share_token}` GET endpoint
  - Implement public access without authentication
  - Return song and album data
  - _Requirements: 8.7, 11.3_

- [ ]* 15.1 Write property test for unique shareable URL
  - **Property 37: Unique Shareable URL**
  - **Validates: Requirements 8.7**

- [x] 16. Set up React frontend structure
  - Initialize React + TypeScript + Vite project in `/src/frontend`
  - Set up Tailwind CSS configuration
  - Set up React Router for navigation
  - Set up TanStack Query for data fetching
  - Set up Zustand for state management
  - Install @supabase/supabase-js package
  - Initialize Supabase JS client with project URL and anon key
  - Configure Supabase client to use localStorage for session persistence
  - Create folder structure: `components/`, `pages/`, `hooks/`, `services/`, `styles/`, `utils/`, `contexts/`
  - Create API service utilities that include JWT token in request headers
  - _Requirements: Frontend Architecture_

- [x] 17. Implement theme provider and brand colors
  - Create ThemeContext with dark/light mode support
  - Implement system theme detection
  - Implement theme toggle functionality
  - Implement theme persistence in localStorage
  - Load TuneTools brand colors from `/images/palette.png`
  - Implement brand color adaptation for themes
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [ ]* 17.1 Write property test for theme detection
  - **Property 52: System Theme Detection**
  - **Validates: Requirements 13.1**

- [ ]* 17.2 Write property test for theme persistence
  - **Property 56: Theme Persistence**
  - **Validates: Requirements 13.5**

- [x] 18. Implement landing page component
  - Create LandingPage component
  - Display TuneTools logo from `/images/logo-disk.png`
  - Create hero section with tagline
  - Add signup and login buttons
  - Create animated demo section explaining song generation
  - Add example song player (optional)
  - Implement responsive design
  - _Requirements: 1.1, 1.2, 1.4, 1.6_

- [x] 19. Implement authentication context and components
  - Create AuthContext provider using Supabase JS SDK
  - Initialize Supabase client with project URL and anon key
  - Implement signUp method using supabase.auth.signUp()
  - Implement signIn method using supabase.auth.signInWithPassword()
  - Implement signOut method using supabase.auth.signOut()
  - Set up auth state listener with supabase.auth.onAuthStateChange()
  - Implement session restoration on app load using supabase.auth.getSession()
  - Create AuthForm component for signup/login UI
  - Add form validation
  - Handle authentication errors
  - Redirect to onboarding after first signup
  - Redirect to dashboard after login
  - _Requirements: 2.1, 2.2, 2.3, 2.9_

- [ ]* 19.1 Write property test for session storage in localStorage
  - **Property 1: Session Storage in localStorage**
  - **Validates: Requirements 2.2**

- [ ]* 19.2 Write property test for session restoration on app load
  - **Property 2: Session Restoration on App Load**
  - **Validates: Requirements 2.9**

- [ ]* 19.3 Write property test for first login onboarding redirect
  - **Property 3: First Login Onboarding Redirect**
  - **Validates: Requirements 2.3**

- [x] 20. Implement onboarding flow components
  - Create OnboardingStep1 component for preferences
  - Add category selection UI (art, technology, sports, etc.)
  - Add music genre selection UI
  - Add vocal preference selection (male, female, neutral)
  - Add mood preference selection
  - Create OnboardingStep2 component for calendar integration
  - Implement Google Calendar OAuth flow
  - Add skip option for calendar integration
  - Save preferences to backend with JWT token in Authorization header
  - Update user profile onboarding_completed flag
  - Redirect to dashboard after completion
  - _Requirements: 2.4, 2.5, 2.6, 2.7, 2.8_

- [x] 21. Implement dashboard layout component
  - Create DashboardLayout component with sidebar
  - Add navigation tabs: Home, News, Calendar, My Songs, Settings, Profile
  - Implement responsive sidebar (hamburger menu on mobile)
  - Add theme toggle button
  - Add user avatar/menu
  - Implement tab routing
  - _Requirements: 9.1, 9.2, 14.2_

- [ ]* 21.1 Write property test for authenticated user sidebar
  - **Property 39: Authenticated User Sidebar**
  - **Validates: Requirements 9.1**

- [ ]* 21.2 Write property test for mobile sidebar adaptation
  - **Property 58: Mobile Sidebar Adaptation**
  - **Validates: Requirements 14.2**

- [x] 22. Implement song generation component
  - Create SongGenerator component for dashboard home
  - Add "Generate Your Daily Song" button
  - Implement loading state with progress indicators
  - Show status updates during generation (fetching news, generating lyrics, creating audio)
  - Handle generation errors with user-friendly messages
  - Display generated song after completion
  - Check if song already exists for today
  - _Requirements: 5.1, 15.5_

- [ ]* 22.1 Write property test for RunPod timeout status updates
  - **Property 63: RunPod Timeout Status Updates**
  - **Validates: Requirements 15.5**

- [x] 23. Implement song player component with animated background
  - Create SongPlayer component
  - Implement animated gradient background with wave motion (reference `/tests/frontend/disk_scrolling.html`)
  - Display vinyl disk image centered on page
  - Implement CSS rotation animation for vinyl disk
  - Add audio playback controls (play/pause, progress bar, volume)
  - Display song metadata (title, description, date, tags)
  - Add social sharing buttons (Twitter, Facebook, WhatsApp, copy link)
  - Implement rotation start on play
  - Implement rotation stop on pause
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.9_

- [ ]* 23.1 Write property test for vinyl disk rotation on play
  - **Property 34: Vinyl Disk Rotation on Play**
  - **Validates: Requirements 8.3**

- [ ]* 23.2 Write property test for vinyl disk rotation stop
  - **Property 35: Vinyl Disk Rotation Stop**
  - **Validates: Requirements 8.4**

- [ ]* 23.3 Write property test for song metadata display
  - **Property 36: Song Metadata Display**
  - **Validates: Requirements 8.6**

- [ ] 24. Implement album collection component
  - Create AlbumCollection component
  - Fetch albums from backend
  - Display albums in grid layout
  - Show album artwork, name, date range, song count
  - Implement hover effects
  - Handle album click to show songs
  - _Requirements: 10.1, 10.3, 10.4_

- [ ]* 24.1 Write property test for album collection display
  - **Property 41: Album Collection Display**
  - **Validates: Requirements 10.1**

- [ ]* 24.2 Write property test for album metadata display
  - **Property 43: Album Metadata Display**
  - **Validates: Requirements 10.3**

- [ ] 25. Implement song list and navigation
  - Create SongList component
  - Display songs within albums
  - Handle song click to navigate to player page
  - Implement responsive grid layout
  - _Requirements: 10.2, 10.5_

- [ ]* 25.1 Write property test for song click navigation
  - **Property 45: Song Click Navigation**
  - **Validates: Requirements 10.5**

- [ ] 26. Implement shared song page
  - Create public song page accessible via share token
  - Display song player with "my daily song" branding
  - Implement Open Graph meta tags for social media previews
  - Include vinyl disk image and song title in preview
  - No authentication required for shared pages
  - _Requirements: 8.7, 8.8, 11.3, 11.4_

- [ ]* 26.1 Write property test for shared URL branding
  - **Property 38: Shared URL Branding**
  - **Validates: Requirements 8.8**

- [ ]* 26.2 Write property test for Open Graph tags
  - **Property 47: Open Graph Tags Presence**
  - **Validates: Requirements 11.3**

- [ ]* 26.3 Write property test for social share preview content
  - **Property 48: Social Share Preview Content**
  - **Validates: Requirements 11.4**

- [ ] 27. Implement news, calendar, settings, and profile tabs
  - Create News tab component displaying aggregated news
  - Create Calendar tab component displaying synced activities
  - Create Settings tab component for preferences modification
  - Create Profile tab component for user information
  - Implement tab navigation functionality
  - _Requirements: 9.3, 9.4, 9.5, 9.6, 9.7_

- [ ]* 27.1 Write property test for tab navigation functionality
  - **Property 40: Tab Navigation Functionality**
  - **Validates: Requirements 9.3, 9.4, 9.5, 9.6, 9.7**

- [ ] 28. Implement responsive design and viewport scaling
  - Ensure all components are responsive
  - Test on mobile, tablet, and desktop viewports
  - Implement vinyl disk scaling for different viewport sizes
  - Optimize touch interactions for mobile
  - _Requirements: 14.1, 14.4_

- [ ]* 28.1 Write property test for responsive layout rendering
  - **Property 57: Responsive Layout Rendering**
  - **Validates: Requirements 14.1**

- [ ]* 28.2 Write property test for vinyl disk viewport scaling
  - **Property 59: Vinyl Disk Viewport Scaling**
  - **Validates: Requirements 14.4**

- [ ] 29. Implement error handling and user feedback
  - Create error boundary components
  - Implement user-friendly error messages
  - Add error logging to backend
  - Implement rate limit handling with user notifications
  - Add loading states for all async operations
  - _Requirements: 15.2, 15.3, 15.4_

- [ ]* 29.1 Write property test for user-friendly error messages
  - **Property 60: User-Friendly Error Messages**
  - **Validates: Requirements 15.2**

- [ ]* 29.2 Write property test for error logging
  - **Property 61: Error Logging**
  - **Validates: Requirements 15.3**

- [ ]* 29.3 Write property test for rate limit handling
  - **Property 62: Rate Limit Handling**
  - **Validates: Requirements 15.4**

- [ ] 30. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 31. Deploy Supabase using MCP integration
  - Use MCP Supabase to deploy database schema
  - Run all migrations from `/supabase/migrations`
  - Configure storage buckets and RLS policies
  - Set up environment variables
  - _Requirements: Deployment_

- [ ] 32. Create deployment documentation
  - Document environment variables in `/docs/deployment.md`
  - Document Supabase setup steps
  - Document backend deployment process
  - Document frontend deployment process
  - Document external service configuration
  - _Requirements: Documentation_

- [ ] 33. Create API documentation
  - Document all API endpoints in `/docs/api/`
  - Include request/response examples
  - Document authentication requirements
  - Document error responses
  - _Requirements: Documentation_

- [ ] 34. Create user documentation
  - Create user guide in `/docs/user-guide.md`
  - Document onboarding process
  - Document song generation process
  - Document sharing functionality
  - _Requirements: Documentation_
