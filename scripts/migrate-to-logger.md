# Console Statement Migration Guide

This guide helps convert remaining console statements to use the structured logger utility.

## Current Status

**Total console statements in production code:** 617

Breakdown:
- `console.log`: 242 statements
- `console.error`: 350 statements
- `console.warn`: 24 statements
- `console.info`: 1 statement

## Files Already Converted (2 files, 21 statements)

✅ **inngest/generate-embeddings.ts** - 19 statements converted
✅ **lib/whop/webhooks.ts** - 2 statements converted

## Top Priority Files for Manual Conversion

Based on console statement count (excluding tests):

1. **lib/whop/test-integration.ts** (45 statements) - Test file, can ignore
2. **lib/rag/verify-setup.ts** (22 statements) - Verification script
3. **lib/video/mux-processor.ts** (19 statements) - Critical video processing
4. **lib/video/whisper-processor.ts** (18 statements) - Critical transcription
5. **lib/middleware/cost-tracker.ts** (17 statements) - Financial tracking
6. **lib/rag/search.ts** (16 statements) - Core RAG functionality
7. **lib/ai/cache.ts** (16 statements) - AI response caching
8. **lib/video/transcript-router.ts** (15 statements) - Routing logic
9. **lib/whop/webhooks.ts** (14 statements) - Partially converted
10. **lib/whop/roles.ts** (13 statements) - Authorization logic

## Migration Pattern

### Step 1: Add Import

```typescript
import { logger } from '@/lib/logger';
```

### Step 2: Convert Statements

#### console.log → logger.info() or logger.debug()

**Before:**
```typescript
console.log(`Processing video ${videoId}`);
console.log('Video data:', videoData);
```

**After:**
```typescript
logger.info('Processing video', { component: 'video-processor', videoId });
logger.debug('Video data retrieved', { component: 'video-processor', data: videoData });
```

**Rule:** Use `logger.info()` for important operations, `logger.debug()` for detailed diagnostics.

#### console.error → logger.error()

**Before:**
```typescript
console.error('Failed to process:', error);
console.error(`Upload failed for video ${videoId}:`, error);
```

**After:**
```typescript
logger.error('Failed to process video', error, { component: 'video-processor' });
logger.error('Upload failed', error, { component: 'uploader', videoId });
```

**Rule:** Always pass the error object as the second parameter.

#### console.warn → logger.warn()

**Before:**
```typescript
console.warn('Storage limit approaching:', remaining);
```

**After:**
```typescript
logger.warn('Storage limit approaching', { component: 'storage', remaining });
```

## Example Conversion: mux-processor.ts

### Before:
```typescript
export async function processVideoWithMux(videoId: string) {
  console.log(`[Mux] Starting processing for ${videoId}`);

  try {
    const asset = await createMuxAsset(videoUrl);
    console.log(`[Mux] Asset created: ${asset.id}`);

    const transcript = await downloadTranscript(asset);
    console.log(`[Mux] Transcript downloaded`);

    return { asset, transcript };
  } catch (error) {
    console.error('[Mux] Processing failed:', error);
    throw error;
  }
}
```

### After:
```typescript
import { logger } from '@/lib/logger';

export async function processVideoWithMux(videoId: string) {
  logger.info('Starting Mux processing', { component: 'mux-processor', videoId });

  try {
    const asset = await createMuxAsset(videoUrl);
    logger.info('Mux asset created', { component: 'mux-processor', assetId: asset.id });

    const transcript = await downloadTranscript(asset);
    logger.info('Transcript downloaded', { component: 'mux-processor', videoId });

    return { asset, transcript };
  } catch (error) {
    logger.error('Mux processing failed', error, { component: 'mux-processor', videoId });
    throw error;
  }
}
```

## Context Object Guidelines

Always include `component` to identify the source:

```typescript
{
  component: 'video-processor',  // Required
  videoId: '123',                // Optional: Related entity IDs
  userId: 'user_456',            // Optional: User context
  duration: '2m 30s',            // Optional: Metrics
  // Any other relevant context
}
```

**Common component names:**
- `video-processor`
- `mux-processor`
- `whisper-processor`
- `embeddings`
- `rag-search`
- `chat`
- `webhook-handler`
- `cost-tracker`
- `auth`

## Automated Conversion Script (Regex)

For simple conversions, you can use search-and-replace:

### Pattern 1: Simple console.log
**Find:** `console\.log\((.*)\);`
**Replace:** `logger.info($1, { component: 'FIXME' });`

### Pattern 2: console.error with error object
**Find:** `console\.error\((.*),\s*error\);`
**Replace:** `logger.error($1, error, { component: 'FIXME' });`

**Note:** You'll need to manually replace 'FIXME' with the actual component name.

## Verification After Migration

1. **Check imports:**
   ```bash
   grep -r "logger" --include="*.ts" lib/ | grep "import { logger }"
   ```

2. **Find remaining console statements:**
   ```bash
   grep -r "console\." --include="*.ts" lib/ | grep -v "test" | wc -l
   ```

3. **Run linter:**
   ```bash
   npm run lint
   ```

4. **Test in development:**
   - Start dev server: `npm run dev`
   - Check console has emoji prefixes and structured context
   - Verify logger.error() calls work

5. **Build for production:**
   ```bash
   npm run build
   grep -r "console.log" .next/static/chunks/*.js | wc -l  # Should be 0
   ```

## Files to Ignore (Tests & Scripts)

These files are exempt from linter rules and don't need migration:

- `**/*.test.ts`
- `**/*.test.tsx`
- `**/__tests__/**`
- `**/scripts/**`
- `**/*.config.ts`
- `lib/logger.ts` (the logger itself)

## Benefits After Migration

1. **Smaller bundle:** Terser removes all console statements in production
2. **No sensitive data:** Logs only in development
3. **Error tracking:** All errors automatically sent to Sentry in production
4. **Structured logging:** Consistent format with context
5. **Better debugging:** Emoji prefixes and component identification

## Estimated Time

- Small file (5-10 statements): 5-10 minutes
- Medium file (10-20 statements): 15-20 minutes
- Large file (20+ statements): 30-45 minutes

**Total for top 10 files:** ~3-4 hours

## Next Steps

1. Pick a file from the priority list above
2. Add logger import
3. Convert console statements using patterns above
4. Test in development
5. Commit with message: `refactor(logging): convert [filename] to use structured logger`
6. Repeat for next file

## Questions?

See `docs/logging-guidelines.md` for comprehensive documentation.

---

**Last Updated:** 2025-01-18
**Migration Progress:** 21/617 statements (3.4%)
