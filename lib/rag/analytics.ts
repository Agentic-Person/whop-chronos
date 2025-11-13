/**
 * Chat Analytics
 *
 * Comprehensive analytics for chat sessions:
 * - Messages per student/video tracking
 * - Most referenced videos
 * - Common question topics (keyword extraction)
 * - Session duration calculation
 * - Engagement metrics
 * - Time-based analytics
 */

import { getServiceSupabase } from '../db/client';
import { Tables } from '../db/client';
import type {
  SessionAnalytics,
  CreatorChatAnalytics,
  ChatUsageMetrics,
  VideoReference,
} from './types';
import { estimateSessionCost } from './cost-calculator';

/**
 * Get analytics for a specific session
 */
export async function getSessionAnalytics(
  sessionId: string,
): Promise<SessionAnalytics> {
  const supabase = getServiceSupabase();

  // Get session
  const { data: session, error: sessionError } = await (supabase as any)
    .from(Tables.CHAT_SESSIONS)
    .select('*')
    .eq('id', sessionId)
    .single();

  if (sessionError || !session) {
    throw new Error('Session not found');
  }

  // Get all messages
  const { data: messages, error: messagesError } = await (supabase as any)
    .from(Tables.CHAT_MESSAGES)
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (messagesError) {
    throw new Error(`Failed to load messages: ${messagesError.message}`);
  }

  const userMessages = messages.filter((m: any) => m.role === 'user');
  const assistantMessages = messages.filter((m: any) => m.role === 'assistant');

  // Calculate session duration
  const startTime = new Date(session.created_at).getTime();
  const endTime = session.last_message_at
    ? new Date(session.last_message_at).getTime()
    : startTime;
  const durationMinutes = (endTime - startTime) / (1000 * 60);

  // Calculate total tokens and cost
  const totalTokens = messages.reduce(
    (sum: number, msg: any) => sum + (msg.token_count || 0),
    0,
  );
  const costBreakdown = estimateSessionCost(
    messages.length,
    undefined,
    undefined,
    messages[0]?.model || undefined,
  );

  // Extract video references
  const videoReferences = new Map<
    string,
    { video_id: string; title: string; count: number }
  >();

  for (const message of messages) {
    if (message.video_references) {
      const refs = message.video_references as VideoReference[];
      for (const ref of refs) {
        const existing = videoReferences.get(ref.video_id);
        if (existing) {
          existing.count++;
        } else {
          videoReferences.set(ref.video_id, {
            video_id: ref.video_id,
            title: ref.video_title,
            count: 1,
          });
        }
      }
    }
  }

  const mostReferencedVideos = Array.from(videoReferences.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map((v) => ({
      video_id: v.video_id,
      video_title: v.title,
      reference_count: v.count,
    }));

  // Calculate average response time (time between user message and assistant response)
  let totalResponseTime = 0;
  let responseCount = 0;

  for (let i = 0; i < messages.length - 1; i++) {
    if (messages[i].role === 'user' && messages[i + 1].role === 'assistant') {
      const userTime = new Date(messages[i].created_at).getTime();
      const assistantTime = new Date(messages[i + 1].created_at).getTime();
      totalResponseTime += assistantTime - userTime;
      responseCount++;
    }
  }

  const avgResponseTimeMs =
    responseCount > 0 ? totalResponseTime / responseCount : null;

  return {
    session_id: sessionId,
    duration_minutes: Math.round(durationMinutes * 100) / 100,
    message_count: messages.length,
    user_messages: userMessages.length,
    assistant_messages: assistantMessages.length,
    total_tokens: totalTokens,
    total_cost: costBreakdown.total_cost,
    videos_referenced: videoReferences.size,
    avg_response_time_ms: avgResponseTimeMs,
    most_referenced_videos: mostReferencedVideos,
  };
}

/**
 * Get creator-level chat analytics
 */
export async function getCreatorChatAnalytics(
  creatorId: string,
  period: 'day' | 'week' | 'month' | 'all' = 'month',
): Promise<CreatorChatAnalytics> {
  const supabase = getServiceSupabase();

  // Calculate date range
  const now = new Date();
  let fromDate: Date;

  switch (period) {
    case 'day':
      fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case 'week':
      fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'all':
      fromDate = new Date(0);
      break;
  }

  // Get sessions in period
  const { data: sessions, error: sessionsError } = await (supabase as any)
    .from(Tables.CHAT_SESSIONS)
    .select('*')
    .eq('creator_id', creatorId)
    .gte('created_at', fromDate.toISOString());

  if (sessionsError) {
    throw new Error(`Failed to load sessions: ${sessionsError.message}`);
  }

  const sessionIds = sessions.map((s: any) => s.id);

  if (sessionIds.length === 0) {
    return getEmptyAnalytics(creatorId, period);
  }

  // Get all messages for these sessions
  const { data: messages, error: messagesError } = await (supabase as any)
    .from(Tables.CHAT_MESSAGES)
    .select('*')
    .in('session_id', sessionIds);

  if (messagesError) {
    throw new Error(`Failed to load messages: ${messagesError.message}`);
  }

  // Get student info
  const studentIds = Array.from(new Set(sessions.map((s: any) => s.student_id)));
  const { data: students } = await (supabase as any)
    .from(Tables.STUDENTS)
    .select('id, name')
    .in('id', studentIds);

  const studentMap = new Map(
    students?.map((s: any) => [s.id, s.name || 'Unknown']) || [],
  );

  // Calculate metrics
  const totalSessions = sessions.length;
  const totalMessages = messages?.length || 0;
  const totalStudents = studentIds.length;

  const totalTokens = messages?.reduce(
    (sum: number, msg: any) => sum + (msg.token_count || 0),
    0,
  ) || 0;

  const estimatedCost = estimateSessionCost(totalMessages).total_cost;

  const avgMessagesPerSession =
    totalSessions > 0 ? totalMessages / totalSessions : 0;

  // Calculate session durations
  let totalDuration = 0;
  for (const session of sessions) {
    if (session.last_message_at) {
      const start = new Date(session.created_at).getTime();
      const end = new Date(session.last_message_at).getTime();
      totalDuration += (end - start) / (1000 * 60); // minutes
    }
  }
  const avgSessionDurationMinutes =
    totalSessions > 0 ? totalDuration / totalSessions : 0;

  // Most active students
  const studentActivity = new Map<
    string,
    { session_count: number; message_count: number }
  >();

  for (const session of sessions) {
    const activity = studentActivity.get(session.student_id) || {
      session_count: 0,
      message_count: 0,
    };
    activity.session_count++;
    studentActivity.set(session.student_id, activity);
  }

  for (const message of messages || []) {
    const session = sessions.find((s: any) => s.id === message.session_id);
    if (session && message.role === 'user') {
      const activity = studentActivity.get(session.student_id);
      if (activity) {
        activity.message_count++;
      }
    }
  }

  const mostActiveStudents = Array.from(studentActivity.entries())
    .map(([student_id, activity]) => ({
      student_id,
      student_name: (studentMap.get(student_id) as string | undefined) || null,
      session_count: activity.session_count,
      message_count: activity.message_count,
    }))
    .sort((a, b) => b.message_count - a.message_count)
    .slice(0, 10);

  // Most referenced videos
  const videoReferences = new Map<
    string,
    { title: string; count: number; sessions: Set<string> }
  >();

  for (const message of messages || []) {
    if (message.video_references) {
      const refs = message.video_references as VideoReference[];
      for (const ref of refs) {
        const existing = videoReferences.get(ref.video_id);
        if (existing) {
          existing.count++;
          existing.sessions.add(message.session_id);
        } else {
          videoReferences.set(ref.video_id, {
            title: ref.video_title,
            count: 1,
            sessions: new Set([message.session_id]),
          });
        }
      }
    }
  }

  const mostReferencedVideos = Array.from(videoReferences.entries())
    .map(([video_id, data]) => ({
      video_id,
      video_title: data.title,
      reference_count: data.count,
      unique_sessions: data.sessions.size,
    }))
    .sort((a, b) => b.reference_count - a.reference_count)
    .slice(0, 10);

  // Extract common topics from user messages
  const commonTopics = extractCommonTopics(
    messages?.filter((m: any) => m.role === 'user').map((m: any) => m.content) || [],
  );

  // Peak usage hours
  const peakUsageHours = calculatePeakUsageHours(messages || []);

  return {
    creator_id: creatorId,
    period,
    total_sessions: totalSessions,
    total_messages: totalMessages,
    total_students: totalStudents,
    total_tokens: totalTokens,
    total_cost: estimatedCost,
    avg_messages_per_session: Math.round(avgMessagesPerSession * 100) / 100,
    avg_session_duration_minutes:
      Math.round(avgSessionDurationMinutes * 100) / 100,
    most_active_students: mostActiveStudents,
    most_referenced_videos: mostReferencedVideos,
    common_topics: commonTopics,
    peak_usage_hours: peakUsageHours,
  };
}

/**
 * Extract common topics from user messages using simple keyword frequency
 */
function extractCommonTopics(
  messages: string[],
): Array<{ keyword: string; count: number }> {
  const stopWords = new Set([
    'the',
    'be',
    'to',
    'of',
    'and',
    'a',
    'in',
    'that',
    'have',
    'i',
    'it',
    'for',
    'not',
    'on',
    'with',
    'he',
    'as',
    'you',
    'do',
    'at',
    'this',
    'but',
    'his',
    'by',
    'from',
    'they',
    'we',
    'say',
    'her',
    'she',
    'or',
    'an',
    'will',
    'my',
    'one',
    'all',
    'would',
    'there',
    'their',
    'what',
    'so',
    'up',
    'out',
    'if',
    'about',
    'who',
    'get',
    'which',
    'go',
    'me',
    'when',
    'make',
    'can',
    'like',
    'time',
    'no',
    'just',
    'him',
    'know',
    'take',
    'people',
    'into',
    'year',
    'your',
    'good',
    'some',
    'could',
    'them',
    'see',
    'other',
    'than',
    'then',
    'now',
    'look',
    'only',
    'come',
    'its',
    'over',
    'think',
    'also',
    'back',
    'after',
    'use',
    'two',
    'how',
    'our',
    'work',
    'first',
    'well',
    'way',
    'even',
    'new',
    'want',
    'because',
    'any',
    'these',
    'give',
    'day',
    'most',
    'us',
  ]);

  const wordCount = new Map<string, number>();

  for (const message of messages) {
    const words = message
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/);

    for (const word of words) {
      if (word.length > 3 && !stopWords.has(word)) {
        wordCount.set(word, (wordCount.get(word) || 0) + 1);
      }
    }
  }

  return Array.from(wordCount.entries())
    .map(([keyword, count]) => ({ keyword, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);
}

/**
 * Calculate peak usage hours from messages
 */
function calculatePeakUsageHours(
  messages: Array<{ created_at: string }>,
): Array<{ hour: number; message_count: number }> {
  const hourCounts = new Map<number, number>();

  for (const message of messages) {
    const hour = new Date(message.created_at).getHours();
    hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
  }

  return Array.from(hourCounts.entries())
    .map(([hour, message_count]) => ({ hour, message_count }))
    .sort((a, b) => b.message_count - a.message_count);
}

/**
 * Get empty analytics object
 */
function getEmptyAnalytics(
  creatorId: string,
  period: 'day' | 'week' | 'month' | 'all',
): CreatorChatAnalytics {
  return {
    creator_id: creatorId,
    period,
    total_sessions: 0,
    total_messages: 0,
    total_students: 0,
    total_tokens: 0,
    total_cost: 0,
    avg_messages_per_session: 0,
    avg_session_duration_minutes: 0,
    most_active_students: [],
    most_referenced_videos: [],
    common_topics: [],
    peak_usage_hours: [],
  };
}

/**
 * Track chat usage metrics (called after each chat interaction)
 */
export async function trackChatUsage(
  creatorId: string,
  tokensUsed: number,
  cost: number,
  studentId: string,
): Promise<void> {
  const supabase = getServiceSupabase();
  const today = new Date().toISOString().split('T')[0];

  // Upsert usage metrics
  const { error } = await (supabase as any)
    .from(Tables.USAGE_METRICS)
    .upsert(
      {
        creator_id: creatorId,
        date: today,
        chat_messages_sent: 1,
        ai_credits_used: tokensUsed,
        metadata: {
          last_student_id: studentId,
          total_cost: cost,
        },
      },
      {
        onConflict: 'creator_id,date',
        ignoreDuplicates: false,
      },
    );

  if (error) {
    console.error('Failed to track chat usage:', error);
  }
}

/**
 * Get chat usage metrics for a creator
 */
export async function getChatUsageMetrics(
  creatorId: string,
  fromDate: string,
  toDate: string,
): Promise<ChatUsageMetrics[]> {
  const supabase = getServiceSupabase();

  const { data: metrics, error } = await (supabase as any)
    .from(Tables.USAGE_METRICS)
    .select('*')
    .eq('creator_id', creatorId)
    .gte('date', fromDate)
    .lte('date', toDate)
    .order('date', { ascending: true });

  if (error) {
    throw new Error(`Failed to load usage metrics: ${error.message}`);
  }

  // Calculate session durations
  const { data: sessions } = await (supabase as any)
    .from(Tables.CHAT_SESSIONS)
    .select('created_at, last_message_at')
    .eq('creator_id', creatorId)
    .gte('created_at', fromDate)
    .lte('created_at', toDate);

  const avgDuration =
    sessions && sessions.length > 0
      ? sessions.reduce((sum: number, s: any) => {
          if (s.last_message_at) {
            const duration =
              (new Date(s.last_message_at).getTime() -
                new Date(s.created_at).getTime()) /
              (1000 * 60);
            return sum + duration;
          }
          return sum;
        }, 0) / sessions.length
      : 0;

  return (
    metrics?.map((m: any) => ({
      creator_id: m.creator_id,
      date: m.date,
      sessions_created: 0, // Would need to query separately
      messages_sent: m.chat_messages_sent,
      tokens_used: m.ai_credits_used,
      cost_usd: (m.metadata as { total_cost?: number })?.total_cost || 0,
      unique_students: m.active_students,
      avg_session_duration_minutes: avgDuration,
    })) || []
  );
}
