-- Seed Data for Chronos Development & Testing
-- Run this to populate the database with realistic test data

-- =====================================================
-- 1. CREATE TEST CREATOR
-- =====================================================
INSERT INTO creators (
  id,
  whop_company_id,
  whop_user_id,
  email,
  name,
  subscription_tier,
  settings,
  created_at,
  last_login_at,
  is_active
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'biz_test_creator_123',
  'user_test_creator_456',
  'test.creator@example.com',
  'Test Creator',
  'pro',
  '{
    "notifications_enabled": true,
    "ai_model": "claude-3-5-haiku-20241022",
    "auto_transcribe": true,
    "default_chunk_size": 800
  }'::jsonb,
  NOW() - INTERVAL '30 days',
  NOW() - INTERVAL '1 hour',
  true
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 2. CREATE TEST STUDENT
-- =====================================================
INSERT INTO students (
  id,
  whop_user_id,
  whop_membership_id,
  creator_id,
  email,
  name,
  preferences,
  created_at,
  last_active_at,
  is_active
) VALUES (
  '00000000-0000-0000-0000-000000000002'::uuid,
  'user_test_student_789',
  'mem_test_student_active',
  '00000000-0000-0000-0000-000000000001'::uuid,
  'test.student@example.com',
  'Test Student',
  '{
    "playback_speed": 1.0,
    "auto_advance": false,
    "show_timestamps": true,
    "theme": "dark"
  }'::jsonb,
  NOW() - INTERVAL '15 days',
  NOW() - INTERVAL '30 minutes',
  true
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 3. CREATE TEST COURSES
-- =====================================================
INSERT INTO courses (
  id,
  creator_id,
  title,
  description,
  thumbnail_url,
  is_published,
  display_order,
  metadata,
  created_at,
  published_at
) VALUES
(
  '10000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Trading Fundamentals',
  'Complete introduction to trading strategies and technical analysis',
  'https://placeholder.com/trading-course.jpg',
  true,
  1,
  '{"difficulty": "beginner", "duration_hours": 12}'::jsonb,
  NOW() - INTERVAL '25 days',
  NOW() - INTERVAL '20 days'
),
(
  '10000000-0000-0000-0000-000000000002'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Advanced Options Strategies',
  'Deep dive into options trading and risk management',
  'https://placeholder.com/options-course.jpg',
  true,
  2,
  '{"difficulty": "advanced", "duration_hours": 20}'::jsonb,
  NOW() - INTERVAL '20 days',
  NOW() - INTERVAL '15 days'
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 4. CREATE TEST VIDEOS
-- =====================================================
INSERT INTO videos (
  id,
  creator_id,
  title,
  description,
  url,
  storage_path,
  thumbnail_url,
  duration_seconds,
  transcript,
  transcript_language,
  status,
  processing_completed_at,
  file_size_bytes,
  metadata,
  created_at
) VALUES
(
  '20000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Introduction to Technical Analysis',
  'Learn the basics of chart patterns and indicators',
  'https://storage.supabase.co/videos/intro-technical-analysis.mp4',
  'videos/intro-technical-analysis.mp4',
  'https://placeholder.com/video1-thumb.jpg',
  1800,
  'Welcome to technical analysis. Today we will cover support and resistance levels, trend lines, and basic chart patterns. Support levels are price points where buying pressure overcomes selling pressure. Resistance is the opposite - where selling pressure exceeds buying. Understanding these concepts is fundamental to successful trading.',
  'en',
  'completed',
  NOW() - INTERVAL '20 days',
  45000000,
  '{"quality": "1080p", "encoding": "h264"}'::jsonb,
  NOW() - INTERVAL '25 days'
),
(
  '20000000-0000-0000-0000-000000000002'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Understanding Candlestick Patterns',
  'Master the art of reading candlestick charts',
  'https://storage.supabase.co/videos/candlestick-patterns.mp4',
  'videos/candlestick-patterns.mp4',
  'https://placeholder.com/video2-thumb.jpg',
  2400,
  'Candlestick patterns reveal market psychology. A doji indicates indecision. Hammer patterns show potential reversals. Engulfing patterns signal momentum shifts. Learning to read these patterns gives you an edge in predicting price movements.',
  'en',
  'completed',
  NOW() - INTERVAL '18 days',
  62000000,
  '{"quality": "1080p", "encoding": "h264"}'::jsonb,
  NOW() - INTERVAL '22 days'
),
(
  '20000000-0000-0000-0000-000000000003'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Risk Management Essentials',
  'Protect your capital with proper risk management',
  'https://storage.supabase.co/videos/risk-management.mp4',
  'videos/risk-management.mp4',
  'https://placeholder.com/video3-thumb.jpg',
  2100,
  'Risk management is the most important aspect of trading. Never risk more than 2% of your capital on a single trade. Use stop losses to limit downside. Position sizing should match your risk tolerance. A good trader protects capital first, makes profits second.',
  'en',
  'completed',
  NOW() - INTERVAL '15 days',
  53000000,
  '{"quality": "1080p", "encoding": "h264"}'::jsonb,
  NOW() - INTERVAL '19 days'
),
(
  '20000000-0000-0000-0000-000000000004'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Options Basics: Calls and Puts',
  'Introduction to options trading fundamentals',
  'https://storage.supabase.co/videos/options-basics.mp4',
  'videos/options-basics.mp4',
  'https://placeholder.com/video4-thumb.jpg',
  3000,
  'Options give you the right, but not obligation, to buy or sell at a specific price. Call options profit when prices rise. Put options profit when prices fall. Understanding intrinsic value and time decay is crucial. Greeks like delta and theta help measure risk.',
  'en',
  'completed',
  NOW() - INTERVAL '12 days',
  75000000,
  '{"quality": "1080p", "encoding": "h264"}'::jsonb,
  NOW() - INTERVAL '16 days'
),
(
  '20000000-0000-0000-0000-000000000005'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Building a Trading Plan',
  'Create your personalized trading strategy',
  'https://storage.supabase.co/videos/trading-plan.mp4',
  'videos/trading-plan.mp4',
  'https://placeholder.com/video5-thumb.jpg',
  1950,
  'A trading plan is your roadmap to success. Define your entry and exit criteria. Set profit targets and stop losses. Document your strategy and stick to it. Review your trades regularly. Emotional discipline separates winners from losers in trading.',
  'en',
  'processing',
  NULL,
  51000000,
  '{"quality": "1080p", "encoding": "h264"}'::jsonb,
  NOW() - INTERVAL '10 days'
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 5. CREATE COURSE MODULES
-- =====================================================
INSERT INTO course_modules (
  id,
  course_id,
  title,
  description,
  video_ids,
  display_order,
  metadata,
  created_at
) VALUES
(
  '30000000-0000-0000-0000-000000000001'::uuid,
  '10000000-0000-0000-0000-000000000001'::uuid,
  'Getting Started with Trading',
  'Foundation concepts every trader must know',
  ARRAY[
    '20000000-0000-0000-0000-000000000001'::uuid,
    '20000000-0000-0000-0000-000000000002'::uuid
  ],
  1,
  '{"estimated_hours": 2}'::jsonb,
  NOW() - INTERVAL '20 days'
),
(
  '30000000-0000-0000-0000-000000000002'::uuid,
  '10000000-0000-0000-0000-000000000001'::uuid,
  'Risk and Money Management',
  'Protect your capital and manage positions',
  ARRAY[
    '20000000-0000-0000-0000-000000000003'::uuid,
    '20000000-0000-0000-0000-000000000005'::uuid
  ],
  2,
  '{"estimated_hours": 2}'::jsonb,
  NOW() - INTERVAL '20 days'
),
(
  '30000000-0000-0000-0000-000000000003'::uuid,
  '10000000-0000-0000-0000-000000000002'::uuid,
  'Options Trading Fundamentals',
  'Master the basics of options',
  ARRAY[
    '20000000-0000-0000-0000-000000000004'::uuid
  ],
  1,
  '{"estimated_hours": 3}'::jsonb,
  NOW() - INTERVAL '15 days'
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 6. CREATE VIDEO CHUNKS (For RAG)
-- =====================================================
INSERT INTO video_chunks (
  id,
  video_id,
  chunk_index,
  chunk_text,
  start_time_seconds,
  end_time_seconds,
  word_count,
  metadata
) VALUES
(
  '40000000-0000-0000-0000-000000000001'::uuid,
  '20000000-0000-0000-0000-000000000001'::uuid,
  0,
  'Welcome to technical analysis. Today we will cover support and resistance levels, trend lines, and basic chart patterns.',
  0,
  45,
  20,
  '{"topic": "introduction"}'::jsonb
),
(
  '40000000-0000-0000-0000-000000000002'::uuid,
  '20000000-0000-0000-0000-000000000001'::uuid,
  1,
  'Support levels are price points where buying pressure overcomes selling pressure. Resistance is the opposite - where selling pressure exceeds buying.',
  45,
  90,
  22,
  '{"topic": "support_resistance"}'::jsonb
),
(
  '40000000-0000-0000-0000-000000000003'::uuid,
  '20000000-0000-0000-0000-000000000003'::uuid,
  0,
  'Risk management is the most important aspect of trading. Never risk more than 2% of your capital on a single trade.',
  0,
  35,
  20,
  '{"topic": "risk_management"}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- Note: Embeddings would be generated by OpenAI API in production
-- For testing, you can add mock embeddings or test without them

-- =====================================================
-- 7. CREATE CHAT SESSIONS
-- =====================================================
INSERT INTO chat_sessions (
  id,
  student_id,
  creator_id,
  title,
  context_video_ids,
  metadata,
  created_at,
  last_message_at
) VALUES
(
  '50000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Questions about Risk Management',
  ARRAY['20000000-0000-0000-0000-000000000003'::uuid],
  '{"source": "video_chat"}'::jsonb,
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '5 days'
),
(
  '50000000-0000-0000-0000-000000000002'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Understanding Options Greeks',
  ARRAY['20000000-0000-0000-0000-000000000004'::uuid],
  '{"source": "video_chat"}'::jsonb,
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '3 days'
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 8. CREATE CHAT MESSAGES (With Analytics Data)
-- =====================================================
INSERT INTO chat_messages (
  id,
  session_id,
  role,
  content,
  video_references,
  token_count,
  model,
  input_tokens,
  output_tokens,
  cost_usd,
  response_time_ms,
  has_video_reference,
  metadata,
  created_at
) VALUES
-- Session 1: Risk Management Q&A
(
  '60000000-0000-0000-0000-000000000001'::uuid,
  '50000000-0000-0000-0000-000000000001'::uuid,
  'user',
  'What percentage of my portfolio should I risk on each trade?',
  '[]'::jsonb,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  '{}'::jsonb,
  NOW() - INTERVAL '5 days'
),
(
  '60000000-0000-0000-0000-000000000002'::uuid,
  '50000000-0000-0000-0000-000000000001'::uuid,
  'assistant',
  'Based on the Risk Management Essentials video, you should never risk more than 2% of your capital on a single trade. This is a fundamental rule that protects your account from catastrophic losses.',
  '[{"video_id": "20000000-0000-0000-0000-000000000003", "timestamp": 15, "title": "Risk Management Essentials"}]'::jsonb,
  156,
  'claude-3-5-haiku-20241022',
  89,
  67,
  0.000234,
  1250,
  true,
  '{"confidence": 0.95}'::jsonb,
  NOW() - INTERVAL '5 days' + INTERVAL '2 seconds'
),
(
  '60000000-0000-0000-0000-000000000003'::uuid,
  '50000000-0000-0000-0000-000000000001'::uuid,
  'user',
  'How do I calculate position size based on that?',
  '[]'::jsonb,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  '{}'::jsonb,
  NOW() - INTERVAL '5 days' + INTERVAL '30 seconds'
),
(
  '60000000-0000-0000-0000-000000000004'::uuid,
  '50000000-0000-0000-0000-000000000001'::uuid,
  'assistant',
  'To calculate position size: (Account Size × Risk %) ÷ (Entry Price - Stop Loss Price) = Number of Shares. For example, with a $10,000 account and 2% risk ($200), if your stop is $2 away, you can buy 100 shares.',
  '[{"video_id": "20000000-0000-0000-0000-000000000003", "timestamp": 45, "title": "Risk Management Essentials"}]'::jsonb,
  178,
  'claude-3-5-haiku-20241022',
  95,
  83,
  0.000267,
  1450,
  true,
  '{"confidence": 0.92}'::jsonb,
  NOW() - INTERVAL '5 days' + INTERVAL '35 seconds'
),
-- Session 2: Options Greeks
(
  '60000000-0000-0000-0000-000000000005'::uuid,
  '50000000-0000-0000-0000-000000000002'::uuid,
  'user',
  'Can you explain what delta means in options trading?',
  '[]'::jsonb,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  '{}'::jsonb,
  NOW() - INTERVAL '3 days'
),
(
  '60000000-0000-0000-0000-000000000006'::uuid,
  '50000000-0000-0000-0000-000000000002'::uuid,
  'assistant',
  'Delta measures how much an option''s price changes for every $1 move in the underlying stock. A delta of 0.50 means the option price moves $0.50 for every $1 the stock moves. Call options have positive delta (0 to 1), puts have negative delta (0 to -1).',
  '[{"video_id": "20000000-0000-0000-0000-000000000004", "timestamp": 180, "title": "Options Basics: Calls and Puts"}]'::jsonb,
  189,
  'claude-3-5-haiku-20241022',
  102,
  87,
  0.000289,
  1580,
  true,
  '{"confidence": 0.97}'::jsonb,
  NOW() - INTERVAL '3 days' + INTERVAL '3 seconds'
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 9. CREATE VIDEO ANALYTICS
-- =====================================================
INSERT INTO video_analytics (
  id,
  video_id,
  date,
  views,
  unique_viewers,
  total_watch_time_seconds,
  average_watch_time_seconds,
  completion_rate,
  ai_interactions,
  metadata,
  created_at
) VALUES
-- Video 1: Technical Analysis - Last 7 days
(
  gen_random_uuid(),
  '20000000-0000-0000-0000-000000000001'::uuid,
  CURRENT_DATE - INTERVAL '6 days',
  45,
  38,
  65000,
  1444.44,
  72.50,
  12,
  '{"peak_hour": 14}'::jsonb,
  NOW()
),
(
  gen_random_uuid(),
  '20000000-0000-0000-0000-000000000001'::uuid,
  CURRENT_DATE - INTERVAL '5 days',
  52,
  43,
  71000,
  1365.38,
  68.20,
  15,
  '{"peak_hour": 15}'::jsonb,
  NOW()
),
(
  gen_random_uuid(),
  '20000000-0000-0000-0000-000000000001'::uuid,
  CURRENT_DATE - INTERVAL '4 days',
  38,
  32,
  58000,
  1526.32,
  75.80,
  10,
  '{"peak_hour": 13}'::jsonb,
  NOW()
),
(
  gen_random_uuid(),
  '20000000-0000-0000-0000-000000000001'::uuid,
  CURRENT_DATE - INTERVAL '3 days',
  61,
  51,
  82000,
  1344.26,
  65.90,
  18,
  '{"peak_hour": 16}'::jsonb,
  NOW()
),
-- Video 3: Risk Management - Last 7 days
(
  gen_random_uuid(),
  '20000000-0000-0000-0000-000000000003'::uuid,
  CURRENT_DATE - INTERVAL '6 days',
  78,
  65,
  95000,
  1217.95,
  71.30,
  25,
  '{"peak_hour": 14}'::jsonb,
  NOW()
),
(
  gen_random_uuid(),
  '20000000-0000-0000-0000-000000000003'::uuid,
  CURRENT_DATE - INTERVAL '5 days',
  82,
  68,
  102000,
  1243.90,
  73.50,
  28,
  '{"peak_hour": 15}'::jsonb,
  NOW()
),
(
  gen_random_uuid(),
  '20000000-0000-0000-0000-000000000003'::uuid,
  CURRENT_DATE - INTERVAL '4 days',
  91,
  75,
  112000,
  1230.77,
  74.20,
  32,
  '{"peak_hour": 14}'::jsonb,
  NOW()
),
-- Video 4: Options - Recent data
(
  gen_random_uuid(),
  '20000000-0000-0000-0000-000000000004'::uuid,
  CURRENT_DATE - INTERVAL '2 days',
  42,
  35,
  68000,
  1619.05,
  82.10,
  14,
  '{"peak_hour": 17}'::jsonb,
  NOW()
)
ON CONFLICT (video_id, date) DO NOTHING;

-- =====================================================
-- 10. CREATE USAGE METRICS
-- =====================================================
INSERT INTO usage_metrics (
  id,
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
  created_at
) VALUES
(
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001'::uuid,
  CURRENT_DATE - INTERVAL '6 days',
  245000000,
  0,
  9300,
  45,
  0,
  12,
  5,
  '{"api_calls": 45}'::jsonb,
  NOW()
),
(
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001'::uuid,
  CURRENT_DATE - INTERVAL '5 days',
  245000000,
  0,
  9300,
  52,
  0,
  18,
  7,
  '{"api_calls": 52}'::jsonb,
  NOW()
),
(
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001'::uuid,
  CURRENT_DATE - INTERVAL '4 days',
  245000000,
  0,
  9300,
  38,
  0,
  15,
  6,
  '{"api_calls": 38}'::jsonb,
  NOW()
),
(
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001'::uuid,
  CURRENT_DATE - INTERVAL '3 days',
  296000000,
  1,
  11250,
  67,
  32.5,
  22,
  8,
  '{"api_calls": 67}'::jsonb,
  NOW()
)
ON CONFLICT (creator_id, date) DO NOTHING;

-- =====================================================
-- 11. CREATE STUDENT COURSE ENROLLMENTS (NEW - CRITICAL)
-- =====================================================
-- Enroll test student in both courses
INSERT INTO student_courses (
  id,
  student_id,
  course_id,
  progress,
  completed,
  last_accessed,
  created_at
) VALUES
(
  '70000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid,
  '10000000-0000-0000-0000-000000000001'::uuid,
  45,
  false,
  NOW() - INTERVAL '2 hours',
  NOW() - INTERVAL '15 days'
),
(
  '70000000-0000-0000-0000-000000000002'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid,
  '10000000-0000-0000-0000-000000000002'::uuid,
  15,
  false,
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '10 days'
)
ON CONFLICT (student_id, course_id) DO UPDATE SET
  progress = EXCLUDED.progress,
  last_accessed = EXCLUDED.last_accessed;

-- =====================================================
-- 12. CREATE VIDEO WATCH SESSIONS (NEW - CRITICAL)
-- =====================================================
-- Create watch sessions for student progress tracking
INSERT INTO video_watch_sessions (
  id,
  student_id,
  video_id,
  started_at,
  ended_at,
  total_watch_time,
  furthest_point_reached,
  completed
) VALUES
-- Video 1: Partially watched
(
  '80000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid,
  '20000000-0000-0000-0000-000000000001'::uuid,
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '2 days' + INTERVAL '15 minutes',
  900,
  950,
  false
),
-- Video 2: Completed
(
  '80000000-0000-0000-0000-000000000002'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid,
  '20000000-0000-0000-0000-000000000002'::uuid,
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day' + INTERVAL '40 minutes',
  2400,
  2400,
  true
),
-- Video 3: Partially watched
(
  '80000000-0000-0000-0000-000000000003'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid,
  '20000000-0000-0000-0000-000000000003'::uuid,
  NOW() - INTERVAL '4 hours',
  NOW() - INTERVAL '4 hours' + INTERVAL '12 minutes',
  720,
  850,
  false
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================
-- Run this to verify seed data was inserted correctly
SELECT
  'creators' as table_name, COUNT(*) as count FROM creators
UNION ALL
SELECT 'students', COUNT(*) FROM students
UNION ALL
SELECT 'courses', COUNT(*) FROM courses
UNION ALL
SELECT 'videos', COUNT(*) FROM videos
UNION ALL
SELECT 'course_modules', COUNT(*) FROM course_modules
UNION ALL
SELECT 'video_chunks', COUNT(*) FROM video_chunks
UNION ALL
SELECT 'chat_sessions', COUNT(*) FROM chat_sessions
UNION ALL
SELECT 'chat_messages', COUNT(*) FROM chat_messages
UNION ALL
SELECT 'video_analytics', COUNT(*) FROM video_analytics
UNION ALL
SELECT 'usage_metrics', COUNT(*) FROM usage_metrics
UNION ALL
SELECT 'student_courses', COUNT(*) FROM student_courses
UNION ALL
SELECT 'video_watch_sessions', COUNT(*) FROM video_watch_sessions;
