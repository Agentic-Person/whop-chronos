/**
 * AI Usage Trend API
 *
 * GET /api/analytics/usage/ai-trend - Get AI message usage trend over time
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAIMessageTrend } from '@/lib/analytics/usage';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const creatorId = searchParams.get('creatorId');
    const daysParam = searchParams.get('days');

    if (!creatorId) {
      return NextResponse.json(
        { error: 'creatorId is required' },
        { status: 400 },
      );
    }

    const days = daysParam ? parseInt(daysParam, 10) : 30;

    if (isNaN(days) || days < 1 || days > 365) {
      return NextResponse.json(
        { error: 'days must be between 1 and 365' },
        { status: 400 },
      );
    }

    const trend = await getAIMessageTrend(creatorId, days);

    return NextResponse.json(trend);
  } catch (error) {
    console.error('Error fetching AI usage trend:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
