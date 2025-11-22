# Requirements Document

## Introduction

TuneTools is a web application that generates personalized daily songs based on user's news preferences, weather conditions, and calendar activities. The system aggregates news from multiple sources, analyzes contextual data using AI, generates custom song lyrics and music through the YuE model via RunPod, creates branded vinyl disk artwork, and organizes songs into weekly albums. Users can share their daily songs on social media and maintain a personal collection of their musical news diary. The platform features an engaging, enjoyable interface with a distinctive brand identity centered around music and vinyl aesthetics.

## Glossary

- **System**: The TuneTools web application
- **TuneTools**: The brand name for the daily song generation platform
- **User**: An authenticated person using the platform
- **Daily Song**: A 1-minute AI-generated song (1 verse + 1 chorus) based on daily context
- **Weekly Album**: A collection of 7 daily songs with shared album artwork
- **Vinyl Disk**: A circular album artwork image with a center hole resembling a vinyl record
- **News Aggregator**: The backend service that fetches news from multiple APIs
- **Song Generator**: The AI service that creates lyrics and genre tags
- **YuE Model**: The music generation model hosted on RunPod
- **Context Data**: Combined information from news, weather, and calendar
- **Genre Tags**: Five-component music descriptors (genre, instrument, mood, gender, timbre)
- **Primary API**: The main news API service (SerpAPI)
- **Fallback API**: Secondary news API services (NewsAPI, WorldNewsAPI)
- **LLM Service**: AI service for analysis (OpenAI primary, Gemini fallback)
- **Supabase**: The backend database and authentication service
- **Onboarding**: The initial setup process for new users

## Requirements

### Requirement 1

**User Story:** As a new visitor, I want to understand what the platform does, so that I can decide if I want to sign up

#### Acceptance Criteria

1. WHEN a user visits the root URL THEN the System SHALL display a landing page with platform explanation
2. WHEN the landing page loads THEN the System SHALL display the TuneTools logo from images/logo-disk.png
3. WHEN the landing page loads THEN the System SHALL use the brand color palette from images/palette.png
4. WHEN the landing page loads THEN the System SHALL present signup and login options prominently
5. WHEN the landing page is displayed THEN the System SHALL explain the song generation process through clear visual or textual content
6. WHEN a user views the landing page THEN the System SHALL showcase example daily songs or demo content
7. WHEN the landing page is displayed THEN it SHALL create an engaging and enjoyable user experience with music-themed branding

### Requirement 2

**User Story:** As a new user, I want to create an account and set my preferences, so that I can receive personalized daily songs

#### Acceptance Criteria

1. WHEN a user completes signup THEN the System SHALL create a new user account in Supabase using the Supabase JavaScript SDK
2. WHEN a user authenticates THEN the System SHALL store the session in browser localStorage
3. WHEN a user first logs in THEN the System SHALL redirect them to the onboarding flow
4. WHEN the onboarding starts THEN the System SHALL prompt the user to select news categories and preferences
5. WHEN a user selects preferences THEN the System SHALL store category weights with 70% for preferred categories and 30% for general news
6. WHEN category preferences are saved THEN the System SHALL prompt the user to grant calendar access permissions
7. WHEN a user grants calendar access THEN the System SHALL store the calendar integration credentials securely
8. WHEN a user completes onboarding THEN the System SHALL redirect them to the main dashboard
9. WHEN the application loads THEN the System SHALL check for an existing session in localStorage and restore authentication state

### Requirement 3

**User Story:** As a user, I want the system to fetch news based on my location and preferences, so that my daily songs reflect relevant information

#### Acceptance Criteria

1. WHEN the System fetches news THEN it SHALL use SerpAPI as the Primary API
2. WHEN the Primary API fails or reaches rate limits THEN the System SHALL fallback to NewsAPI or WorldNewsAPI
3. WHEN fetching news THEN the System SHALL retrieve articles matching the user's preferred categories at 70% weight
4. WHEN fetching news THEN the System SHALL retrieve general news articles at 30% weight
5. WHEN fetching preferred category news THEN the System SHALL prioritize top and hot news from different locations
6. WHEN the user's location is available THEN the System SHALL include location-specific news in the results
7. WHEN news is fetched THEN the System SHALL cache results to minimize API calls

### Requirement 4

**User Story:** As a user, I want the system to access my weather and calendar data, so that my daily songs reflect my actual day

#### Acceptance Criteria

1. WHEN the System needs weather data THEN it SHALL request location permissions from the user
2. WHEN location permissions are granted THEN the System SHALL fetch current weather conditions for the user's location
3. WHEN the System needs calendar data THEN it SHALL retrieve the user's activities for the current day
4. WHEN calendar integration is active THEN the System SHALL respect user privacy and only access necessary activity information
5. WHEN location permissions are denied THEN the System SHALL prompt the user to manually enter their location

### Requirement 5

**User Story:** As a user, I want the system to generate a personalized daily song, so that I can experience my day through music

#### Acceptance Criteria

1. WHEN a user requests song generation THEN the System SHALL aggregate news, weather, and calendar data
2. WHEN context data is ready THEN the System SHALL send it to OpenAI as the primary LLM Service
3. WHEN the primary LLM Service fails THEN the System SHALL fallback to Gemini API
4. WHEN the LLM Service processes context THEN it SHALL generate song lyrics with 1 verse and 1 chorus (max 8 lines verse, max 6 lines chorus)
5. WHEN the LLM Service generates lyrics THEN it SHALL create Genre Tags with five components (genre, instrument, mood, gender, timbre)
6. WHEN lyrics and Genre Tags are ready THEN the System SHALL format them according to YuE model requirements
7. WHEN formatted data is ready THEN the System SHALL send a request to the RunPod endpoint with the YuE Model
8. WHEN the YuE Model completes generation THEN the System SHALL receive and store the audio file
9. WHEN song generation completes THEN the System SHALL create metadata including title, description, genre, and tags

### Requirement 6

**User Story:** As a user, I want each weekly album to have unique artwork, so that my albums are visually distinctive

#### Acceptance Criteria

1. WHEN a new Weekly Album is created THEN the System SHALL check if album artwork already exists
2. WHEN no album artwork exists for the week THEN the System SHALL create a prompt for album artwork generation
3. WHEN the artwork prompt is ready THEN the System SHALL send it to Gemini Imagen (nano banana) as primary image generation service
4. WHEN the primary image service fails THEN the System SHALL fallback to OpenAI image generation
5. WHEN the base image is generated THEN the System SHALL apply the vinyl disk transformation using the create_vinyl_disk script
6. WHEN the Vinyl Disk is created THEN it SHALL have a center hole with 14% ratio to outer diameter
7. WHEN the Vinyl Disk is complete THEN the System SHALL store it in Supabase with the Weekly Album reference
8. WHEN a Vinyl Disk exists for the current week THEN the System SHALL retrieve and reuse it for all songs in that album

### Requirement 7

**User Story:** As a user, I want my daily songs organized into weekly albums, so that I can track my musical journey over time

#### Acceptance Criteria

1. WHEN a song is generated THEN the System SHALL assign it to the current week's Weekly Album
2. WHEN a new week starts THEN the System SHALL create a new Weekly Album with a unique name
3. WHEN a Weekly Album is created for the first time THEN the System SHALL generate a Vinyl Disk artwork for that album
4. WHEN a Weekly Album's Vinyl Disk is generated THEN it SHALL be stored in Supabase
5. WHEN subsequent songs are added to the same Weekly Album THEN the System SHALL reuse the existing Vinyl Disk from Supabase
6. WHEN a Weekly Album contains 7 songs THEN it SHALL be marked as complete
7. WHEN viewing albums THEN the System SHALL display all Weekly Albums in chronological order

### Requirement 8

**User Story:** As a user, I want to view my generated songs in an engaging interface, so that I can enjoy the full experience

#### Acceptance Criteria

1. WHEN a song page loads THEN the System SHALL display an animated gradient background with wave motion similar to tests/frontend/disk_scrolling.html
2. WHEN a song page displays THEN it SHALL show the Vinyl Disk image centered on the page
3. WHEN a user plays a song THEN the Vinyl Disk SHALL rotate continuously using CSS animation
4. WHEN a user pauses or stops a song THEN the Vinyl Disk SHALL stop rotating
5. WHEN a song page loads THEN it SHALL display audio playback controls including play/pause, progress bar, and volume control
6. WHEN a song page loads THEN it SHALL display song metadata including title, description, date, and tags
7. WHEN a song page is accessed THEN it SHALL be shareable via a unique URL
8. WHEN a shared song URL is opened THEN it SHALL display the song with text indicating "my daily song" or similar branding
9. WHEN a song page displays THEN it SHALL include social media sharing buttons for Twitter, Facebook, WhatsApp, and copy link functionality

### Requirement 9

**User Story:** As a user, I want to navigate through different sections of the platform, so that I can access all features easily

#### Acceptance Criteria

1. WHEN a user is authenticated THEN the System SHALL display a sidebar with navigation tabs
2. WHEN the sidebar is displayed THEN it SHALL include tabs for News, Calendar, My Songs, Settings, and Profile
3. WHEN a user clicks the News tab THEN the System SHALL display aggregated news articles
4. WHEN a user clicks the Calendar tab THEN the System SHALL display their synced activities
5. WHEN a user clicks My Songs tab THEN the System SHALL display their song collections and albums
6. WHEN a user clicks Settings tab THEN the System SHALL allow modification of preferences and integrations
7. WHEN a user clicks Profile tab THEN the System SHALL display user information and account settings

### Requirement 10

**User Story:** As a user, I want to see my song collections and albums, so that I can revisit past daily songs

#### Acceptance Criteria

1. WHEN a user views My Songs THEN the System SHALL display all Weekly Albums
2. WHEN a user views My Songs THEN the System SHALL display individual songs within each album
3. WHEN viewing albums THEN the System SHALL show album artwork, name, date range, and song count
4. WHEN a user clicks an album THEN the System SHALL display all songs in that album
5. WHEN a user clicks a song THEN the System SHALL navigate to the song's dedicated page

### Requirement 11

**User Story:** As a user, I want to share my daily songs on social media, so that I can showcase my personalized music

#### Acceptance Criteria

1. WHEN a song page is displayed THEN the System SHALL provide social media sharing buttons
2. WHEN a user clicks a sharing button THEN the System SHALL generate a shareable link with song metadata
3. WHEN a shared link is opened THEN it SHALL display the song page with proper Open Graph tags for social media previews
4. WHEN sharing on social media THEN the preview SHALL include the Vinyl Disk image and song title

### Requirement 12

**User Story:** As a user, I want all my songs and data stored securely, so that I can access them from any device

#### Acceptance Criteria

1. WHEN a song is generated THEN the System SHALL store all metadata in Supabase
2. WHEN audio files are created THEN the System SHALL store them in Supabase storage
3. WHEN Vinyl Disk images are created THEN the System SHALL store them in Supabase storage
4. WHEN a user logs in from a new device THEN the System SHALL retrieve all their songs and albums from Supabase
5. WHEN data is stored THEN the System SHALL ensure proper user isolation and access control

### Requirement 13

**User Story:** As a user, I want the interface to support dark and light themes, so that I can use the platform comfortably in different environments

#### Acceptance Criteria

1. WHEN the application loads THEN the System SHALL detect the user's system theme preference
2. WHEN a user accesses theme settings THEN the System SHALL allow toggling between dark and light modes
3. WHEN the theme is changed THEN the System SHALL apply the new theme to all UI components immediately
4. WHEN the theme is changed THEN the System SHALL adapt the TuneTools brand colors appropriately for the selected theme
5. WHEN the theme preference is set THEN the System SHALL persist it for future sessions

### Requirement 14

**User Story:** As a user, I want the website to work well on different devices, so that I can access it from desktop, tablet, or mobile

#### Acceptance Criteria

1. WHEN the application is accessed from any device THEN the System SHALL render a responsive layout
2. WHEN viewed on mobile devices THEN the System SHALL adapt the sidebar navigation to a mobile-friendly format
3. WHEN viewed on different screen sizes THEN the System SHALL maintain readability and usability
4. WHEN the Vinyl Disk is displayed THEN it SHALL scale appropriately for the viewport size

### Requirement 15

**User Story:** As a developer, I want the system to handle API failures gracefully, so that users have a reliable experience

#### Acceptance Criteria

1. WHEN any external API fails THEN the System SHALL attempt the configured fallback service
2. WHEN all fallback options are exhausted THEN the System SHALL display a user-friendly error message
3. WHEN an error occurs THEN the System SHALL log detailed information for debugging
4. WHEN rate limits are reached THEN the System SHALL queue requests or notify users of temporary unavailability
5. WHEN the RunPod endpoint times out THEN the System SHALL provide status updates to the user
