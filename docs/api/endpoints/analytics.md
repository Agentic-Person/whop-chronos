# Analytics API Documentation

Complete API reference for analytics tracking and querying in Chronos.

---

## Table of Contents

1. [Event Tracking](#event-tracking)
2. [Video Analytics](#video-analytics)
3. [Course Analytics](#course-analytics)
4. [Usage Analytics](#usage-analytics)
5. [Metrics Calculations](#metrics-calculations)
6. [Examples](#examples)

---

## Event Tracking

### Track Video Event

**POST** `/api/analytics/video-event`

Track a video analytics event.

**Request Body:**

```json
{
  "event_type": "video_started",  // Required (see Event Types below)
  "video_id": "uuid",              // Required
  "creator_id": "uuid",            // Required
  "student_id": "uuid",            // Optional (null for creator events)
  "course_id": "uuid",             // Optional
  "module_id": "uuid",             // Optional
  "metadata": {                    // Optional
    "source_type": "youtube",
    "duration_seconds": 600,
    "percent_complete": 50,
    "watch_time_seconds": 300,
    "cost": 0.0,
    "transcript_method": "youtube_captions"
  }
}
```

**Event Types:**

| Event Type | Description | Student/Creator | Metadata Fields |
|------------|-------------|-----------------|-----------------|
| `video_imported` | Video first added to system | Creator | `source_type`, `duration_seconds` |
| `video_transcribed` | Transcript extraction complete | Creator | `transcript_method`, `cost` |
| `video_embedded` | Embeddings generated | Creator | `cost` |
| `video_added_to_course` | Added to course module | Creator | `course_id`, `module_id` |
| `video_started` | Student begins watching | Student | `percent_complete: 0` |
| `video_progress` | Milestone reached | Student | `percent_complete`, `watch_time_seconds` |
| `video_completed` | Student finishes (90%+) | Student | `percent_complete`, `watch_time_seconds` |
| `video_rewatched` | Student rewatches completed video | Student | `watch_time_seconds` |

**Response (201 Created):**

```json
{
  "success": true,
  "event_id": "video_started_uuid_1705063200000",
  "message": "Event video_started tracked successfully"
}
```

**Error Responses:**

- `400 Bad Request` - Missing required fields or invalid event_type
- `404 Not Found` - Video not found
- `500 Internal Server Error` - Database error

---

## Video Analytics

### Get Video Analytics

**GET** `/api/analytics/videos/{id}?period={period}&creator_id={uuid}`

Get analytics for a specific video.

**Query Parameters:**

- `period` (optional): `7d` | `30d` | `90d` | `all` (default: `30d`)
- `creator_id` (required): Creator UUID for authorization

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "video_id": "uuid",
    "video_title": "Introduction to Trading",
    "period": "30d",
    "total_views": 1250,
    "unique_viewers": 87,
    "completion_rate": 68.5,
    "avg_watch_time_seconds": 420,
    "engagement_score": 72,
    "views_over_time": [
      {
        "date": "2025-01-01",
        "views": 45,
        "unique_viewers": 12,
        "watch_time_seconds": 18900,
        "completion_rate": 65.2
      },
      {
        "date": "2025-01-02",
        "views": 52,
        "unique_viewers": 15,
        "watch_time_seconds": 21840,
        "completion_rate": 70.1
      }
    ]
  }
}
```

**Metrics Explained:**

- **total_views**: Total number of times video was started
- **unique_viewers**: Number of distinct students who viewed the video
- **completion_rate**: Percentage of viewers who watched 90%+ of the video
- **avg_watch_time_seconds**: Average watch time per view
- **engagement_score**: Composite score (0-100) based on watch time, completion, and rewatches

**Error Responses:**

- `400 Bad Request` - Missing parameters or invalid period
- `403 Forbidden` - User does not own this video
- `404 Not Found` - Video not found
- `500 Internal Server Error` - Database error

---

## Course Analytics

### Get Course Analytics

**GET** `/api/analytics/courses/{id}?period={period}&creator_id={uuid}`

Get analytics for an entire course.

**Query Parameters:**

- `period` (optional): `7d` | `30d` | `90d` | `all` (default: `30d`)
- `creator_id` (required): Creator UUID for authorization

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "course_id": "uuid",
    "course_title": "Introduction to Trading",
    "period": "30d",
    "total_views": 3420,
    "unique_students": 145,
    "avg_progress": 0,
    "completion_rate": 72.3,
    "video_count": 24,
    "module_count": 6,
    "top_videos": [
      {
        "video_id": "uuid",
        "title": "Getting Started with Trading",
        "thumbnail_url": "https://...",
        "views": 245,
        "completion_rate": 85.2,
        "watch_time_seconds": 102900
      }
    ],
    "module_performance": [
      {
        "module_id": "uuid",
        "title": "Module 1: Fundamentals",
        "video_count": 5,
        "total_views": 580,
        "avg_completion_rate": 78.5
      }
    ]
  }
}
```

**Metrics Explained:**

- **total_views**: Sum of views across all videos in course
- **unique_students**: Maximum unique viewers across all videos (approximation)
- **avg_progress**: Average student progress percentage (not implemented yet)
- **completion_rate**: Average completion rate across all videos
- **top_videos**: Top 10 videos by view count
- **module_performance**: Aggregated metrics for each module

**Error Responses:**

- `400 Bad Request` - Missing parameters or invalid period
- `403 Forbidden` - User does not own this course
- `404 Not Found` - Course not found
- `500 Internal Server Error` - Database error

---

## Usage Analytics

### Get Creator Usage Metrics

**GET** `/api/analytics/usage/creator/{id}?period={period}`

Get usage metrics for a creator.

**Query Parameters:**

- `period` (optional): `7d` | `30d` | `90d` | `all` (default: `30d`)

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "creator_id": "uuid",
    "period": "30d",
    "subscription_tier": "pro",

    // Storage metrics
    "storage_used_bytes": 5368709120,
    "storage_used_gb": 5.0,
    "storage_limit_gb": 100,
    "storage_percentage": 5.0,

    // Video counts
    "total_videos": 42,
    "video_count_by_source": {
      "youtube": 25,
      "upload": 10,
      "mux": 5,
      "loom": 2
    },

    // Cost metrics
    "transcript_costs_by_source": {
      "youtube": 0.0,
      "upload": 0.60,
      "mux": 0.0,
      "loom": 0.0
    },
    "total_transcript_cost": 0.60,
    "monthly_spend": 0.64,

    // Usage metrics
    "ai_credits_used": 2450,
    "ai_credits_limit": 10000,
    "ai_credits_percentage": 24.5,
    "transcription_minutes": 420,
    "active_students": 87,

    // Tier limits
    "limits": {
      "storage_gb": 100,
      "ai_credits": 10000,
      "videos": 500
    }
  }
}
```

**Subscription Tiers:**

| Tier | Storage (GB) | AI Credits | Max Videos |
|------|--------------|------------|------------|
| `basic` | 10 | 1,000 | 50 |
| `pro` | 100 | 10,000 | 500 |
| `enterprise` | 1,000 | 100,000 | 5,000 |

**Cost Breakdown:**

- **Transcript costs**: $0.00 for YouTube/Loom/Mux, $0.006/min for Whisper (uploads)
- **Embedding costs**: ~$0.0001 per video (OpenAI ada-002)
- **Storage costs**: Included in Supabase tier (free for YouTube/Loom/Mux embeds)

**Error Responses:**

- `400 Bad Request` - Missing creator ID
- `404 Not Found` - Creator not found
- `500 Internal Server Error` - Database error

---

## Metrics Calculations

### Completion Rate

```
completion_rate = (completed_views / total_views) * 100

where:
  completed_views = views with percent_complete >= 90
  total_views = all views
```

### Engagement Score (0-100)

```
engagement_score = (
  (watch_time_ratio * 40) +
  (completion_rate / 100 * 40) +
  (rewatch_ratio * 20)
) * 100

where:
  watch_time_ratio = min(avg_watch_time / video_duration, 1)
  completion_rate = completion percentage (0-100)
  rewatch_ratio = min(total_views / unique_viewers, 2) / 2
```

**Score Interpretation:**

- **90-100**: Exceptional engagement
- **70-89**: High engagement
- **50-69**: Moderate engagement
- **30-49**: Low engagement
- **0-29**: Very low engagement

### Average Watch Time

```
avg_watch_time = total_watch_time_seconds / total_views
```

### Cost Per Video

```
cost_per_video =
  transcript_cost +    // $0 (free) or $0.006/min (Whisper)
  embedding_cost +     // ~$0.0001 (OpenAI ada-002)
  storage_cost         // $0 for embeds, variable for uploads
```

---

## Examples

### Track Student Video Progress

```javascript
// Track video start
await fetch('/api/analytics/video-event', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    event_type: 'video_started',
    video_id: 'video-uuid',
    creator_id: 'creator-uuid',
    student_id: 'student-uuid',
    metadata: {
      percent_complete: 0
    }
  })
});

// Track progress milestones (10%, 25%, 50%, 75%, 90%)
await fetch('/api/analytics/video-event', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    event_type: 'video_progress',
    video_id: 'video-uuid',
    creator_id: 'creator-uuid',
    student_id: 'student-uuid',
    metadata: {
      percent_complete: 50,
      watch_time_seconds: 300
    }
  })
});

// Track completion
await fetch('/api/analytics/video-event', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    event_type: 'video_completed',
    video_id: 'video-uuid',
    creator_id: 'creator-uuid',
    student_id: 'student-uuid',
    metadata: {
      percent_complete: 95,
      watch_time_seconds: 570
    }
  })
});
```

### Get Video Performance Dashboard Data

```javascript
// Fetch analytics for last 30 days
const response = await fetch(
  `/api/analytics/videos/${videoId}?period=30d&creator_id=${creatorId}`
);
const result = await response.json();

if (result.success) {
  const {
    total_views,
    unique_viewers,
    completion_rate,
    engagement_score,
    views_over_time
  } = result.data;

  // Use for dashboard charts
  console.log(`Views: ${total_views}`);
  console.log(`Unique Viewers: ${unique_viewers}`);
  console.log(`Completion Rate: ${completion_rate}%`);
  console.log(`Engagement Score: ${engagement_score}/100`);

  // Plot views over time
  plotLineChart(views_over_time.map(d => ({
    date: d.date,
    views: d.views
  })));
}
```

### Track Video Import Costs

```javascript
// Track YouTube import (free transcript)
await fetch('/api/analytics/video-event', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    event_type: 'video_transcribed',
    video_id: 'video-uuid',
    creator_id: 'creator-uuid',
    metadata: {
      source_type: 'youtube',
      transcript_method: 'youtube_captions',
      cost: 0.0
    }
  })
});

// Track upload transcription (Whisper cost)
await fetch('/api/analytics/video-event', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    event_type: 'video_transcribed',
    video_id: 'video-uuid',
    creator_id: 'creator-uuid',
    metadata: {
      source_type: 'upload',
      transcript_method: 'whisper',
      duration_seconds: 600,
      cost: 0.06  // $0.006/min * 10 min
    }
  })
});
```

### Monitor Usage Quotas

```javascript
const response = await fetch(
  `/api/analytics/usage/creator/${creatorId}?period=30d`
);
const result = await response.json();

if (result.success) {
  const {
    storage_percentage,
    ai_credits_percentage,
    limits
  } = result.data;

  // Check if approaching limits
  if (storage_percentage > 80) {
    console.warn('Storage usage above 80%');
  }

  if (ai_credits_percentage > 80) {
    console.warn('AI credits usage above 80%');
  }

  // Display current usage
  console.log(`Storage: ${storage_percentage}% of ${limits.storage_gb}GB`);
  console.log(`AI Credits: ${ai_credits_percentage}% of ${limits.ai_credits}`);
}
```

---

## Best Practices

### Event Tracking Frequency

**DO:**
- Track `video_started` once per viewing session
- Track `video_progress` at milestones: 10%, 25%, 50%, 75%, 90%
- Track `video_completed` once when reaching 90%+

**DON'T:**
- Track progress events more than once per milestone
- Send events for every second of playback
- Track events when video is paused

### Performance Optimization

**Batch Analytics Queries:**

```javascript
// ✅ Good - Fetch all data in one request
const courseAnalytics = await fetch(`/api/analytics/courses/${courseId}?period=30d`);

// ❌ Bad - Multiple requests for same data
const video1 = await fetch(`/api/analytics/videos/uuid1?period=30d`);
const video2 = await fetch(`/api/analytics/videos/uuid2?period=30d`);
const video3 = await fetch(`/api/analytics/videos/uuid3?period=30d`);
```

### Cost Optimization

**Prefer Free Transcript Sources:**

1. YouTube (free captions)
2. Loom (free API)
3. Mux (free auto-captions)
4. Whisper (paid - $0.006/min)

**Monitor monthly spend:**

```javascript
const usage = await fetch(`/api/analytics/usage/creator/${creatorId}`);
const { monthly_spend, transcript_costs_by_source } = usage.data;

if (monthly_spend > 10) {
  console.warn('Monthly spend exceeds $10');
  console.log('Costs by source:', transcript_costs_by_source);
}
```

---

**Last Updated:** January 12, 2025
**Version:** 1.0
**Maintained By:** Chronos Development Team
