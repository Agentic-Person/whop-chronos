/**
 * API endpoint to trigger video transcription
 * Example endpoint showing how to integrate the transcription service
 */

import { NextRequest, NextResponse } from 'next/server';
import { inngest } from '@/inngest/client';
import { createClient } from '@supabase/supabase-js';
import { checkUsageLimits } from '@/lib/video/cost-tracker';

/**
 * Initialize Supabase client with service role key
 */
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase credentials');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * POST /api/video/transcribe
 * Trigger transcription for an uploaded video
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { videoId, creatorId, language } = body;

    // Validate required fields
    if (!videoId || !creatorId) {
      return NextResponse.json(
        { error: 'Missing required fields: videoId, creatorId' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // 1. Get video and creator details
    const [videoResult, creatorResult] = await Promise.all([
      supabase
        .from('videos')
        .select('*')
        .eq('id', videoId)
        .single(),
      supabase
        .from('creators')
        .select('*')
        .eq('id', creatorId)
        .single(),
    ]);

    if (videoResult.error || !videoResult.data) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    if (creatorResult.error || !creatorResult.data) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 }
      );
    }

    const video = videoResult.data;
    const creator = creatorResult.data;

    // 2. Check if video is already processed or processing
    if (video.status === 'completed') {
      return NextResponse.json(
        { error: 'Video already transcribed' },
        { status: 400 }
      );
    }

    if (['transcribing', 'processing', 'embedding'].includes(video.status)) {
      return NextResponse.json(
        { error: 'Video is already being processed' },
        { status: 400 }
      );
    }

    // 3. Check usage limits
    const usageCheck = await checkUsageLimits(
      creatorId,
      creator.subscription_tier as 'basic' | 'pro' | 'enterprise'
    );

    if (!usageCheck.withinLimits) {
      return NextResponse.json(
        {
          error: 'Usage limit exceeded',
          limits: usageCheck.limits,
          usage: usageCheck.usage,
        },
        { status: 429 }
      );
    }

    // 4. Validate storage path exists
    if (!video.storage_path) {
      return NextResponse.json(
        { error: 'Video file not uploaded' },
        { status: 400 }
      );
    }

    // 5. Extract original filename from storage path or title
    const originalFilename = video.storage_path.split('/').pop() || `${video.title}.mp4`;

    // 6. Send Inngest event to start transcription
    await inngest.send({
      name: 'video/transcribe.requested',
      data: {
        videoId,
        creatorId,
        storagePath: video.storage_path,
        originalFilename,
        language: language || video.transcript_language || undefined,
      },
    });

    // 7. Update video status to pending (will be updated to transcribing by Inngest)
    const { error: updateError } = await supabase
      .from('videos')
      .update({
        status: 'pending',
      })
      .eq('id', videoId);

    if (updateError) {
      console.error('Failed to update video status:', updateError);
      // Don't fail the request - transcription is already queued
    }

    return NextResponse.json({
      success: true,
      videoId,
      status: 'queued',
      message: 'Transcription started',
      estimatedTime: video.duration_seconds
        ? `${Math.ceil(video.duration_seconds / 10)} seconds`
        : 'Unknown',
    });
  } catch (error) {
    console.error('[Transcription API] Error:', error);

    return NextResponse.json(
      {
        error: 'Failed to start transcription',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/video/transcribe?videoId=xxx
 * Get transcription status
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const videoId = searchParams.get('videoId');

    if (!videoId) {
      return NextResponse.json(
        { error: 'Missing videoId parameter' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    const { data: video, error } = await supabase
      .from('videos')
      .select('id, title, status, transcript, transcript_language, duration_seconds, error_message, metadata')
      .eq('id', videoId)
      .single();

    if (error || !video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    // Calculate progress percentage based on status
    const statusProgress: Record<string, number> = {
      pending: 0,
      uploading: 20,
      transcribing: 40,
      processing: 60,
      embedding: 80,
      completed: 100,
      failed: 0,
    };

    return NextResponse.json({
      videoId: video.id,
      title: video.title,
      status: video.status,
      progress: statusProgress[video.status] || 0,
      transcript: video.transcript || null,
      language: video.transcript_language || null,
      duration: video.duration_seconds || null,
      error: video.error_message || null,
      cost: video.metadata?.transcription_cost || null,
      segmentCount: video.metadata?.segment_count || null,
    });
  } catch (error) {
    console.error('[Transcription Status API] Error:', error);

    return NextResponse.json(
      {
        error: 'Failed to get transcription status',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
