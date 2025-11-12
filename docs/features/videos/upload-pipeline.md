# Direct Video Upload Pipeline

## Overview

The direct upload pipeline enables creators to upload their own video files directly to Chronos. This system handles:

- **Drag-and-drop UI** with multi-file queue
- **Chunked uploads** for large files (>100MB)
- **Metadata extraction** (duration, dimensions, codec)
- **Thumbnail generation** from video frames
- **Storage quota management** with tier-based limits
- **Cost tracking** for storage and transcription
- **Whisper transcription** via background jobs

## Architecture

```
┌─────────────────┐
│  FileUploader   │ (React Component)
│   Component     │
└────────┬────────┘
         │
         ├──> Extract Metadata (client-side)
         ├──> Generate Thumbnail (client-side)
         ├──> Check Quota (/api/video/upload)
         │
         ▼
┌─────────────────┐
│ POST /api/video │
│    /upload      │ Create video record + signed URL
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ ChunkedUploader │ Upload file to Supabase Storage
│   (5MB chunks)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ POST /api/video │ Confirm upload complete
│ /[id]/confirm   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Inngest Event   │ video/transcribe.requested
│  Transcription  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Whisper API     │ Transcribe + chunk + embed
│   Processing    │
└─────────────────┘
```

## File Structure

### UI Components

```
components/video/
└── FileUploader.tsx        # Main upload component
```

### Upload Utilities

```
lib/upload/
├── chunked-uploader.ts     # Handles large file uploads
├── metadata-extractor.ts   # Extract video metadata (client-side)
└── thumbnail-extractor.ts  # Generate thumbnails (client-side)
```

### Storage Management

```
lib/storage/
└── quota-manager.ts        # Storage quota enforcement
```

### Analytics

```
lib/analytics/
└── storage-costs.ts        # Cost tracking queries
```

### API Endpoints

```
app/api/video/
├── upload/route.ts         # POST - Create upload session
├── [id]/confirm/route.ts   # POST - Confirm upload complete
└── thumbnail/route.ts      # POST - Upload thumbnail
```

## Usage

### Basic Upload Flow

```typescript
import { FileUploader } from '@/components/video/FileUploader';

function VideoManagement() {
  const handleUploadComplete = (video) => {
    console.log('Video uploaded:', video);
    // Refresh video list, show success message, etc.
  };

  const handleUploadError = (error) => {
    console.error('Upload failed:', error);
    // Show error notification
  };

  return (
    <FileUploader
      creatorId={creatorId}
      onUploadComplete={handleUploadComplete}
      onUploadError={handleUploadError}
      maxFiles={10}
      maxSizeGB={2}
    />
  );
}
```

### Client-Side Metadata Extraction

```typescript
import { extractVideoMetadata } from '@/lib/upload/metadata-extractor';
import { extractThumbnail } from '@/lib/upload/thumbnail-extractor';

const file = /* File object */;

// Extract metadata
const metadata = await extractVideoMetadata(file);
// { duration: 120, width: 1920, height: 1080, size: 50000000 }

// Generate thumbnail
const thumbnail = await extractThumbnail(file, {
  seekTime: 5,      // Capture at 5 seconds
  width: 640,       // Resize to 640px width
  quality: 0.9,     // JPEG quality
  format: 'jpeg'    // Output format
});
// Returns base64 data URL
```

### Storage Quota Management

```typescript
import { checkUploadQuota, getQuotaInfo } from '@/lib/storage/quota-manager';

// Check if upload is allowed
const quotaCheck = await checkUploadQuota(creatorId, fileSizeBytes);

if (!quotaCheck.allowed) {
  console.error('Upload not allowed:', quotaCheck.errors);
  // quotaCheck.errors: ["Insufficient storage. File requires 500 MB but only 200 MB available."]
}

// Get current quota info
const quotaInfo = await getQuotaInfo(creatorId);
console.log('Storage used:', quotaInfo.storage.formatted.used); // "800.5 MB"
console.log('Storage limit:', quotaInfo.storage.formatted.limit); // "1 GB"
console.log('Usage percent:', quotaInfo.storage.usagePercent); // 80.05
console.log('Monthly cost:', quotaInfo.costs.formatted.currentMonthly); // "$0.0168"
```

### Cost Tracking

```typescript
import {
  getStorageUsage,
  getTotalUploadCosts,
  getCostTrends
} from '@/lib/analytics/storage-costs';

// Get storage usage
const usage = await getStorageUsage(creatorId);
console.log('Total storage:', usage.totalGB, 'GB');
console.log('Monthly cost:', usage.monthlyCost);

// Get combined costs for current month
const costs = await getTotalUploadCosts(creatorId, new Date());
console.log('Storage:', costs.storage.cost);
console.log('Transcription:', costs.transcription.cost);
console.log('Total:', costs.total.formatted);

// Get 6-month cost trend
const trends = await getCostTrends(creatorId, 6);
trends.forEach(trend => {
  console.log(`${trend.month}: $${trend.total}`);
});
```

## Storage Quotas

### Tier Limits

| Tier       | Storage | Videos | Monthly Uploads | Cost |
|------------|---------|--------|-----------------|------|
| Basic      | 1 GB    | 50     | 20/month        | $29  |
| Pro        | 10 GB   | 500    | 100/month       | $99  |
| Enterprise | 100 GB  | Unlimited | Unlimited    | $299 |

### Quota Enforcement

1. **Before Upload**: Client checks quota via `/api/video/upload`
2. **API Validation**: Server validates storage, video count, and monthly limits
3. **Rejection**: Returns 403 with upgrade recommendation if quota exceeded
4. **Warnings**: Returns warnings when approaching limits (>80%)

### Storage Costs

- **Supabase Storage**: $0.021 per GB/month
- **Whisper Transcription**: $0.006 per minute (one-time cost)

Example costs:
- 1 GB storage = $0.021/month
- 10 minute video transcription = $0.06 (one-time)
- 1 hour video (2 GB) = $0.042/month storage + $0.36 transcription

## Upload Process

### Step 1: File Selection

User drags files or clicks to browse:
- **Validation**: File type, size, count
- **Metadata Extraction**: Duration, dimensions, codec (client-side)
- **Thumbnail Generation**: Capture frame at 5s mark (client-side)

### Step 2: Quota Check

```http
POST /api/video/upload
Content-Type: application/json

{
  "filename": "lecture.mp4",
  "fileSize": 500000000,
  "mimeType": "video/mp4",
  "title": "Lecture Video",
  "creatorId": "creator_123",
  "duration": 600
}
```

Response if allowed:
```json
{
  "success": true,
  "video": {
    "id": "video_456",
    "title": "Lecture Video",
    "status": "uploading"
  },
  "upload": {
    "type": "file",
    "url": "https://supabase.co/storage/v1/upload/signed/...",
    "token": "abc123",
    "storagePath": "creator_123/video_456/1234567890.mp4",
    "method": "PUT",
    "headers": {
      "Content-Type": "video/mp4"
    }
  }
}
```

Response if quota exceeded:
```json
{
  "error": "Upload validation failed",
  "errors": [
    "Insufficient storage. File requires 500 MB but only 200 MB available. Upgrade to Pro for more storage."
  ],
  "quotaInfo": {
    "storage": {
      "used": 858993459,
      "limit": 1073741824,
      "available": 214748365,
      "usagePercent": 80
    }
  }
}
```

### Step 3: File Upload

Using ChunkedUploader for large files (>100MB):

```typescript
const uploader = new ChunkedUploader(file, uploadUrl, {
  chunkSize: 5 * 1024 * 1024, // 5MB chunks
  onProgress: (progress) => {
    console.log(`Upload progress: ${progress}%`);
  },
  onComplete: () => {
    console.log('Upload complete');
  },
  onError: (error) => {
    console.error('Upload failed:', error);
  }
});

await uploader.start();
```

For small files (<100MB), direct upload via PUT request:
```typescript
await fetch(uploadUrl, {
  method: 'PUT',
  body: file,
  headers: {
    'Content-Type': file.type
  }
});
```

### Step 4: Upload Confirmation

```http
POST /api/video/video_456/confirm
```

Response:
```json
{
  "success": true,
  "video": {
    "id": "video_456",
    "title": "Lecture Video",
    "status": "pending"
  },
  "processing": {
    "jobId": "inngest_job_789",
    "estimatedTime": "2-5 minutes"
  }
}
```

### Step 5: Background Processing

Inngest job processes video:
1. **Transcription**: Extract audio → Whisper API → structured transcript
2. **Chunking**: Split transcript into 500-1000 word segments
3. **Embedding**: Generate vector embeddings via OpenAI
4. **Storage**: Save chunks to database with vectors
5. **Completion**: Update video status to "completed"

## Cost Optimization

### Recommendations

1. **Use YouTube/Loom when possible**
   - Free transcripts (no Whisper cost)
   - No storage cost (videos hosted externally)
   - Only use uploads for proprietary content

2. **Compress videos before upload**
   - Use H.264 codec at reasonable bitrate
   - 1080p @ 5 Mbps is sufficient for most content
   - Consider 720p for talking head videos

3. **Monitor storage costs**
   - Review `/lib/analytics/storage-costs.ts` queries
   - Delete unused videos regularly
   - Archive old content to reduce storage

4. **Batch uploads**
   - Process multiple videos together
   - Reduces API overhead
   - Better for Inngest job queueing

## Troubleshooting

### Upload Fails

**Symptoms**: Upload progress stops, error message appears

**Causes**:
- Network interruption
- File corruption
- Storage quota exceeded
- Invalid file format

**Solutions**:
1. Check network connection
2. Verify file opens in video player
3. Check quota via `/api/video/upload`
4. Ensure file is .mp4, .mov, .avi, .mkv, or .webm

### Metadata Extraction Timeout

**Symptoms**: "Metadata extraction timed out" error

**Causes**:
- Large file taking too long to load
- Corrupted video file
- Unsupported codec

**Solutions**:
1. Try different browser (Chrome recommended)
2. Verify file plays in video player
3. Re-encode video to H.264 codec
4. Reduce file size/resolution

### Quota Exceeded

**Symptoms**: 403 error with quota message

**Causes**:
- Storage limit reached
- Video count limit reached
- Monthly upload limit reached

**Solutions**:
1. Delete unused videos
2. Upgrade to higher tier
3. Wait until next month (for monthly limit)

### Transcription Failed

**Symptoms**: Video stuck in "transcribing" status

**Causes**:
- Whisper API error
- Audio extraction failed
- Video has no audio track
- Inngest job timeout

**Solutions**:
1. Check Inngest dashboard for job status
2. Verify video has audio track
3. Check OpenAI API key is valid
4. Review Inngest logs for errors
5. Manually trigger re-processing

## Performance

### Upload Speed

- **Small files (<100MB)**: Direct upload, ~1-3 minutes
- **Large files (>100MB)**: Chunked upload, ~5-15 minutes
- **Speed depends on**: Network bandwidth, Supabase region proximity

### Processing Time

- **Metadata extraction**: <1 second (client-side)
- **Thumbnail generation**: <1 second (client-side)
- **Transcription**: ~1 minute per 10 minutes of video
- **Chunking + Embedding**: ~30 seconds per hour of video
- **Total**: ~5-10 minutes for typical 30-minute video

### Cost Estimates

For a 30-minute video (1 GB file):

```
Storage cost: $0.021/month
Transcription: $0.18 (one-time)
Total first month: $0.201
Subsequent months: $0.021/month
```

For 100 GB storage tier with 500 videos (avg 10 min each):

```
Storage: $2.10/month
Transcription (one-time): $30.00
Total first month: $32.10
Subsequent months: $2.10/month
```

## Security

### File Validation

- **Client-side**: MIME type, file extension, file size
- **Server-side**: Verify uploaded file exists and has valid size
- **Storage**: Signed URLs with expiration (1 hour)

### Access Control

- **Upload**: Requires creator authentication
- **Storage**: Private bucket, signed URLs only
- **Quota**: Per-creator limits enforced
- **API**: Rate limiting via Upstash

### Data Privacy

- Videos stored in private Supabase Storage bucket
- Thumbnails in separate public bucket (for display)
- Transcripts in database with RLS policies
- No data shared between creators

## Future Enhancements

### Planned Features

1. **Resume interrupted uploads** - Store chunk progress, allow resume
2. **Video compression** - Server-side re-encoding for size reduction
3. **Multi-language support** - Whisper language detection
4. **Batch processing** - Process multiple videos in parallel
5. **CDN integration** - Faster video delivery via CDN
6. **Preview before upload** - Show estimated costs upfront
7. **Upload scheduling** - Queue uploads for off-peak hours

### Potential Optimizations

1. **WebWorker for metadata** - Offload processing to worker thread
2. **Parallel chunk uploads** - Upload multiple chunks simultaneously
3. **Progressive thumbnails** - Show thumbnail while uploading
4. **Incremental transcription** - Start transcription before upload completes
5. **Smart chunking** - Adaptive chunk size based on network speed

## Related Documentation

- [Video Processing Pipeline](./VIDEO_IMPLEMENTATION_PLAN.md)
- [Whisper Integration](../../YOUTUBE_PROCESSOR_TESTS.md)
- [Storage Setup](../../database/setup-guides/STORAGE_SETUP.md)
- [API Reference](../../api/reference.md)
