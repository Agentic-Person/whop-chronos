# Whop MOOCs Video Integration

## Overview

The Chronos platform now supports importing videos from Whop MOOCs (course platform) alongside YouTube URL imports. This integration allows creators to:

- Import Mux-hosted videos from Whop courses
- Import embedded videos (YouTube, Loom, Vimeo, Wistia) from Whop lessons
- Reuse existing course content without re-uploading
- Maintain single source of truth for course videos

## Video Types Supported

### 1. Mux Videos (Native Whop Hosting)

**Source Type:** `mux`

Whop uses Mux for native video hosting. These videos have:
- `mux_asset_id`: Internal Mux asset identifier
- `mux_playback_id`: HLS playback ID for streaming
- Duration, thumbnails, and playback tokens
- Status: `created`, `ready`, or `uploading`

**Database Storage:**
```typescript
{
  source_type: 'mux',
  whop_lesson_id: 'les_xxxxxxxxxx',
  mux_asset_id: 'asset_id',
  mux_playback_id: 'playback_id',
  title: 'Lesson Title',
  duration_seconds: 1234,
  thumbnail_url: 'https://mux.com/...',
  status: 'completed'
}
```

**Current Limitations:**
- ❌ Transcription not yet implemented (requires Mux API integration)
- ✅ Videos can be imported and displayed
- ✅ Metadata stored correctly

### 2. Embedded YouTube Videos

**Source Type:** `youtube`

Whop lessons can embed YouTube videos. When imported:
- Uses existing YouTube transcript extraction
- Triggers same processing pipeline as direct YouTube imports
- Stores both Whop lesson ID and YouTube video ID

**Database Storage:**
```typescript
{
  source_type: 'youtube',
  whop_lesson_id: 'les_xxxxxxxxxx',
  youtube_video_id: 'dQw4w9WgXcQ',
  embed_type: 'youtube',
  embed_id: 'dQw4w9WgXcQ',
  title: 'Lesson Title',
  transcript: '...',
  status: 'transcribing' → 'processing' → 'embedding' → 'completed'
}
```

**Processing Flow:**
1. Import lesson from Whop
2. Detect YouTube embed
3. Extract YouTube video ID
4. Trigger existing YouTube processor
5. Extract transcript and generate embeddings
6. Video ready for AI chat

### 3. Loom Embedded Videos

**Source Type:** `loom`

Whop lessons can embed Loom videos:
- Stored as embed with `embed_type: 'loom'`
- `embed_id` contains Loom video ID

**Database Storage:**
```typescript
{
  source_type: 'loom',
  whop_lesson_id: 'les_xxxxxxxxxx',
  embed_type: 'loom',
  embed_id: 'loom_video_id',
  title: 'Lesson Title',
  status: 'completed'
}
```

**Current Limitations:**
- ❌ Loom transcription not implemented
- ✅ Videos can be imported and stored
- 🔮 Future: Loom API integration for transcript extraction

### 4. Other Embeds (Vimeo, Wistia)

**Source Type:** `loom` (mapped)

Other embed types are currently mapped to `loom` source type:
- Vimeo embeds
- Wistia embeds

**Current Limitations:**
- ❌ Transcription not implemented
- ✅ Can be imported and stored
- 🔮 Future: Add dedicated source types and API integrations

## Database Schema

### Videos Table Columns

```sql
-- Whop-specific columns
ALTER TABLE videos
ADD COLUMN whop_lesson_id TEXT,
ADD COLUMN mux_asset_id TEXT,
ADD COLUMN mux_playback_id TEXT,
ADD COLUMN embed_type TEXT CHECK (embed_type IN ('youtube', 'loom', 'vimeo', 'wistia')),
ADD COLUMN embed_id TEXT;

-- Source type constraint (updated)
ALTER TABLE videos
ADD CONSTRAINT videos_source_type_check
CHECK (source_type IN ('youtube', 'mux', 'loom', 'upload'));

-- Indexes
CREATE INDEX idx_videos_whop_lesson_id ON videos(whop_lesson_id);
CREATE INDEX idx_videos_mux_asset_id ON videos(mux_asset_id);
CREATE INDEX idx_videos_mux_playback_id ON videos(mux_playback_id);
```

### Source Type Validation

```sql
ALTER TABLE videos
ADD CONSTRAINT videos_source_validation CHECK (
  -- YouTube videos: youtube_video_id must exist
  (source_type = 'youtube' AND youtube_video_id IS NOT NULL) OR

  -- Mux videos: mux_playback_id must exist
  (source_type = 'mux' AND mux_playback_id IS NOT NULL) OR

  -- Loom videos: embed_id must exist
  (source_type = 'loom' AND embed_id IS NOT NULL) OR

  -- Uploaded videos: storage_path must exist
  (source_type = 'upload' AND storage_path IS NOT NULL)
);
```

## API Endpoints

### POST /api/video/whop/import

Import a video from a Whop MOOCs lesson.

**Request Body:**
```typescript
{
  lessonId: string;      // Whop lesson ID (les_xxxxxxxxxx)
  creatorId: string;     // Chronos creator ID
}
```

**Response (Success):**
```typescript
{
  success: true;
  video: {
    id: string;
    title: string;
    source_type: 'youtube' | 'mux' | 'loom';
    status: 'pending' | 'completed';
  }
}
```

**Response (Error):**
```typescript
{
  success: false;
  error: string;
  code?: string;
}
```

**Error Codes:**
- `SDK_NOT_IMPLEMENTED`: Whop SDK not yet integrated (returns 501)
- `MISSING_VIDEO`: Lesson has no video content
- `DUPLICATE`: Lesson already imported (returns 409)

## Whop API Integration

### Current Status: ✅ **SDK FULLY IMPLEMENTED**

The Whop SDK integration is **complete and operational**. The system can now:

1. **✅ Fetch lesson data from Whop** using the official `@whop/sdk`
2. **✅ Extract Mux video metadata** (asset ID, playback ID, duration)
3. **✅ Detect embedded videos** (YouTube, Loom, Vimeo, Wistia)
4. **✅ Store videos in database** with correct source type and metadata
5. **✅ Trigger processing** for YouTube embeds (transcript extraction)

### Implementation Details

**File:** `lib/whop/api-client.ts`

```typescript
import { Whop } from '@whop/sdk';

const whopClient = new Whop({
  apiKey: process.env.WHOP_API_KEY,
});

export async function getLesson(lessonId: string): Promise<WhopLesson | null> {
  const lesson = await whopClient.courseLessons.retrieve(lessonId);

  // Extract Mux video data
  if (lesson.video_asset) {
    return {
      muxAssetId: lesson.video_asset.asset_id,
      muxPlaybackId: lesson.video_asset.playback_id,
      // ...
    };
  }

  // Parse content for embeds (YouTube, Loom, etc.)
  if (lesson.content) {
    const youtubeMatch = lesson.content.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
    if (youtubeMatch) {
      return {
        embedType: 'youtube',
        embedId: youtubeMatch[1],
        // ...
      };
    }
  }

  return mappedLesson;
}
```

### API Endpoint Status

**Endpoint:** `POST /api/video/whop/import`

- ✅ **Status:** Fully operational
- ✅ **Supports:** Mux videos, YouTube/Loom/Vimeo/Wistia embeds
- ✅ **Processing:** Auto-triggers transcript extraction for YouTube
- ✅ **Error Handling:** 404 for missing lessons, 409 for duplicates

### Usage Example

Import a Whop lesson:

```bash
curl -X POST http://localhost:3007/api/video/whop/import \
  -H "Content-Type: application/json" \
  -d '{
    "lessonId": "lesn_xxxxxxxxxxxxx",
    "creatorId": "creator_123"
  }'
```

**Response (Mux Video):**
```json
{
  "success": true,
  "video": {
    "id": "vid_abc123",
    "title": "Introduction to Trading",
    "source_type": "mux",
    "status": "completed"
  }
}
```

**Response (YouTube Embed):**
```json
{
  "success": true,
  "video": {
    "id": "vid_def456",
    "title": "How to Scale Your Business",
    "source_type": "youtube",
    "status": "pending"
  }
}
```

### Next Steps (Future Enhancements)

**Mux Transcription:**
- Integrate Mux API for transcript extraction
- Add Inngest job for Mux video processing
- Update video status flow: `completed` → `transcribing` → `embedding` → `completed`

**Loom/Vimeo/Wistia APIs:**
- Fetch transcripts from Loom API
- Add Vimeo/Wistia transcript support
- Enable AI chat for all embed types

## UI Integration

### VideoUrlUploader Component

Located: `components/courses/VideoUrlUploader.tsx`

**Features:**
- ✅ Tabs for "YouTube URL" and "Whop Lesson"
- ✅ YouTube URL input with metadata fetching
- ✅ Whop lesson ID input
- ✅ Unified import button
- ✅ Status polling for processing
- ✅ Error handling with retry

**Usage:**
```tsx
<VideoUrlUploader
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  onComplete={(videoId) => {
    console.log('Video imported:', videoId);
    refreshVideoList();
  }}
  creatorId={session.user.id}
/>
```

**Whop Tab:**
- Input: Whop lesson ID (e.g., `les_abc123`)
- Validates lesson ID format
- Shows "SDK not implemented" notice
- Imports video when SDK ready

## Video Playback

### Mux Video Player

For Mux videos, use HLS playback:

```tsx
import Hls from 'hls.js';

function MuxVideoPlayer({ muxPlaybackId }: { muxPlaybackId: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const src = `https://stream.mux.com/${muxPlaybackId}.m3u8`;

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(video);
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
    }
  }, [muxPlaybackId]);

  return <video ref={videoRef} controls />;
}
```

### YouTube Embeds

Use existing YouTube player:

```tsx
<iframe
  src={`https://www.youtube.com/embed/${youtubeVideoId}`}
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowFullScreen
/>
```

### Loom Embeds

```tsx
<iframe
  src={`https://www.loom.com/embed/${embedId}`}
  allowFullScreen
/>
```

## Processing Pipeline

### YouTube Embeds (Full Support ✅)

1. Import lesson from Whop
2. Detect YouTube embed
3. Extract transcript using `youtubei.js`
4. Chunk transcript (500-1000 words)
5. Generate embeddings (OpenAI ada-002)
6. Store in `video_chunks` table
7. Video ready for AI chat with timestamp citations

### Mux Videos (Partial Support ⚠️)

1. Import lesson from Whop
2. Store Mux asset ID and playback ID
3. Video can be displayed (HLS streaming)
4. ❌ Transcription pending (requires Mux API)
5. ❌ AI chat not available yet

**Future Implementation:**
```typescript
// Mux transcription flow
import Mux from '@mux/mux-node';

const mux = new Mux(
  process.env.MUX_TOKEN_ID,
  process.env.MUX_TOKEN_SECRET
);

// Get asset tracks
const asset = await mux.Video.Assets.get(muxAssetId);
const textTracks = asset.tracks.filter(track => track.type === 'text');

// Or use Mux transcription service
const transcript = await mux.Video.Assets.createTrack(muxAssetId, {
  type: 'text',
  text_type: 'subtitles',
  language_code: 'en',
  closed_captions: false,
  passthrough: 'chronos-transcription'
});
```

### Loom Videos (Not Implemented ❌)

1. Import lesson from Whop
2. Store embed ID
3. ❌ Transcription pending (requires Loom API)

**Future Implementation:**
- Loom API integration
- Transcript extraction
- Same chunking/embedding pipeline

## Troubleshooting

### "Whop SDK integration not yet implemented"

**Problem:** API returns 501 error when trying to import Whop lesson.

**Solution:**
1. Complete Whop SDK setup (see "Implementation Steps" above)
2. Update `lib/whop/api-client.ts` with `getLesson()` function
3. Test with valid lesson ID from your Whop course

### "Lesson does not contain a video"

**Problem:** Whop lesson has no Mux asset or embed.

**Solution:**
- Verify lesson type is `video` in Whop dashboard
- Check that lesson has either:
  - Mux video uploaded
  - OR YouTube/Loom/Vimeo embed added

### Duplicate Import Error

**Problem:** "This Whop lesson has already been imported"

**Solution:**
- Check `videos` table for existing `whop_lesson_id`
- If you need to re-import, delete the old video first
- Or use the existing video ID

### Mux Videos Don't Have Transcripts

**Problem:** Mux videos import successfully but can't be used in AI chat.

**Solution:**
- This is expected - Mux transcription not yet implemented
- Workaround: Use YouTube embeds for videos that need AI chat
- Future: Implement Mux API transcription

## Future Enhancements

### Phase 1: Mux Transcription (High Priority)

- [ ] Integrate Mux API for transcript extraction
- [ ] Add Inngest job for Mux video processing
- [ ] Test with Mux videos from Whop
- [ ] Update status: `pending` → `transcribing` → `processing` → `completed`

### Phase 2: Loom Integration (Medium Priority)

- [ ] Integrate Loom API
- [ ] Extract transcripts from Loom videos
- [ ] Add to existing chunking/embedding pipeline
- [ ] Support Loom videos in AI chat

### Phase 3: Bulk Import (Low Priority)

- [ ] List all courses for a company
- [ ] Show course → chapter → lesson hierarchy
- [ ] Checkbox selection for multiple lessons
- [ ] Batch import API endpoint
- [ ] Progress tracking UI

### Phase 4: Auto-Sync (Future)

- [ ] Webhook listener for Whop lesson updates
- [ ] Automatic re-import when lesson video changes
- [ ] Sync lesson metadata (title, description, order)
- [ ] Handle lesson deletions

## References

### Documentation

- Whop SDK Docs: https://docs.whop.com/sdk/whop-api-client
- Whop API Reference: https://dev.whop.com/reference/home
- Mux Video API: https://docs.mux.com/api-reference/video
- Loom API: https://dev.loom.com/

### Related Files

- API Endpoint: `app/api/video/whop/import/route.ts`
- Whop Types: `lib/whop/types.ts`
- Whop API Client: `lib/whop/api-client.ts`
- UI Component: `components/courses/VideoUrlUploader.tsx`
- Database Migration: `supabase/migrations/20250112000002_add_whop_video_columns.sql`

### Similar Implementations

- YouTube Import: `app/api/video/youtube/import/route.ts`
- YouTube Processor: `lib/video/youtube-processor.ts`
- Video Chunking: `inngest/functions/video-chunking.ts`
- Embedding Generation: `inngest/functions/generate-embeddings.ts`

---

**Status:** ⚠️ Partial Implementation
**Last Updated:** January 12, 2025
**Next Step:** Complete Whop SDK integration in `lib/whop/api-client.ts`
