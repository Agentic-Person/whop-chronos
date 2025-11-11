-- Row Level Security (RLS) Policies
-- Migration 4: Security policies

-- =====================================================
-- ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_metrics ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- HELPER FUNCTIONS FOR RLS
-- =====================================================

-- Get current user's creator ID from JWT claims
CREATE OR REPLACE FUNCTION public.get_creator_id()
RETURNS UUID AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true)::json->>'creator_id', '')::uuid;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Get current user's student ID from JWT claims
CREATE OR REPLACE FUNCTION public.get_student_id()
RETURNS UUID AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true)::json->>'student_id', '')::uuid;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Check if user has service role
CREATE OR REPLACE FUNCTION public.is_service_role()
RETURNS BOOLEAN AS $$
  SELECT current_setting('request.jwt.claims', true)::json->>'role' = 'service_role';
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- =====================================================
-- CREATORS TABLE POLICIES
-- =====================================================

-- Creators can view their own profile
CREATE POLICY "Creators can view own profile"
  ON creators FOR SELECT
  USING (id = public.get_creator_id() OR public.is_service_role());

-- Creators can update their own profile
CREATE POLICY "Creators can update own profile"
  ON creators FOR UPDATE
  USING (id = public.get_creator_id())
  WITH CHECK (id = public.get_creator_id());

-- Service role can insert creators (during signup)
CREATE POLICY "Service role can insert creators"
  ON creators FOR INSERT
  WITH CHECK (public.is_service_role());

-- =====================================================
-- STUDENTS TABLE POLICIES
-- =====================================================

-- Students can view their own profile
CREATE POLICY "Students can view own profile"
  ON students FOR SELECT
  USING (id = public.get_student_id() OR creator_id = public.get_creator_id() OR public.is_service_role());

-- Creators can view their students
CREATE POLICY "Creators can view their students"
  ON students FOR SELECT
  USING (creator_id = public.get_creator_id());

-- Service role can manage students
CREATE POLICY "Service role can insert students"
  ON students FOR INSERT
  WITH CHECK (public.is_service_role());

CREATE POLICY "Service role can update students"
  ON students FOR UPDATE
  USING (public.is_service_role())
  WITH CHECK (public.is_service_role());

-- =====================================================
-- VIDEOS TABLE POLICIES
-- =====================================================

-- Creators can view their own videos
CREATE POLICY "Creators can view own videos"
  ON videos FOR SELECT
  USING (creator_id = public.get_creator_id() OR public.is_service_role());

-- Students can view videos from their creator
CREATE POLICY "Students can view creator videos"
  ON videos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = public.get_student_id()
      AND s.creator_id = videos.creator_id
      AND s.is_active = true
    )
  );

-- Creators can manage their videos
CREATE POLICY "Creators can insert videos"
  ON videos FOR INSERT
  WITH CHECK (creator_id = public.get_creator_id());

CREATE POLICY "Creators can update own videos"
  ON videos FOR UPDATE
  USING (creator_id = public.get_creator_id())
  WITH CHECK (creator_id = public.get_creator_id());

CREATE POLICY "Creators can delete own videos"
  ON videos FOR DELETE
  USING (creator_id = public.get_creator_id());

-- =====================================================
-- VIDEO_CHUNKS TABLE POLICIES
-- =====================================================

-- Creators can view chunks from their videos
CREATE POLICY "Creators can view own video chunks"
  ON video_chunks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM videos v
      WHERE v.id = video_chunks.video_id
      AND v.creator_id = public.get_creator_id()
    )
    OR public.is_service_role()
  );

-- Students can view chunks from their creator's videos
CREATE POLICY "Students can view creator video chunks"
  ON video_chunks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM videos v
      INNER JOIN students s ON s.creator_id = v.creator_id
      WHERE v.id = video_chunks.video_id
      AND s.id = public.get_student_id()
      AND s.is_active = true
    )
  );

-- Service role can manage chunks (for background processing)
CREATE POLICY "Service role can manage video chunks"
  ON video_chunks FOR ALL
  USING (public.is_service_role())
  WITH CHECK (public.is_service_role());

-- =====================================================
-- COURSES TABLE POLICIES
-- =====================================================

-- Creators can view their courses
CREATE POLICY "Creators can view own courses"
  ON courses FOR SELECT
  USING (creator_id = public.get_creator_id() OR public.is_service_role());

-- Students can view published courses from their creator
CREATE POLICY "Students can view published courses"
  ON courses FOR SELECT
  USING (
    is_published = true
    AND EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = public.get_student_id()
      AND s.creator_id = courses.creator_id
      AND s.is_active = true
    )
  );

-- Creators can manage their courses
CREATE POLICY "Creators can manage courses"
  ON courses FOR ALL
  USING (creator_id = public.get_creator_id())
  WITH CHECK (creator_id = public.get_creator_id());

-- =====================================================
-- COURSE_MODULES TABLE POLICIES
-- =====================================================

-- Inherit course access policies
CREATE POLICY "Course access determines module access for SELECT"
  ON course_modules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = course_modules.course_id
      AND (
        c.creator_id = public.get_creator_id()
        OR (
          c.is_published = true
          AND EXISTS (
            SELECT 1 FROM students s
            WHERE s.id = public.get_student_id()
            AND s.creator_id = c.creator_id
            AND s.is_active = true
          )
        )
      )
    )
    OR public.is_service_role()
  );

CREATE POLICY "Creators can manage course modules"
  ON course_modules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = course_modules.course_id
      AND c.creator_id = public.get_creator_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = course_modules.course_id
      AND c.creator_id = public.get_creator_id()
    )
  );

-- =====================================================
-- CHAT_SESSIONS TABLE POLICIES
-- =====================================================

-- Students can view their own chat sessions
CREATE POLICY "Students can view own chat sessions"
  ON chat_sessions FOR SELECT
  USING (student_id = public.get_student_id() OR public.is_service_role());

-- Creators can view chat sessions for their students
CREATE POLICY "Creators can view student chat sessions"
  ON chat_sessions FOR SELECT
  USING (creator_id = public.get_creator_id());

-- Students can create and update their own sessions
CREATE POLICY "Students can manage own chat sessions"
  ON chat_sessions FOR ALL
  USING (student_id = public.get_student_id())
  WITH CHECK (student_id = public.get_student_id());

-- =====================================================
-- CHAT_MESSAGES TABLE POLICIES
-- =====================================================

-- Inherit chat session access policies
CREATE POLICY "Session access determines message access"
  ON chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_sessions cs
      WHERE cs.id = chat_messages.session_id
      AND (
        cs.student_id = public.get_student_id()
        OR cs.creator_id = public.get_creator_id()
      )
    )
    OR public.is_service_role()
  );

CREATE POLICY "Students can create messages in own sessions"
  ON chat_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_sessions cs
      WHERE cs.id = chat_messages.session_id
      AND cs.student_id = public.get_student_id()
    )
  );

-- Service role can create assistant messages
CREATE POLICY "Service role can create messages"
  ON chat_messages FOR INSERT
  WITH CHECK (public.is_service_role());

-- =====================================================
-- VIDEO_ANALYTICS TABLE POLICIES
-- =====================================================

-- Creators can view analytics for their videos
CREATE POLICY "Creators can view own video analytics"
  ON video_analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM videos v
      WHERE v.id = video_analytics.video_id
      AND v.creator_id = public.get_creator_id()
    )
    OR public.is_service_role()
  );

-- Service role can manage analytics (background jobs)
CREATE POLICY "Service role can manage video analytics"
  ON video_analytics FOR ALL
  USING (public.is_service_role())
  WITH CHECK (public.is_service_role());

-- =====================================================
-- USAGE_METRICS TABLE POLICIES
-- =====================================================

-- Creators can view their own usage metrics
CREATE POLICY "Creators can view own usage metrics"
  ON usage_metrics FOR SELECT
  USING (creator_id = public.get_creator_id() OR public.is_service_role());

-- Service role can manage usage metrics
CREATE POLICY "Service role can manage usage metrics"
  ON usage_metrics FOR ALL
  USING (public.is_service_role())
  WITH CHECK (public.is_service_role());

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Service role has full access (already has it by default)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;
