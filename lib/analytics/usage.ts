/**
 * Usage Calculation Library
 *
 * Centralized logic for calculating and managing subscription tier usage
 */

import { getServiceSupabase } from '@/lib/db/client';
import type {
  SubscriptionTier,
  TierLimits,
  UsageStat,
  UsageStats,
  StorageBreakdown,
} from '@/components/analytics/usage-types';
import { TIER_LIMITS } from '@/components/analytics/usage-types';

/**
 * Calculate current usage for a creator
 */
export async function calculateCurrentUsage(
  creatorId: string,
  tier: SubscriptionTier,
): Promise<UsageStats> {
  const supabase = getServiceSupabase();

  // Get video count and total storage
  const { data: videos } = await (supabase as any)
    .from('videos')
    .select('id, file_size_bytes')
    .eq('creator_id', creatorId)
    .eq('is_deleted', false);

  const videoCount = videos?.length || 0;
  const totalStorageBytes = videos?.reduce((sum: number, v: any) => sum + (v.file_size_bytes || 0), 0) || 0;
  const totalStorageGB = totalStorageBytes / (1024 * 1024 * 1024);

  // Get AI message count for current month
  const firstOfMonth = new Date();
  firstOfMonth.setDate(1);
  firstOfMonth.setHours(0, 0, 0, 0);

  const { data: messages } = await supabase
    .from('chat_messages')
    .select('id, session:chat_sessions!inner(creator_id)')
    .eq('session.creator_id', creatorId)
    .gte('created_at', firstOfMonth.toISOString());

  const aiMessageCount = messages?.length || 0;

  // Get student count
  const { data: students } = await supabase
    .from('students')
    .select('id')
    .eq('creator_id', creatorId)
    .eq('is_active', true);

  const studentCount = students?.length || 0;

  // Get course count
  const { data: courses } = await supabase
    .from('courses')
    .select('id')
    .eq('creator_id', creatorId)
    .eq('is_deleted', false);

  const courseCount = courses?.length || 0;

  // Get tier limits
  const limits = TIER_LIMITS[tier];

  // Build usage stats
  const usage: UsageStats['usage'] = {
    videos: calculateUsageStat(videoCount, limits.videos),
    storage_gb: calculateUsageStat(totalStorageGB, limits.storage_gb),
    ai_messages: calculateUsageStat(aiMessageCount, limits.ai_messages_per_month),
    students: calculateUsageStat(studentCount, limits.students),
    courses: calculateUsageStat(courseCount, limits.courses),
  };

  // Find warnings (usage > 80%)
  const warnings: Array<keyof TierLimits> = [];
  if (usage.videos.percentage >= 80) warnings.push('videos');
  if (usage.storage_gb.percentage >= 80) warnings.push('storage_gb');
  if (usage.ai_messages.percentage >= 80) warnings.push('ai_messages_per_month');
  if (usage.students.percentage >= 80) warnings.push('students');
  if (usage.courses.percentage >= 80) warnings.push('courses');

  // Suggest tier upgrade if needed
  const suggestedTier = suggestTierUpgrade(usage, tier);

  return {
    tier,
    usage,
    warnings,
    suggestedTier,
  };
}

/**
 * Calculate a single usage stat
 */
function calculateUsageStat(current: number, limit: number): UsageStat {
  // -1 means unlimited
  if (limit === -1) {
    return {
      current,
      limit: -1,
      percentage: 0,
    };
  }

  const percentage = limit > 0 ? (current / limit) * 100 : 0;

  return {
    current: Math.round(current * 100) / 100, // Round to 2 decimals
    limit,
    percentage: Math.round(percentage * 10) / 10, // Round to 1 decimal
  };
}

/**
 * Check if usage is nearing limit
 */
export function isNearingLimit(
  current: number,
  limit: number,
  threshold = 0.8,
): boolean {
  if (limit === -1) return false; // Unlimited
  return current / limit >= threshold;
}

/**
 * Suggest appropriate tier upgrade based on usage patterns
 */
export function suggestTierUpgrade(
  usage: UsageStats['usage'],
  currentTier: SubscriptionTier,
): SubscriptionTier | null {
  // Enterprise users can't upgrade
  if (currentTier === 'enterprise') return null;

  // Check if any metric is at or near limit (>= 90%)
  const nearLimits = [
    usage.videos.percentage >= 90,
    usage.storage_gb.percentage >= 90,
    usage.ai_messages.percentage >= 90,
    usage.students.percentage >= 90,
    usage.courses.percentage >= 90,
  ];

  if (!nearLimits.some(Boolean)) return null;

  // Suggest next tier up
  const tierOrder: SubscriptionTier[] = ['free', 'basic', 'pro', 'enterprise'];
  const currentIndex = tierOrder.indexOf(currentTier);
  if (currentIndex < tierOrder.length - 1) {
    return tierOrder[currentIndex + 1] as SubscriptionTier;
  }

  return null;
}

/**
 * Format bytes to human-readable storage size
 */
export function formatStorage(bytes: number): string {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${units[i]}`;
}

/**
 * Get storage breakdown by video
 */
export async function getStorageBreakdown(
  creatorId: string,
): Promise<StorageBreakdown[]> {
  const supabase = getServiceSupabase();

  const { data: videos } = await (supabase as any)
    .from('videos')
    .select('id, title, file_size_bytes')
    .eq('creator_id', creatorId)
    .eq('is_deleted', false)
    .order('file_size_bytes', { ascending: false, nullsFirst: false });

  if (!videos || videos.length === 0) return [];

  const totalBytes = videos.reduce((sum: number, v: any) => sum + (v.file_size_bytes || 0), 0);

  return videos
    .filter((v: any) => v.file_size_bytes && v.file_size_bytes > 0)
    .map((v: any) => ({
      videoId: v.id,
      videoTitle: v.title,
      sizeBytes: v.file_size_bytes || 0,
      sizeGB: (v.file_size_bytes || 0) / (1024 * 1024 * 1024),
      percentage: totalBytes > 0 ? ((v.file_size_bytes || 0) / totalBytes) * 100 : 0,
    }));
}

/**
 * Check if an operation is allowed under current quota
 */
export async function checkQuota(
  creatorId: string,
  tier: SubscriptionTier,
  operation: keyof TierLimits,
): Promise<{ allowed: boolean; reason?: string }> {
  const usage = await calculateCurrentUsage(creatorId, tier);
  const stat = usage.usage[operation as keyof UsageStats['usage']];

  // Unlimited
  if (stat.limit === -1) {
    return { allowed: true };
  }

  // Check if at or over limit
  if (stat.current >= stat.limit) {
    return {
      allowed: false,
      reason: `You've reached your ${operation} limit (${stat.limit}). Upgrade to add more.`,
    };
  }

  return { allowed: true };
}

/**
 * Get AI message usage trend for projection
 */
export async function getAIMessageTrend(
  creatorId: string,
  days = 30,
): Promise<Array<{ date: string; count: number; cumulative: number }>> {
  const supabase = getServiceSupabase();

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data: messages } = await (supabase as any)
    .from('chat_messages')
    .select('created_at, session:chat_sessions!inner(creator_id)')
    .eq('session.creator_id', creatorId)
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: true });

  if (!messages || messages.length === 0) return [];

  // Group by date
  const dailyCounts = new Map<string, number>();
  messages.forEach((msg: any) => {
    const date = new Date(msg.created_at).toISOString().split('T')[0];
    if (date) {
      dailyCounts.set(date, (dailyCounts.get(date) || 0) + 1);
    }
  });

  // Build trend array
  let cumulative = 0;
  const trend = Array.from(dailyCounts.entries())
    .map(([date, count]) => {
      cumulative += count;
      return { date, count, cumulative };
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  return trend;
}
