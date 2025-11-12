# Chronos Video Integration - Production Deployment Guide

**Last Updated:** November 12, 2025
**Target Environment:** Vercel Production
**Prerequisites:** Vercel account, Supabase project, API keys configured

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Variables](#environment-variables)
3. [Database Migrations](#database-migrations)
4. [Deployment Steps](#deployment-steps)
5. [Post-Deployment Verification](#post-deployment-verification)
6. [Rollback Procedure](#rollback-procedure)
7. [Monitoring Setup](#monitoring-setup)
8. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

### ⚠️ CRITICAL: Fix TypeScript Errors First

**Status:** ❌ **23 TypeScript errors must be fixed before deployment**

Before deploying, you **MUST** fix these errors:

```bash
npm run type-check
```

**Required Fixes:**

1. **Next.js 15 Async Params (3 files)**
   - `app/api/analytics/watch-sessions/[id]/end/route.ts`
   - `app/api/analytics/watch-sessions/[id]/route.ts`
   - `app/api/whop/products/[productId]/lessons/route.ts`

   **Change:**
   ```typescript
   // OLD (Next.js 14):
   export async function POST(
     req: NextRequest,
     { params }: { params: { id: string } }
   ) {
     const { id } = params; // ❌ Breaks in Next.js 15
   }

   // NEW (Next.js 15):
   export async function POST(
     req: NextRequest,
     { params }: { params: Promise<{ id: string }> }
   ) {
     const { id } = await params; // ✅ Correct
   }
   ```

2. **Environment Variable Access (3 files)**
   - `app/api/analytics/chat/cost/route.ts`
   - `app/api/analytics/chat/popular-questions/route.ts`
   - `app/api/analytics/chat/route.ts`

   **Change:**
   ```typescript
   // OLD:
   const url = process.env.NEXT_PUBLIC_SUPABASE_URL; // ❌ TypeScript error

   // NEW:
   const url = process.env['NEXT_PUBLIC_SUPABASE_URL']; // ✅ Correct
   ```

3. **Remove Unused Code**
   - Remove unused imports and variables
   - Fix type assertions in `app/api/analytics/courses/[id]/route.ts`

**Verify Build:**
```bash
npm run type-check  # Must pass with 0 errors
npm run build       # Must succeed
```

### Code Quality Checks

- [ ] TypeScript type-check passes (`npm run type-check`)
- [ ] Build succeeds (`npm run build`)
- [ ] Lint warnings reviewed (`npm run lint`)
- [ ] No console.errors in production code
- [ ] All environment variables documented

### Database Readiness

- [ ] All migrations applied to production Supabase
- [ ] Database backup created before deployment
- [ ] RLS policies verified
- [ ] Indexes created
- [ ] Foreign keys enforced

### API Keys & Credentials

- [ ] Whop API key active
- [ ] Supabase service role key secure
- [ ] OpenAI API key valid (Whisper + embeddings)
- [ ] Anthropic API key valid (Claude chat)
- [ ] Mux API token configured (if using Mux)
- [ ] Loom API key configured (optional)

### Testing Completed

- [ ] Staging environment tested
- [ ] All 4 video sources tested (YouTube, Loom, Whop, Upload)
- [ ] Analytics dashboard tested with real data
- [ ] Mobile responsiveness verified
- [ ] Browser compatibility tested

---

## Environment Variables

### Required Environment Variables

Add these to Vercel project settings:

#### Whop Integration (REQUIRED)
```bash
WHOP_API_KEY=whop_xxx                    # From Whop dashboard
WHOP_CLIENT_ID=xxx                       # OAuth client ID
WHOP_CLIENT_SECRET=xxx                   # OAuth client secret
WHOP_WEBHOOK_SECRET=xxx                  # Webhook signature verification
```

#### Supabase (REQUIRED)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx   # Public anon key
SUPABASE_SERVICE_ROLE_KEY=eyJxxx        # Private service role key
```

#### AI APIs (REQUIRED)
```bash
ANTHROPIC_API_KEY=sk-ant-xxx            # Claude 3.5 Haiku for chat
OPENAI_API_KEY=sk-xxx                   # Whisper transcription + embeddings
```

#### Mux (REQUIRED for Whop video hosting)
```bash
MUX_TOKEN_ID=xxx                         # Mux API token ID
MUX_TOKEN_SECRET=xxx                     # Mux API token secret
```

#### Loom (OPTIONAL - for Loom video imports)
```bash
LOOM_API_KEY=xxx                         # Loom API key (optional)
```

#### Infrastructure (REQUIRED)
```bash
VERCEL_KV_URL=xxx                        # Vercel KV Redis URL
UPSTASH_REDIS_REST_URL=xxx               # Upstash Redis REST URL
UPSTASH_REDIS_REST_TOKEN=xxx             # Upstash Redis token
```

#### Monitoring (OPTIONAL but recommended)
```bash
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

### Environment Variable Verification

After adding to Vercel:

1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Verify all required variables are present
3. Check no variables have trailing spaces
4. Ensure production, preview, and development environments configured
5. Redeploy to apply changes

---

## Database Migrations

### Migration Order (CRITICAL)

Apply these migrations to production Supabase **in this exact order**:

#### 1. Enable pgvector (if not already enabled)
```bash
File: supabase/migrations/20250101000001_enable_pgvector.sql
```

#### 2. Core tables (if not already created)
```bash
File: supabase/migrations/20250101000002_create_core_tables.sql
```

#### 3. Vector index (if not already created)
```bash
File: supabase/migrations/20250101000003_create_vector_index.sql
```

#### 4. Row Level Security (if not already applied)
```bash
File: supabase/migrations/20250101000004_row_level_security.sql
```

#### 5. **NEW:** Module Lessons Table
```bash
File: supabase/migrations/20250112000001_create_module_lessons.sql
```
**Purpose:** Course structure (modules → lessons)

#### 6. **NEW:** Whop Video Columns
```bash
File: supabase/migrations/20250112000002_add_whop_video_columns.sql
```
**Purpose:** Mux asset IDs, embed types, YouTube IDs, Loom URLs

#### 7. **NEW:** Video Analytics Events
```bash
File: supabase/migrations/20250112000003_create_video_analytics_events.sql
```
**Purpose:** Granular event tracking (play, pause, seek, etc.)

#### 8. **NEW:** Video Watch Sessions
```bash
File: supabase/migrations/20250112000004_create_video_watch_sessions.sql
```
**Purpose:** Session-based progress tracking

### Migration Application

**Option 1: Supabase Dashboard (Recommended)**

1. Go to Supabase Dashboard → SQL Editor
2. Open each migration file
3. Copy SQL content
4. Paste into SQL Editor
5. Click "Run" for each migration
6. Verify success (green checkmark)

**Option 2: Supabase CLI**

```bash
# Install Supabase CLI
npm install -g supabase

# Link to production project
supabase link --project-ref your-project-ref

# Apply migrations
supabase db push
```

### Verify Migrations

```sql
-- Check table exists
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'module_lessons',
  'video_analytics_events',
  'video_watch_sessions'
);

-- Check video columns added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'videos'
AND column_name IN (
  'source_type',
  'mux_asset_id',
  'mux_playback_id',
  'youtube_video_id',
  'loom_video_id',
  'embed_type'
);
```

**Expected:** All tables and columns should exist

---

## Deployment Steps

### Step 1: Prepare Code

```bash
# Ensure on main branch
git checkout main

# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Run type check
npm run type-check  # MUST PASS

# Run build locally
npm run build       # MUST SUCCEED
```

### Step 2: Create Production Branch (Optional)

```bash
# Create production branch
git checkout -b production

# Push to GitHub
git push origin production
```

### Step 3: Deploy to Vercel

**Option A: Automatic Deployment (Recommended)**

1. Push to `main` branch (or configured production branch)
2. Vercel automatically detects push
3. Build starts automatically
4. Deployment completes in 2-5 minutes

**Option B: Manual Deployment**

1. Go to Vercel Dashboard → Project
2. Click "Deployments" tab
3. Click "Deploy" button
4. Select branch to deploy
5. Click "Deploy"

### Step 4: Monitor Deployment

1. Watch build logs in Vercel Dashboard
2. Look for errors in build output
3. Verify deployment succeeded (green checkmark)
4. Note deployment URL

### Step 5: Configure Custom Domain (Optional)

1. Go to Vercel Dashboard → Project → Settings → Domains
2. Add custom domain
3. Configure DNS records as instructed
4. Wait for SSL certificate provisioning (5-30 minutes)

---

## Post-Deployment Verification

### Critical Functionality Checks

Complete these checks immediately after deployment:

#### 1. YouTube Video Import ✅
```
1. Navigate to /dashboard/creator/courses
2. Open a course
3. Click "Add Lesson"
4. Select "URL Import"
5. VideoSourceSelector opens
6. Select "YouTube" tab
7. Paste URL: https://www.youtube.com/watch?v=dQw4w9WgXcQ
8. Click "Fetch Preview"
9. Verify preview displays:
   - Thumbnail
   - Title
   - Channel
   - Duration
10. Click "Import Video"
11. Wait for completion (should be < 10 seconds)
12. Verify video appears in lesson list
```

#### 2. File Upload ✅
```
1. Open VideoSourceSelector
2. Select "Upload" tab
3. Drag a test MP4 file (< 100MB)
4. Verify upload progress bar
5. Wait for completion
6. Verify Whisper transcription triggered
7. Check video appears in library
```

#### 3. Analytics Dashboard ✅
```
1. Navigate to /dashboard/creator/analytics/videos
2. Verify dashboard loads
3. Check all charts render:
   - Metric cards (4 cards)
   - Views over time (line chart)
   - Completion rates (bar chart)
   - Cost breakdown (pie chart)
   - Storage usage (area chart)
   - Student engagement (heatmap)
   - Top videos (table)
4. Test date range picker
5. Test CSV export
```

#### 4. Database Persistence ✅
```
1. Create a new course
2. Add a module
3. Add a lesson with imported video
4. Save course
5. Refresh page
6. Verify course persists
7. Verify lesson still shows video
```

#### 5. API Endpoint Health ✅
```
# Test API routes
curl https://your-domain.com/api/courses
curl https://your-domain.com/api/analytics/videos/dashboard?creator_id=xxx&start=2025-01-01&end=2025-12-31
```

### Performance Checks

- [ ] Dashboard loads in < 3 seconds
- [ ] Video import completes in < 10 seconds (YouTube/Loom)
- [ ] Analytics queries return in < 2 seconds
- [ ] Page navigation is smooth (< 1 second)

### Mobile Responsive Check

- [ ] Open site on mobile device
- [ ] Test at 375px width (mobile)
- [ ] Verify video player fits screen
- [ ] Test touch controls work
- [ ] Check no horizontal scroll

### Browser Compatibility

- [ ] Test in Chrome
- [ ] Test in Firefox
- [ ] Test in Safari
- [ ] Test in Edge

---

## Rollback Procedure

### If Deployment Fails

**Immediate Rollback:**

1. Go to Vercel Dashboard → Deployments
2. Find previous successful deployment
3. Click three dots (•••) → "Promote to Production"
4. Confirm rollback
5. Wait 30-60 seconds for rollback to complete

### If Database Migration Fails

**Database Rollback:**

1. Go to Supabase Dashboard → Database → Migrations
2. Identify failing migration
3. Write rollback SQL:
   ```sql
   -- Example: Drop table if migration added it
   DROP TABLE IF EXISTS module_lessons CASCADE;
   ```
4. Run rollback SQL in SQL Editor
5. Verify database state
6. Re-apply previous migrations if needed

### If Critical Bug Discovered

**Emergency Procedure:**

1. **Immediately rollback** via Vercel
2. Add maintenance page to repository
3. Deploy maintenance page
4. Investigate bug in staging environment
5. Fix bug
6. Test extensively
7. Re-deploy when ready

---

## Monitoring Setup

### Sentry Error Tracking

**Setup Steps:**

1. Create Sentry project at sentry.io
2. Copy DSN from Sentry dashboard
3. Add to Vercel environment variables:
   ```bash
   SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
   NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
   ```
4. Redeploy application
5. Test error tracking by triggering a test error

**Monitor These:**
- API route errors
- Client-side JavaScript errors
- Video import failures
- Analytics query failures

### Vercel Analytics

**Enable:**

1. Go to Vercel Dashboard → Project → Analytics
2. Click "Enable Analytics"
3. Monitor:
   - Page load times
   - Core Web Vitals
   - Real User Monitoring (RUM)

### Database Monitoring

**Supabase Dashboard:**

1. Monitor database CPU usage
2. Monitor database memory usage
3. Monitor active connections
4. Set up alerts for:
   - High CPU (> 80%)
   - High memory (> 80%)
   - Connection limit (> 90%)

### Custom Alerts

**Set Up Alerts For:**
- Video import failures (> 5% failure rate)
- Slow analytics queries (> 5 seconds)
- Storage quota warnings (> 75%)
- API rate limit hits

---

## Troubleshooting

### Common Deployment Issues

#### Build Fails with TypeScript Errors

**Symptoms:** Build logs show TypeScript errors

**Solution:**
```bash
# Run type-check locally
npm run type-check

# Fix all errors
# See "Pre-Deployment Checklist" section

# Rebuild
npm run build
```

#### Environment Variables Not Found

**Symptoms:** Runtime errors about missing env variables

**Solution:**
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Verify all required variables present
3. Check variable names match exactly (case-sensitive)
4. Redeploy project to apply changes

#### Database Connection Fails

**Symptoms:** Supabase errors in logs

**Solution:**
1. Verify Supabase project is running
2. Check `NEXT_PUBLIC_SUPABASE_URL` is correct
3. Check `SUPABASE_SERVICE_ROLE_KEY` is valid
4. Test connection from Vercel deployment logs

#### Video Imports Fail

**Symptoms:** Videos stuck in "transcribing" status

**Solution:**
1. Check API key for OpenAI (Whisper)
2. Check API key for Anthropic (embeddings)
3. Verify Inngest is configured (if using)
4. Check Supabase Storage bucket exists
5. Review error logs in Sentry

#### Analytics Dashboard Shows No Data

**Symptoms:** Empty charts, no metrics

**Solution:**
1. Verify database migrations applied
2. Check RLS policies allow reads
3. Test API endpoint manually:
   ```bash
   curl https://your-domain.com/api/analytics/videos/dashboard?creator_id=xxx
   ```
4. Check date range is correct
5. Verify creator has videos with analytics

#### Slow Performance

**Symptoms:** Dashboard loads > 5 seconds

**Solution:**
1. Check database indexes created
2. Review slow query logs in Supabase
3. Enable Vercel Edge Caching
4. Optimize analytics queries
5. Consider implementing pagination

---

## Production Readiness Checklist

Before marking deployment as complete:

### Code
- [ ] All TypeScript errors fixed
- [ ] Build succeeds locally
- [ ] No console.errors in production

### Database
- [ ] All 8 migrations applied
- [ ] RLS policies active
- [ ] Indexes created
- [ ] Foreign keys enforced
- [ ] Backup created

### Environment
- [ ] All 15+ environment variables configured
- [ ] Secrets are secure (not committed to git)
- [ ] Production, preview, development environments set

### Testing
- [ ] YouTube import tested
- [ ] Loom import tested
- [ ] Whop import tested (if applicable)
- [ ] File upload tested
- [ ] Analytics dashboard tested
- [ ] Mobile responsive tested
- [ ] Browser compatibility tested

### Monitoring
- [ ] Sentry error tracking configured
- [ ] Vercel Analytics enabled
- [ ] Supabase monitoring active
- [ ] Custom alerts configured

### Documentation
- [ ] Deployment guide created (this document)
- [ ] User guide created
- [ ] API documentation updated
- [ ] Troubleshooting guide available

---

## Post-Deployment Tasks

### Day 1
- [ ] Monitor error rates (Sentry)
- [ ] Monitor performance (Vercel Analytics)
- [ ] Check database load (Supabase)
- [ ] Verify all video imports working
- [ ] Test analytics accuracy

### Week 1
- [ ] Gather user feedback
- [ ] Monitor storage usage
- [ ] Review API costs (OpenAI, Anthropic)
- [ ] Check completion rates
- [ ] Identify bottlenecks

### Month 1
- [ ] Review analytics trends
- [ ] Optimize slow queries
- [ ] Plan feature enhancements
- [ ] Review cost efficiency
- [ ] Update documentation as needed

---

## Support & Resources

### Documentation
- **User Guide:** `docs/USER_GUIDE.md`
- **API Reference:** `docs/api/reference.md`
- **Architecture:** `docs/architecture/IMPLEMENTATION_PLAN.md`
- **Testing Report:** `docs/TESTING_REPORT.md`

### External Resources
- **Vercel Docs:** https://vercel.com/docs
- **Supabase Docs:** https://supabase.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **Whop Docs:** https://docs.whop.com

### Emergency Contacts
- **Vercel Support:** https://vercel.com/support
- **Supabase Support:** support@supabase.io
- **Sentry Support:** https://sentry.io/support

---

**Deployment Guide Version:** 1.0
**Last Updated:** November 12, 2025
**Next Review:** After first production deployment

---

Assisted by Jimmy Solutions Developer at Agentic Personnel LLC <Jimmy@AgenticPersonnel.com>
