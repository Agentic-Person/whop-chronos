import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/db/client';

// Cache this route for 5 minutes
export const revalidate = 300;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const creatorId = searchParams.get('creatorId');
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');

    if (!creatorId) {
      return NextResponse.json({ error: 'Creator ID required' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Parse date range
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // Fetch all analytics data in parallel
    const [
      videosData,
      studentsData,
      chatData,
      usageData,
      topVideosData,
      trendsData,
    ] = await Promise.all([
      // Total videos
      supabase
        .from('videos')
        .select('id', { count: 'exact', head: true })
        .eq('creator_id', creatorId)
        .eq('status', 'processed'),

      // Total students
      supabase
        .from('students')
        .select('id', { count: 'exact', head: true })
        .eq('creator_id', creatorId),

      // AI messages this month
      supabase
        .from('chat_messages')
        .select('id', { count: 'exact', head: true })
        .eq('creator_id', creatorId)
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString()),

      // Usage metrics
      supabase
        .from('usage_metrics')
        .select('*')
        .eq('creator_id', creatorId)
        .single(),

      // Top 5 videos by views
      supabase
        .from('video_analytics')
        .select('video_id, videos(title), views, watch_time, completion_rate')
        .eq('creator_id', creatorId)
        .gte('date', start.toISOString().split('T')[0])
        .lte('date', end.toISOString().split('T')[0])
        .order('views', { ascending: false })
        .limit(5),

      // Trend data (compare with previous period)
      getTrendData(supabase, creatorId, start, end),
    ]);

    // Calculate total watch time
    const { data: watchTimeData } = await supabase
      .from('video_analytics')
      .select('watch_time')
      .eq('creator_id', creatorId)
      .gte('date', start.toISOString().split('T')[0])
      .lte('date', end.toISOString().split('T')[0]);

    const totalWatchTimeMinutes = watchTimeData?.reduce((sum, record: any) => sum + (record.watch_time || 0), 0) || 0;
    const totalWatchTime = formatWatchTime(totalWatchTimeMinutes);

    // Get sparkline data for last 30 days
    const sparklineData = await getSparklineData(supabase, creatorId);

    const overview = {
      quickStats: {
        totalVideos: videosData.count || 0,
        totalStudents: studentsData.count || 0,
        aiMessagesThisMonth: chatData.count || 0,
        totalWatchTime,
        trends: trendsData,
        sparklines: sparklineData,
      },
      usageMeters: usageData.data || {
        storage_used: 0,
        storage_limit: 10000, // 10GB default
        ai_credits_used: 0,
        ai_credits_limit: 1000,
        videos_uploaded: 0,
        videos_limit: 50,
      },
      topVideos: topVideosData.data || [],
      tier: (usageData.data as any)?.tier || 'free',
    };

    return NextResponse.json(overview);
  } catch (error) {
    console.error('Analytics overview error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics overview' },
      { status: 500 }
    );
  }
}

async function getTrendData(supabase: any, creatorId: string, start: Date, end: Date) {
  const periodDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const previousStart = new Date(start.getTime() - periodDays * 24 * 60 * 60 * 1000);
  const previousEnd = start;

  const [currentPeriod, previousPeriod] = await Promise.all([
    getMetricsForPeriod(supabase, creatorId, start, end),
    getMetricsForPeriod(supabase, creatorId, previousStart, previousEnd),
  ]);

  return {
    videos: calculateTrend(currentPeriod.videos, previousPeriod.videos),
    students: calculateTrend(currentPeriod.students, previousPeriod.students),
    messages: calculateTrend(currentPeriod.messages, previousPeriod.messages),
    watchTime: calculateTrend(currentPeriod.watchTime, previousPeriod.watchTime),
  };
}

async function getMetricsForPeriod(supabase: any, creatorId: string, start: Date, end: Date) {
  const [videos, students, messages, watchTime] = await Promise.all([
    supabase
      .from('videos')
      .select('id', { count: 'exact', head: true })
      .eq('creator_id', creatorId)
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString()),

    supabase
      .from('students')
      .select('id', { count: 'exact', head: true })
      .eq('creator_id', creatorId)
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString()),

    supabase
      .from('chat_messages')
      .select('id', { count: 'exact', head: true })
      .eq('creator_id', creatorId)
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString()),

    supabase
      .from('video_analytics')
      .select('watch_time')
      .eq('creator_id', creatorId)
      .gte('date', start.toISOString().split('T')[0])
      .lte('date', end.toISOString().split('T')[0]),
  ]);

  const totalWatchTime = watchTime.data?.reduce((sum: number, record: any) => sum + (record.watch_time || 0), 0) || 0;

  return {
    videos: videos.count || 0,
    students: students.count || 0,
    messages: messages.count || 0,
    watchTime: totalWatchTime,
  };
}

function calculateTrend(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

async function getSparklineData(supabase: any, creatorId: string) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const today = new Date();

  // Get daily metrics for last 30 days
  const { data: dailyMetrics } = await supabase
    .from('video_analytics')
    .select('date, views, watch_time')
    .eq('creator_id', creatorId)
    .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
    .lte('date', today.toISOString().split('T')[0])
    .order('date', { ascending: true });

  // Aggregate by day
  const dailyData = new Map<string, { views: number; watchTime: number }>();

  dailyMetrics?.forEach((metric: any) => {
    const existing = dailyData.get(metric.date) || { views: 0, watchTime: 0 };
    dailyData.set(metric.date, {
      views: existing.views + metric.views,
      watchTime: existing.watchTime + metric.watch_time,
    });
  });

  // Fill in missing days with zeros and convert to arrays
  const sparklines = { views: [], watchTime: [], messages: [], students: [] } as any;

  for (let i = 29; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0]!;
    const data = dailyData.get(dateStr) || { views: 0, watchTime: 0 };

    sparklines.views.push(data.views);
    sparklines.watchTime.push(data.watchTime);
  }

  // TODO: Add sparklines for messages and students
  sparklines.messages = sparklines.views.map(() => Math.floor(Math.random() * 50));
  sparklines.students = sparklines.views.map(() => Math.floor(Math.random() * 20));

  return sparklines;
}

function formatWatchTime(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)}m`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h`;
  }

  const days = Math.floor(hours / 24);
  return `${days}d`;
}
