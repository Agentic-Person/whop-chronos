import { Innertube } from 'youtubei.js';

/**
 * Structured data extracted from a YouTube video
 */
export interface YouTubeVideoData {
  videoId: string;
  title: string;
  duration: number; // in seconds
  thumbnail: string;
  channelId: string;
  channelName: string;
  description: string;
  transcript: string; // Full transcript for chunking/embedding
  transcriptWithTimestamps: Array<{
    text: string;
    start: number; // in seconds
    duration: number; // in seconds
  }>;
}

/**
 * Custom error types for better error handling
 */
export class YouTubeProcessorError extends Error {
  constructor(
    message: string,
    public code: YouTubeErrorCode,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'YouTubeProcessorError';
  }
}

export enum YouTubeErrorCode {
  INVALID_URL = 'INVALID_URL',
  VIDEO_NOT_FOUND = 'VIDEO_NOT_FOUND',
  VIDEO_PRIVATE = 'VIDEO_PRIVATE',
  NO_TRANSCRIPT = 'NO_TRANSCRIPT',
  AGE_RESTRICTED = 'AGE_RESTRICTED',
  RATE_LIMITED = 'RATE_LIMITED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Extract video ID from various YouTube URL formats
 *
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/v/VIDEO_ID
 * - https://m.youtube.com/watch?v=VIDEO_ID
 *
 * @param url - YouTube video URL
 * @returns Video ID extracted from URL
 * @throws YouTubeProcessorError if URL is invalid
 *
 * @example
 * ```typescript
 * const videoId = extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
 * console.log(videoId); // "dQw4w9WgXcQ"
 * ```
 */
export function extractYouTubeVideoId(url: string): string {
  // Trim whitespace
  const cleanUrl = url.trim();

  // Patterns to match various YouTube URL formats
  const patterns = [
    // Standard watch URL: youtube.com/watch?v=VIDEO_ID
    /(?:youtube\.com\/watch\?v=|youtube\.com\/watch\?.*&v=)([^&\n?#]+)/,
    // Short URL: youtu.be/VIDEO_ID
    /(?:youtu\.be\/)([^&\n?#]+)/,
    // Embed URL: youtube.com/embed/VIDEO_ID
    /(?:youtube\.com\/embed\/)([^&\n?#]+)/,
    // Old format: youtube.com/v/VIDEO_ID
    /(?:youtube\.com\/v\/)([^&\n?#]+)/,
    // Mobile URL: m.youtube.com/watch?v=VIDEO_ID
    /(?:m\.youtube\.com\/watch\?v=)([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = cleanUrl.match(pattern);
    if (match && match[1]) {
      // Video IDs are 11 characters long
      const videoId = match[1];
      if (videoId.length === 11) {
        return videoId;
      }
    }
  }

  throw new YouTubeProcessorError(
    'Invalid YouTube URL format. Please provide a valid YouTube video URL.',
    YouTubeErrorCode.INVALID_URL
  );
}

/**
 * Process a YouTube video to extract metadata and transcript
 *
 * This function:
 * 1. Extracts video ID from URL
 * 2. Fetches video metadata (title, duration, thumbnail, channel info)
 * 3. Extracts full transcript for embedding
 * 4. Extracts transcript with timestamps for citations
 *
 * @param videoUrl - YouTube video URL
 * @param creatorId - Creator ID for logging/tracking
 * @returns Structured video data with transcript
 * @throws YouTubeProcessorError for various failure scenarios
 *
 * @example
 * ```typescript
 * const videoData = await processYouTubeVideo(
 *   'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
 *   'creator_123'
 * );
 * console.log(videoData.title); // "Never Gonna Give You Up"
 * console.log(videoData.transcript); // Full transcript text
 * ```
 */
export async function processYouTubeVideo(
  videoUrl: string,
  creatorId: string
): Promise<YouTubeVideoData> {
  // Step 1: Extract video ID
  const videoId = extractYouTubeVideoId(videoUrl);

  console.log(`[YouTube Processor] Processing video: ${videoId} for creator: ${creatorId}`);

  // Step 2: Initialize YouTube client with retry logic
  let youtube: Innertube;
  try {
    youtube = await Innertube.create();
  } catch (error) {
    console.error('[YouTube Processor] Failed to initialize Innertube:', error);
    throw new YouTubeProcessorError(
      'Failed to initialize YouTube client. Please try again.',
      YouTubeErrorCode.NETWORK_ERROR,
      error
    );
  }

  // Step 3: Fetch video info with exponential backoff
  let info;
  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      info = await youtube.getInfo(videoId);
      break; // Success, exit retry loop
    } catch (error: any) {
      const errorMessage = error?.message?.toLowerCase() || '';

      // Check for specific error types
      if (errorMessage.includes('video unavailable') || errorMessage.includes('not found')) {
        throw new YouTubeProcessorError(
          'Video is private, deleted, or unavailable. Please check the URL and try again.',
          YouTubeErrorCode.VIDEO_NOT_FOUND,
          error
        );
      }

      if (errorMessage.includes('private')) {
        throw new YouTubeProcessorError(
          'This video is private and cannot be accessed.',
          YouTubeErrorCode.VIDEO_PRIVATE,
          error
        );
      }

      if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
        // Rate limited - retry with exponential backoff
        if (attempt < maxRetries - 1) {
          const waitTime = 2 ** attempt * 1000; // 1s, 2s, 4s
          console.log(`[YouTube Processor] Rate limited, retrying in ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          attempt++;
          continue;
        } else {
          throw new YouTubeProcessorError(
            'YouTube is rate limiting requests. Please try again in a few minutes.',
            YouTubeErrorCode.RATE_LIMITED,
            error
          );
        }
      }

      // Unknown error on last attempt
      if (attempt >= maxRetries - 1) {
        console.error('[YouTube Processor] Failed to fetch video info:', error);
        throw new YouTubeProcessorError(
          'Failed to fetch video information. Please try again later.',
          YouTubeErrorCode.UNKNOWN_ERROR,
          error
        );
      }

      attempt++;
    }
  }

  if (!info) {
    throw new YouTubeProcessorError(
      'Failed to fetch video information after multiple attempts.',
      YouTubeErrorCode.UNKNOWN_ERROR
    );
  }

  // Step 4: Extract basic info
  const basicInfo = info.basic_info;

  // Check for age-restricted videos
  if ((basicInfo as any).is_age_restricted) {
    throw new YouTubeProcessorError(
      'Age-restricted videos are not supported. Please use a non-age-restricted video.',
      YouTubeErrorCode.AGE_RESTRICTED
    );
  }

  // Step 5: Extract transcript
  let transcriptData;
  let segments: any[] = [];

  try {
    transcriptData = await info.getTranscript();

    // Navigate the transcript data structure
    if (
      transcriptData?.transcript?.content?.body?.initial_segments &&
      Array.isArray(transcriptData.transcript.content.body.initial_segments)
    ) {
      segments = transcriptData.transcript.content.body.initial_segments;
    } else {
      throw new Error('Transcript data structure is invalid');
    }

    if (segments.length === 0) {
      throw new Error('Transcript is empty');
    }
  } catch (error: any) {
    const errorMessage = error?.message?.toLowerCase() || '';

    if (
      errorMessage.includes('transcript not available') ||
      errorMessage.includes('no transcript') ||
      errorMessage.includes('captions')
    ) {
      throw new YouTubeProcessorError(
        'This video does not have captions/transcripts enabled. Please enable captions on YouTube or use a different video.',
        YouTubeErrorCode.NO_TRANSCRIPT,
        error
      );
    }

    console.error('[YouTube Processor] Failed to extract transcript:', error);
    throw new YouTubeProcessorError(
      'Failed to extract video transcript. The video may not have captions enabled.',
      YouTubeErrorCode.NO_TRANSCRIPT,
      error
    );
  }

  // Step 6: Process transcript
  // Full transcript (for chunking/embedding)
  const fullTranscript = segments
    .map((seg: any) => seg.snippet?.text || '')
    .filter(Boolean)
    .join(' ');

  // Transcript with timestamps (for citations)
  const transcriptWithTimestamps = segments.map((seg: any) => ({
    text: seg.snippet?.text || '',
    start: seg.start_ms ? seg.start_ms / 1000 : 0, // Convert ms to seconds
    duration: seg.duration_ms ? seg.duration_ms / 1000 : 0, // Convert ms to seconds
  }));

  // Step 7: Extract metadata
  const thumbnail = basicInfo.thumbnail && basicInfo.thumbnail.length > 0
    ? basicInfo.thumbnail[basicInfo.thumbnail.length - 1]?.url || '' // Get highest quality
    : '';

  const result: YouTubeVideoData = {
    videoId,
    title: basicInfo.title || 'Untitled Video',
    duration: basicInfo.duration || 0,
    thumbnail,
    channelId: basicInfo.channel_id || '',
    channelName: basicInfo.author || '',
    description: basicInfo.short_description || '',
    transcript: fullTranscript,
    transcriptWithTimestamps,
  };

  console.log(`[YouTube Processor] Successfully processed video: ${videoId}`);
  console.log(`[YouTube Processor] Transcript length: ${fullTranscript.length} characters`);
  console.log(`[YouTube Processor] Transcript segments: ${transcriptWithTimestamps.length}`);

  return result;
}

/**
 * Validate if a URL is a YouTube URL (without extracting video ID)
 *
 * @param url - URL to validate
 * @returns true if URL appears to be a YouTube URL
 *
 * @example
 * ```typescript
 * const isYouTube = isYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
 * console.log(isYouTube); // true
 * ```
 */
export function isYouTubeUrl(url: string): boolean {
  const cleanUrl = url.trim().toLowerCase();
  return (
    cleanUrl.includes('youtube.com') ||
    cleanUrl.includes('youtu.be')
  );
}

/**
 * Get a user-friendly error message for a YouTubeProcessorError
 *
 * @param error - The error to get a message for
 * @returns User-friendly error message
 *
 * @example
 * ```typescript
 * try {
 *   await processYouTubeVideo(url, creatorId);
 * } catch (error) {
 *   if (error instanceof YouTubeProcessorError) {
 *     console.log(getErrorMessage(error));
 *   }
 * }
 * ```
 */
export function getErrorMessage(error: YouTubeProcessorError): string {
  const messages: Record<YouTubeErrorCode, string> = {
    [YouTubeErrorCode.INVALID_URL]:
      'Invalid YouTube URL. Please provide a valid YouTube video link.',
    [YouTubeErrorCode.VIDEO_NOT_FOUND]:
      'Video not found. The video may be deleted or the URL is incorrect.',
    [YouTubeErrorCode.VIDEO_PRIVATE]:
      'This video is private. Please use a public video.',
    [YouTubeErrorCode.NO_TRANSCRIPT]:
      'No transcript available. Please enable captions on this video or use a different video.',
    [YouTubeErrorCode.AGE_RESTRICTED]:
      'Age-restricted videos are not supported. Please use a non-restricted video.',
    [YouTubeErrorCode.RATE_LIMITED]:
      'Too many requests. Please wait a few minutes and try again.',
    [YouTubeErrorCode.NETWORK_ERROR]:
      'Network error. Please check your connection and try again.',
    [YouTubeErrorCode.UNKNOWN_ERROR]:
      'An unexpected error occurred. Please try again later.',
  };

  return messages[error.code] || error.message;
}
