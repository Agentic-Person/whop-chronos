/**
 * Video List API
 *
 * GET /api/video/list
 * - List videos for a creator with filtering and pagination
 * - Support filtering by status, date range
 * - Include processing status and metadata
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/db/client';

export const runtime = 'nodejs';

interface VideoListFilters {
  creatorId: string;
  status?: string | string[];
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'created_at' | 'updated_at' | 'title';
  sortOrder?: 'asc' | 'desc';
}

/**
 * GET /api/video/list
 *
 * List videos with filtering and pagination
 *
 * Query parameters:
 * - creatorId: string (required)
 * - status: string | string[] (optional) - Filter by processing status
 * - dateFrom: string (optional) - ISO date string
 * - dateTo: string (optional) - ISO date string
 * - search: string (optional) - Search in title/description
 * - page: number (optional, default: 1)
 * - limit: number (optional, default: 20, max: 100)
 * - sortBy: string (optional, default: 'created_at')
 * - sortOrder: 'asc' | 'desc' (optional, default: 'desc')
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Extract filters
    const creatorId = searchParams.get('creatorId');
    const status = searchParams.getAll('status'); // Support multiple status filters
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const search = searchParams.get('search');
    const page = Number.parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(
      Number.parseInt(searchParams.get('limit') || '20', 10),
      100,
    ); // Max 100
    const sortBy = (searchParams.get('sortBy') ||
      'created_at') as VideoListFilters['sortBy'];
    const sortOrder = (searchParams.get('sortOrder') ||
      'desc') as VideoListFilters['sortOrder'];

    // Validate required fields
    if (!creatorId) {
      return NextResponse.json(
        { error: 'Missing required field: creatorId' },
        { status: 400 },
      );
    }

    const supabase = getServiceSupabase();

    // Build query
    let query = supabase
      .from('videos')
      .select('*', { count: 'exact' })
      .eq('creator_id', creatorId)
      .eq('is_deleted', false);

    // Apply status filter
    if (status.length > 0) {
      query = query.in('status', status);
    }

    // Apply date range filter
    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }
    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }

    // Apply search filter (title or description)
    if (search) {
      query = query.or(
        `title.ilike.%${search}%,description.ilike.%${search}%`,
      );
    }

    // Apply sorting
    query = query.order(sortBy || 'created_at', {
      ascending: sortOrder === 'asc',
    });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    // Execute query
    const { data: videos, error, count } = await query;

    if (error) {
      console.error('Error fetching videos:', error);
      return NextResponse.json(
        { error: 'Failed to fetch videos' },
        { status: 500 },
      );
    }

    // Calculate pagination info
    const totalPages = Math.ceil((count || 0) / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    // Format response
    const formattedVideos = videos?.map((video) => ({
      id: video.id,
      title: video.title,
      description: video.description,
      status: video.status,
      duration: video.duration_seconds,
      fileSize: video.file_size_bytes,
      thumbnailUrl: video.thumbnail_url,
      createdAt: video.created_at,
      updatedAt: video.updated_at,
      processingStartedAt: video.processing_started_at,
      processingCompletedAt: video.processing_completed_at,
      errorMessage: video.error_message,
      metadata: video.metadata,
      // Processing progress
      progress: calculateProgress(video.status),
    }));

    return NextResponse.json(
      {
        success: true,
        data: formattedVideos || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages,
          hasNextPage,
          hasPreviousPage,
        },
        filters: {
          status: status.length > 0 ? status : undefined,
          dateFrom,
          dateTo,
          search,
          sortBy,
          sortOrder,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Video list API error:', error);
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
 * Calculate processing progress percentage based on status
 */
function calculateProgress(
  status: string,
): { percentage: number; stage: string } {
  const stages = {
    pending: { percentage: 0, stage: 'Waiting to start' },
    uploading: { percentage: 10, stage: 'Uploading video' },
    transcribing: { percentage: 30, stage: 'Transcribing audio' },
    processing: { percentage: 50, stage: 'Processing transcript' },
    embedding: { percentage: 70, stage: 'Generating embeddings' },
    completed: { percentage: 100, stage: 'Ready' },
    failed: { percentage: 0, stage: 'Failed' },
  };

  return (
    stages[status as keyof typeof stages] || {
      percentage: 0,
      stage: 'Unknown',
    }
  );
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
