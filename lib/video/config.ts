/**
 * Video Storage Configuration
 *
 * Tier-based limits for video uploads, storage, and processing
 * Based on Whop subscription tiers (basic, pro, enterprise)
 */

export const VIDEO_LIMITS = {
  basic: {
    maxStorageGB: 10,
    maxFileSizeMB: 500,
    maxVideos: 50,
    maxDurationMinutes: 120,
    allowedFormats: ['mp4', 'mov', 'avi', 'webm'],
    maxMonthlyUploads: 20,
  },
  pro: {
    maxStorageGB: 100,
    maxFileSizeMB: 2000, // 2GB
    maxVideos: 500,
    maxDurationMinutes: 240,
    allowedFormats: ['mp4', 'mov', 'avi', 'webm', 'mkv', 'flv'],
    maxMonthlyUploads: 100,
  },
  enterprise: {
    maxStorageGB: 1000,
    maxFileSizeMB: 5000, // 5GB
    maxVideos: -1, // unlimited
    maxDurationMinutes: -1, // unlimited
    allowedFormats: ['mp4', 'mov', 'avi', 'webm', 'mkv', 'flv', 'm4v', 'wmv'],
    maxMonthlyUploads: -1, // unlimited
  },
} as const;

export type SubscriptionTier = keyof typeof VIDEO_LIMITS;

/**
 * Convert bytes to human-readable format
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

/**
 * Convert MB to bytes
 */
export function mbToBytes(mb: number): number {
  return mb * 1024 * 1024;
}

/**
 * Convert GB to bytes
 */
export function gbToBytes(gb: number): number {
  return gb * 1024 * 1024 * 1024;
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

/**
 * Check if file format is allowed for tier
 */
export function isFormatAllowed(
  filename: string,
  tier: SubscriptionTier,
): boolean {
  const extension = getFileExtension(filename);
  return VIDEO_LIMITS[tier].allowedFormats.includes(extension);
}

/**
 * Validate file size against tier limits
 */
export function validateFileSize(
  fileSizeBytes: number,
  tier: SubscriptionTier,
): { valid: boolean; error?: string } {
  const maxBytes = mbToBytes(VIDEO_LIMITS[tier].maxFileSizeMB);

  if (fileSizeBytes > maxBytes) {
    return {
      valid: false,
      error: `File size ${formatBytes(fileSizeBytes)} exceeds ${tier} tier limit of ${formatBytes(maxBytes)}`,
    };
  }

  return { valid: true };
}

/**
 * Validate storage quota
 */
export function validateStorageQuota(
  currentUsageBytes: number,
  newFileSizeBytes: number,
  tier: SubscriptionTier,
): { valid: boolean; error?: string } {
  const maxBytes = gbToBytes(VIDEO_LIMITS[tier].maxStorageGB);
  const totalAfterUpload = currentUsageBytes + newFileSizeBytes;

  if (totalAfterUpload > maxBytes) {
    return {
      valid: false,
      error: `Storage quota exceeded. Using ${formatBytes(currentUsageBytes)} + ${formatBytes(newFileSizeBytes)} = ${formatBytes(totalAfterUpload)} exceeds ${tier} tier limit of ${formatBytes(maxBytes)}`,
    };
  }

  return { valid: true };
}

/**
 * Validate monthly upload limit
 */
export function validateMonthlyUploads(
  currentMonthUploads: number,
  tier: SubscriptionTier,
): { valid: boolean; error?: string } {
  const maxUploads = VIDEO_LIMITS[tier].maxMonthlyUploads;

  // -1 means unlimited
  if (maxUploads === -1) {
    return { valid: true };
  }

  if (currentMonthUploads >= maxUploads) {
    return {
      valid: false,
      error: `Monthly upload limit reached: ${currentMonthUploads}/${maxUploads} for ${tier} tier`,
    };
  }

  return { valid: true };
}

/**
 * Validate total video count
 */
export function validateVideoCount(
  currentCount: number,
  tier: SubscriptionTier,
): { valid: boolean; error?: string } {
  const maxVideos = VIDEO_LIMITS[tier].maxVideos;

  // -1 means unlimited
  if (maxVideos === -1) {
    return { valid: true };
  }

  if (currentCount >= maxVideos) {
    return {
      valid: false,
      error: `Video limit reached: ${currentCount}/${maxVideos} for ${tier} tier`,
    };
  }

  return { valid: true };
}
