# Supabase Database Schema

## Overview

Chronos uses Supabase PostgreSQL with pgvector for vector embeddings and semantic search. The database consists of 10 core tables organized around creators, students, videos, courses, chat, and analytics.

## Quick Start

### Prerequisites

1. Install Supabase CLI: `npm install -g supabase`
2. Login to Supabase: `supabase login`
3. Link your project: `supabase link --project-ref <project-id>`

### Running Migrations

#### Option 1: Using Supabase CLI (Recommended)

```bash
# Run all pending migrations
supabase db push

# Or run migrations manually in order
supabase db execute -f migrations/20250101000001_enable_pgvector.sql
supabase db execute -f migrations/20250101000002_create_core_tables.sql
supabase db execute -f migrations/20250101000003_create_vector_index.sql
supabase db execute -f migrations/20250101000004_row_level_security.sql
```

#### Option 2: Using Supabase Dashboard

1. Go to https://app.supabase.com/project/<project-id>/sql/new
2. Copy and paste each migration file in order
3. Execute each migration

#### Option 3: Using npm script

```bash
# Run all migrations (requires supabase CLI)
npm run db:migrate
```

### Generating TypeScript Types

After running migrations, generate TypeScript types:

```bash
# Generate types and save to lib/db/types.ts
supabase gen types typescript --linked > ../lib/db/types.ts
```

Or use the npm script:

```bash
npm run db:types
```

## Database Architecture

### Tables

#### 1. creators
- **Purpose**: Whop company owners using the platform
- **Key Fields**: whop_company_id, subscription_tier, settings
- **RLS**: Creators can view/update own profile only

#### 2. students
- **Purpose**: Students with active Whop memberships
- **Key Fields**: whop_user_id, whop_membership_id, creator_id
- **RLS**: Students view own profile; Creators view their students

#### 3. videos
- **Purpose**: Uploaded video content with processing status
- **Key Fields**: creator_id, title, url, transcript, status
- **RLS**: Creators manage own videos; Students view creator's videos
- **Status Flow**: pending → uploading → transcribing → processing → embedding → completed

#### 4. video_chunks
- **Purpose**: Chunked transcripts with vector embeddings for RAG
- **Key Fields**: video_id, chunk_text, embedding (vector 1536)
- **RLS**: Inherits video access permissions
- **Index**: IVFFlat vector index for semantic search

#### 5. courses
- **Purpose**: Course containers organizing videos
- **Key Fields**: creator_id, title, is_published, display_order
- **RLS**: Creators manage own; Students view published only

#### 6. course_modules
- **Purpose**: Course modules with ordered video lists
- **Key Fields**: course_id, title, video_ids (array)
- **RLS**: Inherits course access permissions

#### 7. chat_sessions
- **Purpose**: AI chat conversation sessions
- **Key Fields**: student_id, creator_id, context_video_ids
- **RLS**: Students manage own; Creators view their students' chats

#### 8. chat_messages
- **Purpose**: Individual chat messages with AI responses
- **Key Fields**: session_id, role, content, video_references
- **RLS**: Inherits session access permissions

#### 9. video_analytics
- **Purpose**: Daily video performance metrics
- **Key Fields**: video_id, date, views, completion_rate, ai_interactions
- **RLS**: Creators view own videos only; Service role manages
- **Constraint**: Unique (video_id, date)

#### 10. usage_metrics
- **Purpose**: Daily creator usage and quota tracking
- **Key Fields**: creator_id, date, storage_used, ai_credits_used
- **RLS**: Creators view own only; Service role manages
- **Constraint**: Unique (creator_id, date)

### Indexes

- **B-tree indexes**: Foreign keys, frequently filtered columns
- **GIN indexes**: JSONB fields, array fields (video_ids)
- **Vector index**: IVFFlat on video_chunks.embedding for semantic search

### Row Level Security (RLS)

All tables have RLS enabled with policies for:
- **Creators**: Can manage their own data
- **Students**: Can view creator's content they have access to
- **Service Role**: Full access for background jobs and system operations

### Helper Functions

#### search_video_chunks()
Semantic search across video chunks with optional filtering:

```sql
SELECT * FROM search_video_chunks(
  query_embedding := '<embedding-array>',
  match_count := 5,
  similarity_threshold := 0.7,
  filter_video_ids := ARRAY['uuid1', 'uuid2']
);
```

#### update_updated_at_column()
Automatically updates `updated_at` timestamp on row updates.

### Views

#### vector_index_stats
Monitor embedding coverage:

```sql
SELECT * FROM vector_index_stats;
-- Returns: total_chunks, chunks_with_embeddings, embedding_coverage_percent
```

## Migration Strategy

### Migration Naming Convention
```
YYYYMMDDHHMMSS_description.sql
```

Example: `20250101000001_enable_pgvector.sql`

### Current Migrations

1. **20250101000001_enable_pgvector.sql** - Enable pgvector extension
2. **20250101000002_create_core_tables.sql** - Create all 10 core tables
3. **20250101000003_create_vector_index.sql** - Create vector index and search functions
4. **20250101000004_row_level_security.sql** - Enable RLS and create policies

### Creating New Migrations

```bash
# Create new migration file
supabase migration new description_of_change

# Edit the generated file in supabase/migrations/

# Test migration locally
supabase db reset

# Apply to production
supabase db push
```

## Storage Buckets

Create the following buckets in Supabase Dashboard:

1. **videos** - Video file storage
   - Public: No
   - File size limit: 500 MB
   - Allowed MIME types: video/*

2. **thumbnails** - Video thumbnail images
   - Public: Yes
   - File size limit: 5 MB
   - Allowed MIME types: image/*

3. **user-uploads** - Temporary user uploads
   - Public: No
   - File size limit: 500 MB
   - Auto-deletion: 24 hours

## Database Maintenance

### Regular Tasks

```sql
-- Update table statistics (run weekly)
ANALYZE;

-- Check index usage
SELECT * FROM pg_stat_user_indexes WHERE schemaname = 'public';

-- Monitor table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check vector index health
SELECT * FROM vector_index_stats;
```

### Performance Optimization

```sql
-- Rebuild vector index if performance degrades
DROP INDEX idx_video_chunks_embedding_cosine;
CREATE INDEX idx_video_chunks_embedding_cosine
ON video_chunks
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Vacuum full (run during low traffic)
VACUUM FULL ANALYZE video_chunks;
```

## Security Checklist

- [x] RLS enabled on all tables
- [x] Service role key stored securely in environment variables
- [x] JWT claims used for user identification
- [x] Webhooks verify Whop signatures
- [x] No sensitive data in client-side code
- [x] Proper indexes for performance
- [x] Backup strategy configured

## Troubleshooting

### Common Issues

**Issue**: pgvector extension not available
- **Solution**: Ensure Supabase project has pgvector enabled (it's enabled by default on new projects)

**Issue**: RLS preventing access
- **Solution**: Check JWT claims are set correctly; Use service role for background jobs

**Issue**: Slow vector search
- **Solution**: Rebuild vector index with appropriate `lists` parameter
- **Calculation**: `lists = sqrt(total_rows)`

**Issue**: Type errors in TypeScript
- **Solution**: Regenerate types after schema changes: `npm run db:types`

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [pgvector Guide](https://supabase.com/docs/guides/ai/vector-embeddings)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Database Functions](https://supabase.com/docs/guides/database/functions)
