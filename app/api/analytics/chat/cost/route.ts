import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { calculateAICost } from '@/lib/analytics/chat';
import type { ChatMessage, CostBreakdown } from '@/components/analytics/chat-types';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/analytics/chat/cost
 * Returns AI cost breakdown and projections
 *
 * Query params:
 * - creatorId: string (required)
 * - timeRange: '7d' | '30d' | '90d' | 'all' (default: '30d')
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const creatorId = searchParams.get('creatorId');
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

    // Fetch AI messages (assistant role only) with token/cost data
    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('creator_id', creatorId)
      .eq('role', 'assistant')
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
      return NextResponse.json({
        data: {
          total: 0,
          byModel: {},
          byDate: [],
          perMessage: 0,
          perStudent: 0,
        },
      });
    }

    // Calculate cost breakdown
    const costBreakdown = calculateAICost(messages as ChatMessage[]);

    // Add projections if we have enough data
    const projections = calculateProjections(costBreakdown, days);

    return NextResponse.json({
      data: {
        ...costBreakdown,
        projections,
      },
    });
  } catch (error) {
    console.error('Cost analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Calculate cost projections based on current usage
 */
function calculateProjections(
  breakdown: CostBreakdown,
  days: number
): {
  monthly: number;
  daily: number;
  trend: 'increasing' | 'decreasing' | 'stable';
} {
  // Calculate daily average
  const dailyAverage = breakdown.total / Math.max(days, 1);

  // Project to monthly (30 days)
  const monthlyProjection = dailyAverage * 30;

  // Determine trend from recent vs older data
  let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';

  if (breakdown.byDate.length >= 7) {
    // Compare last 3 days to previous 4 days
    const recentDays = breakdown.byDate.slice(-3);
    const olderDays = breakdown.byDate.slice(-7, -3);

    const recentAvg =
      recentDays.reduce((sum, d) => sum + d.cost, 0) / recentDays.length;
    const olderAvg =
      olderDays.reduce((sum, d) => sum + d.cost, 0) / olderDays.length;

    const changePercent = ((recentAvg - olderAvg) / olderAvg) * 100;

    if (changePercent > 10) trend = 'increasing';
    else if (changePercent < -10) trend = 'decreasing';
  }

  return {
    monthly: monthlyProjection,
    daily: dailyAverage,
    trend,
  };
}

/**
 * POST /api/analytics/chat/cost
 * Update cost data for chat messages (called after AI API calls)
 *
 * Body:
 * - messageId: string
 * - inputTokens: number
 * - outputTokens: number
 * - model: string
 * - responseTimeMs: number
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messageId, inputTokens, outputTokens, model, responseTimeMs } = body;

    if (!messageId || !inputTokens || !outputTokens || !model) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Calculate cost
    const costs: Record<
      string,
      { input: number; output: number }
    > = {
      'claude-3-5-haiku-20241022': { input: 0.8, output: 4.0 },
      'claude-3-5-sonnet-20241022': { input: 3.0, output: 15.0 },
      haiku: { input: 0.8, output: 4.0 },
      sonnet: { input: 3.0, output: 15.0 },
    };

    const pricing = costs[model] || costs.haiku;
    const costUsd =
      (inputTokens * pricing.input + outputTokens * pricing.output) / 1_000_000;

    // Update message with token and cost data
    const { error } = await supabase
      .from('chat_messages')
      .update({
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        model,
        cost_usd: costUsd,
        response_time_ms: responseTimeMs,
      })
      .eq('id', messageId);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to update message' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      costUsd,
    });
  } catch (error) {
    console.error('Cost update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
