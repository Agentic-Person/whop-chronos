/**
 * Redis Cache Wrapper for API Route Caching
 *
 * Provides helper functions for caching API responses using Vercel KV (Redis).
 * - Cache with TTL (Time To Live)
 * - Cache invalidation
 * - Cache statistics tracking
 */

import { kv } from '@vercel/kv';
import { createHash } from 'crypto';

const DEFAULT_TTL_SECONDS = 300; // 5 minutes default
const CACHE_PREFIX = 'chronos:api:';

export interface CacheOptions {
  ttl?: number; // TTL in seconds
  prefix?: string; // Custom prefix (default: 'chronos:api:')
}

/**
 * Generate a cache key from a string or object
 */
export function generateCacheKey(
  key: string | Record<string, any>,
  prefix: string = CACHE_PREFIX
): string {
  let keyString: string;

  if (typeof key === 'string') {
    keyString = key;
  } else {
    // Convert object to deterministic string
    keyString = JSON.stringify(
      Object.keys(key)
        .sort()
        .reduce((acc, k) => {
          acc[k] = key[k];
          return acc;
        }, {} as Record<string, any>)
    );
  }

  // Hash for consistent length
  const hash = createHash('sha256')
    .update(keyString)
    .digest('hex')
    .slice(0, 16);

  return `${prefix}${hash}`;
}

/**
 * Get value from cache
 *
 * @param key - Cache key (string or object)
 * @param options - Cache options (ttl, prefix)
 * @returns Cached value or null if not found
 */
export async function getCached<T>(
  key: string | Record<string, any>,
  options?: CacheOptions
): Promise<T | null> {
  try {
    const cacheKey = generateCacheKey(key, options?.prefix);
    const cached = await kv.get<T>(cacheKey);

    if (cached) {
      console.log(`[Cache HIT] ${cacheKey}`);
      return cached;
    }

    console.log(`[Cache MISS] ${cacheKey}`);
    return null;
  } catch (error) {
    console.error('[Cache GET Error]:', error);
    return null;
  }
}

/**
 * Set value in cache with TTL
 *
 * @param key - Cache key (string or object)
 * @param value - Value to cache
 * @param options - Cache options (ttl, prefix)
 */
export async function setCached<T>(
  key: string | Record<string, any>,
  value: T,
  options?: CacheOptions
): Promise<void> {
  try {
    const cacheKey = generateCacheKey(key, options?.prefix);
    const ttl = options?.ttl || DEFAULT_TTL_SECONDS;

    await kv.set(cacheKey, value, { ex: ttl });

    console.log(`[Cache SET] ${cacheKey} (TTL: ${ttl}s)`);
  } catch (error) {
    console.error('[Cache SET Error]:', error);
  }
}

/**
 * Delete value from cache
 *
 * @param key - Cache key (string or object)
 * @param options - Cache options (prefix)
 */
export async function deleteCached(
  key: string | Record<string, any>,
  options?: CacheOptions
): Promise<void> {
  try {
    const cacheKey = generateCacheKey(key, options?.prefix);
    await kv.del(cacheKey);

    console.log(`[Cache DELETE] ${cacheKey}`);
  } catch (error) {
    console.error('[Cache DELETE Error]:', error);
  }
}

/**
 * Invalidate all cache entries matching a pattern
 *
 * @param pattern - Pattern to match (e.g., 'chronos:api:creator:*')
 * @returns Number of keys deleted
 */
export async function invalidatePattern(pattern: string): Promise<number> {
  try {
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

    console.log(`[Cache INVALIDATE] Deleted ${deletedCount} keys matching: ${pattern}`);
    return deletedCount;
  } catch (error) {
    console.error('[Cache INVALIDATE Error]:', error);
    return 0;
  }
}

/**
 * Get or set cached value (cache-aside pattern)
 *
 * @param key - Cache key (string or object)
 * @param fetcher - Function to fetch value if not cached
 * @param options - Cache options (ttl, prefix)
 * @returns Cached or fetched value
 */
export async function getOrSet<T>(
  key: string | Record<string, any>,
  fetcher: () => Promise<T>,
  options?: CacheOptions
): Promise<T> {
  // Try to get from cache
  const cached = await getCached<T>(key, options);
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data
  const value = await fetcher();

  // Store in cache
  await setCached(key, value, options);

  return value;
}

/**
 * Invalidate cache for a specific creator
 *
 * @param creatorId - Creator UUID
 * @returns Number of keys deleted
 */
export async function invalidateCreatorCache(creatorId: string): Promise<number> {
  const pattern = `${CACHE_PREFIX}*${creatorId}*`;
  return invalidatePattern(pattern);
}

/**
 * Invalidate all API cache
 *
 * @returns Number of keys deleted
 */
export async function invalidateAllApiCache(): Promise<number> {
  const pattern = `${CACHE_PREFIX}*`;
  return invalidatePattern(pattern);
}
