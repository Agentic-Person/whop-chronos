/**
 * Admin API: Retry All Stuck Videos
 *
 * Bulk retry all videos stuck in processing states
 * This uses the same logic as the cron job (Agent 4)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/db/client';
import { inngest } from '@/inngest/client';

interface RetryResult {
  videoId: string;
  title: string;
  status: string;
  eventSent: string;
  success: boolean;
  error?: string;
}

export async function POST(_request: NextRequest) {
  try {
    const supabase = getServiceSupabase();

    // Query videos stuck in processing states
    // A video is considered "stuck" if it's been in a processing state for > 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

    const { data: stuckVideos, error } = await (supabase as any)
      .from('videos')
      .select('*')
      .in('status', ['pending', 'transcribing', 'processing', 'embedding'])
      .lt('created_at', tenMinutesAgo)
      .eq('is_deleted', false);

    if (error) {
      console.error('Error fetching stuck videos:', error);
      return NextResponse.json(
        { error: 'Failed to fetch stuck videos', details: error.message },
        { status: 500 }
      );
    }

    if (!stuckVideos || stuckVideos.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No stuck videos found',
        results: [],
        totalProcessed: 0,
        successCount: 0,
        failureCount: 0,
      });
    }

    // Process each stuck video
    const results: RetryResult[] = [];

    for (const video of stuckVideos as any[]) {
      try {
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

        // Clear error message
        await (supabase as any)
          .from('videos')
          .update({
            error_message: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', video.id);

        results.push({
          videoId: video.id,
          title: video.title,
          status: video.status,
          eventSent: eventName,
          success: true,
        });

      } catch (error) {
        console.error(`Error retrying video ${video.id}:`, error);
        results.push({
          videoId: video.id,
          title: video.title,
          status: video.status,
          eventSent: 'none',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `Processed ${stuckVideos.length} stuck videos`,
      results,
      totalProcessed: stuckVideos.length,
      successCount,
      failureCount,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error in retry-all-stuck endpoint:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
