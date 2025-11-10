/**
 * Chat Analytics API
 *
 * GET /api/chat/analytics - Get creator-level chat analytics
 * GET /api/chat/analytics?creator_id=xxx&period=month
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getCreatorChatAnalytics,
  getChatUsageMetrics,
} from '@/lib/rag/analytics';
import {
  getCostOptimizationSuggestions,
  projectMonthlyCost,
  type MonthlyCostProjection,
} from '@/lib/rag/cost-calculator';

/**
 * GET /api/chat/analytics
 * Get comprehensive chat analytics for a creator
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const creatorId = searchParams.get('creator_id');
    const period =
      (searchParams.get('period') as 'day' | 'week' | 'month' | 'all') ||
      'month';
    const includeUsage = searchParams.get('usage') === 'true';
    const includeCostProjection = searchParams.get('cost_projection') === 'true';

    if (!creatorId) {
      return NextResponse.json(
        { error: 'creator_id is required' },
        { status: 400 },
      );
    }

    // Get main analytics
    const analytics = await getCreatorChatAnalytics(creatorId, period);

    const response: {
      analytics: typeof analytics;
      usage?: Awaited<ReturnType<typeof getChatUsageMetrics>>;
      cost_projection?: MonthlyCostProjection;
      optimization_suggestions?: ReturnType<typeof getCostOptimizationSuggestions>;
    } = {
      analytics,
    };

    // Include usage metrics if requested
    if (includeUsage) {
      const now = new Date();
      const fromDate = new Date(
        now.getTime() - 30 * 24 * 60 * 60 * 1000,
      ).toISOString();
      const toDate = now.toISOString();

      response.usage = await getChatUsageMetrics(creatorId, fromDate, toDate);
    }

    // Include cost projection if requested
    if (includeCostProjection && includeUsage && response.usage) {
      const dailyCosts = response.usage.map((m) => m.cost_usd);
      const totalMessages = response.usage.reduce(
        (sum, m) => sum + m.messages_sent,
        0,
      );
      const totalSessions = analytics.total_sessions;

      response.cost_projection = projectMonthlyCost(
        dailyCosts,
        totalMessages,
        totalSessions,
      );

      // Get optimization suggestions
      response.optimization_suggestions = getCostOptimizationSuggestions(
        {
          input_tokens: Math.floor(analytics.total_tokens * 0.4),
          output_tokens: Math.floor(analytics.total_tokens * 0.6),
          embedding_queries: analytics.total_messages,
          total_tokens: analytics.total_tokens,
          input_cost: analytics.total_cost * 0.3,
          output_cost: analytics.total_cost * 0.65,
          embedding_cost: analytics.total_cost * 0.05,
          total_cost: analytics.total_cost,
        },
        analytics.total_messages,
      );
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Failed to get analytics:', error);
    return NextResponse.json(
      {
        error: 'Failed to get analytics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
