/**
 * Cost Tracking Middleware
 *
 * Logs all API calls to the usage_metrics table in real-time.
 * Provides functions to track:
 * - Claude API costs (chat)
 * - OpenAI embedding costs
 * - OpenAI Whisper transcription costs
 * - Supabase storage costs
 *
 * All functions atomically update the usage_metrics table via
 * the increment_usage_metrics() PostgreSQL function.
 */

import { getServiceSupabase } from '../db/client';
import { calculateChatCost } from '../rag/cost-calculator';
import type { Database, Json } from '../db/types';
import { logger } from '@/lib/logger';

/**
 * Type for usage_metrics table row
 */
type UsageMetricsRow = Database['public']['Tables']['usage_metrics']['Row'];

/**
 * Type definition for increment_usage_metrics RPC function parameters
 */
interface IncrementUsageMetricsParams {
  p_creator_id: string;
  p_date?: string;
  p_storage_used_bytes?: number;
  p_videos_uploaded?: number;
  p_total_video_duration_seconds?: number;
  p_ai_credits_used?: number;
  p_transcription_minutes?: number;
  p_chat_messages_sent?: number;
  p_active_students?: number;
  p_metadata?: Json;
}

/**
 * OpenAI Whisper pricing (as of January 2025)
 * $0.006 per minute of audio
 */
const WHISPER_PRICE_PER_MINUTE = 0.006;

/**
 * Supabase storage pricing (as of January 2025)
 * $0.021 per GB per month
 * For simplicity, we track total bytes and can calculate monthly cost separately
 */
const STORAGE_PRICE_PER_GB_MONTH = 0.021;

/**
 * Track Claude API chat cost
 *
 * @param creatorId - UUID of the creator
 * @param inputTokens - Number of input tokens used
 * @param outputTokens - Number of output tokens used
 * @param model - Claude model used (defaults to Haiku)
 * @returns The cost amount in USD
 */
export async function trackChatCost(
  creatorId: string,
  inputTokens: number,
  outputTokens: number,
  model = 'claude-3-5-haiku-20241022',
): Promise<number> {
  try {
    // Calculate cost using existing calculator
    const costBreakdown = calculateChatCost(inputTokens, outputTokens, model);

    // Update usage_metrics table
    const supabase = getServiceSupabase();
    const params: IncrementUsageMetricsParams = {
      p_creator_id: creatorId,
      p_date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
      p_ai_credits_used: 1, // Count as 1 API call
      p_chat_messages_sent: 1,
      p_metadata: {
        chat_cost: costBreakdown.total_cost,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        model,
        timestamp: new Date().toISOString(),
      },
    };
    const { error } = await supabase.rpc('increment_usage_metrics', params as never);

    if (error) {
      logger.error('Failed to track chat cost', error, { component: 'cost-tracker', creatorId });
      throw new Error(`Failed to track chat cost: ${error.message}`);
    }

    logger.info('Chat cost tracked', {
      component: 'cost-tracker',
      creatorId,
      cost: costBreakdown.total_cost.toFixed(6),
      action: 'chat'
    });

    return costBreakdown.total_cost;
  } catch (error) {
    logger.error('Error tracking chat cost', error as Error, { component: 'cost-tracker', creatorId });
    throw error;
  }
}

/**
 * Track OpenAI embedding cost
 *
 * @param creatorId - UUID of the creator
 * @param tokens - Number of tokens used for embeddings
 * @param model - OpenAI embedding model used
 * @returns The cost amount in USD
 */
export async function trackEmbeddingCost(
  creatorId: string,
  tokens: number,
  model = 'text-embedding-3-small',
): Promise<number> {
  try {
    // Calculate cost using existing calculator
    // embeddings are typically calculated per query, but we have raw token count
    const embeddingPrices = {
      'text-embedding-3-small': 0.02 / 1_000_000,
      'text-embedding-3-large': 0.13 / 1_000_000,
      'text-embedding-ada-002': 0.1 / 1_000_000,
    };

    const pricePerToken =
      embeddingPrices[model as keyof typeof embeddingPrices] ||
      embeddingPrices['text-embedding-3-small'];

    const totalCost = tokens * pricePerToken;

    // Update usage_metrics table
    const supabase = getServiceSupabase();
    const params: IncrementUsageMetricsParams = {
      p_creator_id: creatorId,
      p_date: new Date().toISOString().split('T')[0],
      p_ai_credits_used: 1, // Count as 1 API call
      p_metadata: {
        embedding_cost: totalCost,
        tokens,
        model,
        timestamp: new Date().toISOString(),
      },
    };
    const { error } = await supabase.rpc('increment_usage_metrics', params as never);

    if (error) {
      logger.error('Failed to track embedding cost', error, { component: 'cost-tracker', creatorId });
      throw new Error(`Failed to track embedding cost: ${error.message}`);
    }

    logger.info('Embedding cost tracked', {
      component: 'cost-tracker',
      creatorId,
      cost: totalCost.toFixed(6),
      tokens,
      action: 'embedding'
    });

    return totalCost;
  } catch (error) {
    logger.error('Error tracking embedding cost', error as Error, { component: 'cost-tracker', creatorId });
    throw error;
  }
}

/**
 * Track OpenAI Whisper transcription cost
 *
 * @param creatorId - UUID of the creator
 * @param durationMinutes - Duration of audio transcribed in minutes
 * @returns The cost amount in USD
 */
export async function trackTranscriptionCost(
  creatorId: string,
  durationMinutes: number,
): Promise<number> {
  try {
    // Calculate cost: $0.006 per minute
    const totalCost = durationMinutes * WHISPER_PRICE_PER_MINUTE;

    // Update usage_metrics table
    const supabase = getServiceSupabase();
    const params: IncrementUsageMetricsParams = {
      p_creator_id: creatorId,
      p_date: new Date().toISOString().split('T')[0],
      p_transcription_minutes: durationMinutes,
      p_metadata: {
        transcription_cost: totalCost,
        duration_minutes: durationMinutes,
        timestamp: new Date().toISOString(),
      },
    };
    const { error } = await supabase.rpc('increment_usage_metrics', params as never);

    if (error) {
      logger.error('Failed to track transcription cost', error, { component: 'cost-tracker', creatorId, durationMinutes });
      throw new Error(`Failed to track transcription cost: ${error.message}`);
    }

    logger.info('Transcription cost tracked', {
      component: 'cost-tracker',
      creatorId,
      cost: totalCost.toFixed(6),
      durationMinutes,
      action: 'transcription'
    });

    return totalCost;
  } catch (error) {
    logger.error('Error tracking transcription cost', error as Error, { component: 'cost-tracker', creatorId, durationMinutes });
    throw error;
  }
}

/**
 * Track Supabase storage usage
 *
 * @param creatorId - UUID of the creator
 * @param bytesUsed - Total bytes used in storage (cumulative)
 * @returns The estimated monthly cost in USD
 */
export async function trackStorageCost(
  creatorId: string,
  bytesUsed: number,
): Promise<number> {
  try {
    // Calculate estimated monthly cost
    // Convert bytes to GB: bytesUsed / (1024^3)
    const gigabytes = bytesUsed / (1024 * 1024 * 1024);
    const monthlyCost = gigabytes * STORAGE_PRICE_PER_GB_MONTH;

    // Update usage_metrics table
    // Note: storage_used_bytes uses GREATEST() in the function, so it stores max value
    const supabase = getServiceSupabase();
    const params: IncrementUsageMetricsParams = {
      p_creator_id: creatorId,
      p_date: new Date().toISOString().split('T')[0],
      p_storage_used_bytes: bytesUsed,
      p_metadata: {
        storage_cost_monthly: monthlyCost,
        storage_gb: gigabytes,
        timestamp: new Date().toISOString(),
      },
    };
    const { error } = await supabase.rpc('increment_usage_metrics', params as never);

    if (error) {
      logger.error('Failed to track storage cost', error, { component: 'cost-tracker', creatorId });
      throw new Error(`Failed to track storage cost: ${error.message}`);
    }

    logger.info('Storage tracked', {
      component: 'cost-tracker',
      creatorId,
      gigabytes: gigabytes.toFixed(2),
      monthlyCost: monthlyCost.toFixed(6),
      action: 'storage'
    });

    return monthlyCost;
  } catch (error) {
    logger.error('Error tracking storage cost', error as Error, { component: 'cost-tracker', creatorId });
    throw error;
  }
}

/**
 * Track video upload event
 *
 * @param creatorId - UUID of the creator
 * @param videoId - UUID of the video
 * @param durationSeconds - Duration of video in seconds
 * @param fileSizeBytes - Size of video file in bytes
 * @returns Combined cost breakdown
 */
export async function trackVideoUpload(
  creatorId: string,
  videoId: string,
  durationSeconds: number,
  fileSizeBytes: number,
): Promise<{
  storage_cost: number;
  video_duration: number;
  file_size_mb: number;
}> {
  try {
    const fileSizeMB = fileSizeBytes / (1024 * 1024);

    // Update usage_metrics with video upload
    const supabase = getServiceSupabase();
    const params: IncrementUsageMetricsParams = {
      p_creator_id: creatorId,
      p_date: new Date().toISOString().split('T')[0],
      p_videos_uploaded: 1,
      p_total_video_duration_seconds: durationSeconds,
      p_storage_used_bytes: fileSizeBytes,
      p_metadata: {
        video_id: videoId,
        duration_seconds: durationSeconds,
        file_size_bytes: fileSizeBytes,
        file_size_mb: fileSizeMB,
        timestamp: new Date().toISOString(),
      },
    };
    const { error } = await supabase.rpc('increment_usage_metrics', params as never);

    if (error) {
      logger.error('Failed to track video upload', error, { component: 'cost-tracker', creatorId, videoId });
      throw new Error(`Failed to track video upload: ${error.message}`);
    }

    // Calculate storage cost
    const storageCost = await trackStorageCost(creatorId, fileSizeBytes);

    logger.info('Video upload tracked', {
      component: 'cost-tracker',
      creatorId,
      videoId,
      fileSizeMB: fileSizeMB.toFixed(2),
      durationMinutes: (durationSeconds / 60).toFixed(2),
      action: 'upload'
    });

    return {
      storage_cost: storageCost,
      video_duration: durationSeconds / 60, // return in minutes
      file_size_mb: fileSizeMB,
    };
  } catch (error) {
    logger.error('Error tracking video upload', error as Error, { component: 'cost-tracker', creatorId, videoId });
    throw error;
  }
}

/**
 * Get current usage metrics for a creator
 *
 * @param creatorId - UUID of the creator
 * @param date - Optional date (defaults to today)
 * @returns Current usage metrics for the day
 */
export async function getCurrentUsage(
  creatorId: string,
  date?: string,
): Promise<{
  storage_used_bytes: number;
  videos_uploaded: number;
  total_video_duration_seconds: number;
  ai_credits_used: number;
  transcription_minutes: number;
  chat_messages_sent: number;
  active_students: number;
  total_cost: number;
} | null> {
  try {
    const targetDate = date || new Date().toISOString().split('T')[0]!;

    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('usage_metrics')
      .select('*')
      .eq('creator_id', creatorId)
      .eq('date', targetDate)
      .maybeSingle();

    if (error) {
      logger.error('Failed to get current usage', error, { component: 'cost-tracker', creatorId, targetDate });
      throw new Error(`Failed to get current usage: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    // Cast to proper type
    const row = data as UsageMetricsRow;

    // Calculate total cost from metadata
    type MetadataType = {
      chat_cost?: number;
      embedding_cost?: number;
      transcription_cost?: number;
      [key: string]: unknown;
    };

    const metadata = (row.metadata as MetadataType) || {};
    const chatCost = Number(metadata.chat_cost || 0);
    const embeddingCost = Number(metadata.embedding_cost || 0);
    const transcriptionCost = Number(metadata.transcription_cost || 0);
    const totalCost = chatCost + embeddingCost + transcriptionCost;

    return {
      storage_used_bytes: row.storage_used_bytes,
      videos_uploaded: row.videos_uploaded,
      total_video_duration_seconds: row.total_video_duration_seconds,
      ai_credits_used: row.ai_credits_used,
      transcription_minutes: Number(row.transcription_minutes),
      chat_messages_sent: row.chat_messages_sent,
      active_students: row.active_students,
      total_cost: totalCost,
    };
  } catch (error) {
    logger.error('Error getting current usage', error as Error, { component: 'cost-tracker', creatorId });
    throw error;
  }
}

/**
 * Cost tracker types
 */
export interface CostTrackingResult {
  cost: number;
  creator_id: string;
  date: string;
  timestamp: string;
}

export interface VideoUploadTrackingResult {
  storage_cost: number;
  video_duration: number;
  file_size_mb: number;
  creator_id: string;
  video_id: string;
}
