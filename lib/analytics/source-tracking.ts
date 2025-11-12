/**
 * Video Source Analytics Tracking
 *
 * Tracks which import sources creators use most frequently
 */

import { getServiceSupabase } from '@/lib/db/client';

export type VideoSource = 'youtube' | 'loom' | 'whop' | 'upload';
export type ImportMethod = 'url' | 'browse';

interface AnalyticsEvent {
  event_type: 'source_tab_selected' | 'video_imported';
  creator_id: string;
  video_id?: string;
  metadata: {
    source_type: VideoSource;
    import_method?: ImportMethod;
    [key: string]: any;
  };
}

/**
 * Track analytics event for video import
 */
export async function trackAnalyticsEvent(event: AnalyticsEvent): Promise<void> {
  try {
    const supabase = getServiceSupabase();

    await supabase
      .from('video_analytics_events')
      .insert({
        event_type: event.event_type,
        creator_id: event.creator_id,
        video_id: event.video_id || null,
        metadata: event.metadata,
        created_at: new Date().toISOString(),
      });

    console.log('[Analytics] Tracked event:', event.event_type, event.metadata);
  } catch (error) {
    // Don't throw - analytics failures should not break the app
    console.error('[Analytics] Failed to track event:', error);
  }
}

/**
 * Track when a source tab is selected
 */
export async function trackSourceTabSelected(
  creatorId: string,
  sourceType: VideoSource
): Promise<void> {
  await trackAnalyticsEvent({
    event_type: 'source_tab_selected',
    creator_id: creatorId,
    metadata: {
      source_type: sourceType,
    },
  });
}

/**
 * Track when a video is imported
 */
export async function trackVideoImported(
  videoId: string,
  creatorId: string,
  sourceType: VideoSource,
  importMethod?: ImportMethod
): Promise<void> {
  await trackAnalyticsEvent({
    event_type: 'video_imported',
    creator_id: creatorId,
    video_id: videoId,
    metadata: {
      source_type: sourceType,
      import_method: importMethod,
    },
  });
}

/**
 * Get source usage statistics for a creator
 */
export async function getSourceUsageStats(creatorId: string) {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from('video_analytics_events')
    .select('metadata')
    .eq('creator_id', creatorId)
    .eq('event_type', 'video_imported');

  if (error) {
    console.error('[Analytics] Failed to fetch stats:', error);
    return null;
  }

  // Count by source type
  const stats = data.reduce((acc, event) => {
    const sourceType = event.metadata?.source_type || 'unknown';
    acc[sourceType] = (acc[sourceType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const total = Object.values(stats).reduce((sum, count) => sum + count, 0);

  return Object.entries(stats).map(([source_type, count]) => ({
    source_type,
    import_count: count,
    percentage: total > 0 ? Math.round((count / total) * 100) : 0,
  }));
}

/**
 * Get most popular import source across all creators
 */
export async function getGlobalSourceStats() {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from('video_analytics_events')
    .select('metadata')
    .eq('event_type', 'video_imported');

  if (error) {
    console.error('[Analytics] Failed to fetch global stats:', error);
    return null;
  }

  // Count by source type
  const stats = data.reduce((acc, event) => {
    const sourceType = event.metadata?.source_type || 'unknown';
    acc[sourceType] = (acc[sourceType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(stats)
    .map(([source_type, import_count]) => ({
      source_type,
      import_count,
    }))
    .sort((a, b) => b.import_count - a.import_count);
}
