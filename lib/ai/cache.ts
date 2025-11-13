/**
 * Response Caching for AI Chat
 *
 * Cache common questions using Vercel KV (Redis).
 * - Cache key: hash of (query + video context)
 * - Invalidate on new video uploads
 * - Track cache hit rates
 */

import { kv } from '@vercel/kv';
import { createHash } from 'crypto';
import type { VectorSearchResult } from '@/lib/video/vector-search';
import type { ChatCompletionResult } from './claude';

const CACHE_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days
const CACHE_PREFIX = 'chronos:chat:';
const STATS_KEY = 'chronos:cache:stats';

export interface CachedResponse {
  content: string;
  videoReferences?: Array<{
    video_id: string;
    video_title: string;
    timestamp: number;
    snippet: string;
  }>;
  model: string;
  cachedAt: number;
  hitCount: number;
}

export interface CacheStats {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  hitRate: number;
  totalSaved: number; // Estimated cost saved
}

/**
 * Generate cache key from query and context
 */
function generateCacheKey(
  query: string,
  searchResults: VectorSearchResult[]
): string {
  // Normalize query (lowercase, trim)
  const normalizedQuery = query.toLowerCase().trim();

  // Create context fingerprint from video IDs and timestamps
  const contextFingerprint = searchResults
    .slice(0, 3) // Only use top 3 results for cache key
    .map(r => `${r.video_id}:${r.start_time_seconds}`)
    .sort()
    .join('|');

  // Hash the combination
  const hash = createHash('sha256')
    .update(`${normalizedQuery}::${contextFingerprint}`)
    .digest('hex')
    .slice(0, 16); // Use first 16 chars

  return `${CACHE_PREFIX}${hash}`;
}

/**
 * Get cached response if available
 */
export async function getCachedResponse(
  query: string,
  searchResults: VectorSearchResult[]
): Promise<CachedResponse | null> {
  try {
    const cacheKey = generateCacheKey(query, searchResults);
    const cached = await kv.get<CachedResponse>(cacheKey);

    if (cached) {
      console.log(`Cache hit for query: "${query.slice(0, 50)}..."`);

      // Increment hit count
      await kv.set(cacheKey, {
        ...cached,
        hitCount: cached.hitCount + 1,
      }, { ex: CACHE_TTL_SECONDS });

      // Update stats
      await updateCacheStats('hit');

      return cached;
    }

    console.log(`Cache miss for query: "${query.slice(0, 50)}..."`);
    await updateCacheStats('miss');

    return null;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
}

/**
 * Cache a response
 */
export async function cacheResponse(
  query: string,
  searchResults: VectorSearchResult[],
  response: ChatCompletionResult
): Promise<void> {
  try {
    const cacheKey = generateCacheKey(query, searchResults);

    const cachedData: CachedResponse = {
      content: response.content,
      videoReferences: response.videoReferences,
      model: response.model,
      cachedAt: Date.now(),
      hitCount: 0,
    };

    await kv.set(cacheKey, cachedData, { ex: CACHE_TTL_SECONDS });

    console.log(`Cached response for query: "${query.slice(0, 50)}..."`);
  } catch (error) {
    console.error('Cache set error:', error);
  }
}

/**
 * Invalidate cache for specific video
 */
export async function invalidateVideoCache(videoId: string): Promise<number> {
  try {
    // Scan for all cache keys
    const pattern = `${CACHE_PREFIX}*`;
    let cursor = '0';
    let deletedCount = 0;

    do {
      const result = await kv.scan(cursor, { match: pattern, count: 100 });
      cursor = result[0];
      const keys = result[1] as string[];

      // Delete keys (we can't check video_id without fetching all values)
      // For simplicity, we invalidate all cache when a video changes
      if (keys.length > 0) {
        await kv.del(...keys);
        deletedCount += keys.length;
      }
    } while (cursor !== '0');

    console.log(`Invalidated ${deletedCount} cached responses for video ${videoId}`);
    return deletedCount;
  } catch (error) {
    console.error('Cache invalidation error:', error);
    return 0;
  }
}

/**
 * Invalidate all cache
 */
export async function invalidateAllCache(): Promise<number> {
  try {
    const pattern = `${CACHE_PREFIX}*`;
    let cursor = '0';
    let deletedCount = 0;

    do {
      const result = await kv.scan(cursor, { match: pattern, count: 100 });
      cursor = result[0];
      const keys = result[1] as string[];

      if (keys.length > 0) {
        await kv.del(...keys);
        deletedCount += keys.length;
      }
    } while (cursor !== '0');

    console.log(`Invalidated all ${deletedCount} cached responses`);
    return deletedCount;
  } catch (error) {
    console.error('Cache invalidation error:', error);
    return 0;
  }
}

/**
 * Update cache statistics
 */
async function updateCacheStats(type: 'hit' | 'miss'): Promise<void> {
  try {
    const stats = await kv.get<CacheStats>(STATS_KEY) || {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      hitRate: 0,
      totalSaved: 0,
    };

    stats.totalRequests++;

    if (type === 'hit') {
      stats.cacheHits++;
      // Estimate cost saved (assuming average response costs $0.005)
      stats.totalSaved += 0.005;
    } else {
      stats.cacheMisses++;
    }

    stats.hitRate = stats.cacheHits / stats.totalRequests;

    await kv.set(STATS_KEY, stats);
  } catch (error) {
    console.error('Cache stats update error:', error);
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<CacheStats> {
  try {
    const stats = await kv.get<CacheStats>(STATS_KEY);

    return stats || {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      hitRate: 0,
      totalSaved: 0,
    };
  } catch (error) {
    console.error('Cache stats get error:', error);
    return {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      hitRate: 0,
      totalSaved: 0,
    };
  }
}

/**
 * Reset cache statistics
 */
export async function resetCacheStats(): Promise<void> {
  try {
    await kv.del(STATS_KEY);
    console.log('Cache statistics reset');
  } catch (error) {
    console.error('Cache stats reset error:', error);
  }
}

/**
 * Get cache size and info
 */
export async function getCacheInfo(): Promise<{
  cachedResponses: number;
  stats: CacheStats;
}> {
  try {
    const pattern = `${CACHE_PREFIX}*`;
    let cursor = '0';
    let count = 0;

    do {
      const result = await kv.scan(cursor, { match: pattern, count: 100 });
      cursor = result[0];
      const keys = result[1] as string[];
      count += keys.length;
    } while (cursor !== '0');

    const stats = await getCacheStats();

    return {
      cachedResponses: count,
      stats,
    };
  } catch (error) {
    console.error('Cache info error:', error);
    return {
      cachedResponses: 0,
      stats: {
        totalRequests: 0,
        cacheHits: 0,
        cacheMisses: 0,
        hitRate: 0,
        totalSaved: 0,
      },
    };
  }
}

/**
 * Warm cache with common questions
 */
export async function warmCache(
  commonQuestions: Array<{
    query: string;
    searchResults: VectorSearchResult[];
    response: ChatCompletionResult;
  }>
): Promise<number> {
  let cached = 0;

  for (const { query, searchResults, response } of commonQuestions) {
    try {
      await cacheResponse(query, searchResults, response);
      cached++;
    } catch (error) {
      console.error(`Failed to cache question: "${query}"`, error);
    }
  }

  console.log(`Warmed cache with ${cached} common questions`);
  return cached;
}
