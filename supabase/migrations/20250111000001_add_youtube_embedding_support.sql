-- Add YouTube Embedding Support
-- Migration: Add columns to support both YouTube embedding and file uploads

-- =====================================================
-- ADD COLUMNS TO VIDEOS TABLE
-- =====================================================

-- Add source_type column to distinguish between YouTube and uploaded videos
ALTER TABLE videos
ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'upload'
CHECK (source_type IN ('youtube', 'upload'));

-- Add YouTube-specific columns
ALTER TABLE videos
ADD COLUMN IF NOT EXISTS youtube_video_id TEXT,
ADD COLUMN IF NOT EXISTS youtube_channel_id TEXT;

-- Create indexes for YouTube lookups
CREATE INDEX IF NOT EXISTS idx_videos_source_type ON videos(source_type);
CREATE INDEX IF NOT EXISTS idx_videos_youtube_video_id ON videos(youtube_video_id) WHERE youtube_video_id IS NOT NULL;

-- =====================================================
-- ADD CONSTRAINT FOR DUAL SUPPORT
-- =====================================================

-- Ensure that either youtube_video_id OR storage_path exists (but not both null)
-- YouTube videos: youtube_video_id must exist, storage_path can be null
-- Uploaded videos: storage_path must exist, youtube_video_id must be null

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'videos_source_validation') THEN
    ALTER TABLE videos
    ADD CONSTRAINT videos_source_validation CHECK (
      (source_type = 'youtube' AND youtube_video_id IS NOT NULL AND storage_path IS NULL) OR
      (source_type = 'upload' AND storage_path IS NOT NULL AND youtube_video_id IS NULL)
    );
  END IF;
END $$;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON COLUMN videos.source_type IS 'Source of video: youtube (embedded) or upload (file upload)';
COMMENT ON COLUMN videos.youtube_video_id IS 'YouTube video ID (11 characters) for embedded videos';
COMMENT ON COLUMN videos.youtube_channel_id IS 'YouTube channel ID for attribution and analytics';

-- =====================================================
-- UPDATE EXISTING RECORDS
-- =====================================================

-- Set source_type to 'upload' for all existing videos (default already set)
-- This is safe because all existing videos were uploaded via file upload

UPDATE videos
SET source_type = 'upload'
WHERE source_type IS NULL;
