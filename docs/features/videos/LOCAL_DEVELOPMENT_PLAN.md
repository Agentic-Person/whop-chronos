# Chronos Video System - Local Development Plan

**Last Updated:** November 20, 2025
**Status:** Active Implementation
**Estimated Time:** ~51 minutes

---

## Overview

This plan outlines the steps to get the Chronos video processing system fully functional for local development. The main blocker (CHRON-002) is that videos get stuck at 50% progress because the Inngest Dev Server is not running. This plan resolves that issue and removes unnecessary email functionality.

---

## Prerequisites

- Node.js installed
- npm/npx available
- Supabase CLI installed
- 2 terminal windows available
- Environment variables configured (`.env.local`)

---

## Phase 0: Documentation ✅

**Status:** Complete
**Time:** 5 minutes

This document serves as the implementation guide.

---

## Phase 1: Remove Email/Report Features

**Status:** In Progress
**Time:** 15 minutes
**Goal:** Strip out all scheduled report and email functionality

### Task 1.1: Delete Email-Related Files

**Files to DELETE:**
```
inngest/send-scheduled-reports.ts
lib/email/report-mailer.ts
lib/reports/pdf-generator.ts
app/api/reports/ (entire directory)
app/dashboard/creator/settings/reports/ (entire directory)
supabase/migrations/20251120000002_create_report_schedules.sql
```

### Task 1.2: Update Inngest Configuration

**File:** `inngest/index.ts`

**Remove:**
- Import statement for `sendScheduledReportsFunction`
- Function from exports array
- Update comment from 11 → 10 functions

### Task 1.3: Uninstall Dependencies

**Commands:**
```bash
npm uninstall resend jspdf
```

### Task 1.4: Clean Environment Variables

**File:** `.env.local`

**Remove these lines:**
```bash
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=noreply@...
```

---

## Phase 2: Fix CHRON-002 Critical Blocker

**Status:** Pending
**Time:** 10 minutes
**Goal:** Make Inngest Dev Server requirement crystal clear

### Task 2.1: Update CLAUDE.md

**File:** `CLAUDE.md`

**Changes in Development Commands section:**

**BEFORE:**
```bash
# OPTIONAL: Start Inngest Dev Server (for background job debugging)
# NOTE: Currently YouTube import has broken frontend so this doesn't matter
npx inngest-cli dev -u http://localhost:3007/api/inngest
```

**AFTER:**
```bash
# CRITICAL: Start Inngest Dev Server (REQUIRED - NOT OPTIONAL)
# ⚠️ WITHOUT THIS, VIDEO PROCESSING STOPS AT 50%
# Terminal 1: Start Next.js
npm run dev

# Terminal 2: Start Inngest Dev Server (REQUIRED)
npx inngest-cli dev -u http://localhost:3007/api/inngest

# Inngest Dashboard: http://localhost:8288
```

**Update function count:**
- Old: "11 functions registered"
- New: "10 functions registered (6 core + 4 P0)"

### Task 2.2: Create Quick Start Guide

**File:** `docs/guides/QUICK_START_LOCAL.md`

**Contents:**
```markdown
# Quick Start - Local Development

## 1. Install Dependencies
npm install

## 2. Configure Environment
cp .env.example .env.local
# Add your API keys (Supabase, Anthropic, OpenAI)

## 3. Apply Database Migrations
npx supabase db push

## 4. Start Development Servers (2 terminals)

### Terminal 1: Next.js
npm run dev

### Terminal 2: Inngest Dev Server (REQUIRED)
npx inngest-cli dev -u http://localhost:3007/api/inngest

## 5. Open Application
- App: http://localhost:3007
- Inngest Dashboard: http://localhost:8288

## 6. Test Video Import
1. Go to http://localhost:3007/dashboard/creator/videos
2. Click "Import Video"
3. Enter YouTube URL
4. Watch progress: 0% → 100% (should complete in 30-60 seconds)
5. Verify in Inngest dashboard at http://localhost:8288

## Troubleshooting

### Videos stuck at 50%?
- Check Terminal 2 - Is Inngest Dev Server running?
- Check http://localhost:8288 - Do you see 10 functions registered?
- Check console for errors

### AI Chat not working?
- Videos need to complete to 100% first
- Check database: Do video_chunks have embeddings?
- Try re-processing video: Bulk Operations → Reprocess

### Authentication errors?
- Check .env.local has DEV_BYPASS_AUTH=true
- Restart both dev servers
```

---

## Phase 3: Install Dependencies

**Status:** Pending
**Time:** 1 minute
**Goal:** Ensure all required packages installed (no email deps)

### Task 3.1: Verify Package.json

**Should NOT include:**
- `resend`
- `jspdf`

**Should include:**
- `@anthropic-ai/sdk`
- `openai`
- `inngest`
- All other existing dependencies

---

## Phase 4: Apply Database Migrations

**Status:** Pending
**Time:** 5 minutes
**Goal:** Apply only the 2 needed migrations

### Task 4.1: Verify Migration Files Exist

**Required migrations:**
1. `supabase/migrations/20251120000001_create_analytics_cache.sql` ✅
2. `supabase/migrations/20251120000003_create_bulk_operations.sql` ✅

**Deleted migration:**
3. ~~`supabase/migrations/20251120000002_create_report_schedules.sql`~~ ❌

### Task 4.2: Check Migration Status

```bash
# Option 1: Check if tables exist
# Query Supabase dashboard for:
# - analytics_cache
# - bulk_operations

# Option 2: Re-apply all migrations
npx supabase db push
```

---

## Phase 5: Test Video Pipeline

**Status:** Pending
**Time:** 20 minutes
**Goal:** Verify complete end-to-end video processing

### Task 5.1: Test YouTube Import (10 min)

**Steps:**
1. Start both dev servers (Next.js + Inngest)
2. Navigate to http://localhost:3007/dashboard/creator/videos
3. Click "Import Video" → YouTube tab
4. Enter test URL: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
5. Click "Import"

**Expected Results:**
- ✅ Progress bar: 0% → 10% → 25% → 50% → 75% → 100%
- ✅ Status updates: Pending → Uploading → Transcribing → Processing → Embedding → Completed
- ✅ Inngest dashboard shows events (http://localhost:8288)
- ✅ Video appears in library with thumbnail
- ✅ Completion time: 30-60 seconds

**Inngest Events to Watch:**
1. `video/transcription.completed` → triggers extractTranscriptFunction
2. `video/transcript.extracted` → triggers generateEmbeddingsFunction
3. `video/embeddings.generated` → video marked complete

### Task 5.2: Test CourseBuilder (5 min)

**Steps:**
1. Navigate to http://localhost:3007/dashboard/creator/courses
2. Click "Create Course"
3. Add module, add lesson
4. Select imported video from library
5. Verify video thumbnail displays
6. Click video to test playback

**Expected Results:**
- ✅ Video thumbnail shows YouTube thumbnail
- ✅ Video title and metadata correct
- ✅ Video plays in YouTube player
- ✅ Progress tracking works

### Task 5.3: Test AI Chat (5 min)

**Steps:**
1. Navigate to http://localhost:3007/dashboard/student/chat
2. Start new chat session
3. Ask: "What is this video about?"
4. Ask: "Summarize the main points"

**Expected Results:**
- ✅ AI responds with video content
- ✅ Responses include timestamp citations
- ✅ Semantic search finds relevant chunks
- ✅ Citations link to correct video timestamps

### Task 5.4: Test Bulk Operations (Optional)

**Bulk Delete:**
1. Select multiple videos
2. Click "Delete Selected"
3. Monitor progress bar
4. Verify videos deleted from storage + database

**Bulk Export:**
1. Select videos
2. Click "Export to CSV"
3. Monitor progress
4. Download CSV file

**Bulk Reprocess:**
1. Select videos with failed embeddings
2. Click "Reprocess"
3. Monitor progress
4. Verify embeddings regenerated

---

## Phase 6: Update Documentation

**Status:** Pending
**Time:** 10 minutes
**Goal:** Ensure all docs reflect current state

### Task 6.1: Update PROJECT_STATUS.md

**File:** `docs/PROJECT_STATUS.md`

**Changes:**
1. Move CHRON-002 from "Active Blockers" to "Resolved Blockers"
2. Add resolution date and details
3. Update Inngest function count: 11 → 10
4. Remove all scheduled reports mentions
5. Update production readiness score if needed

**Add to Resolved Blockers section:**
```markdown
### CHRON-002: Video Processing Pipeline Stuck at 50% (P0) ✅ **RESOLVED**
**Severity:** CRITICAL (was)
**Priority:** P0 BLOCKER (was)
**Resolution Date:** November 20, 2025

**Problem:**
Videos stuck at "Chunking content" stage (50% progress) because Inngest Dev Server was not running.

**Root Cause:**
Documentation incorrectly marked Inngest as "OPTIONAL" when it's actually REQUIRED for video processing.

**Resolution:**
1. Updated CLAUDE.md to mark Inngest as REQUIRED
2. Created clear 2-terminal startup instructions
3. Added troubleshooting guide
4. Removed email/report features (reduced to 10 functions)

**Status:** ✅ FULLY RESOLVED
```

### Task 6.2: Update INNGEST_FUNCTIONS.md

**File:** `docs/features/videos/INNGEST_FUNCTIONS.md`

**Changes:**
1. Update function count from 11 → 10
2. Remove entire "Scheduled Reports" section
3. Remove jsPDF and Resend from dependencies
4. Update P0 functions list from 5 → 4

---

## Final Inngest Functions (10 Total)

### Core Video Processing (6 functions)
1. **transcribeVideoFunction** - Whisper API for uploaded videos
2. **extractTranscriptFunction** - Route to correct extractor (YouTube/Loom/Mux/Upload)
3. **handleTranscriptExtractionError** - Error recovery for transcription
4. **generateEmbeddingsFunction** - Chunk + embed transcripts
5. **handleEmbeddingFailure** - Error recovery for embeddings
6. **batchReprocessEmbeddings** - Bulk recovery for failed videos

### P0 Enhanced Features (4 functions)
7. **aggregateAnalyticsFunction** - Cron every 6 hours for dashboard caching
8. **bulkDeleteVideosFunction** - Batch delete videos + storage cleanup
9. **bulkExportVideosFunction** - Generate CSV exports
10. **bulkReprocessVideosFunction** - Batch re-trigger embeddings

---

## Success Criteria

After completing all phases:

### Critical (Must Pass)
- ✅ Videos complete processing to 100%
- ✅ Embeddings generated successfully
- ✅ AI chat responds with video content
- ✅ Inngest dashboard shows 10 functions
- ✅ No email/report code remains
- ✅ Documentation accurate and complete

### Important (Should Pass)
- ✅ CourseBuilder displays videos correctly
- ✅ Bulk operations work (delete, export, reprocess)
- ✅ Analytics dashboard loads <500ms
- ✅ All 123 tests still passing

### Nice to Have
- ✅ Clear troubleshooting guide available
- ✅ Future developers can start easily

---

## Timeline Summary

| Phase | Time | Status |
|-------|------|--------|
| Phase 0: Documentation | 5 min | ✅ Complete |
| Phase 1: Remove Email Features | 15 min | 🔄 In Progress |
| Phase 2: Fix CHRON-002 | 10 min | ⏳ Pending |
| Phase 3: Dependencies | 1 min | ⏳ Pending |
| Phase 4: Migrations | 5 min | ⏳ Pending |
| Phase 5: Testing | 20 min | ⏳ Pending |
| Phase 6: Documentation | 10 min | ⏳ Pending |
| **Total** | **66 min** | **~1 hour** |

---

## Common Issues & Solutions

### Issue: Videos still stuck at 50%
**Solution:**
1. Check Terminal 2 - Is Inngest Dev Server running?
2. Restart Inngest: Ctrl+C, then `npx inngest-cli dev -u http://localhost:3007/api/inngest`
3. Check http://localhost:8288 - Should show 10 functions

### Issue: AI Chat says "No videos found"
**Solution:**
1. Videos must complete to 100% first
2. Check database: `SELECT * FROM video_chunks WHERE video_id = 'xxx'`
3. If no chunks, trigger reprocess from bulk operations

### Issue: Inngest dashboard shows 0 functions
**Solution:**
1. Check Next.js dev server is running on port 3007
2. Check endpoint: http://localhost:3007/api/inngest
3. Restart both servers

### Issue: Missing environment variables
**Solution:**
1. Check `.env.local` has all required keys
2. Required: SUPABASE_*, ANTHROPIC_API_KEY, OPENAI_API_KEY
3. NOT required: RESEND_*, WHOP_* (if DEV_BYPASS_AUTH=true)

---

## Next Steps After Completion

1. **Production Deployment:**
   - Follow `docs/deployment/INNGEST_PRODUCTION_SETUP.md`
   - Get Inngest Cloud API keys (free tier: 50,000 events/month)
   - Deploy to Vercel

2. **Additional Testing:**
   - Test all 4 video import methods
   - Test with longer videos (30+ minutes)
   - Test concurrent imports
   - Load test with 100+ videos

3. **Feature Additions:**
   - Advanced analytics
   - Video annotations
   - AI quiz generation (future)
   - Learning calendar (future)

---

**Document Version:** 1.0
**Last Updated:** November 20, 2025
**Maintained By:** Development Team
