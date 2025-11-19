# Chronos Integration Testing Guide

Complete guide for setting up test data and running integration tests for Phase 4 analytics and beyond.

## Prerequisites

### 1. Environment Setup

Ensure your `.env.local` has Supabase credentials:

```bash
# Get these from: https://supabase.com/dashboard/project/dddttlnrkwaddzjvkacp/settings/api
NEXT_PUBLIC_SUPABASE_URL=https://dddttlnrkwaddzjvkacp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 2. Database Setup

Run migrations (should already be done):

```bash
npm run db:migrate
```

## Quick Start

### Option 1: Run Everything at Once

```bash
# Seed test data + run all integration tests
npm run db:seed
npm run test:all
```

### Option 2: Step-by-Step

```bash
# 1. Seed the database with test data
npm run db:seed

# 2. Test video processing pipeline
npm run test:video-pipeline

# 3. Test analytics dashboard queries
npm run test:analytics

# 4. Run full integration test suite
npm run test:all
```

## Test Data Overview

The seed script (`npm run db:seed`) creates:

### Test Accounts
- **Creator**: test.creator@example.com
  - ID: `00000000-0000-0000-0000-000000000001`
  - Tier: Pro
  - Whop Company ID: `biz_test_creator_123`

- **Student**: test.student@example.com
  - ID: `00000000-0000-0000-0000-000000000002`
  - Whop Membership: `mem_test_student_active`

### Content
- **2 Courses**: Trading Fundamentals, Advanced Options
- **5 Videos**: Technical analysis, candlesticks, risk management, options, trading plan
- **3 Course Modules**: Getting Started, Risk Management, Options Fundamentals
- **3 Video Chunks**: For RAG/semantic search testing

### Analytics Data
- **2 Chat Sessions**: With 6 total messages including AI responses
- **8 Video Analytics Records**: Last 7 days of view/engagement data
- **4 Usage Metrics Records**: Last 7 days of storage/AI usage
- **Chat Cost Analytics**: Token usage and cost tracking

## Individual Test Scripts

### 1. Database Seed (`db:seed`)

**Purpose**: Populate database with realistic test data

**What it creates**:
- Test creator and student accounts
- Sample courses and videos
- Video chunks for RAG testing
- Chat sessions with analytics data
- Video performance metrics (last 7 days)
- Usage metrics and cost tracking

**Run it**:
```bash
npm run db:seed
```

**Expected output**:
```
🌱 Starting database seed...
👤 Creating test creator...
✅ Creator: test.creator@example.com
👨‍🎓 Creating test student...
✅ Student: test.student@example.com
📚 Creating test courses...
✅ Created 2 courses
🎥 Creating test videos...
✅ Created 5 videos
💬 Creating chat sessions and messages...
✅ Created chat data
✅ Manual seed completed!
```

### 2. Video Pipeline Test (`test:video-pipeline`)

**Purpose**: Test the complete video processing workflow

**What it tests**:
1. Video creation with initial `pending` status
2. Status progression through pipeline stages:
   - `pending` → `uploading` → `transcribing` → `processing` → `embedding` → `completed`
3. Transcript storage
4. Video chunk creation
5. RAG-ready data structure
6. Data retrieval for AI chat

**Run it**:
```bash
npm run test:video-pipeline
```

**Expected output**:
```
🧪 Testing Video Processing Pipeline

📝 Test 1: Creating new video...
✅ Video created: <uuid>
   Status: pending

⚙️  Test 2: Simulating pipeline stages...
   ⬆️ Status: uploading
   🎤 Status: transcribing
   ⚙️ Status: processing
   🧠 Status: embedding
   ✅ Status: completed

📄 Test 3: Adding transcript...
✅ Transcript added

✂️  Test 4: Creating video chunks...
✅ Created 3 chunks

🔍 Test 5: Verifying video is query-ready...
✅ Video Details:
   Chunks: 3

🔎 Test 6: Testing chunk retrieval (RAG simulation)...
✅ Retrieved 3 chunks for RAG

✅ Video Pipeline Test: PASSED
```

### 3. Analytics Dashboard Test (`test:analytics`)

**Purpose**: Verify all Phase 4 analytics queries work correctly

**What it tests**:
1. **Video Performance Metrics**
   - Views, completion rate, watch time
   - Multi-day analytics aggregation

2. **7-Day Engagement Metrics**
   - Daily views and unique viewers
   - AI interaction counts
   - Trend analysis data

3. **AI Chat Analytics**
   - Cost tracking (tokens, USD)
   - Response time metrics
   - Model usage stats

4. **Usage Metrics**
   - Storage usage
   - AI credits consumed
   - Transcription minutes
   - Active students count

5. **Top Videos by Engagement**
   - Ranking by views + AI interactions
   - Completion rate analysis

6. **Session Analytics**
   - Message counts (user vs AI)
   - Session duration
   - Cost per session
   - Video reference tracking

**Run it**:
```bash
npm run test:analytics
```

**Expected output**:
```
📊 Testing Analytics Dashboard Queries

📈 Test 1: Video Performance Metrics...
✅ Found 5 videos with analytics

📊 Test 2: 7-Day Engagement Metrics...
✅ Retrieved 8 daily metric records

💬 Test 3: AI Chat Analytics...
✅ Retrieved 0 days of chat cost data (views may be empty if no analytics data)

💾 Test 4: Usage Metrics...
✅ Retrieved 4 days of usage data

🏆 Test 5: Top Videos by Engagement...
✅ Top videos query successful

📝 Test 6: Chat Session Analytics...
✅ Retrieved 2 session analytics

✅ Analytics Dashboard Test: PASSED
```

### 4. Full Integration Suite (`test:all`)

**Purpose**: Run all tests in sequence to verify end-to-end system health

**What it tests**:
1. Database connection
2. Schema verification (12 tables)
3. RLS policies
4. Seed data presence
5. Video pipeline (calls test script)
6. Analytics dashboard (calls test script)

**Run it**:
```bash
npm run test:all
```

**Expected output**:
```
🚀 Chronos - End-to-End Integration Test Suite
============================================================

🧪 Running: Database Connection
✅ Database Connection PASSED (245ms)

🧪 Running: Schema Verification
✅ Schema Verification PASSED (892ms)

🧪 Running: RLS Policies
✅ RLS Policies PASSED (456ms)

🧪 Running: Seed Data
✅ Seed Data PASSED (123ms)

🧪 Running: Video Pipeline
✅ Video Pipeline PASSED (3421ms)

🧪 Running: Analytics Dashboard
✅ Analytics Dashboard PASSED (1834ms)

============================================================
📊 TEST SUMMARY
============================================================

Total Tests: 6
✅ Passed: 6
❌ Failed: 0
⏱️  Total Duration: 6971ms

🎉 ALL TESTS PASSED! System is ready for integration testing.
```

## Troubleshooting

### "Missing Supabase credentials"

**Solution**: Add Supabase credentials to `.env.local`:
1. Go to https://supabase.com/dashboard/project/dddttlnrkwaddzjvkacp/settings/api
2. Copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - Anon/Public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Service role key → `SUPABASE_SERVICE_ROLE_KEY`

### "Table does not exist"

**Solution**: Run migrations first:
```bash
npm run db:migrate
```

### "RLS policy violation"

**Expected behavior**: Tests use the service role key which bypasses RLS.
If you see RLS errors, verify `SUPABASE_SERVICE_ROLE_KEY` is set correctly.

### "Chat analytics view is empty"

**Expected on first run**: The `chat_cost_analytics` view aggregates data from `chat_messages`.
If no messages have `cost_usd` data, the view will be empty. This is normal for fresh databases.

### "No seed data found"

**Solution**: Run the seed script:
```bash
npm run db:seed
```

## Manual Database Queries

You can also test queries manually via Supabase Studio:

```sql
-- Check all test data exists
SELECT 'creators' as table_name, COUNT(*) as count FROM creators
UNION ALL
SELECT 'students', COUNT(*) FROM students
UNION ALL
SELECT 'videos', COUNT(*) FROM videos
UNION ALL
SELECT 'video_analytics', COUNT(*) FROM video_analytics
UNION ALL
SELECT 'usage_metrics', COUNT(*) FROM usage_metrics;

-- Get test creator details
SELECT * FROM creators WHERE id = '00000000-0000-0000-0000-000000000001';

-- Get test student details
SELECT * FROM students WHERE id = '00000000-0000-0000-0000-000000000002';

-- Get all video analytics for test creator
SELECT v.title, va.*
FROM video_analytics va
JOIN videos v ON v.id = va.video_id
WHERE v.creator_id = '00000000-0000-0000-0000-000000000001'
ORDER BY va.date DESC;
```

## Next Steps After Testing

Once all tests pass:

1. **Test Whop OAuth Integration**
   - Set up Whop developer credentials
   - Test creator signup flow
   - Verify membership validation

2. **Test Video Upload**
   - Upload a real video file
   - Verify Supabase Storage integration
   - Test transcription with OpenAI Whisper

3. **Test RAG Chat**
   - Create embeddings with OpenAI
   - Test semantic search
   - Verify Claude AI responses with video citations

4. **Test Analytics Dashboard UI**
   - Visit `/dashboard/creator/overview`
   - Verify charts render correctly
   - Test date range filters

5. **Load Testing**
   - Test with multiple concurrent users
   - Verify rate limiting
   - Check database performance under load

## Cleanup

To remove test data and start fresh:

```sql
-- Run in Supabase SQL Editor
DELETE FROM videos WHERE creator_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM courses WHERE creator_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM students WHERE id = '00000000-0000-0000-0000-000000000002';
DELETE FROM creators WHERE id = '00000000-0000-0000-0000-000000000001';
```

Or reset the entire database:

```bash
npm run db:reset  # WARNING: Deletes ALL data!
npm run db:migrate
npm run db:seed
```

## Support

If tests fail unexpectedly:

1. Check the error messages in the test output
2. Verify `.env.local` has all required credentials
3. Ensure migrations ran successfully (`npm run db:migrate`)
4. Check Supabase dashboard for any service issues
5. Review the test script source in `scripts/` for detailed logic

---

**Last Updated**: 2025-01-10
**Phase**: 4 (Creator Analytics Dashboard)
**Status**: ✅ Ready for Integration Testing
