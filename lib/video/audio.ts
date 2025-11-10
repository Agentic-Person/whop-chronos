/**
 * Audio extraction utilities for video transcription
 * Handles audio extraction from video files for Whisper API processing
 */

import { writeFile, unlink, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';

export interface AudioExtractionResult {
  audioPath: string;
  durationSeconds: number;
  fileSize: number;
  format: string;
}

export interface AudioExtractionError {
  code: 'EXTRACTION_FAILED' | 'INVALID_FORMAT' | 'FILE_TOO_LARGE';
  message: string;
  originalError?: unknown;
}

// Maximum file size for Whisper API (25 MB)
const MAX_WHISPER_FILE_SIZE = 25 * 1024 * 1024;

// Supported audio formats for Whisper
const SUPPORTED_AUDIO_FORMATS = [
  'mp3',
  'mp4',
  'mpeg',
  'mpga',
  'm4a',
  'wav',
  'webm',
];

/**
 * Get temporary directory path for audio processing
 */
export function getTempAudioDir(): string {
  return join(tmpdir(), 'chronos-audio');
}

/**
 * Ensure temporary audio directory exists
 */
export async function ensureTempAudioDir(): Promise<string> {
  const tempDir = getTempAudioDir();

  if (!existsSync(tempDir)) {
    await mkdir(tempDir, { recursive: true });
  }

  return tempDir;
}

/**
 * Extract audio from video buffer
 * For MVP, we'll accept pre-extracted audio or direct video files
 * Future: Add ffmpeg integration for actual video->audio conversion
 */
export async function extractAudio(
  videoBuffer: Buffer,
  originalFilename: string,
): Promise<AudioExtractionResult> {
  try {
    // Ensure temp directory exists
    const tempDir = await ensureTempAudioDir();

    // Generate unique filename
    const audioId = randomUUID();
    const extension = getFileExtension(originalFilename) || 'mp3';
    const audioPath = join(tempDir, `${audioId}.${extension}`);

    // Check file size
    if (videoBuffer.length > MAX_WHISPER_FILE_SIZE) {
      throw {
        code: 'FILE_TOO_LARGE',
        message: `File size ${videoBuffer.length} bytes exceeds Whisper API limit of ${MAX_WHISPER_FILE_SIZE} bytes`,
      } as AudioExtractionError;
    }

    // Validate format
    if (!SUPPORTED_AUDIO_FORMATS.includes(extension)) {
      throw {
        code: 'INVALID_FORMAT',
        message: `Format ${extension} not supported. Supported formats: ${SUPPORTED_AUDIO_FORMATS.join(', ')}`,
      } as AudioExtractionError;
    }

    // Write audio file to temp directory
    await writeFile(audioPath, videoBuffer);

    // For MVP, estimate duration based on file size
    // Future: Use ffprobe or similar to get actual duration
    const estimatedDuration = estimateAudioDuration(
      videoBuffer.length,
      extension,
    );

    return {
      audioPath,
      durationSeconds: estimatedDuration,
      fileSize: videoBuffer.length,
      format: extension,
    };
  } catch (error) {
    if ((error as AudioExtractionError).code) {
      throw error;
    }

    throw {
      code: 'EXTRACTION_FAILED',
      message: 'Failed to extract audio from video',
      originalError: error,
    } as AudioExtractionError;
  }
}

/**
 * Clean up temporary audio file
 */
export async function cleanupAudioFile(audioPath: string): Promise<void> {
  try {
    if (existsSync(audioPath)) {
      await unlink(audioPath);
    }
  } catch (error) {
    // Log error but don't throw - cleanup is best effort
    console.error('[Audio Cleanup] Failed to delete temp file:', audioPath, error);
  }
}

/**
 * Clean up all temporary audio files older than specified age
 */
export async function cleanupOldAudioFiles(
  maxAgeMinutes = 60,
): Promise<number> {
  try {
    const tempDir = getTempAudioDir();

    if (!existsSync(tempDir)) {
      return 0;
    }

    // Future: Implement cleanup of old files
    // For now, just return 0
    return 0;
  } catch (error) {
    console.error('[Audio Cleanup] Failed to cleanup old files:', error);
    return 0;
  }
}

/**
 * Get file extension from filename
 */
function getFileExtension(filename: string): string | null {
  const match = filename.match(/\.([^.]+)$/);
  return match ? match[1].toLowerCase() : null;
}

/**
 * Estimate audio duration based on file size and format
 * This is a rough approximation until we implement proper media info extraction
 */
function estimateAudioDuration(
  fileSizeBytes: number,
  format: string,
): number {
  // Rough bitrate estimates (in bytes per second)
  const bitrateEstimates: Record<string, number> = {
    mp3: 16000, // ~128 kbps
    m4a: 16000, // ~128 kbps
    wav: 176400, // ~1411 kbps (uncompressed)
    webm: 16000, // ~128 kbps
    mp4: 16000, // ~128 kbps
  };

  const bytesPerSecond = bitrateEstimates[format] || 16000;
  return Math.round(fileSizeBytes / bytesPerSecond);
}

/**
 * Validate audio file for Whisper API compatibility
 */
export function validateAudioFile(
  fileSize: number,
  format: string,
): { valid: boolean; error?: AudioExtractionError } {
  if (fileSize > MAX_WHISPER_FILE_SIZE) {
    return {
      valid: false,
      error: {
        code: 'FILE_TOO_LARGE',
        message: `File size ${fileSize} bytes exceeds Whisper API limit of ${MAX_WHISPER_FILE_SIZE} bytes`,
      },
    };
  }

  if (!SUPPORTED_AUDIO_FORMATS.includes(format.toLowerCase())) {
    return {
      valid: false,
      error: {
        code: 'INVALID_FORMAT',
        message: `Format ${format} not supported. Supported formats: ${SUPPORTED_AUDIO_FORMATS.join(', ')}`,
      },
    };
  }

  return { valid: true };
}
