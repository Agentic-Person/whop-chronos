# Chronos API Reference

Complete API documentation for Chronos video learning platform.

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Base URL](#base-url)
4. [Response Format](#response-format)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)
7. [API Endpoints](#api-endpoints)

---

## Overview

The Chronos API provides programmatic access to:
- **Courses & Modules**: Create and manage structured learning paths
- **Videos**: Import from multiple sources (YouTube, Loom, Mux, uploads)
- **Analytics**: Track engagement, completion rates, and usage metrics
- **Chat**: AI-powered RAG chat with video transcripts
- **Webhooks**: Receive real-time updates from Whop

---

## Authentication

All API requests require authentication via Whop OAuth tokens.

**Header Format:**

```
Authorization: Bearer <whop_access_token>
```

For server-side API routes, authentication is handled automatically via service role keys.

---

## Base URL

**Development:**
```
http://localhost:3007/api
```

**Production:**
```
https://chronos.vercel.app/api
```

---

## Response Format

All API responses follow a consistent structure:

**Success Response:**

```json
{
  "success": true,
  "data": {
    // Response data here
  }
}
```

**Error Response:**

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "message": "Detailed error description"
}
```

---

## Error Handling

### HTTP Status Codes

| Code | Description |
|------|-------------|
| `200` | Success - Request completed successfully |
| `201` | Created - Resource created successfully |
| `400` | Bad Request - Invalid parameters or missing required fields |
| `401` | Unauthorized - Missing or invalid authentication |
| `403` | Forbidden - User lacks permission for this resource |
| `404` | Not Found - Resource does not exist |
| `500` | Internal Server Error - Server-side error |

### Error Codes

| Code | Description |
|------|-------------|
| `CREATOR_NOT_FOUND` | Creator does not exist |
| `COURSE_NOT_FOUND` | Course does not exist or is deleted |
| `MODULE_NOT_FOUND` | Module does not exist |
| `VIDEO_NOT_FOUND` | Video does not exist or is deleted |
| `FORBIDDEN` | User does not own this resource |
| `CREATION_FAILED` | Failed to create resource |
| `UPDATE_FAILED` | Failed to update resource |
| `DELETE_FAILED` | Failed to delete resource |
| `FETCH_FAILED` | Failed to fetch data |

---

## Rate Limiting

Rate limits are enforced per subscription tier:

| Tier | Requests/Minute | Burst Limit |
|------|-----------------|-------------|
| `basic` | 60 | 100 |
| `pro` | 300 | 500 |
| `enterprise` | 1000 | 2000 |

**Rate Limit Headers:**

```
X-RateLimit-Limit: 300
X-RateLimit-Remaining: 245
X-RateLimit-Reset: 1705063200
```

---

## API Endpoints

### Courses & Modules

Manage structured learning paths with modules and lessons.

**Documentation:** [Courses API](./endpoints/courses.md)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/courses` | Create new course |
| `GET` | `/api/courses` | List courses for creator |
| `GET` | `/api/courses/{id}` | Get course details with modules |
| `PUT` | `/api/courses/{id}` | Update course |
| `DELETE` | `/api/courses/{id}` | Delete course (soft delete) |
| `POST` | `/api/courses/{id}/modules` | Create module in course |
| `GET` | `/api/courses/{id}/modules` | List modules for course |
| `GET` | `/api/modules/{id}` | Get module with video details |
| `PUT` | `/api/modules/{id}` | Update module |
| `DELETE` | `/api/modules/{id}` | Delete module |

---

### Videos

Import and manage videos from multiple sources.

**Documentation:** [Video API](./YOUTUBE_IMPORT_API.md)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/video/youtube/import` | Import YouTube video |
| `POST` | `/api/video/upload` | Upload video file |
| `GET` | `/api/video/list` | List videos with filters |
| `GET` | `/api/video/{id}` | Get video details |
| `GET` | `/api/video/{id}/status` | Get processing status |
| `POST` | `/api/video/{id}/confirm` | Confirm video upload |
| `GET` | `/api/video/metadata` | Get video metadata |

---

### Analytics

Track and query video performance metrics.

**Documentation:** [Analytics API](./endpoints/analytics.md)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/analytics/video-event` | Track video analytics event |
| `GET` | `/api/analytics/videos/{id}` | Get video analytics |
| `GET` | `/api/analytics/courses/{id}` | Get course analytics |
| `GET` | `/api/analytics/usage/creator/{id}` | Get creator usage metrics |
| `GET` | `/api/analytics/usage/current` | Get current usage stats |
| `GET` | `/api/analytics/usage/quota` | Check quota limits |
| `GET` | `/api/analytics/chat` | Get chat analytics |
| `GET` | `/api/analytics/engagement` | Get engagement metrics |

---

### Chat

AI-powered chat with RAG over video transcripts.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/chat` | Send chat message |
| `GET` | `/api/chat/sessions` | List chat sessions |
| `POST` | `/api/chat/sessions` | Create new session |
| `GET` | `/api/chat/sessions/{id}` | Get session details |
| `GET` | `/api/chat/sessions/{id}/messages` | Get session messages |
| `POST` | `/api/chat/sessions/{id}/messages` | Add message to session |

---

### Webhooks

Receive real-time updates from Whop.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/whop/webhook` | Whop webhook handler |
| `POST` | `/api/webhooks` | Generic webhook handler |
| `POST` | `/api/webhooks/reports` | Report generation webhook |

---

### Exports

Export analytics data in various formats.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/export/csv` | Export data as CSV |
| `GET` | `/api/export/pdf` | Export report as PDF |
| `POST` | `/api/export/schedule` | Schedule recurring export |

---

## Quick Start Examples

### Create Course with Modules

```javascript
// 1. Create course
const courseRes = await fetch('/api/courses', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    creator_id: 'creator-uuid',
    title: 'Trading Fundamentals',
    description: 'Learn the basics of trading',
    is_published: false
  })
});
const course = await courseRes.json();

// 2. Create module
const moduleRes = await fetch(`/api/courses/${course.data.id}/modules`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    creator_id: 'creator-uuid',
    title: 'Module 1: Getting Started',
    display_order: 1,
    video_ids: []
  })
});
const module = await moduleRes.json();

// 3. Import YouTube video
const videoRes = await fetch('/api/video/youtube/import', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    creator_id: 'creator-uuid',
    youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
  })
});
const video = await videoRes.json();

// 4. Add video to module
await fetch(`/api/modules/${module.data.id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    creator_id: 'creator-uuid',
    video_ids: [video.data.id]
  })
});
```

### Track Video Engagement

```javascript
// Track video start
await fetch('/api/analytics/video-event', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    event_type: 'video_started',
    video_id: 'video-uuid',
    creator_id: 'creator-uuid',
    student_id: 'student-uuid'
  })
});

// Track progress
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

// Get analytics
const analyticsRes = await fetch(
  `/api/analytics/videos/video-uuid?period=30d&creator_id=creator-uuid`
);
const analytics = await analyticsRes.json();
console.log(`Engagement Score: ${analytics.data.engagement_score}/100`);
```

---

## Best Practices

### 1. Always Handle Errors

```javascript
const response = await fetch('/api/courses', { /* ... */ });
const result = await response.json();

if (!response.ok || !result.success) {
  console.error(`Error: ${result.error} (${result.code})`);
  return;
}

const course = result.data;
```

### 2. Use Pagination for Large Datasets

```javascript
let page = 1;
let hasMore = true;

while (hasMore) {
  const response = await fetch(
    `/api/video/list?creator_id=${creatorId}&page=${page}&limit=50`
  );
  const result = await response.json();

  processVideos(result.data);

  hasMore = result.pagination.hasNextPage;
  page++;
}
```

### 3. Batch Operations When Possible

```javascript
// ✅ Good - Fetch course with modules in one request
const courseData = await fetch(`/api/courses/${courseId}`);

// ❌ Bad - Multiple requests
const course = await fetch(`/api/courses/${courseId}`);
const modules = await fetch(`/api/courses/${courseId}/modules`);
```

### 4. Monitor Rate Limits

```javascript
const response = await fetch('/api/courses');

const remaining = response.headers.get('X-RateLimit-Remaining');
const reset = response.headers.get('X-RateLimit-Reset');

if (remaining < 10) {
  console.warn(`Only ${remaining} requests remaining until ${new Date(reset * 1000)}`);
}
```

---

## Support

- **Documentation:** [/docs](../README.md)
- **API Issues:** Create GitHub issue
- **Whop Integration:** [Whop Developer Docs](https://docs.whop.com)

---

**Last Updated:** January 12, 2025
**Version:** 1.0
**API Version:** v1
**Maintained By:** Chronos Development Team
