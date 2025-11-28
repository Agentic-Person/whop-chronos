# Vector Search Cache API Reference

Quick reference for using the vector search caching system in Chronos.

---

## Import

```typescript
import {
  enhancedSearch,
  searchWithinCourse,
  searchCreatorContent,
  invalidateCacheForVideo,
  invalidateCacheForCreator,
  invalidateAllSearchCache,
  getSearchMetrics,
} from '@/lib/rag/search';
```

---

## Core Functions

### `enhancedSearch(query, options)`

Perform a cached vector search with multi-factor ranking.

**Parameters:**
- `query` (string): User's search query text
- `options` (EnhancedSearchOptions): Configuration options

**Options:**
```typescript
interface EnhancedSearchOptions {
  // Base search
  match_count?: number;              // Default: 5
  similarity_threshold?: number;     // Default: 0.7
  filter_video_ids?: string[] | null;

  // Ranking
  boost_recent_videos?: boolean;     // Default: true
  boost_popular_videos?: boolean;    // Default: true
  boost_viewed_by_student?: string | null;

  // Cache
  enable_cache?: boolean;            // Default: true
  cache_ttl_seconds?: number;        // Default: 600 (10 min)

  // Deduplication
  deduplicate?: boolean;             // Default: true
  deduplicate_similarity_threshold?: number; // Default: 0.95
}
```

**Returns:**
```typescript
Promise<EnhancedSearchResult[]>
```

**Example:**
```typescript
const results = await enhancedSearch('how to trade options', {
  match_count: 10,
  similarity_threshold: 0.75,
  boost_viewed_by_student: studentId,
  enable_cache: true,
});
```

---

### `searchWithinCourse(courseId, query, options)`

Search within a specific course's videos (cached).

**Parameters:**
- `courseId` (string): Course UUID
- `query` (string): Search query
- `options` (Omit<EnhancedSearchOptions, 'filter_video_ids'>)

**Example:**
```typescript
const results = await searchWithinCourse(
  'course-uuid-123',
  'chart patterns',
  { match_count: 5 }
);
```

---

### `searchCreatorContent(creatorId, query, options)`

Search all videos by a specific creator (cached).

**Parameters:**
- `creatorId` (string): Creator UUID
- `query` (string): Search query
- `options` (Omit<EnhancedSearchOptions, 'filter_video_ids'>)

**Example:**
```typescript
const results = await searchCreatorContent(
  'creator-uuid-456',
  'risk management',
  { similarity_threshold: 0.8 }
);
```

---

## Cache Management

### `invalidateCacheForVideo(videoId)`

Invalidate cache entries for a specific video.

**When to use:**
- Video transcript updated
- Video metadata changed
- Video deleted

**Example:**
```typescript
await invalidateCacheForVideo('video-uuid-789');
```

---

### `invalidateCacheForCreator(creatorId)`

Invalidate cache entries for all videos owned by a creator.

**When to use:**
- Creator account deleted
- Bulk video updates
- Creator content refresh

**Example:**
```typescript
await invalidateCacheForCreator('creator-uuid-456');
```

---

### `invalidateAllSearchCache()`

Clear all search cache entries.

**When to use:**
- Major system updates
- Database migrations
- Administrative cleanup

**Example:**
```typescript
await invalidateAllSearchCache();
```

---

## Metrics & Monitoring

### `getSearchMetrics()`

Get cache performance statistics.

**Returns:**
```typescript
{
  cache_hits: number;
  cache_misses: number;
  cache_hit_rate: number;    // 0-1 (0.78 = 78%)
  total_searches: number;
}
```

**Example:**
```typescript
const metrics = await getSearchMetrics();
console.log(`Cache hit rate: ${(metrics.cache_hit_rate * 100).toFixed(1)}%`);
// Cache hit rate: 78.3%
```

---

## Common Patterns

### Basic Search with Caching

```typescript
// Default behavior - caching enabled
const results = await enhancedSearch(userQuery);
```

### Disable Cache for Testing

```typescript
const results = await enhancedSearch(userQuery, {
  enable_cache: false,
});
```

### Custom Cache TTL

```typescript
const results = await enhancedSearch(userQuery, {
  cache_ttl_seconds: 1800, // 30 minutes
});
```

### Search with Personalization

```typescript
const results = await enhancedSearch(userQuery, {
  boost_viewed_by_student: studentId,
  boost_recent_videos: true,
  boost_popular_videos: true,
});
```

### Search Specific Videos

```typescript
const results = await enhancedSearch(userQuery, {
  filter_video_ids: ['video-1', 'video-2', 'video-3'],
});
```

---

## Cache Invalidation Patterns

### After Video Update

```typescript
async function updateVideo(videoId: string, updates: VideoUpdates) {
  // Update video in database
  await updateVideoInDatabase(videoId, updates);

  // Invalidate search cache
  await invalidateCacheForVideo(videoId);
}
```

### After Bulk Import

```typescript
async function importVideos(creatorId: string, videos: Video[]) {
  // Import videos
  const importedVideos = await bulkImportVideos(videos);

  // Invalidate creator cache
  await invalidateCacheForCreator(creatorId);
}
```

### After Content Update

```typescript
async function updateVideoTranscript(videoId: string, transcript: string) {
  // Update transcript
  await updateTranscriptInDatabase(videoId, transcript);

  // Regenerate chunks and embeddings
  await processVideoChunks(videoId);

  // Invalidate cache
  await invalidateCacheForVideo(videoId);
}
```

---

## Performance Optimization

### Batch Invalidation

```typescript
// ❌ BAD: Multiple individual invalidations
for (const videoId of videoIds) {
  await invalidateCacheForVideo(videoId);
}

// ✅ GOOD: Use creator-level invalidation
await invalidateCacheForCreator(creatorId);
```

### Optimal Match Count

```typescript
// ❌ BAD: Requesting too many results
const results = await enhancedSearch(query, {
  match_count: 50, // Overkill for most use cases
});

// ✅ GOOD: Reasonable result count
const results = await enhancedSearch(query, {
  match_count: 5, // Sufficient for RAG context
});
```

---

## Debugging

### Check Cache Status

```typescript
const metrics = await getSearchMetrics();
console.log('Cache Stats:', {
  hitRate: `${(metrics.cache_hit_rate * 100).toFixed(1)}%`,
  totalSearches: metrics.total_searches,
  hits: metrics.cache_hits,
  misses: metrics.cache_misses,
});
```

### Force Cache Miss

```typescript
// Temporarily disable cache to test search logic
const results = await enhancedSearch(query, {
  enable_cache: false,
});
```

### Test Cache Key Generation

```typescript
// Internal function, but useful for debugging
const cacheKey = getCacheKey('test query', {
  filter_video_ids: ['video-1'],
  boost_viewed_by_student: 'student-123',
  match_count: 5,
  similarity_threshold: 0.7,
});
console.log('Cache key:', cacheKey);
// rag:search:test query:video-1:student-123:5:0.7
```

---

## Troubleshooting

### Cache Not Working

**Problem:** Search always performs database queries

**Solutions:**
1. Verify Redis connection (`VERCEL_KV_URL` set)
2. Check cache is enabled in options
3. Confirm cache metrics are incrementing

```typescript
// Check if cache is enabled
const results = await enhancedSearch(query, {
  enable_cache: true, // Explicitly enable
});

// Check metrics
const metrics = await getSearchMetrics();
if (metrics.total_searches === 0) {
  console.error('Cache metrics not working');
}
```

### Low Cache Hit Rate

**Problem:** Cache hit rate below 50%

**Possible causes:**
1. Too many unique queries (expected)
2. Cache TTL too short
3. Frequent content updates

**Solutions:**
```typescript
// Increase TTL
const results = await enhancedSearch(query, {
  cache_ttl_seconds: 1800, // 30 minutes
});

// Normalize queries before search
const normalizedQuery = query.toLowerCase().trim();
const results = await enhancedSearch(normalizedQuery);
```

---

## Related Documentation

- [Vector Search Cache Implementation](./VECTOR_SEARCH_CACHE_IMPLEMENTATION.md)
- [RAG System Overview](../chat/RAG_SYSTEM.md)
- [Redis Cache Wrapper](../../api/CACHE_API.md)

---

Assisted by Jimmy Solutions Developer at Agentic Personnel LLC <Jimmy@AgenticPersonnel.com>
