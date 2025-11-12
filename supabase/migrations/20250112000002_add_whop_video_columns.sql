-- Add Whop Video Support (Mux, Loom, and other embeds)
-- Migration: Extend videos table to support multiple video hosting platforms

-- =====================================================
-- ADD WHOP VIDEO COLUMNS
-- =====================================================

-- Add Whop-specific columns
ALTER TABLE videos
ADD COLUMN IF NOT EXISTS whop_lesson_id TEXT,
ADD COLUMN IF NOT EXISTS mux_asset_id TEXT,
ADD COLUMN IF NOT EXISTS mux_playback_id TEXT,
ADD COLUMN IF NOT EXISTS embed_type TEXT,
ADD COLUMN IF NOT EXISTS embed_id TEXT;

-- =====================================================
-- UPDATE SOURCE TYPE CONSTRAINT
-- =====================================================

-- Drop old constraint that only allows 'youtube' and 'upload'
ALTER TABLE videos DROP CONSTRAINT IF EXISTS videos_source_type_check;

-- Add new constraint with all supported source types
ALTER TABLE videos ADD CONSTRAINT videos_source_type_check
  CHECK (source_type IN ('youtube', 'mux', 'loom', 'upload'));

-- =====================================================
-- ADD EMBED TYPE CONSTRAINT
-- =====================================================

-- Ensure embed_type only contains valid values
ALTER TABLE videos ADD CONSTRAINT videos_embed_type_check
  CHECK (embed_type IS NULL OR embed_type IN ('youtube', 'loom', 'vimeo', 'wistia'));

-- =====================================================
-- INDEXES
-- =====================================================

-- Index for Whop lesson lookups (when syncing from Whop)
CREATE INDEX IF NOT EXISTS idx_videos_whop_lesson_id ON videos(whop_lesson_id) WHERE whop_lesson_id IS NOT NULL;

-- Index for Mux asset lookups
CREATE INDEX IF NOT EXISTS idx_videos_mux_asset_id ON videos(mux_asset_id) WHERE mux_asset_id IS NOT NULL;

-- Index for Mux playback lookups
CREATE INDEX IF NOT EXISTS idx_videos_mux_playback_id ON videos(mux_playback_id) WHERE mux_playback_id IS NOT NULL;

-- Index for embed type filtering
CREATE INDEX IF NOT EXISTS idx_videos_embed_type ON videos(embed_type) WHERE embed_type IS NOT NULL;

-- Index for embed ID lookups
CREATE INDEX IF NOT EXISTS idx_videos_embed_id ON videos(embed_id) WHERE embed_id IS NOT NULL;

-- =====================================================
-- UPDATE SOURCE VALIDATION CONSTRAINT
-- =====================================================

-- Drop old validation constraint
ALTER TABLE videos DROP CONSTRAINT IF EXISTS videos_source_validation;

-- Add updated validation constraint for multiple source types
ALTER TABLE videos
ADD CONSTRAINT videos_source_validation CHECK (
  -- YouTube videos: youtube_video_id must exist
  (source_type = 'youtube' AND youtube_video_id IS NOT NULL) OR

  -- Mux videos: mux_playback_id must exist
  (source_type = 'mux' AND mux_playback_id IS NOT NULL) OR

  -- Loom videos: embed_id must exist
  (source_type = 'loom' AND embed_id IS NOT NULL) OR

  -- Uploaded videos: storage_path must exist
  (source_type = 'upload' AND storage_path IS NOT NULL)
);

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON COLUMN videos.whop_lesson_id IS 'Whop lesson ID for syncing with Whop course content';
COMMENT ON COLUMN videos.mux_asset_id IS 'Mux asset ID for video hosting (private content)';
COMMENT ON COLUMN videos.mux_playback_id IS 'Mux playback ID for HLS streaming';
COMMENT ON COLUMN videos.embed_type IS 'Type of embed: youtube, loom, vimeo, wistia';
COMMENT ON COLUMN videos.embed_id IS 'Platform-specific video identifier for embeds';

-- =====================================================
-- DATA MIGRATION NOTE
-- =====================================================

-- No data migration needed - all new columns are nullable
-- Existing videos (youtube and upload) remain unchanged
