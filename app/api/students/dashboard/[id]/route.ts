import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/db/client';
import type { Activity } from '@/components/dashboard/RecentActivity';

interface DashboardStats {
  coursesEnrolled: number;
  videosWatched: number;
  chatMessages: number;
  completionRate: number;
}

interface CourseProgress {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string | null;
  progress: number;
  total_videos: number;
  watched_videos: number;
  last_accessed: string;
}

interface ChatSession {
  id: string;
  title: string;
  last_message: string;
  created_at: string;
  message_count: number;
}

interface DashboardResponse {
  stats: DashboardStats;
  continueWatching: CourseProgress[];
  recentSessions: ChatSession[];
  recentActivity: Activity[];
}

/**
 * GET /api/students/dashboard/[id]
 *
 * Aggregated dashboard data endpoint for student home page
 * Returns all necessary data in a single request for performance
 *
 * Returns:
 * - stats: Overall statistics (courses, videos, messages, completion rate)
 * - continueWatching: Top 3 in-progress courses
 * - recentSessions: Last 5 chat sessions
 * - recentActivity: Last 10 activities
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: studentId } = await params;

    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    const supabase = await getServerSupabase();

    // Fetch all data in parallel for performance
    const [
      statsResult,
      coursesResult,
      sessionsResult,
      activityResult,
    ] = await Promise.all([
      fetchStudentStats(supabase, studentId),
      fetchContinueWatching(supabase, studentId),
      fetchRecentSessions(supabase, studentId),
      fetchRecentActivity(supabase, studentId),
    ]);

    const response: DashboardResponse = {
      stats: statsResult,
      continueWatching: coursesResult,
      recentSessions: sessionsResult,
      recentActivity: activityResult,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}

/**
 * Fetch student statistics
 */
async function fetchStudentStats(
  supabase: any,
  studentId: string
): Promise<DashboardStats> {
  try {
    // Count enrolled courses
    const { count: coursesEnrolled } = await supabase
      .from('student_courses')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', studentId);

    // Count videos watched (watch sessions with > 0 watch time)
    const { count: videosWatched } = await supabase
      .from('video_watch_sessions')
      .select('video_id', { count: 'exact', head: true })
      .eq('student_id', studentId)
      .gt('total_watch_time_seconds', 0);

    // Count chat messages
    const { count: chatMessages } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'user')
      .in('session_id',
        supabase
          .from('chat_sessions')
          .select('id')
          .eq('student_id', studentId)
      );

    // Calculate completion rate
    const { data: progressData } = await supabase
      .from('student_courses')
      .select('progress')
      .eq('student_id', studentId);

    const completionRate = progressData && progressData.length > 0
      ? Math.round(
          progressData.reduce((sum: number, item: any) => sum + (item.progress || 0), 0) /
          progressData.length
        )
      : 0;

    return {
      coursesEnrolled: coursesEnrolled || 0,
      videosWatched: videosWatched || 0,
      chatMessages: chatMessages || 0,
      completionRate,
    };
  } catch (error) {
    console.error('Error fetching student stats:', error);
    return {
      coursesEnrolled: 0,
      videosWatched: 0,
      chatMessages: 0,
      completionRate: 0,
    };
  }
}

/**
 * Fetch courses to continue watching (in-progress courses)
 */
async function fetchContinueWatching(
  supabase: any,
  studentId: string
): Promise<CourseProgress[]> {
  try {
    const { data, error } = await supabase
      .from('student_courses')
      .select(`
        course_id,
        progress,
        last_accessed,
        courses (
          id,
          title,
          description,
          thumbnail_url
        )
      `)
      .eq('student_id', studentId)
      .gt('progress', 0)
      .lt('progress', 100)
      .order('last_accessed', { ascending: false })
      .limit(3);

    if (error) throw error;

    return (data || []).map((item: any) => ({
      id: item.course_id,
      title: item.courses.title,
      description: item.courses.description,
      thumbnail_url: item.courses.thumbnail_url,
      progress: item.progress,
      total_videos: 0, // TODO: Calculate from course modules
      watched_videos: 0, // TODO: Calculate from watch sessions
      last_accessed: item.last_accessed,
    }));
  } catch (error) {
    console.error('Error fetching continue watching:', error);
    return [];
  }
}

/**
 * Fetch recent chat sessions
 */
async function fetchRecentSessions(
  supabase: any,
  studentId: string
): Promise<ChatSession[]> {
  try {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select(`
        id,
        title,
        created_at,
        chat_messages (
          content
        )
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw error;

    return (data || []).map((session: any) => ({
      id: session.id,
      title: session.title || 'Untitled Chat',
      last_message: session.chat_messages?.[0]?.content || '',
      created_at: session.created_at,
      message_count: session.chat_messages?.length || 0,
    }));
  } catch (error) {
    console.error('Error fetching recent sessions:', error);
    return [];
  }
}

/**
 * Fetch recent activity
 */
async function fetchRecentActivity(
  supabase: any,
  studentId: string
): Promise<Activity[]> {
  try {
    const activities: Activity[] = [];

    // Fetch recent watch sessions
    const { data: watchSessions } = await supabase
      .from('video_watch_sessions')
      .select(`
        id,
        created_at,
        video_id,
        videos (
          title
        )
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (watchSessions) {
      watchSessions.forEach((session: any) => {
        activities.push({
          id: `watch-${session.id}`,
          type: 'video_watched',
          title: session.videos?.title || 'Unknown Video',
          timestamp: new Date(session.created_at),
          link: `/dashboard/student/courses`, // TODO: Link to specific video
        });
      });
    }

    // Fetch recent chat messages
    const { data: chatMessages } = await supabase
      .from('chat_messages')
      .select(`
        id,
        created_at,
        content,
        session_id,
        chat_sessions (
          title
        )
      `)
      .eq('role', 'user')
      .in('session_id',
        supabase
          .from('chat_sessions')
          .select('id')
          .eq('student_id', studentId)
      )
      .order('created_at', { ascending: false })
      .limit(5);

    if (chatMessages) {
      chatMessages.forEach((message: any) => {
        activities.push({
          id: `chat-${message.id}`,
          type: 'chat_message',
          title: message.content.substring(0, 100),
          description: message.chat_sessions?.title,
          timestamp: new Date(message.created_at),
          link: `/dashboard/student/chat?session=${message.session_id}`,
        });
      });
    }

    // Sort all activities by timestamp
    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return activities.slice(0, 10);
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return [];
  }
}
