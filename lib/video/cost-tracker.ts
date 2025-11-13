/**
 * Cost tracking utilities for video processing
 * Tracks transcription, embedding, and AI chat costs
 */

import { createClient } from '@supabase/supabase-js';

export interface CostTrackingData {
  creatorId: string;
  date?: string; // YYYY-MM-DD, defaults to today
  transcriptionMinutes?: number;
  transcriptionCost?: number;
  embeddingTokens?: number;
  embeddingCost?: number;
  chatTokens?: number;
  chatCost?: number;
}

export interface UsageMetrics {
  date: string;
  transcriptionMinutes: number;
  aiCreditsUsed: number;
  totalCost: number;
  metadata: {
    transcriptionCost?: number;
    embeddingCost?: number;
    chatCost?: number;
  };
}

// Pricing constants (as of 2024)
export const PRICING = {
  WHISPER_PER_MINUTE: 0.006, // $0.006 per minute
  EMBEDDINGS_PER_1K_TOKENS: 0.0001, // $0.0001 per 1K tokens (ada-002)
  CLAUDE_HAIKU_INPUT_PER_1M_TOKENS: 0.25, // $0.25 per 1M input tokens
  CLAUDE_HAIKU_OUTPUT_PER_1M_TOKENS: 1.25, // $1.25 per 1M output tokens
} as const;

/**
 * Initialize Supabase client with service role key
 */
function getSupabaseClient() {
  const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'];
  const supabaseServiceKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase credentials');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Track transcription costs
 */
export async function trackTranscriptionCost(
  data: CostTrackingData,
): Promise<void> {
  const supabase = getSupabaseClient();
  const date = data.date || new Date().toISOString().split('T')[0];

  const { error } = await supabase.rpc('increment_usage_metrics', {
    p_creator_id: data.creatorId,
    p_date: date,
    p_transcription_minutes: data.transcriptionMinutes || 0,
    p_metadata: {
      transcription_cost: data.transcriptionCost || 0,
    },
  });

  if (error) {
    console.error('[Cost Tracking] Failed to track transcription cost:', error);
    throw error;
  }
}

/**
 * Track embedding costs
 */
export async function trackEmbeddingCost(
  data: CostTrackingData,
): Promise<void> {
  const supabase = getSupabaseClient();
  const date = data.date || new Date().toISOString().split('T')[0];

  const { error } = await supabase.rpc('increment_usage_metrics', {
    p_creator_id: data.creatorId,
    p_date: date,
    p_ai_credits_used: Math.ceil((data.embeddingTokens || 0) / 1000),
    p_metadata: {
      embedding_cost: data.embeddingCost || 0,
      embedding_tokens: data.embeddingTokens || 0,
    },
  });

  if (error) {
    console.error('[Cost Tracking] Failed to track embedding cost:', error);
    throw error;
  }
}

/**
 * Track AI chat costs
 */
export async function trackChatCost(data: CostTrackingData): Promise<void> {
  const supabase = getSupabaseClient();
  const date = data.date || new Date().toISOString().split('T')[0];

  const { error } = await supabase.rpc('increment_usage_metrics', {
    p_creator_id: data.creatorId,
    p_date: date,
    p_ai_credits_used: Math.ceil((data.chatTokens || 0) / 1000),
    p_chat_messages_sent: 1,
    p_metadata: {
      chat_cost: data.chatCost || 0,
      chat_tokens: data.chatTokens || 0,
    },
  });

  if (error) {
    console.error('[Cost Tracking] Failed to track chat cost:', error);
    throw error;
  }
}

/**
 * Get usage metrics for a creator
 */
export async function getUsageMetrics(
  creatorId: string,
  startDate?: string,
  endDate?: string,
): Promise<UsageMetrics[]> {
  const supabase = getSupabaseClient();

  let query = supabase
    .from('usage_metrics')
    .select('*')
    .eq('creator_id', creatorId)
    .order('date', { ascending: false });

  if (startDate) {
    query = query.gte('date', startDate);
  }

  if (endDate) {
    query = query.lte('date', endDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[Cost Tracking] Failed to get usage metrics:', error);
    throw error;
  }

  return data.map((row) => ({
    date: row.date,
    transcriptionMinutes: row.transcription_minutes || 0,
    aiCreditsUsed: row.ai_credits_used || 0,
    totalCost: calculateTotalCost(row),
    metadata: row.metadata || {},
  }));
}

/**
 * Calculate total cost from usage metrics row
 */
function calculateTotalCost(row: {
  transcription_minutes?: number;
  metadata?: {
    transcription_cost?: number;
    embedding_cost?: number;
    chat_cost?: number;
  };
}): number {
  const transcriptionCost = row.metadata?.transcription_cost || 0;
  const embeddingCost = row.metadata?.embedding_cost || 0;
  const chatCost = row.metadata?.chat_cost || 0;

  return Number((transcriptionCost + embeddingCost + chatCost).toFixed(4));
}

/**
 * Calculate transcription cost
 */
export function calculateTranscriptionCost(durationMinutes: number): number {
  return Number((durationMinutes * PRICING.WHISPER_PER_MINUTE).toFixed(4));
}

/**
 * Calculate embedding cost
 */
export function calculateEmbeddingCost(tokenCount: number): number {
  return Number(
    ((tokenCount / 1000) * PRICING.EMBEDDINGS_PER_1K_TOKENS).toFixed(6),
  );
}

/**
 * Calculate Claude Haiku chat cost
 */
export function calculateChatCost(
  inputTokens: number,
  outputTokens: number,
): number {
  const inputCost =
    (inputTokens / 1_000_000) * PRICING.CLAUDE_HAIKU_INPUT_PER_1M_TOKENS;
  const outputCost =
    (outputTokens / 1_000_000) * PRICING.CLAUDE_HAIKU_OUTPUT_PER_1M_TOKENS;

  return Number((inputCost + outputCost).toFixed(6));
}

/**
 * Check if creator is within usage limits
 */
export async function checkUsageLimits(
  creatorId: string,
  tier: 'basic' | 'pro' | 'enterprise',
): Promise<{
  withinLimits: boolean;
  usage: {
    transcriptionMinutes: number;
    aiCreditsUsed: number;
    storageUsedBytes: number;
  };
  limits: {
    transcriptionMinutes: number;
    aiCreditsUsed: number;
    storageBytes: number;
  };
}> {
  const supabase = getSupabaseClient();

  // Get current month's usage
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('usage_metrics')
    .select('*')
    .eq('creator_id', creatorId)
    .gte('date', startOfMonth.toISOString().split('T')[0]);

  if (error) {
    console.error('[Cost Tracking] Failed to check usage limits:', error);
    throw error;
  }

  // Aggregate usage
  const usage = data.reduce(
    (acc, row) => ({
      transcriptionMinutes: acc.transcriptionMinutes + (row.transcription_minutes || 0),
      aiCreditsUsed: acc.aiCreditsUsed + (row.ai_credits_used || 0),
      storageUsedBytes: Math.max(acc.storageUsedBytes, row.storage_used_bytes || 0),
    }),
    { transcriptionMinutes: 0, aiCreditsUsed: 0, storageUsedBytes: 0 },
  );

  // Define tier limits
  const tierLimits = {
    basic: {
      transcriptionMinutes: 60, // 1 hour/month
      aiCreditsUsed: 10000,
      storageBytes: 1 * 1024 * 1024 * 1024, // 1 GB
    },
    pro: {
      transcriptionMinutes: 600, // 10 hours/month
      aiCreditsUsed: 100000,
      storageBytes: 10 * 1024 * 1024 * 1024, // 10 GB
    },
    enterprise: {
      transcriptionMinutes: 6000, // 100 hours/month
      aiCreditsUsed: 1000000,
      storageBytes: 100 * 1024 * 1024 * 1024, // 100 GB
    },
  };

  const limits = tierLimits[tier];

  return {
    withinLimits:
      usage.transcriptionMinutes <= limits.transcriptionMinutes &&
      usage.aiCreditsUsed <= limits.aiCreditsUsed &&
      usage.storageUsedBytes <= limits.storageBytes,
    usage,
    limits,
  };
}
