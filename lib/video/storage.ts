/**
 * Video Storage Helpers
 *
 * Utilities for managing video uploads to Supabase Storage
 * Handles quota tracking, cleanup, and signed URL generation
 */

import { getServiceSupabase } from '@/lib/db/client';
import type { SubscriptionTier } from './config';
import {
  formatBytes,
  validateFileSize,
  validateMonthlyUploads,
  validateStorageQuota,
  validateVideoCount,
  isFormatAllowed,
} from './config';

const VIDEOS_BUCKET = 'videos';
const THUMBNAILS_BUCKET = 'thumbnails';

/**
 * Storage validation result
 */
export interface StorageValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  quotaInfo: {
    storageUsed: number;
    storageLimit: number;
    videosCount: number;
    videosLimit: number;
    monthlyUploads: number;
    monthlyLimit: number;
  };
}

/**
 * Validate if creator can upload a new video
 */
export async function validateVideoUpload(
  creatorId: string,
  fileSizeBytes: number,
  filename: string,
): Promise<StorageValidationResult> {
  const supabase = getServiceSupabase();
  const errors: string[] = [];
  const warnings: string[] = [];

  // Get creator info
  const { data: creator, error: creatorError } = await (supabase as any)
    .from('creators')
    .select('*')
    .eq('id', creatorId)
    .single();

  if (creatorError || !creator) {
    errors.push('Creator not found');
    return {
      valid: false,
      errors,
      warnings,
      quotaInfo: {
        storageUsed: 0,
        storageLimit: 0,
        videosCount: 0,
        videosLimit: 0,
        monthlyUploads: 0,
        monthlyLimit: 0,
      },
    };
  }

  const tier = creator.subscription_tier as SubscriptionTier;

  // Validate file format
  if (!isFormatAllowed(filename, tier)) {
    errors.push(`File format not allowed for ${tier} tier`);
  }

  // Validate file size
  const sizeValidation = validateFileSize(fileSizeBytes, tier);
  if (!sizeValidation.valid && sizeValidation.error) {
    errors.push(sizeValidation.error);
  }

  // Get current usage metrics
  const today = new Date().toISOString().split('T')[0]!;
  const { data: usageMetrics } = await (supabase as any)
    .from('usage_metrics')
    .select('*')
    .eq('creator_id', creatorId)
    .eq('date', today)
    .single();

  const currentStorageUsed = usageMetrics?.storage_used_bytes || 0;
  const currentMonthUploads = usageMetrics?.videos_uploaded || 0;

  // Validate storage quota
  const storageValidation = validateStorageQuota(
    currentStorageUsed,
    fileSizeBytes,
    tier,
  );
  if (!storageValidation.valid && storageValidation.error) {
    errors.push(storageValidation.error);
  }

  // Validate monthly uploads
  const monthlyValidation = validateMonthlyUploads(currentMonthUploads, tier);
  if (!monthlyValidation.valid && monthlyValidation.error) {
    errors.push(monthlyValidation.error);
  }

  // Get current video count
  const { count: videoCount } = await supabase
    .from('videos')
    .select('*', { count: 'exact', head: true })
    .eq('creator_id', creatorId)
    .eq('is_deleted', false);

  const currentVideoCount = videoCount || 0;

  // Validate video count
  const countValidation = validateVideoCount(currentVideoCount, tier);
  if (!countValidation.valid && countValidation.error) {
    errors.push(countValidation.error);
  }

  // Add warnings if approaching limits
  const storageUsagePercent =
    (currentStorageUsed /
      (tier === 'basic' ? 10 : tier === 'pro' ? 100 : 1000) /
      1024 /
      1024 /
      1024) *
    100;
  if (storageUsagePercent > 80) {
    warnings.push(
      `Storage usage at ${storageUsagePercent.toFixed(1)}% of quota`,
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    quotaInfo: {
      storageUsed: currentStorageUsed,
      storageLimit:
        tier === 'basic' ? 10 : tier === 'pro' ? 100 : 1000 * 1024 * 1024 * 1024,
      videosCount: currentVideoCount,
      videosLimit:
        tier === 'basic' ? 50 : tier === 'pro' ? 500 : -1,
      monthlyUploads: currentMonthUploads,
      monthlyLimit:
        tier === 'basic' ? 20 : tier === 'pro' ? 100 : -1,
    },
  };
}

/**
 * Generate storage path for video
 */
export function generateVideoPath(
  creatorId: string,
  videoId: string,
  filename: string,
): string {
  const timestamp = Date.now();
  const extension = filename.split('.').pop();
  return `${creatorId}/${videoId}/${timestamp}.${extension}`;
}

/**
 * Generate storage path for thumbnail
 */
export function generateThumbnailPath(
  creatorId: string,
  videoId: string,
): string {
  const timestamp = Date.now();
  return `${creatorId}/${videoId}/thumbnail-${timestamp}.jpg`;
}

/**
 * Create signed upload URL for direct client upload
 */
export async function createUploadUrl(
  path: string,
  _expiresIn = 3600, // 1 hour
): Promise<{ url: string; token: string } | null> {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase.storage
    .from(VIDEOS_BUCKET)
    .createSignedUploadUrl(path, {
      upsert: false,
    });

  if (error || !data) {
    console.error('Error creating upload URL:', error);
    return null;
  }

  return {
    url: data.signedUrl,
    token: data.token,
  };
}

/**
 * Get signed download URL for video
 */
export async function getVideoDownloadUrl(
  path: string,
  expiresIn = 3600,
): Promise<string | null> {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase.storage
    .from(VIDEOS_BUCKET)
    .createSignedUrl(path, expiresIn);

  if (error || !data) {
    console.error('Error creating download URL:', error);
    return null;
  }

  return data.signedUrl;
}

/**
 * Get public URL for video (if bucket is public)
 */
export function getVideoPublicUrl(path: string): string {
  const supabase = getServiceSupabase();
  const { data } = supabase.storage.from(VIDEOS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Delete video file from storage
 */
export async function deleteVideoFile(path: string): Promise<boolean> {
  const supabase = getServiceSupabase();

  const { error } = await supabase.storage.from(VIDEOS_BUCKET).remove([path]);

  if (error) {
    console.error('Error deleting video file:', error);
    return false;
  }

  return true;
}

/**
 * Delete thumbnail file from storage
 */
export async function deleteThumbnailFile(path: string): Promise<boolean> {
  const supabase = getServiceSupabase();

  const { error } = await supabase.storage
    .from(THUMBNAILS_BUCKET)
    .remove([path]);

  if (error) {
    console.error('Error deleting thumbnail file:', error);
    return false;
  }

  return true;
}

/**
 * Cleanup failed upload
 */
export async function cleanupFailedUpload(
  videoId: string,
  storagePath?: string,
): Promise<void> {
  const supabase = getServiceSupabase();

  // Delete from storage if path exists
  if (storagePath) {
    await deleteVideoFile(storagePath);
  }

  // Delete video record
  await supabase.from('videos').delete().eq('id', videoId);
}

/**
 * Update usage metrics after upload
 */
export async function updateUsageMetrics(
  creatorId: string,
  fileSizeBytes: number,
  durationSeconds: number,
): Promise<void> {
  const supabase = getServiceSupabase();
  const today = new Date().toISOString().split('T')[0]!;

  // Upsert usage metrics
  const { error } = await (supabase as any)
    .from('usage_metrics')
    .upsert(
      {
        creator_id: creatorId,
        date: today,
        storage_used_bytes: fileSizeBytes,
        videos_uploaded: 1,
        total_video_duration_seconds: durationSeconds,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'creator_id,date',
        ignoreDuplicates: false,
      },
    )
    .select();

  if (error) {
    console.error('Error updating usage metrics:', error);
  }
}

/**
 * Get creator's current storage usage
 */
export async function getStorageUsage(creatorId: string): Promise<{
  totalBytes: number;
  totalVideos: number;
  formattedSize: string;
}> {
  const supabase = getServiceSupabase();

  // Get total file size from videos
  const { data: videos } = await (supabase as any)
    .from('videos')
    .select('file_size_bytes')
    .eq('creator_id', creatorId)
    .eq('is_deleted', false);

  const totalBytes = videos?.reduce(
    (sum: number, video: any) => sum + (video.file_size_bytes || 0),
    0,
  ) || 0;

  return {
    totalBytes,
    totalVideos: videos?.length || 0,
    formattedSize: formatBytes(totalBytes),
  };
}

/**
 * List all files in creator's storage
 */
export async function listCreatorFiles(
  creatorId: string,
): Promise<{ name: string; size: number }[]> {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase.storage
    .from(VIDEOS_BUCKET)
    .list(creatorId, {
      limit: 1000,
      sortBy: { column: 'created_at', order: 'desc' },
    });

  if (error || !data) {
    console.error('Error listing files:', error);
    return [];
  }

  return data.map((file) => ({
    name: file.name,
    size: file.metadata?.['size'] || 0,
  }));
}
