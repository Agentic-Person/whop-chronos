# Chronos Database Schema

**Last Updated:** November 12, 2025 (Agent 1 - Video Implementation)
**Database:** PostgreSQL 15+ with pgvector extension
**Status:** Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Core Tables](#core-tables)
3. [Video & Content Tables](#video--content-tables)
4. [Course & Learning Tables](#course--learning-tables)
5. [Chat & AI Tables](#chat--ai-tables)
6. [Analytics Tables](#analytics-tables)
7. [Indexes](#indexes)
8. [Functions](#functions)
9. [Row Level Security](#row-level-security)
10. [Relationships](#relationships)

---

## Overview

Chronos uses a PostgreSQL database with the following extensions:
- `pgvector` - Vector similarity search for embeddings
- `uuid-ossp` - UUID generation (gen_random_uuid())

**Total Tables:** 13
**Key Features:**
- Multi-source video support (YouTube, Mux, Loom, Upload)
- Vector embeddings for RAG chat
- Granular analytics event tracking
- Student watch session tracking
- Row Level Security (RLS) on all tables

---

## Core Tables

### `creators`
Creator accounts (Whop company owners) using the platform.

**Columns:**
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `whop_company_id` | TEXT | Unique Whop company identifier |
| `whop_user_id` | TEXT | Whop user ID for authentication |
| `email` | TEXT | Creator email address |
| `name` | TEXT | Creator display name (nullable) |
| `subscription_tier` | TEXT | Pricing tier: 'basic', 'pro', 'enterprise' |
| `settings` | JSONB | Creator preferences and configuration |
| `created_at` | TIMESTAMPTZ | Account creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp (auto-updated) |
| `last_login_at` | TIMESTAMPTZ | Last authentication timestamp |
| `is_active` | BOOLEAN | Account status (default: true) |

**Indexes:**
- `idx_creators_whop_company_id` - Whop company lookup
- `idx_creators_subscription_tier` - Tier-based queries
- `idx_creators_is_active` - Active account filtering

**Constraints:**
- `whop_company_id` - UNIQUE
- `subscription_tier` - CHECK ('basic', 'pro', 'enterprise')

---

### `students`
Students with active Whop memberships accessing creator content.

**Columns:**
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `whop_user_id` | TEXT | Unique Whop user identifier |
| `whop_membership_id` | TEXT | Active Whop membership ID |
| `creator_id` | UUID | Foreign key → `creators.id` |
| `email` | TEXT | Student email address |
| `name` | TEXT | Student display name (nullable) |
| `preferences` | JSONB | Student settings (playback speed, theme, etc.) |
| `created_at` | TIMESTAMPTZ | Account creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp (auto-updated) |
| `last_active_at` | TIMESTAMPTZ | Last activity timestamp |
| `is_active` | BOOLEAN | Membership status (default: true) |

**Indexes:**
- `idx_students_whop_user_id` - Whop user lookup
- `idx_students_whop_membership_id` - Membership validation
- `idx_students_creator_id` - Creator's student list
- `idx_students_is_active` - Active student filtering

**Constraints:**
- `whop_user_id` - UNIQUE
- `creator_id` - FOREIGN KEY REFERENCES `creators(id)` ON DELETE CASCADE

---

## Video & Content Tables

### `videos`
Video content from multiple sources with processing status.

**Columns:**
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `creator_id` | UUID | Foreign key → `creators.id` |
| `title` | TEXT | Video title |
| `description` | TEXT | Video description (nullable) |
| `url` | TEXT | Original video URL (nullable) |
| `storage_path` | TEXT | Supabase Storage path (for uploads) |
| `thumbnail_url` | TEXT | Thumbnail image URL |
| `duration_seconds` | INTEGER | Video duration in seconds |
| `transcript` | TEXT | Full video transcript |
| `transcript_language` | TEXT | Transcript language code (default: 'en') |
| `status` | TEXT | Processing status (see below) |
| `error_message` | TEXT | Error details if failed |
| `processing_started_at` | TIMESTAMPTZ | Processing start time |
| `processing_completed_at` | TIMESTAMPTZ | Processing completion time |
| `file_size_bytes` | BIGINT | File size (for uploads only) |
| `metadata` | JSONB | Additional metadata |
| `created_at` | TIMESTAMPTZ | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp (auto-updated) |
| `is_deleted` | BOOLEAN | Soft delete flag (default: false) |
| **Multi-Source Support:** | | |
| `source_type` | TEXT | 'youtube', 'mux', 'loom', 'upload' |
| `youtube_video_id` | TEXT | YouTube video ID (11 chars) |
| `youtube_channel_id` | TEXT | YouTube channel ID |
| `whop_lesson_id` | TEXT | Whop lesson ID (for syncing) |
| `mux_asset_id` | TEXT | Mux asset ID |
| `mux_playback_id` | TEXT | Mux playback ID (for HLS streaming) |
| `embed_type` | TEXT | 'youtube', 'loom', 'vimeo', 'wistia' |
| `embed_id` | TEXT | Platform-specific video ID |

**Status Values:**
- `pending` - Video added, awaiting processing
- `uploading` - File upload in progress (uploads only)
- `transcribing` - Transcript extraction in progress
- `processing` - Transcript chunking in progress
- `embedding` - Vector embeddings being generated
- `completed` - Fully processed and ready
- `failed` - Processing error occurred

**Indexes:**
- `idx_videos_creator_id` - Creator's video list
- `idx_videos_status` - Status filtering
- `idx_videos_created_at` - Chronological ordering
- `idx_videos_is_deleted` - Exclude deleted videos
- `idx_videos_source_type` - Source type filtering
- `idx_videos_youtube_video_id` - YouTube video lookup
- `idx_videos_whop_lesson_id` - Whop lesson sync
- `idx_videos_mux_asset_id` - Mux asset lookup
- `idx_videos_mux_playback_id` - Mux playback lookup
- `idx_videos_embed_type` - Embed type filtering

**Constraints:**
- `status` - CHECK (in valid status list)
- `source_type` - CHECK ('youtube', 'mux', 'loom', 'upload')
- `embed_type` - CHECK ('youtube', 'loom', 'vimeo', 'wistia' or NULL)
- `videos_source_validation` - CHECK (appropriate ID fields for source_type)
- `creator_id` - FOREIGN KEY REFERENCES `creators(id)` ON DELETE CASCADE

---

### `video_chunks`
Transcript chunks with vector embeddings for RAG search.

**Columns:**
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `video_id` | UUID | Foreign key → `videos.id` |
| `chunk_index` | INTEGER | Chunk sequence number (0-based) |
| `chunk_text` | TEXT | Transcript text segment |
| `embedding` | vector(1536) | OpenAI ada-002 embedding |
| `start_time_seconds` | INTEGER | Chunk start timestamp |
| `end_time_seconds` | INTEGER | Chunk end timestamp |
| `word_count` | INTEGER | Number of words in chunk |
| `metadata` | JSONB | Additional chunk metadata |
| `created_at` | TIMESTAMPTZ | Record creation timestamp |

**Indexes:**
- `idx_video_chunks_video_id` - Video's chunks list
- `idx_video_chunks_embedding` - IVFFlat vector similarity search

**Constraints:**
- `video_id` - FOREIGN KEY REFERENCES `videos(id)` ON DELETE CASCADE

---

## Course & Learning Tables

### `courses`
Course structure containing modules and lessons.

**Columns:**
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `creator_id` | UUID | Foreign key → `creators.id` |
| `title` | TEXT | Course title |
| `description` | TEXT | Course description (nullable) |
| `thumbnail_url` | TEXT | Course thumbnail image |
| `is_published` | BOOLEAN | Publication status (default: false) |
| `display_order` | INTEGER | Sort order in course list |
| `metadata` | JSONB | Additional course metadata |
| `created_at` | TIMESTAMPTZ | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp (auto-updated) |
| `published_at` | TIMESTAMPTZ | Publication timestamp |
| `is_deleted` | BOOLEAN | Soft delete flag (default: false) |

**Indexes:**
- `idx_courses_creator_id` - Creator's course list
- `idx_courses_is_published` - Published courses only
- `idx_courses_display_order` - Ordered course list

**Constraints:**
- `creator_id` - FOREIGN KEY REFERENCES `creators(id)` ON DELETE CASCADE

---

### `course_modules`
Modules within a course containing grouped lessons.

**Columns:**
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `course_id` | UUID | Foreign key → `courses.id` |
| `title` | TEXT | Module title |
| `description` | TEXT | Module description (nullable) |
| `video_ids` | TEXT[] | DEPRECATED: Array of video IDs (use module_lessons instead) |
| `display_order` | INTEGER | Sort order within course |
| `metadata` | JSONB | Additional module metadata |
| `created_at` | TIMESTAMPTZ | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp (auto-updated) |

**Indexes:**
- `idx_course_modules_course_id` - Course's modules list
- `idx_course_modules_display_order` - Ordered module list

**Constraints:**
- `course_id` - FOREIGN KEY REFERENCES `courses(id)` ON DELETE CASCADE

---

### `module_lessons`
**NEW TABLE** - Many-to-many relationship between modules and videos with ordering.

**Columns:**
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `module_id` | UUID | Foreign key → `course_modules.id` |
| `video_id` | UUID | Foreign key → `videos.id` |
| `lesson_order` | INTEGER | Display order within module (1-based) |
| `title` | TEXT | Lesson title (can differ from video title) |
| `description` | TEXT | Lesson-specific description or objectives |
| `is_required` | BOOLEAN | Whether students must complete this lesson |
| `estimated_duration_minutes` | INTEGER | Estimated completion time |
| `metadata` | JSONB | Additional lesson metadata |
| `created_at` | TIMESTAMPTZ | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp (auto-updated) |

**Indexes:**
- `idx_module_lessons_module_id` - Module's lessons list
- `idx_module_lessons_video_id` - Video usage across modules
- `idx_module_lessons_module_order` - Ordered lessons within module
- `idx_module_lessons_unique_video_per_module` - UNIQUE (module_id, video_id)

**Constraints:**
- `module_id` - FOREIGN KEY REFERENCES `course_modules(id)` ON DELETE CASCADE
- `video_id` - FOREIGN KEY REFERENCES `videos(id)` ON DELETE CASCADE
- `lesson_order` - CHECK (lesson_order > 0)
- `estimated_duration_minutes` - CHECK (estimated_duration_minutes IS NULL OR estimated_duration_minutes > 0)

**Triggers:**
- `module_lessons_updated_at_trigger` - Auto-update `updated_at` on changes

---

## Chat & AI Tables

### `chat_sessions`
Student chat sessions with AI assistant.

**Columns:**
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `student_id` | UUID | Foreign key → `students.id` |
| `creator_id` | UUID | Foreign key → `creators.id` |
| `title` | TEXT | Session title (auto-generated or custom) |
| `context_video_ids` | TEXT[] | Videos included in context |
| `metadata` | JSONB | Additional session metadata |
| `created_at` | TIMESTAMPTZ | Session creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp (auto-updated) |
| `last_message_at` | TIMESTAMPTZ | Last message timestamp |

**Indexes:**
- `idx_chat_sessions_student_id` - Student's chat sessions
- `idx_chat_sessions_creator_id` - Creator's student chats

**Constraints:**
- `student_id` - FOREIGN KEY REFERENCES `students(id)` ON DELETE CASCADE
- `creator_id` - FOREIGN KEY REFERENCES `creators(id)` ON DELETE CASCADE

---

### `chat_messages`
Individual messages within chat sessions.

**Columns:**
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `session_id` | UUID | Foreign key → `chat_sessions.id` |
| `role` | TEXT | 'user', 'assistant', 'system' |
| `content` | TEXT | Message content |
| `video_references` | JSONB | Cited video chunks |
| `token_count` | INTEGER | AI tokens used (nullable) |
| `model` | TEXT | AI model used (e.g., 'claude-3-5-haiku-20241022') |
| `metadata` | JSONB | Additional message metadata |
| `created_at` | TIMESTAMPTZ | Message creation timestamp |

**Indexes:**
- `idx_chat_messages_session_id` - Session's messages

**Constraints:**
- `session_id` - FOREIGN KEY REFERENCES `chat_sessions(id)` ON DELETE CASCADE
- `role` - CHECK ('user', 'assistant', 'system')

---

## Analytics Tables

### `video_analytics`
Aggregated daily video performance metrics.

**Columns:**
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `video_id` | UUID | Foreign key → `videos.id` |
| `date` | DATE | Aggregation date |
| `views` | INTEGER | Total views on this date |
| `unique_viewers` | INTEGER | Unique students who viewed |
| `total_watch_time_seconds` | INTEGER | Sum of watch time |
| `average_watch_time_seconds` | INTEGER | Average watch time per view |
| `completion_rate` | DECIMAL | Percentage who completed (0-100) |
| `ai_interactions` | INTEGER | Chat messages about this video |
| `metadata` | JSONB | Additional analytics metadata |
| `created_at` | TIMESTAMPTZ | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp (auto-updated) |

**Indexes:**
- `idx_video_analytics_video_id` - Video's analytics history
- `idx_video_analytics_date` - Date-based queries

**Constraints:**
- `video_id` - FOREIGN KEY REFERENCES `videos(id)` ON DELETE CASCADE

---

### `video_analytics_events`
**NEW TABLE** - Granular event tracking for video lifecycle and interactions.

**Columns:**
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `event_type` | TEXT | Event type (see below) |
| `video_id` | UUID | Foreign key → `videos.id` |
| `creator_id` | UUID | Foreign key → `creators.id` |
| `student_id` | UUID | Foreign key → `students.id` (nullable for creator events) |
| `course_id` | UUID | Foreign key → `courses.id` (nullable) |
| `module_id` | UUID | Foreign key → `course_modules.id` (nullable) |
| `metadata` | JSONB | Event-specific metadata (see below) |
| `timestamp` | TIMESTAMPTZ | When the event occurred |
| `created_at` | TIMESTAMPTZ | Record creation timestamp |

**Event Types:**
- `video_imported` - Video first added to system
- `video_transcribed` - Transcript extraction complete
- `video_embedded` - Vector embeddings generated
- `video_added_to_course` - Added to course module
- `video_started` - Student begins watching
- `video_progress` - Milestone reached (10%, 25%, 50%, 75%, 90%)
- `video_completed` - Student finishes (90%+ watched)
- `video_rewatched` - Student rewatches completed video

**Metadata Examples:**
```json
// video_imported
{
  "source_type": "youtube",
  "duration_seconds": 3600,
  "file_size_bytes": 104857600
}

// video_transcribed
{
  "transcript_method": "youtube_captions",
  "cost": 0,
  "duration_seconds": 3600,
  "word_count": 5400
}

// video_progress
{
  "percent_complete": 50,
  "watch_time_seconds": 1800,
  "session_id": "uuid"
}
```

**Indexes:**
- `idx_video_analytics_video_id` - Video's event history
- `idx_video_analytics_creator_id` - Creator's analytics dashboard
- `idx_video_analytics_student_id` - Student progress tracking
- `idx_video_analytics_event_type` - Event type filtering
- `idx_video_analytics_timestamp` - Time-series queries
- `idx_video_analytics_course_events` - Composite (course_id, event_type, timestamp)
- `idx_video_analytics_student_events` - Composite (student_id, video_id, event_type, timestamp)

**Constraints:**
- `event_type` - CHECK (in valid event type list)
- `video_id` - FOREIGN KEY REFERENCES `videos(id)` ON DELETE CASCADE
- `creator_id` - FOREIGN KEY REFERENCES `creators(id)` ON DELETE CASCADE
- `student_id` - FOREIGN KEY REFERENCES `students(id)` ON DELETE CASCADE
- `course_id` - FOREIGN KEY REFERENCES `courses(id)` ON DELETE SET NULL
- `module_id` - FOREIGN KEY REFERENCES `course_modules(id)` ON DELETE SET NULL

---

### `video_watch_sessions`
**NEW TABLE** - Individual student viewing sessions with watch time tracking.

**Columns:**
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `video_id` | UUID | Foreign key → `videos.id` |
| `student_id` | UUID | Foreign key → `students.id` |
| `session_start` | TIMESTAMPTZ | When student started watching |
| `session_end` | TIMESTAMPTZ | When student stopped watching (nullable if still watching) |
| `watch_time_seconds` | INTEGER | Actual time watched (excluding pauses) |
| `percent_complete` | INTEGER | Percentage of video completed (0-100) |
| `completed` | BOOLEAN | True if 90%+ watched |
| `device_type` | TEXT | 'desktop', 'mobile', 'tablet' |
| `referrer_type` | TEXT | 'course_page', 'direct_link', 'search', 'chat_reference' |
| `metadata` | JSONB | Session metadata (playback speed, quality, etc.) |
| `created_at` | TIMESTAMPTZ | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp (auto-updated) |

**Indexes:**
- `idx_video_watch_sessions_video_id` - Video's watch sessions
- `idx_video_watch_sessions_student_id` - Student's watch history
- `idx_video_watch_sessions_completed` - Completed sessions only
- `idx_video_watch_sessions_student_video` - Composite (student_id, video_id, session_start)
- `idx_video_watch_sessions_start` - Time-series queries
- `idx_video_watch_sessions_active` - Active sessions (session_end IS NULL)

**Constraints:**
- `video_id` - FOREIGN KEY REFERENCES `videos(id)` ON DELETE CASCADE
- `student_id` - FOREIGN KEY REFERENCES `students(id)` ON DELETE CASCADE
- `percent_complete` - CHECK (percent_complete >= 0 AND percent_complete <= 100)
- `watch_time_seconds` - CHECK (watch_time_seconds >= 0)
- `session_end` - CHECK (session_end IS NULL OR session_end >= session_start)
- `device_type` - CHECK ('desktop', 'mobile', 'tablet' or NULL)
- `referrer_type` - CHECK ('course_page', 'direct_link', 'search', 'chat_reference' or NULL)

**Triggers:**
- `video_watch_sessions_updated_at_trigger` - Auto-update `updated_at` on changes
- `video_watch_sessions_auto_complete_trigger` - Auto-set `completed=true` when `percent_complete >= 90`

---

### `usage_metrics`
Daily creator usage metrics for billing and limits.

**Columns:**
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `creator_id` | UUID | Foreign key → `creators.id` |
| `date` | DATE | Aggregation date |
| `storage_used_bytes` | BIGINT | Total storage used |
| `videos_uploaded` | INTEGER | Videos uploaded on this date |
| `total_video_duration_seconds` | INTEGER | Total video duration |
| `ai_credits_used` | INTEGER | AI API credits consumed |
| `transcription_minutes` | INTEGER | Transcription minutes processed |
| `chat_messages_sent` | INTEGER | Chat messages sent |
| `active_students` | INTEGER | Unique active students |
| `metadata` | JSONB | Additional usage metadata |
| `created_at` | TIMESTAMPTZ | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp (auto-updated) |

**Indexes:**
- `idx_usage_metrics_creator_id` - Creator's usage history
- `idx_usage_metrics_date` - Date-based queries

**Constraints:**
- `creator_id` - FOREIGN KEY REFERENCES `creators(id)` ON DELETE CASCADE

---

## Functions

### `search_video_chunks`
Vector similarity search for RAG chat.

**Arguments:**
- `query_embedding` - vector(1536) - Query embedding
- `match_count` - INTEGER (default: 5) - Number of results
- `similarity_threshold` - FLOAT (default: 0.7) - Minimum similarity
- `filter_video_ids` - TEXT[] (default: NULL) - Filter by video IDs

**Returns:** TABLE of matching chunks with similarity scores

---

### `track_video_event`
**NEW FUNCTION** - Helper to track video analytics events.

**Arguments:**
- `p_event_type` - TEXT - Event type
- `p_video_id` - UUID - Video ID
- `p_creator_id` - UUID - Creator ID
- `p_student_id` - UUID (default: NULL) - Student ID
- `p_course_id` - UUID (default: NULL) - Course ID
- `p_module_id` - UUID (default: NULL) - Module ID
- `p_metadata` - JSONB (default: '{}') - Event metadata
- `p_timestamp` - TIMESTAMPTZ (default: NOW()) - Event timestamp

**Returns:** UUID of created event

**Usage:**
```sql
SELECT track_video_event(
  'video_started',
  'video-uuid',
  'creator-uuid',
  p_student_id := 'student-uuid',
  p_metadata := '{"device": "mobile"}'::jsonb
);
```

---

### `get_student_total_watch_time`
**NEW FUNCTION** - Get total watch time for a student on a specific video.

**Arguments:**
- `p_student_id` - UUID - Student ID
- `p_video_id` - UUID - Video ID

**Returns:** INTEGER - Total seconds watched across all sessions

---

### `get_student_highest_completion`
**NEW FUNCTION** - Get highest completion percentage achieved by student.

**Arguments:**
- `p_student_id` - UUID - Student ID
- `p_video_id` - UUID - Video ID

**Returns:** INTEGER - Highest percent_complete (0-100)

---

### `has_student_completed_video`
**NEW FUNCTION** - Check if student has completed a video (90%+ watched).

**Arguments:**
- `p_student_id` - UUID - Student ID
- `p_video_id` - UUID - Video ID

**Returns:** BOOLEAN - True if completed in any session

---

## Row Level Security

All tables have RLS enabled. Key policies:

### Creators
- Can SELECT/UPDATE their own records
- Cannot DELETE (admin only)

### Students
- Can SELECT/UPDATE their own records
- Creators can SELECT their students

### Videos
- Creators can SELECT/INSERT/UPDATE/DELETE their own videos
- Students can SELECT videos from their creator

### Video Chunks
- Creators can SELECT chunks from their videos
- Students can SELECT chunks from videos they have access to

### Courses & Modules
- Creators can full CRUD their own courses/modules
- Students can SELECT published courses from their creator

### Module Lessons
- Creators can full CRUD lessons in their modules
- Students can SELECT lessons in published courses

### Chat Sessions & Messages
- Students can full CRUD their own sessions/messages
- Creators can SELECT their students' sessions/messages (read-only)

### Analytics
- Creators can SELECT their own analytics
- Students cannot access analytics

### Watch Sessions
- Students can INSERT/UPDATE their own watch sessions
- Creators can SELECT watch sessions for their videos
- No DELETE (permanent history)

---

## Relationships

### One-to-Many
- `creators` → `students` (one creator has many students)
- `creators` → `videos` (one creator has many videos)
- `creators` → `courses` (one creator has many courses)
- `courses` → `course_modules` (one course has many modules)
- `videos` → `video_chunks` (one video has many chunks)
- `students` → `chat_sessions` (one student has many sessions)
- `chat_sessions` → `chat_messages` (one session has many messages)
- `videos` → `video_watch_sessions` (one video has many watch sessions)
- `students` → `video_watch_sessions` (one student has many watch sessions)
- `videos` → `video_analytics_events` (one video has many events)

### Many-to-Many
- `course_modules` ↔ `videos` (through `module_lessons`)
  - One module contains many videos
  - One video can be in many modules

---

## Migration History

| Migration | Date | Description |
|-----------|------|-------------|
| `20250101000001` | 2025-01-01 | Enable pgvector extension |
| `20250101000002` | 2025-01-01 | Create core tables (creators, students, videos, etc.) |
| `20250101000003` | 2025-01-01 | Create vector index for embeddings |
| `20250101000004` | 2025-01-01 | Add Row Level Security policies |
| `20250101000005` | 2025-01-01 | Add usage tracking functions |
| `20250110000001` | 2025-01-10 | Add chat analytics columns |
| `20250110000002` | 2025-01-10 | Create report schedules table |
| `20250111000001` | 2025-01-11 | Add YouTube embedding support |
| `20250112000001` | 2025-01-12 | **NEW:** Create module_lessons table |
| `20250112000002` | 2025-01-12 | **NEW:** Add Whop video columns (Mux, Loom) |
| `20250112000003` | 2025-01-12 | **NEW:** Create video_analytics_events table |
| `20250112000004` | 2025-01-12 | **NEW:** Create video_watch_sessions table |

---

## Next Steps

- Run `npx supabase db push` to apply new migrations
- Update `lib/db/types.ts` with new table types
- Test RLS policies with test users
- Verify foreign key cascades work correctly
- Monitor query performance on new indexes

---

**Document Maintained By:** Claude Code Agent 1
**Related Documents:**
- [Database Design (Videos)](../features/videos/database-design.md)
- [Migration Guide](./migrations/README.md)
- [Agent 1 Report](../agent-reports/video-implementation/agent-1-database-report.md)
