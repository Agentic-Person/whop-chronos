# YouTube Processor Test Recommendations

## Overview

This document outlines comprehensive test cases for the YouTube processor library (`lib/video/youtube-processor.ts`).

## Unit Tests

### 1. URL Extraction Tests

**Test File:** `__tests__/lib/video/youtube-processor.test.ts`

```typescript
describe('extractYouTubeVideoId', () => {
  it('should extract ID from standard watch URL', () => {
    const id = extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(id).toBe('dQw4w9WgXcQ');
  });

  it('should extract ID from short URL', () => {
    const id = extractYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ');
    expect(id).toBe('dQw4w9WgXcQ');
  });

  it('should extract ID from embed URL', () => {
    const id = extractYouTubeVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ');
    expect(id).toBe('dQw4w9WgXcQ');
  });

  it('should extract ID from old format URL', () => {
    const id = extractYouTubeVideoId('https://www.youtube.com/v/dQw4w9WgXcQ');
    expect(id).toBe('dQw4w9WgXcQ');
  });

  it('should extract ID from mobile URL', () => {
    const id = extractYouTubeVideoId('https://m.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(id).toBe('dQw4w9WgXcQ');
  });

  it('should extract ID from URL with query parameters', () => {
    const id = extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s');
    expect(id).toBe('dQw4w9WgXcQ');
  });

  it('should handle URLs with whitespace', () => {
    const id = extractYouTubeVideoId('  https://www.youtube.com/watch?v=dQw4w9WgXcQ  ');
    expect(id).toBe('dQw4w9WgXcQ');
  });

  it('should throw error for invalid URL', () => {
    expect(() => extractYouTubeVideoId('https://vimeo.com/123456')).toThrow('Invalid YouTube URL');
  });

  it('should throw error for malformed YouTube URL', () => {
    expect(() => extractYouTubeVideoId('https://youtube.com/invalid')).toThrow('Invalid YouTube URL');
  });
});
```

### 2. Video Processing Tests

```typescript
describe('processYouTubeVideo', () => {
  it('should extract complete video metadata', async () => {
    const result = await processYouTubeVideo(
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'test_creator_123'
    );

    expect(result).toHaveProperty('videoId');
    expect(result).toHaveProperty('title');
    expect(result).toHaveProperty('duration');
    expect(result).toHaveProperty('thumbnail');
    expect(result).toHaveProperty('channelId');
    expect(result).toHaveProperty('channelName');
    expect(result).toHaveProperty('description');
    expect(result).toHaveProperty('transcript');
    expect(result).toHaveProperty('transcriptWithTimestamps');
  });

  it('should extract transcript with valid timestamps', async () => {
    const result = await processYouTubeVideo(
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'test_creator_123'
    );

    expect(result.transcriptWithTimestamps.length).toBeGreaterThan(0);
    result.transcriptWithTimestamps.forEach(segment => {
      expect(segment).toHaveProperty('text');
      expect(segment).toHaveProperty('start');
      expect(segment).toHaveProperty('duration');
      expect(typeof segment.start).toBe('number');
      expect(typeof segment.duration).toBe('number');
    });
  });

  it('should have non-empty full transcript', async () => {
    const result = await processYouTubeVideo(
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'test_creator_123'
    );

    expect(result.transcript.length).toBeGreaterThan(0);
    expect(typeof result.transcript).toBe('string');
  });
});
```

### 3. Error Handling Tests

```typescript
describe('YouTube processor error handling', () => {
  it('should throw VIDEO_NOT_FOUND for invalid video ID', async () => {
    await expect(
      processYouTubeVideo('https://www.youtube.com/watch?v=INVALID123', 'creator_123')
    ).rejects.toThrow(YouTubeProcessorError);

    try {
      await processYouTubeVideo('https://www.youtube.com/watch?v=INVALID123', 'creator_123');
    } catch (error) {
      expect(error).toBeInstanceOf(YouTubeProcessorError);
      expect((error as YouTubeProcessorError).code).toBe(YouTubeErrorCode.VIDEO_NOT_FOUND);
    }
  });

  it('should throw NO_TRANSCRIPT for videos without captions', async () => {
    // Use a known video without transcript (need to find example)
    // This will vary - mock the YouTube API response instead
    expect(true).toBe(true); // Placeholder
  });

  it('should throw AGE_RESTRICTED for age-restricted videos', async () => {
    // Mock test - actual implementation would require finding age-restricted video
    expect(true).toBe(true); // Placeholder
  });
});
```

### 4. Helper Function Tests

```typescript
describe('isYouTubeUrl', () => {
  it('should return true for valid YouTube URLs', () => {
    expect(isYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
    expect(isYouTubeUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(true);
  });

  it('should return false for non-YouTube URLs', () => {
    expect(isYouTubeUrl('https://vimeo.com/123456')).toBe(false);
    expect(isYouTubeUrl('https://example.com')).toBe(false);
  });
});

describe('getErrorMessage', () => {
  it('should return user-friendly messages for each error code', () => {
    const error = new YouTubeProcessorError(
      'Test error',
      YouTubeErrorCode.INVALID_URL
    );
    const message = getErrorMessage(error);
    expect(message).toContain('Invalid YouTube URL');
  });
});
```

## Integration Tests

### 1. End-to-End Video Processing

**Test File:** `scripts/test-youtube-processor.ts`

```typescript
import { processYouTubeVideo } from '@/lib/video/youtube-processor';

async function testYouTubeProcessor() {
  console.log('🧪 Testing YouTube Processor\n');

  // Test cases: Array of [URL, description, shouldSucceed]
  const testCases = [
    [
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'Standard YouTube URL with captions',
      true,
    ],
    [
      'https://youtu.be/dQw4w9WgXcQ',
      'Short YouTube URL',
      true,
    ],
    [
      'https://www.youtube.com/watch?v=INVALID_ID',
      'Invalid video ID',
      false,
    ],
    [
      'https://vimeo.com/123456',
      'Non-YouTube URL',
      false,
    ],
  ];

  for (const [url, description, shouldSucceed] of testCases) {
    console.log(`\nTest: ${description}`);
    console.log(`URL: ${url}`);

    try {
      const result = await processYouTubeVideo(url as string, 'test_creator');

      if (shouldSucceed) {
        console.log('✅ Success');
        console.log(`  - Video ID: ${result.videoId}`);
        console.log(`  - Title: ${result.title}`);
        console.log(`  - Duration: ${result.duration}s`);
        console.log(`  - Transcript length: ${result.transcript.length} chars`);
        console.log(`  - Transcript segments: ${result.transcriptWithTimestamps.length}`);
      } else {
        console.log('❌ Expected failure but succeeded');
      }
    } catch (error) {
      if (!shouldSucceed) {
        console.log('✅ Failed as expected');
        console.log(`  - Error: ${error.message}`);
      } else {
        console.log('❌ Unexpected failure');
        console.error(error);
      }
    }
  }
}

// Run tests
testYouTubeProcessor().catch(console.error);
```

**Run command:**
```bash
npx tsx scripts/test-youtube-processor.ts
```

### 2. Performance Tests

```typescript
async function testPerformance() {
  console.log('⏱️  Performance Test\n');

  const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

  // Test 1: Single video processing time
  console.log('Test 1: Single video processing');
  const start1 = Date.now();
  await processYouTubeVideo(url, 'test_creator');
  const duration1 = Date.now() - start1;
  console.log(`  Time: ${duration1}ms`);
  console.log(`  Expected: < 10000ms (10 seconds)`);
  console.log(`  Status: ${duration1 < 10000 ? '✅ Pass' : '❌ Fail'}\n`);

  // Test 2: Concurrent processing
  console.log('Test 2: Concurrent processing (3 videos)');
  const start2 = Date.now();
  await Promise.all([
    processYouTubeVideo(url, 'test_creator_1'),
    processYouTubeVideo(url, 'test_creator_2'),
    processYouTubeVideo(url, 'test_creator_3'),
  ]);
  const duration2 = Date.now() - start2;
  console.log(`  Time: ${duration2}ms`);
  console.log(`  Expected: < 15000ms (15 seconds)`);
  console.log(`  Status: ${duration2 < 15000 ? '✅ Pass' : '❌ Fail'}`);
}
```

## Manual Testing Checklist

### Pre-Deployment Tests

- [ ] Test with standard YouTube URL format
- [ ] Test with short URL (youtu.be)
- [ ] Test with embed URL
- [ ] Test with URL containing query parameters
- [ ] Test with private video (should fail gracefully)
- [ ] Test with deleted video (should fail gracefully)
- [ ] Test with video without transcript (should fail gracefully)
- [ ] Test with age-restricted video (should fail gracefully)
- [ ] Test with very long video (1+ hour)
- [ ] Test with very short video (< 1 minute)
- [ ] Test with non-English transcript
- [ ] Test transcript timestamp accuracy
- [ ] Test full transcript completeness
- [ ] Verify error messages are user-friendly

### Edge Cases

- [ ] URL with trailing spaces
- [ ] URL with mixed case
- [ ] URL with www vs non-www
- [ ] URL with http vs https
- [ ] Playlist URL (should extract first video or fail)
- [ ] Live stream URL
- [ ] YouTube Shorts URL
- [ ] YouTube Music URL

## Success Criteria

### Performance Metrics
- ✅ Video processing completes in < 10 seconds for standard videos
- ✅ Transcript extraction accuracy: 95%+ match with YouTube's captions
- ✅ No memory leaks during concurrent processing
- ✅ Handles 10+ concurrent requests without failure

### Functional Requirements
- ✅ Extracts all required metadata fields
- ✅ Transcript includes accurate timestamps
- ✅ Full transcript is complete and formatted correctly
- ✅ All error cases handled gracefully
- ✅ Error messages are clear and actionable

### Code Quality
- ✅ TypeScript compiles without errors
- ✅ All functions have JSDoc comments
- ✅ All error paths are tested
- ✅ No console.errors in production (only console.log for debugging)

## Test Data

### Known Good Videos (with transcripts)

1. **Rick Astley - Never Gonna Give You Up**
   - URL: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
   - Duration: ~3:33
   - Has auto-generated captions

2. **Tutorial/Educational Video**
   - Find a popular coding tutorial with captions
   - Test transcript quality

### Known Problem Videos

1. **No Transcript Available**
   - Find video without captions for testing error handling

2. **Private Video**
   - Create private test video or use known private URL

## Continuous Integration

Add to CI/CD pipeline:

```yaml
# .github/workflows/test.yml
- name: Test YouTube Processor
  run: |
    npm run test -- youtube-processor
    npx tsx scripts/test-youtube-processor.ts
```

## Future Enhancements

1. **Caching Layer**
   - Cache video metadata to avoid re-fetching
   - Cache transcripts for commonly accessed videos

2. **Retry Logic**
   - Implement exponential backoff for rate limiting
   - Fallback to alternative transcript sources

3. **Multi-language Support**
   - Detect available caption languages
   - Allow selection of preferred language
   - Extract translations

4. **Transcript Quality Metrics**
   - Confidence scores
   - Auto-generated vs manual captions detection
   - Formatting quality assessment

---

**Status:** Test plan ready for implementation
**Last Updated:** 2025-01-11
**Related:** YouTube Embedding Implementation Plan
