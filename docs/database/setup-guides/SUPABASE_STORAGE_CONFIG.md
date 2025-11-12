# Supabase Storage Configuration

## Issue: File Size Limit Exceeded

When uploading videos, you may encounter:
```
StorageApiError: The object exceeded the maximum allowed size
Status: 413
```

## Solution: Increase File Size Limit

### Via Supabase Dashboard

1. Go to your Supabase project: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/storage/buckets

2. Click on the `videos` bucket

3. Click "Edit bucket" or settings icon

4. Update the following settings:
   - **Maximum file size**: `500 MB` (or higher, up to 5GB)
   - **Allowed MIME types**: `video/*` or `video/mp4,video/webm,video/quicktime`

5. Click "Save"

### Via SQL (Alternative)

Run this in the Supabase SQL Editor:

```sql
-- Update the videos bucket to allow up to 500MB files
UPDATE storage.buckets
SET
  file_size_limit = 524288000,  -- 500 MB in bytes
  allowed_mime_types = ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'video/*']
WHERE name = 'videos';

-- Verify the change
SELECT
  name,
  file_size_limit,
  file_size_limit / 1024 / 1024 as size_limit_mb,
  allowed_mime_types
FROM storage.buckets
WHERE name = 'videos';
```

## Recommended Settings

For a production video platform like Chronos:

- **videos bucket**: 500MB - 1GB file size limit
- **thumbnails bucket**: 5-10MB file size limit
- **MIME types**: `video/mp4`, `video/webm`, `video/quicktime`

## Alternative: Use Multipart Upload

For videos larger than 500MB, implement multipart upload:

1. Split video into chunks
2. Upload each chunk separately
3. Combine chunks in Supabase Storage

This is more complex but allows uploading files of any size.

## Testing with Smaller Videos

For quick testing, you can also use shorter YouTube videos:

```typescript
// Example: 1-minute video instead of 25-minute video
const TEST_SHORT_VIDEO = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'; // 3:32 (~10MB)
```

Then configure yt-dlp to download lower quality:

```typescript
await YTDlpWrap(url, {
  output: tempFilePath,
  format: 'worst[ext=mp4]/worst',  // Lower quality = smaller file
  // ...
});
```
