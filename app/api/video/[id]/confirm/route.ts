/**
 * Video Upload Confirmation API
 *
 * POST /api/video/[id]/confirm
 * - Confirms video file has been uploaded to storage
 * - Validates file exists and has proper size
 * - Updates video status from 'uploading' to 'pending'
 * - Triggers Inngest transcription job
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/db/client';
import { inngest } from '@/inngest/client';

export const runtime = 'nodejs';
export const maxDuration = 60; // 1 minute

interface ConfirmResponse {
  success: boolean;
  video: {
    id: string;
    title: string;
    status: string;
  };
  processing: {
    jobId: string;
    estimatedTime: string;
  };
}

interface ErrorResponse {
  error: string;
  details?: string;
}

/**
 * POST /api/video/[id]/confirm
 *
 * Confirm video upload and trigger processing pipeline
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse<ConfirmResponse | ErrorResponse>> {
  try {
    const { id: videoId } = await context.params;

    if (!videoId) {
      return NextResponse.json(
        { error: 'Missing video ID' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Get video record
    const { data: video, error: videoError } = await supabase
      .from('videos')
      .select('*')
      .eq('id', videoId)
      .single();

    if (videoError || !video) {
      console.error('Error fetching video:', videoError);
      return NextResponse.json(
        {
          error: 'Video not found',
          details: videoError?.message,
        },
        { status: 404 }
      );
    }

    // Validate video is in uploading state
    if (video.status !== 'uploading') {
      return NextResponse.json(
        {
          error: 'Video is not in uploading state',
          details: `Current status: ${video.status}`,
        },
        { status: 400 }
      );
    }

    // Verify storage path exists
    if (!video.storage_path) {
      return NextResponse.json(
        {
          error: 'Video storage path not set',
          details: 'Upload was not properly initialized',
        },
        { status: 400 }
      );
    }

    // Verify file exists in storage and has valid size
    const { data: fileData, error: storageError } = await supabase.storage
      .from('videos')
      .list(video.storage_path.split('/').slice(0, -1).join('/'), {
        search: video.storage_path.split('/').pop(),
      });

    if (storageError || !fileData || fileData.length === 0) {
      console.error('Error verifying file in storage:', storageError);
      return NextResponse.json(
        {
          error: 'Video file not found in storage',
          details: storageError?.message || 'File does not exist',
        },
        { status: 404 }
      );
    }

    const uploadedFile = fileData[0];
    const fileSizeBytes = uploadedFile?.metadata?.size || 0;

    if (fileSizeBytes === 0) {
      return NextResponse.json(
        {
          error: 'Video file is empty',
          details: 'Upload may have failed or been interrupted',
        },
        { status: 400 }
      );
    }

    // Update video record to pending status
    const { error: updateError } = await supabase
      .from('videos')
      .update({
        status: 'pending',
        file_size_bytes: fileSizeBytes,
        metadata: {
          ...(video.metadata as Record<string, unknown>),
          upload_confirmed_at: new Date().toISOString(),
          actual_file_size_bytes: fileSizeBytes,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', videoId);

    if (updateError) {
      console.error('Error updating video status:', updateError);
      return NextResponse.json(
        {
          error: 'Failed to update video status',
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    // Send Inngest event to trigger transcription
    try {
      const inngestResult = await inngest.send({
        name: 'video/transcribe.requested',
        data: {
          videoId: video.id,
          creatorId: video.creator_id,
          storagePath: video.storage_path,
          originalFilename:
            (video.metadata as { original_filename?: string })
              ?.original_filename || 'video',
        },
      });

      console.log('Inngest event sent:', inngestResult);

      // Calculate estimated processing time (rough estimate: 1 minute per 10 minutes of video)
      // For now, use a conservative estimate based on file size
      const estimatedMinutes = Math.ceil(fileSizeBytes / (1024 * 1024 * 100)); // 1 min per 100MB
      const estimatedTime =
        estimatedMinutes <= 1
          ? '1-2 minutes'
          : estimatedMinutes <= 5
            ? '2-5 minutes'
            : '5-10 minutes';

      return NextResponse.json(
        {
          success: true,
          video: {
            id: video.id,
            title: video.title,
            status: 'pending',
          },
          processing: {
            jobId: inngestResult.ids[0] || 'unknown',
            estimatedTime,
          },
        },
        { status: 200 }
      );
    } catch (inngestError) {
      console.error('Error sending Inngest event:', inngestError);

      // Revert video status back to uploading
      await supabase
        .from('videos')
        .update({
          status: 'uploading',
          metadata: {
            ...(video.metadata as Record<string, unknown>),
            inngest_error: inngestError instanceof Error ? inngestError.message : 'Unknown error',
            inngest_error_at: new Date().toISOString(),
          },
        })
        .eq('id', videoId);

      return NextResponse.json(
        {
          error: 'Failed to trigger video processing',
          details:
            inngestError instanceof Error
              ? inngestError.message
              : 'Unknown error',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Confirm upload API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
