/**
 * Video Analytics Dashboard Data API
 *
 * GET /api/analytics/videos/dashboard - Get comprehensive video analytics for dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/db/client';

export const runtime = 'nodejs';

/**
 * GET /api/analytics/videos/dashboard
 *
 * Get comprehensive video analytics dashboard data
 *
 * Query parameters:
 * - creator_id: string (required)
 * - start: ISO date string (required)
 * - end: ISO date string (required)
 *
 * Response: Comprehensive dashboard data including metrics, charts data, and tables
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const creatorId = searchParams.get('creator_id');
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');

    if (!creatorId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required parameters: creator_id, start, end' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Verify creator exists
    const { data: creator, error: creatorError } = await supabase
      .from('creators')
      .select('id')
      .eq('id', creatorId)
      .single();

    if (creatorError || !creator) {
      return NextResponse.json(
        { error: 'Creator not found', code: 'CREATOR_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Parse dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Calculate previous period for trends
    const periodDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const prevStart = new Date(start.getTime() - periodDays * 24 * 60 * 60 * 1000);
    const prevEnd = start;

    // Fetch all data in parallel
    const [
      metricsResult,
      prevMetricsResult,
      viewsOverTimeResult,
      completionRatesResult,
      costBreakdownResult,
      storageUsageResult,
      studentEngagementResult,
      topVideosResult,
    ] = await Promise.all([
      fetchMetrics(supabase, creatorId, start, end),
      fetchMetrics(supabase, creatorId, prevStart, prevEnd),
      fetchViewsOverTime(supabase, creatorId, start, end),
      fetchCompletionRates(supabase, creatorId, start, end),
      fetchCostBreakdown(supabase, creatorId, start, end),
      fetchStorageUsage(supabase, creatorId, start, end),
      fetchStudentEngagement(supabase, creatorId, start, end),
      fetchTopVideos(supabase, creatorId, start, end),
    ]);

    // Calculate trends
    const trends = {
      views: calculateTrend(metricsResult.total_views, prevMetricsResult.total_views),
      watch_time: calculateTrend(
        metricsResult.total_watch_time_seconds,
        prevMetricsResult.total_watch_time_seconds
      ),
      completion: calculateTrend(
        metricsResult.avg_completion_rate,
        prevMetricsResult.avg_completion_rate
      ),
      videos: calculateTrend(metricsResult.total_videos, prevMetricsResult.total_videos),
    };

    return NextResponse.json(
      {
        success: true,
        data: {
          metrics: {
            ...metricsResult,
            trends,
          },
          views_over_time: viewsOverTimeResult,
          completion_rates: completionRatesResult,
          cost_breakdown: costBreakdownResult,
          storage_usage: storageUsageResult,
          student_engagement: studentEngagementResult,
          top_videos: topVideosResult,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Video analytics dashboard API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Helper functions

async function fetchMetrics(
  supabase: ReturnType<typeof getServiceSupabase>,
  creatorId: string,
  start: Date,
  end: Date
) {
  // Get total views from video_analytics_events
  const { data: viewsData } = await supabase
    .from('video_analytics_events')
    .select('id')
    .eq('creator_id', creatorId)
    .eq('event_type', 'video_started')
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString());

  const total_views = viewsData?.length || 0;

  // Get total watch time from video_completed events
  const { data: watchTimeData } = await supabase
    .from('video_analytics_events')
    .select('metadata')
    .eq('creator_id', creatorId)
    .eq('event_type', 'video_completed')
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString());

  const total_watch_time_seconds =
    watchTimeData?.reduce((sum, event) => {
      const watchTime = (event.metadata as any)?.watch_time_seconds || 0;
      return sum + watchTime;
    }, 0) || 0;

  // Get average completion rate
  const { data: videosData } = await supabase
    .from('videos')
    .select('id')
    .eq('creator_id', creatorId)
    .eq('is_deleted', false);

  const videoIds = videosData?.map((v) => v.id) || [];

  let avg_completion_rate = 0;
  if (videoIds.length > 0) {
    const completionRates = await Promise.all(
      videoIds.map(async (videoId) => {
        const { data: starts } = await supabase
          .from('video_analytics_events')
          .select('id')
          .eq('video_id', videoId)
          .eq('event_type', 'video_started')
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString());

        const { data: completions } = await supabase
          .from('video_analytics_events')
          .select('id')
          .eq('video_id', videoId)
          .eq('event_type', 'video_completed')
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString());

        const startsCount = starts?.length || 0;
        const completionsCount = completions?.length || 0;

        if (startsCount === 0) return 0;
        return (completionsCount / startsCount) * 100;
      })
    );

    avg_completion_rate =
      completionRates.reduce((sum, rate) => sum + rate, 0) / completionRates.length;
  }

  return {
    total_views,
    total_watch_time_seconds,
    avg_completion_rate,
    total_videos: videoIds.length,
  };
}

async function fetchViewsOverTime(
  supabase: ReturnType<typeof getServiceSupabase>,
  creatorId: string,
  start: Date,
  end: Date
) {
  const { data } = await supabase
    .from('video_analytics_events')
    .select('created_at')
    .eq('creator_id', creatorId)
    .eq('event_type', 'video_started')
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString())
    .order('created_at', { ascending: true });

  // Group by date
  const viewsByDate: Record<string, number> = {};

  data?.forEach((event) => {
    const date = new Date(event.created_at).toISOString().split('T')[0];
    viewsByDate[date] = (viewsByDate[date] || 0) + 1;
  });

  // Fill in missing dates with 0 views
  const result = [];
  const currentDate = new Date(start);
  while (currentDate <= end) {
    const dateStr = currentDate.toISOString().split('T')[0];
    result.push({
      date: dateStr,
      views: viewsByDate[dateStr] || 0,
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return result;
}

async function fetchCompletionRates(
  supabase: ReturnType<typeof getServiceSupabase>,
  creatorId: string,
  start: Date,
  end: Date
) {
  const { data: videos } = await supabase
    .from('videos')
    .select('id, title')
    .eq('creator_id', creatorId)
    .eq('is_deleted', false);

  if (!videos || videos.length === 0) return [];

  const completionRates = await Promise.all(
    videos.map(async (video) => {
      const { data: starts } = await supabase
        .from('video_analytics_events')
        .select('id')
        .eq('video_id', video.id)
        .eq('event_type', 'video_started')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      const { data: completions } = await supabase
        .from('video_analytics_events')
        .select('id')
        .eq('video_id', video.id)
        .eq('event_type', 'video_completed')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      const startsCount = starts?.length || 0;
      const completionsCount = completions?.length || 0;

      return {
        video_id: video.id,
        title: video.title,
        completion_rate: startsCount > 0 ? (completionsCount / startsCount) * 100 : 0,
        views: startsCount,
      };
    })
  );

  return completionRates
    .filter((v) => v.views > 0)
    .sort((a, b) => b.completion_rate - a.completion_rate)
    .slice(0, 10);
}

async function fetchCostBreakdown(
  supabase: ReturnType<typeof getServiceSupabase>,
  creatorId: string,
  start: Date,
  end: Date
) {
  const { data } = await supabase
    .from('video_analytics_events')
    .select('metadata')
    .eq('creator_id', creatorId)
    .eq('event_type', 'video_transcribed')
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString());

  const costByMethod: Record<string, { total_cost: number; video_count: number }> = {};

  data?.forEach((event) => {
    const metadata = event.metadata as any;
    const method = metadata?.transcript_method || 'unknown';
    const cost = metadata?.cost || 0;

    if (!costByMethod[method]) {
      costByMethod[method] = { total_cost: 0, video_count: 0 };
    }

    costByMethod[method].total_cost += cost;
    costByMethod[method].video_count += 1;
  });

  return Object.entries(costByMethod).map(([method, data]) => ({
    method,
    total_cost: data.total_cost,
    video_count: data.video_count,
  }));
}

async function fetchStorageUsage(
  supabase: ReturnType<typeof getServiceSupabase>,
  creatorId: string,
  start: Date,
  end: Date
) {
  const { data } = await supabase
    .from('videos')
    .select('created_at, file_size_bytes')
    .eq('creator_id', creatorId)
    .eq('source_type', 'upload')
    .eq('is_deleted', false)
    .order('created_at', { ascending: true });

  const storageByDate: Record<string, number> = {};

  data?.forEach((video) => {
    const date = new Date(video.created_at).toISOString().split('T')[0];
    const sizeGb = (video.file_size_bytes || 0) / (1024 * 1024 * 1024);
    storageByDate[date] = (storageByDate[date] || 0) + sizeGb;
  });

  // Calculate cumulative storage
  const result = [];
  let cumulativeStorage = 0;
  const currentDate = new Date(start);

  while (currentDate <= end) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const dailyStorage = storageByDate[dateStr] || 0;
    cumulativeStorage += dailyStorage;

    result.push({
      date: dateStr,
      storage_gb: dailyStorage,
      cumulative_gb: cumulativeStorage,
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return result;
}

async function fetchStudentEngagement(
  supabase: ReturnType<typeof getServiceSupabase>,
  creatorId: string,
  start: Date,
  end: Date
) {
  // Get unique active learners
  const { data: activeLearners } = await supabase
    .from('video_analytics_events')
    .select('student_id')
    .eq('creator_id', creatorId)
    .eq('event_type', 'video_started')
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString())
    .not('student_id', 'is', null);

  const uniqueLearners = new Set(activeLearners?.map((e) => e.student_id) || []);

  // Get videos per student
  const { data: allViews } = await supabase
    .from('video_analytics_events')
    .select('student_id, video_id')
    .eq('creator_id', creatorId)
    .eq('event_type', 'video_started')
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString())
    .not('student_id', 'is', null);

  const videosByStudent: Record<string, Set<string>> = {};
  allViews?.forEach((view) => {
    if (!videosByStudent[view.student_id]) {
      videosByStudent[view.student_id] = new Set();
    }
    videosByStudent[view.student_id].add(view.video_id);
  });

  const avgVideosPerStudent =
    Object.values(videosByStudent).reduce((sum, videos) => sum + videos.size, 0) /
    Math.max(Object.keys(videosByStudent).length, 1);

  // Get peak hours (hour of day and day of week)
  const { data: timeData } = await supabase
    .from('video_analytics_events')
    .select('created_at')
    .eq('creator_id', creatorId)
    .eq('event_type', 'video_started')
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString());

  const activityByTime: Record<string, number> = {};
  timeData?.forEach((event) => {
    const date = new Date(event.created_at);
    const hour = date.getHours();
    const dayOfWeek = date.getDay();
    const key = `${dayOfWeek}-${hour}`;
    activityByTime[key] = (activityByTime[key] || 0) + 1;
  });

  const peak_hours = Object.entries(activityByTime).map(([key, count]) => {
    const [day, hour] = key.split('-').map(Number);
    return {
      hour,
      day_of_week: day,
      activity_count: count,
    };
  });

  return {
    active_learners: uniqueLearners.size,
    avg_videos_per_student: avgVideosPerStudent,
    peak_hours,
  };
}

async function fetchTopVideos(
  supabase: ReturnType<typeof getServiceSupabase>,
  creatorId: string,
  start: Date,
  end: Date
) {
  const { data: videos } = await supabase
    .from('videos')
    .select('id, title, thumbnail_url, duration_seconds, source_type')
    .eq('creator_id', creatorId)
    .eq('is_deleted', false);

  if (!videos || videos.length === 0) return [];

  const videoStats = await Promise.all(
    videos.map(async (video) => {
      const { data: starts } = await supabase
        .from('video_analytics_events')
        .select('id')
        .eq('video_id', video.id)
        .eq('event_type', 'video_started')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      const { data: completions } = await supabase
        .from('video_analytics_events')
        .select('metadata')
        .eq('video_id', video.id)
        .eq('event_type', 'video_completed')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      const views = starts?.length || 0;
      const avgWatchTime =
        completions && completions.length > 0
          ? completions.reduce((sum, c) => {
              const watchTime = (c.metadata as any)?.watch_time_seconds || 0;
              return sum + watchTime;
            }, 0) / completions.length
          : 0;

      const completionRate =
        views > 0 ? ((completions?.length || 0) / views) * 100 : 0;

      return {
        ...video,
        views,
        avg_watch_time_seconds: avgWatchTime,
        completion_rate: completionRate,
      };
    })
  );

  return videoStats
    .filter((v) => v.views > 0)
    .sort((a, b) => b.views - a.views)
    .slice(0, 20);
}

function calculateTrend(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
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
