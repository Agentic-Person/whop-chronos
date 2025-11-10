/**
 * Quota Check API
 *
 * GET /api/analytics/usage/quota - Real-time quota check before operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkQuota } from '@/lib/analytics/usage';
import type {
  SubscriptionTier,
  TierLimits,
  QuotaCheckResult,
} from '@/components/analytics/usage-types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const creatorId = searchParams.get('creatorId');
    const operation = searchParams.get('operation') as keyof TierLimits | null;

    if (!creatorId || !operation) {
      return NextResponse.json(
        { error: 'creatorId and operation are required' },
        { status: 400 },
      );
    }

    // Validate operation type
    const validOperations: Array<keyof TierLimits> = [
      'videos',
      'storage_gb',
      'ai_messages_per_month',
      'students',
      'courses',
    ];

    if (!validOperations.includes(operation)) {
      return NextResponse.json(
        { error: 'Invalid operation type' },
        { status: 400 },
      );
    }

    // Fetch creator's tier
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
    const quotaCheck = await checkQuota(creatorId, tier, operation);

    // Build response
    const result: QuotaCheckResult = {
      allowed: quotaCheck.allowed,
      reason: quotaCheck.reason,
      upgradeUrl: quotaCheck.allowed
        ? undefined
        : `/dashboard/${creatorId}/settings/billing`,
    };

    // If not allowed, include current usage info
    if (!quotaCheck.allowed) {
      const { calculateCurrentUsage } = await import('@/lib/analytics/usage');
      const usage = await calculateCurrentUsage(creatorId, tier);

      // Map operation to usage key
      const usageKey = operation === 'ai_messages_per_month' ? 'ai_messages' : operation;
      const stat = usage.usage[usageKey as keyof typeof usage.usage];

      result.currentUsage = stat.current;
      result.limit = stat.limit;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error checking quota:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
