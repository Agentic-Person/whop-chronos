/**
 * AI Cost Calculator
 *
 * Calculate costs for:
 * - Claude API usage (input + output tokens)
 * - OpenAI embeddings (for query embeddings)
 * - Per-chat, per-student, and aggregate costs
 * - Monthly cost projections
 * - Cost optimization suggestions
 */

import type { CostBreakdown, CostCalculatorOptions } from './types';

// Pricing as of January 2025 (in USD per token)
// Claude 3.5 Haiku pricing
const CLAUDE_HAIKU_PRICING = {
  input: 1.0 / 1_000_000, // $1 per million input tokens
  output: 5.0 / 1_000_000, // $5 per million output tokens
  cache_write: 1.25 / 1_000_000, // $1.25 per million cache write tokens
  cache_read: 0.1 / 1_000_000, // $0.10 per million cache read tokens
} as const;

// Claude 3.5 Sonnet pricing (higher tier)
const CLAUDE_SONNET_PRICING = {
  input: 3.0 / 1_000_000, // $3 per million input tokens
  output: 15.0 / 1_000_000, // $15 per million output tokens
  cache_write: 3.75 / 1_000_000,
  cache_read: 0.3 / 1_000_000,
} as const;

// OpenAI embedding pricing
const OPENAI_EMBEDDING_PRICING = {
  'text-embedding-3-small': 0.02 / 1_000_000, // $0.02 per million tokens
  'text-embedding-3-large': 0.13 / 1_000_000, // $0.13 per million tokens
  'text-embedding-ada-002': 0.1 / 1_000_000, // $0.10 per million tokens
} as const;

// Default models
const DEFAULT_CLAUDE_MODEL = 'claude-3-5-haiku-20241022';
const DEFAULT_EMBEDDING_MODEL = 'text-embedding-3-small';

// Average tokens per embedding query (estimated)
const AVG_TOKENS_PER_EMBEDDING = 50;

/**
 * Calculate cost for a single chat interaction
 */
export function calculateChatCost(
  inputTokens: number,
  outputTokens: number,
  model: string = DEFAULT_CLAUDE_MODEL,
): CostBreakdown {
  const pricing = model.includes('sonnet')
    ? CLAUDE_SONNET_PRICING
    : CLAUDE_HAIKU_PRICING;

  const inputCost = inputTokens * pricing.input;
  const outputCost = outputTokens * pricing.output;
  const totalCost = inputCost + outputCost;

  return {
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    embedding_queries: 0,
    total_tokens: inputTokens + outputTokens,
    input_cost: inputCost,
    output_cost: outputCost,
    embedding_cost: 0,
    total_cost: totalCost,
  };
}

/**
 * Calculate cost for embedding queries
 */
export function calculateEmbeddingCost(
  queryCount: number,
  model: string = DEFAULT_EMBEDDING_MODEL,
): number {
  const pricing =
    OPENAI_EMBEDDING_PRICING[
      model as keyof typeof OPENAI_EMBEDDING_PRICING
    ] || OPENAI_EMBEDDING_PRICING['text-embedding-3-small'];

  const totalTokens = queryCount * AVG_TOKENS_PER_EMBEDDING;
  return totalTokens * pricing;
}

/**
 * Calculate complete cost breakdown including embeddings
 */
export function calculateCompleteCost(
  options: CostCalculatorOptions,
): CostBreakdown {
  const {
    model = DEFAULT_CLAUDE_MODEL,
    input_tokens = 0,
    output_tokens = 0,
    embedding_queries = 1, // Every chat query needs 1 embedding
  } = options;

  const chatCost = calculateChatCost(input_tokens, output_tokens, model);
  const embeddingCost = calculateEmbeddingCost(embedding_queries);

  return {
    ...chatCost,
    embedding_queries,
    embedding_cost: embeddingCost,
    total_cost: chatCost.total_cost + embeddingCost,
  };
}

/**
 * Estimate cost for a session based on message count
 */
export function estimateSessionCost(
  messageCount: number,
  avgInputTokens = 500,
  avgOutputTokens = 800,
  model: string = DEFAULT_CLAUDE_MODEL,
): CostBreakdown {
  const userMessages = Math.ceil(messageCount / 2);
  const totalInputTokens = userMessages * avgInputTokens;
  const totalOutputTokens = userMessages * avgOutputTokens;

  return calculateCompleteCost({
    model,
    input_tokens: totalInputTokens,
    output_tokens: totalOutputTokens,
    embedding_queries: userMessages,
  });
}

/**
 * Calculate monthly cost projection
 */
export interface MonthlyCostProjection {
  current_daily_cost: number;
  projected_monthly_cost: number;
  days_analyzed: number;
  total_messages: number;
  total_sessions: number;
  avg_cost_per_message: number;
  avg_cost_per_session: number;
}

export function projectMonthlyCost(
  dailyCosts: number[],
  totalMessages: number,
  totalSessions: number,
): MonthlyCostProjection {
  const daysAnalyzed = dailyCosts.length;
  const totalCost = dailyCosts.reduce((sum, cost) => sum + cost, 0);
  const avgDailyCost = totalCost / daysAnalyzed;

  return {
    current_daily_cost: avgDailyCost,
    projected_monthly_cost: avgDailyCost * 30,
    days_analyzed: daysAnalyzed,
    total_messages: totalMessages,
    total_sessions: totalSessions,
    avg_cost_per_message: totalMessages > 0 ? totalCost / totalMessages : 0,
    avg_cost_per_session: totalSessions > 0 ? totalCost / totalSessions : 0,
  };
}

/**
 * Get cost optimization suggestions
 */
export interface CostOptimizationSuggestion {
  type: 'model' | 'prompt' | 'caching' | 'embedding' | 'batching';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  potential_savings_percent: number;
}

export function getCostOptimizationSuggestions(
  breakdown: CostBreakdown,
  messageCount: number,
): CostOptimizationSuggestion[] {
  const suggestions: CostOptimizationSuggestion[] = [];

  // High output token usage
  if (breakdown.output_tokens > breakdown.input_tokens * 2) {
    suggestions.push({
      type: 'prompt',
      priority: 'high',
      title: 'Reduce response verbosity',
      description:
        'Output tokens are 2x input tokens. Add prompt instructions for more concise responses.',
      potential_savings_percent: 25,
    });
  }

  // Check if using Sonnet (more expensive)
  const isUsingSonnet = breakdown.output_cost / breakdown.output_tokens > 1e-5;
  if (isUsingSonnet && messageCount < 100) {
    suggestions.push({
      type: 'model',
      priority: 'high',
      title: 'Switch to Claude Haiku for simple queries',
      description:
        'Haiku is 3x cheaper and sufficient for most educational queries. Reserve Sonnet for complex reasoning.',
      potential_savings_percent: 67,
    });
  }

  // Large input context
  if (breakdown.input_tokens > 5000) {
    suggestions.push({
      type: 'caching',
      priority: 'medium',
      title: 'Implement prompt caching',
      description:
        'Use Claude prompt caching for system prompts and video chunks to reduce input token costs by up to 90%.',
      potential_savings_percent: 50,
    });
  }

  // Multiple embedding queries
  if (breakdown.embedding_queries > 3) {
    suggestions.push({
      type: 'embedding',
      priority: 'medium',
      title: 'Optimize vector search',
      description:
        'Consider caching embedding results for repeated queries or using hybrid search.',
      potential_savings_percent: 30,
    });
  }

  // High message volume
  if (messageCount > 50) {
    suggestions.push({
      type: 'batching',
      priority: 'low',
      title: 'Implement session summarization',
      description:
        'For long conversations, periodically summarize and compress chat history to reduce context size.',
      potential_savings_percent: 20,
    });
  }

  return suggestions.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

/**
 * Format cost for display
 */
export function formatCost(cost: number): string {
  if (cost < 0.01) {
    return `$${(cost * 100).toFixed(4)}¢`;
  }
  return `$${cost.toFixed(4)}`;
}

/**
 * Calculate cost per student
 */
export interface StudentCostSummary {
  student_id: string;
  total_messages: number;
  total_sessions: number;
  total_tokens: number;
  total_cost: number;
  avg_cost_per_message: number;
  avg_cost_per_session: number;
  period_days: number;
  daily_avg_cost: number;
}

export function calculateStudentCost(
  sessions: Array<{
    message_count: number;
    total_tokens: number;
    total_cost: number;
  }>,
  studentId: string,
  periodDays: number,
): StudentCostSummary {
  const totalMessages = sessions.reduce((sum, s) => sum + s.message_count, 0);
  const totalTokens = sessions.reduce((sum, s) => sum + s.total_tokens, 0);
  const totalCost = sessions.reduce((sum, s) => sum + s.total_cost, 0);

  return {
    student_id: studentId,
    total_messages: totalMessages,
    total_sessions: sessions.length,
    total_tokens: totalTokens,
    total_cost: totalCost,
    avg_cost_per_message: totalMessages > 0 ? totalCost / totalMessages : 0,
    avg_cost_per_session: sessions.length > 0 ? totalCost / sessions.length : 0,
    period_days: periodDays,
    daily_avg_cost: periodDays > 0 ? totalCost / periodDays : 0,
  };
}

/**
 * Get pricing information
 */
export function getPricingInfo() {
  return {
    claude: {
      haiku: CLAUDE_HAIKU_PRICING,
      sonnet: CLAUDE_SONNET_PRICING,
    },
    openai: {
      embeddings: OPENAI_EMBEDDING_PRICING,
    },
    defaults: {
      model: DEFAULT_CLAUDE_MODEL,
      embedding_model: DEFAULT_EMBEDDING_MODEL,
    },
  };
}
