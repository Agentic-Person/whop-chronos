# Auto-Recovery System - Quick Start Guide

## Overview

The Chronos Auto-Recovery System automatically detects and fixes stuck videos in the processing pipeline. It runs every 5 minutes via Vercel Cron and can also be triggered manually.

---

## Quick Setup

### 1. Set Environment Variables

In Vercel Dashboard → Settings → Environment Variables:

```bash
CRON_SECRET=your-secure-random-string
ADMIN_API_KEY=your-admin-api-key
```

Generate secure values:
```bash
openssl rand -hex 32
```

### 2. Deploy

The system is already configured in `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/recover-stuck-videos",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

Just deploy to Vercel - the cron will start automatically!

---

## Common Commands

### Check Video Health

```bash
curl -X GET https://chronos.vercel.app/api/admin/video-diagnostics/VIDEO_ID \
  -H "Authorization: Bearer $ADMIN_API_KEY"
```

### Manual Recovery (Dry Run)

```bash
curl -X POST https://chronos.vercel.app/api/admin/recover-stuck-videos \
  -H "Authorization: Bearer $ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"dryRun": true}'
```

### Force Recovery (Specific Video)

```bash
curl -X POST https://chronos.vercel.app/api/admin/recover-stuck-videos \
  -H "Authorization: Bearer $ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "videoIds": ["VIDEO_ID"],
    "force": true
  }'
```

### Trigger Cron Manually

```bash
curl -X GET https://chronos.vercel.app/api/cron/recover-stuck-videos \
  -H "Authorization: Bearer $CRON_SECRET"
```

---

## How It Works

```
Every 5 minutes:
  1. Find stuck videos (processing too long)
  2. Check video state:
     - Has transcript?
     - Has chunks?
     - Has embeddings?
  3. Take action:
     - Retry embeddings (if transcript exists)
     - Fix status (if everything exists)
     - Mark failed (if no transcript)
  4. Respect limits:
     - Max 3 attempts per video
     - 1 hour between attempts
```

---

## Monitoring

### Vercel Logs

Look for these messages:
- ✅ `Auto-recovery job completed` - Success
- ⚠️ `Max recovery attempts reached` - Needs attention
- ❌ `Failed to recover video` - Error

### Metrics

Track in your monitoring:
- Recovery success rate: `recovered / (recovered + failed)`
- Videos marked as failed (manual intervention needed)
- Average stuck duration

---

## Troubleshooting

### Videos Still Stuck?

1. Check diagnostics:
   ```bash
   curl -X GET .../api/admin/video-diagnostics/VIDEO_ID
   ```

2. Check recovery attempts:
   - If `recoveryAttempts >= 3`: Max reached, video marked failed
   - If `lastRecoveryAttempt` recent: Rate limited, wait 1 hour

3. Force recovery:
   ```bash
   curl -X POST .../api/admin/recover-stuck-videos \
     -d '{"videoIds": ["VIDEO_ID"], "force": true}'
   ```

### Cron Not Running?

1. Check Vercel Dashboard → Cron Jobs
2. Verify `CRON_SECRET` is set
3. Check deployment logs for errors

### Recovery Failing?

1. Check if video has transcript (required for recovery)
2. Check Inngest function logs
3. Verify database connectivity
4. Check rate limits/quotas

---

## API Reference

### Endpoints

1. **GET /api/cron/recover-stuck-videos**
   - Auth: `CRON_SECRET`
   - Triggered by Vercel Cron every 5 minutes
   - Auto-recovers all stuck videos

2. **POST /api/admin/recover-stuck-videos**
   - Auth: `ADMIN_API_KEY`
   - Manual recovery trigger
   - Supports `force`, `dryRun`, `videoIds` options

3. **GET /api/admin/video-diagnostics/:videoId**
   - Auth: `ADMIN_API_KEY`
   - Get detailed video health info

### Response Format

```typescript
{
  success: boolean;
  recovered: number;    // Videos recovered
  failed: number;       // Videos that failed
  skipped: number;      // Videos skipped
  total: number;        // Total stuck videos
  results: [
    {
      videoId: string;
      status: 'recovered' | 'failed' | 'skipped';
      reason: string;
      action?: string;
    }
  ];
  executionTimeMs: number;
}
```

---

## Recovery Actions

| Action | When | What Happens |
|--------|------|--------------|
| `retry-embeddings` | Has transcript but no chunks/embeddings | Re-sends `video/transcription.completed` event to Inngest |
| `fix-status` | Has chunks + embeddings but wrong status | Updates video status to `completed` |
| `mark-failed` | No transcript (cannot recover) | Updates video status to `failed` |

---

## Safety Features

- **Rate Limiting:** 1 hour between retry attempts
- **Max Attempts:** 3 attempts before marking as failed
- **Authorization:** All endpoints require API keys
- **Dry Run Mode:** Preview actions without executing
- **Comprehensive Logging:** All actions logged for audit

---

## Next Steps

After deployment:

1. Monitor first few cron executions in Vercel logs
2. Check if stuck videos are being recovered
3. Set up alerts for videos marked as failed
4. Consider building admin dashboard for visibility

---

For detailed documentation, see: `docs/agent-reports/agents/agent-4-auto-recovery.md`

Assisted by Jimmy Solutions Developer at Agentic Personnel LLC <Jimmy@AgenticPersonnel.com>
