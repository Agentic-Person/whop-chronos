-- Create video_analytics_events table
-- Migration: Granular event tracking for video interactions and lifecycle

-- =====================================================
-- VIDEO_ANALYTICS_EVENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS video_analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN (
    'video_imported',        -- When video first added to system
    'video_transcribed',     -- Transcript extraction complete
    'video_embedded',        -- Embeddings generated
    'video_added_to_course', -- Added to course module
    'video_started',         -- Student begins watching
    'video_progress',        -- Milestone reached (10%, 25%, 50%, 75%, 90%)
    'video_completed',       -- Student finishes (90%+ watched)
    'video_rewatched'        -- Student rewatches completed video
  )),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  module_id UUID REFERENCES course_modules(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Index for fetching all events for a specific video
CREATE INDEX IF NOT EXISTS idx_video_analytics_video_id ON video_analytics_events(video_id);

-- Index for creator analytics dashboard queries
CREATE INDEX IF NOT EXISTS idx_video_analytics_creator_id ON video_analytics_events(creator_id);

-- Index for student progress tracking
CREATE INDEX IF NOT EXISTS idx_video_analytics_student_id ON video_analytics_events(student_id) WHERE student_id IS NOT NULL;

-- Index for filtering by event type
CREATE INDEX IF NOT EXISTS idx_video_analytics_event_type ON video_analytics_events(event_type);

-- Index for time-series queries (most recent events first)
CREATE INDEX IF NOT EXISTS idx_video_analytics_timestamp ON video_analytics_events(timestamp DESC);

-- Composite index for course-level analytics
CREATE INDEX IF NOT EXISTS idx_video_analytics_course_events ON video_analytics_events(course_id, event_type, timestamp DESC) WHERE course_id IS NOT NULL;

-- Composite index for student engagement queries
CREATE INDEX IF NOT EXISTS idx_video_analytics_student_events ON video_analytics_events(student_id, video_id, event_type, timestamp DESC) WHERE student_id IS NOT NULL;

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE video_analytics_events ENABLE ROW LEVEL SECURITY;

-- Creators can view all events for their own videos
DROP POLICY IF EXISTS video_analytics_events_select_policy ON video_analytics_events;
CREATE POLICY video_analytics_events_select_policy ON video_analytics_events
  FOR SELECT
  USING (
    creator_id = (SELECT id FROM creators WHERE whop_user_id = auth.jwt()->>'sub')
  );

-- System can insert events (service role only)
DROP POLICY IF EXISTS video_analytics_events_insert_policy ON video_analytics_events;
CREATE POLICY video_analytics_events_insert_policy ON video_analytics_events
  FOR INSERT
  WITH CHECK (true); -- Service role handles validation

-- No updates allowed (events are immutable)
-- No delete policy (events are permanent for analytics)

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE video_analytics_events IS 'Granular event tracking for video lifecycle and student interactions';
COMMENT ON COLUMN video_analytics_events.event_type IS 'Type of event: imported, transcribed, embedded, added_to_course, started, progress, completed, rewatched';
COMMENT ON COLUMN video_analytics_events.video_id IS 'Video associated with this event';
COMMENT ON COLUMN video_analytics_events.creator_id IS 'Creator who owns the video';
COMMENT ON COLUMN video_analytics_events.student_id IS 'Student who triggered the event (null for creator events)';
COMMENT ON COLUMN video_analytics_events.course_id IS 'Course context if applicable';
COMMENT ON COLUMN video_analytics_events.module_id IS 'Module context if applicable';
COMMENT ON COLUMN video_analytics_events.metadata IS 'Event-specific metadata (source_type, duration, percent_complete, watch_time, cost, etc.)';
COMMENT ON COLUMN video_analytics_events.timestamp IS 'When the event occurred (can differ from created_at for batch imports)';

-- =====================================================
-- METADATA EXAMPLES
-- =====================================================

-- Example metadata structures for different event types:
--
-- video_imported:
-- {
--   "source_type": "youtube" | "mux" | "loom" | "upload",
--   "duration_seconds": 3600,
--   "file_size_bytes": 104857600  (for uploads only)
-- }
--
-- video_transcribed:
-- {
--   "transcript_method": "youtube_captions" | "loom_api" | "mux_auto" | "whisper",
--   "cost": 0 | 0.21 (Whisper cost),
--   "duration_seconds": 3600,
--   "word_count": 5400
-- }
--
-- video_embedded:
-- {
--   "chunk_count": 45,
--   "embedding_cost": 0.012,
--   "processing_time_seconds": 28
-- }
--
-- video_started:
-- {
--   "session_id": "uuid",
--   "device": "desktop" | "mobile" | "tablet",
--   "referrer": "course_page" | "direct_link"
-- }
--
-- video_progress:
-- {
--   "percent_complete": 25 | 50 | 75 | 90,
--   "watch_time_seconds": 900,
--   "session_id": "uuid"
-- }
--
-- video_completed:
-- {
--   "percent_complete": 95,
--   "watch_time_seconds": 3420,
--   "session_id": "uuid",
--   "completion_time": "2025-01-12T14:30:00Z"
-- }
--
-- video_rewatched:
-- {
--   "previous_completions": 2,
--   "time_since_last_view_hours": 48
-- }

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to track video event (callable from API)
CREATE OR REPLACE FUNCTION track_video_event(
  p_event_type TEXT,
  p_video_id UUID,
  p_creator_id UUID,
  p_student_id UUID DEFAULT NULL,
  p_course_id UUID DEFAULT NULL,
  p_module_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_timestamp TIMESTAMPTZ DEFAULT NOW()
)
RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO video_analytics_events (
    event_type,
    video_id,
    creator_id,
    student_id,
    course_id,
    module_id,
    metadata,
    timestamp
  ) VALUES (
    p_event_type,
    p_video_id,
    p_creator_id,
    p_student_id,
    p_course_id,
    p_module_id,
    p_metadata,
    p_timestamp
  )
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION track_video_event IS 'Helper function to track video analytics events';
