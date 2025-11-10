/**
 * Video transcription service using OpenAI Whisper API
 * Handles audio extraction, transcription, and cost tracking
 */

import OpenAI from 'openai';
import { createReadStream } from 'node:fs';
import { extractAudio, cleanupAudioFile } from './audio';
import type { AudioExtractionResult } from './audio';

export interface TranscriptionResult {
  transcript: string;
  language: string;
  duration: number;
  segments?: TranscriptSegment[];
  cost: number;
}

export interface TranscriptSegment {
  id: number;
  start: number;
  end: number;
  text: string;
}

export interface TranscriptionOptions {
  language?: string;
  prompt?: string;
  temperature?: number;
  responseFormat?: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt';
}

export interface TranscriptionError {
  code:
    | 'OPENAI_API_ERROR'
    | 'AUDIO_EXTRACTION_FAILED'
    | 'TRANSCRIPTION_FAILED'
    | 'FILE_TOO_LARGE';
  message: string;
  originalError?: unknown;
  retryable: boolean;
}

// Whisper API pricing (as of 2024)
const WHISPER_COST_PER_MINUTE = 0.006; // $0.006 per minute

// Maximum retries for API calls
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

/**
 * Initialize OpenAI client
 */
function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable not set');
  }

  return new OpenAI({ apiKey });
}

/**
 * Transcribe video using OpenAI Whisper API
 */
export async function transcribeVideo(
  videoBuffer: Buffer,
  originalFilename: string,
  options: TranscriptionOptions = {},
): Promise<TranscriptionResult> {
  let audioResult: AudioExtractionResult | null = null;

  try {
    // Step 1: Extract audio from video
    audioResult = await extractAudio(videoBuffer, originalFilename);

    // Step 2: Transcribe with Whisper API
    const transcription = await transcribeWithWhisper(
      audioResult.audioPath,
      options,
    );

    // Step 3: Calculate cost
    const durationMinutes = audioResult.durationSeconds / 60;
    const cost = calculateTranscriptionCost(durationMinutes);

    return {
      transcript: transcription.text,
      language: transcription.language || options.language || 'en',
      duration: audioResult.durationSeconds,
      segments: transcription.segments,
      cost,
    };
  } catch (error) {
    throw normalizeTranscriptionError(error);
  } finally {
    // Always cleanup temp audio file
    if (audioResult?.audioPath) {
      await cleanupAudioFile(audioResult.audioPath);
    }
  }
}

/**
 * Transcribe audio file using Whisper API with retry logic
 */
async function transcribeWithWhisper(
  audioPath: string,
  options: TranscriptionOptions,
  retryCount = 0,
): Promise<{
  text: string;
  language?: string;
  segments?: TranscriptSegment[];
}> {
  try {
    const client = getOpenAIClient();
    const audioStream = createReadStream(audioPath);

    const response = await client.audio.transcriptions.create({
      file: audioStream,
      model: 'whisper-1',
      language: options.language,
      prompt: options.prompt,
      temperature: options.temperature ?? 0,
      response_format: options.responseFormat || 'verbose_json',
    });

    // Parse response based on format
    if (options.responseFormat === 'text') {
      return {
        text: response as unknown as string,
      };
    }

    // verbose_json format includes segments and language
    const verboseResponse = response as {
      text: string;
      language?: string;
      segments?: Array<{
        id: number;
        start: number;
        end: number;
        text: string;
      }>;
    };

    return {
      text: verboseResponse.text,
      language: verboseResponse.language,
      segments: verboseResponse.segments,
    };
  } catch (error) {
    // Retry on transient errors
    if (retryCount < MAX_RETRIES && isRetryableError(error)) {
      const delay = RETRY_DELAY_MS * Math.pow(2, retryCount);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return transcribeWithWhisper(audioPath, options, retryCount + 1);
    }

    throw error;
  }
}

/**
 * Transcribe long video by chunking audio
 * For videos longer than 25MB, we need to split them
 */
export async function transcribeLongVideo(
  videoBuffer: Buffer,
  originalFilename: string,
  options: TranscriptionOptions = {},
): Promise<TranscriptionResult> {
  // For MVP, we'll just reject files > 25MB
  // Future: Implement chunking and parallel transcription
  const maxSize = 25 * 1024 * 1024; // 25 MB

  if (videoBuffer.length > maxSize) {
    throw {
      code: 'FILE_TOO_LARGE',
      message: `File size ${videoBuffer.length} bytes exceeds maximum supported size of ${maxSize} bytes. Please split into smaller segments.`,
      retryable: false,
    } as TranscriptionError;
  }

  return transcribeVideo(videoBuffer, originalFilename, options);
}

/**
 * Calculate transcription cost based on duration
 */
export function calculateTranscriptionCost(durationMinutes: number): number {
  return Number((durationMinutes * WHISPER_COST_PER_MINUTE).toFixed(4));
}

/**
 * Estimate transcription cost before processing
 */
export function estimateTranscriptionCost(
  durationSeconds: number,
): {
  durationMinutes: number;
  estimatedCost: number;
} {
  const durationMinutes = durationSeconds / 60;
  const estimatedCost = calculateTranscriptionCost(durationMinutes);

  return {
    durationMinutes: Number(durationMinutes.toFixed(2)),
    estimatedCost,
  };
}

/**
 * Check if error is retryable
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof OpenAI.APIError) {
    // Retry on rate limits and server errors
    return (
      error.status === 429 || // Rate limit
      error.status === 500 || // Internal server error
      error.status === 503 // Service unavailable
    );
  }
  return false;
}

/**
 * Normalize errors to consistent format
 */
function normalizeTranscriptionError(error: unknown): TranscriptionError {
  if ((error as TranscriptionError).code) {
    return error as TranscriptionError;
  }

  if (error instanceof OpenAI.APIError) {
    return {
      code: 'OPENAI_API_ERROR',
      message: `OpenAI API error: ${error.message}`,
      originalError: error,
      retryable: isRetryableError(error),
    };
  }

  return {
    code: 'TRANSCRIPTION_FAILED',
    message: error instanceof Error ? error.message : 'Unknown error',
    originalError: error,
    retryable: false,
  };
}

/**
 * Format transcript with timestamps for display
 */
export function formatTranscriptWithTimestamps(
  segments: TranscriptSegment[] | undefined,
): string {
  if (!segments || segments.length === 0) {
    return '';
  }

  return segments
    .map((segment) => {
      const startTime = formatTimestamp(segment.start);
      const endTime = formatTimestamp(segment.end);
      return `[${startTime} - ${endTime}] ${segment.text.trim()}`;
    })
    .join('\n\n');
}

/**
 * Format seconds to HH:MM:SS timestamp
 */
export function formatTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Extract plain text from transcript (remove timestamps)
 */
export function extractPlainText(segments: TranscriptSegment[]): string {
  return segments.map((segment) => segment.text.trim()).join(' ');
}
