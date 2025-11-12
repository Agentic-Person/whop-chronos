# Chronos Creator Guide: Video Import & Course Building

**Last Updated:** November 12, 2025
**For:** Whop Course Creators
**Skill Level:** Beginner-friendly

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Importing Videos](#importing-videos)
3. [Building Courses](#building-courses)
4. [Analytics Dashboard](#analytics-dashboard)
5. [Cost Optimization](#cost-optimization)
6. [Storage Management](#storage-management)
7. [Troubleshooting](#troubleshooting)
8. [FAQ](#faq)

---

## Getting Started

### What is Chronos?

Chronos transforms your passive video courses into interactive, AI-powered learning experiences. Students can chat with your videos, ask questions, and get instant answers—all powered by AI that understands your content.

### Key Features

- 📹 **Multi-Source Video Import** - YouTube, Loom, Whop, or Upload files
- 🤖 **AI Chat Assistant** - Students chat with video transcripts
- 📊 **Analytics Dashboard** - Track views, engagement, and completion rates
- 💰 **Cost Optimization** - FREE transcripts from YouTube and Loom
- 🎓 **Course Builder** - Organize videos into structured learning paths

---

## Importing Videos

Chronos supports **4 ways** to import videos:

### Method 1: YouTube Videos (FREE) ⭐ RECOMMENDED

**Benefits:**
- ✅ FREE transcript extraction
- ✅ No storage costs
- ✅ Fast import (2-5 seconds)
- ✅ No bandwidth limits

**How to Import:**

1. **Copy YouTube URL**
   - Example: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`

2. **Open Course Builder**
   - Navigate to your course
   - Click on a chapter/module
   - Click **"Add Lesson"** button
   - Select **"URL Import"**

3. **Import Video**
   - VideoSourceSelector modal opens
   - Select **"YouTube"** tab
   - Paste your YouTube URL
   - Click **"Fetch Preview"**
   - Review video details:
     - Thumbnail preview
     - Video title
     - Channel name
     - Duration
   - Click **"Import Video"**

4. **Wait for Processing**
   - Progress bar shows import status
   - Typical time: 2-5 seconds
   - Video appears in your lesson when complete

**Supported YouTube URLs:**
- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/watch?v=VIDEO_ID&t=123s`

**Requirements:**
- Video must be **public** or **unlisted**
- Private videos will fail
- Age-restricted videos may fail

---

### Method 2: Loom Videos (FREE) ⭐ RECOMMENDED

**Benefits:**
- ✅ FREE transcript extraction
- ✅ No storage costs
- ✅ Perfect for screen recordings
- ✅ Fast import

**How to Import:**

1. **Get Loom Share Link**
   - Open your Loom video
   - Click "Share" button
   - Copy share link
   - Example: `https://www.loom.com/share/abc123def456`

2. **Import to Chronos**
   - Open VideoSourceSelector
   - Select **"Loom"** tab
   - Paste Loom URL
   - Click **"Import Video"**
   - Wait for processing (2-5 seconds)

**Supported Loom URLs:**
- `https://www.loom.com/share/VIDEO_ID`
- `https://www.loom.com/embed/VIDEO_ID`

**Requirements:**
- Video must be **publicly accessible**
- Private Loom videos require API key configuration

---

### Method 3: Whop Course Videos

**Benefits:**
- ✅ Import from existing Whop courses
- ✅ Bulk import multiple videos
- ✅ Supports Mux, YouTube, and Loom embeds
- ✅ Preserves existing video hosting

**How to Import:**

#### Option A: Import by URL

1. **Copy Whop Lesson URL**
   - Example: `https://whop.com/hub/lesson/LESSON_ID`

2. **Import to Chronos**
   - Open VideoSourceSelector
   - Select **"Whop"** tab
   - Choose **"Import by URL"** mode
   - Paste lesson URL
   - Click **"Import"**

#### Option B: Browse and Select

1. **Open Browse Mode**
   - Select **"Whop"** tab
   - Choose **"Browse Products"** mode

2. **Select Product**
   - Dropdown shows all your Whop products
   - Select product containing lessons

3. **Choose Lessons**
   - Checkboxes appear for each lesson
   - Select multiple lessons (bulk import)
   - Click **"Import Selected"**

4. **Wait for Processing**
   - Progress shown for each video
   - Videos import in parallel

**Supported Whop Video Types:**
- Mux-hosted videos
- YouTube embeds
- Loom embeds

---

### Method 4: Upload Files

**Benefits:**
- ✅ Maximum flexibility (any video file)
- ✅ Full control over content
- ✅ Automatic transcription (Whisper AI)
- ✅ Thumbnail extraction

**Costs:**
- ⚠️ $0.006 per minute (Whisper transcription)
- ⚠️ $0.021 per GB per month (storage)

**How to Upload:**

1. **Prepare Video File**
   - Supported formats: MP4, MOV, WebM, AVI
   - Max file size: 2GB per file
   - Recommended: H.264 codec, 1080p

2. **Open Upload Tab**
   - Open VideoSourceSelector
   - Select **"Upload"** tab

3. **Upload File**
   - **Drag & drop** file onto upload area
   - **OR** click "Browse" to select file

4. **Monitor Upload Progress**
   - Progress bar shows upload percentage
   - Speed indicator (MB/s)
   - Time remaining estimate

5. **Wait for Processing**
   - **Upload:** File uploaded in chunks
   - **Thumbnail Extraction:** Automatic
   - **Transcription:** Whisper AI processes audio
   - **Embeddings:** AI generates searchable chunks
   - Total time: 2-5 minutes per hour of video

**Upload Tips:**
- Compress videos before uploading (saves quota)
- Use YouTube/Loom for free transcripts when possible
- Check storage quota before large uploads

---

## Building Courses

### Course Structure

```
Course
├── Chapter 1
│   ├── Lesson 1 (Video)
│   ├── Lesson 2 (Video)
│   └── Lesson 3 (Video)
├── Chapter 2
│   ├── Lesson 1 (Video)
│   └── Lesson 2 (Video)
└── Chapter 3
    └── Lesson 1 (Video)
```

### Step-by-Step Course Building

#### 1. Create a Course

1. Navigate to `/dashboard/creator/courses`
2. Click **"Create Course"** button
3. Enter course details:
   - Course name
   - Description
   - Cover image
4. Click **"Save"**

#### 2. Add Chapters (Modules)

1. Open your course in CourseBuilder
2. Click **"Add Chapter"** button (bottom of sidebar)
3. Chapter appears with default name "Chapter X"
4. Click chapter name to rename
5. Press Enter to save

#### 3. Add Lessons to Chapters

1. Hover over chapter
2. Click **"+"** button (Add Lesson)
3. Choose import method:
   - **URL Import** - YouTube or Loom
   - **From Library** - Previously imported videos
   - **Upload File** - New file upload

4. Video appears in chapter lesson list
5. Click lesson to preview in main area

#### 4. Organize Lessons

- **Drag & Drop** lessons to reorder (coming soon)
- **Delete** lesson: Click trash icon
- **Rename** lesson: Click lesson title

#### 5. Publish Course

1. Review all lessons
2. Verify videos display correctly
3. Course auto-saves as you work
4. Students can access immediately

---

## Analytics Dashboard

### Accessing Analytics

Navigate to: `/dashboard/creator/analytics/videos`

### Dashboard Sections

#### 1. **Metric Cards** (Top Row)

Four key metrics with trend indicators:

- **Total Views** - All-time video views
  - Trend: Compared to previous period
  - Green = increasing, Red = decreasing

- **Total Watch Time** - Hours watched
  - Calculation: Sum of all watch sessions
  - Trend: vs previous period

- **Avg Completion Rate** - Percentage of video watched
  - Good: > 60%
  - Average: 40-60%
  - Poor: < 40%

- **Total Videos** - Videos in library
  - Breakdown by source type

#### 2. **Views Over Time** (Line Chart)

- Shows daily view counts
- Identify peak days
- Spot trends (growing, declining, stable)
- Filter by date range

#### 3. **Completion Rates by Video** (Bar Chart)

- Top 10 videos by completion rate
- Green bars = high completion (> 75%)
- Yellow bars = medium completion (50-75%)
- Red bars = low completion (< 50%)
- Click bar to view video details

#### 4. **Cost Breakdown** (Pie Chart)

Shows transcription costs by source:

- **YouTube** - $0 (FREE)
- **Loom** - $0 (FREE)
- **Whop (Mux)** - $0.005/min transcription
- **Upload (Whisper)** - $0.006/min transcription

Summary stats:
- Total cost this period
- Cost per video average
- Savings vs all-upload approach

#### 5. **Storage Usage** (Area Chart)

- Cumulative storage over time
- Shows your quota limit (reference line)
- Warning indicators:
  - 🟡 75% quota - Warning
  - 🔴 90% quota - Critical

Storage by tier:
- **Basic:** 1GB, 50 videos, 20 uploads/month
- **Pro:** 10GB, 500 videos, 100 uploads/month
- **Enterprise:** 100GB, unlimited videos, unlimited uploads

#### 6. **Student Engagement** (Heatmap)

Activity heatmap showing when students watch:
- 7 days (columns)
- 6 time blocks (rows): Morning, Afternoon, Evening, Night
- Darker color = more activity
- Hover for exact counts

Metrics:
- Active learners (unique students)
- Avg videos per student
- Peak viewing time

#### 7. **Top Performing Videos** (Table)

Sortable table with:
- Video thumbnail
- Title
- Source type (YouTube, Loom, Whop, Upload)
- Views
- Avg watch time
- Completion rate

Features:
- Search by title
- Sort by any column
- Pagination (10 per page)
- Click row to view video details

### Exporting Data

Click **"Export CSV"** button (top right) to download:

- Video performance metrics
- Views over time data
- Completion rates
- Cost breakdown
- Storage usage
- Engagement metrics
- Top videos list
- Full analytics dump

**CSV File Name:** `chronos-video-analytics-YYYY-MM-DD.csv`

### Date Range Filtering

1. Click **Date Range Picker** (top right)
2. Select preset:
   - Last 7 days
   - Last 30 days
   - Last 90 days
   - Custom range
3. Dashboard refreshes with filtered data

---

## Cost Optimization

### Cost Comparison by Source

| Source | Transcript Cost | Storage Cost | Total Cost (1hr video) |
|--------|----------------|--------------|------------------------|
| YouTube | **$0** | **$0** | **$0** ✅ BEST |
| Loom | **$0** | **$0** | **$0** ✅ BEST |
| Whop (Mux) | $0.30 | $0 | $0.30 |
| Upload | $0.36 | $0.021/mo | $0.38 + storage |

### Cost Optimization Strategies

#### 1. **Prioritize YouTube and Loom** ⭐

**Savings:** 100% vs uploads

Upload your videos to YouTube (can be unlisted) or Loom, then import to Chronos:

1. Upload video to YouTube (unlisted or public)
2. Copy YouTube URL
3. Import to Chronos via YouTube tab
4. **Result:** $0 cost vs $0.36+ for direct upload

**When to use:**
- Educational content
- Public-facing courses
- Screencasts and tutorials
- Marketing content

#### 2. **Use Whop for Private Content**

**Savings:** 90% vs uploads

For content that must be private:

1. Upload to Whop (uses Mux hosting)
2. Import to Chronos via Whop tab
3. **Result:** $0.30 per hour vs $0.38+ for upload

**When to use:**
- Exclusive member content
- High-value paid courses
- Content you don't want on YouTube

#### 3. **Only Upload When Necessary**

**Use uploads for:**
- Content you can't post anywhere else
- Internal training videos
- Pre-recorded webinars
- Videos requiring full control

**Optimization tips:**
- Compress videos before uploading
- Use H.264 codec (best compression)
- Lower resolution when possible (720p vs 1080p)
- Delete old, unused videos

#### 4. **Monitor Storage Quota**

Check quota regularly:
- Dashboard: Storage Usage chart
- Settings: Storage quota page
- Email alerts at 75%, 90%, 100%

**When approaching limit:**
1. Delete unused videos
2. Replace uploads with YouTube/Loom
3. Compress existing videos
4. Upgrade plan if needed

---

## Storage Management

### Storage Quotas by Plan

| Plan | Storage | Video Limit | Upload Limit/Month |
|------|---------|-------------|-------------------|
| Basic | 1GB | 50 videos | 20 uploads |
| Pro | 10GB | 500 videos | 100 uploads |
| Enterprise | 100GB | Unlimited | Unlimited |

### Checking Your Usage

**Via Analytics Dashboard:**
1. Navigate to `/dashboard/creator/analytics/videos`
2. Scroll to "Storage Usage" chart
3. View current usage vs quota
4. See cumulative storage over time

**Via Settings:**
1. Navigate to `/dashboard/creator/settings`
2. Click "Storage" tab
3. View detailed breakdown:
   - Used storage
   - Available storage
   - Uploads this month
   - Upload limit

### Managing Storage

#### Delete Unused Videos

1. Go to Video Library
2. Sort by "Last Viewed" (ascending)
3. Identify videos with no views in 90+ days
4. Click three dots (•••) → "Delete"
5. Confirm deletion
6. Storage freed immediately

#### Replace Uploads with YouTube/Loom

For videos you previously uploaded:

1. Upload same video to YouTube (unlisted)
2. Import to Chronos via YouTube URL
3. Update courses to use new video
4. Delete old upload
5. **Save:** ~100% of storage cost

#### Compress Existing Videos

1. Download video from Chronos
2. Use video compression tool:
   - **HandBrake** (free, desktop)
   - **Clipchamp** (free, web)
   - **FFmpeg** (free, command line)
3. Re-upload compressed version
4. Delete original
5. **Save:** 30-70% storage

---

## Troubleshooting

### Common Issues

#### Video Won't Import

**Symptoms:** Import fails with error message

**Possible Causes & Solutions:**

1. **"Video is private"**
   - Solution: Make YouTube video public or unlisted
   - Solution: Share Loom video publicly
   - Solution: Check Whop video permissions

2. **"Invalid URL"**
   - Solution: Check URL format is correct
   - Solution: Remove extra parameters from URL
   - Solution: Try copying URL again

3. **"Transcript not available"**
   - Solution: Wait for YouTube to generate transcript (can take hours for new videos)
   - Solution: Enable captions on YouTube video
   - Solution: Use upload method with Whisper

4. **"Quota exceeded"**
   - Solution: Delete old videos
   - Solution: Use YouTube/Loom instead of upload
   - Solution: Upgrade to higher plan

#### Video Stuck in "Processing"

**Symptoms:** Video shows "transcribing" or "processing" status for > 10 minutes

**Solutions:**

1. **Refresh page**
   - Sometimes status updates are delayed
   - Hard refresh: Ctrl + Shift + R (Windows) or Cmd + Shift + R (Mac)

2. **Check API status**
   - OpenAI Whisper may be experiencing delays
   - Check status: https://status.openai.com

3. **Contact support**
   - If stuck > 30 minutes, contact support
   - Provide video ID and import timestamp

#### Analytics Not Showing Data

**Symptoms:** Dashboard shows "No data available"

**Solutions:**

1. **Check date range**
   - Ensure date range includes recent activity
   - Try "Last 30 days" preset

2. **Verify videos have views**
   - Analytics only show after students watch videos
   - Import and watch a test video

3. **Wait for data processing**
   - Analytics may take 5-15 minutes to update
   - Refresh dashboard after waiting

4. **Check browser console**
   - Open DevTools (F12)
   - Look for errors in Console tab
   - Report errors to support

#### Slow Upload Speed

**Symptoms:** File upload takes very long or stalls

**Solutions:**

1. **Check internet connection**
   - Run speed test: https://fast.com
   - Need at least 5 Mbps upload speed

2. **Compress video first**
   - Large files (> 500MB) take longer
   - Compress before uploading

3. **Try different browser**
   - Chrome recommended
   - Firefox and Edge also work
   - Safari may have issues

4. **Upload during off-peak hours**
   - Network congestion can slow uploads
   - Try late night or early morning

#### Video Won't Play for Students

**Symptoms:** Students report video not loading

**Solutions:**

1. **Check video status**
   - Verify video shows "completed" status
   - Incomplete processing prevents playback

2. **Test in incognito mode**
   - Browser cache may be stale
   - Clear cache and try again

3. **Check source video**
   - If YouTube: Verify video still public
   - If Loom: Verify share link works
   - If Whop: Check permissions

4. **Verify embed works**
   - YouTube: Test embed code
   - Loom: Test in iframe
   - Uploads: Check Supabase Storage

---

## FAQ

### General Questions

#### Q: How long does video import take?

**A:**
- **YouTube/Loom:** 2-5 seconds
- **Whop:** 5-10 seconds
- **Upload:** 2-5 minutes per hour of video

#### Q: What video formats are supported?

**A:**
- **Upload:** MP4, MOV, WebM, AVI
- **YouTube:** Any format supported by YouTube
- **Loom:** Loom's supported formats
- **Whop:** Mux-supported formats

#### Q: Can I import private YouTube videos?

**A:** No, videos must be public or unlisted. Private videos require YouTube API auth which Chronos doesn't currently support.

#### Q: How accurate is the AI chat?

**A:** Very accurate. AI uses Claude 3.5 Haiku which has 99%+ accuracy for RAG (Retrieval Augmented Generation) tasks. It only answers from your video transcripts, no hallucinations.

#### Q: Can students download videos?

**A:** No, videos are streaming-only to protect your content. Students can watch unlimited times but cannot download.

### Cost Questions

#### Q: Why is YouTube import free?

**A:** Chronos uses YouTube's transcript API which is free. No video download needed, just transcript extraction.

#### Q: What's included in Whisper cost?

**A:** Whisper charges $0.006 per minute for transcription. This is charged by OpenAI, not Chronos. Chronos adds no markup.

#### Q: How is storage billed?

**A:** Storage is monthly: $0.021 per GB per month. Charged by Supabase. Delete videos anytime to stop charges.

#### Q: Can I get a refund for deleted videos?

**A:** No, but deleting videos immediately stops future charges. Pro-rated refunds not available.

### Technical Questions

#### Q: What's the max video length?

**A:** No strict limit, but:
- **Upload:** 2GB file size limit (~4 hours at 1080p)
- **YouTube:** YouTube's 12-hour limit
- **Loom:** Loom's plan limits
- **Whop:** Mux's limits

#### Q: Can I bulk import 100+ videos?

**A:** Yes, use Whop tab "Browse" mode to select multiple lessons. Imports run in parallel (5 at a time).

#### Q: How long are transcripts stored?

**A:** Permanently, unless you delete the video. No expiration.

#### Q: Can I edit transcripts?

**A:** Not currently, but coming soon. Transcripts are auto-generated and read-only for now.

#### Q: What happens if I downgrade my plan?

**A:** If over new quota:
- Videos remain accessible
- Cannot upload new videos until under quota
- Delete videos to get under quota

---

## Support & Resources

### Documentation

- **API Reference:** `docs/api/reference.md`
- **Architecture Guide:** `docs/architecture/IMPLEMENTATION_PLAN.md`
- **Deployment Guide:** `docs/DEPLOYMENT_GUIDE.md`
- **Testing Report:** `docs/TESTING_REPORT.md`

### Video Tutorials (Coming Soon)

- How to import YouTube videos
- Building your first course
- Understanding analytics
- Cost optimization tips

### Support Channels

- **Email:** support@chronos.app
- **Discord:** https://discord.gg/chronos (coming soon)
- **Help Center:** https://help.chronos.app (coming soon)

### Feature Requests

Have an idea? Submit feature requests:
- **GitHub:** https://github.com/chronos/feedback
- **Discord:** #feature-requests channel
- **Email:** features@chronos.app

---

**User Guide Version:** 1.0
**Last Updated:** November 12, 2025
**Next Review:** After user testing

---

Assisted by Jimmy Solutions Developer at Agentic Personnel LLC <Jimmy@AgenticPersonnel.com>
