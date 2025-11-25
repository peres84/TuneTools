-- Create storage buckets for audio files and vinyl disk images

-- Audio files bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'audio_files',
    'audio_files',
    false,
    52428800, -- 50MB
    ARRAY['audio/wav', 'audio/mpeg', 'audio/flac', 'audio/mp3']
);

-- Vinyl disk images bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'vinyl_disks',
    'vinyl_disks',
    true,
    10485760, -- 10MB
    ARRAY['image/png', 'image/jpeg', 'image/webp']
);

-- Storage policies for audio_files bucket
-- Users can only access their own audio files
CREATE POLICY "Users can upload own audio files"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'audio_files' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view own audio files"
    ON storage.objects
    FOR SELECT
    USING (
        bucket_id = 'audio_files' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update own audio files"
    ON storage.objects
    FOR UPDATE
    USING (
        bucket_id = 'audio_files' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete own audio files"
    ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'audio_files' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Storage policies for vinyl_disks bucket
-- Users can upload their own vinyl disks, anyone can view (public bucket)
CREATE POLICY "Users can upload own vinyl disks"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'vinyl_disks' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Anyone can view vinyl disks"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'vinyl_disks');

CREATE POLICY "Users can update own vinyl disks"
    ON storage.objects
    FOR UPDATE
    USING (
        bucket_id = 'vinyl_disks' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete own vinyl disks"
    ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'vinyl_disks' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );
