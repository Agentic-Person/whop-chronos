# Logging Guidelines for Chronos

## Overview

Chronos uses a structured logging system that adapts behavior based on environment:

- **Development**: Full console logging with emoji prefixes and context
- **Production**: Only critical errors sent to Sentry, all console statements removed

## The Logger Utility

Location: `lib/logger.ts`

### Import

```typescript
import { logger } from '@/lib/logger';
```

## Log Levels

### 1. `logger.debug()` - Debug Information

**When to use:**
- Detailed diagnostic information for troubleshooting
- Variable dumps and state inspection
- Function entry/exit tracking

**Visibility:**
- Development: ✅ Logged to console
- Production: ❌ Completely removed

**Example:**
```typescript
logger.debug('Processing video chunk', {
  component: 'video-processor',
  videoId: video.id,
  chunkIndex: 5,
  chunkSize: chunk.length
});
```

### 2. `logger.info()` - Informational Messages

**When to use:**
- Normal application flow events
- Successful operations
- Progress updates
- Non-critical status changes

**Visibility:**
- Development: ✅ Logged to console
- Production: ❌ Completely removed

**Example:**
```typescript
logger.info('Video processing completed', {
  component: 'video-processor',
  videoId: video.id,
  duration: '2m 30s',
  chunks: 15
});
```

### 3. `logger.warn()` - Warnings

**When to use:**
- Recoverable errors
- Deprecated feature usage
- Performance issues
- Data quality issues

**Visibility:**
- Development: ✅ Logged to console (yellow)
- Production: ❌ Suppressed (can be enabled for monitoring)

**Example:**
```typescript
logger.warn('Low storage space remaining', {
  component: 'storage-monitor',
  userId: user.id,
  remaining: '100MB',
  quota: '1GB'
});
```

### 4. `logger.error()` - Errors

**When to use:**
- Exceptions and failures
- API errors
- Database errors
- Any unrecoverable error state

**Visibility:**
- Development: ✅ Logged to console (red)
- Production: ✅ Sent to Sentry with full context

**Example:**
```typescript
try {
  await processVideo(videoId);
} catch (error) {
  logger.error('Failed to process video', error, {
    component: 'video-processor',
    videoId,
    userId: user.id,
    attemptNumber: 3
  });
  throw error;
}
```

## Special Logging Methods

### `logger.perf()` - Performance Tracking

Track operation duration:

```typescript
const startTime = Date.now();
await expensiveOperation();
logger.perf('Database query', startTime, {
  component: 'analytics',
  queryType: 'aggregate',
  rowCount: 1000
});
```

### `logger.api()` - API Call Tracking

Track API requests/responses:

```typescript
logger.api('POST', '/api/video/upload', 201, {
  component: 'video-upload',
  videoSize: '50MB',
  duration: '3s'
});
```

## Context Object Best Practices

Always include a `component` field to identify the source:

```typescript
{
  component: 'video-processor',  // Required: Identifies the module
  videoId: '123',                // Optional: Related entities
  userId: 'user_456',            // Optional: User context
  customField: 'value'           // Optional: Any relevant data
}
```

**Common component names:**
- `video-processor`
- `embeddings`
- `chat`
- `webhook-handler`
- `auth`
- `analytics`

## Production Bundle Optimization

### Terser Configuration

Console statements are automatically removed in production via Terser (configured in `next.config.ts`):

```typescript
compress: {
  drop_console: true,
  pure_funcs: ['console.log', 'console.info', 'console.debug'],
}
```

This removes:
- ❌ `console.log()`
- ❌ `console.info()`
- ❌ `console.debug()`

But keeps:
- ✅ `console.error()` (for emergency debugging)
- ✅ `console.warn()` (for warnings)

**Result:** Smaller bundle size and no sensitive data leakage.

## Linter Configuration

Biome linter prevents new console statements (configured in `biome.json`):

```json
{
  "rules": {
    "suspicious": {
      "noConsole": "error"
    }
  }
}
```

**Exceptions (console allowed):**
- Test files (`*.test.ts`, `**/__tests__/**`)
- Scripts (`scripts/**`)
- Config files (`*.config.ts`)

## Migration from console.log

### Before (BAD ❌)

```typescript
console.log('Processing video:', videoId);
console.error('Failed to process:', error);
console.warn('Storage low:', remaining);
```

**Problems:**
- Logs in production (bundle size)
- No structured context
- No error tracking
- Sensitive data exposure

### After (GOOD ✅)

```typescript
import { logger } from '@/lib/logger';

logger.info('Processing video', {
  component: 'video-processor',
  videoId
});

logger.error('Failed to process video', error, {
  component: 'video-processor',
  videoId,
  userId
});

logger.warn('Storage low', {
  component: 'storage-monitor',
  remaining,
  quota
});
```

**Benefits:**
- Auto-removed in production
- Structured context for debugging
- Errors tracked in Sentry
- No sensitive data in production

## Sentry Integration

### Automatic Error Tracking

All `logger.error()` calls automatically send to Sentry in production:

```typescript
logger.error('Payment processing failed', error, {
  component: 'payment',
  userId: user.id,
  amount: 99.99,
  attemptNumber: 3
});
```

**Sentry will receive:**
- Error stack trace
- Custom context (component, userId, amount, attemptNumber)
- Component tag for filtering
- Environment (production)
- User context (if available)

### Manual Sentry Tracking

For non-error events that need tracking:

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.captureMessage('Critical threshold reached', {
  level: 'warning',
  tags: { component: 'usage-monitor' },
  extra: { creditsRemaining: 100 }
});
```

## Common Patterns

### API Route Logging

```typescript
export async function POST(req: Request) {
  try {
    const body = await req.json();

    logger.info('API request received', {
      component: 'api-video-upload',
      userId: body.userId,
      fileSize: body.size
    });

    const result = await processVideo(body);

    logger.info('API request completed', {
      component: 'api-video-upload',
      videoId: result.id,
      duration: result.processingTime
    });

    return Response.json(result);
  } catch (error) {
    logger.error('API request failed', error, {
      component: 'api-video-upload',
      userId: body?.userId
    });

    return Response.json(
      { error: 'Processing failed' },
      { status: 500 }
    );
  }
}
```

### Background Job Logging

```typescript
export const processVideoJob = inngest.createFunction(
  { id: 'process-video' },
  { event: 'video/upload.completed' },
  async ({ event, step }) => {
    const { videoId, userId } = event.data;

    logger.info('Starting video processing', {
      component: 'video-job',
      videoId,
      userId
    });

    const result = await step.run('process', async () => {
      logger.debug('Extracting audio', {
        component: 'video-job',
        videoId
      });

      return await extractAudio(videoId);
    });

    logger.info('Video processing completed', {
      component: 'video-job',
      videoId,
      duration: result.duration
    });

    return result;
  }
);
```

### Component Logging

```typescript
export function VideoUploader() {
  const handleUpload = async (file: File) => {
    logger.debug('Upload initiated', {
      component: 'video-uploader',
      fileName: file.name,
      fileSize: file.size
    });

    try {
      await uploadVideo(file);

      logger.info('Upload successful', {
        component: 'video-uploader',
        fileName: file.name
      });
    } catch (error) {
      logger.error('Upload failed', error, {
        component: 'video-uploader',
        fileName: file.name,
        fileSize: file.size
      });

      toast.error('Upload failed');
    }
  };

  return <UploadButton onClick={handleUpload} />;
}
```

## Security Best Practices

### ❌ NEVER Log Sensitive Data

**Avoid logging:**
- API keys or secrets
- Authentication tokens
- Password hashes
- Full credit card numbers
- Full email addresses (in production)
- Full phone numbers
- Social security numbers
- Private user data

### ✅ Safe to Log

**Safe to log:**
- User IDs (non-sensitive identifiers)
- Video IDs, course IDs (internal references)
- Operation durations and counts
- Error messages (without sensitive context)
- Feature flags and configuration
- Metadata and statistics

### Sanitization Example

```typescript
// BAD ❌
logger.info('User logged in', {
  email: user.email,           // Sensitive
  apiKey: user.apiKey,         // Sensitive
  token: session.token         // Sensitive
});

// GOOD ✅
logger.info('User logged in', {
  userId: user.id,             // Safe
  plan: user.subscriptionTier, // Safe
  method: 'oauth'              // Safe
});
```

## Verification

### Check Linter

```bash
npm run lint
```

Should show errors for any `console.log` in production code.

### Check Production Bundle

```bash
npm run build
grep -r "console.log" .next/static/chunks/*.js
```

Should return no results (all console.log removed).

### Test Logger

Start dev server and check console output has emoji prefixes and structured context.

## Summary

| Method | Dev | Production | Use Case |
|--------|-----|------------|----------|
| `logger.debug()` | ✅ Console | ❌ Removed | Detailed diagnostics |
| `logger.info()` | ✅ Console | ❌ Removed | Normal operations |
| `logger.warn()` | ✅ Console | ❌ Removed | Recoverable issues |
| `logger.error()` | ✅ Console | ✅ Sentry | Failures & exceptions |
| `logger.perf()` | ✅ Console | ❌ Removed | Performance tracking |
| `logger.api()` | ✅ Console | ❌ Removed | API call tracking |

**Golden Rules:**
1. Always use `logger` instead of `console`
2. Always include `component` in context
3. Use `logger.error()` for all exceptions
4. Never log sensitive data
5. Keep context structured and meaningful

## References

- Logger implementation: `lib/logger.ts`
- Terser config: `next.config.ts` (webpack section)
- Biome config: `biome.json` (noConsole rule)
- Sentry docs: https://docs.sentry.io/platforms/javascript/guides/nextjs/

---

**Last Updated:** 2025-01-18
**Maintained by:** Chronos Development Team
