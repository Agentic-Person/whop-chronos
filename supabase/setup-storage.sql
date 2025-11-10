-- =====================================================
-- SUPABASE STORAGE SETUP
-- =====================================================
-- Run this SQL to set up storage buckets and policies for video uploads
--
-- Execute in Supabase SQL Editor or via CLI:
-- psql -h <host> -U postgres -d postgres -f supabase/setup-storage.sql

-- =====================================================
-- CREATE STORAGE BUCKETS
-- =====================================================

-- Videos bucket (private - requires authentication)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'videos',
  'videos',
  false, -- Private bucket
  5368709120, -- 5GB max file size (5 * 1024 * 1024 * 1024)
  ARRAY[
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-matroska',
    'video/webm',
    'video/x-flv',
    'video/x-m4v',
    'video/x-ms-wmv'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Thumbnails bucket (public for easy display)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'thumbnails',
  'thumbnails',
  true, -- Public bucket
  10485760, -- 10MB max file size
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- User uploads bucket (temporary storage for processing)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-uploads',
  'user-uploads',
  false, -- Private bucket
  5368709120, -- 5GB max file size
  NULL -- Allow all mime types
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit;

-- =====================================================
-- STORAGE POLICIES - VIDEOS BUCKET
-- =====================================================

-- Policy: Creators can upload videos to their own folder
CREATE POLICY "Creators can upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'videos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Creators can read their own videos
CREATE POLICY "Creators can read own videos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'videos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Creators can update their own videos
CREATE POLICY "Creators can update own videos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'videos' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'videos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Creators can delete their own videos
CREATE POLICY "Creators can delete own videos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'videos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Service role has full access (for background jobs)
CREATE POLICY "Service role has full access to videos"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'videos')
WITH CHECK (bucket_id = 'videos');

-- =====================================================
-- STORAGE POLICIES - THUMBNAILS BUCKET
-- =====================================================

-- Policy: Creators can upload thumbnails
CREATE POLICY "Creators can upload thumbnails"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'thumbnails' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Everyone can view thumbnails (public bucket)
CREATE POLICY "Public can view thumbnails"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'thumbnails');

-- Policy: Creators can update own thumbnails
CREATE POLICY "Creators can update own thumbnails"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'thumbnails' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'thumbnails' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Creators can delete own thumbnails
CREATE POLICY "Creators can delete own thumbnails"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'thumbnails' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- =====================================================
-- STORAGE POLICIES - USER UPLOADS BUCKET
-- =====================================================

-- Policy: Authenticated users can upload
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'user-uploads');

-- Policy: Users can read own uploads
CREATE POLICY "Users can read own uploads"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'user-uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete own uploads
CREATE POLICY "Users can delete own uploads"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get total storage used by creator
CREATE OR REPLACE FUNCTION get_creator_storage_usage(creator_uuid UUID)
RETURNS TABLE(
  total_bytes BIGINT,
  total_videos INTEGER,
  formatted_size TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(file_size_bytes), 0)::BIGINT as total_bytes,
    COUNT(*)::INTEGER as total_videos,
    pg_size_pretty(COALESCE(SUM(file_size_bytes), 0)::BIGINT) as formatted_size
  FROM videos
  WHERE creator_id = creator_uuid
    AND is_deleted = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup old failed uploads (older than 24 hours)
CREATE OR REPLACE FUNCTION cleanup_failed_uploads()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete videos stuck in uploading/pending for > 24 hours
  WITH deleted AS (
    DELETE FROM videos
    WHERE status IN ('pending', 'uploading', 'failed')
      AND created_at < NOW() - INTERVAL '24 hours'
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Index for storage path lookups
CREATE INDEX IF NOT EXISTS idx_videos_storage_path ON videos(storage_path)
WHERE storage_path IS NOT NULL;

-- Index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_videos_status_created ON videos(status, created_at)
WHERE status IN ('pending', 'uploading', 'failed');

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON FUNCTION get_creator_storage_usage IS 'Calculate total storage usage for a creator';
COMMENT ON FUNCTION cleanup_failed_uploads IS 'Delete videos stuck in uploading/failed state for > 24 hours';
