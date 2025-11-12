import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/db/client';

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

    // Calculate date ranges for trends
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const twoMonthsAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

    // Fetch enrollment data (from students table - Whop membership sync)
    const [totalMembersData, activeMembersData, newThisWeekData, newThisMonthData, previousMonthData] = await Promise.all([
      supabase
        .from('students')
        .select('id', { count: 'exact', head: true })
        .eq('creator_id', creatorId),

      supabase
        .from('students')
        .select('id', { count: 'exact', head: true })
        .eq('creator_id', creatorId)
        .eq('is_active', true),

      supabase
        .from('students')
        .select('id', { count: 'exact', head: true })
        .eq('creator_id', creatorId)
        .gte('created_at', oneWeekAgo.toISOString()),

      supabase
        .from('students')
        .select('id', { count: 'exact', head: true })
        .eq('creator_id', creatorId)
        .gte('created_at', oneMonthAgo.toISOString()),

      supabase
        .from('students')
        .select('id', { count: 'exact', head: true })
        .eq('creator_id', creatorId)
        .gte('created_at', twoMonthsAgo.toISOString())
        .lt('created_at', oneMonthAgo.toISOString()),
    ]);

    // Calculate enrollment trend
    const currentMonthMembers = newThisMonthData.count || 0;
    const previousMonthMembers = previousMonthData.count || 0;
    const enrollmentTrend = previousMonthMembers === 0
      ? (currentMonthMembers > 0 ? 100 : 0)
      : Math.round(((currentMonthMembers - previousMonthMembers) / previousMonthMembers) * 100);

    // Fetch courses data
    const [coursesData, videosData, courseViewsData] = await Promise.all([
      supabase
        .from('courses')
        .select('id', { count: 'exact', head: true })
        .eq('creator_id', creatorId),

      supabase
        .from('videos')
        .select('id', { count: 'exact', head: true })
        .eq('creator_id', creatorId),

      supabase
        .from('video_analytics')
        .select('videos(title, course_id), views')
        .eq('creator_id', creatorId)
        .gte('date', start.toISOString().split('T')[0])
        .lte('date', end.toISOString().split('T')[0])
        .order('views', { ascending: false })
        .limit(1),
    ]);

    // Get most viewed course
    let mostViewedCourse = null;
    if (courseViewsData.data && courseViewsData.data.length > 0) {
      const topVideo = courseViewsData.data[0];
      if (topVideo.videos) {
        mostViewedCourse = {
          title: topVideo.videos.title || 'Untitled Course',
          views: topVideo.views || 0,
        };
      }
    }

    // Fetch analytics data
    const [viewsData, watchTimeData, completionData, topVideoData] = await Promise.all([
      supabase
        .from('video_analytics')
        .select('views')
        .eq('creator_id', creatorId)
        .gte('date', start.toISOString().split('T')[0])
        .lte('date', end.toISOString().split('T')[0]),

      supabase
        .from('video_analytics')
        .select('watch_time')
        .eq('creator_id', creatorId)
        .gte('date', start.toISOString().split('T')[0])
        .lte('date', end.toISOString().split('T')[0]),

      supabase
        .from('video_analytics')
        .select('completion_rate')
        .eq('creator_id', creatorId)
        .gte('date', start.toISOString().split('T')[0])
        .lte('date', end.toISOString().split('T')[0]),

      supabase
        .from('video_analytics')
        .select('videos(title), views')
        .eq('creator_id', creatorId)
        .gte('date', start.toISOString().split('T')[0])
        .lte('date', end.toISOString().split('T')[0])
        .order('views', { ascending: false })
        .limit(1),
    ]);

    const totalViews = viewsData.data?.reduce((sum, record) => sum + (record.views || 0), 0) || 0;
    const totalWatchTimeMinutes = watchTimeData.data?.reduce((sum, record) => sum + (record.watch_time || 0), 0) || 0;
    const avgCompletionRate = completionData.data && completionData.data.length > 0
      ? Math.round((completionData.data.reduce((sum, record) => sum + (record.completion_rate || 0), 0) / completionData.data.length) * 100)
      : 0;

    const topVideo = topVideoData.data && topVideoData.data.length > 0 && topVideoData.data[0].videos
      ? {
          title: topVideoData.data[0].videos.title || 'Untitled Video',
          views: topVideoData.data[0].views || 0,
        }
      : null;

    // Fetch usage data
    const usageData = await supabase
      .from('usage_metrics')
      .select('*')
      .eq('creator_id', creatorId)
      .single();

    const storageUsed = usageData.data?.storage_used_bytes
      ? Math.round((usageData.data.storage_used_bytes / (1024 * 1024 * 1024)) * 100) / 100
      : 0;
    const storageLimit = 10; // 10 GB default
    const aiCreditsUsed = usageData.data?.ai_credits_used || 0;
    const aiCreditsLimit = 1000;
    const apiCallsThisMonth = usageData.data?.api_calls_count || 0;
    const nearLimit = (storageUsed / storageLimit) >= 0.8 || (aiCreditsUsed / aiCreditsLimit) >= 0.8;

    // Fetch chat data
    const [sessionsData, weekMessagesData, recentMessagesData] = await Promise.all([
      supabase
        .from('chat_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('creator_id', creatorId),

      supabase
        .from('chat_messages')
        .select('id', { count: 'exact', head: true })
        .eq('creator_id', creatorId)
        .gte('created_at', oneWeekAgo.toISOString()),

      supabase
        .from('chat_messages')
        .select('content, chat_sessions(students(email)), created_at')
        .eq('creator_id', creatorId)
        .eq('role', 'user')
        .order('created_at', { ascending: false })
        .limit(3),
    ]);

    // Get most asked question (simplified - just get most recent user message)
    const mostAskedQuestion = recentMessagesData.data && recentMessagesData.data.length > 0
      ? recentMessagesData.data[0].content
      : null;

    // Format recent activity
    const recentActivity = recentMessagesData.data?.map((message: any) => ({
      studentName: message.chat_sessions?.students?.email?.split('@')[0] || 'Anonymous',
      message: message.content.substring(0, 100),
      time: formatTimeAgo(new Date(message.created_at)),
    })) || [];

    const dashboard = {
      enrollment: {
        totalMembers: totalMembersData.count || 0,
        activeMembers: activeMembersData.count || 0,
        newThisWeek: newThisWeekData.count || 0,
        newThisMonth: newThisMonthData.count || 0,
        trend: enrollmentTrend,
      },
      courses: {
        totalCourses: coursesData.count || 0,
        totalVideos: videosData.count || 0,
        mostViewedCourse,
      },
      analytics: {
        totalViews,
        totalWatchTime: formatWatchTime(totalWatchTimeMinutes),
        avgCompletionRate,
        topVideo,
      },
      usage: {
        storageUsed,
        storageLimit,
        aiCreditsUsed,
        aiCreditsLimit,
        apiCallsThisMonth,
        nearLimit,
      },
      chat: {
        totalSessions: sessionsData.count || 0,
        messagesThisWeek: weekMessagesData.count || 0,
        mostAskedQuestion,
        recentActivity,
      },
    };

    return NextResponse.json(dashboard);
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}

function formatWatchTime(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)}m`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ${Math.round(minutes % 60)}m`;
  }

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return `${days}d ${remainingHours}h`;
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else {
    return `${diffDays}d ago`;
  }
}
