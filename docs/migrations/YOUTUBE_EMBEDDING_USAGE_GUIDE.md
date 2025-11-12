# YouTube Embedding Usage Guide

## Quick Reference

After the YouTube embedding migration, the `videos` table now supports two types of videos:

1. **YouTube Embedded Videos** (`source_type: 'youtube'`)
2. **Uploaded Video Files** (`source_type: 'upload'`)

## Database Schema

### New Columns

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| `source_type` | TEXT | Yes | Either 'youtube' or 'upload' (default: 'upload') |
| `youtube_video_id` | TEXT | For YouTube | The 11-character YouTube video ID |
| `youtube_channel_id` | TEXT | Optional | YouTube channel ID for attribution |

### Validation Rules

- **YouTube videos**: MUST have `youtube_video_id`, CANNOT have `storage_path`
- **Upload videos**: MUST have `storage_path`, CANNOT have `youtube_video_id`

These rules are enforced by the `videos_source_validation` constraint.

## Code Examples

### 1. Insert YouTube Video

```typescript
// TypeScript/Supabase
const { data, error } = await supabase
  .from('videos')
  .insert({
    creator_id: userId,
    title: 'Introduction to Trading',
    description: 'Learn the basics of day trading',
    source_type: 'youtube',
    youtube_video_id: 'dQw4w9WgXcQ', // Extract from YouTube URL
    youtube_channel_id: 'UCuAXFkgsw1L7xaCfnd5JJOw',
    thumbnail_url: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    duration_seconds: 212,
    status: 'completed' // YouTube videos are immediately available
  });
```

### 2. Insert Uploaded Video

```typescript
// TypeScript/Supabase
const { data, error } = await supabase
  .from('videos')
  .insert({
    creator_id: userId,
    title: 'My Custom Lesson',
    description: 'Exclusive content',
    source_type: 'upload',
    storage_path: `${userId}/${videoId}/${timestamp}.mp4`,
    thumbnail_url: 'https://your-bucket.supabase.co/thumbnails/...',
    status: 'processing' // Will be updated after transcription
  });
```

### 3. Query YouTube Videos Only

```typescript
const { data } = await supabase
  .from('videos')
  .select('*')
  .eq('source_type', 'youtube')
  .order('created_at', { ascending: false });
```

### 4. Query Uploaded Videos Only

```typescript
const { data } = await supabase
  .from('videos')
  .select('*')
  .eq('source_type', 'upload')
  .order('created_at', { ascending: false });
```

### 5. Get Video by YouTube ID

```typescript
const { data } = await supabase
  .from('videos')
  .select('*')
  .eq('youtube_video_id', 'dQw4w9WgXcQ')
  .single();
```

## React Component Example

```tsx
// VideoPlayer.tsx
interface VideoPlayerProps {
  video: Video;
}

export function VideoPlayer({ video }: VideoPlayerProps) {
  if (video.source_type === 'youtube') {
    return (
      <div className="aspect-video">
        <iframe
          src={`https://www.youtube.com/embed/${video.youtube_video_id}`}
          title={video.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
    );
  }

  // Upload video - use custom player
  return (
    <video
      src={getStorageUrl(video.storage_path)}
      controls
      className="w-full aspect-video"
    >
      Your browser does not support the video tag.
    </video>
  );
}
```

## API Endpoint Example

```typescript
// app/api/videos/add-youtube/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const body = await request.json();

  // Extract video ID from YouTube URL
  const videoId = extractYouTubeId(body.url);
  if (!videoId) {
    return NextResponse.json(
      { error: 'Invalid YouTube URL' },
      { status: 400 }
    );
  }

  // Fetch video metadata from YouTube API
  const metadata = await fetchYouTubeMetadata(videoId);

  // Insert into database
  const { data, error } = await supabase
    .from('videos')
    .insert({
      creator_id: body.creator_id,
      title: metadata.title,
      description: metadata.description,
      source_type: 'youtube',
      youtube_video_id: videoId,
      youtube_channel_id: metadata.channelId,
      thumbnail_url: metadata.thumbnail,
      duration_seconds: metadata.duration,
      status: 'completed'
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ video: data });
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}
```

## Utility Functions

```typescript
// lib/utils/youtube.ts

/**
 * Extract YouTube video ID from various URL formats
 */
export function getYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([^&\n?#]+)/,
    /(?:youtu\.be\/)([^&\n?#]+)/,
    /(?:youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

/**
 * Generate YouTube thumbnail URL
 */
export function getYouTubeThumbnail(videoId: string, quality: 'default' | 'hq' | 'maxres' = 'maxres'): string {
  const qualities = {
    default: 'default.jpg',
    hq: 'hqdefault.jpg',
    maxres: 'maxresdefault.jpg'
  };

  return `https://i.ytimg.com/vi/${videoId}/${qualities[quality]}`;
}

/**
 * Generate YouTube embed URL
 */
export function getYouTubeEmbedUrl(videoId: string, autoplay = false): string {
  const params = new URLSearchParams({
    autoplay: autoplay ? '1' : '0',
    rel: '0', // Don't show related videos
    modestbranding: '1' // Minimal YouTube branding
  });

  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}

/**
 * Check if video is YouTube embedded
 */
export function isYouTubeVideo(video: Video): boolean {
  return video.source_type === 'youtube';
}

/**
 * Get video player URL (YouTube or storage)
 */
export function getVideoUrl(video: Video): string {
  if (video.source_type === 'youtube') {
    return getYouTubeEmbedUrl(video.youtube_video_id);
  }

  // Get Supabase storage URL
  return getStorageUrl(video.storage_path);
}
```

## Migration Impact on Existing Code

### What Needs to Change

1. **Video Upload Forms**: Add option to input YouTube URL instead of uploading file
2. **Video Player Components**: Check `source_type` and render appropriate player
3. **Video List Views**: Display appropriate icons/badges for video type
4. **API Endpoints**: Support both upload and YouTube URL submission
5. **Validation Logic**: Update to allow YouTube videos without storage_path

### What Stays the Same

- Existing uploaded videos continue to work (migrated to `source_type: 'upload'`)
- Video metadata (title, description, thumbnail) works the same
- Course builder and video assignment logic unchanged
- Analytics and tracking remain compatible

## Common Patterns

### Check Video Type in Frontend

```tsx
{video.source_type === 'youtube' ? (
  <Badge variant="info">YouTube</Badge>
) : (
  <Badge variant="default">Uploaded</Badge>
)}
```

### Handle Both Types in Form

```tsx
const [inputType, setInputType] = useState<'upload' | 'youtube'>('upload');

return (
  <div>
    <RadioGroup value={inputType} onValueChange={setInputType}>
      <RadioGroupItem value="upload">Upload Video File</RadioGroupItem>
      <RadioGroupItem value="youtube">Add YouTube Video</RadioGroupItem>
    </RadioGroup>

    {inputType === 'youtube' ? (
      <Input
        placeholder="Enter YouTube URL or video ID"
        value={youtubeUrl}
        onChange={(e) => setYoutubeUrl(e.target.value)}
      />
    ) : (
      <FileUpload accept="video/*" onUpload={handleUpload} />
    )}
  </div>
);
```

## Performance Considerations

- YouTube videos load faster (no storage bandwidth)
- YouTube videos don't count against storage limits
- Indexes optimize queries by `source_type` and `youtube_video_id`
- Partial index on `youtube_video_id` only indexes non-null values

## Best Practices

1. ✅ **Always validate YouTube URLs** before inserting
2. ✅ **Fetch metadata from YouTube API** (title, duration, thumbnail)
3. ✅ **Set status to 'completed'** for YouTube videos (no processing needed)
4. ✅ **Store channel_id** for attribution and analytics
5. ✅ **Use thumbnail from YouTube** (don't generate custom thumbnails)
6. ❌ **Don't set storage_path** for YouTube videos
7. ❌ **Don't trigger transcription** for YouTube videos (use YouTube's captions API instead)

## Troubleshooting

### Error: Check constraint violation

```
new row for relation "videos" violates check constraint "videos_source_validation"
```

**Cause:** Invalid combination of fields
**Solutions:**
- YouTube videos: Ensure `youtube_video_id` is set and `storage_path` is NULL
- Upload videos: Ensure `storage_path` is set and `youtube_video_id` is NULL

### Error: Video not playing

**For YouTube videos:**
- Verify video ID is correct (11 characters)
- Check if video is publicly accessible
- Ensure embed permissions are enabled

**For uploaded videos:**
- Verify storage_path exists in Supabase Storage
- Check file permissions and bucket policies
- Confirm video format is supported

## Related Documentation

- [YouTube Data API v3](https://developers.google.com/youtube/v3)
- [YouTube Player API](https://developers.google.com/youtube/iframe_api_reference)
- [Supabase Storage](https://supabase.com/docs/guides/storage)

---

**Assisted by Jimmy Solutions Developer at Agentic Personnel LLC <Jimmy@AgenticPersonnel.com>**
