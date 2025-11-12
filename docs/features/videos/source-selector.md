# Video Source Selector

## Overview

The `VideoSourceSelector` is a unified interface that consolidates all video import methods into a single, intuitive tab-based component. It supports importing videos from YouTube, Loom, Whop lessons, and direct file uploads.

## Component API

### VideoSourceSelector

```typescript
import VideoSourceSelector from '@/components/video/VideoSourceSelector';

<VideoSourceSelector
  creatorId={creator.id}
  isOpen={true}
  onClose={() => setIsOpen(false)}
  onVideoImported={(video) => console.log('Imported:', video)}
  onError={(error) => console.error('Error:', error)}
  defaultTab="youtube"
  showPreview={true}
  className=""
/>
```

### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `creatorId` | string | Yes | - | Creator's unique identifier |
| `isOpen` | boolean | Yes | - | Controls modal visibility |
| `onClose` | () => void | Yes | - | Callback when modal is closed |
| `onVideoImported` | (video: Video) => void | No | - | Callback when video successfully imported |
| `onError` | (error: Error) => void | No | - | Callback when import fails |
| `defaultTab` | SourceType | No | 'youtube' | Initial active tab |
| `showPreview` | boolean | No | true | Enable video preview before import |
| `className` | string | No | '' | Additional CSS classes |

### Video Object

```typescript
interface Video {
  id: string;
  title: string;
  thumbnail?: string;
  duration?: number;
  source_type?: 'youtube' | 'loom' | 'whop' | 'upload';
}
```

## Tab Features

### 1. YouTube Tab

**Features:**
- URL validation (supports youtube.com/watch, youtu.be, youtube.com/embed)
- Metadata preview (thumbnail, title, duration, channel)
- Automatic transcript extraction
- Video embedding support

**URL Formats:**
```
https://www.youtube.com/watch?v=VIDEO_ID
https://youtu.be/VIDEO_ID
https://www.youtube.com/embed/VIDEO_ID
https://m.youtube.com/watch?v=VIDEO_ID
```

**Import Process:**
1. User pastes YouTube URL
2. Click "Fetch Preview" to load metadata
3. Preview shows thumbnail, title, duration, channel
4. Click "Import YouTube Video"
5. Backend extracts transcript using youtubei.js
6. Transcript is chunked and embedded
7. Processing takes 2-5 minutes

### 2. Loom Tab

**Features:**
- URL validation (supports loom.com/share, loom.com/embed)
- Metadata preview via Loom API
- FREE transcript extraction using Loom API
- Creator information display

**URL Formats:**
```
https://www.loom.com/share/VIDEO_ID
https://www.loom.com/embed/VIDEO_ID
https://loom.com/share/VIDEO_ID
```

**Import Process:**
1. User pastes Loom URL
2. Click "Fetch Preview" to load metadata
3. Preview shows thumbnail, title, duration, creator
4. Click "Import Loom Video"
5. Backend calls Loom API for transcript
6. Transcript is chunked and embedded
7. Processing takes 2-5 minutes

**Requirements:**
- `LOOM_API_KEY` environment variable must be set
- Loom video must have captions enabled
- Video must be public or accessible

### 3. Whop Tab

**Features:**
- Two import modes: URL and Browse
- URL mode: Import by Whop lesson ID
- Browse mode: Select product → select videos → bulk import
- Supports Mux videos, YouTube embeds, Loom embeds

**URL Import Mode:**
```typescript
// Input: Whop lesson ID
lessonId: "les_xxxxxxxxxx"
```

**Browse Mode:**
1. Select a product from dropdown
2. View all lessons in that product
3. Select multiple lessons with checkboxes
4. Bulk import selected videos

**Supported Video Types:**
- **Mux videos**: Imported immediately (no transcription yet)
- **YouTube embeds**: 2-5 min processing (transcript extraction)
- **Loom embeds**: 2-5 min processing (Loom API transcript)

**Import Process:**
1. Enter lesson ID OR browse products
2. Select lessons (single or multiple)
3. Click "Import Whop Lesson(s)"
4. Backend fetches lesson data from Whop
5. Determines video type (Mux/YouTube/Loom)
6. Processes accordingly

### 4. Upload Tab

**Features:**
- Drag-and-drop file upload
- File browser fallback
- File size validation (max 2GB)
- File type validation
- Upload progress tracking

**Supported Formats:**
- MP4 (.mp4)
- WebM (.webm)
- QuickTime (.mov)
- AVI (.avi)

**Upload Process:**
1. Drag file or click to browse
2. File is validated (type and size)
3. Preview shows file name and size
4. Click "Upload Video"
5. File uploaded to Supabase Storage
6. Transcription via OpenAI Whisper
7. Processing takes 2-10 minutes

**Limits:**
- Maximum file size: 2GB
- One file at a time

## URL Validation

### YouTube URL Validator

```typescript
import { extractYouTubeVideoId } from '@/lib/video/youtube-processor';

try {
  const videoId = extractYouTubeVideoId(url);
  console.log('Valid YouTube URL:', videoId);
} catch (error) {
  console.error('Invalid YouTube URL');
}
```

### Loom URL Validator

```typescript
import { extractLoomVideoId } from '@/lib/video/loom-processor';

try {
  const videoId = extractLoomVideoId(url);
  console.log('Valid Loom URL:', videoId);
} catch (error) {
  console.error('Invalid Loom URL');
}
```

## Video Preview Component

```typescript
import VideoPreviewCard from '@/components/video/VideoPreviewCard';

<VideoPreviewCard
  thumbnail="https://..."
  title="Introduction to React"
  duration={720} // seconds
  channel="Code Academy"
  description="Learn React basics..."
  source="youtube"
/>
```

## Import Progress Component

```typescript
import ImportProgress from '@/components/video/ImportProgress';

<ImportProgress
  progress={45}
  currentStep="Extracting transcript..."
  onCancel={() => cancelImport()}
/>
```

**Progress Steps:**
1. Fetching metadata (0-25%)
2. Extracting transcript (25-50%)
3. Chunking content (50-75%)
4. Generating embeddings (75-100%)

## State Management Hook

```typescript
import { useVideoImport } from '@/hooks/useVideoImport';

const {
  activeTab,
  setActiveTab,
  importing,
  progress,
  currentStep,
  error,
  importVideo,
  cancelImport,
  clearError,
} = useVideoImport({
  creatorId: 'creator_123',
  defaultTab: 'youtube',
  onSuccess: (video) => console.log('Success:', video),
  onError: (error) => console.error('Error:', error),
});

// Import a video
await importVideo('youtube', { url: 'https://youtube.com/...' });

// Cancel ongoing import
cancelImport();

// Switch tabs
setActiveTab('loom');
```

## Analytics Tracking

The source selector automatically tracks:

### Tab Selection Events

```typescript
{
  event_type: 'source_tab_selected',
  creator_id: 'creator_123',
  metadata: {
    source_type: 'youtube' | 'loom' | 'whop' | 'upload'
  }
}
```

### Video Import Events

```typescript
{
  event_type: 'video_imported',
  video_id: 'video_123',
  creator_id: 'creator_123',
  metadata: {
    source_type: 'youtube',
    import_method: 'url' | 'browse' // for Whop
  }
}
```

### Analytics Queries

```typescript
import { getSourceUsageStats } from '@/lib/analytics/source-tracking';

// Get stats for a creator
const stats = await getSourceUsageStats('creator_123');
// Returns:
// [
//   { source_type: 'youtube', import_count: 15, percentage: 60 },
//   { source_type: 'loom', import_count: 8, percentage: 32 },
//   { source_type: 'whop', import_count: 2, percentage: 8 }
// ]
```

## API Endpoints

### YouTube Import
```
POST /api/video/youtube/import
Body: { videoUrl: string, creatorId: string, title?: string }
Returns: { success: true, video: { id, title, status } }
```

### Loom Import
```
POST /api/video/loom/import
Body: { videoUrl: string, creatorId: string, title?: string }
Returns: { success: true, video: { id, title, status } }
```

### Loom Metadata (Preview)
```
POST /api/video/loom/metadata
Body: { videoUrl: string }
Returns: { videoId, title, duration, thumbnail, creatorName }
```

### Whop Import
```
POST /api/video/whop/import
Body: { lessonId: string, creatorId: string }
Returns: { success: true, video: { id, title, source_type, status } }
```

### Whop Products
```
GET /api/whop/products
Returns: { success: true, products: [...] }
```

### Whop Product Lessons
```
GET /api/whop/products/[productId]/lessons
Returns: { success: true, lessons: [...] }
```

## Error Handling

### YouTube Errors

- `INVALID_URL`: Malformed YouTube URL
- `VIDEO_NOT_FOUND`: Video doesn't exist
- `VIDEO_PRIVATE`: Video is private
- `NO_TRANSCRIPT`: No captions available
- `AGE_RESTRICTED`: Age-restricted content
- `RATE_LIMITED`: Too many requests

### Loom Errors

- `INVALID_URL`: Malformed Loom URL
- `VIDEO_NOT_FOUND`: Video doesn't exist
- `VIDEO_PRIVATE`: Video is private
- `NO_TRANSCRIPT`: Captions not enabled
- `API_KEY_MISSING`: Loom API key not configured
- `API_KEY_INVALID`: Invalid Loom API key
- `RATE_LIMITED`: API rate limit exceeded

### Whop Errors

- `LESSON_NOT_FOUND`: Lesson doesn't exist
- `NO_VIDEO`: Lesson has no video content
- Database duplicate errors (409 status)

## Mobile Responsiveness

The component is fully responsive:

- **Desktop (>768px)**: Full tab layout with previews
- **Tablet (768px)**: Stacked tabs with smaller previews
- **Mobile (<375px)**: Vertical tab stack, compact UI

## Accessibility

- **Keyboard navigation**: Full tab/enter support
- **ARIA labels**: All interactive elements labeled
- **Screen reader support**: Progress announcements
- **Focus management**: Proper focus trapping in modal

## Performance Considerations

1. **Lazy loading**: Tab content only renders when active
2. **Debounced API calls**: URL validation debounced 500ms
3. **Optimistic UI**: Instant tab switching
4. **Status polling**: 3-second intervals for import progress
5. **Cleanup**: Intervals cleared on unmount

## Testing

```bash
# Component tests
npm test VideoSourceSelector

# Integration tests
npm test video-import-flow

# E2E tests
npm run e2e video-source-selector
```

## Example Usage in CourseBuilder

```typescript
import VideoSourceSelector from '@/components/video/VideoSourceSelector';

export default function CourseBuilder() {
  const [showImporter, setShowImporter] = useState(false);
  const { creatorId } = useAnalytics();

  const handleVideoImported = (video: Video) => {
    console.log('Video imported:', video);
    addVideoToLesson(video.id);
    setShowImporter(false);
  };

  return (
    <>
      <button onClick={() => setShowImporter(true)}>
        Import Video
      </button>

      <VideoSourceSelector
        creatorId={creatorId}
        isOpen={showImporter}
        onClose={() => setShowImporter(false)}
        onVideoImported={handleVideoImported}
        defaultTab="youtube"
        showPreview={true}
      />
    </>
  );
}
```

## Troubleshooting

### YouTube Import Fails

1. Check video is public
2. Verify captions are enabled
3. Check for age restrictions
4. Try with a different video

### Loom Import Fails

1. Verify `LOOM_API_KEY` is set
2. Check video is public
3. Ensure captions are enabled in Loom
4. Check API key permissions

### Whop Import Fails

1. Verify lesson ID is correct (starts with `les_`)
2. Check lesson contains video
3. Verify Whop API credentials
4. Check product permissions

### Upload Fails

1. Check file size (must be <2GB)
2. Verify file format (MP4, WebM, MOV, AVI)
3. Check Supabase Storage configuration
4. Verify `OPENAI_API_KEY` for transcription

## Future Enhancements

- [ ] Vimeo import support
- [ ] Wistia import support
- [ ] Batch upload (multiple files)
- [ ] Import from Google Drive
- [ ] Import from Dropbox
- [ ] Video trimming before import
- [ ] Subtitle file upload (.srt, .vtt)
