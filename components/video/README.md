# VideoPlayer Component

Unified video player component with multi-source support and programmatic control via refs.

## Overview

The VideoPlayer component provides a consistent interface for playing videos from 4 different sources:
- **YouTube** - Free embedded videos via YouTube iframe API
- **Mux** - HLS streaming for Whop-hosted videos
- **Loom** - Screen recording embeds via Loom iframe API
- **Upload** - Direct file uploads via HTML5 video player

## Features

- Automatic player routing based on `source_type`
- Ref-based programmatic control (seek, play, pause, etc.)
- Comprehensive analytics tracking
- Progress milestone tracking (10%, 25%, 50%, 75%, 90%)
- Responsive design (16:9 aspect ratio)
- Error handling with fallback UI
- Lazy loading for Mux and Loom players

## Basic Usage

```tsx
import VideoPlayer from '@/components/video/VideoPlayer';

function LessonViewer() {
  return (
    <VideoPlayer
      video={videoData}
      studentId="student-123"
      creatorId="creator-456"
      onProgress={(currentTime) => console.log('Current time:', currentTime)}
      onComplete={() => console.log('Video completed!')}
      enableAnalytics={true}
    />
  );
}
```

## Programmatic Control (Ref-Based)

The VideoPlayer exposes a `VideoPlayerHandle` interface via React ref for programmatic control.

### Interface

```typescript
interface VideoPlayerHandle {
  seekTo: (seconds: number) => void;
  play: () => Promise<void>;
  pause: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  setVolume: (volume: number) => void; // 0-1
  setPlaybackRate: (rate: number) => void; // 0.5, 1, 1.5, 2
}
```

### Example: Seeking to Timestamp

```tsx
import { useRef } from 'react';
import VideoPlayer, { VideoPlayerHandle } from '@/components/video/VideoPlayer';

function LessonViewerWithTimestamps() {
  const playerRef = useRef<VideoPlayerHandle>(null);

  const handleTimestampClick = (seconds: number) => {
    playerRef.current?.seekTo(seconds);
  };

  return (
    <div>
      <VideoPlayer ref={playerRef} video={videoData} />

      <div className="mt-4 space-y-2">
        <h3>Jump to Section:</h3>
        <button onClick={() => handleTimestampClick(0)}>
          Intro (0:00)
        </button>
        <button onClick={() => handleTimestampClick(120)}>
          Main Concept (2:00)
        </button>
        <button onClick={() => handleTimestampClick(300)}>
          Example (5:00)
        </button>
      </div>
    </div>
  );
}
```

## Supported Video Sources

### 1. YouTube

**Cost:** $0 (100% free)
**seekTo() Implementation:** `youtubePlayerRef.current?.seekTo(seconds, true)`

### 2. Mux (Whop Videos)

**Cost:** $0.005/min for transcription
**seekTo() Implementation:** `muxPlayerRef.current.currentTime = seconds`

### 3. Loom

**Cost:** $0 (100% free)
**seekTo() Implementation:**
```javascript
iframeRef.current?.contentWindow?.postMessage({
  method: 'setCurrentTime',
  value: seconds
}, 'https://www.loom.com');
```

### 4. Upload (Direct File Upload)

**Cost:** $0.006/min (Whisper) + $0.021/GB/month (storage)
**seekTo() Implementation:** `videoRef.current.currentTime = seconds`

## Integration with Wave 2 (IntegratedLessonViewer)

```tsx
function IntegratedLessonViewer({ lesson, course, module }) {
  const playerRef = useRef<VideoPlayerHandle>(null);

  const handleTranscriptClick = (timestamp: number) => {
    playerRef.current?.seekTo(timestamp);
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <VideoPlayer
          ref={playerRef}
          video={lesson.video}
          courseId={course.id}
          moduleId={module.id}
        />
      </div>

      <div>
        <TranscriptPanel
          transcript={lesson.video.transcript}
          onTimestampClick={handleTranscriptClick}
        />
      </div>
    </div>
  );
}
```

## Testing

A comprehensive test harness is available at:
`components/video/__tests__/VideoPlayerSeekTest.tsx`

**Test Coverage:**
- Seek to start (0s), middle (50%), end (90%)
- Play/pause controls
- Volume control
- Playback rate control
