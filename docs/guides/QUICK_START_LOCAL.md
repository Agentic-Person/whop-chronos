# Quick Start - Local Development

**Last Updated:** November 20, 2025
**Estimated Setup Time:** 10 minutes

---

## Prerequisites

Before you begin, ensure you have:

- Node.js 20+ installed
- npm or pnpm package manager
- Git installed
- 2 terminal windows available
- Text editor (VS Code recommended)

---

## Step 1: Install Dependencies (2 minutes)

```bash
# Navigate to project directory
cd chronos

# Install all packages
npm install

# Verify installation
npm list inngest openai @anthropic-ai/sdk
```

**Expected Output:**
```
├── inngest@3.45.0
├── openai@6.8.1
└── @anthropic-ai/sdk@0.68.0
```

---

## Step 2: Configure Environment Variables (3 minutes)

### 2.1 Copy Environment Template

```bash
# Create .env.local from template
cp .env.example .env.local
```

### 2.2 Add Required API Keys

Edit `.env.local` and add your keys:

```bash
# Supabase (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# AI APIs (REQUIRED for video processing)
ANTHROPIC_API_KEY=sk-ant-api03-...
OPENAI_API_KEY=sk-proj-...

# Development Features (REQUIRED for local testing)
DEV_BYPASS_AUTH=true
NEXT_PUBLIC_DEV_BYPASS_AUTH=true
DEV_SIMPLE_NAV=true
NEXT_PUBLIC_DEV_SIMPLE_NAV=true

# Inngest (Optional - will use dev server)
INNGEST_EVENT_KEY=evt_xxxxx
INNGEST_SIGNING_KEY=sig_xxxxx
```

### 2.3 Where to Get API Keys

**Supabase:**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Settings → API → Copy `anon public` and `service_role` keys

**Anthropic:**
1. Go to https://console.anthropic.com/
2. API Keys → Create Key
3. Copy the key starting with `sk-ant-api03-`

**OpenAI:**
1. Go to https://platform.openai.com/api-keys
2. Create new secret key
3. Copy the key starting with `sk-proj-`

---

## Step 3: Apply Database Migrations (2 minutes)

### Option 1: Using Supabase CLI (Recommended)

```bash
# Link to your Supabase project (first time only)
npx supabase link --project-ref your-project-ref

# Apply all migrations
npx supabase db push
```

### Option 2: Manual Migration

1. Go to Supabase Dashboard → SQL Editor
2. Run each migration file in `supabase/migrations/` in order
3. Verify tables exist in Table Editor

### Expected Tables

After migration, you should have these tables:
- `creators`
- `students`
- `videos`
- `video_chunks` (with vector extension)
- `courses`
- `course_modules`
- `module_lessons`
- `chat_sessions`
- `chat_messages`
- `video_analytics_events`
- `video_watch_sessions`
- `student_courses`
- `lesson_notes`
- `analytics_cache` (new)
- `bulk_operations` (new)

---

## Step 4: Start Development Servers (1 minute)

**⚠️ CRITICAL: You MUST run BOTH servers for video processing to work**

### Terminal 1: Next.js Dev Server

```bash
npm run dev
```

**Expected Output:**
```
  ▲ Next.js 16.0.0
  - Local:        http://localhost:3007
  - Ready in 3.2s
```

### Terminal 2: Inngest Dev Server (REQUIRED)

```bash
npx inngest-cli dev -u http://localhost:3007/api/inngest
```

**Expected Output:**
```
✓ Inngest Dev Server running
✓ Functions registered: 10
✓ Dashboard: http://localhost:8288
```

**⚠️ WITHOUT Terminal 2, videos will get stuck at 50% progress!**

---

## Step 5: Verify Setup (2 minutes)

### 5.1 Open Application

**Main App:**
```
http://localhost:3007
```

**Inngest Dashboard:**
```
http://localhost:8288
```

### 5.2 Check Inngest Functions

Go to http://localhost:8288 → Functions

**You should see 10 functions:**

**Core Video Processing (6):**
1. transcribeVideoFunction
2. extractTranscriptFunction
3. handleTranscriptExtractionError
4. generateEmbeddingsFunction
5. handleEmbeddingFailure
6. batchReprocessEmbeddings

**Enhanced Features (4):**
7. aggregateAnalyticsFunction
8. bulkDeleteVideosFunction
9. bulkExportVideosFunction
10. bulkReprocessVideosFunction

### 5.3 Access Dashboards

**Creator Dashboard:**
```
http://localhost:3007/dashboard/creator
```

**Student Dashboard:**
```
http://localhost:3007/dashboard/student
```

**Switch Between Dashboards:**
- With `DEV_SIMPLE_NAV=true`, you'll see "Student" tab in creator nav
- Click it to quickly switch to student dashboard

---

## Step 6: Test Video Import (3 minutes)

### 6.1 Import a YouTube Video

1. Navigate to **http://localhost:3007/dashboard/creator/videos**
2. Click **"Import Video"** button
3. Select **"YouTube"** tab
4. Enter test URL: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
5. Click **"Import"**

### 6.2 Monitor Progress

**Watch the progress bar:**
- ✅ 0% → Pending
- ✅ 10% → Uploading
- ✅ 25% → Transcribing
- ✅ 50% → Processing (chunking)
- ✅ 75% → Embedding
- ✅ 100% → Completed

**Expected completion time:** 30-60 seconds

### 6.3 Verify in Inngest Dashboard

Go to http://localhost:8288 → Events

**You should see 3 events:**
1. `video/transcription.completed` → triggers extractTranscriptFunction
2. `video/transcript.extracted` → triggers generateEmbeddingsFunction
3. `video/embeddings.generated` → marks video complete

---

## Step 7: Test AI Chat (2 minutes)

### 7.1 Open Student Chat

Navigate to:
```
http://localhost:3007/dashboard/student/chat
```

### 7.2 Ask Questions

**Try these prompts:**
- "What is this video about?"
- "Summarize the main points"
- "What happens at 1:30?"

### 7.3 Expected Results

- ✅ AI responds with video content
- ✅ Responses include timestamp citations
- ✅ Citations link to correct video timestamps
- ✅ Semantic search finds relevant chunks

---

## Common Issues & Solutions

### Issue: "Videos stuck at 50%"

**Solution:**
1. Check Terminal 2 - Is Inngest Dev Server running?
2. Check http://localhost:8288 - Do you see 10 functions?
3. If not, restart: Ctrl+C, then `npx inngest-cli dev -u http://localhost:3007/api/inngest`
4. Re-import the video

### Issue: "AI Chat says 'No videos found'"

**Solution:**
1. Videos must complete to 100% first (check creator dashboard)
2. Wait for embeddings to be generated (watch Inngest dashboard)
3. If stuck, use Bulk Operations → Reprocess

### Issue: "Inngest dashboard shows 0 functions"

**Solution:**
1. Check Next.js is running on port 3007
2. Check endpoint: http://localhost:3007/api/inngest (should return JSON)
3. Restart both servers (Terminal 1 and 2)

### Issue: "Authentication errors"

**Solution:**
1. Verify `.env.local` has `DEV_BYPASS_AUTH=true`
2. Restart both dev servers
3. Clear browser cookies for localhost:3007

### Issue: "Missing environment variables"

**Solution:**
1. Check `.env.local` exists in project root
2. Verify all REQUIRED keys are set (Supabase, Anthropic, OpenAI)
3. Restart dev server after adding keys

### Issue: "Cannot find module 'inngest'"

**Solution:**
1. Run `npm install` again
2. Check `package.json` has `"inngest": "^3.45.0"`
3. Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`

---

## Development Workflow

### Daily Startup

```bash
# Terminal 1
npm run dev

# Terminal 2
npx inngest-cli dev -u http://localhost:3007/api/inngest
```

### When Making Code Changes

- Next.js auto-reloads on file changes
- Inngest Dev Server may need restart for function changes
- To restart Inngest: Ctrl+C in Terminal 2, then re-run command

### Testing Video Pipeline

1. Import video (YouTube/Loom recommended - FREE transcripts)
2. Monitor Inngest dashboard for events
3. Check database for embeddings
4. Test AI chat with new video

---

## Next Steps

After completing setup:

1. **Explore Features:**
   - Try all 4 video import methods (YouTube, Loom, Whop, Upload)
   - Create a course in CourseBuilder
   - Test analytics dashboard
   - Try bulk operations

2. **Read Documentation:**
   - `docs/features/videos/LOCAL_DEVELOPMENT_PLAN.md` - Full implementation plan
   - `docs/PROJECT_STATUS.md` - Current project status
   - `docs/features/videos/INNGEST_FUNCTIONS.md` - Inngest functions guide

3. **Run Tests:**
   ```bash
   npm run test
   npm run type-check
   ```

4. **Production Deployment:**
   - Follow `docs/deployment/INNGEST_PRODUCTION_SETUP.md`
   - Get Inngest Cloud API keys
   - Deploy to Vercel

---

## Quick Reference

**Key URLs:**
- App: http://localhost:3007
- Inngest Dashboard: http://localhost:8288
- Creator Dashboard: http://localhost:3007/dashboard/creator
- Student Dashboard: http://localhost:3007/dashboard/student

**Required Terminals:**
1. `npm run dev` (Next.js)
2. `npx inngest-cli dev -u http://localhost:3007/api/inngest` (Inngest)

**Test Video URLs:**
- YouTube: https://www.youtube.com/watch?v=dQw4w9WgXcQ
- Loom: https://www.loom.com/share/your-video-id

**Function Count:**
- Expected: 10 functions
- See http://localhost:8288 → Functions

---

## Support

**Issues:**
- Check `docs/features/videos/LOCAL_DEVELOPMENT_PLAN.md` for troubleshooting
- Review Inngest dashboard for event logs
- Check browser console for errors

**Documentation:**
- Project Status: `docs/PROJECT_STATUS.md`
- Video Features: `docs/features/videos/`
- API Reference: `docs/api/QUICK_REFERENCE.md`

---

**Happy Coding! 🚀**
