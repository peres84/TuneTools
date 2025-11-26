# Apply Migrations to Supabase

## Prerequisites
- Supabase CLI installed: `npm install -g supabase`
- Logged in to Supabase: `supabase login`

## Steps to Apply Migrations

### Option 1: Via Supabase Dashboard (Easiest)

1. Go to: https://supabase.com/dashboard/project/qmpxjhirrnltntwutmlc/sql
2. Click "New Query"
3. Copy and paste each migration file in order:
   - `20251125000001_create_user_profiles.sql`
   - `20251125000002_create_user_preferences.sql`
   - `20251125000003_create_calendar_integrations.sql`
   - `20251125000004_create_albums.sql`
   - `20251125000005_create_songs.sql`
   - `20251125000006_create_storage_buckets.sql`
4. Click "Run" for each migration

### Option 2: Via Supabase CLI

```bash
# Link your project
supabase link --project-ref qmpxjhirrnltntwutmlc

# Push migrations to remote database
supabase db push
```

### Option 3: Manual SQL Execution

If you prefer to run SQL directly, you can use the Supabase SQL Editor and execute each migration file content one by one.

## Verification

After applying migrations, verify in the Supabase dashboard:
1. Go to "Table Editor"
2. You should see these tables:
   - user_profiles
   - user_preferences
   - calendar_integrations
   - albums
   - songs
3. Go to "Storage"
4. You should see these buckets:
   - audio_files
   - vinyl_disks

## Troubleshooting

If you get errors about existing objects, you may need to drop them first or skip that migration.

If you get permission errors, make sure you're using the service role key or have proper permissions.
