# Database Setup Guide

Complete guide for setting up the Chronos database on Supabase.

## Prerequisites

1. **Supabase Account**: Create account at [supabase.com](https://supabase.com)
2. **Supabase Project**: Create a new project (or use existing)
3. **Environment Variables**: Set up `.env.local` with Supabase credentials

## Quick Setup (5 minutes)

### Step 1: Get Supabase Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Copy the following:
   - Project URL
   - `anon` public key
   - `service_role` secret key (⚠️ Keep this secret!)

### Step 2: Configure Environment

Add to `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 3: Run Migrations

Choose one of these methods:

#### Method A: Using Supabase Dashboard (Easiest)

1. Go to **SQL Editor** in Supabase Dashboard
2. Copy contents of each migration file (in order):
   - `supabase/migrations/20250101000001_enable_pgvector.sql`
   - `supabase/migrations/20250101000002_create_core_tables.sql`
   - `supabase/migrations/20250101000003_create_vector_index.sql`
   - `supabase/migrations/20250101000004_row_level_security.sql`
3. Run each migration by clicking "RUN"

#### Method B: Using Supabase CLI (Recommended)

```bash
# Install Supabase CLI globally
npm install -g supabase

# Login to Supabase
supabase login

# Link your project (get project ID from dashboard)
supabase link --project-ref <your-project-id>

# Run all migrations
supabase db push

# Or run migrations individually
supabase db execute -f supabase/migrations/20250101000001_enable_pgvector.sql
supabase db execute -f supabase/migrations/20250101000002_create_core_tables.sql
supabase db execute -f supabase/migrations/20250101000003_create_vector_index.sql
supabase db execute -f supabase/migrations/20250101000004_row_level_security.sql
```

#### Method C: Using npm script (Development)

```bash
npm run db:migrate
```

Note: This method requires the migrations to be compatible with direct SQL execution.

### Step 4: Create Storage Buckets

1. Go to **Storage** in Supabase Dashboard
2. Create these buckets:

**videos** (Private)
```
Name: videos
Public: No
File size limit: 500 MB
Allowed MIME types: video/*
```

**thumbnails** (Public)
```
Name: thumbnails
Public: Yes
File size limit: 5 MB
Allowed MIME types: image/*
```

**user-uploads** (Private)
```
Name: user-uploads
Public: No
File size limit: 500 MB
Auto-deletion: 24 hours (configure via policies)
```

### Step 5: Generate TypeScript Types

```bash
# Generate types from database schema
npm run db:types
```

This creates/updates `lib/db/types.ts` with type-safe database types.

### Step 6: Verify Setup

Run the verification script:

```bash
npm run verify-setup
```

Or manually verify in Supabase Dashboard:
- **Table Editor**: Check all 10 tables exist
- **Database** → **Extensions**: Verify `vector` extension is enabled
- **Database** → **Indexes**: Check vector index exists
- **Authentication** → **Policies**: Verify RLS policies are active

## Database Schema Overview

### Tables Created

1. **creators** - Whop company owners (users of the platform)
2. **students** - Students with active Whop memberships
3. **videos** - Video content with processing pipeline
4. **video_chunks** - Transcript chunks with vector embeddings
5. **courses** - Course containers
6. **course_modules** - Course modules with video lists
7. **chat_sessions** - AI chat conversations
8. **chat_messages** - Individual chat messages
9. **video_analytics** - Daily video metrics
10. **usage_metrics** - Daily creator usage tracking

### Key Features

- **pgvector Extension**: Enabled for semantic search
- **Vector Index**: IVFFlat index on video_chunks for fast similarity search
- **Row Level Security**: All tables protected with RLS policies
- **Updated Triggers**: Auto-update `updated_at` timestamps
- **Helper Functions**: `search_video_chunks()` for RAG queries
- **Monitoring Views**: `vector_index_stats` for health checks

## Troubleshooting

### Issue: "pgvector extension not available"

**Solution**: Ensure your Supabase project supports pgvector (all new projects do):
1. Go to **Database** → **Extensions**
2. Search for "vector"
3. Enable the extension

### Issue: "Permission denied" errors

**Solution**: Check your RLS policies:
1. Go to **Authentication** → **Policies**
2. Verify policies exist for your tables
3. Check JWT claims are set correctly in your app

### Issue: "Migration already executed"

**Solution**: Migrations are idempotent (safe to re-run), but if you encounter issues:
1. Use Supabase Dashboard SQL Editor
2. Manually check which tables exist
3. Skip already-executed migrations

### Issue: Slow vector search performance

**Solution**: Rebuild the vector index:
```sql
DROP INDEX idx_video_chunks_embedding_cosine;
CREATE INDEX idx_video_chunks_embedding_cosine
ON video_chunks
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

VACUUM ANALYZE video_chunks;
```

### Issue: TypeScript type errors

**Solution**: Regenerate types after any schema changes:
```bash
npm run db:types
```

## Database Management

### Viewing Data

**Supabase Dashboard** → **Table Editor**
- Browse all tables
- View and edit data
- Check indexes and relationships

### Running Queries

**SQL Editor**:
```sql
-- Check total videos
SELECT COUNT(*) FROM videos;

-- Check embedding coverage
SELECT * FROM vector_index_stats;

-- View recent chat sessions
SELECT * FROM chat_sessions
ORDER BY last_message_at DESC
LIMIT 10;

-- Check storage usage
SELECT
  creator_id,
  SUM(storage_used_bytes) / 1024 / 1024 / 1024 AS storage_gb
FROM usage_metrics
GROUP BY creator_id;
```

### Backup and Restore

**Automatic Backups** (Supabase Pro/Team plans):
- Daily backups enabled automatically
- Point-in-time recovery available

**Manual Backup**:
```bash
# Using Supabase CLI
supabase db dump -f backup.sql

# Restore from backup
supabase db reset
psql $DATABASE_URL < backup.sql
```

## Security Best Practices

1. **Never commit** `.env.local` or `.env` files
2. **Rotate keys** regularly (service role key)
3. **Use RLS** - Never bypass with service role in client-side code
4. **Monitor access** - Check Supabase logs for suspicious activity
5. **Limit permissions** - Use `anon` key for client, `service_role` only for backend

## Next Steps

After database setup:

1. ✅ **Test Connection**: Run `npm run verify-setup`
2. ✅ **Seed Data**: Create test creator and videos
3. ✅ **Test RLS**: Verify policies work correctly
4. ✅ **Set up Webhooks**: Configure Whop webhooks for membership sync
5. ✅ **Deploy**: Push to production with proper environment variables

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [pgvector Guide](https://supabase.com/docs/guides/ai/vector-embeddings)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Database Functions](https://supabase.com/docs/guides/database/functions)
- [Storage Documentation](https://supabase.com/docs/guides/storage)

## Support

If you encounter issues:
1. Check Supabase logs in Dashboard
2. Review migration files for syntax errors
3. Verify environment variables are correct
4. Check Supabase status page for outages
5. Consult Supabase Discord/GitHub discussions
