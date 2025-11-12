/**
 * Video Metadata Extractor
 *
 * Extracts metadata from video files without full download:
 * - Duration
 * - Dimensions (width x height)
 * - Codec information
 * - Bitrate
 * - Frame rate
 * - File size
 *
 * Uses browser Video API for client-side extraction
 */

export interface VideoMetadata {
  duration: number; // seconds
  width: number;
  height: number;
  size: number; // bytes
  videoCodec?: string;
  audioCodec?: string;
  bitrate?: number; // bits per second
  framerate?: number; // fps
  aspectRatio?: string;
}

export interface MetadataExtractionError {
  code: 'UNSUPPORTED_FORMAT' | 'EXTRACTION_FAILED' | 'TIMEOUT' | 'FILE_CORRUPTED';
  message: string;
}

/**
 * Extract video metadata from File object
 *
 * This uses the browser's Video API to load video metadata
 * without downloading the entire file.
 *
 * @param file - Video file
 * @param timeoutMs - Timeout in milliseconds (default: 30000)
 * @returns Video metadata
 * @throws MetadataExtractionError if extraction fails
 */
export async function extractVideoMetadata(
  file: File,
  timeoutMs = 30000
): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const objectUrl = URL.createObjectURL(file);
    let timeoutId: NodeJS.Timeout | null = null;
    let hasResolved = false;

    // Cleanup function
    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
      URL.revokeObjectURL(objectUrl);
      video.remove();
    };

    // Timeout handler
    timeoutId = setTimeout(() => {
      if (!hasResolved) {
        hasResolved = true;
        cleanup();
        reject({
          code: 'TIMEOUT',
          message: `Metadata extraction timed out after ${timeoutMs}ms`,
        } as MetadataExtractionError);
      }
    }, timeoutMs);

    // Success handler
    video.onloadedmetadata = () => {
      if (hasResolved) return;
      hasResolved = true;

      try {
        // Extract basic metadata
        const metadata: VideoMetadata = {
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
          size: file.size,
          aspectRatio: calculateAspectRatio(video.videoWidth, video.videoHeight),
        };

        // Try to extract codec info (not always available)
        try {
          const videoTracks = (video as any).captureStream?.()?.getVideoTracks?.();
          if (videoTracks?.[0]) {
            const settings = videoTracks[0].getSettings();
            if (settings.frameRate) {
              metadata.framerate = settings.frameRate;
            }
          }
        } catch (e) {
          // Codec extraction is optional, ignore errors
          console.debug('Could not extract codec info:', e);
        }

        // Estimate bitrate (rough calculation)
        if (metadata.duration > 0) {
          metadata.bitrate = Math.floor((file.size * 8) / metadata.duration);
        }

        cleanup();
        resolve(metadata);
      } catch (error) {
        cleanup();
        reject({
          code: 'EXTRACTION_FAILED',
          message: `Failed to extract metadata: ${error instanceof Error ? error.message : 'Unknown error'}`,
        } as MetadataExtractionError);
      }
    };

    // Error handler
    video.onerror = () => {
      if (hasResolved) return;
      hasResolved = true;
      cleanup();

      const error = video.error;
      let code: MetadataExtractionError['code'] = 'EXTRACTION_FAILED';
      let message = 'Failed to load video';

      if (error) {
        switch (error.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            message = 'Video loading was aborted';
            break;
          case MediaError.MEDIA_ERR_NETWORK:
            message = 'Network error while loading video';
            break;
          case MediaError.MEDIA_ERR_DECODE:
            code = 'FILE_CORRUPTED';
            message = 'Video file is corrupted or unsupported format';
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            code = 'UNSUPPORTED_FORMAT';
            message = 'Video format is not supported by browser';
            break;
          default:
            message = `Video error: ${error.message || 'Unknown error'}`;
        }
      }

      reject({
        code,
        message,
      } as MetadataExtractionError);
    };

    // Preload metadata only (not the full video)
    video.preload = 'metadata';
    video.src = objectUrl;
    video.load();
  });
}

/**
 * Calculate aspect ratio as string (e.g., "16:9")
 */
function calculateAspectRatio(width: number, height: number): string {
  const gcd = (a: number, b: number): number => {
    return b === 0 ? a : gcd(b, a % b);
  };

  const divisor = gcd(width, height);
  const ratioWidth = width / divisor;
  const ratioHeight = height / divisor;

  // Common aspect ratios
  const ratioString = `${ratioWidth}:${ratioHeight}`;

  // Map to common names
  const commonRatios: Record<string, string> = {
    '16:9': '16:9 (Widescreen)',
    '4:3': '4:3 (Standard)',
    '21:9': '21:9 (Ultrawide)',
    '1:1': '1:1 (Square)',
    '9:16': '9:16 (Portrait)',
  };

  return commonRatios[ratioString] || ratioString;
}

/**
 * Format video duration as human-readable string
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format file size as human-readable string
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * Format bitrate as human-readable string
 */
export function formatBitrate(bitsPerSecond: number): string {
  const kbps = bitsPerSecond / 1000;
  const mbps = kbps / 1000;

  if (mbps >= 1) {
    return `${mbps.toFixed(2)} Mbps`;
  }

  return `${kbps.toFixed(2)} Kbps`;
}

/**
 * Validate video file before upload
 */
export function validateVideoFile(file: File): {
  valid: boolean;
  error?: string;
} {
  // Check if file exists
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  // Check file size (must be > 0)
  if (file.size === 0) {
    return { valid: false, error: 'File is empty' };
  }

  // Check file type
  const allowedTypes = [
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-matroska',
    'video/webm',
  ];

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Unsupported file type: ${file.type}. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }

  // Check file extension
  const extension = file.name.split('.').pop()?.toLowerCase();
  const allowedExtensions = ['mp4', 'mov', 'avi', 'mkv', 'webm'];

  if (!extension || !allowedExtensions.includes(extension)) {
    return {
      valid: false,
      error: `Unsupported file extension: ${extension}. Allowed extensions: ${allowedExtensions.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Get video quality tier based on resolution
 */
export function getQualityTier(width: number, height: number): string {
  const pixels = width * height;

  if (pixels >= 3840 * 2160) return '4K (UHD)';
  if (pixels >= 2560 * 1440) return '2K (QHD)';
  if (pixels >= 1920 * 1080) return '1080p (Full HD)';
  if (pixels >= 1280 * 720) return '720p (HD)';
  if (pixels >= 854 * 480) return '480p (SD)';
  if (pixels >= 640 * 360) return '360p';

  return 'Low Quality';
}

/**
 * Estimate transcription cost based on duration
 */
export function estimateTranscriptionCost(durationSeconds: number): {
  durationMinutes: number;
  cost: number;
  costFormatted: string;
} {
  const WHISPER_COST_PER_MINUTE = 0.006; // $0.006 per minute
  const durationMinutes = durationSeconds / 60;
  const cost = durationMinutes * WHISPER_COST_PER_MINUTE;

  return {
    durationMinutes: Number(durationMinutes.toFixed(2)),
    cost: Number(cost.toFixed(4)),
    costFormatted: `$${cost.toFixed(4)}`,
  };
}

/**
 * Check if video needs transcription based on source type
 */
export function needsTranscription(sourceType: 'youtube' | 'mux' | 'loom' | 'upload'): boolean {
  // YouTube, Loom, and Mux have free transcripts
  // Only uploaded videos need Whisper transcription
  return sourceType === 'upload';
}

/**
 * Estimate storage cost for video
 */
export function estimateStorageCost(fileSizeBytes: number): {
  sizeGB: number;
  monthlyCost: number;
  costFormatted: string;
} {
  const SUPABASE_STORAGE_COST_PER_GB = 0.021; // $0.021 per GB/month
  const sizeGB = fileSizeBytes / (1024 * 1024 * 1024);
  const monthlyCost = sizeGB * SUPABASE_STORAGE_COST_PER_GB;

  return {
    sizeGB: Number(sizeGB.toFixed(4)),
    monthlyCost: Number(monthlyCost.toFixed(4)),
    costFormatted: `$${monthlyCost.toFixed(4)}/month`,
  };
}

/**
 * Get total estimated cost for video upload
 */
export function getTotalEstimatedCost(
  fileSizeBytes: number,
  durationSeconds: number
): {
  transcriptionCost: number;
  storageCost: number;
  totalCost: number;
  breakdown: string;
} {
  const transcription = estimateTranscriptionCost(durationSeconds);
  const storage = estimateStorageCost(fileSizeBytes);

  const totalCost = transcription.cost + storage.monthlyCost;

  const breakdown = [
    `Transcription: ${transcription.costFormatted} (one-time)`,
    `Storage: ${storage.costFormatted} (monthly)`,
    `Total first month: $${(transcription.cost + storage.monthlyCost).toFixed(4)}`,
  ].join('\n');

  return {
    transcriptionCost: transcription.cost,
    storageCost: storage.monthlyCost,
    totalCost,
    breakdown,
  };
}
