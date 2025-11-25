-- Create albums table
-- Stores weekly album collections with vinyl disk artwork

CREATE TABLE albums (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    vinyl_disk_url TEXT NOT NULL,
    song_count INTEGER DEFAULT 0,
    is_complete BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, week_start)
);

-- Enable Row Level Security
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;

-- RLS Policies for albums
-- Users can only access their own albums
CREATE POLICY "Users can view own albums"
    ON albums
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own albums"
    ON albums
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own albums"
    ON albums
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own albums"
    ON albums
    FOR DELETE
    USING (auth.uid() = user_id);

-- Trigger to update updated_at timestamp
CREATE TRIGGER on_albums_updated
    BEFORE UPDATE ON albums
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for performance
CREATE INDEX idx_albums_user_id ON albums(user_id);
CREATE INDEX idx_albums_user_week ON albums(user_id, week_start);
CREATE INDEX idx_albums_created_at ON albums(created_at DESC);
