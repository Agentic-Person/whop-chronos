/**
 * Whisper Fallback Processor
 *
 * Wrapper around OpenAI Whisper API for videos without free transcripts.
 * This is a PAID service and should only be used as a fallback.
 *
 * Features:
 * - Audio extraction from video files
 * - OpenAI Whisper API transcription
 * - Cost tracking ($0.006/minute)
 * - Structured transcript with timestamps
 * - Error handling with retry logic
 *
 * Cost: PAID ($0.006 per minute of audio)
 *
 * Priority: Use ONLY when YouTube, Loom, and Mux auto-captions are unavailable
 *
 * API Reference: https://platform.openai.com/docs/api-reference/audio
 */

import {
  transcribeVideo,
  estimateTranscriptionCost,
  type TranscriptionResult,
  type TranscriptionOptions,
} from './transcription';
import { logger } from '@/lib/logger';

/**
 * Structured data extracted from Whisper transcription
 */
export interface WhisperVideoData {
  title: string; // From user input or filename
  duration: number; // in seconds
  transcript: string; // Full transcript for chunking/embedding
  transcriptWithTimestamps: Array<{
    text: string;
    start: number; // in seconds
    duration: number; // in seconds
  }>;
  language: string;
  cost: number; // USD cost for transcription
  method: 'whisper';
}

/**
 * Custom error types for better error handling
 */
export class WhisperProcessorError extends Error {
  constructor(
    message: string,
    public code: WhisperErrorCode,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'WhisperProcessorError';
  }
}

export enum WhisperErrorCode {
  OPENAI_API_KEY_MISSING = 'OPENAI_API_KEY_MISSING',
  OPENAI_API_ERROR = 'OPENAI_API_ERROR',
  AUDIO_EXTRACTION_FAILED = 'AUDIO_EXTRACTION_FAILED',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  TRANSCRIPTION_FAILED = 'TRANSCRIPTION_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Process a video file with Whisper API to extract transcript
 *
 * This function:
 * 1. Validates OpenAI API key
 * 2. Extracts audio from video buffer
 * 3. Sends audio to Whisper API for transcription
 * 4. Calculates cost based on duration
 * 5. Formats transcript with timestamps
 *
 * @param videoBuffer - Video file as Buffer
 * @param filename - Original filename (for audio extraction)
 * @param options - Transcription options
 * @returns Structured video data with transcript and cost
 * @throws WhisperProcessorError for various failure scenarios
 *
 * @example
 * ```typescript
 * const videoData = await processWithWhisper(
 *   videoBuffer,
 *   'lecture.mp4',
 *   { language: 'en' }
 * );
 * console.log(`Transcript cost: $${videoData.cost}`);
 * console.log(videoData.transcript);
 * ```
 */
export async function processWithWhisper(
  videoBuffer: Buffer,
  filename: string,
  options: TranscriptionOptions = {}
): Promise<WhisperVideoData> {
  const fileSizeMB = (videoBuffer.length / 1024 / 1024).toFixed(2);
  logger.info('Processing file with Whisper', {
    component: 'whisper-processor',
    filename,
    fileSizeMB,
    action: 'transcription'
  });

  // Step 1: Validate API key
  if (!process.env['OPENAI_API_KEY']) {
    throw new WhisperProcessorError(
      'OPENAI_API_KEY environment variable not set. Please configure your OpenAI API key.',
      WhisperErrorCode.OPENAI_API_KEY_MISSING
    );
  }

  // Step 2: Transcribe video
  let result: TranscriptionResult;

  try {
    result = await transcribeVideo(videoBuffer, filename, {
      ...options,
      responseFormat: 'verbose_json', // Get segments for timestamps
      temperature: options.temperature ?? 0, // Deterministic output
    });
  } catch (error: any) {
    logger.error('Whisper transcription failed', error, { component: 'whisper-processor', filename });

    // Map transcription errors to WhisperProcessorError
    if (error.code === 'AUDIO_EXTRACTION_FAILED') {
      throw new WhisperProcessorError(
        'Failed to extract audio from video file. The file may be corrupted or in an unsupported format.',
        WhisperErrorCode.AUDIO_EXTRACTION_FAILED,
        error
      );
    }

    if (error.code === 'FILE_TOO_LARGE') {
      throw new WhisperProcessorError(
        'Video file is too large for Whisper API (max 25MB). Please split into smaller segments.',
        WhisperErrorCode.FILE_TOO_LARGE,
        error
      );
    }

    if (error.code === 'OPENAI_API_ERROR') {
      throw new WhisperProcessorError(
        `OpenAI API error: ${error.message}`,
        WhisperErrorCode.OPENAI_API_ERROR,
        error
      );
    }

    throw new WhisperProcessorError(
      'Transcription failed. Please try again or contact support.',
      WhisperErrorCode.TRANSCRIPTION_FAILED,
      error
    );
  }

  // Step 3: Format timestamps
  const transcriptWithTimestamps = (result.segments || []).map(segment => ({
    text: segment.text,
    start: segment.start,
    duration: segment.end - segment.start,
  }));

  // Step 4: Build result
  const videoData: WhisperVideoData = {
    title: filename.replace(/\.[^/.]+$/, ''), // Remove file extension
    duration: result.duration,
    transcript: result.transcript,
    transcriptWithTimestamps,
    language: result.language,
    cost: result.cost,
    method: 'whisper',
  };

  logger.info('Successfully transcribed with Whisper', {
    component: 'whisper-processor',
    filename,
    durationSeconds: result.duration.toFixed(2),
    durationMinutes: (result.duration / 60).toFixed(2),
    cost: result.cost.toFixed(4),
    transcriptLength: result.transcript.length,
    segments: transcriptWithTimestamps.length,
    action: 'completed'
  });

  return videoData;
}

/**
 * Process video from URL by downloading and transcribing
 *
 * @param videoUrl - URL to video file
 * @param filename - Filename for processing
 * @param options - Transcription options
 * @returns Structured video data with transcript and cost
 * @throws WhisperProcessorError if download or transcription fails
 *
 * @example
 * ```typescript
 * const videoData = await processVideoFromUrl(
 *   'https://example.com/video.mp4',
 *   'video.mp4'
 * );
 * ```
 */
export async function processVideoFromUrl(
  videoUrl: string,
  filename: string,
  options: TranscriptionOptions = {}
): Promise<WhisperVideoData> {
  logger.info('Downloading video from URL', { component: 'whisper-processor', videoUrl, filename });

  try {
    // Download video to buffer
    const response = await fetch(videoUrl);

    if (!response.ok) {
      throw new Error(`Failed to download video: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const videoBuffer = Buffer.from(arrayBuffer);

    const downloadedMB = (videoBuffer.length / 1024 / 1024).toFixed(2);
    logger.info('Video downloaded', { component: 'whisper-processor', videoUrl, downloadedMB });

    // Process with Whisper
    return await processWithWhisper(videoBuffer, filename, options);
  } catch (error: any) {
    if (error instanceof WhisperProcessorError) {
      throw error;
    }

    logger.error('Failed to download and process video', error, { component: 'whisper-processor', videoUrl, filename });
    throw new WhisperProcessorError(
      'Failed to download and transcribe video from URL.',
      WhisperErrorCode.NETWORK_ERROR,
      error
    );
  }
}

/**
 * Estimate transcription cost before processing
 *
 * Useful for showing users the cost before they commit to transcription.
 *
 * @param durationSeconds - Video duration in seconds
 * @returns Cost estimate
 *
 * @example
 * ```typescript
 * const estimate = estimateCost(600); // 10 minutes
 * console.log(`Estimated cost: $${estimate.cost}`);
 * // Output: Estimated cost: $0.06
 * ```
 */
export function estimateCost(durationSeconds: number): {
  durationMinutes: number;
  cost: number;
  costFormatted: string;
} {
  const { durationMinutes, estimatedCost } = estimateTranscriptionCost(durationSeconds);

  return {
    durationMinutes,
    cost: estimatedCost,
    costFormatted: `$${estimatedCost.toFixed(4)}`,
  };
}

/**
 * Check if Whisper should be used as fallback
 *
 * Whisper should only be used when:
 * - Video has no YouTube/Loom/Mux captions available
 * - Creator explicitly requests transcription
 * - Uploaded videos without source transcript
 *
 * @param sourceType - Video source type
 * @param hasTranscript - Whether video already has a transcript
 * @returns true if Whisper should be used
 *
 * @example
 * ```typescript
 * const shouldUse = shouldUseWhisper('upload', false);
 * console.log(shouldUse); // true
 * ```
 */
export function shouldUseWhisper(
  sourceType: 'youtube' | 'mux' | 'loom' | 'upload',
  hasTranscript: boolean
): boolean {
  // Never use Whisper if transcript already exists
  if (hasTranscript) {
    return false;
  }

  // For uploads, always use Whisper (no free alternative)
  if (sourceType === 'upload') {
    return true;
  }

  // For other sources, Whisper is fallback only
  // (Should be called after YouTube/Loom/Mux extraction fails)
  return false;
}

/**
 * Format cost for display
 *
 * @param cost - Cost in USD
 * @returns Formatted cost string
 *
 * @example
 * ```typescript
 * const formatted = formatCost(0.0614);
 * console.log(formatted); // "$0.06"
 * ```
 */
export function formatCost(cost: number): string {
  if (cost === 0) {
    return 'FREE';
  }

  if (cost < 0.01) {
    return `$${cost.toFixed(4)}`; // Show 4 decimals for very small costs
  }

  return `$${cost.toFixed(2)}`; // Show 2 decimals for normal costs
}

/**
 * Get a user-friendly error message for a WhisperProcessorError
 *
 * @param error - The error to get a message for
 * @returns User-friendly error message
 *
 * @example
 * ```typescript
 * try {
 *   await processWithWhisper(buffer, filename);
 * } catch (error) {
 *   if (error instanceof WhisperProcessorError) {
 *     console.log(getErrorMessage(error));
 *   }
 * }
 * ```
 */
export function getErrorMessage(error: WhisperProcessorError): string {
  const messages: Record<WhisperErrorCode, string> = {
    [WhisperErrorCode.OPENAI_API_KEY_MISSING]:
      'OpenAI API key not configured. Please contact support.',
    [WhisperErrorCode.OPENAI_API_ERROR]:
      'OpenAI API error. Please try again or contact support.',
    [WhisperErrorCode.AUDIO_EXTRACTION_FAILED]:
      'Failed to extract audio from video. The file may be corrupted or unsupported.',
    [WhisperErrorCode.FILE_TOO_LARGE]:
      'File is too large for transcription (max 25MB). Please split into smaller segments.',
    [WhisperErrorCode.TRANSCRIPTION_FAILED]:
      'Transcription failed. Please try again or contact support.',
    [WhisperErrorCode.NETWORK_ERROR]:
      'Network error. Please check your connection and try again.',
    [WhisperErrorCode.UNKNOWN_ERROR]:
      'An unexpected error occurred. Please try again later.',
  };

  return messages[error.code] || error.message;
}

/**
 * Get cost per minute constant
 *
 * @returns Cost per minute in USD
 *
 * @example
 * ```typescript
 * const rate = getCostPerMinute();
 * console.log(`Whisper costs ${rate}/minute`);
 * // Output: Whisper costs 0.006/minute
 * ```
 */
export function getCostPerMinute(): number {
  return 0.006; // $0.006 per minute
}
