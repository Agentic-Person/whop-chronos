import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { clusterSimilarQuestions, extractVideoReferences } from '@/lib/analytics/chat';
import type { ChatMessage, QuestionCluster } from '@/components/analytics/chat-types';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/analytics/chat/popular-questions
 * Returns clustered popular questions from student chats
 *
 * Query params:
 * - creatorId: string (required)
 * - limit: number (default: 20)
 * - timeRange: '7d' | '30d' | '90d' | 'all' (default: '30d')
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const creatorId = searchParams.get('creatorId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const timeRange = searchParams.get('timeRange') || '30d';

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

    // Fetch user questions (role = 'user')
    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('creator_id', creatorId)
      .eq('role', 'user')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch chat messages' },
        { status: 500 }
      );
    }

    if (!messages || messages.length === 0) {
      return NextResponse.json({ questions: [] });
    }

    // Extract question texts
    const questions = messages.map((m: ChatMessage) => m.content.trim());

    // Cluster similar questions
    const clusters = clusterSimilarQuestions(questions);

    // Enhance clusters with response time and video reference data
    const enhancedClusters = await enhanceClusters(
      clusters,
      messages as ChatMessage[],
      creatorId
    );

    // Return top N clusters
    const topClusters = enhancedClusters.slice(0, limit);

    return NextResponse.json({ questions: topClusters });
  } catch (error) {
    console.error('Popular questions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Enhance question clusters with response time and video references
 */
async function enhanceClusters(
  clusters: QuestionCluster[],
  userMessages: ChatMessage[],
  creatorId: string
): Promise<QuestionCluster[]> {
  // Build a map of question to message for fast lookup
  const questionToMessage = new Map<string, ChatMessage>();
  userMessages.forEach((msg) => {
    questionToMessage.set(msg.content.trim(), msg);
  });

  // Fetch all AI responses to calculate response times
  const sessionIds = [
    ...new Set(userMessages.map((m) => m.session_id).filter(Boolean)),
  ];

  const { data: allMessages } = await supabase
    .from('chat_messages')
    .select('*')
    .in('session_id', sessionIds)
    .order('created_at', { ascending: true });

  if (!allMessages) {
    return clusters;
  }

  // Build message pairs (user question -> AI response)
  const messagePairs = new Map<string, ChatMessage>();
  for (let i = 0; i < allMessages.length - 1; i++) {
    const current = allMessages[i] as ChatMessage;
    const next = allMessages[i + 1] as ChatMessage;

    if (current.role === 'user' && next.role === 'assistant') {
      messagePairs.set(current.content.trim(), next);
    }
  }

  // Enhance each cluster
  const enhanced = clusters.map((cluster) => {
    const responseTimes: number[] = [];
    const videoRefs = new Set<string>();

    // Process each variation in the cluster
    cluster.variations.forEach((variation) => {
      const aiResponse = messagePairs.get(variation);

      if (aiResponse) {
        // Add response time
        if (aiResponse.response_time_ms) {
          responseTimes.push(aiResponse.response_time_ms / 1000);
        }

        // Add video references
        const refs = extractVideoReferences(aiResponse);
        refs.forEach((ref) => videoRefs.add(ref));
      }
    });

    // Calculate average response time
    const avgResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0;

    return {
      ...cluster,
      avgResponseTime,
      referencedVideos: Array.from(videoRefs),
    };
  });

  return enhanced;
}
