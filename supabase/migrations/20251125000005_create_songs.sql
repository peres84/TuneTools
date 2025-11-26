-- Create songs table
-- Stores generated songs with metadata and context data

CREATE TABLE songs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    album_id UUID REFERENCES albums(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    lyrics TEXT NOT NULL,
    genre_tags TEXT NOT NULL,
    audio_url TEXT NOT NULL,
    share_token TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Context metadata (JSONB for flexibility)
    weather_data JSONB,
    news_data JSONB,
    calendar_data JSONB,
    
    -- Generation metadata
    generation_time_seconds FLOAT,
    llm_provider TEXT
);

-- Enable Row Level Security
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for songs
-- Users can view their own songs
CREATE POLICY "Users can view own songs"
    ON songs
    FOR SELECT
    USING (auth.uid() = user_id);

-- Anyone can view songs via share_token (for public sharing)
CREATE POLICY "Anyone can view shared songs"
    ON songs
    FOR SELECT
    USING (share_token IS NOT NULL);

CREATE POLICY "Users can insert own songs"
    ON songs
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own songs"
    ON songs
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own songs"
    ON songs
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_songs_user_id ON songs(user_id);
CREATE INDEX idx_songs_album_id ON songs(album_id);
CREATE INDEX idx_songs_share_token ON songs(share_token);
CREATE INDEX idx_songs_created_at ON songs(created_at DESC);

-- Note: One song per day per user constraint will be enforced at application level
-- Postgres doesn't allow date casting in unique indexes with timezone-aware timestamps

-- Function to generate unique share token
CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS TEXT AS $$
DECLARE
    token TEXT;
    exists BOOLEAN;
BEGIN
    LOOP
        -- Generate random 12-character alphanumeric token
        token := encode(gen_random_bytes(9), 'base64');
        token := replace(token, '/', '_');
        token := replace(token, '+', '-');
        token := substring(token, 1, 12);
        
        -- Check if token already exists
        SELECT EXISTS(SELECT 1 FROM songs WHERE share_token = token) INTO exists;
        
        EXIT WHEN NOT exists;
    END LOOP;
    
    RETURN token;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate share_token if not provided
CREATE OR REPLACE FUNCTION set_share_token()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.share_token IS NULL OR NEW.share_token = '' THEN
        NEW.share_token := generate_share_token();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_songs_insert_set_share_token
    BEFORE INSERT ON songs
    FOR EACH ROW
    EXECUTE FUNCTION set_share_token();

-- Trigger to update album song_count when song is added
CREATE OR REPLACE FUNCTION update_album_song_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE albums
        SET song_count = song_count + 1,
            is_complete = (song_count + 1 >= 7)
        WHERE id = NEW.album_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE albums
        SET song_count = song_count - 1,
            is_complete = (song_count - 1 >= 7)
        WHERE id = OLD.album_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_songs_update_album_count
    AFTER INSERT OR DELETE ON songs
    FOR EACH ROW
    EXECUTE FUNCTION update_album_song_count();
