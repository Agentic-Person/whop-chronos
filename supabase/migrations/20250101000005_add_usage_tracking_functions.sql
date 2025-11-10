-- Add usage tracking PostgreSQL functions
-- Migration 5: Usage metrics functions for cost tracking

-- =====================================================
-- FUNCTION: Increment usage metrics
-- =====================================================
CREATE OR REPLACE FUNCTION increment_usage_metrics(
  p_creator_id UUID,
  p_date DATE DEFAULT CURRENT_DATE,
  p_storage_used_bytes BIGINT DEFAULT 0,
  p_videos_uploaded INTEGER DEFAULT 0,
  p_total_video_duration_seconds INTEGER DEFAULT 0,
  p_ai_credits_used INTEGER DEFAULT 0,
  p_transcription_minutes NUMERIC(10,2) DEFAULT 0,
  p_chat_messages_sent INTEGER DEFAULT 0,
  p_active_students INTEGER DEFAULT 0,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO usage_metrics (
    creator_id,
    date,
    storage_used_bytes,
    videos_uploaded,
    total_video_duration_seconds,
    ai_credits_used,
    transcription_minutes,
    chat_messages_sent,
    active_students,
    metadata,
    created_at,
    updated_at
  )
  VALUES (
    p_creator_id,
    p_date,
    p_storage_used_bytes,
    p_videos_uploaded,
    p_total_video_duration_seconds,
    p_ai_credits_used,
    p_transcription_minutes,
    p_chat_messages_sent,
    p_active_students,
    p_metadata,
    NOW(),
    NOW()
  )
  ON CONFLICT (creator_id, date)
  DO UPDATE SET
    storage_used_bytes = GREATEST(usage_metrics.storage_used_bytes, EXCLUDED.storage_used_bytes),
    videos_uploaded = usage_metrics.videos_uploaded + EXCLUDED.videos_uploaded,
    total_video_duration_seconds = usage_metrics.total_video_duration_seconds + EXCLUDED.total_video_duration_seconds,
    ai_credits_used = usage_metrics.ai_credits_used + EXCLUDED.ai_credits_used,
    transcription_minutes = usage_metrics.transcription_minutes + EXCLUDED.transcription_minutes,
    chat_messages_sent = usage_metrics.chat_messages_sent + EXCLUDED.chat_messages_sent,
    active_students = GREATEST(usage_metrics.active_students, EXCLUDED.active_students),
    metadata = usage_metrics.metadata || EXCLUDED.metadata,
    updated_at = NOW();
END;
$$;

COMMENT ON FUNCTION increment_usage_metrics IS 'Atomically increment usage metrics for a creator on a specific date';

-- =====================================================
-- FUNCTION: Get creator monthly usage summary
-- =====================================================
CREATE OR REPLACE FUNCTION get_monthly_usage_summary(
  p_creator_id UUID,
  p_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
  p_month INTEGER DEFAULT EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER
)
RETURNS TABLE (
  total_storage_bytes BIGINT,
  total_videos_uploaded INTEGER,
  total_video_duration_seconds INTEGER,
  total_ai_credits_used INTEGER,
  total_transcription_minutes NUMERIC(10,2),
  total_chat_messages INTEGER,
  peak_active_students INTEGER,
  total_cost NUMERIC(10,4)
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    MAX(um.storage_used_bytes) as total_storage_bytes,
    SUM(um.videos_uploaded)::INTEGER as total_videos_uploaded,
    SUM(um.total_video_duration_seconds)::INTEGER as total_video_duration_seconds,
    SUM(um.ai_credits_used)::INTEGER as total_ai_credits_used,
    SUM(um.transcription_minutes)::NUMERIC(10,2) as total_transcription_minutes,
    SUM(um.chat_messages_sent)::INTEGER as total_chat_messages,
    MAX(um.active_students)::INTEGER as peak_active_students,
    SUM(
      COALESCE((um.metadata->>'transcription_cost')::NUMERIC, 0) +
      COALESCE((um.metadata->>'embedding_cost')::NUMERIC, 0) +
      COALESCE((um.metadata->>'chat_cost')::NUMERIC, 0)
    )::NUMERIC(10,4) as total_cost
  FROM usage_metrics um
  WHERE um.creator_id = p_creator_id
    AND EXTRACT(YEAR FROM um.date) = p_year
    AND EXTRACT(MONTH FROM um.date) = p_month;
END;
$$;

COMMENT ON FUNCTION get_monthly_usage_summary IS 'Get aggregated usage metrics for a creator for a specific month';

-- =====================================================
-- FUNCTION: Check creator tier limits
-- =====================================================
CREATE OR REPLACE FUNCTION check_tier_limits(
  p_creator_id UUID,
  p_tier TEXT
)
RETURNS TABLE (
  within_limits BOOLEAN,
  current_storage_bytes BIGINT,
  current_transcription_minutes NUMERIC(10,2),
  current_ai_credits INTEGER,
  limit_storage_bytes BIGINT,
  limit_transcription_minutes INTEGER,
  limit_ai_credits INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_current_storage BIGINT;
  v_current_transcription NUMERIC(10,2);
  v_current_credits INTEGER;
  v_limit_storage BIGINT;
  v_limit_transcription INTEGER;
  v_limit_credits INTEGER;
  v_within_limits BOOLEAN;
BEGIN
  -- Get current month's usage
  SELECT
    MAX(um.storage_used_bytes),
    SUM(um.transcription_minutes),
    SUM(um.ai_credits_used)
  INTO
    v_current_storage,
    v_current_transcription,
    v_current_credits
  FROM usage_metrics um
  WHERE um.creator_id = p_creator_id
    AND um.date >= DATE_TRUNC('month', CURRENT_DATE)::DATE;

  -- Set limits based on tier
  CASE p_tier
    WHEN 'basic' THEN
      v_limit_storage := 1073741824; -- 1 GB
      v_limit_transcription := 60; -- 1 hour
      v_limit_credits := 10000;
    WHEN 'pro' THEN
      v_limit_storage := 10737418240; -- 10 GB
      v_limit_transcription := 600; -- 10 hours
      v_limit_credits := 100000;
    WHEN 'enterprise' THEN
      v_limit_storage := 107374182400; -- 100 GB
      v_limit_transcription := 6000; -- 100 hours
      v_limit_credits := 1000000;
    ELSE
      -- Default to basic limits
      v_limit_storage := 1073741824;
      v_limit_transcription := 60;
      v_limit_credits := 10000;
  END CASE;

  -- Check if within limits
  v_within_limits := (
    COALESCE(v_current_storage, 0) <= v_limit_storage AND
    COALESCE(v_current_transcription, 0) <= v_limit_transcription AND
    COALESCE(v_current_credits, 0) <= v_limit_credits
  );

  RETURN QUERY
  SELECT
    v_within_limits,
    COALESCE(v_current_storage, 0),
    COALESCE(v_current_transcription, 0),
    COALESCE(v_current_credits, 0),
    v_limit_storage,
    v_limit_transcription,
    v_limit_credits;
END;
$$;

COMMENT ON FUNCTION check_tier_limits IS 'Check if creator is within their subscription tier limits';

-- =====================================================
-- INDEXES for better query performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_usage_metrics_year_month
  ON usage_metrics(creator_id, EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date));
