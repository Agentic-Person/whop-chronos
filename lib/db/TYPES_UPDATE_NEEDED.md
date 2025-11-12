# Database Types Update Required

**Date:** November 12, 2025
**Agent:** Agent 1 - Database Architecture

## New Tables Added

The following tables were added via migrations and need to be reflected in `lib/db/types.ts`:

### 1. `module_lessons`
Migration: `20250112000001_create_module_lessons.sql`

```typescript
module_lessons: {
  Row: {
    id: string;
    module_id: string;
    video_id: string;
    lesson_order: number;
    title: string;
    description: string | null;
    is_required: boolean;
    estimated_duration_minutes: number | null;
    metadata: Json;
    created_at: string;
    updated_at: string;
  };
  Insert: { /* Same fields with optionals */ };
  Update: { /* All fields optional */ };
}
```

### 2. `video_analytics_events`
Migration: `20250112000003_create_video_analytics_events.sql`

```typescript
video_analytics_events: {
  Row: {
    id: string;
    event_type: 'video_imported' | 'video_transcribed' | 'video_embedded' | 'video_added_to_course' | 'video_started' | 'video_progress' | 'video_completed' | 'video_rewatched';
    video_id: string;
    creator_id: string;
    student_id: string | null;
    course_id: string | null;
    module_id: string | null;
    metadata: Json;
    timestamp: string;
    created_at: string;
  };
  Insert: { /* Same fields with optionals */ };
  Update: { /* All fields optional */ };
}
```

### 3. `video_watch_sessions`
Migration: `20250112000004_create_video_watch_sessions.sql`

```typescript
video_watch_sessions: {
  Row: {
    id: string;
    video_id: string;
    student_id: string;
    session_start: string;
    session_end: string | null;
    watch_time_seconds: number;
    percent_complete: number;
    completed: boolean;
    device_type: 'desktop' | 'mobile' | 'tablet' | null;
    referrer_type: 'course_page' | 'direct_link' | 'search' | 'chat_reference' | null;
    metadata: Json;
    created_at: string;
    updated_at: string;
  };
  Insert: { /* Same fields with optionals */ };
  Update: { /* All fields optional */ };
}
```

## Updated Tables

### `videos` table
Migration: `20250112000002_add_whop_video_columns.sql`

**New columns added:**
```typescript
// Add these to existing videos.Row:
whop_lesson_id: string | null;
mux_asset_id: string | null;
mux_playback_id: string | null;
embed_type: 'youtube' | 'loom' | 'vimeo' | 'wistia' | null;
embed_id: string | null;

// Update source_type from:
source_type: 'youtube' | 'upload';
// To:
source_type: 'youtube' | 'mux' | 'loom' | 'upload';
```

## New Functions

Add to `Functions` section:

```typescript
track_video_event: {
  Args: {
    p_event_type: string;
    p_video_id: string;
    p_creator_id: string;
    p_student_id?: string | null;
    p_course_id?: string | null;
    p_module_id?: string | null;
    p_metadata?: Json;
    p_timestamp?: string;
  };
  Returns: string; // UUID of created event
};

get_student_total_watch_time: {
  Args: {
    p_student_id: string;
    p_video_id: string;
  };
  Returns: number; // Total seconds watched
};

get_student_highest_completion: {
  Args: {
    p_student_id: string;
    p_video_id: string;
  };
  Returns: number; // Highest percent_complete (0-100)
};

has_student_completed_video: {
  Args: {
    p_student_id: string;
    p_video_id: string;
  };
  Returns: boolean; // True if 90%+ watched
};
```

## How to Apply

**Option 1: Manual Update**
1. Open `lib/db/types.ts`
2. Add the three new tables to the `Tables` section
3. Update the `videos` table with new columns and source_type values
4. Add the four new functions to the `Functions` section

**Option 2: Auto-generate from Supabase**
```bash
npx supabase gen types typescript --linked > lib/db/types.ts
```

## Migration Application Status

All 4 migrations have been successfully applied to the database:
- `20250112000001_create_module_lessons.sql` ✅ **APPLIED**
- `20250112000002_add_whop_video_columns.sql` ✅ **APPLIED**
- `20250112000003_create_video_analytics_events.sql` ✅ **APPLIED**
- `20250112000004_create_video_watch_sessions.sql` ✅ **APPLIED**

**Applied on:** November 12, 2025
**Applied by:** Agent 1 - Database & Migrations

All database schema changes are now live. The TypeScript types in `lib/db/types.ts` should be updated to reflect these changes.
