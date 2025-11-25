-- Create calendar_integrations table
-- Stores OAuth credentials for Google Calendar integration

CREATE TABLE calendar_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('google')),
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, provider)
);

-- Enable Row Level Security
ALTER TABLE calendar_integrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for calendar_integrations
-- Users can only access their own calendar integrations
CREATE POLICY "Users can view own calendar integrations"
    ON calendar_integrations
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calendar integrations"
    ON calendar_integrations
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calendar integrations"
    ON calendar_integrations
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own calendar integrations"
    ON calendar_integrations
    FOR DELETE
    USING (auth.uid() = user_id);

-- Trigger to update updated_at timestamp
CREATE TRIGGER on_calendar_integrations_updated
    BEFORE UPDATE ON calendar_integrations
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Create index for faster lookups
CREATE INDEX idx_calendar_integrations_user_id ON calendar_integrations(user_id);
