# Video Transcription Service

AI-powered video transcription using OpenAI Whisper API with cost tracking and usage analytics.

## Overview

This module handles the complete video transcription pipeline:

1. **Audio Extraction** - Extract audio from video files
2. **Transcription** - Convert audio to text using OpenAI Whisper
3. **Cost Tracking** - Track usage metrics and costs per creator
4. **Background Processing** - Async processing with Inngest

## Architecture

```
┌─────────────────┐
│  Video Upload   │
└────────┬────────┘
         │
         v
┌─────────────────┐
│ Trigger Inngest │ ──> Send event: video/transcribe.requested
└────────┬────────┘
         │
         v
┌─────────────────────────────────────────────────────┐
│            Inngest Background Job                    │
├─────────────────────────────────────────────────────┤
│  1. Download video from Supabase Storage            │
│  2. Extract audio (temp file)                       │
│  3. Call Whisper API (retry on failure)             │
│  4. Save transcript to database                     │
│  5. Update usage metrics & costs                    │
│  6. Trigger chunking/embedding                      │
│  7. Cleanup temp files                              │
└─────────────────────────────────────────────────────┘
```

## File Structure

```
lib/video/
├── audio.ts              # Audio extraction utilities
├── transcription.ts      # Whisper API integration
├── cost-tracker.ts       # Usage & cost tracking
├── types.ts              # TypeScript types
├── index.ts              # Module exports
└── README.md             # This file

inngest/
├── client.ts             # Inngest client config
└── transcribe-video.ts   # Background transcription job

app/api/inngest/
└── route.ts              # Inngest webhook endpoint
```

## Usage

### 1. Trigger Transcription

```typescript
import { inngest } from '@/inngest/client';

// Send event to start transcription
await inngest.send({
  name: 'video/transcribe.requested',
  data: {
    videoId: 'uuid',
    creatorId: 'uuid',
    storagePath: 'videos/file.mp4',
    originalFilename: 'my-video.mp4',
    language: 'en', // optional
  },
});
```

### 2. Direct Transcription (Synchronous)

```typescript
import { transcribeVideo } from '@/lib/video';

const result = await transcribeVideo(
  videoBuffer,
  'video.mp4',
  {
    language: 'en',
    responseFormat: 'verbose_json',
  }
);

console.log(result.transcript);
console.log('Cost:', result.cost);
console.log('Duration:', result.duration);
```

### 3. Track Costs

```typescript
import { trackTranscriptionCost } from '@/lib/video';

await trackTranscriptionCost({
  creatorId: 'uuid',
  transcriptionMinutes: 5.5,
  transcriptionCost: 0.033,
});
```

### 4. Check Usage Limits

```typescript
import { checkUsageLimits } from '@/lib/video';

const { withinLimits, usage, limits } = await checkUsageLimits(
  creatorId,
  'pro'
);

if (!withinLimits) {
  throw new Error('Usage limit exceeded');
}
```

## API Reference

### `transcribeVideo()`

Transcribe a video file using OpenAI Whisper API.

**Parameters:**
- `videoBuffer: Buffer` - Video file buffer
- `originalFilename: string` - Original filename (for format detection)
- `options?: TranscriptionOptions`
  - `language?: string` - ISO-639-1 language code (e.g., 'en', 'es')
  - `prompt?: string` - Optional text to guide the model's style
  - `temperature?: number` - Sampling temperature (0-1, default: 0)
  - `responseFormat?: 'json' | 'text' | 'verbose_json'` - Response format

**Returns:** `Promise<TranscriptionResult>`
```typescript
{
  transcript: string;        // Full transcript text
  language: string;          // Detected or specified language
  duration: number;          // Duration in seconds
  segments?: Array<{         // Timestamp segments
    id: number;
    start: number;
    end: number;
    text: string;
  }>;
  cost: number;              // USD cost
}
```

**Throws:** `TranscriptionError`

---

### `trackTranscriptionCost()`

Track transcription costs in usage metrics.

**Parameters:**
- `data: CostTrackingData`
  - `creatorId: string`
  - `date?: string` - YYYY-MM-DD (defaults to today)
  - `transcriptionMinutes?: number`
  - `transcriptionCost?: number`

---

### `checkUsageLimits()`

Check if creator is within their tier limits.

**Parameters:**
- `creatorId: string`
- `tier: 'basic' | 'pro' | 'enterprise'`

**Returns:**
```typescript
{
  withinLimits: boolean;
  usage: {
    transcriptionMinutes: number;
    aiCreditsUsed: number;
    storageUsedBytes: number;
  };
  limits: {
    transcriptionMinutes: number;
    aiCreditsUsed: number;
    storageBytes: number;
  };
}
```

---

### `formatTranscriptWithTimestamps()`

Format transcript segments with timestamps for display.

**Parameters:**
- `segments: TranscriptSegment[]`

**Returns:** `string`

**Example:**
```
[00:00 - 00:05] Welcome to this tutorial
[00:05 - 00:12] Today we'll learn about video processing
```

## Pricing

### OpenAI Whisper API

- **$0.006 per minute** of audio transcribed
- No additional costs for retries or failed attempts
- Supports files up to 25 MB

### Example Costs

| Duration | Cost |
|----------|------|
| 1 minute | $0.01 |
| 10 minutes | $0.06 |
| 1 hour | $0.36 |
| 10 hours | $3.60 |

## Tier Limits

### Basic Tier
- **Transcription:** 60 minutes/month (1 hour)
- **AI Credits:** 10,000/month
- **Storage:** 1 GB

### Pro Tier
- **Transcription:** 600 minutes/month (10 hours)
- **AI Credits:** 100,000/month
- **Storage:** 10 GB

### Enterprise Tier
- **Transcription:** 6,000 minutes/month (100 hours)
- **AI Credits:** 1,000,000/month
- **Storage:** 100 GB

## Error Handling

### Retries

The transcription service automatically retries on:
- **429** - Rate limit errors (exponential backoff)
- **500** - Internal server errors
- **503** - Service unavailable

**Max retries:** 3
**Initial delay:** 1 second
**Backoff:** Exponential (2^attempt)

### Error Codes

```typescript
type ErrorCode =
  | 'OPENAI_API_ERROR'      // OpenAI API error
  | 'AUDIO_EXTRACTION_FAILED' // Failed to extract audio
  | 'TRANSCRIPTION_FAILED'   // Transcription failed
  | 'FILE_TOO_LARGE';        // File exceeds 25 MB
```

### Example Error Handling

```typescript
try {
  const result = await transcribeVideo(buffer, 'video.mp4');
} catch (error) {
  const transcriptionError = error as TranscriptionError;

  if (transcriptionError.retryable) {
    // Queue for retry
    await retryLater(transcriptionError);
  } else {
    // Log and notify user
    console.error('Non-retryable error:', transcriptionError.message);
  }
}
```

## Background Processing

### Inngest Configuration

```typescript
// inngest/client.ts
export const inngest = new Inngest({
  id: 'chronos',
  name: 'Chronos Video Processing',
  retryFunction: async (attempt) => ({
    delay: Math.min(1000 * Math.pow(2, attempt), 60000),
    maxAttempts: 3,
  }),
});
```

### Job Monitoring

Monitor transcription jobs via Inngest dashboard:
- **Status:** queued, processing, completed, failed
- **Progress:** Step-by-step execution
- **Logs:** Detailed execution logs
- **Metrics:** Duration, cost, errors

## Database Schema

### Videos Table

```sql
CREATE TABLE videos (
  id UUID PRIMARY KEY,
  creator_id UUID REFERENCES creators(id),
  title TEXT NOT NULL,
  transcript TEXT,                    -- Stored after transcription
  transcript_language TEXT,           -- Detected language
  duration_seconds INTEGER,           -- Duration
  status TEXT,                        -- processing status
  metadata JSONB,                     -- transcription_cost, etc.
  -- ...
);
```

### Usage Metrics Table

```sql
CREATE TABLE usage_metrics (
  id UUID PRIMARY KEY,
  creator_id UUID REFERENCES creators(id),
  date DATE NOT NULL,
  transcription_minutes NUMERIC(10,2), -- Minutes transcribed
  ai_credits_used INTEGER,              -- AI API credits
  metadata JSONB,                       -- Cost breakdown
  -- ...
);
```

### PostgreSQL Functions

- `increment_usage_metrics()` - Atomically update usage
- `get_monthly_usage_summary()` - Monthly aggregation
- `check_tier_limits()` - Validate tier limits

## Testing

### Local Testing

```bash
# Set environment variables
export OPENAI_API_KEY="sk-..."
export NEXT_PUBLIC_SUPABASE_URL="https://..."
export SUPABASE_SERVICE_ROLE_KEY="..."

# Run transcription test
npm run test:transcription
```

### Mock Transcription (Dev)

```typescript
// For testing without API calls
const mockResult: TranscriptionResult = {
  transcript: 'Test transcript',
  language: 'en',
  duration: 60,
  cost: 0.006,
};
```

## Performance

### Benchmarks

| Video Duration | Processing Time | Cost |
|---------------|-----------------|------|
| 1 minute | ~10 seconds | $0.006 |
| 10 minutes | ~60 seconds | $0.06 |
| 1 hour | ~5 minutes | $0.36 |

### Optimization Tips

1. **Parallel Processing** - Process multiple videos concurrently
2. **Caching** - Cache transcripts to avoid reprocessing
3. **Compression** - Use compressed audio formats (MP3 vs WAV)
4. **Chunking** - Split large files before transcription

## Future Enhancements

- [ ] Support for videos > 25 MB (chunking)
- [ ] Real-time transcription progress updates
- [ ] Multiple language detection
- [ ] Custom vocabulary/glossary support
- [ ] Speaker diarization
- [ ] Automatic punctuation restoration
- [ ] Transcript editing interface
- [ ] Export formats (SRT, VTT, TXT)

## Troubleshooting

### Common Issues

**Issue:** Transcription takes too long
- **Solution:** Check video file size and format. Consider compressing before upload.

**Issue:** "File too large" error
- **Solution:** Split video into segments < 25 MB or compress audio.

**Issue:** Rate limit errors
- **Solution:** Reduce concurrent transcriptions or upgrade OpenAI tier.

**Issue:** Inaccurate transcription
- **Solution:** Provide language hint, use clearer audio, add context prompt.

## Support

For issues or questions:
- Check [OpenAI Whisper Documentation](https://platform.openai.com/docs/guides/speech-to-text)
- Review [Inngest Documentation](https://www.inngest.com/docs)
- Contact: support@chronos.dev
