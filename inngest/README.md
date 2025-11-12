# Inngest Background Jobs

This directory contains all Inngest function definitions for background job processing in Chronos.

## Structure

```
inngest/
├── client.ts               # Inngest client & event type definitions
├── transcribe-video.ts     # Video transcription pipeline
├── generate-embeddings.ts  # Vector embedding generation
└── index.ts                # Export all functions for registration
```

## Functions

### 1. Video Transcription (`transcribe-video.ts`)

**Functions:**
- `transcribeVideoFunction` - Main transcription pipeline
- `transcribeVideoErrorHandler` - Error handling

**Event:** `video/transcribe.requested`

**Pipeline:**
1. Update video status → "transcribing"
2. Download video from Supabase Storage
3. Transcribe with OpenAI Whisper
4. Save transcript to database
5. Update usage metrics
6. Trigger chunking event

**Configuration:**
- Retries: 3
- Rate Limit: 10 concurrent per creator
- Timeout: Based on video duration

### 2. Embedding Generation (`generate-embeddings.ts`)

**Functions:**
- `generateEmbeddingsFunction` - Generate vector embeddings
- `handleEmbeddingFailure` - Error handling
- `batchReprocessEmbeddings` - Batch reprocessing

**Event:** `video/transcription.completed`

**Pipeline:**
1. Validate video and transcript
2. Chunk transcript (500-1000 words)
3. Store chunks in database
4. Generate embeddings (OpenAI)
5. Update chunks with vectors
6. Track usage metrics
7. Mark video as completed

**Configuration:**
- Retries: 2
- Batch Size: 20 chunks
- Embedding Model: text-embedding-3-small

## Event Types

All events are strongly typed in `client.ts`:

```typescript
// Transcription
interface TranscribeVideoEvent {
  name: 'video/transcribe.requested';
  data: {
    videoId: string;
    creatorId: string;
    storagePath: string;
    originalFilename: string;
    language?: string;
  };
}

// Chunking (auto-triggered)
interface ChunkVideoEvent {
  name: 'video/chunk.requested';
  data: {
    videoId: string;
    creatorId: string;
    transcript: string;
    segments: Array<{
      id: number;
      start: number;
      end: number;
      text: string;
    }>;
  };
}

// Embeddings
interface EmbedChunksEvent {
  name: 'video/embed.requested';
  data: {
    videoId: string;
    creatorId: string;
    chunkIds: string[];
  };
}
```

## Usage

### Trigger Transcription

```typescript
import { inngest } from '@/inngest/client';

await inngest.send({
  name: 'video/transcribe.requested',
  data: {
    videoId: video.id,
    creatorId: creator.id,
    storagePath: 'videos/creator-id/video-id.mp4',
    originalFilename: 'course-intro.mp4',
    language: 'en',
  },
});
```

### Batch Reprocess Embeddings

```typescript
await inngest.send({
  name: 'video/embeddings.batch-reprocess',
  data: {
    video_ids: ['uuid-1', 'uuid-2', 'uuid-3'],
  },
});
```

## Testing

### Quick Test
```bash
npm run test:inngest
```

### Development Server
```bash
# Terminal 1
npm run dev

# Terminal 2
npx inngest-cli@latest dev
```

### Manual Event (via Inngest UI)
1. Open http://localhost:8288
2. Click "Send Event"
3. Select event type
4. Fill payload
5. Watch execution

## Error Handling

All functions include:
- **Automatic Retries**: Exponential backoff (1s → 2s → 4s)
- **Error Handlers**: Catch failures and update DB status
- **Step Isolation**: Each step can retry independently
- **Detailed Logging**: Console logs for debugging

## Monitoring

### Development
- Inngest Dev UI: http://localhost:8288
- View logs in terminal
- Check `videos` table status

### Production
- Inngest Cloud Dashboard
- Sentry error tracking
- Supabase logs
- Usage metrics table

## Configuration

### Client Settings (`client.ts`)

```typescript
export const inngest = new Inngest({
  id: 'chronos',
  name: 'Chronos Video Processing',
  retryFunction: async (attempt) => ({
    delay: Math.min(1000 * Math.pow(2, attempt), 60000),
    maxAttempts: 3,
  }),
});
```

### Rate Limiting

```typescript
// In function config
rateLimit: {
  limit: 10,          // Max 10 concurrent
  period: '1m',       // Per minute
  key: 'event.data.creatorId',  // Per creator
}
```

## Dependencies

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (bypasses RLS)
- `OPENAI_API_KEY` - For Whisper & embeddings
- `INNGEST_EVENT_KEY` - Production only
- `INNGEST_SIGNING_KEY` - Production only

## Adding New Functions

1. **Create Function File**: `inngest/my-function.ts`

```typescript
import { inngest } from './client';

export const myFunction = inngest.createFunction(
  {
    id: 'my-function',
    name: 'My Background Job',
    retries: 3,
  },
  { event: 'my-event' },
  async ({ event, step, logger }) => {
    // Your logic here
    await step.run('step-name', async () => {
      // Step logic
    });
  }
);
```

2. **Export in `index.ts`**:

```typescript
export { myFunction } from './my-function';

export const functions = [
  // ... existing
  myFunction,
];
```

3. **Register in Route**: Already auto-imported via `functions` array

4. **Test**: Restart Inngest Dev Server to pick up new function

## Best Practices

1. **Use Steps**: Break work into isolated, retryable steps
2. **Idempotent**: Functions should be safe to retry
3. **Validate First**: Check prerequisites before heavy work
4. **Update Status**: Keep database status current
5. **Log Generously**: Use logger for debugging
6. **Handle Errors**: Update DB on failures
7. **Track Metrics**: Update usage metrics
8. **Send Events**: Chain functions via events

## Troubleshooting

### Function Not Appearing
- Check `functions` array in `index.ts`
- Restart Inngest Dev Server
- Verify no TypeScript errors

### Event Not Processing
- Check event name matches exactly
- Verify payload structure
- Check Next.js server is running
- View Inngest logs for errors

### Steps Failing
- Check database connection
- Verify API keys
- Check storage paths
- Review step logs in UI

## Documentation

- [Inngest Quick Start](../docs/INNGEST_QUICK_START.md)
- [Inngest Setup Guide](../docs/INNGEST_SETUP.md)
- [Official Docs](https://www.inngest.com/docs)
