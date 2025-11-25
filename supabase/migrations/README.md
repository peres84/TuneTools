# Database Migrations

This folder contains SQL migration files for the TuneTools database schema.

## Migration Files

1. **20251125000001_create_user_profiles.sql**
   - Creates `user_profiles` table extending Supabase Auth
   - Adds RLS policies for user data isolation
   - Auto-creates profile on user signup
   - Tracks onboarding completion status

2. **20251125000002_create_user_preferences.sql**
   - Creates `user_preferences` table
   - Stores news categories, music genres, vocal/mood preferences
   - Implements 70/30 weighting for news distribution
   - RLS policies ensure users only access their own preferences

3. **20251125000003_create_calendar_integrations.sql**
   - Creates `calendar_integrations` table
   - Securely stores Google Calendar OAuth tokens
   - RLS policies protect sensitive credentials
   - Supports token refresh mechanism

4. **20251125000004_create_albums.sql**
   - Creates `albums` table for weekly collections
   - Tracks vinyl disk artwork URLs
   - Auto-updates song count and completion status
   - Enforces one album per week per user

5. **20251125000005_create_songs.sql**
   - Creates `songs` table with JSONB metadata
   - Stores lyrics, genre tags, audio URLs
   - Auto-generates unique share tokens
   - Enforces one song per day per user
   - Public access via share_token for sharing
   - Auto-updates album song count on insert/delete

6. **20251125000006_create_storage_buckets.sql**
   - Creates `audio_files` bucket (private, 50MB limit)
   - Creates `vinyl_disks` bucket (public, 10MB limit)
   - Configures RLS policies for storage access
   - Users can only access their own files

## Key Features

### Row Level Security (RLS)
All tables have RLS enabled with policies ensuring:
- Users can only access their own data
- Shared songs are publicly accessible via share_token
- Storage buckets enforce user-based access control

### Automatic Triggers
- `handle_new_user()` - Auto-creates user profile on signup
- `handle_updated_at()` - Auto-updates timestamps
- `set_share_token()` - Auto-generates unique share tokens
- `update_album_song_count()` - Maintains album song counts

### Indexes
Performance indexes on:
- User lookups
- Date-based queries
- Share token lookups
- Album-song relationships

## Applying Migrations

### Using Supabase CLI
```bash
# Apply all migrations
supabase db push

# Reset database and reapply
supabase db reset
```

### Using Supabase Dashboard
1. Go to SQL Editor
2. Copy and paste each migration file in order
3. Execute each migration

## Schema Diagram

```
auth.users (Supabase managed)
    ↓
user_profiles
    ↓
    ├── user_preferences
    ├── calendar_integrations
    └── albums
            ↓
        songs
```

## Storage Structure

```
audio_files/ (private)
    └── {user_id}/
        └── {song_id}.wav

vinyl_disks/ (public)
    └── {user_id}/
        └── {album_id}.png
```
