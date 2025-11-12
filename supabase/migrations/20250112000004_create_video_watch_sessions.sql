-- Create video_watch_sessions table
-- Migration: Track individual student viewing sessions with watch time and completion

-- =====================================================
-- VIDEO_WATCH_SESSIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS video_watch_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  session_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  session_end TIMESTAMPTZ,
  watch_time_seconds INTEGER DEFAULT 0,
  percent_complete INTEGER DEFAULT 0 CHECK (percent_complete >= 0 AND percent_complete <= 100),
  completed BOOLEAN DEFAULT false,
  device_type TEXT,
  referrer_type TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Index for fetching all sessions for a video (analytics)
CREATE INDEX IF NOT EXISTS idx_video_watch_sessions_video_id ON video_watch_sessions(video_id);

-- Index for fetching all sessions for a student (progress tracking)
CREATE INDEX IF NOT EXISTS idx_video_watch_sessions_student_id ON video_watch_sessions(student_id);

-- Index for filtering completed sessions
CREATE INDEX IF NOT EXISTS idx_video_watch_sessions_completed ON video_watch_sessions(completed);

-- Composite index for student-video progress queries
CREATE INDEX IF NOT EXISTS idx_video_watch_sessions_student_video ON video_watch_sessions(student_id, video_id, session_start DESC);

-- Index for time-series queries (recent sessions first)
CREATE INDEX IF NOT EXISTS idx_video_watch_sessions_start ON video_watch_sessions(session_start DESC);

-- Index for active sessions (not yet ended)
CREATE INDEX IF NOT EXISTS idx_video_watch_sessions_active ON video_watch_sessions(session_end) WHERE session_end IS NULL;

-- =====================================================
-- CONSTRAINTS
-- =====================================================

-- Ensure watch time is non-negative
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'video_watch_sessions_watch_time_positive') THEN
    ALTER TABLE video_watch_sessions ADD CONSTRAINT video_watch_sessions_watch_time_positive
      CHECK (watch_time_seconds >= 0);
  END IF;
END $$;

-- Ensure session_end is after session_start if provided
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'video_watch_sessions_end_after_start') THEN
    ALTER TABLE video_watch_sessions ADD CONSTRAINT video_watch_sessions_end_after_start
      CHECK (session_end IS NULL OR session_end >= session_start);
  END IF;
END $$;

-- Ensure device_type is valid if provided
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'video_watch_sessions_device_type_valid') THEN
    ALTER TABLE video_watch_sessions ADD CONSTRAINT video_watch_sessions_device_type_valid
      CHECK (device_type IS NULL OR device_type IN ('desktop', 'mobile', 'tablet'));
  END IF;
END $$;

-- Ensure referrer_type is valid if provided
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'video_watch_sessions_referrer_type_valid') THEN
    ALTER TABLE video_watch_sessions ADD CONSTRAINT video_watch_sessions_referrer_type_valid
      CHECK (referrer_type IS NULL OR referrer_type IN ('course_page', 'direct_link', 'search', 'chat_reference'));
  END IF;
END $$;

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE video_watch_sessions ENABLE ROW LEVEL SECURITY;

-- Students can view their own watch sessions
DROP POLICY IF EXISTS video_watch_sessions_student_select_policy ON video_watch_sessions;
CREATE POLICY video_watch_sessions_student_select_policy ON video_watch_sessions
  FOR SELECT
  USING (
    student_id = (SELECT id FROM students WHERE whop_user_id = auth.jwt()->>'sub')
  );

-- Creators can view sessions for their own videos
DROP POLICY IF EXISTS video_watch_sessions_creator_select_policy ON video_watch_sessions;
CREATE POLICY video_watch_sessions_creator_select_policy ON video_watch_sessions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM videos v
      WHERE v.id = video_watch_sessions.video_id
      AND v.creator_id = (SELECT id FROM creators WHERE whop_user_id = auth.jwt()->>'sub')
    )
  );

-- Students can insert their own watch sessions
DROP POLICY IF EXISTS video_watch_sessions_insert_policy ON video_watch_sessions;
CREATE POLICY video_watch_sessions_insert_policy ON video_watch_sessions
  FOR INSERT
  WITH CHECK (
    student_id = (SELECT id FROM students WHERE whop_user_id = auth.jwt()->>'sub')
  );

-- Students can update their own watch sessions
DROP POLICY IF EXISTS video_watch_sessions_update_policy ON video_watch_sessions;
CREATE POLICY video_watch_sessions_update_policy ON video_watch_sessions
  FOR UPDATE
  USING (
    student_id = (SELECT id FROM students WHERE whop_user_id = auth.jwt()->>'sub')
  );

-- No delete policy (watch history is permanent for analytics)

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE video_watch_sessions IS 'Individual student viewing sessions with watch time and completion tracking';
COMMENT ON COLUMN video_watch_sessions.video_id IS 'Video being watched';
COMMENT ON COLUMN video_watch_sessions.student_id IS 'Student watching the video';
COMMENT ON COLUMN video_watch_sessions.session_start IS 'When the student started watching';
COMMENT ON COLUMN video_watch_sessions.session_end IS 'When the student stopped watching (null if still watching)';
COMMENT ON COLUMN video_watch_sessions.watch_time_seconds IS 'Actual time watched (excluding pauses)';
COMMENT ON COLUMN video_watch_sessions.percent_complete IS 'Percentage of video completed (0-100)';
COMMENT ON COLUMN video_watch_sessions.completed IS 'True if student watched 90%+ of the video';
COMMENT ON COLUMN video_watch_sessions.device_type IS 'Device used: desktop, mobile, tablet';
COMMENT ON COLUMN video_watch_sessions.referrer_type IS 'How the student accessed the video: course_page, direct_link, search, chat_reference';
COMMENT ON COLUMN video_watch_sessions.metadata IS 'Additional session metadata (playback speed, quality settings, etc.)';

-- =====================================================
-- UPDATE TRIGGER
-- =====================================================

-- Automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_video_watch_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS video_watch_sessions_updated_at_trigger ON video_watch_sessions;
CREATE TRIGGER video_watch_sessions_updated_at_trigger
  BEFORE UPDATE ON video_watch_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_video_watch_sessions_updated_at();

-- =====================================================
-- AUTO-COMPLETION TRIGGER
-- =====================================================

-- Automatically set completed=true when percent_complete >= 90
CREATE OR REPLACE FUNCTION auto_complete_video_watch_session()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.percent_complete >= 90 THEN
    NEW.completed = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS video_watch_sessions_auto_complete_trigger ON video_watch_sessions;
CREATE TRIGGER video_watch_sessions_auto_complete_trigger
  BEFORE INSERT OR UPDATE ON video_watch_sessions
  FOR EACH ROW
  EXECUTE FUNCTION auto_complete_video_watch_session();

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get student's total watch time for a video
CREATE OR REPLACE FUNCTION get_student_total_watch_time(
  p_student_id UUID,
  p_video_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_total_watch_time INTEGER;
BEGIN
  SELECT COALESCE(SUM(watch_time_seconds), 0)
  INTO v_total_watch_time
  FROM video_watch_sessions
  WHERE student_id = p_student_id
    AND video_id = p_video_id;

  RETURN v_total_watch_time;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_student_total_watch_time IS 'Get total watch time (all sessions) for a student on a specific video';

-- Function to get student's highest completion percentage for a video
CREATE OR REPLACE FUNCTION get_student_highest_completion(
  p_student_id UUID,
  p_video_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_highest_completion INTEGER;
BEGIN
  SELECT COALESCE(MAX(percent_complete), 0)
  INTO v_highest_completion
  FROM video_watch_sessions
  WHERE student_id = p_student_id
    AND video_id = p_video_id;

  RETURN v_highest_completion;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_student_highest_completion IS 'Get highest completion percentage achieved by a student for a specific video';

-- Function to check if student has completed a video
CREATE OR REPLACE FUNCTION has_student_completed_video(
  p_student_id UUID,
  p_video_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_completed BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1
    FROM video_watch_sessions
    WHERE student_id = p_student_id
      AND video_id = p_video_id
      AND completed = true
  ) INTO v_completed;

  RETURN v_completed;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION has_student_completed_video IS 'Check if student has completed a video (90%+ watched in any session)';

-- =====================================================
-- METADATA EXAMPLES
-- =====================================================

-- Example metadata structure:
-- {
--   "playback_speed": 1.5,
--   "quality": "720p",
--   "captions_enabled": true,
--   "fullscreen_used": true,
--   "seek_count": 8,
--   "pause_count": 3,
--   "browser": "Chrome 120",
--   "os": "Windows 11"
-- }
