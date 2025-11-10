-- Create core tables for Chronos
-- Migration 2: Core schema

-- =====================================================
-- CREATORS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS creators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  whop_company_id TEXT UNIQUE NOT NULL,
  whop_user_id TEXT NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  subscription_tier TEXT NOT NULL DEFAULT 'basic' CHECK (subscription_tier IN ('basic', 'pro', 'enterprise')),
  settings JSONB DEFAULT '{
    "notifications_enabled": true,
    "ai_model": "claude-3-5-haiku-20241022",
    "auto_transcribe": true,
    "default_chunk_size": 800
  }'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX idx_creators_whop_company_id ON creators(whop_company_id);
CREATE INDEX idx_creators_subscription_tier ON creators(subscription_tier);
CREATE INDEX idx_creators_is_active ON creators(is_active);

COMMENT ON TABLE creators IS 'Whop creators/company owners using the platform';
COMMENT ON COLUMN creators.whop_company_id IS 'Unique Whop company identifier';
COMMENT ON COLUMN creators.subscription_tier IS 'Pricing tier: basic, pro, or enterprise';

-- =====================================================
-- STUDENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  whop_user_id TEXT UNIQUE NOT NULL,
  whop_membership_id TEXT NOT NULL,
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  preferences JSONB DEFAULT '{
    "playback_speed": 1.0,
    "auto_advance": false,
    "show_timestamps": true,
    "theme": "dark"
  }'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX idx_students_whop_user_id ON students(whop_user_id);
CREATE INDEX idx_students_whop_membership_id ON students(whop_membership_id);
CREATE INDEX idx_students_creator_id ON students(creator_id);
CREATE INDEX idx_students_is_active ON students(is_active);

COMMENT ON TABLE students IS 'Students with active Whop memberships';
COMMENT ON COLUMN students.whop_membership_id IS 'Active Whop membership ID for access control';

-- =====================================================
-- VIDEOS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT,
  storage_path TEXT,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  transcript TEXT,
  transcript_language TEXT DEFAULT 'en',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'uploading', 'transcribing', 'processing', 'embedding', 'completed', 'failed')),
  error_message TEXT,
  processing_started_at TIMESTAMPTZ,
  processing_completed_at TIMESTAMPTZ,
  file_size_bytes BIGINT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_videos_creator_id ON videos(creator_id);
CREATE INDEX idx_videos_status ON videos(status);
CREATE INDEX idx_videos_created_at ON videos(created_at DESC);
CREATE INDEX idx_videos_is_deleted ON videos(is_deleted) WHERE is_deleted = false;

COMMENT ON TABLE videos IS 'Uploaded video content with processing status';
COMMENT ON COLUMN videos.status IS 'Processing pipeline status';
COMMENT ON COLUMN videos.storage_path IS 'Supabase Storage bucket path';

-- =====================================================
-- VIDEO_CHUNKS TABLE (with vector embeddings)
-- =====================================================
CREATE TABLE IF NOT EXISTS video_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  chunk_text TEXT NOT NULL,
  embedding vector(1536),
  start_time_seconds INTEGER NOT NULL,
  end_time_seconds INTEGER NOT NULL,
  word_count INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_video_chunks_video_id ON video_chunks(video_id);
CREATE INDEX idx_video_chunks_chunk_index ON video_chunks(video_id, chunk_index);

COMMENT ON TABLE video_chunks IS 'Chunked video transcripts with vector embeddings for RAG';
COMMENT ON COLUMN video_chunks.embedding IS 'OpenAI ada-002 embedding vector (1536 dimensions)';
COMMENT ON COLUMN video_chunks.chunk_index IS 'Sequential index within video';

-- =====================================================
-- COURSES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  is_deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_courses_creator_id ON courses(creator_id);
CREATE INDEX idx_courses_is_published ON courses(is_published);
CREATE INDEX idx_courses_display_order ON courses(creator_id, display_order);
CREATE INDEX idx_courses_is_deleted ON courses(is_deleted) WHERE is_deleted = false;

COMMENT ON TABLE courses IS 'Course containers organizing videos into modules';
COMMENT ON COLUMN courses.display_order IS 'Sort order for course listing';

-- =====================================================
-- COURSE_MODULES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS course_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_ids UUID[] NOT NULL DEFAULT ARRAY[]::UUID[],
  display_order INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_course_modules_course_id ON course_modules(course_id);
CREATE INDEX idx_course_modules_display_order ON course_modules(course_id, display_order);
CREATE INDEX idx_course_modules_video_ids ON course_modules USING GIN(video_ids);

COMMENT ON TABLE course_modules IS 'Course modules containing ordered video lists';
COMMENT ON COLUMN course_modules.video_ids IS 'Array of video UUIDs in display order';

-- =====================================================
-- CHAT_SESSIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  title TEXT,
  context_video_ids UUID[] DEFAULT ARRAY[]::UUID[],
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_message_at TIMESTAMPTZ
);

CREATE INDEX idx_chat_sessions_student_id ON chat_sessions(student_id);
CREATE INDEX idx_chat_sessions_creator_id ON chat_sessions(creator_id);
CREATE INDEX idx_chat_sessions_last_message_at ON chat_sessions(last_message_at DESC);

COMMENT ON TABLE chat_sessions IS 'AI chat conversation sessions';
COMMENT ON COLUMN chat_sessions.context_video_ids IS 'Videos available for RAG context';

-- =====================================================
-- CHAT_MESSAGES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  video_references JSONB DEFAULT '[]'::jsonb,
  token_count INTEGER,
  model TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(session_id, created_at);

COMMENT ON TABLE chat_messages IS 'Individual chat messages with AI responses';
COMMENT ON COLUMN chat_messages.video_references IS 'Array of {video_id, timestamp, title} objects';

-- =====================================================
-- VIDEO_ANALYTICS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS video_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  views INTEGER NOT NULL DEFAULT 0,
  unique_viewers INTEGER NOT NULL DEFAULT 0,
  total_watch_time_seconds INTEGER NOT NULL DEFAULT 0,
  average_watch_time_seconds NUMERIC(10,2),
  completion_rate NUMERIC(5,2),
  ai_interactions INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_video_date UNIQUE(video_id, date)
);

CREATE INDEX idx_video_analytics_video_id ON video_analytics(video_id);
CREATE INDEX idx_video_analytics_date ON video_analytics(date DESC);
CREATE INDEX idx_video_analytics_video_date ON video_analytics(video_id, date DESC);

COMMENT ON TABLE video_analytics IS 'Daily video performance metrics';
COMMENT ON COLUMN video_analytics.completion_rate IS 'Percentage of viewers who finished video';

-- =====================================================
-- USAGE_METRICS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS usage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  storage_used_bytes BIGINT NOT NULL DEFAULT 0,
  videos_uploaded INTEGER NOT NULL DEFAULT 0,
  total_video_duration_seconds INTEGER NOT NULL DEFAULT 0,
  ai_credits_used INTEGER NOT NULL DEFAULT 0,
  transcription_minutes NUMERIC(10,2) NOT NULL DEFAULT 0,
  chat_messages_sent INTEGER NOT NULL DEFAULT 0,
  active_students INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_creator_date UNIQUE(creator_id, date)
);

CREATE INDEX idx_usage_metrics_creator_id ON usage_metrics(creator_id);
CREATE INDEX idx_usage_metrics_date ON usage_metrics(date DESC);
CREATE INDEX idx_usage_metrics_creator_date ON usage_metrics(creator_id, date DESC);

COMMENT ON TABLE usage_metrics IS 'Daily creator usage and quota tracking';
COMMENT ON COLUMN usage_metrics.ai_credits_used IS 'AI API usage count (rate limiting)';

-- =====================================================
-- UPDATE TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all tables
CREATE TRIGGER update_creators_updated_at BEFORE UPDATE ON creators
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON videos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_course_modules_updated_at BEFORE UPDATE ON course_modules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_sessions_updated_at BEFORE UPDATE ON chat_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_video_analytics_updated_at BEFORE UPDATE ON video_analytics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usage_metrics_updated_at BEFORE UPDATE ON usage_metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
