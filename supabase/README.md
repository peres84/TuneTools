# TuneTools Supabase Configuration

Database schema, migrations, and configuration for TuneTools.

## Structure

```
supabase/
├── migrations/       # Database migration files
├── config.toml       # Supabase configuration
└── README.md         # This file
```

## Database Schema

### Tables

- **user_profiles** - User account information
- **user_preferences** - User preferences for news/music
- **calendar_integrations** - Google Calendar OAuth credentials
- **albums** - Weekly album collections
- **songs** - Generated songs with metadata

### Storage Buckets

- **audio_files** - Private storage for song audio files
- **vinyl_disks** - Public storage for album artwork

## Migrations

Migrations will be created in the `migrations/` folder following Supabase naming convention:
```
YYYYMMDDHHMMSS_migration_name.sql
```

## Local Development

To run Supabase locally:
```bash
supabase start
```

To create a new migration:
```bash
supabase migration new migration_name
```

To apply migrations:
```bash
supabase db push
```
