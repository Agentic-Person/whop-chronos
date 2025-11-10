/**
 * Video Processing Analytics Logger
 *
 * Tracks processing times, identifies bottlenecks, and stores analytics
 */

import { getServiceSupabase } from '@/lib/db/client';
import type { Database } from '@/lib/db/types';

type VideoRow = Database['public']['Tables']['videos']['Row'];
type VideoStatus = VideoRow['status'];
type VideoAnalyticsRow = Database['public']['Tables']['video_analytics']['Row'];

// =====================================================
// TYPES
// =====================================================

export interface StageTimings {
  upload_duration_ms: number | null;
  transcription_duration_ms: number | null;
  chunking_duration_ms: number | null;
  embedding_duration_ms: number | null;
}

export interface ProcessingMetrics {
  videoId: string;
  totalDurationMs: number;
  stageTimings: StageTimings;
  bottleneck: string;
  averageSpeed: number | null;
  retryCount: number;
  errorRate: number;
  timestamp: string;
}

export interface PerformanceAlert {
  type: 'slow_processing' | 'bottleneck' | 'high_error_rate';
  severity: 'warning' | 'critical';
  message: string;
  videoId: string;
  stage?: string;
  metrics: Record<string, number>;
}

// =====================================================
// STAGE TIMING TRACKER
// =====================================================

export class ProcessingTimer {
  private startTimes: Map<string, number> = new Map();
  private durations: Map<string, number> = new Map();
  private videoId: string;

  constructor(videoId: string) {
    this.videoId = videoId;
  }

  /**
   * Start timing a processing stage
   */
  startStage(stage: VideoStatus): void {
    this.startTimes.set(stage, Date.now());
  }

  /**
   * End timing a processing stage
   */
  endStage(stage: VideoStatus): number {
    const startTime = this.startTimes.get(stage);
    if (!startTime) {
      console.warn(`[Analytics] No start time found for stage: ${stage}`);
      return 0;
    }

    const duration = Date.now() - startTime;
    this.durations.set(stage, duration);
    this.startTimes.delete(stage);

    return duration;
  }

  /**
   * Get duration for a specific stage
   */
  getDuration(stage: VideoStatus): number | null {
    return this.durations.get(stage) || null;
  }

  /**
   * Get all stage timings
   */
  getAllTimings(): StageTimings {
    return {
      upload_duration_ms: this.getDuration('uploading'),
      transcription_duration_ms: this.getDuration('transcribing'),
      chunking_duration_ms: this.getDuration('processing'),
      embedding_duration_ms: this.getDuration('embedding'),
    };
  }

  /**
   * Get total processing time
   */
  getTotalDuration(): number {
    let total = 0;
    for (const duration of this.durations.values()) {
      total += duration;
    }
    return total;
  }

  /**
   * Save timings to video metadata
   */
  async saveToDatabase(): Promise<void> {
    const supabase = getServiceSupabase();

    // Get current metadata
    const { data: video } = await supabase
      .from('videos')
      .select('metadata')
      .eq('id', this.videoId)
      .single();

    const timings = this.getAllTimings();
    const totalDuration = this.getTotalDuration();

    // Update metadata with timings
    await supabase
      .from('videos')
      .update({
        metadata: {
          ...(video?.metadata as object || {}),
          ...timings,
          total_processing_duration_ms: totalDuration,
          timings_recorded_at: new Date().toISOString(),
        },
      })
      .eq('id', this.videoId);
  }
}

// =====================================================
// ANALYTICS LOGGER
// =====================================================

/**
 * Log processing completion to video_analytics table
 */
export async function logProcessingCompletion(
  videoId: string,
  metrics: Partial<ProcessingMetrics>
): Promise<void> {
  const supabase = getServiceSupabase();

  try {
    // Get video details
    const { data: video } = await supabase
      .from('videos')
      .select('*')
      .eq('id', videoId)
      .single();

    if (!video) {
      throw new Error(`Video not found: ${videoId}`);
    }

    // Calculate processing duration
    const processingDuration = video.processing_completed_at && video.processing_started_at
      ? new Date(video.processing_completed_at).getTime() - new Date(video.processing_started_at).getTime()
      : null;

    // Get today's date for analytics
    const today = new Date().toISOString().split('T')[0];

    // Check if analytics record exists for today
    const { data: existingAnalytics } = await supabase
      .from('video_analytics')
      .select('*')
      .eq('video_id', videoId)
      .eq('date', today)
      .single();

    if (existingAnalytics) {
      // Update existing record
      await supabase
        .from('video_analytics')
        .update({
          processing_duration_ms: processingDuration,
          metadata: {
            ...(existingAnalytics.metadata as object || {}),
            ...metrics,
            last_updated: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingAnalytics.id);
    } else {
      // Create new analytics record
      await supabase
        .from('video_analytics')
        .insert({
          video_id: videoId,
          date: today,
          views: 0,
          unique_viewers: 0,
          total_watch_time_seconds: 0,
          avg_watch_time_seconds: 0,
          completion_rate: 0,
          processing_duration_ms: processingDuration,
          metadata: {
            ...metrics,
            created_at: new Date().toISOString(),
          },
        });
    }
  } catch (error) {
    console.error('[Analytics] Failed to log processing completion:', error);
    throw error;
  }
}

/**
 * Log processing failure
 */
export async function logProcessingFailure(
  videoId: string,
  stage: VideoStatus,
  errorMessage: string,
  errorDetails?: Record<string, any>
): Promise<void> {
  const supabase = getServiceSupabase();

  try {
    // Get video metadata
    const { data: video } = await supabase
      .from('videos')
      .select('metadata')
      .eq('id', videoId)
      .single();

    const metadata = video?.metadata as any || {};

    // Increment error count for this stage
    const errorKey = `${stage}_errors`;
    const errorCount = (metadata[errorKey] || 0) + 1;

    // Update metadata with failure information
    await supabase
      .from('videos')
      .update({
        metadata: {
          ...metadata,
          [errorKey]: errorCount,
          last_error: {
            stage,
            message: errorMessage,
            timestamp: new Date().toISOString(),
            details: errorDetails || {},
          },
        },
      })
      .eq('id', videoId);
  } catch (error) {
    console.error('[Analytics] Failed to log processing failure:', error);
  }
}

// =====================================================
// BOTTLENECK DETECTION
// =====================================================

/**
 * Identify processing bottleneck
 */
export function identifyBottleneck(timings: StageTimings): string {
  const stages = [
    { name: 'upload', duration: timings.upload_duration_ms },
    { name: 'transcription', duration: timings.transcription_duration_ms },
    { name: 'chunking', duration: timings.chunking_duration_ms },
    { name: 'embedding', duration: timings.embedding_duration_ms },
  ];

  let bottleneck = 'unknown';
  let maxDuration = 0;

  for (const stage of stages) {
    if (stage.duration && stage.duration > maxDuration) {
      maxDuration = stage.duration;
      bottleneck = stage.name;
    }
  }

  return bottleneck;
}

/**
 * Calculate average processing times across all videos
 */
export async function calculateAverageProcessingTimes(
  creatorId?: string
): Promise<StageTimings> {
  const supabase = getServiceSupabase();

  // Get all completed videos
  let query = supabase
    .from('videos')
    .select('metadata')
    .eq('status', 'completed')
    .eq('is_deleted', false);

  if (creatorId) {
    query = query.eq('creator_id', creatorId);
  }

  const { data: videos, error } = await query;

  if (error || !videos || videos.length === 0) {
    return {
      upload_duration_ms: null,
      transcription_duration_ms: null,
      chunking_duration_ms: null,
      embedding_duration_ms: null,
    };
  }

  // Calculate averages
  const totals = {
    upload: 0,
    transcription: 0,
    chunking: 0,
    embedding: 0,
    count: 0,
  };

  for (const video of videos) {
    const metadata = video.metadata as any || {};
    if (metadata.upload_duration_ms) totals.upload += metadata.upload_duration_ms;
    if (metadata.transcription_duration_ms) totals.transcription += metadata.transcription_duration_ms;
    if (metadata.chunking_duration_ms) totals.chunking += metadata.chunking_duration_ms;
    if (metadata.embedding_duration_ms) totals.embedding += metadata.embedding_duration_ms;
    totals.count++;
  }

  return {
    upload_duration_ms: totals.count > 0 ? Math.round(totals.upload / totals.count) : null,
    transcription_duration_ms: totals.count > 0 ? Math.round(totals.transcription / totals.count) : null,
    chunking_duration_ms: totals.count > 0 ? Math.round(totals.chunking / totals.count) : null,
    embedding_duration_ms: totals.count > 0 ? Math.round(totals.embedding / totals.count) : null,
  };
}

// =====================================================
// PERFORMANCE ALERTS
// =====================================================

/**
 * Check for performance issues and generate alerts
 */
export async function checkForPerformanceAlerts(
  videoId: string,
  timings: StageTimings
): Promise<PerformanceAlert[]> {
  const alerts: PerformanceAlert[] = [];

  // Get average timings for comparison
  const avgTimings = await calculateAverageProcessingTimes();

  // Check each stage against average
  const stages: Array<{ name: keyof StageTimings; threshold: number }> = [
    { name: 'upload_duration_ms', threshold: 1.5 },
    { name: 'transcription_duration_ms', threshold: 2.0 },
    { name: 'chunking_duration_ms', threshold: 1.5 },
    { name: 'embedding_duration_ms', threshold: 2.0 },
  ];

  for (const stage of stages) {
    const currentDuration = timings[stage.name];
    const avgDuration = avgTimings[stage.name];

    if (currentDuration && avgDuration && currentDuration > avgDuration * stage.threshold) {
      alerts.push({
        type: 'slow_processing',
        severity: currentDuration > avgDuration * (stage.threshold * 2) ? 'critical' : 'warning',
        message: `${stage.name.replace('_duration_ms', '')} is ${Math.round(currentDuration / avgDuration)}x slower than average`,
        videoId,
        stage: stage.name,
        metrics: {
          current: currentDuration,
          average: avgDuration,
          threshold: avgDuration * stage.threshold,
        },
      });
    }
  }

  // Check for bottleneck
  const bottleneck = identifyBottleneck(timings);
  const bottleneckDuration = timings[`${bottleneck}_duration_ms` as keyof StageTimings];
  const totalDuration = Object.values(timings).reduce((sum, val) => sum + (val || 0), 0);

  if (bottleneckDuration && bottleneckDuration > totalDuration * 0.5) {
    alerts.push({
      type: 'bottleneck',
      severity: 'warning',
      message: `${bottleneck} is consuming ${Math.round((bottleneckDuration / totalDuration) * 100)}% of processing time`,
      videoId,
      stage: bottleneck,
      metrics: {
        stageDuration: bottleneckDuration,
        totalDuration,
        percentage: (bottleneckDuration / totalDuration) * 100,
      },
    });
  }

  return alerts;
}

/**
 * Send alert notifications (admin alerts for critical issues)
 */
export async function sendPerformanceAlert(alert: PerformanceAlert): Promise<void> {
  // Log to console for now
  console.warn('[Analytics] Performance Alert:', {
    type: alert.type,
    severity: alert.severity,
    message: alert.message,
    videoId: alert.videoId,
    stage: alert.stage,
    metrics: alert.metrics,
  });

  // TODO: Integrate with notification system (email, Slack, etc.)
  // For production, this could send alerts to:
  // - Admin dashboard
  // - Email notifications
  // - Slack webhooks
  // - Sentry events
}

// =====================================================
// STATISTICS & REPORTING
// =====================================================

/**
 * Get processing statistics for dashboard
 */
export async function getProcessingStatistics(creatorId?: string) {
  const supabase = getServiceSupabase();

  // Get all videos
  let query = supabase
    .from('videos')
    .select('status, processing_started_at, processing_completed_at, metadata, created_at')
    .eq('is_deleted', false);

  if (creatorId) {
    query = query.eq('creator_id', creatorId);
  }

  const { data: videos, error } = await query;

  if (error || !videos) {
    return null;
  }

  // Calculate statistics
  const stats = {
    total: videos.length,
    byStatus: {
      pending: 0,
      uploading: 0,
      transcribing: 0,
      processing: 0,
      embedding: 0,
      completed: 0,
      failed: 0,
    },
    avgProcessingTime: 0,
    successRate: 0,
    fastestProcessing: Infinity,
    slowestProcessing: 0,
  };

  let totalProcessingTime = 0;
  let completedCount = 0;

  for (const video of videos) {
    stats.byStatus[video.status]++;

    if (video.status === 'completed' && video.processing_started_at && video.processing_completed_at) {
      const duration =
        new Date(video.processing_completed_at).getTime() -
        new Date(video.processing_started_at).getTime();

      totalProcessingTime += duration;
      completedCount++;

      if (duration < stats.fastestProcessing) stats.fastestProcessing = duration;
      if (duration > stats.slowestProcessing) stats.slowestProcessing = duration;
    }
  }

  stats.avgProcessingTime = completedCount > 0 ? totalProcessingTime / completedCount : 0;
  stats.successRate = videos.length > 0 ? (stats.byStatus.completed / videos.length) * 100 : 0;

  if (stats.fastestProcessing === Infinity) stats.fastestProcessing = 0;

  return stats;
}

/**
 * Export processing analytics to CSV
 */
export async function exportProcessingAnalytics(creatorId?: string): Promise<string> {
  const supabase = getServiceSupabase();

  let query = supabase
    .from('videos')
    .select('id, title, status, created_at, processing_started_at, processing_completed_at, metadata')
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  if (creatorId) {
    query = query.eq('creator_id', creatorId);
  }

  const { data: videos } = await query;

  if (!videos || videos.length === 0) {
    return 'No data available';
  }

  // Build CSV
  const headers = [
    'Video ID',
    'Title',
    'Status',
    'Created At',
    'Processing Started',
    'Processing Completed',
    'Upload Duration (ms)',
    'Transcription Duration (ms)',
    'Chunking Duration (ms)',
    'Embedding Duration (ms)',
    'Total Duration (ms)',
  ];

  const rows = videos.map((video) => {
    const metadata = video.metadata as any || {};
    const totalDuration = video.processing_started_at && video.processing_completed_at
      ? new Date(video.processing_completed_at).getTime() - new Date(video.processing_started_at).getTime()
      : null;

    return [
      video.id,
      video.title,
      video.status,
      video.created_at,
      video.processing_started_at || 'N/A',
      video.processing_completed_at || 'N/A',
      metadata.upload_duration_ms || 'N/A',
      metadata.transcription_duration_ms || 'N/A',
      metadata.chunking_duration_ms || 'N/A',
      metadata.embedding_duration_ms || 'N/A',
      totalDuration || 'N/A',
    ];
  });

  const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');

  return csv;
}
