/**
 * Creator Usage Analytics API
 *
 * GET /api/analytics/usage/creator/[id] - Get usage metrics for creator
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/db/client';

export const runtime = 'nodejs';

/**
 * GET /api/analytics/usage/creator/[id]
 *
 * Get usage metrics for a creator
 *
 * Query parameters:
 * - period: '7d' | '30d' | '90d' | 'all' (optional, default: '30d')
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     creator_id: string,
 *     storage_used_gb: number,
 *     storage_used_bytes: number,
 *     ai_credits_used: number,
 *     video_count_by_source: {...},
 *     transcript_costs_by_source: {...},
 *     monthly_spend: number,
 *     total_videos: number,
 *     total_watch_time_hours: number,
 *     active_students: number
 *   }
 * }
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: creatorId } = await params;
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || '30d';

    if (!creatorId) {
      return NextResponse.json(
        { error: 'Missing creator ID' },
        { status: 400 },
      );
    }

    const supabase = getServiceSupabase();

    // Verify creator exists
    const { data: creator, error: creatorError } = await supabase
      .from('creators')
      .select('id, subscription_tier')
      .eq('id', creatorId)
      .single();

    if (creatorError || !creator) {
      return NextResponse.json(
        { error: 'Creator not found', code: 'CREATOR_NOT_FOUND' },
        { status: 404 },
      );
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    if (period !== 'all') {
      const days = Number.parseInt(period.replace('d', ''), 10);
      startDate.setDate(startDate.getDate() - days);
    } else {
      startDate.setFullYear(2020);
    }

    // Fetch usage metrics
    let metricsQuery = supabase
      .from('usage_metrics')
      .select('*')
      .eq('creator_id', creatorId)
      .order('date', { ascending: false });

    if (period !== 'all') {
      metricsQuery = metricsQuery
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0]);
    }

    const { data: usageMetrics, error: metricsError } = await metricsQuery;

    if (metricsError) {
      console.error('Error fetching usage metrics:', metricsError);
      return NextResponse.json(
        { error: 'Failed to fetch usage metrics', code: 'FETCH_FAILED' },
        { status: 500 },
      );
    }

    // Get current storage usage from videos
    const { data: videos, error: videosError } = await supabase
      .from('videos')
      .select('file_size_bytes, source_type, metadata')
      .eq('creator_id', creatorId)
      .eq('is_deleted', false);

    if (videosError) {
      console.error('Error fetching videos:', videosError);
    }

    // Calculate storage metrics
    const totalStorageBytes = videos?.reduce(
      (sum, video: any) => sum + (video.file_size_bytes || 0),
      0,
    ) || 0;
    const storageUsedGB = totalStorageBytes / (1024 * 1024 * 1024);

    // Count videos by source
    const videoCountBySource: Record<string, number> = {
      youtube: 0,
      upload: 0,
      mux: 0,
      loom: 0,
    };

    const transcriptCostsBySource: Record<string, number> = {
      youtube: 0,
      upload: 0,
      mux: 0,
      loom: 0,
    };

    for (const video of videos || []) {
      const v = video as any;
      const sourceType = v.source_type || 'upload';
      videoCountBySource[sourceType] = (videoCountBySource[sourceType] || 0) + 1;

      // Calculate transcript cost based on source
      const metadata = v.metadata as { transcript_cost?: number; transcript_method?: string };
      if (metadata?.transcript_cost) {
        transcriptCostsBySource[sourceType] =
          (transcriptCostsBySource[sourceType] || 0) + metadata.transcript_cost;
      } else {
        // Estimate cost based on source type
        if (sourceType === 'youtube' || sourceType === 'loom' || sourceType === 'mux') {
          transcriptCostsBySource[sourceType] = (transcriptCostsBySource[sourceType] || 0) + 0; // Free
        } else if (sourceType === 'upload') {
          // Estimate Whisper cost: $0.006/minute (assume 10 min average)
          transcriptCostsBySource[sourceType] = (transcriptCostsBySource[sourceType] || 0) + 0.06;
        }
      }
    }

    // Aggregate usage metrics
    const totalAiCreditsUsed = usageMetrics?.reduce(
      (sum, day: any) => sum + (day.ai_credits_used || 0),
      0,
    ) || 0;

    const totalTranscriptionMinutes = usageMetrics?.reduce(
      (sum, day: any) => sum + (Number(day.transcription_minutes) || 0),
      0,
    ) || 0;

    const totalActiveStudents = Math.max(
      ...(usageMetrics?.map((day: any) => day.active_students || 0) || [0]),
    );

    // Calculate monthly spend
    const totalTranscriptCost = Object.values(transcriptCostsBySource).reduce(
      (sum, cost) => sum + cost,
      0,
    );
    const embeddingCost = (videos?.length || 0) * 0.0001; // $0.0001 per embedding (estimate)
    const monthlySpend = totalTranscriptCost + embeddingCost;

    // Get tier limits
    const tierLimits = getTierLimits((creator as any).subscription_tier);

    return NextResponse.json(
      {
        success: true,
        data: {
          creator_id: creatorId,
          period,
          subscription_tier: (creator as any).subscription_tier,

          // Storage metrics
          storage_used_bytes: totalStorageBytes,
          storage_used_gb: Math.round(storageUsedGB * 100) / 100,
          storage_limit_gb: tierLimits.storage_gb,
          storage_percentage: (storageUsedGB / tierLimits.storage_gb) * 100,

          // Video counts
          total_videos: videos?.length || 0,
          video_count_by_source: videoCountBySource,

          // Cost metrics
          transcript_costs_by_source: transcriptCostsBySource,
          total_transcript_cost: Math.round(totalTranscriptCost * 100) / 100,
          monthly_spend: Math.round(monthlySpend * 100) / 100,

          // Usage metrics
          ai_credits_used: totalAiCreditsUsed,
          ai_credits_limit: tierLimits.ai_credits,
          ai_credits_percentage: (totalAiCreditsUsed / tierLimits.ai_credits) * 100,
          transcription_minutes: Math.round(totalTranscriptionMinutes),
          active_students: totalActiveStudents,

          // Tier limits
          limits: tierLimits,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Creator usage analytics API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

/**
 * Get tier limits based on subscription tier
 */
function getTierLimits(tier: string): {
  storage_gb: number;
  ai_credits: number;
  videos: number;
} {
  const limits = {
    basic: {
      storage_gb: 10,
      ai_credits: 1000,
      videos: 50,
    },
    pro: {
      storage_gb: 100,
      ai_credits: 10000,
      videos: 500,
    },
    enterprise: {
      storage_gb: 1000,
      ai_credits: 100000,
      videos: 5000,
    },
  };

  return limits[tier as keyof typeof limits] || limits.basic;
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
