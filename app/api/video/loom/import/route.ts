/**
 * Loom Video Import API Endpoint
 *
 * POST /api/video/loom/import
 *
 * Accepts a Loom URL, extracts video metadata and transcript using Loom API,
 * and saves to the database for processing.
 *
 * This endpoint:
 * 1. Validates the Loom URL format
 * 2. Extracts video ID and metadata (title, duration, thumbnail, creator info)
 * 3. Extracts full transcript with timestamps
 * 4. Saves to database with source_type='loom'
 * 5. Returns video ID and status for frontend tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/db/client';
import {
  processLoomVideo,
  LoomProcessorError,
  LoomErrorCode,
  getErrorMessage
} from '@/lib/video/loom-processor';
import { inngest } from '@/inngest/client';

/**
 * Request body schema
 */
interface ImportRequest {
  videoUrl: string;
  creatorId: string;
  title?: string;
}

/**
 * Response body schema
 */
interface ImportResponse {
  success: true;
  video: {
    id: string;
    title: string;
    loom_video_id: string;
    status: string;
  };
}

interface ErrorResponse {
  success: false;
  error: string;
  code?: LoomErrorCode;
}

/**
 * POST /api/video/loom/import
 *
 * Import a Loom video by URL
 */
export async function POST(req: NextRequest): Promise<NextResponse<ImportResponse | ErrorResponse>> {
  try {
    // Parse request body
    const body: ImportRequest = await req.json();
    const { videoUrl, creatorId, title } = body;

    // Validate required fields
    if (!videoUrl || typeof videoUrl !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing or invalid videoUrl. Please provide a valid Loom URL.',
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

    console.log('[Loom Import API] Starting import for URL:', videoUrl);
    console.log('[Loom Import API] Creator ID:', creatorId);

    // Step 1: Process Loom video (extract metadata + transcript)
    let loomData;
    try {
      loomData = await processLoomVideo(videoUrl.trim(), creatorId);
    } catch (error) {
      // Handle Loom-specific errors with appropriate status codes
      if (error instanceof LoomProcessorError) {
        const statusCode = getStatusCodeForError(error.code);
        const userMessage = getErrorMessage(error);

        console.error('[Loom Import API] Loom processing error:', {
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

    console.log('[Loom Import API] Successfully extracted video data:', {
      videoId: loomData.videoId,
      title: loomData.title,
      duration: loomData.duration,
      transcriptLength: loomData.transcript.length,
    });

    // Step 2: Save to database
    const supabase = getServiceSupabase();

    const { data: video, error: dbError } = await (supabase as any)
      .from('videos')
      .insert({
        creator_id: creatorId,
        source_type: 'loom',
        loom_video_id: loomData.videoId,
        title: title || loomData.title,
        description: loomData.description,
        duration_seconds: loomData.duration,
        thumbnail_url: loomData.thumbnail,
        transcript: loomData.transcript,
        status: 'transcribing', // Will be updated to 'processing' by chunking job
        metadata: {
          creator_name: loomData.creatorName,
          creator_email: loomData.creatorEmail,
          source_url: videoUrl.trim(),
          import_type: 'loom',
          imported_at: new Date().toISOString(),
          transcript_segments: loomData.transcriptWithTimestamps.length,
          download_url: loomData.downloadUrl,
        },
      })
      .select('id, title, status')
      .single();

    if (dbError) {
      console.error('[Loom Import API] Database error:', dbError);

      // Check for duplicate video
      if (dbError.code === '23505') { // PostgreSQL unique constraint violation
        return NextResponse.json(
          {
            success: false,
            error: 'This Loom video has already been imported.',
          },
          { status: 409 }
        );
      }

      throw new Error(`Database error: ${dbError.message}`);
    }

    if (!video) {
      throw new Error('Failed to create video record - no data returned');
    }

    console.log('[Loom Import API] Video saved to database:', {
      id: video.id,
      title: video.title,
      status: video.status,
    });

    // Step 3: Trigger Inngest job to chunk transcript and generate embeddings
    console.log('[Loom Import API] Triggering chunking/embedding job');
    await inngest.send({
      name: 'video/transcription.completed',
      data: {
        video_id: video.id,
        creator_id: creatorId,
        transcript: loomData.transcript,
      },
    });

    // Step 4: Return success response
    return NextResponse.json(
      {
        success: true,
        video: {
          id: video.id,
          title: video.title,
          loom_video_id: loomData.videoId,
          status: video.status,
        },
      },
      { status: 200 }
    );

  } catch (error) {
    // Catch-all error handler for unexpected errors
    console.error('[Loom Import API] Unexpected error:', error);

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
 * Map Loom error codes to HTTP status codes
 */
function getStatusCodeForError(code: LoomErrorCode): number {
  const statusMap: Record<LoomErrorCode, number> = {
    [LoomErrorCode.INVALID_URL]: 400, // Bad Request
    [LoomErrorCode.VIDEO_NOT_FOUND]: 404, // Not Found
    [LoomErrorCode.VIDEO_PRIVATE]: 403, // Forbidden
    [LoomErrorCode.NO_TRANSCRIPT]: 400, // Bad Request
    [LoomErrorCode.API_KEY_MISSING]: 500, // Internal Server Error
    [LoomErrorCode.API_KEY_INVALID]: 500, // Internal Server Error
    [LoomErrorCode.RATE_LIMITED]: 429, // Too Many Requests
    [LoomErrorCode.NETWORK_ERROR]: 503, // Service Unavailable
    [LoomErrorCode.UNKNOWN_ERROR]: 500, // Internal Server Error
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
