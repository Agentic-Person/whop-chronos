/**
 * Whop Video Import API Endpoint
 *
 * POST /api/video/whop/import
 *
 * Imports videos from Whop MOOCs lessons.
 * Supports:
 * - Mux-hosted videos (mux_asset_id, mux_playback_id)
 * - Embedded videos (YouTube, Loom, Vimeo, Wistia)
 *
 * This endpoint:
 * 1. Accepts a Whop lesson ID
 * 2. Fetches lesson data from Whop API (requires SDK/GraphQL)
 * 3. Determines video type (Mux or embed)
 * 4. Saves to database with appropriate source_type
 * 5. For YouTube embeds, triggers transcript extraction
 * 6. For Mux videos, marks for future transcription support
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/db/client';
import { getLesson } from '@/lib/whop/api-client';
import { inngest } from '@/inngest/client';

/**
 * Request body schema
 */
interface ImportRequest {
  lessonId: string;
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
    source_type: string;
    status: string;
  };
}

interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
}

/**
 * POST /api/video/whop/import
 *
 * Import a video from Whop MOOCs lesson
 */
export async function POST(req: NextRequest): Promise<NextResponse<ImportResponse | ErrorResponse>> {
  try {
    // Parse request body
    const body: ImportRequest = await req.json();
    const { lessonId, creatorId } = body;

    // Validate required fields
    if (!lessonId || typeof lessonId !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing or invalid lessonId.',
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

    console.log('[Whop Import API] Starting import for lesson:', lessonId);
    console.log('[Whop Import API] Creator ID:', creatorId);

    // Step 1: Fetch lesson data from Whop using SDK
    const lesson = await getLesson(lessonId);

    if (!lesson) {
      return NextResponse.json(
        {
          success: false,
          error: 'Lesson not found or could not be retrieved from Whop.',
          code: 'LESSON_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Step 2: Determine video type and extract data
    let videoData: {
      title: string;
      description: string | null;
      duration_seconds: number | null;
      thumbnail_url: string | null;
      source_type: 'youtube' | 'mux' | 'loom';
      whop_lesson_id: string;
      // For Mux videos
      mux_asset_id?: string;
      mux_playback_id?: string;
      // For embeds
      embed_type?: 'youtube' | 'loom' | 'vimeo' | 'wistia';
      embed_id?: string;
      youtube_video_id?: string;
    };

    // Check if lesson has Mux video
    if (lesson.muxAsset && lesson.muxAssetId) {
      videoData = {
        title: lesson.title,
        description: lesson.content || null,
        duration_seconds: lesson.muxAsset.durationSeconds || null,
        thumbnail_url: lesson.muxAsset.thumbnailUrl || null,
        source_type: 'mux',
        whop_lesson_id: lessonId,
        mux_asset_id: lesson.muxAssetId,
        mux_playback_id: lesson.muxAsset.playbackId,
      };
    }
    // Check if lesson has embedded video
    else if (lesson.embedType && lesson.embedId) {
      // Map embed types to source types
      const sourceTypeMap: Record<string, 'youtube' | 'loom'> = {
        youtube: 'youtube',
        loom: 'loom',
        vimeo: 'loom', // Map vimeo to loom for now (both are embeds)
        wistia: 'loom', // Map wistia to loom for now
      };

      const sourceType = sourceTypeMap[lesson.embedType] || 'loom';

      videoData = {
        title: lesson.title,
        description: lesson.content || null,
        duration_seconds: null,
        thumbnail_url: null,
        source_type: sourceType,
        whop_lesson_id: lessonId,
        embed_type: lesson.embedType as 'youtube' | 'loom' | 'vimeo' | 'wistia',
        embed_id: lesson.embedId,
      };

      // For YouTube embeds, set youtube_video_id
      if (lesson.embedType === 'youtube') {
        videoData.youtube_video_id = lesson.embedId;
      }
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Lesson does not contain a video (no Mux asset or embed found).',
        },
        { status: 400 }
      );
    }

    console.log('[Whop Import API] Video data extracted:', {
      source_type: videoData.source_type,
      title: videoData.title,
      has_mux: !!videoData.mux_asset_id,
      has_embed: !!videoData.embed_type,
    });

    // Step 3: Save to database
    const supabase = getServiceSupabase();

    const { data: video, error: dbError } = await supabase
      .from('videos')
      .insert({
        creator_id: creatorId,
        source_type: videoData.source_type,
        title: videoData.title,
        description: videoData.description ?? null,
        duration_seconds: videoData.duration_seconds ?? null,
        thumbnail_url: videoData.thumbnail_url ?? null,
        whop_lesson_id: videoData.whop_lesson_id,
        mux_asset_id: videoData.mux_asset_id ?? null,
        mux_playback_id: videoData.mux_playback_id ?? null,
        embed_type: videoData.embed_type ?? null,
        embed_id: videoData.embed_id ?? null,
        youtube_video_id: videoData.youtube_video_id ?? null,
        status: (videoData.source_type === 'youtube' ? 'pending' : 'completed') as 'pending' | 'completed',
        metadata: {
          whop_import: true,
          lesson_type: lesson.lessonType,
          imported_at: new Date().toISOString(),
        },
      } as any) // Type assertion - database types may need regeneration
      .select('id, title, source_type, status')
      .single();

    if (dbError) {
      console.error('[Whop Import API] Database error:', dbError);

      // Check for duplicate video
      if (dbError.code === '23505') {
        return NextResponse.json(
          {
            success: false,
            error: 'This Whop lesson has already been imported.',
          },
          { status: 409 }
        );
      }

      throw new Error(`Database error: ${dbError.message}`);
    }

    if (!video) {
      throw new Error('Failed to create video record - no data returned');
    }

    // Type assertion since Supabase types may not be fully generated
    const videoRecord = video as {
      id: string;
      title: string;
      source_type: string;
      status: string;
    };

    console.log('[Whop Import API] Video saved to database:', {
      id: videoRecord.id,
      title: videoRecord.title,
      source_type: videoRecord.source_type,
      status: videoRecord.status,
    });

    // Step 4: Trigger processing if needed
    // Only trigger transcription for YouTube embeds
    if (videoData.source_type === 'youtube' && videoData.youtube_video_id) {
      console.log('[Whop Import API] Triggering YouTube transcript extraction for embed');

      // Trigger YouTube transcript extraction
      await inngest.send({
        name: 'video/youtube.import',
        data: {
          video_id: videoRecord.id,
          creator_id: creatorId,
          youtube_video_id: videoData.youtube_video_id,
        },
      });
    } else if (videoData.source_type === 'mux') {
      console.log('[Whop Import API] Mux video imported - transcription not yet supported');
      // TODO: Future - implement Mux transcription
    }

    // Step 5: Return success response
    return NextResponse.json(
      {
        success: true,
        video: {
          id: videoRecord.id,
          title: videoRecord.title,
          source_type: videoRecord.source_type,
          status: videoRecord.status,
        },
      },
      { status: 200 }
    );

  } catch (error) {
    // Catch-all error handler for unexpected errors
    console.error('[Whop Import API] Unexpected error:', error);

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
