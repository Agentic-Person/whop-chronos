# Database Library Quick Reference

Type-safe database access for Chronos using Supabase.

## Quick Start

```typescript
// Import everything you need
import { supabase, getCreatorVideos, searchVideoChunks } from '@/lib/db';
```

## Clients

### Client-side (Browser)
```typescript
import { supabase } from '@/lib/db';

// Respects RLS policies
const { data, error } = await supabase
  .from('videos')
  .select('*')
  .eq('creator_id', userId);
```

### Server-side (Service Role)
```typescript
import { getServiceSupabase } from '@/lib/db';

// BYPASSES RLS - use carefully!
const supabase = getServiceSupabase();
await supabase.from('videos').insert(newVideo);
```

### Server Components
```typescript
import { getServerSupabase } from '@/lib/db';

// Uses cookies, respects RLS
const supabase = await getServerSupabase();
const { data } = await supabase.from('creators').select('*');
```

## Query Helpers

All query helpers use service role and are meant for backend operations.

### Creators

```typescript
import { getCreatorByWhopCompanyId, upsertCreator } from '@/lib/db';

// Get creator by Whop company ID
const creator = await getCreatorByWhopCompanyId('company_123');

// Create or update creator
const creator = await upsertCreator({
  whop_company_id: 'company_123',
  whop_user_id: 'user_456',
  email: 'creator@example.com',
  subscription_tier: 'pro'
});
```

### Students

```typescript
import {
  getStudentByMembershipId,
  upsertStudent,
  deactivateStudent
} from '@/lib/db';

// Get student by membership
const student = await getStudentByMembershipId('membership_789');

// Create/update student
const student = await upsertStudent({
  whop_user_id: 'user_123',
  whop_membership_id: 'membership_789',
  creator_id: 'creator-uuid',
  email: 'student@example.com'
});

// Deactivate when membership expires
await deactivateStudent('membership_789');
```

### Videos

```typescript
import {
  getCreatorVideos,
  getVideoById,
  updateVideoStatus,
  softDeleteVideo
} from '@/lib/db';

// Get paginated videos
const { videos, total } = await getCreatorVideos('creator-uuid', {
  limit: 20,
  offset: 0,
  status: 'completed'
});

// Get single video with details
const video = await getVideoById('video-uuid');

// Update processing status
await updateVideoStatus('video-uuid', 'transcribing');
await updateVideoStatus('video-uuid', 'failed', 'Transcription error');

// Soft delete
await softDeleteVideo('video-uuid');
```

### Video Chunks (Vector Search)

```typescript
import { insertVideoChunks, searchVideoChunks } from '@/lib/db';

// Insert chunks with embeddings
await insertVideoChunks([
  {
    video_id: 'video-uuid',
    chunk_index: 0,
    chunk_text: 'Introduction to AI...',
    embedding: [0.123, -0.456, ...], // 1536 dimensions
    start_time_seconds: 0,
    end_time_seconds: 30,
    word_count: 50
  }
]);

// Semantic search (RAG)
const results = await searchVideoChunks(queryEmbedding, {
  matchCount: 5,
  similarityThreshold: 0.7,
  filterVideoIds: ['video-uuid-1', 'video-uuid-2']
});

// Results include: chunk_id, video_id, chunk_text, timestamps, similarity score
```

### Courses

```typescript
import { getCreatorCourses, getCourseById } from '@/lib/db';

// Get all courses (optionally published only)
const courses = await getCreatorCourses('creator-uuid', true);

// Get course with modules
const course = await getCourseById('course-uuid');
```

### Chat

```typescript
import {
  createChatSession,
  getChatSessionWithMessages,
  addChatMessage,
  getStudentChatSessions
} from '@/lib/db';

// Create session
const session = await createChatSession({
  student_id: 'student-uuid',
  creator_id: 'creator-uuid',
  title: 'Questions about Module 1',
  context_video_ids: ['video-uuid-1', 'video-uuid-2']
});

// Get session with all messages
const session = await getChatSessionWithMessages('session-uuid');

// Add message
const message = await addChatMessage({
  session_id: 'session-uuid',
  role: 'user',
  content: 'What is explained at 5:30?',
  video_references: [
    { video_id: 'video-uuid', timestamp: 330, title: 'Introduction' }
  ]
});

// Get student's recent sessions
const sessions = await getStudentChatSessions('student-uuid', 20);
```

### Analytics

```typescript
import {
  upsertVideoAnalytics,
  getVideoAnalytics,
  getCreatorAnalytics
} from '@/lib/db';

// Record daily metrics
await upsertVideoAnalytics({
  video_id: 'video-uuid',
  date: '2025-01-01',
  views: 150,
  unique_viewers: 98,
  total_watch_time_seconds: 7200,
  completion_rate: 68.5,
  ai_interactions: 45
});

// Get analytics for date range
const analytics = await getVideoAnalytics(
  'video-uuid',
  '2025-01-01',
  '2025-01-31'
);

// Get creator overview
const creatorAnalytics = await getCreatorAnalytics(
  'creator-uuid',
  '2025-01-01',
  '2025-01-31'
);
```

### Usage Metrics

```typescript
import {
  getCurrentUsage,
  upsertUsageMetrics,
  getUsageMetrics
} from '@/lib/db';

// Get today's usage (for quota checks)
const usage = await getCurrentUsage('creator-uuid');

// Record daily usage
await upsertUsageMetrics({
  creator_id: 'creator-uuid',
  date: '2025-01-01',
  storage_used_bytes: 5368709120, // 5 GB
  videos_uploaded: 12,
  ai_credits_used: 450,
  transcription_minutes: 120,
  chat_messages_sent: 89,
  active_students: 34
});

// Get usage history
const metrics = await getUsageMetrics(
  'creator-uuid',
  '2025-01-01',
  '2025-01-31'
);
```

## Constants

### Table Names
```typescript
import { Tables } from '@/lib/db';

Tables.CREATORS          // 'creators'
Tables.STUDENTS          // 'students'
Tables.VIDEOS            // 'videos'
Tables.VIDEO_CHUNKS      // 'video_chunks'
Tables.COURSES           // 'courses'
Tables.COURSE_MODULES    // 'course_modules'
Tables.CHAT_SESSIONS     // 'chat_sessions'
Tables.CHAT_MESSAGES     // 'chat_messages'
Tables.VIDEO_ANALYTICS   // 'video_analytics'
Tables.USAGE_METRICS     // 'usage_metrics'
```

### Storage Buckets
```typescript
import { Buckets } from '@/lib/db';

Buckets.VIDEOS           // 'videos'
Buckets.THUMBNAILS       // 'thumbnails'
Buckets.USER_UPLOADS     // 'user-uploads'
```

## TypeScript Types

```typescript
import type { Database } from '@/lib/db';

type Creator = Database['public']['Tables']['creators']['Row'];
type VideoInsert = Database['public']['Tables']['videos']['Insert'];
type VideoUpdate = Database['public']['Tables']['videos']['Update'];

// Or access specific types
type SubscriptionTier = Database['public']['Enums']['subscription_tier'];
type VideoStatus = Database['public']['Enums']['video_status'];
```

## Error Handling

```typescript
import { supabase } from '@/lib/db';

try {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('id', videoId)
    .single();

  if (error) {
    // PGRST116 = not found
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }

  return data;
} catch (error) {
  console.error('Database error:', error);
  throw new Error('Failed to fetch video');
}
```

## Best Practices

### 1. Use Query Helpers for Common Operations
```typescript
// ✅ Good - Type-safe, tested, reusable
const creator = await getCreatorByWhopCompanyId(companyId);

// ❌ Avoid - Repetitive, error-prone
const { data } = await supabase
  .from('creators')
  .select('*')
  .eq('whop_company_id', companyId)
  .single();
```

### 2. Use Service Role Only in Backend
```typescript
// ✅ Good - API route or Server Action
export async function POST(request: Request) {
  const supabase = getServiceSupabase();
  await supabase.from('videos').insert(video);
}

// ❌ NEVER - Client component
'use client';
export default function VideoUpload() {
  const supabase = getServiceSupabase(); // ⚠️ Exposes service key!
}
```

### 3. Respect RLS in Client Code
```typescript
// ✅ Good - RLS protects data
const { data } = await supabase
  .from('videos')
  .select('*');

// User only sees videos they have access to
```

### 4. Handle Errors Gracefully
```typescript
// ✅ Good
const creator = await getCreatorByWhopCompanyId(companyId);
if (!creator) {
  return { error: 'Creator not found' };
}

// ❌ Avoid unhandled errors
const creator = await getCreatorByWhopCompanyId(companyId);
const name = creator.name; // ⚠️ May crash if null
```

### 5. Use Transactions for Related Operations
```typescript
const supabase = getServiceSupabase();

const { data: video, error: videoError } = await supabase
  .from('videos')
  .insert(newVideo)
  .select()
  .single();

if (videoError) throw videoError;

const { error: chunksError } = await supabase
  .from('video_chunks')
  .insert(chunks.map(c => ({ ...c, video_id: video.id })));

if (chunksError) {
  // Rollback video
  await supabase.from('videos').delete().eq('id', video.id);
  throw chunksError;
}
```

## Common Patterns

### Pagination
```typescript
const page = 2;
const pageSize = 20;

const { videos, total } = await getCreatorVideos('creator-uuid', {
  limit: pageSize,
  offset: (page - 1) * pageSize
});

const totalPages = Math.ceil(total / pageSize);
```

### Real-time Subscriptions
```typescript
import { supabase } from '@/lib/db';

const channel = supabase
  .channel('videos')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'videos',
      filter: `creator_id=eq.${creatorId}`
    },
    (payload) => {
      console.log('Video updated:', payload.new);
    }
  )
  .subscribe();

// Cleanup
channel.unsubscribe();
```

### File Upload
```typescript
import { supabase, Buckets } from '@/lib/db';

const file = event.target.files[0];
const filePath = `${userId}/${Date.now()}-${file.name}`;

const { error } = await supabase.storage
  .from(Buckets.VIDEOS)
  .upload(filePath, file);

if (!error) {
  const { data } = supabase.storage
    .from(Buckets.VIDEOS)
    .getPublicUrl(filePath);

  console.log('Video URL:', data.publicUrl);
}
```

## Troubleshooting

### "Permission denied for table X"
- Check RLS policies are enabled
- Verify JWT claims are set correctly
- Use service role for background jobs

### "Null constraint violation"
- Check required fields in types.ts
- Use proper Insert type, not Row type

### "Foreign key constraint violation"
- Ensure parent record exists before inserting
- Check creator_id, video_id, etc. are valid UUIDs

### Vector search returns no results
- Verify embeddings are inserted (check `embedding IS NOT NULL`)
- Lower similarity threshold (try 0.5 or 0.6)
- Check embedding dimension matches (1536 for OpenAI ada-002)

## Resources

- [Database Setup Guide](../../docs/DATABASE_SETUP.md)
- [Full Schema Documentation](../../supabase/README.md)
- [Supabase Docs](https://supabase.com/docs)
