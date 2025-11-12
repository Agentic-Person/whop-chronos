# Video Components

This directory contains video-related components for the Chronos platform.

## Components

### VideoPlayer

**Purpose:** Full-featured video player for creator dashboard with event tracking and programmatic control.

**Supports:**
- YouTube embedded videos (via `react-youtube`)
- Uploaded video files (via native HTML5 video)

**Props:**
- `video` - Video object from database (must include `source_type` field)
- `onProgress` - Callback fired when playback position changes (currentTime in seconds)
- `onComplete` - Callback fired when video playback completes
- `onPlay` - Callback fired when video starts playing
- `onPause` - Callback fired when video is paused
- `autoplay` - Whether to autoplay the video (default: false)
- `className` - Additional CSS classes for the container

**Usage:**
```tsx
import { VideoPlayer } from '@/components/video';

<VideoPlayer
  video={videoData}
  onProgress={(time) => console.log('Current time:', time)}
  onComplete={() => console.log('Video completed')}
  onPlay={() => console.log('Video started')}
  onPause={() => console.log('Video paused')}
/>
```

**Example with YouTube video:**
```tsx
const youtubeVideo = {
  id: '123',
  source_type: 'youtube',
  youtube_video_id: 'dQw4w9WgXcQ',
  title: 'My YouTube Video',
  // ... other fields
};

<VideoPlayer video={youtubeVideo} />
```

**Example with uploaded video:**
```tsx
const uploadedVideo = {
  id: '456',
  source_type: 'upload',
  storage_path: '/videos/my-video.mp4',
  url: 'https://example.com/videos/my-video.mp4',
  title: 'My Uploaded Video',
  // ... other fields
};

<VideoPlayer video={uploadedVideo} />
```

---

### LiteVideoPlayer

**Purpose:** Lightweight video player optimized for performance on student-facing pages.

**Benefits:**
- Only loads YouTube iframe when user clicks play (lazy loading)
- Significantly faster page load times
- Reduces bandwidth consumption
- Improves page speed scores
- Ideal for pages with multiple videos

**Use Cases:**
- Course catalog pages
- Video library listings
- Student dashboard
- Any page with multiple videos

**For creator dashboard with advanced controls, use `VideoPlayer` instead.**

**Props:**
- `video` - Video object from database (must include `source_type` field)
- `className` - Additional CSS classes for the container
- `poster` - YouTube thumbnail quality: 'default', 'hqdefault', 'mqdefault', 'sddefault', 'maxresdefault' (default: 'maxresdefault')
- `aspectHeight` - Custom aspect ratio height (default: 9)
- `aspectWidth` - Custom aspect ratio width (default: 16)

**Usage:**
```tsx
import { LiteVideoPlayer } from '@/components/video';

<LiteVideoPlayer
  video={videoData}
  poster="maxresdefault"
/>
```

**Example for course page with multiple videos:**
```tsx
import { LiteVideoPlayer } from '@/components/video';

function CoursePage({ videos }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {videos.map((video) => (
        <div key={video.id}>
          <LiteVideoPlayer video={video} />
          <h3>{video.title}</h3>
        </div>
      ))}
    </div>
  );
}
```

---

### Other Components

- **VideoUploader** - Handles video file uploads with drag-and-drop
- **VideoPreview** - Displays video metadata with edit/delete controls
- **VideoList** - Grid/list view of videos with filtering and sorting
- **ProcessingStatus** - Shows video processing pipeline status

---

## Database Schema Requirements

Both `VideoPlayer` and `LiteVideoPlayer` expect the following fields in the video object:

**Required for all videos:**
- `id` (string)
- `title` (string)
- `source_type` ('youtube' | 'upload')

**Required for YouTube videos:**
- `youtube_video_id` (string) - The 11-character YouTube video ID

**Required for uploaded videos:**
- `storage_path` (string) OR `url` (string) - Path to the video file

**Optional fields:**
- `thumbnail_url` (string) - Custom thumbnail
- `description` (string)
- `duration_seconds` (number)
- `created_at` (string)
- All other fields from the `videos` table

---

## Migration from Old Video Player

If you have an existing video player component, replace it with:

**For creator dashboard:**
```tsx
// Old
<OldVideoPlayer src={video.url} />

// New
import { VideoPlayer } from '@/components/video';
<VideoPlayer video={video} />
```

**For student view:**
```tsx
// Old
<OldVideoPlayer src={video.url} />

// New
import { LiteVideoPlayer } from '@/components/video';
<LiteVideoPlayer video={video} />
```

---

## Performance Comparison

| Component | Bundle Size | Loads Iframe | Best For |
|-----------|-------------|--------------|----------|
| VideoPlayer | ~15KB | Immediately | Creator dashboard, single video pages |
| LiteVideoPlayer | ~3KB | On click | Course pages, video listings |

---

## Error Handling

Both components include built-in error handling:

- **YouTube video not available** - Shows error message with video ID
- **Uploaded video file missing** - Shows error message with file path
- **No video source** - Shows "No video source available" message
- **Network errors** - Gracefully degrades with error display

All errors are logged to the console for debugging.

---

## Styling

Both components use Tailwind CSS classes and include:
- Responsive aspect ratio (16:9)
- Rounded corners
- Dark background for video container
- Full width containers

Override with `className` prop:
```tsx
<VideoPlayer
  video={video}
  className="max-w-4xl mx-auto shadow-lg"
/>
```

---

## Browser Support

- **Chrome/Edge:** Full support
- **Firefox:** Full support
- **Safari:** Full support (including iOS)
- **Opera:** Full support

Note: YouTube embedding requires JavaScript enabled in the browser.

---

## Testing

To test the components:

1. **Test YouTube video:**
```tsx
const testYouTube = {
  id: 'test-yt',
  source_type: 'youtube' as const,
  youtube_video_id: 'dQw4w9WgXcQ',
  title: 'Test YouTube Video',
};
```

2. **Test uploaded video:**
```tsx
const testUpload = {
  id: 'test-upload',
  source_type: 'upload' as const,
  url: 'https://example.com/sample.mp4',
  title: 'Test Uploaded Video',
};
```

3. **Test error states:**
```tsx
// Missing video ID
const testError1 = {
  id: 'test-error',
  source_type: 'youtube' as const,
  youtube_video_id: null,
  title: 'Error Test',
};

// Missing storage path
const testError2 = {
  id: 'test-error',
  source_type: 'upload' as const,
  url: null,
  storage_path: null,
  title: 'Error Test',
};
```

---

## Dependencies

- `react-youtube` (^10.1.0) - Full YouTube iframe API
- `react-lite-youtube-embed` (^2.5.6) - Lightweight YouTube embed
- `react` (^18+)
- `@/lib/db/types` - Database type definitions

---

## Future Enhancements

Potential improvements for future versions:

- [ ] Vimeo video support
- [ ] Wistia video support
- [ ] Picture-in-picture mode
- [ ] Playback speed controls
- [ ] Keyboard shortcuts
- [ ] Captions/subtitle support
- [ ] Analytics tracking integration
- [ ] Video quality selection

---

**Last Updated:** 2025-01-11
