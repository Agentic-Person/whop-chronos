/**
 * Course Analytics Query API
 *
 * GET /api/analytics/courses/[id] - Get analytics for entire course
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/db/client';

export const runtime = 'nodejs';

/**
 * GET /api/analytics/courses/[id]
 *
 * Get analytics for an entire course
 *
 * Query parameters:
 * - period: '7d' | '30d' | '90d' | 'all' (optional, default: '30d')
 * - creator_id: string (required for authorization)
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     course_id: string,
 *     course_title: string,
 *     total_views: number,
 *     unique_students: number,
 *     avg_progress: number,
 *     completion_rate: number,
 *     top_videos: [...],
 *     module_performance: [...]
 *   }
 * }
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: courseId } = await params;
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || '30d';
    const creatorId = searchParams.get('creator_id');

    if (!courseId) {
      return NextResponse.json(
        { error: 'Missing course ID' },
        { status: 400 },
      );
    }

    if (!creatorId) {
      return NextResponse.json(
        { error: 'Missing creator_id parameter' },
        { status: 400 },
      );
    }

    const supabase = getServiceSupabase();

    // Verify course exists and user owns it
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select(
        `
        id,
        creator_id,
        title,
        course_modules (
          id,
          title,
          video_ids
        )
      `,
      )
      .eq('id', courseId)
      .eq('is_deleted', false)
      .single();

    if (courseError || !course) {
      return NextResponse.json(
        { error: 'Course not found', code: 'COURSE_NOT_FOUND' },
        { status: 404 },
      );
    }

    // Check authorization
    if (course.creator_id !== creatorId) {
      return NextResponse.json(
        { error: 'Forbidden: You do not own this course', code: 'FORBIDDEN' },
        { status: 403 },
      );
    }

    // Get all video IDs from all modules
    const modules = course.course_modules || [];
    const allVideoIds = modules.flatMap(
      (module: { video_ids: string[] }) => module.video_ids || [],
    );
    const uniqueVideoIds = [...new Set(allVideoIds)];

    if (uniqueVideoIds.length === 0) {
      return NextResponse.json(
        {
          success: true,
          data: {
            course_id: courseId,
            course_title: course.title,
            total_views: 0,
            unique_students: 0,
            avg_progress: 0,
            completion_rate: 0,
            top_videos: [],
            module_performance: [],
          },
        },
        { status: 200 },
      );
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    if (period !== 'all') {
      const days = Number.parseInt(period.replace('d', ''), 10);
      startDate.setDate(startDate.getDate() - days);
    } else {
      startDate.setFullYear(2020);
    }

    // Fetch analytics for all videos in course
    let query = supabase
      .from('video_analytics')
      .select('video_id, date, views, unique_viewers, completion_rate, total_watch_time_seconds')
      .in('video_id', uniqueVideoIds);

    if (period !== 'all') {
      query = query
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0]);
    }

    const { data: analytics, error } = await query;

    if (error) {
      console.error('Error fetching course analytics:', error);
      return NextResponse.json(
        { error: 'Failed to fetch analytics', code: 'FETCH_FAILED' },
        { status: 500 },
      );
    }

    // Aggregate metrics by video
    const videoMetrics: Record<
      string,
      {
        views: number;
        unique_viewers: Set<string>;
        completion_rate: number;
        watch_time: number;
      }
    > = {};

    for (const row of analytics || []) {
      if (!videoMetrics[row.video_id]) {
        videoMetrics[row.video_id] = {
          views: 0,
          unique_viewers: new Set(),
          completion_rate: 0,
          watch_time: 0,
        };
      }

      videoMetrics[row.video_id].views += row.views || 0;
      videoMetrics[row.video_id].watch_time += row.total_watch_time_seconds || 0;

      // Track completion rate (average across days)
      if (row.completion_rate) {
        videoMetrics[row.video_id].completion_rate =
          (videoMetrics[row.video_id].completion_rate + row.completion_rate) / 2;
      }
    }

    // Calculate course-level metrics
    const totalViews = Object.values(videoMetrics).reduce(
      (sum, video) => sum + video.views,
      0,
    );
    const avgCompletionRate =
      Object.values(videoMetrics).reduce((sum, video) => sum + video.completion_rate, 0) /
      Math.max(Object.keys(videoMetrics).length, 1);

    // Fetch video details for top videos
    const { data: videos } = await supabase
      .from('videos')
      .select('id, title, thumbnail_url, duration_seconds')
      .in('id', uniqueVideoIds)
      .eq('is_deleted', false);

    const videosMap = new Map(videos?.map((v) => [v.id, v]) || []);

    // Build top videos list
    const topVideos = Object.entries(videoMetrics)
      .map(([videoId, metrics]) => {
        const video = videosMap.get(videoId);
        return {
          video_id: videoId,
          title: video?.title || 'Unknown',
          thumbnail_url: video?.thumbnail_url,
          views: metrics.views,
          completion_rate: Math.round(metrics.completion_rate * 100) / 100,
          watch_time_seconds: metrics.watch_time,
        };
      })
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    // Build module performance
    const modulePerformance = modules.map((module: { id: string; title: string; video_ids: string[] }) => {
      const moduleVideoIds = module.video_ids || [];
      const moduleViews = moduleVideoIds.reduce(
        (sum, videoId) => sum + (videoMetrics[videoId]?.views || 0),
        0,
      );
      const moduleCompletionRate =
        moduleVideoIds.reduce(
          (sum, videoId) => sum + (videoMetrics[videoId]?.completion_rate || 0),
          0,
        ) / Math.max(moduleVideoIds.length, 1);

      return {
        module_id: module.id,
        title: module.title,
        video_count: moduleVideoIds.length,
        total_views: moduleViews,
        avg_completion_rate: Math.round(moduleCompletionRate * 100) / 100,
      };
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          course_id: courseId,
          course_title: course.title,
          period,
          total_views: totalViews,
          unique_students: 0, // Would need student tracking to implement
          avg_progress: 0, // Would need progress tracking to implement
          completion_rate: Math.round(avgCompletionRate * 100) / 100,
          video_count: uniqueVideoIds.length,
          module_count: modules.length,
          top_videos: topVideos,
          module_performance: modulePerformance,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Course analytics API error:', error);
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
