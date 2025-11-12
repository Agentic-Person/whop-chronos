# Inngest Quick Start Guide

## 30-Second Setup

```bash
# Terminal 1: Start Next.js
npm run dev

# Terminal 2: Start Inngest Dev Server
npx inngest-cli@latest dev

# Terminal 3: Test Configuration
npm run test:inngest
```

Open: `http://localhost:8288` (Inngest Dev UI)

## Quick Test

### Option 1: Via Inngest UI (Easiest)

1. Open `http://localhost:8288`
2. Click **"Send Event"**
3. Select: `video/transcribe.requested`
4. Paste this payload:
   ```json
   {
     "videoId": "test-123",
     "creatorId": "creator-456",
     "storagePath": "videos/test.mp4",
     "originalFilename": "test.mp4",
     "language": "en"
   }
   ```
5. Click **"Send"**
6. Watch execution in real-time!

### Option 2: Via cURL

```bash
curl -X POST http://localhost:8288/e/chronos/video/transcribe.requested \
  -H "Content-Type: application/json" \
  -d '{
    "videoId": "test-123",
    "creatorId": "creator-456",
    "storagePath": "videos/test.mp4",
    "originalFilename": "test.mp4"
  }'
```

## Available Events

| Event Name | Purpose | Triggers Function |
|------------|---------|-------------------|
| `video/transcribe.requested` | Start video transcription | `transcribe-video` |
| `video/chunk.requested` | Chunk transcript | Auto-triggered |
| `video/transcription.completed` | Generate embeddings | `generate-embeddings` |
| `video/embeddings.batch-reprocess` | Reprocess multiple videos | `batch-reprocess-embeddings` |

## Verify Setup

```bash
npm run test:inngest
```

Should show:
```
✓ Inngest package installed
✓ Client configured
✓ 5 functions registered
✓ Webhook accessible
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Functions not showing | Restart `npx inngest-cli@latest dev` |
| Events not processing | Check Next.js is running on port 3007 |
| Webhook not accessible | Run `npm run dev` first |
| Database errors | Verify `.env.local` has Supabase credentials |

## Key URLs

- **Inngest Dev UI**: http://localhost:8288
- **Next.js App**: http://localhost:3007
- **Webhook Endpoint**: http://localhost:3007/api/inngest

## File Locations

```
inngest/
├── client.ts               # Inngest client configuration
├── transcribe-video.ts     # Video transcription job
├── generate-embeddings.ts  # Embedding generation job
└── index.ts                # Function exports

app/api/inngest/route.ts   # Webhook endpoint

scripts/test-inngest.ts     # Configuration test script
```

## Production Checklist

- [ ] Add `INNGEST_EVENT_KEY` to Vercel
- [ ] Add `INNGEST_SIGNING_KEY` to Vercel
- [ ] Deploy to Vercel
- [ ] Register webhook: `npx inngest-cli@latest deploy --url https://your-app.vercel.app/api/inngest`
- [ ] Test with production event

## Full Documentation

See [INNGEST_SETUP.md](./INNGEST_SETUP.md) for complete guide.
