/**
 * Admin API: Get Stuck Videos
 *
 * Returns all videos that are stuck in processing states with detailed diagnostic info
 * Used by the admin debug panel to identify and troubleshoot processing issues
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/db/client';

interface StuckVideoInfo {
  id: string;
  title: string;
  status: string;
  created_at: string;
  updated_at: string;
  processing_started_at: string | null;
  processing_completed_at: string | null;
  error_message: string | null;
  thumbnail_url: string | null;
  source_type: string;
  duration_seconds: number | null;
  stuck_duration_minutes: number;
  has_transcript: boolean;
  chunk_count: number;
  transcript_preview: string | null;
  creator_id: string;
}

export async function GET(_request: NextRequest) {
  try {
    const supabase = getServiceSupabase();

    // Query videos stuck in processing states
    // A video is considered "stuck" if it's been in a processing state for > 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

    const { data: videos, error } = await (supabase as any)
      .from('videos')
      .select(`
        id,
        title,
        status,
        created_at,
        updated_at,
        processing_started_at,
        processing_completed_at,
        error_message,
        thumbnail_url,
        source_type,
        duration_seconds,
        transcript,
        creator_id
      `)
      .in('status', ['pending', 'transcribing', 'processing', 'embedding'])
      .lt('created_at', tenMinutesAgo)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching stuck videos:', error);
      return NextResponse.json(
        { error: 'Failed to fetch stuck videos', details: error.message },
        { status: 500 }
      );
    }

    // Get chunk counts for each video
    const videoIds = videos.map((v: any) => v.id);
    const { data: chunks, error: chunksError } = await (supabase as any)
      .from('video_chunks')
      .select('video_id')
      .in('video_id', videoIds);

    if (chunksError) {
      console.error('Error fetching chunk counts:', chunksError);
    }

    // Build chunk count map
    const chunkCounts = new Map<string, number>();
    chunks?.forEach((chunk: any) => {
      chunkCounts.set(chunk.video_id, (chunkCounts.get(chunk.video_id) || 0) + 1);
    });

    // Format stuck videos with diagnostic info
    const stuckVideos: StuckVideoInfo[] = videos.map((video: any) => {
      const createdAt = new Date(video.created_at);
      const now = new Date();
      const stuckDurationMs = now.getTime() - createdAt.getTime();
      const stuckDurationMinutes = Math.floor(stuckDurationMs / (1000 * 60));

      const transcriptPreview = video.transcript
        ? video.transcript.substring(0, 200) + '...'
        : null;

      return {
        id: video.id,
        title: video.title,
        status: video.status,
        created_at: video.created_at,
        updated_at: video.updated_at,
        processing_started_at: video.processing_started_at,
        processing_completed_at: video.processing_completed_at,
        error_message: video.error_message,
        thumbnail_url: video.thumbnail_url,
        source_type: video.source_type,
        duration_seconds: video.duration_seconds,
        stuck_duration_minutes: stuckDurationMinutes,
        has_transcript: !!video.transcript,
        chunk_count: chunkCounts.get(video.id) || 0,
        transcript_preview: transcriptPreview,
        creator_id: video.creator_id,
      };
    });

    // Sort by stuck duration (longest stuck first)
    stuckVideos.sort((a, b) => b.stuck_duration_minutes - a.stuck_duration_minutes);

    return NextResponse.json({
      success: true,
      data: stuckVideos,
      count: stuckVideos.length,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error in stuck-videos endpoint:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
