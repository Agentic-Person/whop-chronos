/**
 * Usage Types
 *
 * Type definitions for tier-based usage tracking and limits
 */

export type SubscriptionTier = 'free' | 'basic' | 'pro' | 'enterprise';

export interface TierLimits {
  videos: number;
  storage_gb: number;
  ai_messages_per_month: number;
  students: number;
  courses: number;
}

export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  free: {
    videos: 3,
    storage_gb: 1,
    ai_messages_per_month: 100,
    students: 10,
    courses: 1,
  },
  basic: {
    videos: 15,
    storage_gb: 10,
    ai_messages_per_month: 1000,
    students: 50,
    courses: 3,
  },
  pro: {
    videos: 100,
    storage_gb: 100,
    ai_messages_per_month: 10000,
    students: 500,
    courses: 10,
  },
  enterprise: {
    videos: -1, // Unlimited
    storage_gb: 500,
    ai_messages_per_month: -1, // Unlimited
    students: -1, // Unlimited
    courses: -1, // Unlimited
  },
};

export interface UsageStat {
  current: number;
  limit: number;
  percentage: number;
}

export interface UsageStats {
  tier: SubscriptionTier;
  usage: {
    videos: UsageStat;
    storage_gb: UsageStat;
    ai_messages: UsageStat;
    students: UsageStat;
    courses: UsageStat;
  };
  warnings: Array<keyof TierLimits>;
  suggestedTier: SubscriptionTier | null;
}

export interface StorageBreakdown {
  videoId: string;
  videoTitle: string;
  sizeBytes: number;
  sizeGB: number;
  percentage: number;
}

export interface QuotaCheckResult {
  allowed: boolean;
  reason?: string;
  upgradeUrl?: string;
  currentUsage?: number;
  limit?: number;
}

export type UsageWarningLevel = 'normal' | 'warning' | 'critical' | 'exceeded';

export function getUsageWarningLevel(percentage: number): UsageWarningLevel {
  if (percentage >= 100) return 'exceeded';
  if (percentage >= 95) return 'critical';
  if (percentage >= 80) return 'warning';
  return 'normal';
}
