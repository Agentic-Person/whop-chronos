/**
 * Transcript Cost Analytics
 *
 * Query and analyze transcript extraction costs across different sources.
 *
 * Features:
 * - Cost breakdown by source (YouTube, Loom, Mux, Whisper)
 * - Monthly/weekly/daily cost aggregation
 * - Free vs. paid usage tracking
 * - Cost savings metrics
 * - Creator-specific analytics
 *
 * @module transcript-costs
 */

import { getServiceSupabase } from '@/lib/db/client';

/**
 * Cost breakdown by transcript source
 */
export interface TranscriptCostBreakdown {
  youtube: {
    count: number;
    total_minutes: number;
    total_cost: number;
    avg_duration: number;
  };
  loom: {
    count: number;
    total_minutes: number;
    total_cost: number;
    avg_duration: number;
  };
  mux: {
    count: number;
    total_minutes: number;
    total_cost: number;
    avg_duration: number;
  };
  whisper: {
    count: number;
    total_minutes: number;
    total_cost: number;
    avg_duration: number;
  };
  totals: {
    count: number;
    total_minutes: number;
    total_cost: number;
    free_count: number;
    paid_count: number;
    cost_savings: number; // How much saved by using free sources
  };
}

/**
 * Daily cost summary
 */
export interface DailyCostSummary {
  date: string;
  total_transcriptions: number;
  free_transcriptions: number;
  paid_transcriptions: number;
  total_cost: number;
  total_minutes: number;
  breakdown_by_source: {
    youtube: number;
    loom: number;
    mux: number;
    whisper: number;
  };
}

/**
 * Get transcript cost breakdown by source for a creator
 *
 * @param creatorId - Creator ID
 * @param dateRange - Optional date range filter
 * @returns Cost breakdown by source
 *
 * @example
 * ```typescript
 * const breakdown = await getTranscriptCostsBySource('creator_123', {
 *   start: new Date('2025-01-01'),
 *   end: new Date('2025-01-31'),
 * });
 * console.log(`Total cost: $${breakdown.totals.total_cost}`);
 * console.log(`Cost savings: $${breakdown.totals.cost_savings}`);
 * ```
 */
export async function getTranscriptCostsBySource(
  creatorId: string,
  dateRange?: { start: Date; end: Date }
): Promise<TranscriptCostBreakdown> {
  const supabase = getServiceSupabase();

  // Query video analytics events for transcript extractions
  let query = supabase
    .from('video_analytics_events')
    .select('metadata, timestamp')
    .eq('creator_id', creatorId)
    .eq('event_type', 'video_transcribed')
    .order('timestamp', { ascending: false });

  if (dateRange) {
    query = query
      .gte('timestamp', dateRange.start.toISOString())
      .lte('timestamp', dateRange.end.toISOString());
  }

  const { data: events, error } = await query;

  if (error) {
    console.error('Failed to fetch transcript cost data:', error);
    throw new Error('Failed to fetch transcript cost data');
  }

  // Initialize breakdown
  const breakdown: TranscriptCostBreakdown = {
    youtube: { count: 0, total_minutes: 0, total_cost: 0, avg_duration: 0 },
    loom: { count: 0, total_minutes: 0, total_cost: 0, avg_duration: 0 },
    mux: { count: 0, total_minutes: 0, total_cost: 0, avg_duration: 0 },
    whisper: { count: 0, total_minutes: 0, total_cost: 0, avg_duration: 0 },
    totals: {
      count: 0,
      total_minutes: 0,
      total_cost: 0,
      free_count: 0,
      paid_count: 0,
      cost_savings: 0,
    },
  };

  // Process events
  for (const event of events || []) {
    const metadata = event.metadata as any;
    const method = metadata.transcript_method || 'unknown';
    const duration = metadata.duration_seconds || 0;
    const cost = metadata.cost_usd || 0;
    const minutes = duration / 60;

    // Skip failed transcriptions
    if (metadata.failed) {
      continue;
    }

    // Map method to source
    let source: keyof Omit<TranscriptCostBreakdown, 'totals'>;
    if (method.includes('youtube')) {
      source = 'youtube';
    } else if (method.includes('loom')) {
      source = 'loom';
    } else if (method.includes('mux')) {
      source = 'mux';
    } else if (method.includes('whisper')) {
      source = 'whisper';
    } else {
      continue; // Unknown method
    }

    // Update source breakdown
    breakdown[source].count++;
    breakdown[source].total_minutes += minutes;
    breakdown[source].total_cost += cost;

    // Update totals
    breakdown.totals.count++;
    breakdown.totals.total_minutes += minutes;
    breakdown.totals.total_cost += cost;

    if (cost === 0) {
      breakdown.totals.free_count++;
    } else {
      breakdown.totals.paid_count++;
    }
  }

  // Calculate averages
  for (const source of ['youtube', 'loom', 'mux', 'whisper'] as const) {
    if (breakdown[source].count > 0) {
      breakdown[source].avg_duration = breakdown[source].total_minutes / breakdown[source].count;
    }
  }

  // Calculate cost savings
  // If we used Whisper for all videos, what would it have cost?
  const whisperRatePerMinute = 0.006;
  const hypotheticalWhisperCost = breakdown.totals.total_minutes * whisperRatePerMinute;
  breakdown.totals.cost_savings = hypotheticalWhisperCost - breakdown.totals.total_cost;

  return breakdown;
}

/**
 * Get monthly transcript spending for a creator
 *
 * @param creatorId - Creator ID
 * @param month - Month to query (YYYY-MM format)
 * @returns Total cost for the month
 *
 * @example
 * ```typescript
 * const cost = await getMonthlyTranscriptSpend('creator_123', '2025-01');
 * console.log(`January 2025: $${cost.toFixed(2)}`);
 * ```
 */
export async function getMonthlyTranscriptSpend(
  creatorId: string,
  month: string // YYYY-MM format
): Promise<number> {
  const supabase = getServiceSupabase();

  // Parse month
  const [year, monthNum] = month.split('-').map(Number);
  const startDate = new Date(year, monthNum - 1, 1);
  const endDate = new Date(year, monthNum, 0, 23, 59, 59);

  const breakdown = await getTranscriptCostsBySource(creatorId, {
    start: startDate,
    end: endDate,
  });

  return breakdown.totals.total_cost;
}

/**
 * Get daily cost summaries for a date range
 *
 * @param creatorId - Creator ID
 * @param dateRange - Date range to query
 * @returns Array of daily summaries
 *
 * @example
 * ```typescript
 * const summaries = await getDailyTranscriptCosts('creator_123', {
 *   start: new Date('2025-01-01'),
 *   end: new Date('2025-01-07'),
 * });
 * summaries.forEach(day => {
 *   console.log(`${day.date}: ${day.total_transcriptions} videos, $${day.total_cost}`);
 * });
 * ```
 */
export async function getDailyTranscriptCosts(
  creatorId: string,
  dateRange: { start: Date; end: Date }
): Promise<DailyCostSummary[]> {
  const supabase = getServiceSupabase();

  const { data: events, error } = await supabase
    .from('video_analytics_events')
    .select('metadata, timestamp')
    .eq('creator_id', creatorId)
    .eq('event_type', 'video_transcribed')
    .gte('timestamp', dateRange.start.toISOString())
    .lte('timestamp', dateRange.end.toISOString())
    .order('timestamp', { ascending: true });

  if (error) {
    throw new Error('Failed to fetch daily cost data');
  }

  // Group by date
  const dailyMap = new Map<string, DailyCostSummary>();

  for (const event of events || []) {
    const metadata = event.metadata as any;
    const date = event.timestamp.split('T')[0]; // YYYY-MM-DD

    // Skip failed transcriptions
    if (metadata.failed) {
      continue;
    }

    if (!dailyMap.has(date)) {
      dailyMap.set(date, {
        date,
        total_transcriptions: 0,
        free_transcriptions: 0,
        paid_transcriptions: 0,
        total_cost: 0,
        total_minutes: 0,
        breakdown_by_source: {
          youtube: 0,
          loom: 0,
          mux: 0,
          whisper: 0,
        },
      });
    }

    const summary = dailyMap.get(date)!;
    const method = metadata.transcript_method || 'unknown';
    const cost = metadata.cost_usd || 0;
    const duration = metadata.duration_seconds || 0;

    summary.total_transcriptions++;
    summary.total_cost += cost;
    summary.total_minutes += duration / 60;

    if (cost === 0) {
      summary.free_transcriptions++;
    } else {
      summary.paid_transcriptions++;
    }

    // Update source breakdown
    if (method.includes('youtube')) {
      summary.breakdown_by_source.youtube++;
    } else if (method.includes('loom')) {
      summary.breakdown_by_source.loom++;
    } else if (method.includes('mux')) {
      summary.breakdown_by_source.mux++;
    } else if (method.includes('whisper')) {
      summary.breakdown_by_source.whisper++;
    }
  }

  return Array.from(dailyMap.values());
}

/**
 * Get transcript cost efficiency metrics
 *
 * Returns metrics about how efficiently a creator is using free vs. paid sources.
 *
 * @param creatorId - Creator ID
 * @param dateRange - Optional date range
 * @returns Efficiency metrics
 *
 * @example
 * ```typescript
 * const metrics = await getTranscriptCostEfficiency('creator_123');
 * console.log(`Free usage: ${metrics.free_percentage}%`);
 * console.log(`Monthly savings: $${metrics.monthly_savings.toFixed(2)}`);
 * ```
 */
export async function getTranscriptCostEfficiency(
  creatorId: string,
  dateRange?: { start: Date; end: Date }
): Promise<{
  total_videos: number;
  free_videos: number;
  paid_videos: number;
  free_percentage: number;
  paid_percentage: number;
  total_cost: number;
  cost_savings: number;
  monthly_savings: number; // Projected monthly savings
  avg_cost_per_video: number;
}> {
  const breakdown = await getTranscriptCostsBySource(creatorId, dateRange);

  const totalVideos = breakdown.totals.count;
  const freeVideos = breakdown.totals.free_count;
  const paidVideos = breakdown.totals.paid_count;

  const freePercentage = totalVideos > 0 ? (freeVideos / totalVideos) * 100 : 0;
  const paidPercentage = totalVideos > 0 ? (paidVideos / totalVideos) * 100 : 0;

  const avgCostPerVideo = totalVideos > 0 ? breakdown.totals.total_cost / totalVideos : 0;

  // Project monthly savings based on current usage
  const daysInPeriod = dateRange
    ? (dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)
    : 30; // Default to 30 days

  const monthlySavings = (breakdown.totals.cost_savings / daysInPeriod) * 30;

  return {
    total_videos: totalVideos,
    free_videos: freeVideos,
    paid_videos: paidVideos,
    free_percentage: Number(freePercentage.toFixed(2)),
    paid_percentage: Number(paidPercentage.toFixed(2)),
    total_cost: breakdown.totals.total_cost,
    cost_savings: breakdown.totals.cost_savings,
    monthly_savings: monthlySavings,
    avg_cost_per_video: avgCostPerVideo,
  };
}

/**
 * Get top expensive videos (highest transcript costs)
 *
 * @param creatorId - Creator ID
 * @param limit - Number of videos to return
 * @returns Top expensive videos
 *
 * @example
 * ```typescript
 * const expensive = await getTopExpensiveVideos('creator_123', 10);
 * expensive.forEach(video => {
 *   console.log(`${video.video_id}: $${video.cost} (${video.method})`);
 * });
 * ```
 */
export async function getTopExpensiveVideos(
  creatorId: string,
  limit: number = 10
): Promise<Array<{
  video_id: string;
  title?: string;
  method: string;
  cost: number;
  duration_minutes: number;
  timestamp: string;
}>> {
  const supabase = getServiceSupabase();

  const { data: events, error } = await supabase
    .from('video_analytics_events')
    .select('video_id, metadata, timestamp')
    .eq('creator_id', creatorId)
    .eq('event_type', 'video_transcribed')
    .order('timestamp', { ascending: false });

  if (error) {
    throw new Error('Failed to fetch expensive videos');
  }

  // Filter and sort by cost
  const videos = (events || [])
    .filter((e: any) => !e.metadata.failed)
    .map((e: any) => ({
      video_id: e.video_id,
      method: e.metadata.transcript_method || 'unknown',
      cost: e.metadata.cost_usd || 0,
      duration_minutes: (e.metadata.duration_seconds || 0) / 60,
      timestamp: e.timestamp,
    }))
    .sort((a, b) => b.cost - a.cost)
    .slice(0, limit);

  // Fetch video titles
  const videoIds = videos.map(v => v.video_id);
  const { data: videoData } = await supabase
    .from('videos')
    .select('id, title')
    .in('id', videoIds);

  const titleMap = new Map(videoData?.map(v => [v.id, v.title]) || []);

  return videos.map(v => ({
    ...v,
    title: titleMap.get(v.video_id),
  }));
}

/**
 * Format cost for display
 *
 * @param cost - Cost in USD
 * @returns Formatted cost string
 *
 * @example
 * ```typescript
 * console.log(formatCost(0)); // "FREE"
 * console.log(formatCost(0.0614)); // "$0.06"
 * console.log(formatCost(1.50)); // "$1.50"
 * ```
 */
export function formatCost(cost: number): string {
  if (cost === 0) {
    return 'FREE';
  }

  if (cost < 0.01) {
    return `$${cost.toFixed(4)}`;
  }

  return `$${cost.toFixed(2)}`;
}
