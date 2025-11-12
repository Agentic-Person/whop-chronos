# Video Database Design

**Last Updated:** November 12, 2025 (Agent 1 - Video Implementation)
**Status:** Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Multi-Source Video Support](#multi-source-video-support)
3. [Video Storage Strategy](#video-storage-strategy)
4. [Analytics Architecture](#analytics-architecture)
5. [Watch Session Tracking](#watch-session-tracking)
6. [Course Integration](#course-integration)
7. [Performance Considerations](#performance-considerations)
8. [Cost Optimization](#cost-optimization)

---

## Overview

Chronos supports video content from multiple sources with a unified database schema that handles:
- **YouTube embeds** (free transcripts, no storage)
- **Mux videos** (professional hosting, private content)
- **Loom embeds** (quick screencasts, free transcripts)
- **Direct uploads** (maximum flexibility, Supabase Storage)

The design prioritizes:
- **Cost efficiency** - Free transcripts first, Whisper as fallback
- **Flexibility** - Support any video platform
- **Analytics** - Granular event tracking and watch sessions
- **Performance** - Optimized indexes for common queries

---

## Multi-Source Video Support

### Database Schema

The `videos` table uses a **discriminated union pattern** with `source_type` as the discriminator:

```sql
CREATE TABLE videos (
  -- Common fields
  id UUID PRIMARY KEY,
  creator_id UUID REFERENCES creators(id),
  title TEXT NOT NULL,
  description TEXT,
  url TEXT,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  transcript TEXT,
  status TEXT CHECK (status IN ('pending', 'uploading', 'transcribing', ...)),

  -- Source discriminator
  source_type TEXT CHECK (source_type IN ('youtube', 'mux', 'loom', 'upload')),

  -- YouTube-specific
  youtube_video_id TEXT,
  youtube_channel_id TEXT,

  -- Mux-specific
  mux_asset_id TEXT,
  mux_playback_id TEXT,
  whop_lesson_id TEXT, -- For syncing from Whop

  -- Generic embed support
  embed_type TEXT CHECK (embed_type IN ('youtube', 'loom', 'vimeo', 'wistia')),
  embed_id TEXT,

  -- Upload-specific
  storage_path TEXT,
  file_size_bytes BIGINT,

  -- Validation: ensure appropriate fields for source_type
  CONSTRAINT videos_source_validation CHECK (
    (source_type = 'youtube' AND youtube_video_id IS NOT NULL) OR
    (source_type = 'mux' AND mux_playback_id IS NOT NULL) OR
    (source_type = 'loom' AND embed_id IS NOT NULL) OR
    (source_type = 'upload' AND storage_path IS NOT NULL)
  )
);
```

### Source Type Mapping

| Source Type | Required Fields | Optional Fields | Storage Cost |
|-------------|-----------------|-----------------|--------------|
| `youtube` | `youtube_video_id` | `youtube_channel_id` | $0 |
| `mux` | `mux_playback_id` | `mux_asset_id`, `whop_lesson_id` | $0 (hosted by creator's Whop) |
| `loom` | `embed_id` | `embed_type='loom'` | $0 |
| `upload` | `storage_path` | `file_size_bytes` | $15/TB/month (Supabase) |

### Indexes for Multi-Source Queries

```sql
-- Source type filtering
CREATE INDEX idx_videos_source_type ON videos(source_type);

-- YouTube lookups
CREATE INDEX idx_videos_youtube_video_id ON videos(youtube_video_id)
  WHERE youtube_video_id IS NOT NULL;

-- Mux lookups
CREATE INDEX idx_videos_mux_playback_id ON videos(mux_playback_id)
  WHERE mux_playback_id IS NOT NULL;

-- Whop lesson sync
CREATE INDEX idx_videos_whop_lesson_id ON videos(whop_lesson_id)
  WHERE whop_lesson_id IS NOT NULL;

-- Generic embed lookups
CREATE INDEX idx_videos_embed_type ON videos(embed_type)
  WHERE embed_type IS NOT NULL;
```

---

## Video Storage Strategy

### Transcript-Only Approach

**Key Insight:** We only need transcripts for RAG chat, not video files.

**Before (Old Approach):**
- Download full video file
- Store in Supabase Storage
- Extract audio → transcribe
- **Cost:** $400/month for 15TB
- **Processing Time:** 5-10 minutes per video

**After (Current Approach):**
- Extract transcript directly from source
- Store only text (KB not GB)
- No video file storage
- **Cost:** $15/month for transcripts
- **Processing Time:** 2-6 seconds per video

### Source-Specific Transcript Extraction

| Source | Method | Cost | Speed | Library |
|--------|--------|------|-------|---------|
| YouTube | YouTube captions API | **FREE** | 2-3 seconds | `youtubei.js` |
| Loom | Loom transcript API | **FREE** | 2-3 seconds | Loom API |
| Mux | Auto-captions (if enabled) | **FREE** | 1-2 seconds | Mux API |
| Mux | Whisper fallback | $0.006/min | 30-60 seconds | OpenAI Whisper |
| Upload | Whisper transcription | $0.006/min | 30-60 seconds | OpenAI Whisper |

**Decision Tree:**
```
if source_type == 'youtube':
  transcript = extract_youtube_captions() # FREE
elif source_type == 'loom':
  transcript = fetch_loom_transcript() # FREE
elif source_type == 'mux':
  if mux_has_auto_captions():
    transcript = fetch_mux_captions() # FREE
  else:
    transcript = whisper_transcribe() # $0.006/min
elif source_type == 'upload':
  transcript = whisper_transcribe() # $0.006/min
```

### File Storage (Uploads Only)

For direct uploads, videos are stored in Supabase Storage:

**Bucket:** `chronos-videos`
**Path Structure:** `{creator_id}/{video_id}/{filename}`
**RLS Policy:**
```sql
-- Creators can upload to their own folder
CREATE POLICY upload_own_videos ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'chronos-videos' AND (storage.foldername(name))[1] = auth.uid());

-- Anyone with video access can download
CREATE POLICY download_videos ON storage.objects
  FOR SELECT
  USING (bucket_id = 'chronos-videos');
```

---

## Analytics Architecture

### Two-Tier Analytics System

Chronos uses a **two-tier analytics system**:

1. **Granular Events** (`video_analytics_events`) - Raw event stream
2. **Aggregated Metrics** (`video_analytics`) - Daily rollups

#### Tier 1: Granular Events (`video_analytics_events`)

**Purpose:** Track every video interaction in real-time

**Event Types:**
- `video_imported` - Video added to system
- `video_transcribed` - Transcript extracted
- `video_embedded` - Embeddings generated
- `video_added_to_course` - Added to module
- `video_started` - Student begins watching
- `video_progress` - 10%, 25%, 50%, 75%, 90% milestones
- `video_completed` - 90%+ watched
- `video_rewatched` - Rewatch of completed video

**Schema:**
```sql
CREATE TABLE video_analytics_events (
  id UUID PRIMARY KEY,
  event_type TEXT NOT NULL,
  video_id UUID REFERENCES videos(id),
  creator_id UUID REFERENCES creators(id),
  student_id UUID REFERENCES students(id), -- NULL for creator events
  course_id UUID REFERENCES courses(id),   -- NULL if not in course context
  module_id UUID REFERENCES course_modules(id),
  metadata JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**
```sql
CREATE INDEX idx_video_analytics_video_id ON video_analytics_events(video_id);
CREATE INDEX idx_video_analytics_creator_id ON video_analytics_events(creator_id);
CREATE INDEX idx_video_analytics_student_id ON video_analytics_events(student_id)
  WHERE student_id IS NOT NULL;
CREATE INDEX idx_video_analytics_event_type ON video_analytics_events(event_type);
CREATE INDEX idx_video_analytics_timestamp ON video_analytics_events(timestamp DESC);

-- Composite indexes for common queries
CREATE INDEX idx_video_analytics_course_events
  ON video_analytics_events(course_id, event_type, timestamp DESC)
  WHERE course_id IS NOT NULL;

CREATE INDEX idx_video_analytics_student_events
  ON video_analytics_events(student_id, video_id, event_type, timestamp DESC)
  WHERE student_id IS NOT NULL;
```

**Metadata Examples:**
```json
// video_imported
{
  "source_type": "youtube",
  "duration_seconds": 3600,
  "file_size_bytes": 0
}

// video_transcribed
{
  "transcript_method": "youtube_captions",
  "cost": 0,
  "word_count": 5400,
  "language": "en"
}

// video_progress
{
  "percent_complete": 50,
  "watch_time_seconds": 1800,
  "session_id": "uuid",
  "device": "mobile"
}

// video_completed
{
  "percent_complete": 95,
  "watch_time_seconds": 3420,
  "session_id": "uuid",
  "completion_time": "2025-01-12T14:30:00Z"
}
```

#### Tier 2: Aggregated Metrics (`video_analytics`)

**Purpose:** Fast dashboard queries with pre-computed metrics

**Schema:**
```sql
CREATE TABLE video_analytics (
  id UUID PRIMARY KEY,
  video_id UUID REFERENCES videos(id),
  date DATE NOT NULL,
  views INTEGER DEFAULT 0,
  unique_viewers INTEGER DEFAULT 0,
  total_watch_time_seconds INTEGER DEFAULT 0,
  average_watch_time_seconds INTEGER,
  completion_rate DECIMAL(5,2),
  ai_interactions INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Aggregation Logic:**
```sql
-- Example: Daily aggregation job (run nightly)
INSERT INTO video_analytics (video_id, date, views, unique_viewers, ...)
SELECT
  video_id,
  DATE(timestamp) as date,
  COUNT(*) as views,
  COUNT(DISTINCT student_id) as unique_viewers,
  SUM((metadata->>'watch_time_seconds')::integer) as total_watch_time_seconds,
  AVG((metadata->>'watch_time_seconds')::integer) as average_watch_time_seconds,
  (COUNT(*) FILTER (WHERE event_type = 'video_completed')::decimal /
   NULLIF(COUNT(*) FILTER (WHERE event_type = 'video_started'), 0) * 100) as completion_rate
FROM video_analytics_events
WHERE event_type IN ('video_started', 'video_completed', 'video_progress')
  AND timestamp >= CURRENT_DATE - INTERVAL '1 day'
  AND timestamp < CURRENT_DATE
GROUP BY video_id, DATE(timestamp)
ON CONFLICT (video_id, date)
DO UPDATE SET
  views = EXCLUDED.views,
  unique_viewers = EXCLUDED.unique_viewers,
  ...;
```

### Helper Function: `track_video_event`

**Purpose:** Simplify event tracking from API routes

```sql
CREATE FUNCTION track_video_event(
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
    event_type, video_id, creator_id, student_id,
    course_id, module_id, metadata, timestamp
  ) VALUES (
    p_event_type, p_video_id, p_creator_id, p_student_id,
    p_course_id, p_module_id, p_metadata, p_timestamp
  )
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Usage:**
```typescript
// Track video start from API route
await supabase.rpc('track_video_event', {
  p_event_type: 'video_started',
  p_video_id: videoId,
  p_creator_id: creatorId,
  p_student_id: studentId,
  p_course_id: courseId,
  p_metadata: {
    device: 'desktop',
    browser: 'Chrome',
    referrer: 'course_page'
  }
});
```

---

## Watch Session Tracking

### Real-Time Watch Sessions (`video_watch_sessions`)

**Purpose:** Track individual viewing sessions with live progress updates

**Schema:**
```sql
CREATE TABLE video_watch_sessions (
  id UUID PRIMARY KEY,
  video_id UUID REFERENCES videos(id),
  student_id UUID REFERENCES students(id),
  session_start TIMESTAMPTZ DEFAULT NOW(),
  session_end TIMESTAMPTZ,           -- NULL if still watching
  watch_time_seconds INTEGER DEFAULT 0,
  percent_complete INTEGER DEFAULT 0 CHECK (percent_complete BETWEEN 0 AND 100),
  completed BOOLEAN DEFAULT false,    -- Auto-set to true when percent_complete >= 90
  device_type TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet')),
  referrer_type TEXT CHECK (referrer_type IN ('course_page', 'direct_link', 'search', 'chat_reference')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**
```sql
CREATE INDEX idx_video_watch_sessions_video_id ON video_watch_sessions(video_id);
CREATE INDEX idx_video_watch_sessions_student_id ON video_watch_sessions(student_id);
CREATE INDEX idx_video_watch_sessions_completed ON video_watch_sessions(completed);
CREATE INDEX idx_video_watch_sessions_student_video
  ON video_watch_sessions(student_id, video_id, session_start DESC);
CREATE INDEX idx_video_watch_sessions_active
  ON video_watch_sessions(session_end)
  WHERE session_end IS NULL;
```

**Auto-Completion Trigger:**
```sql
CREATE FUNCTION auto_complete_video_watch_session()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.percent_complete >= 90 THEN
    NEW.completed = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER video_watch_sessions_auto_complete_trigger
  BEFORE INSERT OR UPDATE ON video_watch_sessions
  FOR EACH ROW
  EXECUTE FUNCTION auto_complete_video_watch_session();
```

### Helper Functions

#### `get_student_total_watch_time`
```sql
CREATE FUNCTION get_student_total_watch_time(
  p_student_id UUID,
  p_video_id UUID
)
RETURNS INTEGER AS $$
  SELECT COALESCE(SUM(watch_time_seconds), 0)
  FROM video_watch_sessions
  WHERE student_id = p_student_id AND video_id = p_video_id;
$$ LANGUAGE sql STABLE;
```

#### `get_student_highest_completion`
```sql
CREATE FUNCTION get_student_highest_completion(
  p_student_id UUID,
  p_video_id UUID
)
RETURNS INTEGER AS $$
  SELECT COALESCE(MAX(percent_complete), 0)
  FROM video_watch_sessions
  WHERE student_id = p_student_id AND video_id = p_video_id;
$$ LANGUAGE sql STABLE;
```

#### `has_student_completed_video`
```sql
CREATE FUNCTION has_student_completed_video(
  p_student_id UUID,
  p_video_id UUID
)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM video_watch_sessions
    WHERE student_id = p_student_id
      AND video_id = p_video_id
      AND completed = true
  );
$$ LANGUAGE sql STABLE;
```

### Watch Session Lifecycle

**1. Session Start (Player Mount)**
```typescript
const session = await supabase
  .from('video_watch_sessions')
  .insert({
    video_id: videoId,
    student_id: studentId,
    device_type: detectDevice(),
    referrer_type: getReferrer(),
    metadata: { browser: navigator.userAgent }
  })
  .select()
  .single();
```

**2. Progress Updates (Every 10 seconds)**
```typescript
await supabase
  .from('video_watch_sessions')
  .update({
    watch_time_seconds: currentWatchTime,
    percent_complete: Math.floor((currentTime / duration) * 100),
    updated_at: new Date().toISOString()
  })
  .eq('id', sessionId);
```

**3. Session End (Player Unmount)**
```typescript
await supabase
  .from('video_watch_sessions')
  .update({
    session_end: new Date().toISOString(),
    watch_time_seconds: finalWatchTime,
    percent_complete: finalPercent
  })
  .eq('id', sessionId);
```

---

## Course Integration

### Many-to-Many with `module_lessons`

**Problem:** `course_modules.video_ids` array was too rigid
**Solution:** New `module_lessons` junction table

**Schema:**
```sql
CREATE TABLE module_lessons (
  id UUID PRIMARY KEY,
  module_id UUID REFERENCES course_modules(id) ON DELETE CASCADE,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  lesson_order INTEGER NOT NULL CHECK (lesson_order > 0),
  title TEXT NOT NULL,
  description TEXT,
  is_required BOOLEAN DEFAULT true,
  estimated_duration_minutes INTEGER CHECK (estimated_duration_minutes > 0),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (module_id, video_id)  -- Prevent duplicates
);
```

**Benefits:**
- Reuse videos across multiple modules/courses
- Custom lesson titles different from video title
- Track lesson-specific metadata
- Enforce ordering within modules

**Query Examples:**
```sql
-- Get all lessons in a module (ordered)
SELECT ml.*, v.*
FROM module_lessons ml
JOIN videos v ON v.id = ml.video_id
WHERE ml.module_id = $1
ORDER BY ml.lesson_order ASC;

-- Find all modules using a video
SELECT m.*, c.title as course_title
FROM module_lessons ml
JOIN course_modules m ON m.id = ml.module_id
JOIN courses c ON c.id = m.course_id
WHERE ml.video_id = $1;

-- Count videos by source type in a course
SELECT v.source_type, COUNT(*) as count
FROM module_lessons ml
JOIN course_modules m ON m.id = ml.module_id
JOIN videos v ON v.id = ml.video_id
WHERE m.course_id = $1
GROUP BY v.source_type;
```

---

## Performance Considerations

### Index Strategy

**Principle:** Index foreign keys + common filters + sort columns

**High-Traffic Queries:**
1. "Get all videos for creator" → `idx_videos_creator_id`
2. "Get video by YouTube ID" → `idx_videos_youtube_video_id`
3. "Get student's watch history" → `idx_video_watch_sessions_student_video`
4. "Get video analytics events" → `idx_video_analytics_timestamp`

**Composite Indexes:**
```sql
-- Student engagement dashboard
CREATE INDEX idx_video_analytics_student_events
  ON video_analytics_events(student_id, video_id, event_type, timestamp DESC);

-- Course analytics
CREATE INDEX idx_video_analytics_course_events
  ON video_analytics_events(course_id, event_type, timestamp DESC);

-- Module lessons ordering
CREATE INDEX idx_module_lessons_module_order
  ON module_lessons(module_id, lesson_order);
```

### Query Optimization

**Use EXPLAIN ANALYZE:**
```sql
EXPLAIN ANALYZE
SELECT v.*, COUNT(e.id) as event_count
FROM videos v
LEFT JOIN video_analytics_events e ON e.video_id = v.id
WHERE v.creator_id = $1
  AND v.is_deleted = false
GROUP BY v.id
ORDER BY v.created_at DESC
LIMIT 50;
```

**Expected Plan:**
- Index Scan on `idx_videos_creator_id`
- Filter on `is_deleted` (partial index)
- Sort on `created_at` (indexed)
- Limit pushdown to reduce rows

---

## Cost Optimization

### Transcript Cost Breakdown

**Target:** 90%+ free transcripts

| Month | Videos | YouTube | Mux/Loom | Upload | Whisper Cost |
|-------|--------|---------|----------|--------|--------------|
| Jan | 1000 | 800 (80%) | 150 (15%) | 50 (5%) | $18 |
| Feb | 1500 | 1200 (80%) | 225 (15%) | 75 (5%) | $27 |
| Mar | 2000 | 1600 (80%) | 300 (15%) | 100 (5%) | $36 |

**Calculation:**
- Average video length: 60 minutes
- Whisper cost: $0.006/minute
- 5% of videos need Whisper = 50 videos/month
- 50 videos × 60 min × $0.006 = $18/month

**vs. Old Approach:**
- 1000 videos × 2GB average = 2TB storage
- Supabase: $200/TB = $400/month
- **Savings: $382/month (95% reduction)**

### Storage Cost Optimization

**Tiers:**
1. **Free Tier (0-1GB):** $0
2. **Standard (1-100GB):** $0.021/GB/month
3. **Enterprise (100GB+):** $0.015/GB/month

**Strategy:**
- Store thumbnails only (not videos)
- Encourage YouTube/Mux over uploads
- Set upload size limits per tier:
  - Basic: 2GB max per video
  - Pro: 5GB max per video
  - Enterprise: 10GB max per video

---

## Next Steps for Agent 2

Agent 2 will build API routes using these database tables:

### Required API Endpoints

**Courses:**
- `POST /api/courses` - Create course
- `PUT /api/courses/[id]` - Update course
- `DELETE /api/courses/[id]` - Delete course
- `POST /api/courses/[id]/modules` - Add module
- `POST /api/modules/[id]/lessons` - Add lesson

**Analytics:**
- `POST /api/analytics/video-event` - Track event
- `GET /api/analytics/videos/[id]` - Video analytics
- `GET /api/analytics/creator/[id]/dashboard` - Dashboard data

**Watch Sessions:**
- `POST /api/watch/session/start` - Start session
- `PUT /api/watch/session/[id]/progress` - Update progress
- `PUT /api/watch/session/[id]/end` - End session

### Integration Points

Agent 2 should use:
- `track_video_event()` function for analytics
- `module_lessons` table for course builder persistence
- `video_watch_sessions` for player progress tracking
- Proper error handling for foreign key constraints

---

**Document Maintained By:** Claude Code Agent 1
**Related Documents:**
- [Database Schema (Full)](../../database/schema.md)
- [Implementation Status](./implementation-status.md)
- [Agent 1 Report](../../agent-reports/video-implementation/agent-1-database-report.md)
