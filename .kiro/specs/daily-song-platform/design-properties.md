# Correctness Properties (Continued from design.md)

## Property Reflection

After analyzing all acceptance criteria, I've identified several areas where properties can be consolidated:

**Consolidation Opportunities:**
1. Multiple fallback properties (3.2, 5.3, 6.4, 15.1) can be unified into a general "API Fallback" property
2. Storage properties (12.1, 12.2, 12.3) can be combined into "Data Persistence" property
3. Navigation properties (9.3-9.7) share similar structure and can be tested together
4. Theme properties (13.1-13.5) form a cohesive theme management property

**Properties to Keep Separate:**
- News aggregation weighting (3.3, 3.4) - specific business logic
- Vinyl disk reuse (6.8, 7.5) - critical for resource efficiency
- Album completion (7.6) - specific milestone logic
- Song generation flow (5.1-5.9) - complex multi-step process

## Core Correctness Properties

### Property 1: User Account Creation
*For any* valid signup credentials (email, password), creating an account should result in a new user record in Supabase with a unique ID
**Validates: Requirements 2.1**

### Property 2: First Login Onboarding Redirect
*For any* user who has not completed onboarding, their first login should redirect them to the onboarding flow
**Validates: Requirements 2.2**

### Property 3: Preference Storage with Correct Weighting
*For any* set of user preferences, the stored category weights should be 70% for preferred categories and 30% for general news
**Validates: Requirements 2.4**

### Property 4: Secure Credential Storage
*For any* calendar integration credentials, they should be stored encrypted in Supabase with proper access controls
**Validates: Requirements 2.6**

### Property 5: Primary API Usage
*For any* news fetch request, the system should attempt SerpAPI first before any fallback
**Validates: Requirements 3.1**

### Property 6: API Fallback on Failure
*For any* external API failure (news, LLM, image generation), the system should attempt the configured fallback service
**Validates: Requirements 3.2, 5.3, 6.4, 15.1**

### Property 7: News Distribution Weighting (Preferred)
*For any* news aggregation request, 70% of returned articles should match the user's preferred categories
**Validates: Requirements 3.3**

### Property 8: News Distribution Weighting (General)
*For any* news aggregation request, 30% of returned articles should be general news
**Validates: Requirements 3.4**

### Property 9: Location-Based News Inclusion
*For any* news fetch with available location data, the results should include location-specific articles
**Validates: Requirements 3.6**

### Property 10: News Caching Behavior
*For any* repeated news fetch within the cache window, no new API call should be made
**Validates: Requirements 3.7**

### Property 11: Weather Data Retrieval
*For any* valid location coordinates, weather data should be successfully fetched and returned
**Validates: Requirements 4.2**

### Property 12: Calendar Activity Retrieval
*For any* date with calendar integration active, the user's activities for that date should be retrieved
**Validates: Requirements 4.3**

### Property 13: Context Data Aggregation
*For any* song generation request, the system should aggregate news, weather, and calendar data before proceeding
**Validates: Requirements 5.1**

### Property 14: Primary LLM Service Usage
*For any* song content generation, OpenAI should be attempted first before Gemini fallback
**Validates: Requirements 5.2**

### Property 15: Lyrics Structure Validation
*For any* generated song lyrics, they should contain exactly 1 verse (max 8 lines) and 1 chorus (max 6 lines)
**Validates: Requirements 5.4**

### Property 16: Genre Tags Structure Validation
*For any* generated genre tags, they should contain exactly 5 components: genre, instrument, mood, gender, and timbre
**Validates: Requirements 5.5**

### Property 17: YuE Format Compliance
*For any* lyrics and genre tags, they should be formatted according to YuE model requirements (proper section labels, double newlines)
**Validates: Requirements 5.6**

### Property 18: RunPod Request Execution
*For any* properly formatted lyrics and genre tags, a request should be sent to the RunPod YuE endpoint
**Validates: Requirements 5.7**

### Property 19: Audio File Storage
*For any* completed YuE generation, the audio file should be stored in Supabase storage
**Validates: Requirements 5.8, 12.2**

### Property 20: Song Metadata Creation
*For any* generated song, metadata including title, description, genre, and tags should be created and stored
**Validates: Requirements 5.9**

### Property 21: Album Artwork Existence Check
*For any* new weekly album creation, the system should check if artwork already exists for that week
**Validates: Requirements 6.1**

### Property 22: Artwork Generation Trigger
*For any* week without existing artwork, an artwork generation prompt should be created
**Validates: Requirements 6.2**

### Property 23: Primary Image Service Usage
*For any* artwork generation, Gemini Imagen should be attempted first before OpenAI fallback
**Validates: Requirements 6.3**

### Property 24: Vinyl Disk Transformation
*For any* generated base image, the vinyl disk transformation should be applied using create_vinyl_disk.py
**Validates: Requirements 6.5**

### Property 25: Vinyl Disk Hole Ratio
*For any* created vinyl disk, the center hole should have a 14% ratio to the outer diameter
**Validates: Requirements 6.6**

### Property 26: Vinyl Disk Storage with Album Reference
*For any* completed vinyl disk, it should be stored in Supabase with the correct weekly album reference
**Validates: Requirements 6.7**

### Property 27: Vinyl Disk Reuse
*For any* song added to an existing weekly album, the existing vinyl disk should be retrieved and reused
**Validates: Requirements 6.8, 7.5**

### Property 28: Song Album Assignment
*For any* generated song, it should be assigned to the correct weekly album based on creation date
**Validates: Requirements 7.1**

### Property 29: New Week Album Creation
*For any* song generated in a new week, a new weekly album should be created with a unique name
**Validates: Requirements 7.2**

### Property 30: First Album Artwork Generation
*For any* newly created weekly album, vinyl disk artwork should be generated
**Validates: Requirements 7.3**

### Property 31: Album Vinyl Disk Storage
*For any* generated vinyl disk for an album, it should be stored in Supabase
**Validates: Requirements 7.4**

### Property 32: Album Completion Status
*For any* weekly album containing 7 songs, it should be marked as complete
**Validates: Requirements 7.6**

### Property 33: Album Chronological Ordering
*For any* album list view, albums should be displayed in chronological order by week_start date
**Validates: Requirements 7.7**

### Property 34: Vinyl Disk Rotation on Play
*For any* song play action, the vinyl disk should start rotating continuously
**Validates: Requirements 8.3**

### Property 35: Vinyl Disk Rotation Stop
*For any* song pause or stop action, the vinyl disk rotation should stop
**Validates: Requirements 8.4**

### Property 36: Song Metadata Display
*For any* song page load, all metadata (title, description, date, tags) should be displayed
**Validates: Requirements 8.6**

### Property 37: Unique Shareable URL
*For any* song, a unique shareable URL should exist and be accessible
**Validates: Requirements 8.7**

### Property 38: Shared URL Branding
*For any* shared song URL access, the page should display "my daily song" or similar branding
**Validates: Requirements 8.8**

### Property 39: Authenticated User Sidebar
*For any* authenticated user, the sidebar with navigation tabs should be displayed
**Validates: Requirements 9.1**

### Property 40: Tab Navigation Functionality
*For any* navigation tab click (News, Calendar, My Songs, Settings, Profile), the corresponding content should be displayed
**Validates: Requirements 9.3, 9.4, 9.5, 9.6, 9.7**

### Property 41: Album Collection Display
*For any* My Songs view, all weekly albums belonging to the user should be displayed
**Validates: Requirements 10.1**

### Property 42: Songs Within Albums Display
*For any* My Songs view, individual songs within each album should be displayed
**Validates: Requirements 10.2**

### Property 43: Album Metadata Display
*For any* album view, artwork, name, date range, and song count should be shown
**Validates: Requirements 10.3**

### Property 44: Album Click Navigation
*For any* album click, all songs in that album should be displayed
**Validates: Requirements 10.4**

### Property 45: Song Click Navigation
*For any* song click, navigation to the song's dedicated page should occur
**Validates: Requirements 10.5**

### Property 46: Shareable Link Generation
*For any* sharing button click, a shareable link with song metadata should be generated
**Validates: Requirements 11.2**

### Property 47: Open Graph Tags Presence
*For any* shared link access, proper Open Graph tags should be present for social media previews
**Validates: Requirements 11.3**

### Property 48: Social Share Preview Content
*For any* social media share, the preview should include the vinyl disk image and song title
**Validates: Requirements 11.4**

### Property 49: Data Persistence in Supabase
*For any* generated song, all metadata, audio files, and vinyl disk images should be stored in Supabase
**Validates: Requirements 12.1, 12.2, 12.3**

### Property 50: Cross-Device Data Retrieval
*For any* user login from a new device, all their songs and albums should be retrieved from Supabase
**Validates: Requirements 12.4**

### Property 51: User Data Isolation
*For any* data storage operation, proper user isolation and access control should be enforced
**Validates: Requirements 12.5**

### Property 52: System Theme Detection
*For any* application load, the user's system theme preference should be detected
**Validates: Requirements 13.1**

### Property 53: Theme Toggle Functionality
*For any* theme settings access, toggling between dark and light modes should be available
**Validates: Requirements 13.2**

### Property 54: Immediate Theme Application
*For any* theme change, the new theme should be applied to all UI components immediately
**Validates: Requirements 13.3**

### Property 55: Brand Color Theme Adaptation
*For any* theme change, TuneTools brand colors should adapt appropriately for the selected theme
**Validates: Requirements 13.4**

### Property 56: Theme Persistence
*For any* theme preference setting, it should be persisted for future sessions
**Validates: Requirements 13.5**

### Property 57: Responsive Layout Rendering
*For any* device access, a responsive layout should be rendered
**Validates: Requirements 14.1**

### Property 58: Mobile Sidebar Adaptation
*For any* mobile device view, the sidebar navigation should adapt to a mobile-friendly format
**Validates: Requirements 14.2**

### Property 59: Vinyl Disk Viewport Scaling
*For any* viewport size, the vinyl disk should scale appropriately
**Validates: Requirements 14.4**

### Property 60: User-Friendly Error Messages
*For any* complete API failure (all fallbacks exhausted), a user-friendly error message should be displayed
**Validates: Requirements 15.2**

### Property 61: Error Logging
*For any* error occurrence, detailed information should be logged for debugging
**Validates: Requirements 15.3**

### Property 62: Rate Limit Handling
*For any* rate limit reached, requests should be queued or users notified of temporary unavailability
**Validates: Requirements 15.4**

### Property 63: RunPod Timeout Status Updates
*For any* RunPod endpoint timeout, status updates should be provided to the user
**Validates: Requirements 15.5**

