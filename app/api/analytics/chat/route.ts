import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  calculateResponseQuality,
  detectSessionBoundaries,
  extractVideoReferences,
  calculateTrend,
} from '@/lib/analytics/chat';
import type {
  ChatVolumeData,
  QualityMetrics,
  VideoReferenceData,
  StudentChatActivityData,
  SessionMetrics,
  ChatMessage,
} from '@/components/analytics/chat-types';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/analytics/chat
 * Main chat analytics endpoint with multiple metric types
 *
 * Query params:
 * - creatorId: string (required)
 * - timeRange: '7d' | '30d' | '90d' | 'all' (default: '30d')
 * - metric: 'volume' | 'quality' | 'sessions' | 'video-references' | 'student-activity'
 * - sortBy: 'messages' | 'sessions' | 'lastActive' (for student-activity)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const creatorId = searchParams.get('creatorId');
    const timeRange = searchParams.get('timeRange') || '30d';
    const metric = searchParams.get('metric') || 'volume';
    const sortBy = searchParams.get('sortBy') || 'messages';

    if (!creatorId) {
      return NextResponse.json(
        { error: 'creatorId is required' },
        { status: 400 }
      );
    }

    // Calculate date range
    const daysMap: Record<string, number> = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      all: 9999,
    };
    const days = daysMap[timeRange] || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch chat messages for the time range
    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('creator_id', creatorId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch chat data' },
        { status: 500 }
      );
    }

    if (!messages || messages.length === 0) {
      return NextResponse.json({ data: getEmptyData(metric) });
    }

    // Route to appropriate metric handler
    let data;
    switch (metric) {
      case 'volume':
        data = await getChatVolumeData(messages as ChatMessage[]);
        break;
      case 'quality':
        data = calculateResponseQuality(messages as ChatMessage[]);
        break;
      case 'sessions':
        data = await getSessionMetrics(messages as ChatMessage[], creatorId);
        break;
      case 'video-references':
        data = await getVideoReferenceData(messages as ChatMessage[]);
        break;
      case 'student-activity':
        data = await getStudentActivityData(
          messages as ChatMessage[],
          sortBy as 'messages' | 'sessions' | 'lastActive'
        );
        break;
      default:
        return NextResponse.json(
          { error: `Unknown metric: ${metric}` },
          { status: 400 }
        );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Chat analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Calculate chat volume data grouped by date
 */
async function getChatVolumeData(
  messages: ChatMessage[]
): Promise<ChatVolumeData[]> {
  const volumeMap = new Map<
    string,
    { studentMessages: number; aiResponses: number; responseTimes: number[] }
  >();

  messages.forEach((msg) => {
    const date = new Date(msg.created_at).toISOString().split('T')[0];

    if (!volumeMap.has(date)) {
      volumeMap.set(date, {
        studentMessages: 0,
        aiResponses: 0,
        responseTimes: [],
      });
    }

    const dayData = volumeMap.get(date)!;

    if (msg.role === 'user') {
      dayData.studentMessages++;
    } else if (msg.role === 'assistant') {
      dayData.aiResponses++;
      if (msg.response_time_ms) {
        dayData.responseTimes.push(msg.response_time_ms / 1000); // Convert to seconds
      }
    }
  });

  return Array.from(volumeMap.entries())
    .map(([date, data]) => ({
      date,
      studentMessages: data.studentMessages,
      aiResponses: data.aiResponses,
      avgResponseTime:
        data.responseTimes.length > 0
          ? data.responseTimes.reduce((a, b) => a + b, 0) /
            data.responseTimes.length
          : 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Calculate session metrics with trend analysis
 */
async function getSessionMetrics(
  messages: ChatMessage[],
  creatorId: string
): Promise<SessionMetrics> {
  const sessions = detectSessionBoundaries(messages);

  // Calculate current period metrics
  const totalSessions = sessions.length;
  const avgMessagesPerSession =
    totalSessions > 0
      ? sessions.reduce((sum, s) => sum + s.messageCount, 0) / totalSessions
      : 0;
  const avgSessionDuration =
    totalSessions > 0
      ? sessions.reduce((sum, s) => sum + s.duration, 0) /
        totalSessions /
        1000
      : 0;
  const completionRate =
    totalSessions > 0
      ? sessions.filter((s) => s.completed).length / totalSessions
      : 0;

  // Get previous period for trend
  const currentPeriodStart = messages.length > 0 ? new Date(messages[0].created_at) : new Date();
  const currentPeriodEnd = messages.length > 0 ? new Date(messages[messages.length - 1].created_at) : new Date();
  const periodLength = currentPeriodEnd.getTime() - currentPeriodStart.getTime();

  const previousPeriodStart = new Date(currentPeriodStart.getTime() - periodLength);
  const previousPeriodEnd = currentPeriodStart;

  const { data: previousMessages } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('creator_id', creatorId)
    .gte('created_at', previousPeriodStart.toISOString())
    .lt('created_at', previousPeriodEnd.toISOString());

  const previousSessions = previousMessages
    ? detectSessionBoundaries(previousMessages as ChatMessage[])
    : [];
  const previousTotalSessions = previousSessions.length;

  const { trend, percentage } = calculateTrend(
    totalSessions,
    previousTotalSessions
  );

  return {
    totalSessions,
    avgMessagesPerSession,
    avgSessionDuration,
    completionRate,
    trend,
    trendPercentage: percentage,
  };
}

/**
 * Calculate video reference frequency data
 */
async function getVideoReferenceData(
  messages: ChatMessage[]
): Promise<VideoReferenceData[]> {
  const videoMap = new Map<
    string,
    { title: string; daily: number; weekly: number; monthly: number }
  >();

  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Process assistant messages only
  const aiMessages = messages.filter((m) => m.role === 'assistant');

  for (const msg of aiMessages) {
    const videoIds = extractVideoReferences(msg);
    const msgDate = new Date(msg.created_at);

    for (const videoId of videoIds) {
      if (!videoMap.has(videoId)) {
        videoMap.set(videoId, { title: videoId, daily: 0, weekly: 0, monthly: 0 });
      }

      const data = videoMap.get(videoId)!;

      if (msgDate >= oneMonthAgo) data.monthly++;
      if (msgDate >= oneWeekAgo) data.weekly++;
      if (msgDate >= oneDayAgo) data.daily++;
    }
  }

  // Fetch video titles from database
  const videoIds = Array.from(videoMap.keys());
  if (videoIds.length > 0) {
    const { data: videos } = await supabase
      .from('videos')
      .select('id, title')
      .in('id', videoIds);

    if (videos) {
      videos.forEach((video) => {
        const data = videoMap.get(video.id);
        if (data) {
          data.title = video.title;
        }
      });
    }
  }

  return Array.from(videoMap.entries())
    .map(([videoId, data]) => ({
      videoId,
      videoTitle: data.title,
      daily: data.daily,
      weekly: data.weekly,
      monthly: data.monthly,
    }))
    .sort((a, b) => b.monthly - a.monthly); // Sort by monthly frequency
}

/**
 * Calculate per-student activity data
 */
async function getStudentActivityData(
  messages: ChatMessage[],
  sortBy: 'messages' | 'sessions' | 'lastActive'
): Promise<StudentChatActivityData[]> {
  const studentMap = new Map<
    string,
    {
      email: string;
      messages: ChatMessage[];
      lastActive: Date;
    }
  >();

  // Group messages by student
  messages.forEach((msg) => {
    if (!studentMap.has(msg.student_id)) {
      studentMap.set(msg.student_id, {
        email: msg.student_id, // Will be replaced with actual email
        messages: [],
        lastActive: new Date(msg.created_at),
      });
    }

    const data = studentMap.get(msg.student_id)!;
    data.messages.push(msg);

    const msgDate = new Date(msg.created_at);
    if (msgDate > data.lastActive) {
      data.lastActive = msgDate;
    }
  });

  // Fetch student emails
  const studentIds = Array.from(studentMap.keys());
  if (studentIds.length > 0) {
    const { data: students } = await supabase
      .from('students')
      .select('id, email')
      .in('id', studentIds);

    if (students) {
      students.forEach((student) => {
        const data = studentMap.get(student.id);
        if (data) {
          data.email = student.email;
        }
      });
    }
  }

  // Calculate metrics for each student
  const studentData: StudentChatActivityData[] = Array.from(
    studentMap.entries()
  ).map(([studentId, data]) => {
    const sessions = detectSessionBoundaries(data.messages);
    const avgSessionLength =
      sessions.length > 0
        ? sessions.reduce((sum, s) => sum + s.duration, 0) /
          sessions.length /
          60000
        : 0; // Convert to minutes

    return {
      studentId,
      studentEmail: data.email,
      totalMessages: data.messages.length,
      sessions: sessions.length,
      lastActive: data.lastActive.toISOString(),
      avgSessionLength,
    };
  });

  // Sort by requested field
  studentData.sort((a, b) => {
    switch (sortBy) {
      case 'messages':
        return b.totalMessages - a.totalMessages;
      case 'sessions':
        return b.sessions - a.sessions;
      case 'lastActive':
        return new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime();
      default:
        return 0;
    }
  });

  return studentData;
}

/**
 * Get empty data structure for a metric type
 */
function getEmptyData(metric: string): any {
  switch (metric) {
    case 'volume':
      return [];
    case 'quality':
      return {
        avgLength: 0,
        citationRate: 0,
        followUpRate: 0,
        satisfactionScore: 0,
      };
    case 'sessions':
      return {
        totalSessions: 0,
        avgMessagesPerSession: 0,
        avgSessionDuration: 0,
        completionRate: 0,
        trend: 'stable',
        trendPercentage: 0,
      };
    case 'video-references':
      return [];
    case 'student-activity':
      return [];
    default:
      return null;
  }
}
