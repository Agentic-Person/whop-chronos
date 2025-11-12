# Database Migrations

**Last Updated:** November 12, 2025 (Agent 1 - Video Implementation)
**Migration Tool:** Supabase CLI
**Database:** PostgreSQL 15+ with pgvector

---

## Table of Contents

1. [Overview](#overview)
2. [Migration Files](#migration-files)
3. [How to Apply Migrations](#how-to-apply-migrations)
4. [Rollback Strategy](#rollback-strategy)
5. [Naming Convention](#naming-convention)
6. [Testing Migrations](#testing-migrations)

---

## Overview

Chronos uses **Supabase migrations** to manage database schema changes. All migrations are stored in `supabase/migrations/` and follow a strict naming convention for chronological ordering.

**Total Migrations:** 12 (as of 2025-01-12)

---

## Migration Files

### Core Setup (Initial Schema)

#### `20250101000001_enable_pgvector.sql`
**Date:** 2025-01-01
**Purpose:** Enable pgvector extension for vector embeddings

**Changes:**
- Enables `pgvector` extension
- Required for video transcript embeddings

**Dependencies:** None

---

#### `20250101000002_create_core_tables.sql`
**Date:** 2025-01-01
**Purpose:** Create foundational tables for Chronos

**Tables Created:**
- `creators` - Creator accounts
- `students` - Student memberships
- `videos` - Video content
- `video_chunks` - Transcript chunks with embeddings
- `courses` - Course structure
- `course_modules` - Course modules
- `chat_sessions` - AI chat sessions
- `chat_messages` - Chat messages
- `video_analytics` - Aggregated analytics
- `usage_metrics` - Creator usage tracking

**Dependencies:**
- `20250101000001_enable_pgvector.sql` (for `vector` type)

---

#### `20250101000003_create_vector_index.sql`
**Date:** 2025-01-01
**Purpose:** Create IVFFlat index for vector similarity search

**Changes:**
- Creates `search_video_chunks()` function
- Adds IVFFlat index on `video_chunks.embedding`
- Enables fast semantic search

**Dependencies:**
- `20250101000002_create_core_tables.sql` (requires `video_chunks` table)

---

#### `20250101000004_row_level_security.sql`
**Date:** 2025-01-01
**Purpose:** Add Row Level Security policies to all tables

**Changes:**
- Enables RLS on all tables
- Adds SELECT/INSERT/UPDATE/DELETE policies
- Ensures data isolation between creators

**Dependencies:**
- `20250101000002_create_core_tables.sql` (requires tables)

---

#### `20250101000005_add_usage_tracking_functions.sql`
**Date:** 2025-01-01
**Purpose:** Add utility functions for usage tracking

**Functions Added:**
- Analytics aggregation functions
- Usage metric calculations

**Dependencies:**
- `20250101000002_create_core_tables.sql` (requires `usage_metrics` table)

---

### Feature Enhancements

#### `20250110000001_add_chat_analytics_columns.sql`
**Date:** 2025-01-10
**Purpose:** Add analytics columns to chat tables

**Changes:**
- Adds `token_count` to `chat_messages`
- Adds `model` to `chat_messages`
- Enhances chat cost tracking

**Dependencies:**
- `20250101000002_create_core_tables.sql` (requires `chat_messages` table)

---

#### `20250110000002_create_report_schedules.sql`
**Date:** 2025-01-10
**Purpose:** Add scheduled analytics report configuration

**Tables Created:**
- `report_schedules` - Configure automated reports

**Dependencies:**
- `20250101000002_create_core_tables.sql` (requires `creators` table)

---

### YouTube Embedding Support

#### `20250111000001_add_youtube_embedding_support.sql`
**Date:** 2025-01-11
**Purpose:** Add YouTube embed support (transcript extraction without downloads)

**Changes:**
- Adds `source_type` column to `videos` ('youtube' | 'upload')
- Adds `youtube_video_id` column
- Adds `youtube_channel_id` column
- Adds indexes for YouTube lookups
- Adds constraint: YouTube videos must have `youtube_video_id`, uploads must have `storage_path`

**Dependencies:**
- `20250101000002_create_core_tables.sql` (modifies `videos` table)

**Related Features:**
- YouTube transcript extraction via `lib/video/youtube-processor.ts`
- No video file storage required (transcript only)
- Cost savings: $400/month → $15/month

---

### Video Implementation (Phase 1)

#### `20250112000001_create_module_lessons.sql`
**Date:** 2025-01-12
**Purpose:** Create many-to-many relationship between modules and videos

**Tables Created:**
- `module_lessons` - Junction table with ordering and metadata

**Columns:**
- `id`, `module_id`, `video_id`, `lesson_order`
- `title`, `description`, `is_required`
- `estimated_duration_minutes`, `metadata`
- `created_at`, `updated_at`

**Indexes:**
- `idx_module_lessons_module_id` - Module's lessons
- `idx_module_lessons_video_id` - Video usage tracking
- `idx_module_lessons_module_order` - Ordered list
- `idx_module_lessons_unique_video_per_module` - Prevent duplicates

**Constraints:**
- FOREIGN KEY to `course_modules.id` (ON DELETE CASCADE)
- FOREIGN KEY to `videos.id` (ON DELETE CASCADE)
- UNIQUE (module_id, video_id)
- CHECK (lesson_order > 0)

**RLS Policies:**
- Creators can CRUD lessons in their modules
- Students can SELECT lessons in published courses

**Triggers:**
- Auto-update `updated_at` timestamp

**Dependencies:**
- `20250101000002_create_core_tables.sql` (requires `course_modules` and `videos`)

**Related Issue:**
- Fixes broken CourseBuilder (was missing this table)
- Replaces `course_modules.video_ids` array (too rigid)

---

#### `20250112000002_add_whop_video_columns.sql`
**Date:** 2025-01-12
**Purpose:** Extend video table for Mux, Loom, and Whop lesson support

**Changes:**
- Adds `whop_lesson_id` - For syncing from Whop courses
- Adds `mux_asset_id` - Mux asset identifier
- Adds `mux_playback_id` - Mux HLS playback ID
- Adds `embed_type` - Generic embed type ('youtube', 'loom', 'vimeo', 'wistia')
- Adds `embed_id` - Platform-specific video ID
- Updates `source_type` constraint: ('youtube' | 'mux' | 'loom' | 'upload')
- Updates validation constraint for new source types

**Indexes:**
- `idx_videos_whop_lesson_id` - Whop lesson sync lookup
- `idx_videos_mux_asset_id` - Mux asset lookup
- `idx_videos_mux_playback_id` - Mux playback lookup
- `idx_videos_embed_type` - Embed type filtering
- `idx_videos_embed_id` - Embed ID lookup

**Constraints:**
- CHECK (source_type IN ('youtube', 'mux', 'loom', 'upload'))
- CHECK (embed_type IN ('youtube', 'loom', 'vimeo', 'wistia') OR NULL)
- Updated validation: YouTube/Mux/Loom require appropriate IDs

**Dependencies:**
- `20250111000001_add_youtube_embedding_support.sql` (modifies existing columns)

**Related Features:**
- Multi-source video support
- Whop content discovery and sync
- Mux video player component
- Loom transcript extraction

---

#### `20250112000003_create_video_analytics_events.sql`
**Date:** 2025-01-12
**Purpose:** Granular event tracking for video lifecycle and student interactions

**Tables Created:**
- `video_analytics_events` - Raw event stream

**Columns:**
- `id`, `event_type`, `video_id`, `creator_id`
- `student_id`, `course_id`, `module_id`
- `metadata`, `timestamp`, `created_at`

**Event Types:**
- `video_imported` - Video added to system
- `video_transcribed` - Transcript extracted
- `video_embedded` - Embeddings generated
- `video_added_to_course` - Added to module
- `video_started` - Student starts watching
- `video_progress` - 10/25/50/75/90% milestones
- `video_completed` - 90%+ watched
- `video_rewatched` - Rewatch completed video

**Indexes:**
- `idx_video_analytics_video_id` - Video event history
- `idx_video_analytics_creator_id` - Creator dashboard
- `idx_video_analytics_student_id` - Student progress
- `idx_video_analytics_event_type` - Event filtering
- `idx_video_analytics_timestamp` - Time-series queries
- `idx_video_analytics_course_events` - Composite (course, event, time)
- `idx_video_analytics_student_events` - Composite (student, video, event, time)

**Functions Added:**
- `track_video_event()` - Helper to insert events

**RLS Policies:**
- Creators can SELECT their video events
- Service role can INSERT events
- No UPDATE/DELETE (immutable events)

**Dependencies:**
- `20250101000002_create_core_tables.sql` (requires core tables)

**Related Features:**
- Real-time analytics dashboard
- Student engagement tracking
- Cost per video calculation
- Completion rate metrics

---

#### `20250112000004_create_video_watch_sessions.sql`
**Date:** 2025-01-12
**Purpose:** Track individual student viewing sessions with watch time

**Tables Created:**
- `video_watch_sessions` - Real-time watch tracking

**Columns:**
- `id`, `video_id`, `student_id`
- `session_start`, `session_end`
- `watch_time_seconds`, `percent_complete`, `completed`
- `device_type`, `referrer_type`
- `metadata`, `created_at`, `updated_at`

**Indexes:**
- `idx_video_watch_sessions_video_id` - Video sessions
- `idx_video_watch_sessions_student_id` - Student history
- `idx_video_watch_sessions_completed` - Completed filter
- `idx_video_watch_sessions_student_video` - Composite (student, video, start)
- `idx_video_watch_sessions_start` - Time-series queries
- `idx_video_watch_sessions_active` - Active sessions (session_end IS NULL)

**Constraints:**
- FOREIGN KEY to `videos.id` (ON DELETE CASCADE)
- FOREIGN KEY to `students.id` (ON DELETE CASCADE)
- CHECK (percent_complete BETWEEN 0 AND 100)
- CHECK (watch_time_seconds >= 0)
- CHECK (session_end IS NULL OR session_end >= session_start)
- CHECK (device_type IN ('desktop', 'mobile', 'tablet') OR NULL)
- CHECK (referrer_type IN ('course_page', 'direct_link', 'search', 'chat_reference') OR NULL)

**Functions Added:**
- `get_student_total_watch_time()` - Sum watch time for student+video
- `get_student_highest_completion()` - Max percent_complete for student+video
- `has_student_completed_video()` - Check if student completed video

**Triggers:**
- Auto-update `updated_at` timestamp
- Auto-set `completed=true` when `percent_complete >= 90`

**RLS Policies:**
- Students can SELECT/INSERT/UPDATE their own sessions
- Creators can SELECT sessions for their videos
- No DELETE (permanent history)

**Dependencies:**
- `20250101000002_create_core_tables.sql` (requires `videos` and `students`)

**Related Features:**
- Video player progress tracking
- Resume playback from last position
- Watch time analytics
- Completion rate calculation

---

## How to Apply Migrations

### Option 1: Supabase CLI (Recommended)

**Apply all pending migrations:**
```bash
npx supabase db push
```

**Apply specific migration:**
```bash
npx supabase migration up --include-name 20250112000001_create_module_lessons
```

**Check migration status:**
```bash
npx supabase migration list
```

---

### Option 2: Supabase Dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **SQL Editor**
4. Copy migration file contents
5. Execute SQL
6. Verify changes in **Table Editor**

---

### Option 3: Direct SQL (Advanced)

**Connect to database:**
```bash
psql -h aws-1-us-east-2.pooler.supabase.com -p 6543 -U postgres -d postgres
```

**Apply migration:**
```sql
\i supabase/migrations/20250112000001_create_module_lessons.sql
```

---

## Rollback Strategy

### Manual Rollback

Each migration should document its rollback steps:

**Example: Rollback `20250112000001_create_module_lessons.sql`**
```sql
-- Drop table (cascades to indexes, triggers, policies)
DROP TABLE IF EXISTS module_lessons CASCADE;
```

**Example: Rollback `20250112000002_add_whop_video_columns.sql`**
```sql
-- Remove columns
ALTER TABLE videos
DROP COLUMN IF EXISTS whop_lesson_id,
DROP COLUMN IF EXISTS mux_asset_id,
DROP COLUMN IF EXISTS mux_playback_id,
DROP COLUMN IF EXISTS embed_type,
DROP COLUMN IF EXISTS embed_id;

-- Restore old source_type constraint
ALTER TABLE videos DROP CONSTRAINT IF EXISTS videos_source_type_check;
ALTER TABLE videos ADD CONSTRAINT videos_source_type_check
  CHECK (source_type IN ('youtube', 'upload'));

-- Drop new indexes
DROP INDEX IF EXISTS idx_videos_whop_lesson_id;
DROP INDEX IF EXISTS idx_videos_mux_asset_id;
DROP INDEX IF EXISTS idx_videos_mux_playback_id;
DROP INDEX IF EXISTS idx_videos_embed_type;
DROP INDEX IF EXISTS idx_videos_embed_id;
```

### Backup Before Migration

```bash
# Backup database
pg_dump -h [host] -U postgres -d postgres > backup_$(date +%Y%m%d).sql

# Or use Supabase Dashboard: Settings → Database → Backup
```

---

## Naming Convention

**Format:** `YYYYMMDDHHMMSS_descriptive_name.sql`

**Examples:**
- `20250112000001_create_module_lessons.sql`
- `20250112120000_add_payment_integration.sql`
- `20250113093000_fix_rls_policies.sql`

**Rules:**
- Use UTC timestamps
- Use snake_case for names
- Be descriptive but concise
- One logical change per migration
- Include rollback instructions in comments

---

## Testing Migrations

### Pre-Migration Checklist

- [ ] Read migration file thoroughly
- [ ] Understand what tables/columns are affected
- [ ] Check for data loss risks
- [ ] Verify foreign key constraints won't break
- [ ] Test on local Supabase instance first
- [ ] Backup production database

### Post-Migration Verification

```sql
-- Verify table exists
\dt module_lessons

-- Check table structure
\d+ module_lessons

-- Verify indexes
\di+ idx_module_lessons_*

-- Test RLS policies
SET ROLE authenticated;
SELECT * FROM module_lessons LIMIT 1;

-- Verify functions
\df track_video_event
```

### Test Queries

**Test `module_lessons`:**
```sql
-- Insert test lesson
INSERT INTO module_lessons (module_id, video_id, lesson_order, title)
VALUES (
  (SELECT id FROM course_modules LIMIT 1),
  (SELECT id FROM videos LIMIT 1),
  1,
  'Test Lesson'
);

-- Query lessons
SELECT * FROM module_lessons WHERE module_id = (SELECT id FROM course_modules LIMIT 1);

-- Cleanup
DELETE FROM module_lessons WHERE title = 'Test Lesson';
```

**Test `video_analytics_events`:**
```sql
-- Track test event
SELECT track_video_event(
  'video_started',
  (SELECT id FROM videos LIMIT 1),
  (SELECT id FROM creators LIMIT 1),
  p_metadata := '{"device": "test"}'::jsonb
);

-- Query events
SELECT * FROM video_analytics_events ORDER BY timestamp DESC LIMIT 5;
```

**Test `video_watch_sessions`:**
```sql
-- Create test session
INSERT INTO video_watch_sessions (video_id, student_id, watch_time_seconds, percent_complete)
VALUES (
  (SELECT id FROM videos LIMIT 1),
  (SELECT id FROM students LIMIT 1),
  1800,
  95
);

-- Should auto-complete when percent_complete >= 90
SELECT id, completed FROM video_watch_sessions WHERE percent_complete >= 90;

-- Test helper functions
SELECT get_student_total_watch_time(
  (SELECT id FROM students LIMIT 1),
  (SELECT id FROM videos LIMIT 1)
);
```

---

## Migration Dependencies Graph

```
20250101000001 (pgvector)
    ↓
20250101000002 (core tables)
    ↓
    ├──→ 20250101000003 (vector index)
    ├──→ 20250101000004 (RLS)
    ├──→ 20250101000005 (usage functions)
    ├──→ 20250110000001 (chat analytics)
    ├──→ 20250110000002 (report schedules)
    └──→ 20250111000001 (YouTube support)
            ↓
            ├──→ 20250112000001 (module_lessons)
            └──→ 20250112000002 (Whop columns)
                    ↓
                    ├──→ 20250112000003 (analytics events)
                    └──→ 20250112000004 (watch sessions)
```

---

## Common Issues & Solutions

### Issue: Migration fails with "relation already exists"

**Solution:** Check if migration was partially applied
```sql
-- Check if table exists
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'module_lessons';

-- If exists, either:
-- 1. Skip migration (already applied)
-- 2. Drop table and re-apply
DROP TABLE module_lessons CASCADE;
```

---

### Issue: Foreign key constraint violation

**Solution:** Ensure referenced tables exist and have data
```sql
-- Check if parent tables have data
SELECT COUNT(*) FROM course_modules;
SELECT COUNT(*) FROM videos;

-- If empty, add test data first
-- Then re-apply migration
```

---

### Issue: RLS policy prevents queries

**Solution:** Temporarily disable RLS for testing
```sql
-- Disable RLS on table
ALTER TABLE module_lessons DISABLE ROW LEVEL SECURITY;

-- Test queries
SELECT * FROM module_lessons;

-- Re-enable RLS
ALTER TABLE module_lessons ENABLE ROW LEVEL SECURITY;
```

---

## Next Steps

- **Agent 2:** Build API routes using new tables
- **Agent 3:** Update CourseBuilder to use `module_lessons`
- **Agent 6:** Integrate video player with `video_watch_sessions`
- **Agent 9:** Build analytics dashboard using `video_analytics_events`

---

**Document Maintained By:** Claude Code Agent 1
**Related Documents:**
- [Database Schema](../schema.md)
- [Video Database Design](../../features/videos/database-design.md)
- [Agent 1 Report](../../agent-reports/video-implementation/agent-1-database-report.md)
