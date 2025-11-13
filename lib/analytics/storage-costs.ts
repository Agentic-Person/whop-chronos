/**
 * Storage Cost Analytics
 *
 * Analytics queries for tracking storage and transcription costs:
 * - Storage usage by creator
 * - Transcription costs for uploaded videos
 * - Combined upload costs
 * - Cost trends over time
 * - Budget forecasting
 */

import { getServiceSupabase } from '@/lib/db/client';

// Cost constants
const STORAGE_COST_PER_GB_MONTH = 0.021; // $0.021 per GB/month
const WHISPER_COST_PER_MINUTE = 0.006; // $0.006 per minute

export interface StorageUsageReport {
  creatorId: string;
  totalBytes: number;
  totalGB: number;
  totalVideos: number;
  avgVideoSize: number;
  monthlyCost: number;
  breakdown: {
    upload: {
      bytes: number;
      videos: number;
      cost: number;
    };
    youtube: {
      bytes: number;
      videos: number;
      cost: number;
    };
    other: {
      bytes: number;
      videos: number;
      cost: number;
    };
  };
}

export interface TranscriptionCostReport {
  creatorId: string;
  totalVideos: number;
  totalDurationMinutes: number;
  totalCost: number;
  avgCostPerVideo: number;
  dateRange: {
    start: Date;
    end: Date;
  };
}

export interface CombinedCostReport {
  creatorId: string;
  period: string; // YYYY-MM
  storage: {
    cost: number;
    bytes: number;
    videos: number;
  };
  transcription: {
    cost: number;
    videos: number;
    minutes: number;
  };
  total: {
    cost: number;
    formatted: string;
  };
}

export interface CostTrend {
  month: string; // YYYY-MM
  storage: number;
  transcription: number;
  total: number;
}

/**
 * Get storage usage report for a creator
 */
export async function getStorageUsage(
  creatorId: string
): Promise<StorageUsageReport> {
  const supabase = getServiceSupabase();

  const { data: videos, error } = await (supabase as any)
    .from('videos')
    .select('file_size_bytes, source_type')
    .eq('creator_id', creatorId)
    .eq('is_deleted', false);

  if (error || !videos) {
    throw new Error('Failed to fetch storage usage');
  }

  // Calculate totals
  const totalBytes = videos.reduce(
    (sum: number, video: any) => sum + (video.file_size_bytes || 0),
    0
  );
  const totalGB = totalBytes / (1024 * 1024 * 1024);
  const totalVideos = videos.length;
  const avgVideoSize = totalVideos > 0 ? totalBytes / totalVideos : 0;
  const monthlyCost = totalGB * STORAGE_COST_PER_GB_MONTH;

  // Breakdown by source type
  const uploadVideos = videos.filter((v: any) => v.source_type === 'upload');
  const youtubeVideos = videos.filter((v: any) => v.source_type === 'youtube');
  const otherVideos = videos.filter(
    (v: any) => v.source_type !== 'upload' && v.source_type !== 'youtube'
  );

  const uploadBytes = uploadVideos.reduce(
    (sum: number, v: any) => sum + (v.file_size_bytes || 0),
    0
  );
  const youtubeBytes = youtubeVideos.reduce(
    (sum: number, v: any) => sum + (v.file_size_bytes || 0),
    0
  );
  const otherBytes = otherVideos.reduce(
    (sum: number, v: any) => sum + (v.file_size_bytes || 0),
    0
  );

  return {
    creatorId,
    totalBytes,
    totalGB: Number(totalGB.toFixed(4)),
    totalVideos,
    avgVideoSize,
    monthlyCost: Number(monthlyCost.toFixed(4)),
    breakdown: {
      upload: {
        bytes: uploadBytes,
        videos: uploadVideos.length,
        cost: Number(
          ((uploadBytes / (1024 * 1024 * 1024)) * STORAGE_COST_PER_GB_MONTH).toFixed(4)
        ),
      },
      youtube: {
        bytes: youtubeBytes,
        videos: youtubeVideos.length,
        cost: Number(
          ((youtubeBytes / (1024 * 1024 * 1024)) * STORAGE_COST_PER_GB_MONTH).toFixed(4)
        ),
      },
      other: {
        bytes: otherBytes,
        videos: otherVideos.length,
        cost: Number(
          ((otherBytes / (1024 * 1024 * 1024)) * STORAGE_COST_PER_GB_MONTH).toFixed(4)
        ),
      },
    },
  };
}

/**
 * Get transcription costs for uploaded videos
 */
export async function getUploadTranscriptionCosts(
  creatorId: string,
  dateRange: { start: Date; end: Date }
): Promise<TranscriptionCostReport> {
  const supabase = getServiceSupabase();

  const { data: videos, error } = await (supabase as any)
    .from('videos')
    .select('duration_seconds, created_at')
    .eq('creator_id', creatorId)
    .eq('source_type', 'upload')
    .gte('created_at', dateRange.start.toISOString())
    .lte('created_at', dateRange.end.toISOString());

  if (error || !videos) {
    throw new Error('Failed to fetch transcription costs');
  }

  const totalVideos = videos.length;
  const totalDurationSeconds = videos.reduce(
    (sum: number, video: any) => sum + (video.duration_seconds || 0),
    0
  );
  const totalDurationMinutes = totalDurationSeconds / 60;
  const totalCost = totalDurationMinutes * WHISPER_COST_PER_MINUTE;
  const avgCostPerVideo = totalVideos > 0 ? totalCost / totalVideos : 0;

  return {
    creatorId,
    totalVideos,
    totalDurationMinutes: Number(totalDurationMinutes.toFixed(2)),
    totalCost: Number(totalCost.toFixed(4)),
    avgCostPerVideo: Number(avgCostPerVideo.toFixed(4)),
    dateRange,
  };
}

/**
 * Get combined upload costs for a specific month
 */
export async function getTotalUploadCosts(
  creatorId: string,
  month: Date
): Promise<CombinedCostReport> {
  const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59);

  // Get storage usage (current total)
  const storageReport = await getStorageUsage(creatorId);

  // Get transcription costs for this month only
  const transcriptionReport = await getUploadTranscriptionCosts(creatorId, {
    start: startOfMonth,
    end: endOfMonth,
  });

  const totalCost = storageReport.monthlyCost + transcriptionReport.totalCost;

  return {
    creatorId,
    period: `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`,
    storage: {
      cost: storageReport.monthlyCost,
      bytes: storageReport.totalBytes,
      videos: storageReport.totalVideos,
    },
    transcription: {
      cost: transcriptionReport.totalCost,
      videos: transcriptionReport.totalVideos,
      minutes: transcriptionReport.totalDurationMinutes,
    },
    total: {
      cost: Number(totalCost.toFixed(4)),
      formatted: `$${totalCost.toFixed(2)}`,
    },
  };
}

/**
 * Get cost trends over the past N months
 */
export async function getCostTrends(
  creatorId: string,
  monthsBack: number = 6
): Promise<CostTrend[]> {
  const trends: CostTrend[] = [];
  const now = new Date();

  for (let i = monthsBack - 1; i >= 0; i--) {
    const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const costs = await getTotalUploadCosts(creatorId, month);

    trends.push({
      month: costs.period,
      storage: costs.storage.cost,
      transcription: costs.transcription.cost,
      total: costs.total.cost,
    });
  }

  return trends;
}

/**
 * Get storage breakdown by video
 */
export async function getStorageBreakdownByVideo(
  creatorId: string,
  limit: number = 20
): Promise<
  Array<{
    videoId: string;
    title: string;
    sizeBytes: number;
    sizeFormatted: string;
    monthlyCost: number;
    sourceType: string;
    createdAt: string;
  }>
> {
  const supabase = getServiceSupabase();

  const { data: videos, error } = await (supabase as any)
    .from('videos')
    .select('id, title, file_size_bytes, source_type, created_at')
    .eq('creator_id', creatorId)
    .eq('is_deleted', false)
    .order('file_size_bytes', { ascending: false })
    .limit(limit);

  if (error || !videos) {
    throw new Error('Failed to fetch video breakdown');
  }

  return videos.map((video: any) => {
    const sizeGB = (video.file_size_bytes || 0) / (1024 * 1024 * 1024);
    const monthlyCost = sizeGB * STORAGE_COST_PER_GB_MONTH;

    return {
      videoId: video.id,
      title: video.title,
      sizeBytes: video.file_size_bytes || 0,
      sizeFormatted: formatBytes(video.file_size_bytes || 0),
      monthlyCost: Number(monthlyCost.toFixed(4)),
      sourceType: video.source_type,
      createdAt: video.created_at,
    };
  });
}

/**
 * Forecast future storage costs
 */
export async function forecastStorageCosts(
  creatorId: string,
  monthsAhead: number = 3
): Promise<
  Array<{
    month: string;
    estimatedCost: number;
    assumptions: string;
  }>
> {
  const supabase = getServiceSupabase();

  // Get upload trend from past 3 months
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const { data: recentVideos } = await (supabase as any)
    .from('videos')
    .select('file_size_bytes, created_at')
    .eq('creator_id', creatorId)
    .eq('source_type', 'upload')
    .gte('created_at', threeMonthsAgo.toISOString());

  const avgMonthlyUploadBytes =
    recentVideos && recentVideos.length > 0
      ? recentVideos.reduce((sum: number, v: any) => sum + (v.file_size_bytes || 0), 0) / 3
      : 0;

  // Get current storage
  const currentStorage = await getStorageUsage(creatorId);
  const currentBytes = currentStorage.totalBytes;

  const forecasts = [];
  for (let i = 1; i <= monthsAhead; i++) {
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + i);
    const month = `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, '0')}`;

    const estimatedBytes = currentBytes + avgMonthlyUploadBytes * i;
    const estimatedGB = estimatedBytes / (1024 * 1024 * 1024);
    const estimatedCost = estimatedGB * STORAGE_COST_PER_GB_MONTH;

    forecasts.push({
      month,
      estimatedCost: Number(estimatedCost.toFixed(4)),
      assumptions: `Based on avg ${formatBytes(avgMonthlyUploadBytes)}/month upload rate`,
    });
  }

  return forecasts;
}

/**
 * Get cost savings from YouTube imports vs uploads
 */
export async function getCostSavingsReport(creatorId: string): Promise<{
  youtubeVideos: number;
  estimatedTranscriptionCost: number;
  actualTranscriptionCost: number;
  savings: number;
  savingsFormatted: string;
}> {
  const supabase = getServiceSupabase();

  // Get YouTube videos
  const { data: youtubeVideos } = await (supabase as any)
    .from('videos')
    .select('duration_seconds')
    .eq('creator_id', creatorId)
    .eq('source_type', 'youtube');

  // Get uploaded videos
  const { data: uploadedVideos } = await (supabase as any)
    .from('videos')
    .select('duration_seconds')
    .eq('creator_id', creatorId)
    .eq('source_type', 'upload');

  const youtubeDurationMinutes =
    (youtubeVideos?.reduce(
      (sum: number, v: any) => sum + (v.duration_seconds || 0),
      0
    ) || 0) / 60;

  const uploadDurationMinutes =
    (uploadedVideos?.reduce(
      (sum: number, v: any) => sum + (v.duration_seconds || 0),
      0
    ) || 0) / 60;

  // YouTube transcripts are free, uploads use Whisper
  const estimatedTranscriptionCost =
    youtubeDurationMinutes * WHISPER_COST_PER_MINUTE;
  const actualTranscriptionCost =
    uploadDurationMinutes * WHISPER_COST_PER_MINUTE;
  const savings = estimatedTranscriptionCost; // What we saved by using YouTube

  return {
    youtubeVideos: youtubeVideos?.length || 0,
    estimatedTranscriptionCost: Number(estimatedTranscriptionCost.toFixed(4)),
    actualTranscriptionCost: Number(actualTranscriptionCost.toFixed(4)),
    savings: Number(savings.toFixed(4)),
    savingsFormatted: `$${savings.toFixed(2)}`,
  };
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
 * Get monthly cost breakdown
 */
export async function getMonthlyCostBreakdown(
  creatorId: string,
  month: Date
): Promise<{
  period: string;
  storage: {
    cost: number;
    details: string;
  };
  transcription: {
    cost: number;
    details: string;
  };
  total: {
    cost: number;
    formatted: string;
  };
  recommendations: string[];
}> {
  const costs = await getTotalUploadCosts(creatorId, month);
  const recommendations: string[] = [];

  // Add recommendations based on costs
  if (costs.storage.cost > 1) {
    recommendations.push(
      `Storage cost is high ($${costs.storage.cost.toFixed(2)}/month). Consider using YouTube imports instead of uploads where possible.`
    );
  }

  if (costs.transcription.cost > 5) {
    recommendations.push(
      `Transcription costs are high ($${costs.transcription.cost.toFixed(2)} this month). YouTube and Loom videos have free transcripts.`
    );
  }

  if (costs.total.cost > 10) {
    recommendations.push(
      `Total costs are ${costs.total.formatted}/month. Consider optimizing your upload strategy.`
    );
  }

  return {
    period: costs.period,
    storage: {
      cost: costs.storage.cost,
      details: `${costs.storage.videos} videos, ${formatBytes(costs.storage.bytes)}`,
    },
    transcription: {
      cost: costs.transcription.cost,
      details: `${costs.transcription.videos} videos, ${costs.transcription.minutes.toFixed(1)} minutes`,
    },
    total: costs.total,
    recommendations,
  };
}
