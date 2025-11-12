# Database Verification Checklist

Use this checklist to verify the database setup is complete and working correctly.

## Pre-Deployment Verification

### 1. Environment Variables

- [ ] `NEXT_PUBLIC_SUPABASE_URL` is set
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set (server-only)
- [ ] All keys are from the same Supabase project
- [ ] Keys are not committed to git (check `.gitignore`)

### 2. Migration Execution

Run in Supabase Dashboard SQL Editor or CLI:

- [ ] Migration 1: `20250101000001_enable_pgvector.sql` executed
- [ ] Migration 2: `20250101000002_create_core_tables.sql` executed
- [ ] Migration 3: `20250101000003_create_vector_index.sql` executed
- [ ] Migration 4: `20250101000004_row_level_security.sql` executed
- [ ] No error messages in migration logs

### 3. Table Verification

Check in **Table Editor** (Supabase Dashboard):

- [ ] `creators` table exists with 11 columns
- [ ] `students` table exists with 10 columns
- [ ] `videos` table exists with 17 columns
- [ ] `video_chunks` table exists with 9 columns
- [ ] `courses` table exists with 10 columns
- [ ] `course_modules` table exists with 7 columns
- [ ] `chat_sessions` table exists with 9 columns
- [ ] `chat_messages` table exists with 8 columns
- [ ] `video_analytics` table exists with 11 columns
- [ ] `usage_metrics` table exists with 12 columns

### 4. Extension & Index Verification

Run in SQL Editor:

```sql
-- Check pgvector extension
SELECT * FROM pg_extension WHERE extname = 'vector';
-- Should return 1 row

-- Check vector index exists
SELECT indexname FROM pg_indexes
WHERE tablename = 'video_chunks'
AND indexname LIKE '%embedding%';
-- Should return: idx_video_chunks_embedding_cosine

-- Check all indexes
SELECT tablename, indexname FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
-- Should see 25+ indexes
```

Checklist:
- [ ] `vector` extension is enabled
- [ ] Vector index `idx_video_chunks_embedding_cosine` exists
- [ ] All foreign key columns are indexed
- [ ] GIN indexes exist on JSONB/array columns

### 5. Row Level Security (RLS)

Check in **Authentication → Policies**:

- [ ] RLS is enabled on all 10 tables
- [ ] At least 2-3 policies per table
- [ ] Helper functions exist: `auth.creator_id()`, `auth.student_id()`, `auth.is_service_role()`

Run in SQL Editor:

```sql
-- Verify RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
-- All should have rowsecurity = true

-- Count policies
SELECT schemaname, tablename, COUNT(*)
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename;
-- Each table should have multiple policies
```

### 6. Functions & Triggers

Run in SQL Editor:

```sql
-- Check search function exists
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'search_video_chunks';
-- Should return 1 row

-- Check update triggers
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND trigger_name LIKE '%updated_at%';
-- Should return 8 triggers
```

Checklist:
- [ ] `search_video_chunks()` function exists
- [ ] `update_updated_at_column()` function exists
- [ ] `updated_at` triggers on all relevant tables

### 7. Storage Buckets

In **Storage** (Supabase Dashboard):

- [ ] `videos` bucket created (Private, 500 MB limit)
- [ ] `thumbnails` bucket created (Public, 5 MB limit)
- [ ] `user-uploads` bucket created (Private, 500 MB limit)
- [ ] Storage policies configured for each bucket

### 8. TypeScript Types

Run locally:

```bash
npm run db:types
```

- [ ] `lib/db/types.ts` file exists
- [ ] No TypeScript errors in `lib/db/` directory
- [ ] Types match database schema

Run:
```bash
npm run type-check
```

- [ ] No type errors in project

## Functional Testing

### 1. Test Database Connection

Create `scripts/test-db.ts`:

```typescript
import { getServiceSupabase } from '@/lib/db';

async function testConnection() {
  const supabase = getServiceSupabase();

  // Test simple query
  const { data, error } = await supabase
    .from('creators')
    .select('count')
    .limit(1);

  if (error) {
    console.error('❌ Connection failed:', error);
    process.exit(1);
  }

  console.log('✅ Database connection successful');
}

testConnection();
```

Run:
```bash
tsx scripts/test-db.ts
```

- [ ] Connection test passes

### 2. Test Query Helpers

```typescript
import { getCreatorByWhopCompanyId } from '@/lib/db/queries';

// Should return null (no creator yet)
const creator = await getCreatorByWhopCompanyId('test_123');
console.log('Creator lookup:', creator === null ? 'PASS' : 'FAIL');
```

- [ ] Query helper executes without errors

### 3. Test RLS Policies

Using Supabase client (anon key):

```typescript
import { supabase } from '@/lib/db';

// Should return empty (RLS blocks access)
const { data, error } = await supabase
  .from('creators')
  .select('*');

console.log('RLS test:', data?.length === 0 ? 'PASS' : 'FAIL');
```

- [ ] RLS correctly blocks unauthenticated access

### 4. Test Vector Search Function

```sql
-- Run in SQL Editor
SELECT * FROM search_video_chunks(
  ARRAY[0.1, 0.2, ...] -- 1536 dimensions
  5,
  0.7,
  NULL
);
-- Should execute without errors (may return 0 rows if no data)
```

- [ ] Vector search function executes

### 5. Test CRUD Operations

```typescript
import { getServiceSupabase } from '@/lib/db';

const supabase = getServiceSupabase();

// Create test creator
const { data: creator, error: createError } = await supabase
  .from('creators')
  .insert({
    whop_company_id: 'test_company_123',
    whop_user_id: 'test_user_456',
    email: 'test@example.com',
    subscription_tier: 'basic'
  })
  .select()
  .single();

if (createError) throw createError;
console.log('✅ Creator created:', creator.id);

// Update creator
const { error: updateError } = await supabase
  .from('creators')
  .update({ name: 'Test Creator' })
  .eq('id', creator.id);

if (updateError) throw updateError;
console.log('✅ Creator updated');

// Delete creator
const { error: deleteError } = await supabase
  .from('creators')
  .delete()
  .eq('id', creator.id);

if (deleteError) throw deleteError;
console.log('✅ Creator deleted');
```

- [ ] Create operation works
- [ ] Update operation works
- [ ] Delete operation works
- [ ] `updated_at` timestamp auto-updates

### 6. Test Foreign Key Constraints

```typescript
// Should fail - creator doesn't exist
const { error } = await supabase
  .from('videos')
  .insert({
    creator_id: '00000000-0000-0000-0000-000000000000',
    title: 'Test Video'
  });

console.log('FK constraint:', error ? 'PASS' : 'FAIL');
```

- [ ] Foreign key constraints enforced

## Performance Verification

### 1. Index Usage

```sql
-- Check index usage stats
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

- [ ] Indexes are present (scans may be 0 with no data)

### 2. Table Size

```sql
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

- [ ] All tables exist
- [ ] Sizes are reasonable (small with no data)

### 3. Vector Index Health

```sql
SELECT * FROM vector_index_stats;
```

- [ ] View executes successfully
- [ ] Shows 0/0 chunks initially (will populate after video processing)

## Security Verification

### 1. Service Role Protection

- [ ] `SUPABASE_SERVICE_ROLE_KEY` is in `.env.local` (not `.env`)
- [ ] Service role key is not in client-side code
- [ ] Service role only used in API routes/Server Actions

### 2. RLS Policy Testing

Test with different roles:

```typescript
// Anon user (no auth)
const { data: anonData } = await supabase.from('videos').select('*');
// Should return 0 rows or error

// Authenticated as creator
// Set JWT claims and test
// Should see own videos only
```

- [ ] Anon users blocked from all tables
- [ ] Creators see only their data
- [ ] Students see only accessible content

### 3. SQL Injection Protection

All queries use parameterized queries:
- [ ] No string concatenation in SQL
- [ ] All query helpers use Supabase query builder
- [ ] No raw SQL with user input

## Production Readiness

### 1. Backup Strategy

- [ ] Supabase automatic backups enabled (Pro+ plan)
- [ ] Backup frequency configured (daily recommended)
- [ ] Point-in-time recovery enabled
- [ ] Tested backup restoration

### 2. Monitoring

- [ ] Supabase logs accessible
- [ ] Slow query monitoring enabled
- [ ] Error tracking configured (Sentry)
- [ ] Database metrics dashboard set up

### 3. Performance

- [ ] Connection pooling configured (Supabase automatic)
- [ ] Index analysis complete
- [ ] Query performance acceptable (<100ms for simple queries)
- [ ] Vector search latency acceptable (<2s for RAG)

### 4. Scaling Preparation

- [ ] Database size monitoring enabled
- [ ] Plan for index maintenance (vector index rebuild)
- [ ] Strategy for large table partitioning (if needed)
- [ ] Rate limiting implemented at application layer

## Documentation Verification

- [ ] `docs/DATABASE_SETUP.md` reviewed
- [ ] `supabase/README.md` reviewed
- [ ] `lib/db/README.md` reviewed
- [ ] Team trained on database usage
- [ ] Migration workflow documented

## Final Checks

- [ ] All migrations executed successfully
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] Security policies verified
- [ ] Performance acceptable
- [ ] Documentation complete
- [ ] Team onboarded

## Sign-off

**Database setup verified by**: _________________

**Date**: _________________

**Production deployment approved**: [ ] Yes [ ] No

**Notes**:
```
[Add any issues encountered or special configuration notes]
```

---

## Quick Verification Script

Save as `scripts/verify-db.ts`:

```typescript
import { getServiceSupabase } from '@/lib/db';

async function verifyDatabase() {
  console.log('🔍 Verifying Chronos Database Setup\n');

  const supabase = getServiceSupabase();

  // 1. Test connection
  console.log('1. Testing connection...');
  const { error: connError } = await supabase.from('creators').select('count').limit(1);
  console.log(connError ? '   ❌ Connection failed' : '   ✅ Connection successful');

  // 2. Check tables exist
  console.log('\n2. Checking tables...');
  const tables = [
    'creators', 'students', 'videos', 'video_chunks',
    'courses', 'course_modules', 'chat_sessions', 'chat_messages',
    'video_analytics', 'usage_metrics'
  ];

  for (const table of tables) {
    const { error } = await supabase.from(table).select('count').limit(1);
    console.log(`   ${error ? '❌' : '✅'} ${table}`);
  }

  // 3. Check vector extension
  console.log('\n3. Checking pgvector extension...');
  const { data: extensions } = await supabase.rpc('exec_sql', {
    sql: "SELECT * FROM pg_extension WHERE extname = 'vector'"
  });
  console.log(extensions ? '   ✅ pgvector enabled' : '   ❌ pgvector not found');

  console.log('\n✅ Verification complete!\n');
}

verifyDatabase();
```

Run:
```bash
tsx scripts/verify-db.ts
```
