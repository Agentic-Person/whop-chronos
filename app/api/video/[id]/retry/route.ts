/**
 * Video Retry API
 *
 * Manually retry processing for a single stuck video
 * Re-sends Inngest events based on current video state
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/db/client';
import { inngest } from '@/inngest/client';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getServiceSupabase();

    // Fetch video details
    const { data: video, error } = await supabase
      .from('videos')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !video) {
      return NextResponse.json(
        { error: 'Video not found', details: error?.message },
        { status: 404 }
      );
    }

    // Check if video is actually stuck
    const processingStates = ['pending', 'transcribing', 'processing', 'embedding'];
    if (!processingStates.includes(video.status)) {
      return NextResponse.json(
        { error: 'Video is not in a processing state', status: video.status },
        { status: 400 }
      );
    }

    // Determine which Inngest event to send based on video state
    let eventName = 'video/transcribe.requested';
    let eventData: Record<string, unknown> = {
      videoId: video.id,
      creatorId: video.creator_id,
    };

    // If video has transcript, skip to chunking
    if (video.transcript && video.status === 'transcribing') {
      eventName = 'video/chunks.requested';
      eventData = {
        videoId: video.id,
        creatorId: video.creator_id,
        transcript: video.transcript,
      };
    }
    // If video is stuck in embedding, retry embedding
    else if (video.status === 'embedding') {
      eventName = 'video/embeddings.requested';
      eventData = {
        videoId: video.id,
        creatorId: video.creator_id,
      };
    }

    // Send Inngest event
    await inngest.send({
      name: eventName,
      data: eventData,
    });

    // Update video status to show retry attempt
    const { error: updateError } = await supabase
      .from('videos')
      .update({
        error_message: null, // Clear previous errors
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating video after retry:', updateError);
    }

    return NextResponse.json({
      success: true,
      message: 'Retry initiated',
      video: {
        id: video.id,
        title: video.title,
        status: video.status,
        eventSent: eventName,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error retrying video:', error);
    return NextResponse.json(
      {
        error: 'Failed to retry video',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
