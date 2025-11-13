/**
 * Advanced Ranking Algorithm for RAG Search Results
 *
 * Combines multiple signals to rank search results:
 * 1. Vector similarity (primary signal)
 * 2. Recency boost (newer videos ranked higher)
 * 3. Popularity boost (frequently referenced videos)
 * 4. Student viewing history (personalization)
 * 5. Deduplication (combine similar chunks from same video)
 */

import { getServiceSupabase } from '@/lib/db/client';
import type { VectorSearchResult } from '@/lib/video/vector-search';
import type { EnhancedSearchResult } from './search';

export interface RankingOptions {
  // Ranking factors (all optional, defaults to true)
  enable_recency_boost?: boolean; // Default: true
  enable_popularity_boost?: boolean; // Default: true
  student_id?: string; // For personalization based on viewing history

  // Weights for ranking factors (0-1 scale)
  similarity_weight?: number; // Default: 0.6
  recency_weight?: number; // Default: 0.15
  popularity_weight?: number; // Default: 0.15
  view_history_weight?: number; // Default: 0.1

  // Deduplication
  deduplicate?: boolean; // Default: true
  deduplicate_similarity_threshold?: number; // Default: 0.95 (very similar chunks)
}

const DEFAULT_OPTIONS: Required<Omit<RankingOptions, 'student_id'>> = {
  enable_recency_boost: true,
  enable_popularity_boost: true,
  similarity_weight: 0.6,
  recency_weight: 0.15,
  popularity_weight: 0.15,
  view_history_weight: 0.1,
  deduplicate: true,
  deduplicate_similarity_threshold: 0.95,
};

/**
 * Calculate recency score based on video creation date
 * Newer videos get higher scores (exponential decay over 90 days)
 */
function calculateRecencyScore(createdAt: string | undefined): number {
  if (!createdAt) return 0;

  const now = Date.now();
  const created = new Date(createdAt).getTime();
  const ageInDays = (now - created) / (1000 * 60 * 60 * 24);

  // Exponential decay: score = e^(-age/90)
  // Videos older than 90 days have very low recency scores
  const decayRate = 90; // days
  const score = Math.exp(-ageInDays / decayRate);

  return Math.max(0, Math.min(1, score));
}

/**
 * Calculate popularity score based on video analytics
 */
async function calculatePopularityScore(videoId: string): Promise<number> {
  const supabase = getServiceSupabase();

  // Get last 30 days of analytics
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data, error } = await supabase
    .from('video_analytics')
    .select('views, ai_interactions, completion_rate')
    .eq('video_id', videoId)
    .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
    .order('date', { ascending: false });

  if (error || !data || data.length === 0) {
    return 0;
  }

  // Aggregate metrics
  const totalViews = data.reduce((sum: number, d: any) => sum + (d.views || 0), 0);
  const totalInteractions = data.reduce((sum: number, d: any) => sum + (d.ai_interactions || 0), 0);
  const avgCompletionRate = data.reduce((sum: number, d: any) => sum + (d.completion_rate || 0), 0) / data.length;

  // Normalize scores (assuming max 1000 views, 500 interactions)
  const viewScore = Math.min(totalViews / 1000, 1);
  const interactionScore = Math.min(totalInteractions / 500, 1);
  const completionScore = (avgCompletionRate || 0) / 100;

  // Weighted combination
  const popularityScore = (viewScore * 0.3) + (interactionScore * 0.4) + (completionScore * 0.3);

  return Math.max(0, Math.min(1, popularityScore));
}

/**
 * Calculate viewing history score for personalization
 */
async function calculateViewHistoryScore(
  videoId: string,
  studentId: string
): Promise<number> {
  const supabase = getServiceSupabase();

  // Check if student has interacted with this video via chat
  const { data, error } = await supabase
    .from('chat_messages')
    .select('id, created_at')
    .eq('session_id', studentId)
    .contains('video_references', [{ video_id: videoId }])
    .order('created_at', { ascending: false })
    .limit(10);

  if (error || !data || data.length === 0) {
    return 0;
  }

  // Recent interactions get higher scores
  const now = Date.now();
  let score = 0;

  for (const message of (data as any)) {
    const messageAge = (now - new Date(message.created_at).getTime()) / (1000 * 60 * 60 * 24);

    // Exponential decay over 7 days
    const messageScore = Math.exp(-messageAge / 7);
    score += messageScore;
  }

  // Normalize (cap at 1.0)
  return Math.min(score / 5, 1);
}

/**
 * Deduplicate similar chunks from the same video
 * Keeps the highest-scoring chunk and merges context
 */
function deduplicateResults(
  results: EnhancedSearchResult[],
  threshold: number
): EnhancedSearchResult[] {
  const deduplicated: EnhancedSearchResult[] = [];
  const seenVideoChunks = new Map<string, EnhancedSearchResult>();

  for (const result of results) {
    const videoKey = result.video_id;
    const existingChunk = seenVideoChunks.get(videoKey);

    if (!existingChunk) {
      // First chunk from this video
      seenVideoChunks.set(videoKey, result);
      deduplicated.push(result);
      continue;
    }

    // Check if chunks are very similar (likely duplicate content)
    const isSimilar = result.similarity > threshold;

    if (isSimilar) {
      // Keep the higher-scoring chunk
      if (result.rank_score > existingChunk.rank_score) {
        // Replace existing chunk
        const index = deduplicated.indexOf(existingChunk);
        deduplicated[index] = result;
        seenVideoChunks.set(videoKey, result);
      }
      // Otherwise, skip this chunk (duplicate)
    } else {
      // Different enough to keep both
      deduplicated.push(result);
    }
  }

  return deduplicated;
}

/**
 * Rank search results using multi-factor algorithm
 *
 * @param results - Raw vector search results
 * @param options - Ranking configuration
 * @returns Ranked results with scoring breakdown
 */
export async function rankSearchResults(
  results: VectorSearchResult[],
  options: RankingOptions = {}
): Promise<EnhancedSearchResult[]> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  if (results.length === 0) {
    return [];
  }

  console.log(`Ranking ${results.length} search results...`);

  // Fetch video metadata for ranking (created_at dates)
  const supabase = getServiceSupabase();
  const videoIds = [...new Set(results.map(r => r.video_id))];

  const { data: videos, error: videoError } = await supabase
    .from('videos')
    .select('id, created_at')
    .in('id', videoIds);

  if (videoError) {
    console.warn('Failed to fetch video metadata for ranking:', videoError);
  }

  const videoMetadata = new Map(
    videos?.map((v: any) => [v.id, { created_at: v.created_at }]) || []
  );

  // Fetch popularity scores in parallel
  const popularityPromises = opts.enable_popularity_boost
    ? videoIds.map(async (id) => [id, await calculatePopularityScore(id)] as const)
    : [];

  const popularityScores = new Map(
    await Promise.all(popularityPromises)
  );

  // Fetch viewing history scores if student_id provided
  const viewHistoryPromises = opts.student_id
    ? videoIds.map(async (id) => [id, await calculateViewHistoryScore(id, opts.student_id!)] as const)
    : [];

  const viewHistoryScores = new Map(
    await Promise.all(viewHistoryPromises)
  );

  // Calculate combined rank score for each result
  const rankedResults: EnhancedSearchResult[] = results.map(result => {
    // 1. Similarity score (already 0-1)
    const similarityScore = result.similarity;

    // 2. Recency score
    const recencyScore = opts.enable_recency_boost
      ? calculateRecencyScore(videoMetadata.get(result.video_id)?.created_at)
      : 0;

    // 3. Popularity score
    const popularityScore = opts.enable_popularity_boost
      ? (popularityScores.get(result.video_id) || 0)
      : 0;

    // 4. View history score
    const viewHistoryScore = opts.student_id
      ? (viewHistoryScores.get(result.video_id) || 0)
      : 0;

    // Combine scores with weights
    const rankScore =
      (similarityScore * opts.similarity_weight) +
      (recencyScore * opts.recency_weight) +
      (popularityScore * opts.popularity_weight) +
      (viewHistoryScore * opts.view_history_weight);

    return {
      ...result,
      rank_score: rankScore,
      rank_breakdown: {
        similarity_score: similarityScore,
        recency_boost: recencyScore,
        popularity_boost: popularityScore,
        view_history_boost: viewHistoryScore,
      },
    };
  });

  // Sort by rank score (descending)
  rankedResults.sort((a, b) => b.rank_score - a.rank_score);

  console.log('Top 3 ranked results:');
  rankedResults.slice(0, 3).forEach((r, i) => {
    console.log(`  ${i + 1}. Score: ${r.rank_score.toFixed(3)} (sim: ${r.rank_breakdown?.similarity_score.toFixed(3)})`);
  });

  // Deduplicate if enabled
  if (opts.deduplicate) {
    const deduplicated = deduplicateResults(
      rankedResults,
      opts.deduplicate_similarity_threshold
    );

    if (deduplicated.length < rankedResults.length) {
      console.log(`Deduplicated ${rankedResults.length - deduplicated.length} similar chunks`);
    }

    return deduplicated;
  }

  return rankedResults;
}

/**
 * Boost results from a specific video (useful for follow-up questions)
 */
export function boostVideoInResults(
  results: EnhancedSearchResult[],
  videoId: string,
  boostFactor = 1.2
): EnhancedSearchResult[] {
  return results.map(result => {
    if (result.video_id === videoId) {
      return {
        ...result,
        rank_score: result.rank_score * boostFactor,
      };
    }
    return result;
  }).sort((a, b) => b.rank_score - a.rank_score);
}

/**
 * Filter results by minimum rank score threshold
 */
export function filterByRankScore(
  results: EnhancedSearchResult[],
  minScore: number
): EnhancedSearchResult[] {
  return results.filter(r => r.rank_score >= minScore);
}

/**
 * Get diversity in results (ensure multiple videos represented)
 */
export function ensureResultDiversity(
  results: EnhancedSearchResult[],
  maxPerVideo = 2
): EnhancedSearchResult[] {
  const videoChunkCounts = new Map<string, number>();
  const diverse: EnhancedSearchResult[] = [];

  for (const result of results) {
    const count = videoChunkCounts.get(result.video_id) || 0;

    if (count < maxPerVideo) {
      diverse.push(result);
      videoChunkCounts.set(result.video_id, count + 1);
    }
  }

  return diverse;
}
