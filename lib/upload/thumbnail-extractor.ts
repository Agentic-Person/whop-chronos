/**
 * Thumbnail Extractor
 *
 * Extracts thumbnail images from video files:
 * - Capture frame at specific time (default: 5 seconds)
 * - Generate as data URL or Blob
 * - Upload to Supabase Storage
 * - Configurable quality and dimensions
 */

export interface ThumbnailOptions {
  /** Time in seconds to capture thumbnail (default: 5) */
  seekTime?: number;
  /** Output width in pixels (maintains aspect ratio if height not specified) */
  width?: number;
  /** Output height in pixels (maintains aspect ratio if width not specified) */
  height?: number;
  /** JPEG quality (0-1, default: 0.9) */
  quality?: number;
  /** Output format (default: 'jpeg') */
  format?: 'jpeg' | 'png' | 'webp';
}

export interface ThumbnailExtractionError {
  code: 'EXTRACTION_FAILED' | 'TIMEOUT' | 'SEEK_FAILED' | 'CANVAS_ERROR';
  message: string;
}

/**
 * Extract thumbnail from video file as data URL
 *
 * @param file - Video file
 * @param options - Thumbnail extraction options
 * @returns Base64 data URL
 * @throws ThumbnailExtractionError if extraction fails
 */
export async function extractThumbnail(
  file: File,
  options: ThumbnailOptions = {}
): Promise<string> {
  const {
    seekTime = 5,
    width,
    height,
    quality = 0.9,
    format = 'jpeg',
  } = options;

  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const objectUrl = URL.createObjectURL(file);
    let hasResolved = false;

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
      video.remove();
      canvas.remove();
    };

    const timeoutId = setTimeout(() => {
      if (!hasResolved) {
        hasResolved = true;
        cleanup();
        reject({
          code: 'TIMEOUT',
          message: 'Thumbnail extraction timed out after 30 seconds',
        } as ThumbnailExtractionError);
      }
    }, 30000);

    // Handle video loaded
    video.onloadedmetadata = () => {
      // Validate seek time
      const actualSeekTime = Math.min(seekTime, video.duration - 0.1);
      if (actualSeekTime < 0) {
        hasResolved = true;
        clearTimeout(timeoutId);
        cleanup();
        reject({
          code: 'SEEK_FAILED',
          message: 'Video is too short to extract thumbnail',
        } as ThumbnailExtractionError);
        return;
      }

      // Seek to specific time
      video.currentTime = actualSeekTime;
    };

    // Handle seek completed
    video.onseeked = () => {
      if (hasResolved) return;

      try {
        // Calculate dimensions
        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;
        const aspectRatio = videoWidth / videoHeight;

        let targetWidth = width || videoWidth;
        let targetHeight = height || videoHeight;

        // Maintain aspect ratio if only one dimension specified
        if (width && !height) {
          targetHeight = Math.floor(width / aspectRatio);
        } else if (height && !width) {
          targetWidth = Math.floor(height * aspectRatio);
        }

        // Set canvas size
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        // Draw video frame to canvas
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Could not get canvas context');
        }

        ctx.drawImage(video, 0, 0, targetWidth, targetHeight);

        // Convert to data URL
        const mimeType = `image/${format}`;
        const dataUrl = canvas.toDataURL(mimeType, quality);

        hasResolved = true;
        clearTimeout(timeoutId);
        cleanup();
        resolve(dataUrl);
      } catch (error) {
        hasResolved = true;
        clearTimeout(timeoutId);
        cleanup();
        reject({
          code: 'CANVAS_ERROR',
          message: `Failed to generate thumbnail: ${error instanceof Error ? error.message : 'Unknown error'}`,
        } as ThumbnailExtractionError);
      }
    };

    // Handle errors
    video.onerror = () => {
      if (hasResolved) return;
      hasResolved = true;
      clearTimeout(timeoutId);
      cleanup();
      reject({
        code: 'EXTRACTION_FAILED',
        message: `Video error: ${video.error?.message || 'Unknown error'}`,
      } as ThumbnailExtractionError);
    };

    video.preload = 'metadata';
    video.src = objectUrl;
    video.load();
  });
}

/**
 * Extract thumbnail as Blob
 *
 * @param file - Video file
 * @param options - Thumbnail extraction options
 * @returns Thumbnail as Blob
 * @throws ThumbnailExtractionError if extraction fails
 */
export async function extractThumbnailBlob(
  file: File,
  options: ThumbnailOptions = {}
): Promise<Blob> {
  const {
    seekTime = 5,
    width,
    height,
    quality = 0.9,
    format = 'jpeg',
  } = options;

  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const objectUrl = URL.createObjectURL(file);
    let hasResolved = false;

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
      video.remove();
      canvas.remove();
    };

    const timeoutId = setTimeout(() => {
      if (!hasResolved) {
        hasResolved = true;
        cleanup();
        reject({
          code: 'TIMEOUT',
          message: 'Thumbnail extraction timed out',
        } as ThumbnailExtractionError);
      }
    }, 30000);

    video.onloadedmetadata = () => {
      const actualSeekTime = Math.min(seekTime, video.duration - 0.1);
      if (actualSeekTime < 0) {
        hasResolved = true;
        clearTimeout(timeoutId);
        cleanup();
        reject({
          code: 'SEEK_FAILED',
          message: 'Video is too short',
        } as ThumbnailExtractionError);
        return;
      }
      video.currentTime = actualSeekTime;
    };

    video.onseeked = () => {
      if (hasResolved) return;

      try {
        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;
        const aspectRatio = videoWidth / videoHeight;

        let targetWidth = width || videoWidth;
        let targetHeight = height || videoHeight;

        if (width && !height) {
          targetHeight = Math.floor(width / aspectRatio);
        } else if (height && !width) {
          targetWidth = Math.floor(height * aspectRatio);
        }

        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Could not get canvas context');
        }

        ctx.drawImage(video, 0, 0, targetWidth, targetHeight);

        // Convert to Blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              hasResolved = true;
              clearTimeout(timeoutId);
              cleanup();
              resolve(blob);
            } else {
              hasResolved = true;
              clearTimeout(timeoutId);
              cleanup();
              reject({
                code: 'CANVAS_ERROR',
                message: 'Failed to generate thumbnail blob',
              } as ThumbnailExtractionError);
            }
          },
          `image/${format}`,
          quality
        );
      } catch (error) {
        hasResolved = true;
        clearTimeout(timeoutId);
        cleanup();
        reject({
          code: 'CANVAS_ERROR',
          message: `Canvas error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        } as ThumbnailExtractionError);
      }
    };

    video.onerror = () => {
      if (hasResolved) return;
      hasResolved = true;
      clearTimeout(timeoutId);
      cleanup();
      reject({
        code: 'EXTRACTION_FAILED',
        message: 'Video loading failed',
      } as ThumbnailExtractionError);
    };

    video.preload = 'metadata';
    video.src = objectUrl;
    video.load();
  });
}

/**
 * Upload thumbnail to Supabase Storage
 *
 * @param blob - Thumbnail blob
 * @param creatorId - Creator ID
 * @param videoId - Video ID
 * @returns Public URL of uploaded thumbnail
 */
export async function uploadThumbnail(
  blob: Blob,
  creatorId: string,
  videoId: string
): Promise<string> {
  const timestamp = Date.now();
  const path = `${creatorId}/${videoId}/thumbnail-${timestamp}.jpg`;

  const formData = new FormData();
  formData.append('file', blob, 'thumbnail.jpg');
  formData.append('path', path);

  const response = await fetch('/api/video/thumbnail/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Thumbnail upload failed: ${error.message}`);
  }

  const { url } = await response.json();
  return url;
}

/**
 * Extract and upload thumbnail in one step
 *
 * @param file - Video file
 * @param creatorId - Creator ID
 * @param videoId - Video ID
 * @param options - Thumbnail extraction options
 * @returns Public URL of uploaded thumbnail
 */
export async function extractAndUploadThumbnail(
  file: File,
  creatorId: string,
  videoId: string,
  options: ThumbnailOptions = {}
): Promise<string> {
  const blob = await extractThumbnailBlob(file, options);
  return uploadThumbnail(blob, creatorId, videoId);
}

/**
 * Generate multiple thumbnails at different timestamps
 *
 * @param file - Video file
 * @param timestamps - Array of timestamps in seconds
 * @param options - Thumbnail extraction options
 * @returns Array of data URLs
 */
export async function extractMultipleThumbnails(
  file: File,
  timestamps: number[],
  options: Omit<ThumbnailOptions, 'seekTime'> = {}
): Promise<string[]> {
  const thumbnails: string[] = [];

  for (const timestamp of timestamps) {
    try {
      const thumbnail = await extractThumbnail(file, {
        ...options,
        seekTime: timestamp,
      });
      thumbnails.push(thumbnail);
    } catch (error) {
      console.error(`Failed to extract thumbnail at ${timestamp}s:`, error);
      thumbnails.push(''); // Empty placeholder for failed extraction
    }
  }

  return thumbnails;
}

/**
 * Generate thumbnail grid (for preview/selection)
 *
 * @param file - Video file
 * @param count - Number of thumbnails to generate
 * @param options - Thumbnail extraction options
 * @returns Array of data URLs
 */
export async function generateThumbnailGrid(
  file: File,
  count: number = 6,
  options: Omit<ThumbnailOptions, 'seekTime'> = {}
): Promise<string[]> {
  // First, get video duration
  const video = document.createElement('video');
  const objectUrl = URL.createObjectURL(file);

  const duration = await new Promise<number>((resolve, reject) => {
    video.onloadedmetadata = () => {
      resolve(video.duration);
      URL.revokeObjectURL(objectUrl);
      video.remove();
    };
    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      video.remove();
      reject(new Error('Failed to load video'));
    };
    video.preload = 'metadata';
    video.src = objectUrl;
    video.load();
  });

  // Generate evenly spaced timestamps
  const interval = duration / (count + 1);
  const timestamps = Array.from({ length: count }, (_, i) => (i + 1) * interval);

  return extractMultipleThumbnails(file, timestamps, options);
}

/**
 * Convert data URL to Blob
 *
 * @param dataUrl - Base64 data URL
 * @returns Blob
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(',');
  const mimeMatch = header.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const binary = atob(data);
  const array = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }

  return new Blob([array], { type: mime });
}

/**
 * Get optimal thumbnail size based on aspect ratio
 *
 * @param videoWidth - Video width
 * @param videoHeight - Video height
 * @param targetWidth - Desired width (default: 640)
 * @returns Optimal dimensions
 */
export function getOptimalThumbnailSize(
  videoWidth: number,
  videoHeight: number,
  targetWidth: number = 640
): { width: number; height: number } {
  const aspectRatio = videoWidth / videoHeight;
  const height = Math.floor(targetWidth / aspectRatio);

  return {
    width: targetWidth,
    height,
  };
}

/**
 * Validate thumbnail file
 *
 * @param blob - Thumbnail blob
 * @param maxSizeKB - Maximum size in kilobytes (default: 500)
 * @returns Validation result
 */
export function validateThumbnail(
  blob: Blob,
  maxSizeKB: number = 500
): { valid: boolean; error?: string } {
  const maxSizeBytes = maxSizeKB * 1024;

  if (blob.size > maxSizeBytes) {
    return {
      valid: false,
      error: `Thumbnail too large (${Math.floor(blob.size / 1024)}KB). Maximum size is ${maxSizeKB}KB.`,
    };
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(blob.type)) {
    return {
      valid: false,
      error: `Invalid thumbnail type: ${blob.type}. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }

  return { valid: true };
}
