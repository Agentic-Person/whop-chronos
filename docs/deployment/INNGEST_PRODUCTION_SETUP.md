# Inngest Cloud Production Setup Guide

**Date:** November 20, 2025
**Status:** Ready for deployment
**Prerequisite:** Inngest Cloud account created

---

## Overview

This guide walks you through setting up Inngest Cloud for production video processing. The video processing pipeline requires Inngest to run background jobs (chunking, embeddings, transcription).

**What you're fixing:** Videos stuck at 50% "Chunking content" - root cause is Inngest not configured for production.

---

## Step 1: Get Inngest Production Keys

You're currently on the Inngest dashboard "Sync" screen. Here's what to do:

### 1.1 Click "Sync manually" Button

On the sync screen, you should see a button that says **"Sync manually"** or **"Continue with manual setup"**.

Click this button.

### 1.2 Copy the Keys

Inngest will display two environment variables:

```bash
INNGEST_EVENT_KEY=evt_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
INNGEST_SIGNING_KEY=signkey_prod_xxxxxxxxxxxxxxxxxxxxxxxxx
```

**CRITICAL:** Copy both of these keys. You'll need them in the next step.

**What these keys do:**
- `INNGEST_EVENT_KEY` - Allows your app to send events to Inngest Cloud
- `INNGEST_SIGNING_KEY` - Verifies webhook signatures from Inngest

---

## Step 2: Add Keys to Vercel

### 2.1 Open Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Select your Chronos project
3. Click **Settings** → **Environment Variables**

### 2.2 Add INNGEST_EVENT_KEY

1. Click **Add New**
2. Enter name: `INNGEST_EVENT_KEY`
3. Paste the value from Inngest (starts with `evt_`)
4. Select environments:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
5. Click **Save**

### 2.3 Add INNGEST_SIGNING_KEY

1. Click **Add New** again
2. Enter name: `INNGEST_SIGNING_KEY`
3. Paste the value from Inngest (starts with `signkey_`)
4. Select environments:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
5. Click **Save**

### 2.4 Verify Both Keys Added

You should now see both environment variables in the list:
- `INNGEST_EVENT_KEY` - Set for all environments
- `INNGEST_SIGNING_KEY` - Set for all environments

---

## Step 3: Deploy to Vercel

### 3.1 Trigger Deployment

You have two options:

**Option A: Push to Git (Recommended)**
```bash
# Ensure latest code is committed
git add .
git commit -m "chore(deployment): configure Inngest Cloud production keys"
git push origin main
```

Vercel will automatically detect the push and start deploying.

**Option B: Manual Deploy from Vercel**
1. Go to Vercel Dashboard → Deployments
2. Click **Deploy** button
3. Select `main` branch
4. Click **Deploy**

### 3.2 Monitor Deployment

1. Go to Vercel Dashboard → Deployments
2. Click on the deployment in progress
3. Watch the build logs
4. Wait for "Build Complete" (usually 2-5 minutes)
5. Note the deployment URL (e.g., `https://chronos-ai.vercel.app`)

---

## Step 4: Complete Inngest Sync

### 4.1 Return to Inngest Dashboard

Go back to the Inngest dashboard sync screen.

### 4.2 Enter Your Production URL

Inngest needs to know where your app is deployed.

Enter your production URL in this format:
```
https://your-domain.com/api/inngest
```

**Example:**
```
https://chronos-ai.vercel.app/api/inngest
```

### 4.3 Click "Sync App"

Inngest will now:
1. Send a request to `https://your-domain.com/api/inngest`
2. Discover your 6 background functions
3. Register them in Inngest Cloud

### 4.4 Verify Functions Discovered

After sync completes, you should see:

```
✅ 6 functions discovered
   - video/transcribe.youtube
   - video/extract-transcript
   - video/chunk-transcript
   - video/generate-embeddings
   - video/process-upload
   - video/recovery
```

---

## Step 5: Verify Video Processing Works

### 5.1 Import a Test Video

1. Open your production app: `https://your-domain.com`
2. Login as a creator
3. Navigate to `/dashboard/creator/videos`
4. Click **Add Video**
5. Select **YouTube** tab
6. Paste URL: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
7. Click **Import**

### 5.2 Watch Processing Progress

The video should now progress through all stages:

```
1. Pending (0%)           → ✅ Should complete instantly
2. Uploading (25%)        → ✅ Should complete in 2-3 seconds
3. Transcribing (50%)     → ✅ Should complete in 10-15 seconds
4. Processing (75%)       → ✅ Should complete in 5-10 seconds
5. Embedding (90%)        → ✅ Should complete in 10-20 seconds
6. Completed (100%)       → ✅ DONE
```

**CRITICAL:** If the video gets stuck at 50% (Chunking), Inngest is not configured correctly. Go back to Step 4.

### 5.3 Check Inngest Dashboard

1. Go to Inngest Cloud dashboard
2. Click **Functions** in sidebar
3. You should see recent executions for:
   - `video/extract-transcript` - Should show "Completed"
   - `video/chunk-transcript` - Should show "Completed"
   - `video/generate-embeddings` - Should show "Completed"

### 5.4 Verify in Database

Check that the video has embeddings:

```sql
-- Run in Supabase SQL Editor
SELECT
  v.id,
  v.title,
  v.status,
  COUNT(vc.id) as chunk_count
FROM videos v
LEFT JOIN video_chunks vc ON vc.video_id = v.id
WHERE v.title LIKE '%Rick Astley%'
GROUP BY v.id, v.title, v.status;
```

**Expected result:**
- `status` = "completed"
- `chunk_count` > 0 (should have chunks with embeddings)

---

## Step 6: Recover Stuck Videos (If Any)

If you have videos that were stuck at 50% before setting up Inngest, you need to recover them.

### 6.1 Option A: Use Admin Panel

1. Navigate to `/dashboard/creator/videos/debug`
2. Check Inngest health status (should be green)
3. Review list of stuck videos
4. Click **Retry All Stuck Videos**
5. Wait for recovery to complete (1-2 minutes per video)

### 6.2 Option B: Use Recovery Script

```bash
# Run the recovery script
npx tsx scripts/trigger-embeddings.ts
```

This will:
1. Find all videos stuck at "processing" status
2. Re-trigger the chunking and embedding jobs
3. Monitor progress in Inngest dashboard

### 6.3 Verify Recovery

Check that stuck videos now show "completed" status:

```sql
-- Run in Supabase SQL Editor
SELECT id, title, status, error_message
FROM videos
WHERE status IN ('processing', 'failed')
ORDER BY created_at DESC;
```

**Expected:** No videos stuck in "processing" status.

---

## Step 7: Enable Auto-Recovery Cron Job

The 5-agent fix included an auto-recovery cron job that runs every 5 minutes on Vercel.

### 7.1 Verify Cron Job Configured

Check `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/cron/recover-stuck-videos",
    "schedule": "*/5 * * * *"
  }]
}
```

✅ This is already configured (done by Agent 4).

### 7.2 Add CRON_SECRET to Vercel

For security, the cron job requires authentication:

1. Generate a secret:
   ```bash
   openssl rand -hex 32
   ```

2. Add to Vercel Environment Variables:
   - Name: `CRON_SECRET`
   - Value: (the generated hex string)
   - Environments: Production, Preview, Development

3. Redeploy to apply changes

### 7.3 Test Cron Job Manually

Trigger the cron job manually to verify it works:

```bash
curl -X POST https://your-domain.com/api/cron/recover-stuck-videos \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Expected response:**
```json
{
  "success": true,
  "message": "Recovery completed",
  "videosRecovered": 0,
  "errors": []
}
```

### 7.4 Monitor Cron Job in Vercel

1. Go to Vercel Dashboard → Cron Jobs
2. You should see `/api/cron/recover-stuck-videos` listed
3. Check **Last Run** and **Status**
4. Verify it runs every 5 minutes

---

## Troubleshooting

### Issue: Inngest Can't Reach Endpoint

**Symptoms:** Inngest sync fails with "Unable to reach endpoint"

**Solutions:**
1. Verify deployment succeeded in Vercel
2. Test endpoint manually:
   ```bash
   curl https://your-domain.com/api/inngest
   ```
   Expected: JSON response with `{ "message": "Inngest endpoint" }`

3. Check Vercel deployment logs for errors
4. Verify environment variables are set correctly

### Issue: Functions Not Discovered

**Symptoms:** Inngest shows "0 functions discovered"

**Solutions:**
1. Check that `app/api/inngest/route.ts` exists
2. Verify functions are defined in `inngest/functions/index.ts`
3. Check build logs for TypeScript errors
4. Redeploy and try sync again

### Issue: Videos Still Stuck at 50%

**Symptoms:** Videos still stuck even after Inngest setup

**Solutions:**
1. Check Inngest Cloud dashboard for errors
2. Verify `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY` are correct
3. Check Vercel deployment logs for Inngest errors
4. Run recovery script: `npx tsx scripts/trigger-embeddings.ts`
5. Use admin panel at `/dashboard/creator/videos/debug`

### Issue: Embeddings Failing

**Symptoms:** Videos reach "embedding" stage but fail

**Solutions:**
1. Verify `OPENAI_API_KEY` is valid in Vercel
2. Check OpenAI API quota/billing
3. Review error logs in Inngest dashboard
4. Check Vercel function logs for OpenAI errors

### Issue: Cron Job Not Running

**Symptoms:** Auto-recovery doesn't work

**Solutions:**
1. Verify `vercel.json` has cron configuration
2. Check `CRON_SECRET` is set in Vercel
3. Look at Vercel Cron Jobs dashboard for execution history
4. Test cron endpoint manually with curl

---

## Production Readiness Checklist

After completing all steps, verify:

- [ ] ✅ Inngest Cloud account created
- [ ] ✅ Both environment variables added to Vercel
  - [ ] `INNGEST_EVENT_KEY`
  - [ ] `INNGEST_SIGNING_KEY`
- [ ] ✅ Deployed to Vercel successfully
- [ ] ✅ Inngest sync completed (6 functions discovered)
- [ ] ✅ Test video import completes all stages
- [ ] ✅ Video reaches "completed" status (100%)
- [ ] ✅ Embeddings generated (checked in database)
- [ ] ✅ Stuck videos recovered (if any)
- [ ] ✅ Cron job configured with `CRON_SECRET`
- [ ] ✅ Auto-recovery tested (cron job runs successfully)

---

## What's Fixed

After completing this setup:

**BEFORE (Broken):**
- ❌ Videos stuck at 50% forever
- ❌ No embeddings generated
- ❌ AI chat non-functional
- ❌ Manual recovery required

**AFTER (Working):**
- ✅ Videos complete all processing stages
- ✅ Embeddings generated automatically
- ✅ AI chat fully functional with semantic search
- ✅ Auto-recovery every 5 minutes (no manual intervention)

---

## Pricing Information

**Inngest Cloud Free Tier:**
- 200,000 function runs per month (FREE)
- Unlimited functions
- Production-ready infrastructure
- No credit card required

**Your estimated usage:**
- ~3 functions per video import (chunk, embed, transcribe)
- 200K runs = ~66,666 video imports per month
- **Cost: $0/month** for most use cases

**Paid tiers** only needed if you exceed 200K runs/month.

---

## Next Steps

1. **Update PROJECT_STATUS.md**
   - Change CHRON-002 status from "IN PROGRESS" to "RESOLVED"
   - Update production readiness score from 52/80 to 72/80
   - Remove P0 blocker status

2. **Test Full Workflow**
   - Import videos from all 4 sources (YouTube, Loom, Whop, Upload)
   - Test AI chat with semantic search
   - Verify analytics dashboard shows accurate data

3. **Monitor First 24 Hours**
   - Check Inngest dashboard for errors
   - Monitor video import success rate
   - Review Vercel function logs
   - Track auto-recovery executions

4. **Documentation Updates**
   - Update CLAUDE.md (mark Inngest as configured)
   - Update deployment guide
   - Create user guide for video imports

---

**Status:** Ready for production deployment
**Estimated Setup Time:** 15-20 minutes
**Last Updated:** November 20, 2025

---

Assisted by Jimmy Solutions Developer at Agentic Personnel LLC
Jimmy@AgenticPersonnel.com
