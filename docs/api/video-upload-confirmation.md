# Video Upload Confirmation API

## Endpoint

`POST /api/video/[id]/confirm`

## Purpose

Confirms that a video file has been successfully uploaded to Supabase Storage and triggers the Inngest video processing pipeline (transcription → chunking → embedding).

## Workflow

1. Client uploads video using signed URL from `/api/video/upload`
2. Client calls this confirmation endpoint
3. Endpoint validates upload and triggers processing
4. Returns processing job information

## Request

### URL Parameters

- `id` (required): Video ID returned from `/api/video/upload`

### Headers

```
Content-Type: application/json
Authorization: Bearer <whop-token>
```

### Body

No request body required.

## Response

### Success Response (200 OK)

```json
{
  "success": true,
  "video": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Introduction to Trading",
    "status": "pending"
  },
  "processing": {
    "jobId": "01HQXYZ123ABC",
    "estimatedTime": "2-5 minutes"
  }
}
```

### Error Responses

#### Video Not Found (404)

```json
{
  "error": "Video not found",
  "details": "No video with that ID"
}
```

#### Invalid Status (400)

```json
{
  "error": "Video is not in uploading state",
  "details": "Current status: processed"
}
```

#### File Not Found in Storage (404)

```json
{
  "error": "Video file not found in storage",
  "details": "File does not exist"
}
```

#### Empty File (400)

```json
{
  "error": "Video file is empty",
  "details": "Upload may have failed or been interrupted"
}
```

#### Processing Failed (500)

```json
{
  "error": "Failed to trigger video processing",
  "details": "Inngest event send failed"
}
```

## Validation Steps

The endpoint performs these validations:

1. **Video Exists**: Checks video record exists in database
2. **Status Check**: Ensures status is exactly "uploading"
3. **Storage Path**: Verifies storage_path field is set
4. **File Exists**: Confirms file exists in Supabase Storage
5. **File Size**: Validates file size > 0 bytes
6. **Inngest Event**: Successfully sends processing event

## Processing Pipeline

After confirmation, the following happens:

1. Video status changes: `uploading` → `pending`
2. Inngest event `video/transcribe.requested` is sent
3. Background job starts:
   - Extract audio from video
   - Transcribe using OpenAI Whisper
   - Chunk transcript (500-1000 words)
   - Generate embeddings (OpenAI ada-002)
   - Store in `video_chunks` table
   - Update status to `processed`

## Example Usage

### Using cURL

```bash
# 1. Upload video (get video ID and signed URL)
curl -X POST https://chronos.app/api/video/upload \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_WHOP_TOKEN" \
  -d '{
    "filename": "trading-lesson-1.mp4",
    "fileSize": 52428800,
    "mimeType": "video/mp4",
    "title": "Trading Basics - Lesson 1",
    "creatorId": "creator_123"
  }'

# Response includes video ID and upload URL
# {
#   "video": { "id": "550e8400-e29b-41d4-a716-446655440000" },
#   "upload": { "url": "https://...", "method": "PUT" }
# }

# 2. Upload file to signed URL
curl -X PUT "SIGNED_UPLOAD_URL" \
  -H "Content-Type: video/mp4" \
  --data-binary "@trading-lesson-1.mp4"

# 3. Confirm upload (triggers processing)
curl -X POST https://chronos.app/api/video/550e8400-e29b-41d4-a716-446655440000/confirm \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_WHOP_TOKEN"

# Response:
# {
#   "success": true,
#   "video": {
#     "id": "550e8400-e29b-41d4-a716-446655440000",
#     "title": "Trading Basics - Lesson 1",
#     "status": "pending"
#   },
#   "processing": {
#     "jobId": "01HQXYZ123ABC",
#     "estimatedTime": "2-5 minutes"
#   }
# }
```

### Using JavaScript/TypeScript

```typescript
async function confirmVideoUpload(videoId: string, token: string) {
  const response = await fetch(`/api/video/${videoId}/confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  const result = await response.json();
  console.log('Processing started:', result.processing);
  return result;
}
```

### Complete Upload Flow

```typescript
async function uploadAndProcessVideo(file: File, token: string, creatorId: string) {
  // Step 1: Get upload URL
  const uploadResponse = await fetch('/api/video/upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      filename: file.name,
      fileSize: file.size,
      mimeType: file.type,
      title: file.name,
      creatorId,
    }),
  });

  const { video, upload } = await uploadResponse.json();

  // Step 2: Upload file to storage
  await fetch(upload.url, {
    method: 'PUT',
    body: file,
    headers: upload.headers,
  });

  // Step 3: Confirm and trigger processing
  const confirmResponse = await fetch(`/api/video/${video.id}/confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  return await confirmResponse.json();
}
```

## Testing Locally

### Prerequisites

```bash
# Set environment variables
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
INNGEST_EVENT_KEY=your_inngest_key
```

### Test Command

```bash
# After uploading a video, confirm it
curl -X POST http://localhost:3000/api/video/YOUR_VIDEO_ID/confirm \
  -H "Content-Type: application/json"
```

### Expected Logs

```
Inngest event sent: { ids: ['01HQXYZ123ABC'] }
Video status updated: uploading → pending
```

## Error Handling

The endpoint includes comprehensive error handling:

1. **Video not found**: Returns 404 with details
2. **Wrong status**: Returns 400 if not "uploading"
3. **File missing**: Returns 404 if storage file doesn't exist
4. **Empty file**: Returns 400 if file size is 0
5. **Inngest failure**: Reverts status and returns 500

If Inngest event fails, the video status is automatically reverted back to "uploading" so the user can retry.

## Rate Limiting

- No specific rate limit on this endpoint
- Limited by upload quotas (tier-based)
- Each video can only be confirmed once

## Security

- Validates video belongs to creator (via creator_id)
- Checks file actually exists in storage
- Prevents re-confirmation of already processed videos
- Uses service role key for storage verification

## Related Endpoints

- `POST /api/video/upload` - Initiate upload
- `GET /api/video/[id]/status` - Check processing status
- `GET /api/video/[id]` - Get video details

## Monitoring

Track these metrics:
- Confirmation success rate
- Time between upload and confirmation
- Inngest event send failures
- Storage verification failures
