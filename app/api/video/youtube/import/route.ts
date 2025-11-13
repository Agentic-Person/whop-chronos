/**
 * YouTube Video Import API Endpoint
 *
 * POST /api/video/youtube/import
 *
 * Accepts a YouTube URL, extracts video metadata and transcript using youtubei.js,
 * and saves to the database for processing.
 *
 * This endpoint:
 * 1. Validates the YouTube URL format
 * 2. Extracts video ID and metadata (title, duration, thumbnail, channel info)
 * 3. Extracts full transcript with timestamps
 * 4. Saves to database with source_type='youtube'
 * 5. Returns video ID and status for frontend tracking
 *
 * The video will then be processed by the existing chunking/embedding pipeline
 * (no changes needed to existing Inngest jobs - they work with transcripts)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/db/client';
import {
  processYouTubeVideo,
  YouTubeProcessorError,
  YouTubeErrorCode,
  getErrorMessage
} from '@/lib/video/youtube-processor';
import { inngest } from '@/inngest/client';

/**
 * Request body schema
 */
interface ImportRequest {
  videoUrl: string;
  creatorId: string;
}

/**
 * Response body schema
 */
interface ImportResponse {
  success: true;
  video: {
    id: string;
    title: string;
    youtube_video_id: string;
    status: string;
  };
}

interface ErrorResponse {
  success: false;
  error: string;
  code?: YouTubeErrorCode;
}

/**
 * POST /api/video/youtube/import
 *
 * Import a YouTube video by URL
 */
export async function POST(req: NextRequest): Promise<NextResponse<ImportResponse | ErrorResponse>> {
  try {
    // Parse request body
    const body: ImportRequest = await req.json();
    const { videoUrl, creatorId } = body;

    // Validate required fields
    if (!videoUrl || typeof videoUrl !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing or invalid videoUrl. Please provide a valid YouTube URL.',
        },
        { status: 400 }
      );
    }

    if (!creatorId || typeof creatorId !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing or invalid creatorId. Authentication required.',
        },
        { status: 400 }
      );
    }

    console.log('[YouTube Import API] Starting import for URL:', videoUrl);
    console.log('[YouTube Import API] Creator ID:', creatorId);

    // Step 1: Process YouTube video (extract metadata + transcript)
    let youtubeData;
    try {
      youtubeData = await processYouTubeVideo(videoUrl.trim(), creatorId);
    } catch (error) {
      // Handle YouTube-specific errors with appropriate status codes
      if (error instanceof YouTubeProcessorError) {
        const statusCode = getStatusCodeForError(error.code);
        const userMessage = getErrorMessage(error);

        console.error('[YouTube Import API] YouTube processing error:', {
          code: error.code,
          message: error.message,
          originalError: error.originalError,
        });

        return NextResponse.json(
          {
            success: false,
            error: userMessage,
            code: error.code,
          },
          { status: statusCode }
        );
      }

      // Unknown error
      throw error;
    }

    console.log('[YouTube Import API] Successfully extracted video data:', {
      videoId: youtubeData.videoId,
      title: youtubeData.title,
      duration: youtubeData.duration,
      transcriptLength: youtubeData.transcript.length,
    });

    // Step 2: Save to database
    const supabase = getServiceSupabase();

    const { data: video, error: dbError } = await (supabase as any)
      .from('videos')
      .insert({
        creator_id: creatorId,
        source_type: 'youtube',
        youtube_video_id: youtubeData.videoId,
        youtube_channel_id: youtubeData.channelId,
        title: youtubeData.title,
        description: youtubeData.description,
        duration_seconds: youtubeData.duration,
        thumbnail_url: youtubeData.thumbnail,
        transcript: youtubeData.transcript,
        status: 'processing', // YouTube videos skip transcription (already have transcript)
        metadata: {
          channel_name: youtubeData.channelName,
          source_url: videoUrl.trim(),
          import_type: 'youtube',
          imported_at: new Date().toISOString(),
          transcript_segments: youtubeData.transcriptWithTimestamps.length,
        },
      })
      .select('id, title, youtube_video_id, status')
      .single();

    if (dbError) {
      console.error('[YouTube Import API] Database error:', dbError);

      // Check for duplicate video
      if (dbError.code === '23505') { // PostgreSQL unique constraint violation
        return NextResponse.json(
          {
            success: false,
            error: 'This YouTube video has already been imported.',
          },
          { status: 409 }
        );
      }

      throw new Error(`Database error: ${dbError.message}`);
    }

    if (!video) {
      throw new Error('Failed to create video record - no data returned');
    }

    console.log('[YouTube Import API] Video saved to database:', {
      id: video.id,
      title: video.title,
      status: video.status,
    });

    // Step 3: Trigger Inngest job to chunk transcript and generate embeddings (optional)
    // Don't fail the import if Inngest is not configured
    try {
      console.log('[YouTube Import API] Triggering chunking/embedding job');
      await inngest.send({
        name: 'video/transcription.completed',
        data: {
          video_id: video.id,
          creator_id: creatorId,
          transcript: video.transcript,
        },
      });
      console.log('[YouTube Import API] Successfully triggered background job');
    } catch (inngestError) {
      // Log but don't fail - the video is already saved to database
      console.warn('[YouTube Import API] Failed to trigger Inngest job (this is OK in development):', inngestError);
      console.warn('[YouTube Import API] Video saved successfully, but embeddings will need to be generated manually');
    }

    // Step 4: Return success response
    return NextResponse.json(
      {
        success: true,
        video: {
          id: video.id,
          title: video.title,
          youtube_video_id: video.youtube_video_id!,
          status: video.status,
        },
      },
      { status: 200 }
    );

  } catch (error) {
    // Catch-all error handler for unexpected errors
    console.error('[YouTube Import API] Unexpected error:', error);

    const errorMessage = error instanceof Error
      ? error.message
      : 'An unexpected error occurred while importing the video';

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

/**
 * Map YouTube error codes to HTTP status codes
 */
function getStatusCodeForError(code: YouTubeErrorCode): number {
  const statusMap: Record<YouTubeErrorCode, number> = {
    [YouTubeErrorCode.INVALID_URL]: 400, // Bad Request
    [YouTubeErrorCode.VIDEO_NOT_FOUND]: 404, // Not Found
    [YouTubeErrorCode.VIDEO_PRIVATE]: 403, // Forbidden
    [YouTubeErrorCode.NO_TRANSCRIPT]: 400, // Bad Request (video doesn't meet requirements)
    [YouTubeErrorCode.AGE_RESTRICTED]: 400, // Bad Request (video doesn't meet requirements)
    [YouTubeErrorCode.RATE_LIMITED]: 429, // Too Many Requests
    [YouTubeErrorCode.NETWORK_ERROR]: 503, // Service Unavailable
    [YouTubeErrorCode.UNKNOWN_ERROR]: 500, // Internal Server Error
  };

  return statusMap[code] || 500;
}

/**
 * OPTIONS handler for CORS preflight requests
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
