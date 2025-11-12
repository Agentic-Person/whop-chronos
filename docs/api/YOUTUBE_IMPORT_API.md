# YouTube Import API Endpoint

## Overview

The YouTube Import API endpoint allows creators to import videos from YouTube by providing a URL. The endpoint extracts video metadata and transcripts using `youtubei.js`, then saves the video to the database for processing.

**Endpoint:** `POST /api/video/youtube/import`

**Location:** `app/api/video/youtube/import/route.ts`

---

## Features

- ✅ Extracts video metadata (title, duration, thumbnail, channel info)
- ✅ Extracts full transcript with timestamps
- ✅ Validates YouTube URLs (multiple formats supported)
- ✅ Comprehensive error handling with user-friendly messages
- ✅ Automatic database integration
- ✅ Integrates with existing video processing pipeline
- ✅ Type-safe request/response schemas

---

## Request

### Method
`POST`

### Headers
```
Content-Type: application/json
```

### Body Schema

```typescript
{
  videoUrl: string;    // YouTube video URL (required)
  creatorId: string;   // UUID of the creator (required)
}
```

### Supported YouTube URL Formats

- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/embed/VIDEO_ID`
- `https://www.youtube.com/v/VIDEO_ID`
- `https://m.youtube.com/watch?v=VIDEO_ID`

### Example Request

```typescript
const response = await fetch('/api/video/youtube/import', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    creatorId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  }),
});

const data = await response.json();
```

---

## Response

### Success Response (200 OK)

```typescript
{
  success: true;
  video: {
    id: string;                  // Video UUID in database
    title: string;               // Video title
    youtube_video_id: string;    // YouTube video ID (11 characters)
    status: string;              // Processing status (e.g., 'transcribing')
  }
}
```

### Example Success Response

```json
{
  "success": true,
  "video": {
    "id": "b8e8c3a0-1234-5678-90ab-cdef12345678",
    "title": "Never Gonna Give You Up",
    "youtube_video_id": "dQw4w9WgXcQ",
    "status": "transcribing"
  }
}
```

---

## Error Responses

All error responses follow this format:

```typescript
{
  success: false;
  error: string;      // User-friendly error message
  code?: string;      // Error code (for YouTube-specific errors)
}
```

### HTTP Status Codes

| Status Code | Description | Example Scenario |
|------------|-------------|------------------|
| `200` | Success | Video imported successfully |
| `400` | Bad Request | Invalid URL, missing fields, no transcript available |
| `403` | Forbidden | Private video |
| `404` | Not Found | Video deleted or doesn't exist |
| `409` | Conflict | Video already imported |
| `429` | Too Many Requests | Rate limited by YouTube |
| `500` | Internal Server Error | Unexpected server error |
| `503` | Service Unavailable | Network error connecting to YouTube |

### Error Codes

| Error Code | Status | Description | User Message |
|-----------|--------|-------------|--------------|
| `INVALID_URL` | 400 | Invalid YouTube URL format | "Invalid YouTube URL. Please provide a valid YouTube video link." |
| `VIDEO_NOT_FOUND` | 404 | Video not found or deleted | "Video not found. The video may be deleted or the URL is incorrect." |
| `VIDEO_PRIVATE` | 403 | Video is private | "This video is private. Please use a public video." |
| `NO_TRANSCRIPT` | 400 | No captions/transcript available | "No transcript available. Please enable captions on this video or use a different video." |
| `AGE_RESTRICTED` | 400 | Video is age-restricted | "Age-restricted videos are not supported. Please use a non-restricted video." |
| `RATE_LIMITED` | 429 | Too many requests to YouTube | "Too many requests. Please wait a few minutes and try again." |
| `NETWORK_ERROR` | 503 | Network connection issue | "Network error. Please check your connection and try again." |
| `UNKNOWN_ERROR` | 500 | Unexpected error | "An unexpected error occurred. Please try again later." |

### Example Error Responses

**Invalid URL (400)**
```json
{
  "success": false,
  "error": "Invalid YouTube URL. Please provide a valid YouTube video link.",
  "code": "INVALID_URL"
}
```

**No Transcript Available (400)**
```json
{
  "success": false,
  "error": "No transcript available. Please enable captions on this video or use a different video.",
  "code": "NO_TRANSCRIPT"
}
```

**Video Already Imported (409)**
```json
{
  "success": false,
  "error": "This YouTube video has already been imported."
}
```

---

## Database Integration

### Videos Table Insert

The endpoint inserts a new record into the `videos` table with the following fields:

```sql
INSERT INTO videos (
  creator_id,
  source_type,
  youtube_video_id,
  youtube_channel_id,
  title,
  description,
  duration_seconds,
  thumbnail_url,
  transcript,
  status,
  metadata
) VALUES (...)
```

### Metadata Stored

```typescript
{
  channel_name: string;           // YouTube channel name
  source_url: string;             // Original YouTube URL
  import_type: 'youtube';         // Always 'youtube' for this endpoint
  imported_at: string;            // ISO timestamp
  transcript_segments: number;    // Number of transcript segments
}
```

---

## Processing Pipeline Integration

After successful import, the video automatically enters the existing processing pipeline:

1. **Status:** `transcribing` (set by this endpoint)
2. **Next Stage:** Inngest job picks up video for chunking
3. **Status:** `processing` (chunking transcript into segments)
4. **Next Stage:** Generate embeddings for each chunk
5. **Status:** `embedding` (creating vector embeddings)
6. **Final Status:** `completed` (ready for AI chat)

**Note:** No additional triggers needed - the existing Inngest pipeline watches the `videos` table.

---

## Usage Examples

### Frontend Component Example

```typescript
'use client';

import { useState } from 'react';

export function YouTubeImporter({ creatorId }: { creatorId: string }) {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);

  const handleImport = async () => {
    setStatus('loading');
    setError(null);

    try {
      const response = await fetch('/api/video/youtube/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoUrl: url.trim(),
          creatorId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Import failed');
      }

      setStatus('success');
      setVideoId(data.video.id);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  return (
    <div>
      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Paste YouTube URL here..."
      />
      <button onClick={handleImport} disabled={status === 'loading'}>
        {status === 'loading' ? 'Importing...' : 'Import Video'}
      </button>

      {status === 'error' && <p className="error">{error}</p>}
      {status === 'success' && <p className="success">Video imported! ID: {videoId}</p>}
    </div>
  );
}
```

### Server Action Example

```typescript
'use server';

import { getServiceSupabase } from '@/lib/db/client';

export async function importYouTubeVideo(videoUrl: string, creatorId: string) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/video/youtube/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ videoUrl, creatorId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Import failed');
  }

  return response.json();
}
```

---

## Testing

### Manual Testing

1. **Start development server:**
   ```bash
   npm run dev
   ```

2. **Test with cURL:**
   ```bash
   curl -X POST http://localhost:3000/api/video/youtube/import \
     -H "Content-Type: application/json" \
     -d '{
       "videoUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
       "creatorId": "test-creator-id"
     }'
   ```

3. **Test with script:**
   ```bash
   npx tsx scripts/test-youtube-import-endpoint.ts
   ```

### Test Cases

See `scripts/test-youtube-import-endpoint.ts` for comprehensive test suite including:

- ✅ Standard YouTube URLs
- ✅ Short URLs (youtu.be)
- ✅ Embed URLs
- ✅ Invalid URL formats
- ✅ Missing required fields
- ✅ Error handling scenarios

---

## Performance

### Expected Response Times

- **Successful import:** 5-15 seconds
  - Video metadata extraction: 2-5 seconds
  - Transcript extraction: 3-8 seconds
  - Database insert: <1 second

- **Error responses:** <2 seconds
  - URL validation: <100ms
  - YouTube API errors: 1-2 seconds

### Rate Limiting

YouTube's InnerTube API has informal rate limits:
- **Recommended:** 10-20 imports per minute per IP
- **Built-in retry logic:** 3 attempts with exponential backoff
- **Backoff delays:** 1s, 2s, 4s

---

## Security Considerations

1. **Authentication:** Validate `creatorId` matches authenticated user
2. **Input validation:** URL validation prevents injection attacks
3. **Rate limiting:** Implement application-level rate limiting (Upstash)
4. **Service role:** Uses Supabase service role to bypass RLS (required for system operations)
5. **Error messages:** Don't expose internal details in error messages

---

## Troubleshooting

### Common Issues

**Issue:** "No transcript available"
- **Solution:** Video must have auto-generated or manual captions enabled on YouTube

**Issue:** "Video is private"
- **Solution:** Only public YouTube videos are supported

**Issue:** "Rate limited"
- **Solution:** Wait a few minutes before retrying. Consider implementing request queuing.

**Issue:** Database constraint violation (409)
- **Solution:** Video already imported. Check `videos` table for existing record.

---

## Related Files

- **Endpoint:** `app/api/video/youtube/import/route.ts`
- **YouTube Processor:** `lib/video/youtube-processor.ts`
- **Database Client:** `lib/db/client.ts`
- **Database Types:** `lib/db/types.ts`
- **Test Script:** `scripts/test-youtube-import-endpoint.ts`
- **Implementation Plan:** `docs/YOUTUBE_EMBEDDING_IMPLEMENTATION_PLAN.md`

---

## Future Enhancements

- [ ] Batch import (multiple videos at once)
- [ ] Playlist import (entire YouTube playlists)
- [ ] Webhook notifications on completion
- [ ] Progress streaming (Server-Sent Events)
- [ ] Multi-language transcript support
- [ ] Auto-sync (detect when YouTube video is updated)

---

**Last Updated:** 2025-11-11
**Version:** 1.0.0
**Status:** Production Ready
