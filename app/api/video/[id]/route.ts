/**
 * Video Detail API
 *
 * GET    /api/video/[id] - Get video details
 * PATCH  /api/video/[id] - Update video metadata
 * DELETE /api/video/[id] - Delete video
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/db/client';
import type { Database } from '@/lib/db/types';
import {
  deleteVideoFile,
  deleteThumbnailFile,
  getVideoDownloadUrl,
} from '@/lib/video/storage';

type VideoUpdate = Database['public']['Tables']['videos']['Update'];

export const runtime = 'nodejs';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/video/[id]
 *
 * Get detailed video information including signed download URL
 */
export async function GET(
  req: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(req.url);
    const includeDownloadUrl = searchParams.get('includeDownloadUrl') === 'true';

    const supabase = getServiceSupabase();

    // Fetch video with all fields including multi-source support
    const { data: video, error } = await supabase
      .from('videos')
      .select(`
        *,
        youtube_video_id,
        youtube_channel_id,
        mux_asset_id,
        mux_playback_id,
        embed_type,
        embed_id,
        source_type
      `)
      .eq('id', id)
      .eq('is_deleted', false)
      .single();

    if (error || !video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 },
      );
    }

    // Generate download URL if requested and video is ready
    let downloadUrl: string | null = null;
    if (includeDownloadUrl && (video as any).storage_path && (video as any).status === 'completed') {
      downloadUrl = await getVideoDownloadUrl((video as any).storage_path);
    }

    // Get video chunks count
    const { count: chunksCount } = await supabase
      .from('video_chunks')
      .select('*', { count: 'exact', head: true })
      .eq('video_id', id);

    // Format response with multi-source support fields
    return NextResponse.json(
      {
        success: true,
        data: {
          id: (video as any).id,
          creatorId: (video as any).creator_id,
          title: (video as any).title,
          description: (video as any).description,
          status: (video as any).status,
          duration: (video as any).duration_seconds,
          fileSize: (video as any).file_size_bytes,
          thumbnailUrl: (video as any).thumbnail_url,
          downloadUrl,
          transcript: (video as any).transcript,
          transcriptLanguage: (video as any).transcript_language,
          chunksCount: chunksCount || 0,
          // Multi-source video fields
          sourceType: (video as any).source_type,
          youtubeVideoId: (video as any).youtube_video_id,
          youtubeChannelId: (video as any).youtube_channel_id,
          muxAssetId: (video as any).mux_asset_id,
          muxPlaybackId: (video as any).mux_playback_id,
          embedType: (video as any).embed_type,
          embedId: (video as any).embed_id,
          url: (video as any).url,
          storagePath: (video as any).storage_path,
          // Timestamps
          createdAt: (video as any).created_at,
          updatedAt: (video as any).updated_at,
          processingStartedAt: (video as any).processing_started_at,
          processingCompletedAt: (video as any).processing_completed_at,
          errorMessage: (video as any).error_message,
          metadata: (video as any).metadata,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Get video API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/video/[id]
 *
 * Update video metadata (title, description)
 */
export async function PATCH(
  req: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { title, description } = body;

    // Validate at least one field to update
    if (!title && !description) {
      return NextResponse.json(
        { error: 'No fields to update. Provide title or description' },
        { status: 400 },
      );
    }

    const supabase = getServiceSupabase();

    // Check if video exists
    const { data: existingVideo, error: fetchError } = await supabase
      .from('videos')
      .select('id, creator_id')
      .eq('id', id)
      .eq('is_deleted', false)
      .single();

    if (fetchError || !existingVideo) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 },
      );
    }

    // Update video
    const updateData: VideoUpdate = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;

    const { data: updatedVideo, error: updateError } = await (supabase as any)
      .from('videos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError || !updatedVideo) {
      console.error('Error updating video:', updateError);
      return NextResponse.json(
        { error: 'Failed to update video' },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Video updated successfully',
        data: {
          id: updatedVideo.id,
          title: updatedVideo.title,
          description: updatedVideo.description,
          updatedAt: updatedVideo.updated_at,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Update video API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/video/[id]
 *
 * Soft delete video and cleanup storage
 */
export async function DELETE(
  req: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(req.url);
    const hardDelete = searchParams.get('hard') === 'true'; // Permanent deletion

    const supabase = getServiceSupabase();

    // Fetch video to get storage paths
    const { data: video, error: fetchError } = await supabase
      .from('videos')
      .select('*')
      .eq('id', id)
      .eq('is_deleted', false)
      .single();

    if (fetchError || !video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 },
      );
    }

    if (hardDelete) {
      // Hard delete: Remove from storage and database
      const deletePromises: Promise<boolean>[] = [];

      // Delete video file
      if ((video as any).storage_path) {
        deletePromises.push(deleteVideoFile((video as any).storage_path));
      }

      // Delete thumbnail
      if ((video as any).thumbnail_url) {
        // Extract path from URL
        const thumbnailPath = (video as any).thumbnail_url.split('/').slice(-3).join('/');
        deletePromises.push(deleteThumbnailFile(thumbnailPath));
      }

      // Wait for storage cleanup
      await Promise.allSettled(deletePromises);

      // Delete video chunks (cascades via foreign key)
      // Delete video record
      const { error: deleteError } = await supabase
        .from('videos')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('Error deleting video:', deleteError);
        return NextResponse.json(
          { error: 'Failed to delete video from database' },
          { status: 500 },
        );
      }

      return NextResponse.json(
        {
          success: true,
          message: 'Video permanently deleted',
        },
        { status: 200 },
      );
    }

    // Soft delete: Mark as deleted
    const { error: updateError } = await (supabase as any)
      .from('videos')
      .update({ is_deleted: true })
      .eq('id', id);

    if (updateError) {
      console.error('Error soft deleting video:', updateError);
      return NextResponse.json(
        { error: 'Failed to delete video' },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Video deleted successfully',
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Delete video API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
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
      'Access-Control-Allow-Methods': 'GET, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
