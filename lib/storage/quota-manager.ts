/**
 * Storage Quota Manager
 *
 * Manages storage quotas and usage tracking for creators:
 * - Check available storage before upload
 * - Track storage usage per creator
 * - Enforce tier-based limits
 * - Calculate storage costs
 * - Provide upgrade recommendations
 */

import { getServiceSupabase } from '@/lib/db/client';
import type { Database } from '@/lib/db/types';

type SubscriptionTier = 'basic' | 'pro' | 'enterprise';
type Creator = Database['public']['Tables']['creators']['Row'];
type Video = Database['public']['Tables']['videos']['Row'];

/**
 * Storage quota limits per tier (in bytes)
 */
export const STORAGE_LIMITS = {
  basic: 1 * 1024 * 1024 * 1024, // 1GB
  pro: 10 * 1024 * 1024 * 1024, // 10GB
  enterprise: 100 * 1024 * 1024 * 1024, // 100GB
} as const;

/**
 * Video count limits per tier
 */
export const VIDEO_LIMITS = {
  basic: 50,
  pro: 500,
  enterprise: -1, // Unlimited
} as const;

/**
 * Monthly upload limits per tier
 */
export const MONTHLY_UPLOAD_LIMITS = {
  basic: 20,
  pro: 100,
  enterprise: -1, // Unlimited
} as const;

/**
 * Supabase storage cost (per GB/month)
 */
export const STORAGE_COST_PER_GB_MONTH = 0.021;

export interface QuotaInfo {
  tier: SubscriptionTier;
  storage: {
    used: number;
    limit: number;
    available: number;
    usagePercent: number;
    formatted: {
      used: string;
      limit: string;
      available: string;
    };
  };
  videos: {
    count: number;
    limit: number;
    remaining: number;
    usagePercent: number;
  };
  monthly: {
    uploads: number;
    limit: number;
    remaining: number;
    usagePercent: number;
  };
  costs: {
    currentMonthly: number;
    estimatedMonthly: number;
    formatted: {
      currentMonthly: string;
      estimatedMonthly: string;
    };
  };
}

export interface QuotaCheckResult {
  allowed: boolean;
  errors: string[];
  warnings: string[];
  quotaInfo: QuotaInfo;
}

/**
 * Get storage usage for a creator
 */
export async function getStorageUsage(creatorId: string): Promise<{
  totalBytes: number;
  videoCount: number;
  monthlyUploads: number;
}> {
  const supabase = getServiceSupabase();

  // Get all non-deleted videos
  const { data: videos, error } = await supabase
    .from('videos')
    .select('file_size_bytes, created_at')
    .eq('creator_id', creatorId)
    .eq('is_deleted', false)
    .eq('source_type', 'upload'); // Only count uploaded videos

  if (error) {
    console.error('Error fetching video usage:', error);
    return { totalBytes: 0, videoCount: 0, monthlyUploads: 0 };
  }

  const totalBytes = videos?.reduce(
    (sum, video) => sum + (video.file_size_bytes || 0),
    0
  ) || 0;

  const videoCount = videos?.length || 0;

  // Count uploads this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const monthlyUploads = videos?.filter(
    (video) => new Date(video.created_at) >= startOfMonth
  ).length || 0;

  return {
    totalBytes,
    videoCount,
    monthlyUploads,
  };
}

/**
 * Get quota information for a creator
 */
export async function getQuotaInfo(creatorId: string): Promise<QuotaInfo> {
  const supabase = getServiceSupabase();

  // Get creator info
  const { data: creator, error: creatorError } = await supabase
    .from('creators')
    .select('*')
    .eq('id', creatorId)
    .single();

  if (creatorError || !creator) {
    throw new Error('Creator not found');
  }

  const tier = creator.subscription_tier as SubscriptionTier;
  const usage = await getStorageUsage(creatorId);

  // Storage calculations
  const storageLimit = STORAGE_LIMITS[tier];
  const storageUsed = usage.totalBytes;
  const storageAvailable = Math.max(0, storageLimit - storageUsed);
  const storageUsagePercent = (storageUsed / storageLimit) * 100;

  // Video count calculations
  const videoLimit = VIDEO_LIMITS[tier];
  const videoCount = usage.videoCount;
  const videoRemaining = videoLimit === -1 ? -1 : Math.max(0, videoLimit - videoCount);
  const videoUsagePercent = videoLimit === -1 ? 0 : (videoCount / videoLimit) * 100;

  // Monthly upload calculations
  const monthlyLimit = MONTHLY_UPLOAD_LIMITS[tier];
  const monthlyUploads = usage.monthlyUploads;
  const monthlyRemaining = monthlyLimit === -1 ? -1 : Math.max(0, monthlyLimit - monthlyUploads);
  const monthlyUsagePercent = monthlyLimit === -1 ? 0 : (monthlyUploads / monthlyLimit) * 100;

  // Cost calculations
  const storageGB = storageUsed / (1024 * 1024 * 1024);
  const currentMonthlyCost = storageGB * STORAGE_COST_PER_GB_MONTH;

  return {
    tier,
    storage: {
      used: storageUsed,
      limit: storageLimit,
      available: storageAvailable,
      usagePercent: storageUsagePercent,
      formatted: {
        used: formatBytes(storageUsed),
        limit: formatBytes(storageLimit),
        available: formatBytes(storageAvailable),
      },
    },
    videos: {
      count: videoCount,
      limit: videoLimit,
      remaining: videoRemaining,
      usagePercent: videoUsagePercent,
    },
    monthly: {
      uploads: monthlyUploads,
      limit: monthlyLimit,
      remaining: monthlyRemaining,
      usagePercent: monthlyUsagePercent,
    },
    costs: {
      currentMonthly: currentMonthlyCost,
      estimatedMonthly: currentMonthlyCost,
      formatted: {
        currentMonthly: `$${currentMonthlyCost.toFixed(4)}`,
        estimatedMonthly: `$${currentMonthlyCost.toFixed(4)}`,
      },
    },
  };
}

/**
 * Check if creator can upload a new video
 */
export async function checkUploadQuota(
  creatorId: string,
  fileSizeBytes: number
): Promise<QuotaCheckResult> {
  const quotaInfo = await getQuotaInfo(creatorId);
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check storage quota
  if (fileSizeBytes > quotaInfo.storage.available) {
    errors.push(
      `Insufficient storage. File requires ${formatBytes(fileSizeBytes)} but only ${quotaInfo.storage.formatted.available} available. Upgrade to ${getUpgradeTier(quotaInfo.tier)} for more storage.`
    );
  }

  // Check video count limit
  if (quotaInfo.videos.limit !== -1 && quotaInfo.videos.remaining <= 0) {
    errors.push(
      `Video limit reached (${quotaInfo.videos.count}/${quotaInfo.videos.limit}). Upgrade to ${getUpgradeTier(quotaInfo.tier)} for more videos.`
    );
  }

  // Check monthly upload limit
  if (quotaInfo.monthly.limit !== -1 && quotaInfo.monthly.remaining <= 0) {
    errors.push(
      `Monthly upload limit reached (${quotaInfo.monthly.uploads}/${quotaInfo.monthly.limit}). Upgrade to ${getUpgradeTier(quotaInfo.tier)} or wait until next month.`
    );
  }

  // Warnings for approaching limits
  if (quotaInfo.storage.usagePercent >= 80 && quotaInfo.storage.usagePercent < 100) {
    warnings.push(
      `Storage usage at ${quotaInfo.storage.usagePercent.toFixed(1)}% of quota. Consider upgrading soon.`
    );
  }

  if (quotaInfo.videos.limit !== -1 && quotaInfo.videos.usagePercent >= 80) {
    warnings.push(
      `Video count at ${quotaInfo.videos.usagePercent.toFixed(1)}% of limit. Consider upgrading soon.`
    );
  }

  if (quotaInfo.monthly.limit !== -1 && quotaInfo.monthly.usagePercent >= 80) {
    warnings.push(
      `Monthly uploads at ${quotaInfo.monthly.usagePercent.toFixed(1)}% of limit.`
    );
  }

  return {
    allowed: errors.length === 0,
    errors,
    warnings,
    quotaInfo,
  };
}

/**
 * Update storage usage after upload
 */
export async function updateStorageUsage(
  creatorId: string,
  fileSizeBytes: number,
  durationSeconds: number
): Promise<void> {
  const supabase = getServiceSupabase();
  const today = new Date().toISOString().split('T')[0];

  // Get current usage for today
  const { data: existing } = await supabase
    .from('usage_metrics')
    .select('*')
    .eq('creator_id', creatorId)
    .eq('date', today)
    .single();

  if (existing) {
    // Update existing record
    await supabase
      .from('usage_metrics')
      .update({
        storage_used_bytes: (existing.storage_used_bytes || 0) + fileSizeBytes,
        videos_uploaded: (existing.videos_uploaded || 0) + 1,
        total_video_duration_seconds:
          (existing.total_video_duration_seconds || 0) + durationSeconds,
        updated_at: new Date().toISOString(),
      })
      .eq('creator_id', creatorId)
      .eq('date', today);
  } else {
    // Create new record
    await supabase.from('usage_metrics').insert({
      creator_id: creatorId,
      date: today,
      storage_used_bytes: fileSizeBytes,
      videos_uploaded: 1,
      total_video_duration_seconds: durationSeconds,
    });
  }
}

/**
 * Calculate storage cost for a file
 */
export function calculateStorageCost(fileSizeBytes: number): {
  sizeGB: number;
  monthlyCost: number;
  formattedCost: string;
} {
  const sizeGB = fileSizeBytes / (1024 * 1024 * 1024);
  const monthlyCost = sizeGB * STORAGE_COST_PER_GB_MONTH;

  return {
    sizeGB: Number(sizeGB.toFixed(4)),
    monthlyCost: Number(monthlyCost.toFixed(4)),
    formattedCost: `$${monthlyCost.toFixed(4)}/month`,
  };
}

/**
 * Get upgrade tier recommendation
 */
export function getUpgradeTier(currentTier: SubscriptionTier): string {
  if (currentTier === 'basic') return 'Pro';
  if (currentTier === 'pro') return 'Enterprise';
  return 'Enterprise';
}

/**
 * Get tier features comparison
 */
export function getTierFeatures() {
  return {
    basic: {
      name: 'Basic',
      price: '$29/month',
      storage: '1GB',
      videos: '50 videos',
      monthlyUploads: '20/month',
      features: [
        'Up to 50 videos',
        '1GB storage',
        '20 uploads per month',
        'Basic analytics',
      ],
    },
    pro: {
      name: 'Pro',
      price: '$99/month',
      storage: '10GB',
      videos: '500 videos',
      monthlyUploads: '100/month',
      features: [
        'Up to 500 videos',
        '10GB storage',
        '100 uploads per month',
        'Advanced analytics',
        'Priority support',
      ],
    },
    enterprise: {
      name: 'Enterprise',
      price: '$299/month',
      storage: '100GB',
      videos: 'Unlimited',
      monthlyUploads: 'Unlimited',
      features: [
        'Unlimited videos',
        '100GB storage',
        'Unlimited uploads',
        'Custom analytics',
        'Dedicated support',
        'API access',
      ],
    },
  };
}

/**
 * Check if cleanup is needed (approaching quota)
 */
export async function needsCleanup(creatorId: string): Promise<{
  needed: boolean;
  reason?: string;
  recommendation?: string;
}> {
  const quotaInfo = await getQuotaInfo(creatorId);

  // Check storage
  if (quotaInfo.storage.usagePercent >= 90) {
    return {
      needed: true,
      reason: `Storage at ${quotaInfo.storage.usagePercent.toFixed(1)}% capacity`,
      recommendation: 'Delete unused videos or upgrade to a higher tier',
    };
  }

  // Check video count
  if (quotaInfo.videos.limit !== -1 && quotaInfo.videos.usagePercent >= 90) {
    return {
      needed: true,
      reason: `Video count at ${quotaInfo.videos.usagePercent.toFixed(1)}% of limit`,
      recommendation: 'Delete old videos or upgrade to a higher tier',
    };
  }

  return { needed: false };
}

/**
 * Get least recently accessed videos for cleanup suggestions
 */
export async function getCleanupSuggestions(
  creatorId: string,
  limit: number = 10
): Promise<Video[]> {
  const supabase = getServiceSupabase();

  const { data: videos } = await supabase
    .from('videos')
    .select('*')
    .eq('creator_id', creatorId)
    .eq('is_deleted', false)
    .eq('source_type', 'upload')
    .order('updated_at', { ascending: true })
    .limit(limit);

  return videos || [];
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Estimate quota after upload
 */
export async function estimateQuotaAfterUpload(
  creatorId: string,
  fileSizeBytes: number
): Promise<QuotaInfo> {
  const currentQuota = await getQuotaInfo(creatorId);

  // Calculate new values
  const newStorageUsed = currentQuota.storage.used + fileSizeBytes;
  const newStorageAvailable = Math.max(0, currentQuota.storage.limit - newStorageUsed);
  const newStorageUsagePercent = (newStorageUsed / currentQuota.storage.limit) * 100;

  const newVideoCount = currentQuota.videos.count + 1;
  const newVideoRemaining =
    currentQuota.videos.limit === -1
      ? -1
      : Math.max(0, currentQuota.videos.limit - newVideoCount);
  const newVideoUsagePercent =
    currentQuota.videos.limit === -1
      ? 0
      : (newVideoCount / currentQuota.videos.limit) * 100;

  const newMonthlyUploads = currentQuota.monthly.uploads + 1;
  const newMonthlyRemaining =
    currentQuota.monthly.limit === -1
      ? -1
      : Math.max(0, currentQuota.monthly.limit - newMonthlyUploads);
  const newMonthlyUsagePercent =
    currentQuota.monthly.limit === -1
      ? 0
      : (newMonthlyUploads / currentQuota.monthly.limit) * 100;

  const newStorageGB = newStorageUsed / (1024 * 1024 * 1024);
  const newMonthlyCost = newStorageGB * STORAGE_COST_PER_GB_MONTH;

  return {
    ...currentQuota,
    storage: {
      used: newStorageUsed,
      limit: currentQuota.storage.limit,
      available: newStorageAvailable,
      usagePercent: newStorageUsagePercent,
      formatted: {
        used: formatBytes(newStorageUsed),
        limit: currentQuota.storage.formatted.limit,
        available: formatBytes(newStorageAvailable),
      },
    },
    videos: {
      count: newVideoCount,
      limit: currentQuota.videos.limit,
      remaining: newVideoRemaining,
      usagePercent: newVideoUsagePercent,
    },
    monthly: {
      uploads: newMonthlyUploads,
      limit: currentQuota.monthly.limit,
      remaining: newMonthlyRemaining,
      usagePercent: newMonthlyUsagePercent,
    },
    costs: {
      currentMonthly: newMonthlyCost,
      estimatedMonthly: newMonthlyCost,
      formatted: {
        currentMonthly: `$${newMonthlyCost.toFixed(4)}`,
        estimatedMonthly: `$${newMonthlyCost.toFixed(4)}`,
      },
    },
  };
}
