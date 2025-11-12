# Video Upload API - Quick Reference

## Complete Upload Flow

```
1. POST /api/video/upload           → Get signed URL
2. PUT <signed-url>                 → Upload file
3. POST /api/video/[id]/confirm    → Trigger processing
4. GET /api/video/[id]/status      → Monitor progress
```

## Endpoint: POST /api/video/[id]/confirm

### Quick Example

```bash
curl -X POST https://chronos.app/api/video/550e8400-e29b-41d4-a716-446655440000/confirm \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Success Response

```json
{
  "success": true,
  "video": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Trading Basics - Lesson 1",
    "status": "pending"
  },
  "processing": {
    "jobId": "01HQXYZ123ABC",
    "estimatedTime": "2-5 minutes"
  }
}
```

### Common Errors

| Status | Error | Cause |
|--------|-------|-------|
| 404 | Video not found | Invalid video ID |
| 400 | Not in uploading state | Video already processed |
| 404 | File not found in storage | Upload incomplete |
| 400 | Video file is empty | Upload failed |
| 500 | Failed to trigger processing | Inngest error |

## JavaScript Client

```typescript
async function confirmUpload(videoId: string) {
  const response = await fetch(`/api/video/${videoId}/confirm`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  return await response.json();
}
```

## Processing Pipeline

After confirmation:

1. Status changes: `uploading` → `pending`
2. Inngest event: `video/transcribe.requested`
3. Background job starts:
   - Extract audio
   - Transcribe (Whisper API)
   - Chunk transcript
   - Generate embeddings
   - Update status to `processed`

## Status Flow

```
uploading → pending → transcribing → processing → chunking → embedding → processed
                                                                       ↓
                                                                    failed
```

## Rate Limits

- No specific limit on confirmation endpoint
- Limited by tier-based upload quotas
- Each video can only be confirmed once

## Testing

### Local Testing

```bash
# Set environment variables
export NEXT_PUBLIC_SUPABASE_URL="your_url"
export SUPABASE_SERVICE_ROLE_KEY="your_key"
export INNGEST_EVENT_KEY="your_key"

# Run test script
ts-node scripts/test-upload-confirmation.ts
```

### Manual Testing

```bash
# 1. Upload a test video
VIDEO_ID=$(curl -X POST http://localhost:3000/api/video/upload \
  -H "Content-Type: application/json" \
  -d '{"filename":"test.mp4","fileSize":1000000,"creatorId":"test"}' \
  | jq -r '.video.id')

# 2. Upload file (simulated)
# ... upload to signed URL ...

# 3. Confirm
curl -X POST http://localhost:3000/api/video/$VIDEO_ID/confirm

# 4. Check status
curl http://localhost:3000/api/video/$VIDEO_ID/status
```

## Integration Checklist

- [ ] Video record exists with status "uploading"
- [ ] File uploaded to Supabase Storage
- [ ] File size > 0 bytes verified
- [ ] Inngest event sent successfully
- [ ] Status updated to "pending"
- [ ] Processing job started

## Troubleshooting

### Issue: "Video not found"
- Check video ID is correct
- Ensure video was created by upload endpoint

### Issue: "Not in uploading state"
- Video may already be processed
- Check current status with GET /api/video/[id]

### Issue: "File not found in storage"
- Verify upload to signed URL completed
- Check storage path is correct
- Ensure file wasn't deleted

### Issue: "Video file is empty"
- Upload may have failed
- Re-upload file to signed URL
- Check network connection

### Issue: "Failed to trigger processing"
- Check Inngest configuration
- Verify INNGEST_EVENT_KEY is set
- Check Inngest dashboard for errors

## Related Documentation

- [Video Upload API](./video-upload.md)
- [Video Status API](./video-status.md)
- [Complete Flow Guide](./test-upload-flow.sh)
- [Test Script](../../scripts/test-upload-confirmation.ts)

## Support

For issues or questions:
- Check logs: Supabase Dashboard → Logs
- Check Inngest: Inngest Dashboard → Events
- Check Sentry: Error tracking
