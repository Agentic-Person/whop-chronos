/**
 * Loom Video Processor
 *
 * Extracts transcripts and metadata from Loom videos using the Loom SDK API.
 *
 * Features:
 * - FREE transcript extraction via Loom API
 * - Video metadata extraction (title, duration, thumbnail)
 * - Structured transcript with timestamps
 * - Error handling with retry logic
 *
 * Cost: FREE (Loom provides transcripts via API)
 *
 * API Reference: https://dev.loom.com/docs/api/
 */

/**
 * Structured data extracted from a Loom video
 */
export interface LoomVideoData {
  videoId: string;
  title: string;
  duration: number; // in seconds
  thumbnail: string;
  creatorEmail: string;
  creatorName: string;
  description: string;
  transcript: string; // Full transcript for chunking/embedding
  transcriptWithTimestamps: Array<{
    text: string;
    start: number; // in seconds
    duration: number; // in seconds
  }>;
  downloadUrl?: string;
}

/**
 * Custom error types for better error handling
 */
export class LoomProcessorError extends Error {
  constructor(
    message: string,
    public code: LoomErrorCode,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'LoomProcessorError';
  }
}

export enum LoomErrorCode {
  INVALID_URL = 'INVALID_URL',
  VIDEO_NOT_FOUND = 'VIDEO_NOT_FOUND',
  VIDEO_PRIVATE = 'VIDEO_PRIVATE',
  NO_TRANSCRIPT = 'NO_TRANSCRIPT',
  API_KEY_MISSING = 'API_KEY_MISSING',
  API_KEY_INVALID = 'API_KEY_INVALID',
  RATE_LIMITED = 'RATE_LIMITED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Loom API response interfaces
 */
interface LoomVideoResponse {
  id: string;
  name: string;
  description?: string;
  duration: number;
  thumbnail_url: string;
  download_url?: string;
  owner: {
    email: string;
    name: string;
  };
}

interface LoomTranscriptResponse {
  sentences: Array<{
    text: string;
    start_time: number; // milliseconds
    end_time: number; // milliseconds
  }>;
}

/**
 * Extract video ID from various Loom URL formats
 *
 * Supports:
 * - https://www.loom.com/share/VIDEO_ID
 * - https://www.loom.com/embed/VIDEO_ID
 * - https://loom.com/share/VIDEO_ID
 *
 * @param url - Loom video URL
 * @returns Video ID extracted from URL
 * @throws LoomProcessorError if URL is invalid
 *
 * @example
 * ```typescript
 * const videoId = extractLoomVideoId('https://www.loom.com/share/abc123def456');
 * console.log(videoId); // "abc123def456"
 * ```
 */
export function extractLoomVideoId(url: string): string {
  // Trim whitespace
  const cleanUrl = url.trim();

  // Patterns to match various Loom URL formats
  const patterns = [
    // Standard share URL: loom.com/share/VIDEO_ID
    /(?:(?:www\.)?loom\.com\/share\/)([a-f0-9]+)/i,
    // Embed URL: loom.com/embed/VIDEO_ID
    /(?:(?:www\.)?loom\.com\/embed\/)([a-f0-9]+)/i,
  ];

  for (const pattern of patterns) {
    const match = cleanUrl.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  throw new LoomProcessorError(
    'Invalid Loom URL format. Please provide a valid Loom video URL.',
    LoomErrorCode.INVALID_URL
  );
}

/**
 * Get Loom API key from environment
 */
function getLoomApiKey(): string {
  const apiKey = process.env['LOOM_API_KEY'];

  if (!apiKey) {
    throw new LoomProcessorError(
      'LOOM_API_KEY environment variable not set. Please configure your Loom API key.',
      LoomErrorCode.API_KEY_MISSING
    );
  }

  return apiKey;
}

/**
 * Fetch video metadata from Loom API
 *
 * @param videoId - Loom video ID
 * @returns Video metadata
 * @throws LoomProcessorError for API errors
 */
async function fetchLoomVideoMetadata(videoId: string): Promise<LoomVideoResponse> {
  const apiKey = getLoomApiKey();
  const url = `https://api.loom.com/v1/videos/${videoId}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 401) {
      throw new LoomProcessorError(
        'Invalid Loom API key. Please check your LOOM_API_KEY environment variable.',
        LoomErrorCode.API_KEY_INVALID
      );
    }

    if (response.status === 404) {
      throw new LoomProcessorError(
        'Video not found. The video may be deleted or the URL is incorrect.',
        LoomErrorCode.VIDEO_NOT_FOUND
      );
    }

    if (response.status === 403) {
      throw new LoomProcessorError(
        'Access denied. This video may be private or you do not have permission to access it.',
        LoomErrorCode.VIDEO_PRIVATE
      );
    }

    if (response.status === 429) {
      throw new LoomProcessorError(
        'Loom API rate limit exceeded. Please try again in a few minutes.',
        LoomErrorCode.RATE_LIMITED
      );
    }

    if (!response.ok) {
      throw new Error(`Loom API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    if (error instanceof LoomProcessorError) {
      throw error;
    }

    console.error('[Loom Processor] Failed to fetch video metadata:', error);
    throw new LoomProcessorError(
      'Failed to fetch video metadata from Loom API.',
      LoomErrorCode.NETWORK_ERROR,
      error
    );
  }
}

/**
 * Fetch transcript from Loom API
 *
 * @param videoId - Loom video ID
 * @returns Transcript data with timestamps
 * @throws LoomProcessorError if transcript not available
 */
async function fetchLoomTranscript(videoId: string): Promise<LoomTranscriptResponse> {
  const apiKey = getLoomApiKey();
  const url = `https://api.loom.com/v1/videos/${videoId}/transcript`;

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 404) {
      throw new LoomProcessorError(
        'Transcript not available for this video. Please ensure captions are enabled in Loom.',
        LoomErrorCode.NO_TRANSCRIPT
      );
    }

    if (response.status === 401) {
      throw new LoomProcessorError(
        'Invalid Loom API key. Please check your LOOM_API_KEY environment variable.',
        LoomErrorCode.API_KEY_INVALID
      );
    }

    if (response.status === 429) {
      throw new LoomProcessorError(
        'Loom API rate limit exceeded. Please try again in a few minutes.',
        LoomErrorCode.RATE_LIMITED
      );
    }

    if (!response.ok) {
      throw new Error(`Loom API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.sentences || data.sentences.length === 0) {
      throw new LoomProcessorError(
        'Transcript is empty or not available for this video.',
        LoomErrorCode.NO_TRANSCRIPT
      );
    }

    return data;
  } catch (error: any) {
    if (error instanceof LoomProcessorError) {
      throw error;
    }

    console.error('[Loom Processor] Failed to fetch transcript:', error);
    throw new LoomProcessorError(
      'Failed to fetch transcript from Loom API.',
      LoomErrorCode.NETWORK_ERROR,
      error
    );
  }
}

/**
 * Process a Loom video to extract metadata and transcript
 *
 * This function:
 * 1. Extracts video ID from URL
 * 2. Fetches video metadata (title, duration, thumbnail)
 * 3. Fetches transcript with timestamps
 * 4. Formats transcript for embedding and citations
 *
 * @param videoUrl - Loom video URL
 * @param creatorId - Creator ID for logging/tracking
 * @returns Structured video data with transcript
 * @throws LoomProcessorError for various failure scenarios
 *
 * @example
 * ```typescript
 * const videoData = await processLoomVideo(
 *   'https://www.loom.com/share/abc123def456',
 *   'creator_123'
 * );
 * console.log(videoData.title);
 * console.log(videoData.transcript);
 * ```
 */
export async function processLoomVideo(
  videoUrl: string,
  creatorId: string
): Promise<LoomVideoData> {
  // Step 1: Extract video ID
  const videoId = extractLoomVideoId(videoUrl);

  console.log(`[Loom Processor] Processing video: ${videoId} for creator: ${creatorId}`);

  // Step 2: Fetch video metadata
  const metadata = await fetchLoomVideoMetadata(videoId);

  console.log(`[Loom Processor] Fetched metadata for: ${metadata.name}`);

  // Step 3: Fetch transcript
  const transcriptData = await fetchLoomTranscript(videoId);

  console.log(`[Loom Processor] Fetched transcript: ${transcriptData.sentences.length} sentences`);

  // Step 4: Process transcript
  // Full transcript (for chunking/embedding)
  const fullTranscript = transcriptData.sentences
    .map(sentence => sentence.text)
    .join(' ');

  // Transcript with timestamps (for citations)
  const transcriptWithTimestamps = transcriptData.sentences.map(sentence => ({
    text: sentence.text,
    start: sentence.start_time / 1000, // Convert ms to seconds
    duration: (sentence.end_time - sentence.start_time) / 1000, // Convert ms to seconds
  }));

  const result: LoomVideoData = {
    videoId,
    title: metadata.name,
    duration: metadata.duration / 1000, // Convert ms to seconds
    thumbnail: metadata.thumbnail_url,
    creatorEmail: metadata.owner.email,
    creatorName: metadata.owner.name,
    description: metadata.description || '',
    transcript: fullTranscript,
    transcriptWithTimestamps,
    downloadUrl: metadata.download_url,
  };

  console.log(`[Loom Processor] Successfully processed video: ${videoId}`);
  console.log(`[Loom Processor] Transcript length: ${fullTranscript.length} characters`);
  console.log(`[Loom Processor] Transcript sentences: ${transcriptWithTimestamps.length}`);

  return result;
}

/**
 * Validate if a URL is a Loom URL (without extracting video ID)
 *
 * @param url - URL to validate
 * @returns true if URL appears to be a Loom URL
 *
 * @example
 * ```typescript
 * const isLoom = isLoomUrl('https://www.loom.com/share/abc123');
 * console.log(isLoom); // true
 * ```
 */
export function isLoomUrl(url: string): boolean {
  const cleanUrl = url.trim().toLowerCase();
  return cleanUrl.includes('loom.com');
}

/**
 * Get a user-friendly error message for a LoomProcessorError
 *
 * @param error - The error to get a message for
 * @returns User-friendly error message
 *
 * @example
 * ```typescript
 * try {
 *   await processLoomVideo(url, creatorId);
 * } catch (error) {
 *   if (error instanceof LoomProcessorError) {
 *     console.log(getErrorMessage(error));
 *   }
 * }
 * ```
 */
export function getErrorMessage(error: LoomProcessorError): string {
  const messages: Record<LoomErrorCode, string> = {
    [LoomErrorCode.INVALID_URL]:
      'Invalid Loom URL. Please provide a valid Loom video link.',
    [LoomErrorCode.VIDEO_NOT_FOUND]:
      'Video not found. The video may be deleted or the URL is incorrect.',
    [LoomErrorCode.VIDEO_PRIVATE]:
      'This video is private. Please use a public video or check sharing permissions.',
    [LoomErrorCode.NO_TRANSCRIPT]:
      'No transcript available. Please enable captions in Loom or use a different video.',
    [LoomErrorCode.API_KEY_MISSING]:
      'Loom API key not configured. Please contact support.',
    [LoomErrorCode.API_KEY_INVALID]:
      'Invalid Loom API key. Please contact support.',
    [LoomErrorCode.RATE_LIMITED]:
      'Too many requests to Loom API. Please wait a few minutes and try again.',
    [LoomErrorCode.NETWORK_ERROR]:
      'Network error. Please check your connection and try again.',
    [LoomErrorCode.UNKNOWN_ERROR]:
      'An unexpected error occurred. Please try again later.',
  };

  return messages[error.code] || error.message;
}
