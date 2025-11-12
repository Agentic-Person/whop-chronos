# Video Player Components - API Reference

Complete documentation for Chronos video player components with multi-source support and comprehensive analytics.

## Table of Contents

1. [Overview](#overview)
2. [Component Architecture](#component-architecture)
3. [Player Components](#player-components)
4. [Analytics Integration](#analytics-integration)
5. [API Endpoints](#api-endpoints)
6. [Usage Examples](#usage-examples)
7. [Testing](#testing)

---

## Overview

The Chronos video system supports 4 video sources:
- **YouTube**: Embedded YouTube videos via iframe API
- **Mux**: HLS streaming via Mux player
- **Loom**: Embedded Loom videos via iframe
- **Upload**: Direct video uploads via HTML5 video element

All players emit standardized analytics events for tracking engagement.

---

## Component Architecture

```
AnalyticsVideoPlayer (wrapper with auto-analytics)
  └── VideoPlayer (unified router)
        ├── YouTubePlayer (react-youtube)
        ├── MuxVideoPlayer (@mux/mux-player-react)
        ├── LoomPlayer (iframe + postMessage API)
        └── HTML5VideoPlayer (native video element)
```

### Component Responsibilities

| Component | Purpose |
|-----------|---------|
| `AnalyticsVideoPlayer` | Handles all analytics tracking automatically |
| `VideoPlayer` | Routes to correct player based on `source_type` |
| `MuxVideoPlayer` | HLS playback for Mux-hosted videos |
| `LoomPlayer` | Iframe embedding for Loom videos |
| `YouTubePlayer` | YouTube iframe API integration |
| `HTML5VideoPlayer` | Native video playback for uploads |

---

## Player Components

### AnalyticsVideoPlayer

**Recommended component for most use cases.** Automatically handles all analytics tracking.

#### Props

```typescript
interface AnalyticsVideoPlayerProps {
  video: Video;                // Video object from database
  studentId: string;           // Student watching the video
  creatorId: string;           // Creator who owns the video
  courseId?: string;           // Optional course context
  moduleId?: string;           // Optional module context
  deviceType?: 'desktop' | 'mobile' | 'tablet';  // Auto-detected if not provided
  referrerType?: 'course_page' | 'direct_link' | 'search' | 'chat_reference';
  autoplay?: boolean;          // Default: false
  className?: string;          // Additional CSS classes
}
```

#### Features

- ✅ Creates watch session automatically
- ✅ Tracks video start event
- ✅ Tracks progress milestones (10%, 25%, 50%, 75%, 90%)
- ✅ Tracks completion (90%+ watched)
- ✅ Updates watch time every 5 seconds
- ✅ Ends session on unmount
- ✅ Works with all video sources

#### Usage

```tsx
import AnalyticsVideoPlayer from '@/components/video/AnalyticsVideoPlayer';

export default function CourseVideoPage({ video, user, creator }) {
  return (
    <AnalyticsVideoPlayer
      video={video}
      studentId={user.id}
      creatorId={creator.id}
      referrerType="course_page"
      autoplay={false}
    />
  );
}
```

---

### VideoPlayer

**Low-level component** that routes to correct player. Use this if you want custom analytics handling.

#### Props

```typescript
interface VideoPlayerProps {
  video: Video;
  studentId?: string;
  onProgress?: (currentTime: number) => void;
  onComplete?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onTimeUpdate?: (watchTime: number) => void;
  autoplay?: boolean;
  className?: string;
}
```

#### Routing Logic

```typescript
switch (video.source_type) {
  case 'youtube':  return <YouTubePlayer ... />;
  case 'mux':      return <MuxVideoPlayer ... />;
  case 'loom':     return <LoomPlayer ... />;
  case 'upload':   return <HTML5VideoPlayer ... />;
  default:         return <ErrorState />;
}
```

#### Usage

```tsx
import VideoPlayer from '@/components/video/VideoPlayer';

export default function SimpleVideoPage({ video }) {
  const handleProgress = (currentTime: number) => {
    console.log('Current time:', currentTime);
  };

  return (
    <VideoPlayer
      video={video}
      onProgress={handleProgress}
      onComplete={() => console.log('Video completed')}
    />
  );
}
```

---

### MuxVideoPlayer

HLS video player for Mux-hosted videos.

#### Props

```typescript
interface MuxVideoPlayerProps {
  playbackId: string;          // Mux playback ID (from video.mux_playback_id)
  videoId: string;             // Database video ID for metadata
  title?: string;              // Video title
  onStart?: () => void;        // Fires when playback starts
  onProgress?: (percent: number, currentTime: number) => void;
  onComplete?: () => void;     // Fires when video completes
  onTimeUpdate?: (watchTime: number) => void;
  autoPlay?: boolean;
  className?: string;
}
```

#### Features

- Auto-play support
- Quality selection (handled by Mux)
- Playback speed controls
- Responsive design
- Progress milestone tracking (10%, 25%, 50%, 75%, 90%)

#### Usage

```tsx
import MuxVideoPlayer from '@/components/video/MuxVideoPlayer';

export default function MuxVideoDemo({ video }) {
  return (
    <MuxVideoPlayer
      playbackId={video.mux_playback_id}
      videoId={video.id}
      title={video.title}
      onStart={() => console.log('Started')}
      onComplete={() => console.log('Completed')}
    />
  );
}
```

---

### LoomPlayer

Iframe player for Loom videos with postMessage API integration.

#### Props

```typescript
interface LoomPlayerProps {
  loomVideoId: string;         // Loom video ID (from video.embed_id)
  videoId: string;             // Database video ID for metadata
  title?: string;              // Video title (for accessibility)
  onStart?: () => void;
  onProgress?: (percent: number) => void;
  onComplete?: () => void;
  onTimeUpdate?: (watchTime: number) => void;
  autoPlay?: boolean;
  className?: string;
}
```

#### Loom Events

Listens for postMessage events from Loom iframe:
- `ready` - Player initialized
- `play` - Video started playing
- `pause` - Video paused
- `timeupdate` - Playback position changed
- `seeked` - User jumped to different position
- `ended` - Video playback completed

#### Embed URL Format

```
https://www.loom.com/embed/{loomVideoId}?hide_owner=true&hideEmbedTopBar=true
```

#### Usage

```tsx
import LoomPlayer from '@/components/video/LoomPlayer';

export default function LoomVideoDemo({ video }) {
  return (
    <LoomPlayer
      loomVideoId={video.embed_id}
      videoId={video.id}
      title={video.title}
      onProgress={(percent) => console.log(`Progress: ${percent}%`)}
    />
  );
}
```

---

## Analytics Integration

### Analytics Tracking Library

Located at: `lib/analytics/video-tracking.ts`

#### Functions

##### trackVideoStart

```typescript
trackVideoStart(
  videoId: string,
  creatorId: string,
  studentId: string,
  sessionId: string,
  sourceType?: 'youtube' | 'mux' | 'loom' | 'upload'
): Promise<void>
```

##### trackVideoProgress

```typescript
trackVideoProgress(
  videoId: string,
  creatorId: string,
  studentId: string,
  sessionId: string,
  percentComplete: number,    // 10, 25, 50, 75, or 90
  currentTime?: number        // Seconds
): Promise<void>
```

##### trackVideoComplete

```typescript
trackVideoComplete(
  videoId: string,
  creatorId: string,
  studentId: string,
  sessionId: string,
  watchTimeSeconds: number
): Promise<void>
```

##### trackWatchTime

```typescript
trackWatchTime(
  sessionId: string,
  currentTimeSeconds: number
): Promise<void>
```

#### Retry Logic

All tracking functions include retry logic:
- **Default retries**: 3 attempts
- **Retry delay**: 1 second (exponential backoff)
- **Graceful degradation**: Errors logged but don't interrupt playback

---

### Watch Session Hook

Located at: `hooks/useVideoWatchSession.ts`

#### Usage

```typescript
const { sessionId, isLoading, error, trackProgress, endSession } = useVideoWatchSession(
  videoId,
  studentId,
  creatorId,
  {
    deviceType: 'desktop',
    referrerType: 'course_page'
  }
);
```

#### Return Value

```typescript
interface UseVideoWatchSessionReturn {
  sessionId: string | null;
  isLoading: boolean;
  error: string | null;
  trackProgress: (percentComplete: number, watchTimeSeconds: number) => Promise<void>;
  endSession: () => Promise<void>;
}
```

#### Lifecycle

1. **On mount**: Creates watch session via POST `/api/analytics/watch-sessions`
2. **During playback**: Updates progress via PUT `/api/analytics/watch-sessions/[id]`
3. **On unmount**: Ends session via POST `/api/analytics/watch-sessions/[id]/end`

---

## API Endpoints

### POST /api/analytics/watch-sessions

Create a new watch session.

**Request:**
```json
{
  "video_id": "uuid",
  "student_id": "uuid",
  "creator_id": "uuid",
  "device_type": "desktop",
  "referrer_type": "course_page"
}
```

**Response:**
```json
{
  "success": true,
  "session_id": "uuid"
}
```

---

### PUT /api/analytics/watch-sessions/[id]

Update session progress.

**Request:**
```json
{
  "percent_complete": 50,
  "watch_time_seconds": 120,
  "completed": false
}
```

**Response:**
```json
{
  "success": true,
  "session_id": "uuid"
}
```

---

### POST /api/analytics/watch-sessions/[id]/end

End watch session and finalize statistics.

**Request:**
```json
{
  "session_end": "2025-11-12T10:30:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "session_id": "uuid",
  "stats": {
    "watch_time_seconds": 240,
    "percent_complete": 85,
    "completed": false,
    "total_session_duration_seconds": 300
  }
}
```

---

### POST /api/analytics/video-event

Track video analytics event.

**Request:**
```json
{
  "event_type": "video_started",
  "video_id": "uuid",
  "creator_id": "uuid",
  "student_id": "uuid",
  "metadata": {
    "source_type": "youtube",
    "session_id": "uuid"
  }
}
```

**Response:**
```json
{
  "success": true,
  "event_id": "video_started_uuid_1699876543210"
}
```

**Event Types:**
- `video_started`
- `video_progress`
- `video_completed`
- `video_rewatched`

---

## Usage Examples

### Example 1: Course Video Page

```tsx
import AnalyticsVideoPlayer from '@/components/video/AnalyticsVideoPlayer';
import { getVideo } from '@/lib/db/queries';

export default async function CourseVideoPage({ params }) {
  const video = await getVideo(params.videoId);
  const user = await getCurrentUser();
  const creator = await getCreator(video.creator_id);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">{video.title}</h1>

      <AnalyticsVideoPlayer
        video={video}
        studentId={user.id}
        creatorId={creator.id}
        referrerType="course_page"
      />

      <p className="mt-4 text-gray-600">{video.description}</p>
    </div>
  );
}
```

### Example 2: Custom Analytics Handling

```tsx
import VideoPlayer from '@/components/video/VideoPlayer';
import { useVideoWatchSession } from '@/hooks/useVideoWatchSession';
import { trackVideoStart, trackVideoProgress } from '@/lib/analytics/video-tracking';

export default function CustomVideoPlayer({ video, userId, creatorId }) {
  const { sessionId } = useVideoWatchSession(video.id, userId, creatorId);
  const [milestonesReached, setMilestonesReached] = useState(new Set());

  const handleStart = async () => {
    await trackVideoStart(video.id, creatorId, userId, sessionId, video.source_type);
  };

  const handleProgress = async (currentTime: number) => {
    const percent = (currentTime / video.duration_seconds) * 100;

    const milestones = [10, 25, 50, 75, 90];
    for (const milestone of milestones) {
      if (percent >= milestone && !milestonesReached.has(milestone)) {
        setMilestonesReached(prev => new Set([...prev, milestone]));
        await trackVideoProgress(video.id, creatorId, userId, sessionId, milestone);
      }
    }
  };

  return (
    <VideoPlayer
      video={video}
      onPlay={handleStart}
      onProgress={handleProgress}
    />
  );
}
```

### Example 3: Multiple Video Sources

```tsx
import AnalyticsVideoPlayer from '@/components/video/AnalyticsVideoPlayer';

export default function VideoGallery({ videos, userId, creatorId }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {videos.map(video => (
        <div key={video.id} className="space-y-2">
          <h3 className="font-semibold">{video.title}</h3>
          <p className="text-sm text-gray-500">Source: {video.source_type}</p>

          <AnalyticsVideoPlayer
            video={video}
            studentId={userId}
            creatorId={creatorId}
            referrerType="direct_link"
          />
        </div>
      ))}
    </div>
  );
}
```

---

## Testing

### Manual Testing Checklist

#### Mux Player
- [ ] Video loads and plays correctly
- [ ] Progress milestones tracked (10%, 25%, 50%, 75%, 90%)
- [ ] Completion event fires at 90%+
- [ ] Watch time updates every 5 seconds
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Error handling for invalid playback ID

#### Loom Player
- [ ] Loom video embeds correctly
- [ ] postMessage events received
- [ ] Progress tracking works
- [ ] Completion event fires
- [ ] Responsive iframe sizing
- [ ] Error handling for invalid video ID

#### YouTube Player
- [ ] YouTube video embeds correctly
- [ ] Play/pause events tracked
- [ ] Progress tracking works
- [ ] Completion event fires
- [ ] Error handling for unavailable videos

#### HTML5 Player
- [ ] Uploaded video plays correctly
- [ ] Native controls work
- [ ] Progress tracking accurate
- [ ] Completion event fires
- [ ] Error handling for missing files

#### Analytics
- [ ] Watch sessions created in database
- [ ] Progress updates recorded
- [ ] Sessions end properly on unmount
- [ ] Events logged to `video_analytics_events` table
- [ ] Dashboard shows accurate metrics

### Database Verification

After watching a video, check:

```sql
-- Check watch session
SELECT * FROM video_watch_sessions
WHERE video_id = 'your-video-id'
ORDER BY created_at DESC LIMIT 1;

-- Check analytics events
SELECT * FROM video_analytics_events
WHERE video_id = 'your-video-id'
ORDER BY timestamp DESC;

-- Check video analytics aggregation
SELECT * FROM video_analytics
WHERE video_id = 'your-video-id'
ORDER BY date DESC;
```

---

## Performance Metrics

### Target Metrics

| Metric | Target | Actual |
|--------|--------|--------|
| Initial load time | < 2s | TBD |
| Time to first frame | < 1s | TBD |
| Bundle size (Mux) | < 100KB | ~85KB |
| Bundle size (Loom) | < 10KB | ~8KB |
| API response time | < 200ms | TBD |

### Optimization Strategies

1. **Lazy loading**: MuxPlayer and LoomPlayer lazy-loaded
2. **API batching**: Progress updates throttled to 5-second intervals
3. **Retry logic**: 3 retries with exponential backoff
4. **Graceful degradation**: Analytics failures don't block playback

---

## Troubleshooting

### Common Issues

#### "Mux playback ID not found"
- **Cause**: Video record missing `mux_playback_id`
- **Fix**: Ensure Mux upload completed and playback ID saved

#### "Loom video not loading"
- **Cause**: Invalid `embed_id` or Loom video deleted
- **Fix**: Verify Loom video exists and embed_id is correct

#### "Watch session not created"
- **Cause**: Missing required fields or database error
- **Fix**: Check API logs and database constraints

#### Progress milestones not tracking
- **Cause**: Missing video duration or session ID
- **Fix**: Ensure `video.duration_seconds` set and session created

---

## Migration Guide

### Migrating from Old VideoPlayer

**Old code:**
```tsx
<VideoPlayer video={video} onProgress={handleProgress} />
```

**New code:**
```tsx
<AnalyticsVideoPlayer
  video={video}
  studentId={user.id}
  creatorId={creator.id}
  referrerType="course_page"
/>
```

### Benefits of New System

- ✅ Multi-source support (YouTube, Mux, Loom, upload)
- ✅ Automatic analytics tracking
- ✅ Watch session management
- ✅ Progress milestones
- ✅ Better error handling
- ✅ Mobile-responsive
- ✅ Lazy loading for performance

---

## Additional Resources

- [Mux Player React Documentation](https://docs.mux.com/guides/player-mux-player-react)
- [Loom Embed API](https://support.loom.com/hc/en-us/articles/360002158057)
- [YouTube IFrame API](https://developers.google.com/youtube/iframe_api_reference)
- [Chronos Database Schema](../database/schema.md)
- [Analytics Dashboard Guide](../analytics/dashboard.md)

---

**Last Updated**: November 12, 2025
**Author**: Agent 6 - Video Player Implementation
**Status**: ✅ Complete
