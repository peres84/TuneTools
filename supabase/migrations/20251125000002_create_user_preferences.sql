-- Create user_preferences table
-- Stores user preferences for news categories, music genres, vocals, and mood

CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    categories TEXT[] NOT NULL,
    music_genres TEXT[] NOT NULL,
    vocal_preference TEXT NOT NULL CHECK (vocal_preference IN ('male', 'female', 'neutral')),
    mood_preference TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_preferences
-- Users can only access their own preferences
CREATE POLICY "Users can view own preferences"
    ON user_preferences
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
    ON user_preferences
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
    ON user_preferences
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own preferences"
    ON user_preferences
    FOR DELETE
    USING (auth.uid() = user_id);

-- Trigger to update updated_at timestamp
CREATE TRIGGER on_user_preferences_updated
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Create index for faster lookups
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
