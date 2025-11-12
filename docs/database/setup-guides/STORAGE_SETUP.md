# Supabase Storage Setup Guide

Complete guide for setting up video storage buckets and policies for Chronos.

## Quick Start

1. **Run the storage setup SQL:**
   ```bash
   # Via Supabase SQL Editor (Recommended)
   # Copy and paste content from: supabase/setup-storage.sql
   ```

2. **Verify buckets are created:**
   ```sql
   SELECT * FROM storage.buckets;
   ```

3. **Test upload permissions:**
   ```typescript
   import { createUploadUrl } from '@/lib/video/storage';

   const url = await createUploadUrl('creator-id/video-id/test.mp4');
   console.log('Upload URL:', url);
   ```

## Storage Buckets

### 1. Videos Bucket (Private)

**Configuration:**
- **Name:** `videos`
- **Public:** `false` (requires authentication)
- **Max File Size:** 5 GB (5,368,709,120 bytes)
- **Allowed MIME Types:**
  - `video/mp4`
  - `video/quicktime` (.mov)
  - `video/x-msvideo` (.avi)
  - `video/x-matroska` (.mkv)
  - `video/webm`
  - `video/x-flv`
  - `video/x-m4v`
  - `video/x-ms-wmv`

**Access Policies:**
- Creators can upload to their own folder: `{creator_id}/{video_id}/...`
- Creators can read/update/delete their own videos
- Service role has full access (for background processing)

**Folder Structure:**
```
videos/
├── creator-uuid-1/
│   ├── video-uuid-a/
│   │   ├── 1699123456789.mp4
│   │   └── thumbnail-1699123456789.jpg
│   └── video-uuid-b/
│       └── 1699123567890.mov
└── creator-uuid-2/
    └── video-uuid-c/
        └── 1699123678901.mp4
```

### 2. Thumbnails Bucket (Public)

**Configuration:**
- **Name:** `thumbnails`
- **Public:** `true` (publicly accessible)
- **Max File Size:** 10 MB (10,485,760 bytes)
- **Allowed MIME Types:**
  - `image/jpeg`
  - `image/png`
  - `image/webp`
  - `image/gif`

**Access Policies:**
- Creators can upload thumbnails to their folder
- Public read access for all thumbnails
- Creators can update/delete their own thumbnails

**Use Case:**
- Auto-generated video thumbnails
- Custom course thumbnails
- Creator profile images

### 3. User Uploads Bucket (Private)

**Configuration:**
- **Name:** `user-uploads`
- **Public:** `false`
- **Max File Size:** 5 GB
- **Allowed MIME Types:** All (no restriction)

**Use Case:**
- Temporary storage during upload
- Processing intermediate files
- User-submitted content before moderation

## Row Level Security (RLS) Policies

All storage buckets use Supabase RLS for security. Here's how it works:

### Authentication Context

```typescript
// User's JWT token contains their UUID
const userId = auth.uid(); // e.g., "uuid-creator-123"

// Storage paths are validated against this UUID
const allowedPath = `${userId}/video-id/file.mp4`; // ✅ Allowed
const deniedPath = `other-user-id/video-id/file.mp4`; // ❌ Denied
```

### Policy Examples

**Upload Policy (Videos):**
```sql
-- Only allow uploads to own folder
CREATE POLICY "Creators can upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'videos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

**Download Policy (Videos):**
```sql
-- Only allow downloads from own folder
CREATE POLICY "Creators can read own videos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'videos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

## Direct Upload Flow

### Step 1: Request Signed Upload URL

```typescript
// Client-side
const response = await fetch('/api/video/upload', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    filename: 'course-intro.mp4',
    fileSize: 157286400,
    mimeType: 'video/mp4',
    creatorId: 'uuid-creator',
    title: 'Course Introduction'
  })
});

const { upload, video } = await response.json();
```

### Step 2: Upload File Directly to Supabase

```typescript
// Client-side direct upload (bypasses server)
await fetch(upload.url, {
  method: 'PUT',
  body: file,
  headers: {
    'Content-Type': file.type
  }
});
```

**Benefits:**
- No server bandwidth usage
- Faster uploads (direct to storage)
- Automatic progress tracking
- Resumable uploads (with additional config)

### Step 3: Confirm Upload

```typescript
// Notify server that upload is complete
await fetch(`/api/video/${video.id}/confirm`, {
  method: 'POST'
});
```

This triggers the Inngest background processing job.

## Storage Quotas by Tier

| Tier | Storage | Max File | Max Videos | Monthly Uploads |
|------|---------|----------|------------|-----------------|
| **Basic** | 10 GB | 500 MB | 50 | 20 |
| **Pro** | 100 GB | 2 GB | 500 | 100 |
| **Enterprise** | 1 TB | 5 GB | Unlimited | Unlimited |

### Quota Enforcement

Quotas are enforced at the API level before generating upload URLs:

```typescript
import { validateVideoUpload } from '@/lib/video/storage';

const validation = await validateVideoUpload(
  creatorId,
  fileSize,
  filename
);

if (!validation.valid) {
  return NextResponse.json(
    {
      error: 'Upload validation failed',
      errors: validation.errors
    },
    { status: 403 }
  );
}
```

## Helper Functions

### Get Storage Usage

```typescript
import { getStorageUsage } from '@/lib/video/storage';

const usage = await getStorageUsage('creator-uuid');
console.log(usage);
// {
//   totalBytes: 5368709120,
//   totalVideos: 25,
//   formattedSize: '5 GB'
// }
```

### Generate Download URL

```typescript
import { getVideoDownloadUrl } from '@/lib/video/storage';

const url = await getVideoDownloadUrl('creator-id/video-id/file.mp4', 3600);
// Returns signed URL valid for 1 hour
```

### Delete Video File

```typescript
import { deleteVideoFile } from '@/lib/video/storage';

const success = await deleteVideoFile('creator-id/video-id/file.mp4');
if (success) {
  console.log('File deleted successfully');
}
```

## Cleanup & Maintenance

### Cleanup Failed Uploads

Run this SQL function periodically (e.g., daily cron job):

```sql
-- Delete videos stuck in uploading/failed for > 24 hours
SELECT cleanup_failed_uploads();
-- Returns: number of cleaned up videos
```

### List Orphaned Files

Find storage files without database records:

```typescript
import { supabase } from '@/lib/db/client';

const { data: storageFiles } = await supabase.storage
  .from('videos')
  .list('creator-id', { limit: 1000 });

const { data: dbVideos } = await supabase
  .from('videos')
  .select('storage_path')
  .eq('creator_id', 'creator-id');

const dbPaths = new Set(dbVideos?.map(v => v.storage_path));
const orphaned = storageFiles?.filter(f => !dbPaths.has(f.name));
```

## CORS Configuration

Storage buckets automatically handle CORS for:
- `PUT` (upload)
- `GET` (download)
- `DELETE` (remove)

If you need custom CORS headers, configure in Supabase Dashboard:
1. Go to **Storage** → **Policies**
2. Click **Configuration**
3. Add allowed origins

## Troubleshooting

### Upload Fails with 403 Forbidden

**Cause:** RLS policy rejection

**Solution:**
1. Verify user is authenticated
2. Check storage path matches `{user_id}/...` pattern
3. Confirm bucket policies are created

### Upload URL Expired

**Cause:** Signed URL timeout (default 1 hour)

**Solution:**
```typescript
// Generate new URL with longer expiry
const url = await createUploadUrl(path, 7200); // 2 hours
```

### File Size Limit Exceeded

**Cause:** File larger than bucket limit

**Solution:**
1. Check tier limits
2. Upgrade subscription
3. Or split video into parts

### Slow Upload Speed

**Cause:** Large file size, network latency

**Solution:**
1. Use resumable uploads (Supabase SDK)
2. Implement chunked uploads
3. Show progress indicator to user

## Security Best Practices

1. **Never expose service role key** - Only use in server-side code
2. **Always validate file types** - Check MIME type and extension
3. **Enforce size limits** - Both client and server-side
4. **Use signed URLs** - Short expiry times (1-2 hours)
5. **Monitor usage** - Track storage quotas and API calls
6. **Clean up failed uploads** - Run periodic cleanup jobs
7. **Verify upload completion** - Don't trust client-side status

## API Integration

### Upload Component Example

```tsx
import { useState } from 'react';
import { validateVideoUpload } from '@/lib/video/storage';

export function VideoUploader({ creatorId }: { creatorId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);

    try {
      // Validate locally first
      const validation = await fetch('/api/video/validate', {
        method: 'POST',
        body: JSON.stringify({
          creatorId,
          fileSize: file.size,
          filename: file.name
        })
      });

      if (!validation.ok) {
        const error = await validation.json();
        alert(error.errors.join('\n'));
        return;
      }

      // Get upload URL
      const uploadRes = await fetch('/api/video/upload', {
        method: 'POST',
        body: JSON.stringify({
          creatorId,
          filename: file.name,
          fileSize: file.size,
          mimeType: file.type
        })
      });

      const { upload, video } = await uploadRes.json();

      // Upload with progress tracking
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          setProgress((e.loaded / e.total) * 100);
        }
      });

      xhr.addEventListener('load', async () => {
        if (xhr.status === 200) {
          // Confirm upload
          await fetch(`/api/video/${video.id}/confirm`, {
            method: 'POST'
          });
          alert('Upload successful!');
        }
      });

      xhr.open('PUT', upload.url);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);

    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="video/*"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <button onClick={handleUpload} disabled={!file || uploading}>
        {uploading ? `Uploading ${progress.toFixed(0)}%` : 'Upload'}
      </button>
    </div>
  );
}
```

## Monitoring

### Track Storage Usage

```typescript
// Get current usage
const { data: metrics } = await supabase
  .from('usage_metrics')
  .select('*')
  .eq('creator_id', creatorId)
  .eq('date', new Date().toISOString().split('T')[0])
  .single();

console.log('Storage used:', formatBytes(metrics.storage_used_bytes));
console.log('Videos uploaded today:', metrics.videos_uploaded);
```

### Alert on Quota Limits

```typescript
const usage = await getStorageUsage(creatorId);
const tier = creator.subscription_tier;
const limit = VIDEO_LIMITS[tier].maxStorageGB * 1024 * 1024 * 1024;

if (usage.totalBytes > limit * 0.9) {
  // Send warning email: 90% quota reached
  await sendQuotaWarning(creator.email, usage, limit);
}
```

## References

- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [Storage RLS Guide](https://supabase.com/docs/guides/storage/security/access-control)
- [Signed URLs](https://supabase.com/docs/guides/storage/uploads/signed-urls)
- [Project API Docs](./API_VIDEO_ENDPOINTS.md)
