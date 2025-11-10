# Transcription Service - Quick Start Guide

Get the transcription service running in 5 minutes.

## Prerequisites

- Node.js 20+
- OpenAI API key
- Supabase project
- Inngest account (optional for local dev)

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Update these required variables:

```bash
# OpenAI
OPENAI_API_KEY=sk-...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Inngest (optional for local dev)
INNGEST_EVENT_KEY=evt_...
INNGEST_SIGNING_KEY=sig_...
```

### 3. Run Database Migrations

```bash
npm run db:migrate
```

This creates:
- `usage_metrics` table
- `increment_usage_metrics()` function
- `get_monthly_usage_summary()` function
- `check_tier_limits()` function

### 4. Start Development Server

```bash
npm run dev
```

Server runs on http://localhost:3000

### 5. Test Transcription

#### Option A: Via API (Recommended)

```bash
# Create a test video record first
curl -X POST http://localhost:3000/api/video/upload \
  -H "Content-Type: application/json" \
  -d '{
    "creatorId": "your-creator-uuid",
    "title": "Test Video",
    "file": "base64-encoded-video"
  }'

# Trigger transcription
curl -X POST http://localhost:3000/api/video/transcribe \
  -H "Content-Type: application/json" \
  -d '{
    "videoId": "video-uuid",
    "creatorId": "creator-uuid",
    "language": "en"
  }'

# Check status
curl http://localhost:3000/api/video/transcribe?videoId=video-uuid
```

#### Option B: Direct Function Call

```typescript
import { transcribeVideo } from '@/lib/video';
import { readFile } from 'fs/promises';

// Load video file
const videoBuffer = await readFile('./test-video.mp4');

// Transcribe
const result = await transcribeVideo(videoBuffer, 'test-video.mp4', {
  language: 'en',
  responseFormat: 'verbose_json',
});

console.log('Transcript:', result.transcript);
console.log('Cost:', result.cost);
console.log('Duration:', result.duration);
console.log('Segments:', result.segments?.length);
```

## Directory Structure

```
lib/video/
├── audio.ts              # Audio extraction
├── transcription.ts      # Whisper API integration
├── cost-tracker.ts       # Usage & cost tracking
├── types.ts              # TypeScript types
├── index.ts              # Module exports
└── README.md             # Full documentation

inngest/
├── client.ts             # Inngest client
└── transcribe-video.ts   # Background job

app/api/inngest/
└── route.ts              # Inngest webhook
```

## Key Functions

### Transcribe Video

```typescript
import { transcribeVideo } from '@/lib/video';

const result = await transcribeVideo(
  videoBuffer,
  'filename.mp4',
  {
    language: 'en',        // optional
    temperature: 0,        // 0-1, default: 0
    responseFormat: 'verbose_json',
  }
);
```

### Track Costs

```typescript
import { trackTranscriptionCost } from '@/lib/video';

await trackTranscriptionCost({
  creatorId: 'uuid',
  transcriptionMinutes: 5.5,
  transcriptionCost: 0.033,
});
```

### Check Limits

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

### Trigger Background Job

```typescript
import { inngest } from '@/inngest/client';

await inngest.send({
  name: 'video/transcribe.requested',
  data: {
    videoId: 'uuid',
    creatorId: 'uuid',
    storagePath: 'videos/file.mp4',
    originalFilename: 'my-video.mp4',
    language: 'en',
  },
});
```

## Testing

### Run Unit Tests

```bash
npm test -- transcription.test.ts
```

### Test with Sample Video

```typescript
// test-transcription.ts
import { transcribeVideo } from '@/lib/video';
import { readFile } from 'fs/promises';

async function test() {
  const buffer = await readFile('./sample-video.mp4');
  const result = await transcribeVideo(buffer, 'sample-video.mp4');

  console.log('✅ Transcription successful!');
  console.log('Transcript length:', result.transcript.length);
  console.log('Duration:', result.duration, 'seconds');
  console.log('Cost:', result.cost, 'USD');
}

test().catch(console.error);
```

Run it:
```bash
npx tsx test-transcription.ts
```

## Inngest Local Development

### Option 1: Inngest Dev Server (Recommended)

```bash
# Terminal 1: Start Next.js
npm run dev

# Terminal 2: Start Inngest dev server
npx inngest-cli dev
```

Visit http://localhost:8288 to see Inngest dashboard.

### Option 2: Skip Inngest (Direct Calls)

For quick testing, bypass Inngest and call transcription directly:

```typescript
import { transcribeVideo } from '@/lib/video/transcription';

// Direct transcription (no background job)
const result = await transcribeVideo(buffer, filename);
```

## Troubleshooting

### "OpenAI API key not set"
```bash
# Check environment variable
echo $OPENAI_API_KEY

# Set it
export OPENAI_API_KEY=sk-...
```

### "File too large" error
- Whisper API has 25 MB limit
- Compress video or extract audio only
- Future: Chunking support

### "Rate limit exceeded" (429)
- Reduce concurrent transcriptions
- Add delay between requests
- Upgrade OpenAI tier

### Transcription quality issues
- Specify language: `{ language: 'en' }`
- Improve audio quality
- Remove background noise
- Provide context prompt

## Production Deployment

### Vercel

```bash
# Build
npm run build

# Deploy
vercel deploy --prod
```

Set environment variables in Vercel dashboard.

### Inngest Setup

1. Create account: https://inngest.com
2. Create app: "Chronos"
3. Get keys from dashboard
4. Set webhook URL: `https://your-app.vercel.app/api/inngest`
5. Deploy

## Monitoring

### Check Logs

```bash
# Inngest dashboard
https://app.inngest.com/env/production/logs

# Vercel logs
vercel logs --prod

# Local logs
tail -f .next/server.log
```

### Cost Tracking

```sql
-- Monthly usage for a creator
SELECT * FROM get_monthly_usage_summary(
  'creator-uuid',
  2024,
  11
);

-- Check tier limits
SELECT * FROM check_tier_limits(
  'creator-uuid',
  'pro'
);
```

## Next Steps

1. ✅ Set up environment variables
2. ✅ Run database migrations
3. ✅ Test transcription locally
4. ✅ Deploy to Vercel
5. ✅ Configure Inngest webhook
6. ✅ Monitor first production transcription

## Support

- Full Documentation: `lib/video/README.md`
- Implementation Report: `TRANSCRIPTION_SERVICE_REPORT.md`
- Issues: GitHub Issues
- Email: support@chronos.dev

## Example: Complete Workflow

```typescript
import { createClient } from '@supabase/supabase-js';
import { inngest } from '@/inngest/client';
import { checkUsageLimits } from '@/lib/video';

async function processVideo(
  creatorId: string,
  videoBuffer: Buffer,
  filename: string,
  tier: 'basic' | 'pro' | 'enterprise'
) {
  // 1. Check usage limits
  const { withinLimits } = await checkUsageLimits(creatorId, tier);
  if (!withinLimits) {
    throw new Error('Usage limit exceeded');
  }

  // 2. Upload video to Supabase Storage
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const storagePath = `${creatorId}/${Date.now()}-${filename}`;
  const { error: uploadError } = await supabase.storage
    .from('videos')
    .upload(storagePath, videoBuffer);

  if (uploadError) throw uploadError;

  // 3. Create video record
  const { data: video, error: dbError } = await supabase
    .from('videos')
    .insert({
      creator_id: creatorId,
      title: filename,
      storage_path: storagePath,
      status: 'pending',
    })
    .select()
    .single();

  if (dbError) throw dbError;

  // 4. Trigger transcription
  await inngest.send({
    name: 'video/transcribe.requested',
    data: {
      videoId: video.id,
      creatorId,
      storagePath,
      originalFilename: filename,
      language: 'en',
    },
  });

  console.log('✅ Video processing started:', video.id);
  return video;
}

// Usage
processVideo(
  'creator-uuid',
  videoBuffer,
  'my-video.mp4',
  'pro'
).then(video => {
  console.log('Video ID:', video.id);
  console.log('Check status at: /api/video/transcribe?videoId=' + video.id);
}).catch(console.error);
```

Happy transcribing! 🎉
