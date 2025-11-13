/**
 * Video Analytics Query API
 *
 * GET /api/analytics/videos/[id] - Get analytics for specific video
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/db/client';

export const runtime = 'nodejs';

/**
 * GET /api/analytics/videos/[id]
 *
 * Get analytics for a specific video
 *
 * Query parameters:
 * - period: '7d' | '30d' | '90d' | 'all' (optional, default: '30d')
 * - creator_id: string (required for authorization)
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     video_id: string,
 *     total_views: number,
 *     unique_viewers: number,
 *     completion_rate: number,
 *     avg_watch_time: number,
 *     engagement_score: number,
 *     views_over_time: [...],
 *     period: string
 *   }
 * }
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: videoId } = await params;
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || '30d';
    const creatorId = searchParams.get('creator_id');

    if (!videoId) {
      return NextResponse.json(
        { error: 'Missing video ID' },
        { status: 400 },
      );
    }

    if (!creatorId) {
      return NextResponse.json(
        { error: 'Missing creator_id parameter' },
        { status: 400 },
      );
    }

    // Validate period
    const validPeriods = ['7d', '30d', '90d', 'all'];
    if (!validPeriods.includes(period)) {
      return NextResponse.json(
        { error: `Invalid period. Must be one of: ${validPeriods.join(', ')}` },
        { status: 400 },
      );
    }

    const supabase = getServiceSupabase();

    // Verify video exists and user owns it
    const { data: video, error: videoError } = await supabase
      .from('videos')
      .select('id, creator_id, title, duration_seconds')
      .eq('id', videoId)
      .eq('is_deleted', false)
      .single();

    if (videoError || !video) {
      return NextResponse.json(
        { error: 'Video not found', code: 'VIDEO_NOT_FOUND' },
        { status: 404 },
      );
    }

    // Check authorization
    if ((video as any).creator_id !== creatorId) {
      return NextResponse.json(
        { error: 'Forbidden: You do not own this video', code: 'FORBIDDEN' },
        { status: 403 },
      );
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    if (period !== 'all') {
      const days = Number.parseInt(period.replace('d', ''), 10);
      startDate.setDate(startDate.getDate() - days);
    } else {
      startDate.setFullYear(2020); // Far enough back to get all data
    }

    // Fetch analytics data
    let query = supabase
      .from('video_analytics')
      .select('*')
      .eq('video_id', videoId)
      .order('date', { ascending: true });

    if (period !== 'all') {
      query = query
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0]);
    }

    const { data: analytics, error } = await query;

    if (error) {
      console.error('Error fetching video analytics:', error);
      return NextResponse.json(
        { error: 'Failed to fetch analytics', code: 'FETCH_FAILED' },
        { status: 500 },
      );
    }

    // Aggregate metrics
    const totalViews = analytics?.reduce((sum, day: any) => sum + (day.views || 0), 0) || 0;
    const totalWatchTime = analytics?.reduce(
      (sum, day: any) => sum + (day.total_watch_time_seconds || 0),
      0,
    ) || 0;

    // Get unique viewers (use the latest day's count or max)
    const uniqueViewers =
      Math.max(...(analytics?.map((day: any) => day.unique_viewers || 0) || [0])) || 0;

    // Calculate average completion rate
    const avgCompletionRate =
      analytics && analytics.length > 0
        ? analytics.reduce((sum, day: any) => sum + (day.completion_rate || 0), 0) / analytics.length
        : 0;

    // Calculate average watch time per view
    const avgWatchTime = totalViews > 0 ? totalWatchTime / totalViews : 0;

    // Calculate engagement score (0-100)
    const engagementScore = calculateEngagementScore(
      avgWatchTime,
      (video as any).duration_seconds || 1,
      avgCompletionRate,
      totalViews,
      uniqueViewers,
    );

    // Format views over time
    const viewsOverTime =
      analytics?.map((day: any) => ({
        date: day.date,
        views: day.views || 0,
        unique_viewers: day.unique_viewers || 0,
        watch_time_seconds: day.total_watch_time_seconds || 0,
        completion_rate: day.completion_rate || 0,
      })) || [];

    return NextResponse.json(
      {
        success: true,
        data: {
          video_id: videoId,
          video_title: (video as any).title,
          period,
          total_views: totalViews,
          unique_viewers: uniqueViewers,
          completion_rate: Math.round(avgCompletionRate * 100) / 100,
          avg_watch_time_seconds: Math.round(avgWatchTime),
          engagement_score: Math.round(engagementScore),
          views_over_time: viewsOverTime,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Video analytics API error:', error);
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
 * Calculate engagement score (0-100)
 *
 * Formula:
 * - 40% weight: watch time ratio (actual watch time / video duration)
 * - 40% weight: completion rate
 * - 20% weight: rewatch ratio (views / unique viewers)
 */
function calculateEngagementScore(
  avgWatchTime: number,
  videoDuration: number,
  completionRate: number,
  totalViews: number,
  uniqueViewers: number,
): number {
  // Watch time ratio (0-1)
  const watchTimeRatio = Math.min(avgWatchTime / videoDuration, 1);

  // Completion rate (0-1)
  const completionRatio = completionRate / 100;

  // Rewatch ratio (views / unique viewers)
  const rewatchRatio = uniqueViewers > 0 ? Math.min(totalViews / uniqueViewers, 2) / 2 : 0;

  // Weighted score
  const score = watchTimeRatio * 40 + completionRatio * 40 + rewatchRatio * 20;

  return Math.round(score * 100) / 100;
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
