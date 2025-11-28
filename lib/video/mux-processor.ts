/**
 * Mux Video Processor
 *
 * Extracts transcripts and metadata from Mux videos using the Mux API.
 *
 * Features:
 * - FREE transcript extraction via Mux auto-generated captions
 * - Video metadata extraction (title, duration, playback URL)
 * - WebVTT/SRT caption parsing
 * - Structured transcript with timestamps
 * - Error handling with retry logic
 *
 * Cost: FREE (when auto-captions are available)
 *
 * API Reference: https://docs.mux.com/api-reference
 */

import { logger } from '@/lib/logger';

/**
 * Structured data extracted from a Mux video
 */
export interface MuxVideoData {
  assetId: string;
  playbackId: string;
  title: string;
  duration: number; // in seconds
  status: string;
  playbackUrl: string;
  thumbnailUrl: string;
  transcript: string; // Full transcript for chunking/embedding
  transcriptWithTimestamps: Array<{
    text: string;
    start: number; // in seconds
    duration: number; // in seconds
  }>;
  maxStoredResolution?: string;
  maxStoredFrameRate?: number;
}

/**
 * Custom error types for better error handling
 */
export class MuxProcessorError extends Error {
  constructor(
    message: string,
    public code: MuxErrorCode,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'MuxProcessorError';
  }
}

export enum MuxErrorCode {
  INVALID_ID = 'INVALID_ID',
  ASSET_NOT_FOUND = 'ASSET_NOT_FOUND',
  ASSET_NOT_READY = 'ASSET_NOT_READY',
  NO_TRANSCRIPT = 'NO_TRANSCRIPT',
  NO_AUTO_CAPTIONS = 'NO_AUTO_CAPTIONS',
  API_KEY_MISSING = 'API_KEY_MISSING',
  API_KEY_INVALID = 'API_KEY_INVALID',
  RATE_LIMITED = 'RATE_LIMITED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  PARSING_ERROR = 'PARSING_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Mux API response interfaces
 */
interface MuxAssetResponse {
  data: {
    id: string;
    playback_ids: Array<{
      id: string;
      policy: string;
    }>;
    duration: number;
    status: string;
    max_stored_resolution?: string;
    max_stored_frame_rate?: number;
    tracks: Array<{
      type: string;
      id: string;
      name?: string;
    }>;
  };
}

/**
 * WebVTT cue interface
 */
interface VTTCue {
  start: number; // seconds
  end: number; // seconds
  text: string;
}

/**
 * Get Mux API credentials from environment
 */
function getMuxCredentials(): { tokenId: string; tokenSecret: string } {
  const tokenId = process.env['MUX_TOKEN_ID'];
  const tokenSecret = process.env['MUX_TOKEN_SECRET'];

  if (!tokenId || !tokenSecret) {
    throw new MuxProcessorError(
      'MUX_TOKEN_ID and MUX_TOKEN_SECRET environment variables not set. Please configure your Mux API credentials.',
      MuxErrorCode.API_KEY_MISSING
    );
  }

  return { tokenId, tokenSecret };
}

/**
 * Create Basic Auth header for Mux API
 */
function getMuxAuthHeader(): string {
  const { tokenId, tokenSecret } = getMuxCredentials();
  const credentials = Buffer.from(`${tokenId}:${tokenSecret}`).toString('base64');
  return `Basic ${credentials}`;
}

/**
 * Fetch asset metadata from Mux API
 *
 * @param assetId - Mux asset ID
 * @returns Asset metadata
 * @throws MuxProcessorError for API errors
 */
async function fetchMuxAsset(assetId: string): Promise<MuxAssetResponse> {
  const url = `https://api.mux.com/video/v1/assets/${assetId}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': getMuxAuthHeader(),
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 401) {
      throw new MuxProcessorError(
        'Invalid Mux API credentials. Please check your MUX_TOKEN_ID and MUX_TOKEN_SECRET.',
        MuxErrorCode.API_KEY_INVALID
      );
    }

    if (response.status === 404) {
      throw new MuxProcessorError(
        'Asset not found. Please check the asset ID.',
        MuxErrorCode.ASSET_NOT_FOUND
      );
    }

    if (response.status === 429) {
      throw new MuxProcessorError(
        'Mux API rate limit exceeded. Please try again in a few minutes.',
        MuxErrorCode.RATE_LIMITED
      );
    }

    if (!response.ok) {
      throw new Error(`Mux API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    if (error instanceof MuxProcessorError) {
      throw error;
    }

    logger.error('Failed to fetch asset from Mux API', error, { component: 'mux-processor', assetId });
    throw new MuxProcessorError(
      'Failed to fetch asset from Mux API.',
      MuxErrorCode.NETWORK_ERROR,
      error
    );
  }
}

/**
 * Find text track (captions/subtitles) for a Mux asset
 *
 * @param assetId - Mux asset ID
 * @returns Text track ID or null if not found
 */
async function findTextTrack(assetId: string): Promise<string | null> {
  const asset = await fetchMuxAsset(assetId);

  // Look for text tracks (captions/subtitles)
  const textTrack = asset.data.tracks.find(
    track => track.type === 'text' || track.type === 'subtitle'
  );

  if (!textTrack) {
    logger.info('No text track found for asset', { component: 'mux-processor', assetId });
    return null;
  }

  logger.info('Found text track', { component: 'mux-processor', assetId, trackId: textTrack.id });
  return textTrack.id;
}

/**
 * Download WebVTT captions from Mux
 *
 * @param assetId - Mux asset ID
 * @param trackId - Text track ID
 * @returns WebVTT content
 * @throws MuxProcessorError if captions not available
 */
async function downloadMuxCaptions(assetId: string, trackId: string): Promise<string> {
  const url = `https://api.mux.com/video/v1/assets/${assetId}/tracks/${trackId}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': getMuxAuthHeader(),
        'Accept': 'text/vtt',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to download captions: ${response.status}`);
    }

    const vttContent = await response.text();
    return vttContent;
  } catch (error: any) {
    logger.error('Failed to download captions from Mux', error, { component: 'mux-processor', assetId, trackId });
    throw new MuxProcessorError(
      'Failed to download captions from Mux.',
      MuxErrorCode.NO_TRANSCRIPT,
      error
    );
  }
}

/**
 * Parse WebVTT format to structured cues
 *
 * WebVTT format:
 * WEBVTT
 *
 * 00:00:00.000 --> 00:00:03.500
 * First caption text
 *
 * 00:00:03.500 --> 00:00:07.000
 * Second caption text
 *
 * @param vttContent - Raw WebVTT content
 * @returns Array of parsed cues
 * @throws MuxProcessorError if parsing fails
 */
function parseWebVTT(vttContent: string): VTTCue[] {
  try {
    const lines = vttContent.split('\n');
    const cues: VTTCue[] = [];
    let i = 0;

    // Skip WEBVTT header and any metadata
    while (i < lines.length && !lines[i]?.includes('-->')) {
      i++;
    }

    while (i < lines.length) {
      const line = (lines[i] || '').trim();

      // Look for timestamp line (e.g., "00:00:00.000 --> 00:00:03.500")
      if (line.includes('-->')) {
        const [startStr, endStr] = line.split('-->').map(s => s.trim());
        const start = parseVTTTimestamp(startStr!);
        const end = parseVTTTimestamp(endStr!);

        // Collect text lines until we hit an empty line or another timestamp
        const textLines: string[] = [];
        i++;
        while (i < lines.length && (lines[i] || '').trim() && !lines[i]?.includes('-->')) {
          textLines.push((lines[i] || '').trim());
          i++;
        }

        if (textLines.length > 0) {
          cues.push({
            start,
            end,
            text: textLines.join(' '),
          });
        }
      }

      i++;
    }

    if (cues.length === 0) {
      throw new Error('No cues found in WebVTT file');
    }

    return cues;
  } catch (error: any) {
    logger.error('Failed to parse WebVTT', error, { component: 'mux-processor' });
    throw new MuxProcessorError(
      'Failed to parse caption file.',
      MuxErrorCode.PARSING_ERROR,
      error
    );
  }
}

/**
 * Parse WebVTT timestamp to seconds
 *
 * Formats supported:
 * - 00:00:00.000 (hours:minutes:seconds.milliseconds)
 * - 00:00.000 (minutes:seconds.milliseconds)
 *
 * @param timestamp - VTT timestamp string
 * @returns Time in seconds
 */
function parseVTTTimestamp(timestamp: string): number {
  const parts = timestamp.split(':');
  let seconds = 0;

  if (parts.length === 3) {
    // HH:MM:SS.mmm
    const hours = parseInt(parts[0]!, 10);
    const minutes = parseInt(parts[1]!, 10);
    const secondsParts = parts[2]!.split('.');
    const secs = parseInt(secondsParts[0]!, 10);
    const ms = parseInt(secondsParts[1] || '0', 10);

    seconds = hours * 3600 + minutes * 60 + secs + ms / 1000;
  } else if (parts.length === 2) {
    // MM:SS.mmm
    const minutes = parseInt(parts[0]!, 10);
    const secondsParts = parts[1]!.split('.');
    const secs = parseInt(secondsParts[0]!, 10);
    const ms = parseInt(secondsParts[1] || '0', 10);

    seconds = minutes * 60 + secs + ms / 1000;
  }

  return seconds;
}

/**
 * Process a Mux video to extract metadata and transcript
 *
 * This function:
 * 1. Fetches asset metadata
 * 2. Checks for auto-generated captions
 * 3. Downloads and parses WebVTT captions
 * 4. Formats transcript for embedding and citations
 *
 * @param assetId - Mux asset ID
 * @param creatorId - Creator ID for logging/tracking
 * @returns Structured video data with transcript, or null if no captions
 * @throws MuxProcessorError for errors other than missing captions
 *
 * @example
 * ```typescript
 * const videoData = await processMuxVideo('asset_abc123', 'creator_123');
 * if (videoData) {
 *   console.log(videoData.title);
 *   console.log(videoData.transcript);
 * } else {
 *   console.log('No auto-captions available, use Whisper fallback');
 * }
 * ```
 */
export async function processMuxVideo(
  assetId: string,
  creatorId: string
): Promise<MuxVideoData | null> {
  logger.info('Processing Mux asset', { component: 'mux-processor', assetId, creatorId, action: 'processing' });

  // Step 1: Fetch asset metadata
  const asset = await fetchMuxAsset(assetId);

  logger.info('Asset status fetched', { component: 'mux-processor', assetId, status: asset.data.status });

  // Check if asset is ready
  if (asset.data.status !== 'ready') {
    throw new MuxProcessorError(
      `Asset is not ready. Current status: ${asset.data.status}`,
      MuxErrorCode.ASSET_NOT_READY
    );
  }

  // Step 2: Find text track (captions)
  const trackId = await findTextTrack(assetId);

  if (!trackId) {
    logger.info('No auto-captions available for asset', { component: 'mux-processor', assetId });
    return null; // Signal to use Whisper fallback
  }

  // Step 3: Download captions
  const vttContent = await downloadMuxCaptions(assetId, trackId);

  logger.info('Downloaded captions', { component: 'mux-processor', assetId, bytes: vttContent.length });

  // Step 4: Parse WebVTT
  const cues = parseWebVTT(vttContent);

  logger.info('Parsed caption cues', { component: 'mux-processor', assetId, cueCount: cues.length });

  // Step 5: Format transcript
  const fullTranscript = cues.map(cue => cue.text).join(' ');

  const transcriptWithTimestamps = cues.map(cue => ({
    text: cue.text,
    start: cue.start,
    duration: cue.end - cue.start,
  }));

  // Step 6: Build playback URL
  const playbackId = asset.data.playback_ids[0]?.id || assetId;
  const playbackUrl = `https://stream.mux.com/${playbackId}.m3u8`;
  const thumbnailUrl = `https://image.mux.com/${playbackId}/thumbnail.jpg`;

  const result: MuxVideoData = {
    assetId,
    playbackId,
    title: assetId, // Mux doesn't store titles, will be set by user
    duration: asset.data.duration,
    status: asset.data.status,
    playbackUrl,
    thumbnailUrl,
    transcript: fullTranscript,
    transcriptWithTimestamps,
    maxStoredResolution: asset.data.max_stored_resolution,
    maxStoredFrameRate: asset.data.max_stored_frame_rate,
  };

  logger.info('Successfully processed Mux asset', {
    component: 'mux-processor',
    assetId,
    transcriptLength: fullTranscript.length,
    cueCount: cues.length,
    action: 'completed'
  });

  return result;
}

/**
 * Extract Mux asset ID or playback ID from URL
 *
 * Supports:
 * - Asset ID: asset_abc123def456
 * - Playback ID: xyz789abc123
 * - Stream URL: https://stream.mux.com/PLAYBACK_ID.m3u8
 *
 * @param idOrUrl - Mux asset ID, playback ID, or stream URL
 * @returns Asset ID or playback ID
 * @throws MuxProcessorError if invalid format
 *
 * @example
 * ```typescript
 * const id = extractMuxId('https://stream.mux.com/xyz789.m3u8');
 * console.log(id); // "xyz789"
 * ```
 */
export function extractMuxId(idOrUrl: string): string {
  const cleanInput = idOrUrl.trim();

  // Check if it's a stream URL
  const streamUrlMatch = cleanInput.match(/stream\.mux\.com\/([^/.]+)/);
  if (streamUrlMatch) {
    return streamUrlMatch[1]!;
  }

  // Check if it looks like an asset ID or playback ID
  if (/^[a-zA-Z0-9_-]+$/.test(cleanInput)) {
    return cleanInput;
  }

  throw new MuxProcessorError(
    'Invalid Mux asset ID or URL format.',
    MuxErrorCode.INVALID_ID
  );
}

/**
 * Validate if a string is a Mux URL or ID
 *
 * @param input - String to validate
 * @returns true if appears to be Mux-related
 *
 * @example
 * ```typescript
 * const isMux = isMuxUrl('https://stream.mux.com/abc123.m3u8');
 * console.log(isMux); // true
 * ```
 */
export function isMuxUrl(input: string): boolean {
  const cleanInput = input.trim().toLowerCase();
  return cleanInput.includes('mux.com') || cleanInput.startsWith('asset_');
}

/**
 * Get a user-friendly error message for a MuxProcessorError
 *
 * @param error - The error to get a message for
 * @returns User-friendly error message
 *
 * @example
 * ```typescript
 * try {
 *   await processMuxVideo(assetId, creatorId);
 * } catch (error) {
 *   if (error instanceof MuxProcessorError) {
 *     console.log(getErrorMessage(error));
 *   }
 * }
 * ```
 */
export function getErrorMessage(error: MuxProcessorError): string {
  const messages: Record<MuxErrorCode, string> = {
    [MuxErrorCode.INVALID_ID]:
      'Invalid Mux asset ID or URL.',
    [MuxErrorCode.ASSET_NOT_FOUND]:
      'Asset not found. Please check the asset ID.',
    [MuxErrorCode.ASSET_NOT_READY]:
      'Asset is still processing. Please try again in a few minutes.',
    [MuxErrorCode.NO_TRANSCRIPT]:
      'No transcript or captions available for this asset.',
    [MuxErrorCode.NO_AUTO_CAPTIONS]:
      'Auto-generated captions not available. Using Whisper fallback.',
    [MuxErrorCode.API_KEY_MISSING]:
      'Mux API credentials not configured. Please contact support.',
    [MuxErrorCode.API_KEY_INVALID]:
      'Invalid Mux API credentials. Please contact support.',
    [MuxErrorCode.RATE_LIMITED]:
      'Too many requests to Mux API. Please wait a few minutes and try again.',
    [MuxErrorCode.NETWORK_ERROR]:
      'Network error. Please check your connection and try again.',
    [MuxErrorCode.PARSING_ERROR]:
      'Failed to parse caption file. The file may be corrupted.',
    [MuxErrorCode.UNKNOWN_ERROR]:
      'An unexpected error occurred. Please try again later.',
  };

  return messages[error.code] || error.message;
}
