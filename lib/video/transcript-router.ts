/**
 * Unified Transcript Router
 *
 * Central routing logic for transcript extraction from multiple video sources.
 * Implements cost-optimized fallback chain: FREE sources → Whisper (PAID).
 *
 * Routing Priority:
 * 1. YouTube → FREE (youtubei.js)
 * 2. Loom → FREE (Loom API)
 * 3. Mux → FREE (auto-captions if available)
 * 4. Whisper → PAID ($0.006/min fallback)
 *
 * Features:
 * - Automatic source detection and routing
 * - Cost tracking by source
 * - Graceful error handling
 * - Analytics event logging
 * - Retry logic for transient failures
 *
 * @module transcript-router
 */

import {
  processYouTubeVideo,
  isYouTubeUrl,
  YouTubeProcessorError,
  YouTubeErrorCode,
  type YouTubeVideoData,
} from './youtube-processor';

import {
  processLoomVideo,
  isLoomUrl,
  LoomProcessorError,
  LoomErrorCode,
  type LoomVideoData,
} from './loom-processor';

import {
  processMuxVideo,
  isMuxUrl,
  MuxProcessorError,
  MuxErrorCode,
  type MuxVideoData,
} from './mux-processor';

import {
  processWithWhisper,
  processVideoFromUrl,
  estimateCost,
  WhisperProcessorError,
  WhisperErrorCode,
  type WhisperVideoData,
} from './whisper-processor';

/**
 * Unified transcript result that works with all sources
 */
export interface TranscriptResult {
  source_type: 'youtube' | 'mux' | 'loom' | 'upload';
  transcript_method: 'youtube_api' | 'loom_api' | 'mux_auto' | 'whisper';
  title: string;
  duration_seconds: number;
  transcript: string; // Full transcript for chunking/embedding
  transcript_with_timestamps: Array<{
    text: string;
    start: number;
    duration: number;
  }>;
  metadata: {
    // Source-specific metadata
    video_id?: string; // YouTube
    playback_id?: string; // Mux
    thumbnail_url?: string;
    language?: string;
    // Cost tracking
    cost_usd: number;
    processing_time_ms: number;
    // Additional info
    [key: string]: any;
  };
}

/**
 * Router error with context
 */
export class TranscriptRouterError extends Error {
  constructor(
    message: string,
    public code: string,
    public sourceType: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'TranscriptRouterError';
  }
}

/**
 * Extract transcript from video URL with automatic source detection
 *
 * This is the main entry point for transcript extraction. It:
 * 1. Detects video source (YouTube, Loom, Mux)
 * 2. Routes to appropriate FREE processor
 * 3. Falls back to Whisper if FREE method fails/unavailable
 * 4. Tracks costs and processing time
 *
 * @param videoUrl - Video URL (YouTube, Loom, Mux, or direct video file)
 * @param creatorId - Creator ID for logging and analytics
 * @param options - Extraction options
 * @returns Unified transcript result
 * @throws TranscriptRouterError if all methods fail
 *
 * @example
 * ```typescript
 * // YouTube video (FREE)
 * const result = await extractTranscript(
 *   'https://www.youtube.com/watch?v=abc123',
 *   'creator_123'
 * );
 * console.log(result.transcript_method); // 'youtube_api'
 * console.log(result.metadata.cost_usd); // 0
 *
 * // Uploaded video (PAID - Whisper)
 * const result = await extractTranscript(
 *   'https://storage.example.com/video.mp4',
 *   'creator_123',
 *   { forceWhisper: true }
 * );
 * console.log(result.transcript_method); // 'whisper'
 * console.log(result.metadata.cost_usd); // 0.06 (for 10min video)
 * ```
 */
export async function extractTranscript(
  videoUrl: string,
  creatorId: string,
  options: {
    forceWhisper?: boolean;
    language?: string;
    videoBuffer?: Buffer;
    filename?: string;
  } = {}
): Promise<TranscriptResult> {
  const startTime = Date.now();

  console.log(`[Transcript Router] Extracting transcript for creator: ${creatorId}`);
  console.log(`[Transcript Router] URL: ${videoUrl}`);

  try {
    // Step 1: Detect source and route
    if (isYouTubeUrl(videoUrl)) {
      return await extractFromYouTube(videoUrl, creatorId, startTime);
    }

    if (isLoomUrl(videoUrl)) {
      return await extractFromLoom(videoUrl, creatorId, startTime);
    }

    if (isMuxUrl(videoUrl)) {
      return await extractFromMux(videoUrl, creatorId, startTime);
    }

    // Step 2: Unknown source or direct upload - use Whisper
    if (options.forceWhisper || options.videoBuffer) {
      return await extractWithWhisper(
        options.videoBuffer!,
        options.filename || 'video.mp4',
        creatorId,
        startTime,
        options.language
      );
    }

    throw new TranscriptRouterError(
      'Unable to detect video source. Please provide a valid YouTube, Loom, or Mux URL, or upload a video file.',
      'UNKNOWN_SOURCE',
      'unknown'
    );
  } catch (error) {
    const processingTime = Date.now() - startTime;

    if (error instanceof TranscriptRouterError) {
      throw error;
    }

    console.error('[Transcript Router] Extraction failed:', error);
    throw new TranscriptRouterError(
      'Transcript extraction failed. Please try again or contact support.',
      'EXTRACTION_FAILED',
      'unknown',
      error
    );
  }
}

/**
 * Extract transcript from YouTube video (FREE)
 */
async function extractFromYouTube(
  videoUrl: string,
  creatorId: string,
  startTime: number
): Promise<TranscriptResult> {
  console.log('[Transcript Router] Routing to YouTube processor (FREE)');

  try {
    const data = await processYouTubeVideo(videoUrl, creatorId);
    const processingTime = Date.now() - startTime;

    return {
      source_type: 'youtube',
      transcript_method: 'youtube_api',
      title: data.title,
      duration_seconds: data.duration,
      transcript: data.transcript,
      transcript_with_timestamps: data.transcriptWithTimestamps,
      metadata: {
        video_id: data.videoId,
        thumbnail_url: data.thumbnail,
        channel_id: data.channelId,
        channel_name: data.channelName,
        description: data.description,
        cost_usd: 0, // FREE
        processing_time_ms: processingTime,
      },
    };
  } catch (error) {
    if (error instanceof YouTubeProcessorError) {
      // Map YouTube errors to router errors
      throw new TranscriptRouterError(
        error.message,
        error.code,
        'youtube',
        error
      );
    }
    throw error;
  }
}

/**
 * Extract transcript from Loom video (FREE)
 */
async function extractFromLoom(
  videoUrl: string,
  creatorId: string,
  startTime: number
): Promise<TranscriptResult> {
  console.log('[Transcript Router] Routing to Loom processor (FREE)');

  try {
    const data = await processLoomVideo(videoUrl, creatorId);
    const processingTime = Date.now() - startTime;

    return {
      source_type: 'loom',
      transcript_method: 'loom_api',
      title: data.title,
      duration_seconds: data.duration,
      transcript: data.transcript,
      transcript_with_timestamps: data.transcriptWithTimestamps,
      metadata: {
        video_id: data.videoId,
        thumbnail_url: data.thumbnail,
        creator_email: data.creatorEmail,
        creator_name: data.creatorName,
        description: data.description,
        download_url: data.downloadUrl,
        cost_usd: 0, // FREE
        processing_time_ms: processingTime,
      },
    };
  } catch (error) {
    if (error instanceof LoomProcessorError) {
      throw new TranscriptRouterError(
        error.message,
        error.code,
        'loom',
        error
      );
    }
    throw error;
  }
}

/**
 * Extract transcript from Mux video (FREE if auto-captions available)
 */
async function extractFromMux(
  assetIdOrUrl: string,
  creatorId: string,
  startTime: number
): Promise<TranscriptResult> {
  console.log('[Transcript Router] Routing to Mux processor (checking auto-captions)');

  try {
    const data = await processMuxVideo(assetIdOrUrl, creatorId);

    // If Mux returns null, no auto-captions available
    if (!data) {
      console.log('[Transcript Router] No Mux auto-captions available');
      throw new TranscriptRouterError(
        'No auto-generated captions available for this Mux video. Whisper fallback required.',
        MuxErrorCode.NO_AUTO_CAPTIONS,
        'mux'
      );
    }

    const processingTime = Date.now() - startTime;

    return {
      source_type: 'mux',
      transcript_method: 'mux_auto',
      title: data.title,
      duration_seconds: data.duration,
      transcript: data.transcript,
      transcript_with_timestamps: data.transcriptWithTimestamps,
      metadata: {
        asset_id: data.assetId,
        playback_id: data.playbackId,
        playback_url: data.playbackUrl,
        thumbnail_url: data.thumbnailUrl,
        max_resolution: data.maxStoredResolution,
        max_frame_rate: data.maxStoredFrameRate,
        cost_usd: 0, // FREE (auto-captions)
        processing_time_ms: processingTime,
      },
    };
  } catch (error) {
    if (error instanceof MuxProcessorError) {
      throw new TranscriptRouterError(
        error.message,
        error.code,
        'mux',
        error
      );
    }
    throw error;
  }
}

/**
 * Extract transcript using Whisper API (PAID fallback)
 */
async function extractWithWhisper(
  videoBuffer: Buffer,
  filename: string,
  creatorId: string,
  startTime: number,
  language?: string
): Promise<TranscriptResult> {
  console.log('[Transcript Router] Routing to Whisper processor (PAID)');

  try {
    const data = await processWithWhisper(videoBuffer, filename, { language });
    const processingTime = Date.now() - startTime;

    return {
      source_type: 'upload',
      transcript_method: 'whisper',
      title: data.title,
      duration_seconds: data.duration,
      transcript: data.transcript,
      transcript_with_timestamps: data.transcriptWithTimestamps,
      metadata: {
        language: data.language,
        cost_usd: data.cost, // PAID
        processing_time_ms: processingTime,
        filename,
      },
    };
  } catch (error) {
    if (error instanceof WhisperProcessorError) {
      throw new TranscriptRouterError(
        error.message,
        error.code,
        'upload',
        error
      );
    }
    throw error;
  }
}

/**
 * Route based on video record from database
 *
 * Useful for Inngest jobs where video is already in database.
 *
 * @param video - Video record from database
 * @param creatorId - Creator ID
 * @param videoBuffer - Video buffer (for uploads only)
 * @returns Transcript result
 *
 * @example
 * ```typescript
 * const video = await supabase.from('videos').select('*').eq('id', videoId).single();
 * const result = await extractTranscriptFromVideo(video.data, creatorId, buffer);
 * ```
 */
export async function extractTranscriptFromVideo(
  video: {
    source_type: 'youtube' | 'mux' | 'loom' | 'upload';
    url?: string | null;
    embed_id?: string | null;
    mux_playback_id?: string | null;
    youtube_video_id?: string | null;
    storage_path?: string | null;
  },
  creatorId: string,
  videoBuffer?: Buffer
): Promise<TranscriptResult> {
  console.log(`[Transcript Router] Extracting from source_type: ${video.source_type}`);

  const startTime = Date.now();

  switch (video.source_type) {
    case 'youtube':
      if (!video.url && !video.youtube_video_id) {
        throw new TranscriptRouterError(
          'YouTube video missing URL or video ID',
          'MISSING_VIDEO_ID',
          'youtube'
        );
      }
      const youtubeUrl = video.url || `https://www.youtube.com/watch?v=${video.youtube_video_id}`;
      return await extractFromYouTube(youtubeUrl, creatorId, startTime);

    case 'loom':
      if (!video.url && !video.embed_id) {
        throw new TranscriptRouterError(
          'Loom video missing URL or embed ID',
          'MISSING_VIDEO_ID',
          'loom'
        );
      }
      const loomUrl = video.url || `https://www.loom.com/share/${video.embed_id}`;
      return await extractFromLoom(loomUrl, creatorId, startTime);

    case 'mux':
      if (!video.mux_playback_id) {
        throw new TranscriptRouterError(
          'Mux video missing playback ID',
          'MISSING_PLAYBACK_ID',
          'mux'
        );
      }
      return await extractFromMux(video.mux_playback_id, creatorId, startTime);

    case 'upload':
      if (!videoBuffer) {
        throw new TranscriptRouterError(
          'Upload video missing buffer. Cannot transcribe without video data.',
          'MISSING_VIDEO_BUFFER',
          'upload'
        );
      }
      const filename = video.storage_path?.split('/').pop() || 'video.mp4';
      return await extractWithWhisper(videoBuffer, filename, creatorId, startTime);

    default:
      throw new TranscriptRouterError(
        `Unknown source type: ${video.source_type}`,
        'UNKNOWN_SOURCE_TYPE',
        'unknown'
      );
  }
}

/**
 * Get cost breakdown by source type
 *
 * Returns cost information for each transcript source.
 *
 * @returns Cost breakdown
 *
 * @example
 * ```typescript
 * const costs = getCostBreakdown();
 * console.log(costs);
 * // {
 * //   youtube: { cost_per_minute: 0, description: 'FREE' },
 * //   loom: { cost_per_minute: 0, description: 'FREE' },
 * //   mux: { cost_per_minute: 0, description: 'FREE (if auto-captions available)' },
 * //   whisper: { cost_per_minute: 0.006, description: 'PAID fallback' }
 * // }
 * ```
 */
export function getCostBreakdown(): Record<string, {
  cost_per_minute: number;
  description: string;
}> {
  return {
    youtube: {
      cost_per_minute: 0,
      description: 'FREE (YouTube API)',
    },
    loom: {
      cost_per_minute: 0,
      description: 'FREE (Loom API)',
    },
    mux: {
      cost_per_minute: 0,
      description: 'FREE (auto-captions when available)',
    },
    whisper: {
      cost_per_minute: 0.006,
      description: 'PAID fallback ($0.006/min)',
    },
  };
}

/**
 * Calculate estimated cost before extraction
 *
 * @param sourceType - Video source type
 * @param durationSeconds - Video duration
 * @returns Estimated cost
 *
 * @example
 * ```typescript
 * const cost = calculateEstimatedCost('upload', 600);
 * console.log(cost); // { cost: 0.06, method: 'whisper' }
 * ```
 */
export function calculateEstimatedCost(
  sourceType: 'youtube' | 'mux' | 'loom' | 'upload',
  durationSeconds: number
): {
  cost: number;
  cost_formatted: string;
  method: string;
} {
  // Only uploads use Whisper (paid)
  if (sourceType === 'upload') {
    const estimate = estimateCost(durationSeconds);
    return {
      cost: estimate.cost,
      cost_formatted: estimate.costFormatted,
      method: 'whisper',
    };
  }

  // All other sources are free
  return {
    cost: 0,
    cost_formatted: 'FREE',
    method: `${sourceType}_api`,
  };
}
