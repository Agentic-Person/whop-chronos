/**
 * AI Cost Tracking
 *
 * Track Claude API costs per message and aggregate monthly.
 * - Store costs in database
 * - Calculate per-creator usage
 * - Alert on tier limits
 * - Generate cost reports
 */

import { createClient } from '@/lib/db/client';
import { calculateCost } from './config';

export interface CostEntry {
  creator_id: string;
  date: string; // YYYY-MM-DD
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  model: string;
  message_count: number;
}

export interface MonthlyUsage {
  creator_id: string;
  month: string; // YYYY-MM
  total_messages: number;
  total_input_tokens: number;
  total_output_tokens: number;
  total_cost_usd: number;
  average_cost_per_message: number;
}

export interface TierLimits {
  basic: {
    monthly_messages: number;
    monthly_cost_limit: number;
  };
  pro: {
    monthly_messages: number;
    monthly_cost_limit: number;
  };
  enterprise: {
    monthly_messages: number;
    monthly_cost_limit: number;
  };
}

// Define tier limits
export const TIER_LIMITS: TierLimits = {
  basic: {
    monthly_messages: 1000,
    monthly_cost_limit: 10.0, // $10/month
  },
  pro: {
    monthly_messages: 5000,
    monthly_cost_limit: 50.0, // $50/month
  },
  enterprise: {
    monthly_messages: -1, // Unlimited
    monthly_cost_limit: -1, // Unlimited
  },
};

/**
 * Track a chat message cost
 */
export async function trackMessageCost(
  creatorId: string,
  inputTokens: number,
  outputTokens: number,
  model: string
): Promise<void> {
  const supabase = createClient();
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const cost = calculateCost(inputTokens, outputTokens, model);

  try {
    // Check if entry exists for today
    const { data: existing } = await supabase
      .from('usage_metrics')
      .select('*')
      .eq('creator_id', creatorId)
      .eq('date', today)
      .single();

    if (existing) {
      // Update existing entry
      await supabase
        .from('usage_metrics')
        .update({
          ai_credits_used: existing.ai_credits_used + 1,
          chat_messages_sent: existing.chat_messages_sent + 1,
          metadata: {
            ...existing.metadata,
            total_input_tokens: (existing.metadata?.total_input_tokens || 0) + inputTokens,
            total_output_tokens: (existing.metadata?.total_output_tokens || 0) + outputTokens,
            total_ai_cost_usd: (existing.metadata?.total_ai_cost_usd || 0) + cost,
          },
        })
        .eq('creator_id', creatorId)
        .eq('date', today);
    } else {
      // Create new entry
      await supabase
        .from('usage_metrics')
        .insert({
          creator_id: creatorId,
          date: today,
          ai_credits_used: 1,
          chat_messages_sent: 1,
          metadata: {
            total_input_tokens: inputTokens,
            total_output_tokens: outputTokens,
            total_ai_cost_usd: cost,
            model,
          },
        });
    }

    console.log(
      `Tracked cost for creator ${creatorId}: $${cost.toFixed(4)} (${inputTokens}+${outputTokens} tokens)`
    );
  } catch (error) {
    console.error('Failed to track message cost:', error);
    // Don't throw - cost tracking failure shouldn't break the app
  }
}

/**
 * Get creator's usage for current month
 */
export async function getMonthlyUsage(
  creatorId: string,
  month?: string // YYYY-MM, defaults to current month
): Promise<MonthlyUsage> {
  const supabase = createClient();
  const targetMonth = month || new Date().toISOString().slice(0, 7); // YYYY-MM

  const { data, error } = await supabase
    .from('usage_metrics')
    .select('*')
    .eq('creator_id', creatorId)
    .gte('date', `${targetMonth}-01`)
    .lt('date', `${getNextMonth(targetMonth)}-01`);

  if (error) {
    throw new Error(`Failed to get monthly usage: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return {
      creator_id: creatorId,
      month: targetMonth,
      total_messages: 0,
      total_input_tokens: 0,
      total_output_tokens: 0,
      total_cost_usd: 0,
      average_cost_per_message: 0,
    };
  }

  // Aggregate data
  const totals = data.reduce(
    (acc, day) => {
      acc.total_messages += day.chat_messages_sent;
      acc.total_input_tokens += day.metadata?.total_input_tokens || 0;
      acc.total_output_tokens += day.metadata?.total_output_tokens || 0;
      acc.total_cost_usd += day.metadata?.total_ai_cost_usd || 0;
      return acc;
    },
    {
      total_messages: 0,
      total_input_tokens: 0,
      total_output_tokens: 0,
      total_cost_usd: 0,
    }
  );

  return {
    creator_id: creatorId,
    month: targetMonth,
    ...totals,
    average_cost_per_message:
      totals.total_messages > 0
        ? totals.total_cost_usd / totals.total_messages
        : 0,
  };
}

/**
 * Check if creator is within tier limits
 */
export async function checkTierLimits(
  creatorId: string,
  tier: 'basic' | 'pro' | 'enterprise'
): Promise<{
  withinLimits: boolean;
  usage: MonthlyUsage;
  limits: { monthly_messages: number; monthly_cost_limit: number };
  warningLevel: 'none' | 'warning' | 'critical' | 'exceeded';
}> {
  const usage = await getMonthlyUsage(creatorId);
  const limits = TIER_LIMITS[tier];

  // Enterprise has unlimited usage
  if (tier === 'enterprise') {
    return {
      withinLimits: true,
      usage,
      limits,
      warningLevel: 'none',
    };
  }

  // Check if limits exceeded
  const messagesExceeded = usage.total_messages >= limits.monthly_messages;
  const costExceeded = usage.total_cost_usd >= limits.monthly_cost_limit;

  const withinLimits = !messagesExceeded && !costExceeded;

  // Determine warning level
  let warningLevel: 'none' | 'warning' | 'critical' | 'exceeded' = 'none';

  if (messagesExceeded || costExceeded) {
    warningLevel = 'exceeded';
  } else {
    const messageUsagePercent = usage.total_messages / limits.monthly_messages;
    const costUsagePercent = usage.total_cost_usd / limits.monthly_cost_limit;
    const maxUsagePercent = Math.max(messageUsagePercent, costUsagePercent);

    if (maxUsagePercent >= 0.9) {
      warningLevel = 'critical';
    } else if (maxUsagePercent >= 0.75) {
      warningLevel = 'warning';
    }
  }

  return {
    withinLimits,
    usage,
    limits,
    warningLevel,
  };
}

/**
 * Get cost trend over time
 */
export async function getCostTrend(
  creatorId: string,
  days = 30
): Promise<Array<{ date: string; cost: number; messages: number }>> {
  const supabase = createClient();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('usage_metrics')
    .select('date, chat_messages_sent, metadata')
    .eq('creator_id', creatorId)
    .gte('date', startDate.toISOString().split('T')[0])
    .order('date', { ascending: true });

  if (error) {
    throw new Error(`Failed to get cost trend: ${error.message}`);
  }

  return (data || []).map(day => ({
    date: day.date,
    cost: day.metadata?.total_ai_cost_usd || 0,
    messages: day.chat_messages_sent,
  }));
}

/**
 * Get top spending creators
 */
export async function getTopSpenders(
  limit = 10,
  month?: string
): Promise<Array<{
  creator_id: string;
  total_cost_usd: number;
  total_messages: number;
  average_cost_per_message: number;
}>> {
  const supabase = createClient();
  const targetMonth = month || new Date().toISOString().slice(0, 7);

  const { data, error } = await supabase
    .from('usage_metrics')
    .select('creator_id, chat_messages_sent, metadata')
    .gte('date', `${targetMonth}-01`)
    .lt('date', `${getNextMonth(targetMonth)}-01`);

  if (error) {
    throw new Error(`Failed to get top spenders: ${error.message}`);
  }

  // Aggregate by creator
  const creatorMap = new Map<
    string,
    { total_cost_usd: number; total_messages: number }
  >();

  for (const row of data || []) {
    const existing = creatorMap.get(row.creator_id) || {
      total_cost_usd: 0,
      total_messages: 0,
    };

    creatorMap.set(row.creator_id, {
      total_cost_usd: existing.total_cost_usd + (row.metadata?.total_ai_cost_usd || 0),
      total_messages: existing.total_messages + row.chat_messages_sent,
    });
  }

  // Convert to array and sort
  const spenders = Array.from(creatorMap.entries())
    .map(([creator_id, stats]) => ({
      creator_id,
      total_cost_usd: stats.total_cost_usd,
      total_messages: stats.total_messages,
      average_cost_per_message:
        stats.total_messages > 0
          ? stats.total_cost_usd / stats.total_messages
          : 0,
    }))
    .sort((a, b) => b.total_cost_usd - a.total_cost_usd)
    .slice(0, limit);

  return spenders;
}

/**
 * Estimate monthly cost based on current usage
 */
export async function estimateMonthlyUsage(
  creatorId: string
): Promise<{
  current_cost: number;
  current_messages: number;
  estimated_monthly_cost: number;
  estimated_monthly_messages: number;
  days_elapsed: number;
  days_remaining: number;
}> {
  const usage = await getMonthlyUsage(creatorId);
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysElapsed = now.getDate();
  const daysRemaining = daysInMonth - daysElapsed;

  const dailyAvgCost = usage.total_cost_usd / daysElapsed;
  const dailyAvgMessages = usage.total_messages / daysElapsed;

  return {
    current_cost: usage.total_cost_usd,
    current_messages: usage.total_messages,
    estimated_monthly_cost: dailyAvgCost * daysInMonth,
    estimated_monthly_messages: Math.round(dailyAvgMessages * daysInMonth),
    days_elapsed: daysElapsed,
    days_remaining: daysRemaining,
  };
}

/**
 * Helper: Get next month string
 */
function getNextMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-').map(Number);
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  return `${nextYear}-${nextMonth.toString().padStart(2, '0')}`;
}

/**
 * Reset monthly usage (for testing)
 */
export async function resetMonthlyUsage(creatorId: string): Promise<void> {
  const supabase = createClient();
  const currentMonth = new Date().toISOString().slice(0, 7);

  await supabase
    .from('usage_metrics')
    .delete()
    .eq('creator_id', creatorId)
    .gte('date', `${currentMonth}-01`);

  console.log(`Reset monthly usage for creator ${creatorId}`);
}
