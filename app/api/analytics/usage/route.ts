/**
 * Usage Analytics API
 *
 * GET /api/analytics/usage - Get current usage stats for a creator
 */

import { NextRequest, NextResponse } from 'next/server';
import { calculateCurrentUsage } from '@/lib/analytics/usage';
import type { SubscriptionTier } from '@/components/analytics/usage-types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const creatorId = searchParams.get('creatorId');

    if (!creatorId) {
      return NextResponse.json(
        { error: 'creatorId is required' },
        { status: 400 },
      );
    }

    // In production, validate the request is authorized for this creator
    // For now, we'll fetch the creator's tier from database

    const { getServiceSupabase } = await import('@/lib/db/client');
    const supabase = getServiceSupabase();

    const { data: creator, error: creatorError } = await supabase
      .from('creators')
      .select('subscription_tier')
      .eq('id', creatorId)
      .single();

    if (creatorError || !creator) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 },
      );
    }

    const tier = creator.subscription_tier as SubscriptionTier;
    const usage = await calculateCurrentUsage(creatorId, tier);

    return NextResponse.json(usage);
  } catch (error) {
    console.error('Error fetching usage stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
