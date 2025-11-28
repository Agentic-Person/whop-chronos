/**
 * Enhanced Vector Search for RAG with Advanced Ranking
 *
 * This module extends the base vector search with:
 * - Multi-factor ranking (similarity + recency + popularity)
 * - Student viewing history boost
 * - Configurable result filtering
 * - Cache integration for performance
 */

import { kv } from '@vercel/kv';
import { searchVideoChunks, type VectorSearchResult } from '@/lib/video/vector-search';
import { rankSearchResults, type RankingOptions } from './ranking';
import { getServiceSupabase } from '@/lib/db/client';
import { logger } from '@/lib/logger';

export interface EnhancedSearchOptions {
  // Base search options
  match_count?: number; // Default: 5
  similarity_threshold?: number; // Default: 0.7
  filter_video_ids?: string[] | null;

  // Ranking options
  boost_recent_videos?: boolean; // Default: true
  boost_popular_videos?: boolean; // Default: true
  boost_viewed_by_student?: string | null; // Student ID for personalization

  // Advanced options
  enable_cache?: boolean; // Default: true
  cache_ttl_seconds?: number; // Default: 600 (10 minutes)
  deduplicate?: boolean; // Default: true
  deduplicate_similarity_threshold?: number; // Default: 0.95
}

export interface EnhancedSearchResult extends VectorSearchResult {
  rank_score: number; // Combined ranking score
  rank_breakdown?: {
    similarity_score: number;
    recency_boost: number;
    popularity_boost: number;
    view_history_boost: number;
  };
}

const DEFAULT_OPTIONS: Required<Omit<EnhancedSearchOptions, 'filter_video_ids' | 'boost_viewed_by_student'>> = {
  match_count: 5,
  similarity_threshold: 0.7,
  boost_recent_videos: true,
  boost_popular_videos: true,
  enable_cache: true,
  cache_ttl_seconds: 600, // 10 minutes
  deduplicate: true,
  deduplicate_similarity_threshold: 0.95,
};

/**
 * Generate cache key for search query
 */
function getCacheKey(query: string, options: EnhancedSearchOptions): string {
  const videoIds = options.filter_video_ids?.sort().join(',') || 'all';
  const studentId = options.boost_viewed_by_student || 'none';
  return `rag:search:${query}:${videoIds}:${studentId}:${options.match_count}:${options.similarity_threshold}`;
}

/**
 * Increment cache metrics (hits/misses)
 */
async function incrementCacheMetric(metric: 'cache_hits' | 'cache_misses'): Promise<void> {
  try {
    const key = `rag:metrics:${metric}`;
    await kv.incr(key);
  } catch (error) {
    // Fail silently - metrics are not critical
    logger.debug('Failed to increment cache metric', { metric, error });
  }
}

/**
 * Enhanced semantic search with multi-factor ranking
 *
 * @param query - User's search query text
 * @param options - Enhanced search configuration
 * @returns Ranked array of search results with scoring breakdown
 */
export async function enhancedSearch(
  query: string,
  options: EnhancedSearchOptions = {}
): Promise<EnhancedSearchResult[]> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Check cache first
  if (opts.enable_cache) {
    try {
      const cacheKey = getCacheKey(query, options);
      const cached = await kv.get<EnhancedSearchResult[]>(cacheKey);

      if (cached) {
        logger.debug('Vector search cache hit', { query: query.substring(0, 50), cacheKey });
        // Increment cache hit counter
        await incrementCacheMetric('cache_hits');
        return cached;
      }

      // Increment cache miss counter
      await incrementCacheMetric('cache_misses');
    } catch (error) {
      logger.warn('Cache read failed, continuing with search', { error });
    }
  }

  // Perform base vector search (fetch more than needed for ranking)
  const expandedMatchCount = Math.min(opts.match_count * 3, 20);
  logger.debug('Performing vector search', {
    query: query.substring(0, 50),
    expandedMatchCount
  });

  const searchResults = await searchVideoChunks(query, {
    match_count: expandedMatchCount,
    similarity_threshold: opts.similarity_threshold,
    filter_video_ids: opts.filter_video_ids,
    include_video_metadata: true,
  });

  if (searchResults.length === 0) {
    logger.debug('No results found for query', { query: query.substring(0, 50) });
    return [];
  }

  logger.debug('Found candidate results, applying ranking', {
    candidateCount: searchResults.length
  });

  // Apply multi-factor ranking
  const rankingOptions: RankingOptions = {
    enable_recency_boost: opts.boost_recent_videos,
    enable_popularity_boost: opts.boost_popular_videos,
    student_id: opts.boost_viewed_by_student || undefined,
    deduplicate: opts.deduplicate,
    deduplicate_similarity_threshold: opts.deduplicate_similarity_threshold,
  };

  const rankedResults = await rankSearchResults(searchResults, rankingOptions);

  // Take top N results after ranking
  const topResults = rankedResults.slice(0, opts.match_count);

  logger.debug('Returning ranked results', { resultCount: topResults.length });

  // Cache results
  if (opts.enable_cache) {
    try {
      const cacheKey = getCacheKey(query, options);
      await kv.set(cacheKey, topResults, { ex: opts.cache_ttl_seconds });
      logger.debug('Cached search results', { cacheKey, ttl: opts.cache_ttl_seconds });
    } catch (error) {
      logger.warn('Cache write failed', { error });
    }
  }

  return topResults;
}

/**
 * Search within a specific course's videos
 */
export async function searchWithinCourse(
  courseId: string,
  query: string,
  options: Omit<EnhancedSearchOptions, 'filter_video_ids'> = {}
): Promise<EnhancedSearchResult[]> {
  // Get video IDs for the course
  const supabase = getServiceSupabase();

  const { data: modules, error } = await supabase
    .from('course_modules')
    .select('video_ids')
    .eq('course_id', courseId);

  if (error) {
    throw new Error(`Failed to fetch course videos: ${error.message}`);
  }

  // Flatten video IDs from all modules
  const videoIds = modules?.flatMap((m: any) => m.video_ids || []) || [];

  if (videoIds.length === 0) {
    logger.warn('No videos found for course', { courseId });
    return [];
  }

  logger.debug('Searching within course', { courseId, videoCount: videoIds.length });

  return enhancedSearch(query, {
    ...options,
    filter_video_ids: videoIds,
  });
}

/**
 * Search for videos by a specific creator
 */
export async function searchCreatorContent(
  creatorId: string,
  query: string,
  options: Omit<EnhancedSearchOptions, 'filter_video_ids'> = {}
): Promise<EnhancedSearchResult[]> {
  // Get all video IDs for creator
  const supabase = getServiceSupabase();

  const { data: videos, error } = await supabase
    .from('videos')
    .select('id')
    .eq('creator_id', creatorId)
    .eq('status', 'completed')
    .eq('is_deleted', false);

  if (error) {
    throw new Error(`Failed to fetch creator videos: ${error.message}`);
  }

  const videoIds = videos?.map((v: any) => v.id) || [];

  if (videoIds.length === 0) {
    logger.warn('No videos found for creator', { creatorId });
    return [];
  }

  logger.debug('Searching creator content', { creatorId, videoCount: videoIds.length });

  return enhancedSearch(query, {
    ...options,
    filter_video_ids: videoIds,
  });
}

/**
 * Invalidate cache for a specific video (call when video is updated)
 */
export async function invalidateCacheForVideo(videoId: string): Promise<void> {
  try {
    // Get all cache keys and delete those containing this video ID
    const pattern = `rag:search:*:*${videoId}*:*`;
    const keys = await kv.keys(pattern);

    if (keys.length > 0) {
      await Promise.all(keys.map(key => kv.del(key)));
      logger.info('Invalidated cache entries for video', { videoId, count: keys.length });
    }
  } catch (error) {
    logger.warn('Cache invalidation failed', { error, videoId });
  }
}

/**
 * Invalidate all search caches
 */
export async function invalidateAllSearchCache(): Promise<void> {
  try {
    const pattern = 'rag:search:*';
    const keys = await kv.keys(pattern);

    if (keys.length > 0) {
      await Promise.all(keys.map(key => kv.del(key)));
      logger.info('Invalidated all search cache entries', { count: keys.length });
    }
  } catch (error) {
    logger.warn('Cache invalidation failed', { error });
  }
}

/**
 * Invalidate cache for all videos owned by a creator
 * Call when a creator's videos are updated/deleted
 */
export async function invalidateCacheForCreator(creatorId: string): Promise<void> {
  try {
    // Get all video IDs for this creator
    const supabase = getServiceSupabase();
    const { data: videos, error } = await supabase
      .from('videos')
      .select('id')
      .eq('creator_id', creatorId);

    if (error) {
      logger.warn('Failed to fetch creator videos for cache invalidation', { error, creatorId });
      return;
    }

    const videoIds = videos?.map((v: any) => v.id) || [];

    if (videoIds.length === 0) {
      logger.debug('No videos found for creator cache invalidation', { creatorId });
      return;
    }

    // Invalidate cache for each video
    let totalInvalidated = 0;
    for (const videoId of videoIds) {
      const pattern = `rag:search:*:*${videoId}*:*`;
      const keys = await kv.keys(pattern);
      if (keys.length > 0) {
        await Promise.all(keys.map(key => kv.del(key)));
        totalInvalidated += keys.length;
      }
    }

    logger.info('Invalidated cache entries for creator', {
      creatorId,
      videoCount: videoIds.length,
      cacheEntriesInvalidated: totalInvalidated
    });
  } catch (error) {
    logger.warn('Creator cache invalidation failed', { error, creatorId });
  }
}

/**
 * Get search performance metrics
 */
export async function getSearchMetrics(): Promise<{
  cache_hits: number;
  cache_misses: number;
  cache_hit_rate: number;
  total_searches: number;
}> {
  try {
    const hits = (await kv.get<number>('rag:metrics:cache_hits')) || 0;
    const misses = (await kv.get<number>('rag:metrics:cache_misses')) || 0;
    const total = hits + misses;

    return {
      cache_hits: hits,
      cache_misses: misses,
      cache_hit_rate: total > 0 ? hits / total : 0,
      total_searches: total,
    };
  } catch (error) {
    logger.warn('Failed to get search metrics', { error });
    return {
      cache_hits: 0,
      cache_misses: 0,
      cache_hit_rate: 0,
      total_searches: 0,
    };
  }
}
