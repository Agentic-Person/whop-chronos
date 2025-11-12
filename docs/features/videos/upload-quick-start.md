# Direct Upload Quick Start Guide

Quick reference for implementing and using the direct video upload system.

## For Developers

### 1. Add Upload UI to Your Page

```typescript
import { FileUploader } from '@/components/video/FileUploader';

export default function VideoManagementPage() {
  const creatorId = 'creator_123'; // From session

  return (
    <FileUploader
      creatorId={creatorId}
      onUploadComplete={(video) => {
        console.log('Upload complete:', video);
        // Refresh video list
      }}
      onUploadError={(error) => {
        console.error('Upload error:', error);
        // Show error notification
      }}
      maxFiles={10}
      maxSizeGB={2}
    />
  );
}
```

### 2. Check User Quota Before Upload

```typescript
import { checkUploadQuota } from '@/lib/storage/quota-manager';

const quotaCheck = await checkUploadQuota(creatorId, fileSizeBytes);

if (!quotaCheck.allowed) {
  alert(quotaCheck.errors.join('\n'));
  return;
}
```

### 3. Track Storage Costs

```typescript
import { getTotalUploadCosts } from '@/lib/analytics/storage-costs';

const costs = await getTotalUploadCosts(creatorId, new Date());

console.log(`Storage: $${costs.storage.cost}`);
console.log(`Transcription: $${costs.transcription.cost}`);
console.log(`Total: ${costs.total.formatted}`);
```

## For Creators

### Supported File Formats

- **Video**: .mp4, .mov, .avi, .mkv, .webm
- **Max Size**: 2GB per file
- **Max Files**: 10 simultaneous uploads

### Storage Quotas

| Tier | Storage | Videos | Monthly Uploads |
|------|---------|--------|-----------------|
| Basic | 1 GB | 50 | 20/month |
| Pro | 10 GB | 500 | 100/month |
| Enterprise | 100 GB | Unlimited | Unlimited |

### Upload Costs

**Storage**: $0.021 per GB/month
- 1 GB = $0.021/month
- 10 GB = $0.21/month
- 100 GB = $2.10/month

**Transcription** (one-time): $0.006 per minute
- 10 min video = $0.06
- 1 hour video = $0.36

### Example: 30-minute video (1 GB)

```
Storage:       $0.021/month (recurring)
Transcription: $0.18 (one-time)
First month:   $0.201
Next months:   $0.021/month
```

### Best Practices

1. **Use YouTube/Loom when possible** - Free transcripts, no storage cost
2. **Compress videos before upload** - Use H.264 at 5 Mbps for good quality
3. **Delete unused videos** - Free up storage quota
4. **Monitor costs** - Check analytics dashboard regularly

## Upload Process

### Step 1: Select Files
- Drag files to upload zone OR click to browse
- Multiple files supported (up to 10)

### Step 2: Automatic Processing
- **Metadata extracted** (duration, dimensions)
- **Thumbnail generated** (at 5-second mark)
- **Quota checked** (storage, video count, monthly limit)

### Step 3: Upload Starts
- Progress bar shows upload status
- Pause/resume available
- Cancel anytime before completion

### Step 4: Background Transcription
- Audio extracted from video
- Whisper AI transcribes content
- Transcript chunked and embedded
- Video ready for AI chat (5-10 minutes)

## Troubleshooting

### "File too large" Error
- **Max size**: 2GB
- **Solution**: Compress video or split into parts

### "Quota exceeded" Error
- **Cause**: Storage/video limit reached
- **Solution**: Delete old videos or upgrade tier

### "Upload failed" Error
- **Cause**: Network issue or server error
- **Solution**: Check connection, retry upload

### Video Stuck "Processing"
- **Normal time**: 5-10 minutes
- **Check**: Inngest dashboard for job status
- **Contact**: Support if >30 minutes

## API Reference

### Upload Endpoint
```http
POST /api/video/upload
Content-Type: application/json

{
  "filename": "video.mp4",
  "fileSize": 500000000,
  "mimeType": "video/mp4",
  "title": "My Video",
  "creatorId": "creator_123",
  "duration": 600
}
```

### Confirm Endpoint
```http
POST /api/video/{videoId}/confirm
```

### Thumbnail Upload
```http
POST /api/video/thumbnail
Content-Type: multipart/form-data

file: <Blob>
path: "creator_123/video_456/thumbnail.jpg"
videoId: "video_456"
```

## Code Examples

### Extract Metadata

```typescript
import { extractVideoMetadata } from '@/lib/upload/metadata-extractor';

const metadata = await extractVideoMetadata(file);
// { duration: 120, width: 1920, height: 1080, size: 50000000 }
```

### Generate Thumbnail

```typescript
import { extractThumbnail } from '@/lib/upload/thumbnail-extractor';

const thumbnail = await extractThumbnail(file, {
  seekTime: 5,
  width: 640,
  quality: 0.9
});
```

### Check Quota

```typescript
import { getQuotaInfo } from '@/lib/storage/quota-manager';

const quota = await getQuotaInfo(creatorId);
console.log(`Used: ${quota.storage.formatted.used}`);
console.log(`Limit: ${quota.storage.formatted.limit}`);
console.log(`Cost: ${quota.costs.formatted.currentMonthly}`);
```

### Get Cost Trends

```typescript
import { getCostTrends } from '@/lib/analytics/storage-costs';

const trends = await getCostTrends(creatorId, 6);
trends.forEach(month => {
  console.log(`${month.month}: $${month.total}`);
});
```

## Performance Tips

### For Fast Uploads
- Use wired connection (not WiFi)
- Upload during off-peak hours
- Close bandwidth-heavy applications
- Keep browser tab active

### For Cost Optimization
- Compress videos to H.264
- Use 720p for talking head content
- Delete test/unused videos
- Prefer YouTube imports when available

## Related Documentation

- [Full Upload Pipeline Guide](./upload-pipeline.md)
- [Agent Implementation Report](../../agent-reports/video-implementation/agent-7-upload-report.md)
- [Storage Setup](../../database/setup-guides/STORAGE_SETUP.md)
- [API Reference](../../api/reference.md)

---

**Need Help?**
- Documentation: `/docs/features/videos/`
- API Docs: `/docs/api/`
- Support: support@chronos.app
