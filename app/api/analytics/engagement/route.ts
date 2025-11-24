/**
 * Engagement Analytics API Endpoint
 * GET /api/analytics/engagement
 *
 * Fetches student engagement metrics for creators
 * Supports multiple metric types: active_users, retention, progress, etc.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  calculateActiveUsersOverTime,
  calculateCohortRetention,
  calculateSessionDurations,
  calculateEngagementScore,
} from '@/lib/analytics/engagement';
import type {
  EngagementMetricsResponse,
  EngagementMetric,
  TimeRange,
  Activity,
  ActivityTimelineData,
  ProgressBucket,
  StudentMetrics,
} from '@/components/analytics/engagement-types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Extract query parameters
    const creatorId = searchParams.get('creatorId');
    const metric = searchParams.get('metric') as EngagementMetric | 'all';
    const timeRange = (searchParams.get('timeRange') || '30d') as TimeRange;
    const studentId = searchParams.get('studentId'); // Optional: for individual student scores

    // Validate required parameters
    if (!creatorId) {
      return NextResponse.json(
        { error: 'creatorId is required' },
        { status: 400 }
      );
    }

    // TODO: Validate Whop membership
    // const user = await validateWhopUser(request.headers.get('authorization'));
    // if (user.creatorId !== creatorId) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    // }

    // Initialize Supabase client
    const supabase = createClient(
      process.env['NEXT_PUBLIC_SUPABASE_URL']!,
      process.env['SUPABASE_SERVICE_ROLE_KEY']!
    );

    // Calculate date range
    const days = getDaysFromTimeRange(timeRange);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const response: EngagementMetricsResponse = {};

    // Fetch active users data
    if (metric === 'active_users' || metric === 'all') {
      const activities = await fetchActivities(supabase, creatorId, startDate);
      response.activeUsers = calculateActiveUsersOverTime(activities, days);
    }

    // Fetch retention data
    if (metric === 'retention' || metric === 'all') {
      const cohortData = await fetchCohortData(supabase, creatorId);
      response.retention = calculateCohortRetention(cohortData);
    }

    // Fetch progress distribution
    if (metric === 'progress' || metric === 'all') {
      response.progressDistribution = await fetchProgressDistribution(
        supabase,
        creatorId
      );
    }

    // Fetch session durations
    if (metric === 'session_duration' || metric === 'all') {
      const sessionLengths = await fetchSessionLengths(
        supabase,
        creatorId,
        startDate
      );
      response.sessionDurations = calculateSessionDurations(sessionLengths);
    }

    // Fetch activity timeline
    if (metric === 'activity_timeline' || metric === 'all') {
      response.activityTimeline = await fetchActivityTimeline(
        supabase,
        creatorId,
        startDate,
        days
      );
    }

    // Calculate engagement score
    if (metric === 'engagement_score' || metric === 'all') {
      const metrics = await fetchStudentMetrics(
        supabase,
        creatorId,
        studentId || undefined
      );
      response.engagementScore = calculateEngagementScore(metrics);
    }

    // Always fetch avgSessionDuration and retentionRate for the 'all' metric
    if (metric === 'all') {
      // Calculate average session duration from video_watch_sessions
      response.avgSessionDuration = await fetchAvgSessionDuration(
        supabase,
        creatorId,
        startDate
      );

      // Calculate retention rate (returning students in last 7 days)
      response.retentionRate = await fetchRetentionRate(supabase, creatorId);
    }

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error fetching engagement metrics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Helper: Convert time range to number of days
 */
function getDaysFromTimeRange(timeRange: TimeRange): number {
  switch (timeRange) {
    case '7d':
      return 7;
    case '30d':
      return 30;
    case '90d':
      return 90;
    case '1y':
      return 365;
    case 'all':
      return 3650; // ~10 years
    default:
      return 30;
  }
}

/**
 * Fetch all activities for active users calculation
 */
async function fetchActivities(
  supabase: any,
  creatorId: string,
  startDate: Date
): Promise<Activity[]> {
  // Fetch from chat_messages
  const { data: chatMessages } = await supabase
    .from('chat_messages')
    .select('student_id, created_at')
    .eq('creator_id', creatorId)
    .gte('created_at', startDate.toISOString());

  // Fetch from video_analytics
  const { data: videoViews } = await supabase
    .from('video_analytics')
    .select('student_id, date')
    .eq('creator_id', creatorId)
    .gte('date', startDate.toISOString());

  const activities: Activity[] = [];

  // Convert chat messages to activities
  chatMessages?.forEach((msg: any) => {
    activities.push({
      studentId: msg.student_id,
      creatorId,
      type: 'chat_message',
      timestamp: new Date(msg.created_at),
    });
  });

  // Convert video views to activities
  videoViews?.forEach((view: any) => {
    activities.push({
      studentId: view.student_id,
      creatorId,
      type: 'video_view',
      timestamp: new Date(view.date),
    });
  });

  return activities;
}

/**
 * Fetch cohort data for retention analysis
 */
async function fetchCohortData(supabase: any, creatorId: string) {
  // Get all students grouped by join week
  const { data: students } = await supabase
    .from('students')
    .select('id, created_at')
    .eq('creator_id', creatorId)
    .order('created_at');

  // Group students into weekly cohorts
  const cohorts: Map<
    string,
    { id: string; joinDate: Date }[]
  > = new Map();

  students?.forEach((student: any) => {
    const joinDate = new Date(student.created_at);
    const weekStart = getWeekStart(joinDate);
    const cohortId = weekStart.toISOString();

    if (!cohorts.has(cohortId)) {
      cohorts.set(cohortId, []);
    }

    cohorts.get(cohortId)?.push({
      id: student.id,
      joinDate,
    });
  });

  // Fetch activities for all students
  const { data: activities } = await supabase
    .from('chat_messages')
    .select('student_id, created_at')
    .eq('creator_id', creatorId);

  const activityList: Activity[] =
    activities?.map((a: any) => ({
      studentId: a.student_id,
      creatorId,
      type: 'chat_message' as const,
      timestamp: new Date(a.created_at),
    })) || [];

  // Convert to cohort data format
  return Array.from(cohorts.entries()).map(([cohortId, students]) => ({
    cohortId,
    cohortName: new Date(cohortId).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    startDate: new Date(cohortId),
    students,
    activities: activityList,
  }));
}

/**
 * Fetch progress distribution across courses
 */
async function fetchProgressDistribution(
  supabase: any,
  creatorId: string
): Promise<ProgressBucket[]> {
  const { data: courses } = await supabase
    .from('courses')
    .select('id, title')
    .eq('creator_id', creatorId);

  if (!courses) return [];

  const progressBuckets: ProgressBucket[] = [];

  for (const course of courses) {
    // Get all students for this course
    const { data: enrollments } = await supabase
      .from('course_modules')
      .select('student_id, progress')
      .eq('course_id', course.id);

    const buckets = {
      notStarted: 0,
      low: 0,
      medium: 0,
      high: 0,
      veryHigh: 0,
      completed: 0,
    };

    enrollments?.forEach((enrollment: any) => {
      const progress = enrollment.progress || 0;

      if (progress === 0) buckets.notStarted++;
      else if (progress <= 25) buckets.low++;
      else if (progress <= 50) buckets.medium++;
      else if (progress <= 75) buckets.high++;
      else if (progress < 100) buckets.veryHigh++;
      else buckets.completed++;
    });

    progressBuckets.push({
      course: course.title,
      ...buckets,
    });
  }

  return progressBuckets;
}

/**
 * Fetch session lengths for duration histogram
 */
async function fetchSessionLengths(
  supabase: any,
  creatorId: string,
  startDate: Date
): Promise<number[]> {
  // This would ideally come from session tracking
  // For now, we'll estimate from video analytics watch_time
  const { data: sessions } = await supabase
    .from('video_analytics')
    .select('watch_time')
    .eq('creator_id', creatorId)
    .gte('date', startDate.toISOString());

  return sessions?.map((s: any) => Math.round(s.watch_time / 60)) || [];
}

/**
 * Fetch activity timeline data
 */
async function fetchActivityTimeline(
  supabase: any,
  creatorId: string,
  startDate: Date,
  days: number
): Promise<ActivityTimelineData[]> {
  const timeline: ActivityTimelineData[] = [];

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0]!;

    // Count video views
    const { count: videoViews } = await supabase
      .from('video_analytics')
      .select('*', { count: 'exact', head: true })
      .eq('creator_id', creatorId)
      .eq('date', dateStr);

    // Count chat messages
    const { count: chatMessages } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('creator_id', creatorId)
      .gte('created_at', dateStr)
      .lt('created_at', new Date(date.getTime() + 86400000).toISOString());

    // Estimate course progress events (could be tracked separately)
    const courseProgress = Math.floor(Math.random() * 10); // Placeholder

    timeline.push({
      date: dateStr,
      videoViews: videoViews || 0,
      chatMessages: chatMessages || 0,
      courseProgress,
      total: (videoViews || 0) + (chatMessages || 0) + courseProgress,
    });
  }

  return timeline;
}

/**
 * Fetch student metrics for engagement score
 */
async function fetchStudentMetrics(
  supabase: any,
  creatorId: string,
  studentId?: string
): Promise<StudentMetrics> {
  // If studentId provided, get individual metrics
  // Otherwise, calculate average across all students

  const filter = studentId
    ? { creator_id: creatorId, student_id: studentId }
    : { creator_id: creatorId };

  // Video completion rate
  const { data: videos } = await supabase
    .from('video_analytics')
    .select('completion_rate')
    .match(filter);

  const avgVideoCompletion =
    videos?.reduce((sum: number, v: any) => sum + v.completion_rate, 0) /
      (videos?.length || 1) || 0;

  // Chat interaction frequency
  const { count: chatCount } = await supabase
    .from('chat_messages')
    .select('*', { count: 'exact', head: true })
    .match(filter)
    .gte(
      'created_at',
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    );

  const chatInteractionFrequency = (chatCount || 0) / 7; // per day

  // Login frequency (would need session tracking)
  const loginFrequency = 5; // Placeholder

  // Course progress
  const courseProgressRate = 65; // Placeholder

  return {
    videoCompletionRate: avgVideoCompletion,
    chatInteractionFrequency,
    loginFrequency,
    courseProgressRate,
  };
}

/**
 * Fetch average session duration in minutes from video_watch_sessions
 * Joins with videos table to filter by creator
 */
async function fetchAvgSessionDuration(
  supabase: any,
  creatorId: string,
  startDate: Date
): Promise<number> {
  // Get all videos for this creator first
  const { data: creatorVideos } = await supabase
    .from('videos')
    .select('id')
    .eq('creator_id', creatorId);

  if (!creatorVideos || creatorVideos.length === 0) {
    return 0;
  }

  const videoIds = creatorVideos.map((v: { id: string }) => v.id);

  // Get average watch time from video_watch_sessions for these videos
  const { data: sessions } = await supabase
    .from('video_watch_sessions')
    .select('watch_time_seconds')
    .in('video_id', videoIds)
    .gte('session_start', startDate.toISOString());

  if (!sessions || sessions.length === 0) {
    return 0;
  }

  // Calculate average and convert to minutes
  const totalSeconds = sessions.reduce(
    (sum: number, s: { watch_time_seconds: number }) => sum + (s.watch_time_seconds || 0),
    0
  );
  const avgSeconds = totalSeconds / sessions.length;
  const avgMinutes = Math.round(avgSeconds / 60);

  return avgMinutes;
}

/**
 * Fetch retention rate: percentage of students who returned in last 7 days
 * A "returning student" is one who has activity in multiple weeks
 */
async function fetchRetentionRate(
  supabase: any,
  creatorId: string
): Promise<number> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  // Get all videos for this creator
  const { data: creatorVideos } = await supabase
    .from('videos')
    .select('id')
    .eq('creator_id', creatorId);

  if (!creatorVideos || creatorVideos.length === 0) {
    return 0;
  }

  const videoIds = creatorVideos.map((v: { id: string }) => v.id);

  // Get students active in the previous week (7-14 days ago) - these are our "baseline"
  const { data: previousWeekStudents } = await supabase
    .from('video_watch_sessions')
    .select('student_id')
    .in('video_id', videoIds)
    .gte('session_start', fourteenDaysAgo.toISOString())
    .lt('session_start', sevenDaysAgo.toISOString());

  if (!previousWeekStudents || previousWeekStudents.length === 0) {
    return 0;
  }

  // Get unique students from previous week
  const previousStudentIds = [
    ...new Set(previousWeekStudents.map((s: { student_id: string }) => s.student_id)),
  ];

  // Get students active in the last 7 days
  const { data: recentStudents } = await supabase
    .from('video_watch_sessions')
    .select('student_id')
    .in('video_id', videoIds)
    .gte('session_start', sevenDaysAgo.toISOString());

  if (!recentStudents || recentStudents.length === 0) {
    return 0;
  }

  // Get unique students from recent week
  const recentStudentIds = new Set(
    recentStudents.map((s: { student_id: string }) => s.student_id)
  );

  // Count how many previous week students returned this week
  const returningStudents = previousStudentIds.filter((id) =>
    recentStudentIds.has(id)
  );

  // Calculate retention rate as percentage
  const retentionRate = (returningStudents.length / previousStudentIds.length) * 100;

  return Math.round(retentionRate * 10) / 10; // Round to 1 decimal place
}

/**
 * Helper: Get start of week for a date
 */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
}
