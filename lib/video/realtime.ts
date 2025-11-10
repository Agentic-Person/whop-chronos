/**
 * Real-time Video Processing Updates
 *
 * Manages Supabase real-time subscriptions for live video processing status updates
 */

'use client';

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/db/types';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type VideoRow = Database['public']['Tables']['videos']['Row'];
type VideoStatus = VideoRow['status'];

// =====================================================
// TYPES
// =====================================================

export interface VideoUpdateEvent {
  videoId: string;
  status: VideoStatus;
  errorMessage: string | null;
  progress: number;
  metadata: Record<string, any>;
  timestamp: string;
}

export interface ProcessingStatsEvent {
  pending: number;
  uploading: number;
  transcribing: number;
  processing: number;
  embedding: number;
  completed: number;
  failed: number;
  total: number;
}

export type VideoUpdateCallback = (event: VideoUpdateEvent) => void;
export type StatsUpdateCallback = (stats: ProcessingStatsEvent) => void;
export type ErrorCallback = (error: Error) => void;

// =====================================================
// SUBSCRIPTION MANAGER
// =====================================================

export class VideoProcessingSubscription {
  private channel: RealtimeChannel | null = null;
  private supabase: ReturnType<typeof createClient<Database>> | null = null;
  private callbacks: Map<string, VideoUpdateCallback> = new Map();
  private statsCallback: StatsUpdateCallback | null = null;
  private errorCallback: ErrorCallback | null = null;

  constructor(
    supabaseUrl: string,
    supabaseAnonKey: string,
    private creatorId?: string
  ) {
    this.supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
  }

  /**
   * Subscribe to video processing updates
   */
  subscribe(): this {
    if (!this.supabase) {
      throw new Error('Supabase client not initialized');
    }

    // Create channel for video updates
    const channelName = this.creatorId
      ? `video-processing-${this.creatorId}`
      : 'video-processing-all';

    this.channel = this.supabase.channel(channelName);

    // Subscribe to video updates
    this.channel
      .on<VideoRow>(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'videos',
          ...(this.creatorId && { filter: `creator_id=eq.${this.creatorId}` }),
        },
        (payload) => this.handleVideoUpdate(payload)
      )
      .on<VideoRow>(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'videos',
          ...(this.creatorId && { filter: `creator_id=eq.${this.creatorId}` }),
        },
        (payload) => this.handleVideoInsert(payload)
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[VideoProcessing] Real-time subscription active');
        } else if (status === 'CHANNEL_ERROR') {
          this.handleError(new Error('Channel subscription error'));
        } else if (status === 'TIMED_OUT') {
          this.handleError(new Error('Subscription timeout'));
        }
      });

    return this;
  }

  /**
   * Unsubscribe from all updates
   */
  async unsubscribe(): Promise<void> {
    if (this.channel) {
      await this.supabase?.removeChannel(this.channel);
      this.channel = null;
    }

    this.callbacks.clear();
    this.statsCallback = null;
    this.errorCallback = null;
  }

  /**
   * Register callback for specific video updates
   */
  onVideoUpdate(videoId: string, callback: VideoUpdateCallback): this {
    this.callbacks.set(videoId, callback);
    return this;
  }

  /**
   * Register callback for processing statistics
   */
  onStatsUpdate(callback: StatsUpdateCallback): this {
    this.statsCallback = callback;
    return this;
  }

  /**
   * Register error callback
   */
  onError(callback: ErrorCallback): this {
    this.errorCallback = callback;
    return this;
  }

  /**
   * Remove callback for specific video
   */
  removeVideoCallback(videoId: string): void {
    this.callbacks.delete(videoId);
  }

  /**
   * Handle video UPDATE event
   */
  private handleVideoUpdate(
    payload: RealtimePostgresChangesPayload<VideoRow>
  ): void {
    if (payload.new) {
      const video = payload.new as VideoRow;
      this.emitVideoUpdate(video);
    }
  }

  /**
   * Handle video INSERT event
   */
  private handleVideoInsert(
    payload: RealtimePostgresChangesPayload<VideoRow>
  ): void {
    if (payload.new) {
      const video = payload.new as VideoRow;
      this.emitVideoUpdate(video);
    }
  }

  /**
   * Emit video update event
   */
  private emitVideoUpdate(video: VideoRow): void {
    const event: VideoUpdateEvent = {
      videoId: video.id,
      status: video.status,
      errorMessage: video.error_message,
      progress: this.calculateProgress(video.status),
      metadata: (video.metadata as Record<string, any>) || {},
      timestamp: video.updated_at,
    };

    // Notify specific video callback
    const callback = this.callbacks.get(video.id);
    if (callback) {
      try {
        callback(event);
      } catch (error) {
        this.handleError(error as Error);
      }
    }

    // Update stats if callback registered
    if (this.statsCallback) {
      this.fetchAndEmitStats();
    }
  }

  /**
   * Fetch and emit processing statistics
   */
  private async fetchAndEmitStats(): Promise<void> {
    if (!this.supabase || !this.statsCallback) return;

    try {
      let query = this.supabase
        .from('videos')
        .select('status')
        .eq('is_deleted', false);

      if (this.creatorId) {
        query = query.eq('creator_id', this.creatorId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const stats: ProcessingStatsEvent = {
        pending: 0,
        uploading: 0,
        transcribing: 0,
        processing: 0,
        embedding: 0,
        completed: 0,
        failed: 0,
        total: 0,
      };

      for (const video of data || []) {
        stats[video.status]++;
        stats.total++;
      }

      this.statsCallback(stats);
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  /**
   * Calculate progress percentage
   */
  private calculateProgress(status: VideoStatus): number {
    const progressMap: Record<VideoStatus, number> = {
      pending: 0,
      uploading: 20,
      transcribing: 40,
      processing: 60,
      embedding: 80,
      completed: 100,
      failed: 0,
    };

    return progressMap[status];
  }

  /**
   * Handle errors
   */
  private handleError(error: Error): void {
    console.error('[VideoProcessing] Error:', error);
    if (this.errorCallback) {
      this.errorCallback(error);
    }
  }
}

// =====================================================
// REACT HOOKS
// =====================================================

/**
 * Hook for subscribing to video processing updates
 */
export function useVideoProcessingSubscription(
  supabaseUrl: string,
  supabaseAnonKey: string,
  creatorId?: string
) {
  const subscription = new VideoProcessingSubscription(
    supabaseUrl,
    supabaseAnonKey,
    creatorId
  );

  return {
    subscribe: () => subscription.subscribe(),
    unsubscribe: () => subscription.unsubscribe(),
    onVideoUpdate: (videoId: string, callback: VideoUpdateCallback) =>
      subscription.onVideoUpdate(videoId, callback),
    onStatsUpdate: (callback: StatsUpdateCallback) =>
      subscription.onStatsUpdate(callback),
    onError: (callback: ErrorCallback) => subscription.onError(callback),
    removeVideoCallback: (videoId: string) =>
      subscription.removeVideoCallback(videoId),
  };
}

// =====================================================
// BROADCAST UTILITIES
// =====================================================

/**
 * Broadcast processing update to all connected clients
 */
export async function broadcastProcessingUpdate(
  supabase: ReturnType<typeof createClient<Database>>,
  channelName: string,
  event: VideoUpdateEvent
): Promise<void> {
  const channel = supabase.channel(channelName);

  try {
    await channel.send({
      type: 'broadcast',
      event: 'video_update',
      payload: event,
    });
  } catch (error) {
    console.error('[VideoProcessing] Broadcast failed:', error);
    throw error;
  }
}

/**
 * Broadcast statistics update to all connected clients
 */
export async function broadcastStatsUpdate(
  supabase: ReturnType<typeof createClient<Database>>,
  channelName: string,
  stats: ProcessingStatsEvent
): Promise<void> {
  const channel = supabase.channel(channelName);

  try {
    await channel.send({
      type: 'broadcast',
      event: 'stats_update',
      payload: stats,
    });
  } catch (error) {
    console.error('[VideoProcessing] Stats broadcast failed:', error);
    throw error;
  }
}

// =====================================================
// CONNECTION MANAGEMENT
// =====================================================

/**
 * Handle connection errors gracefully
 */
export function createResilientSubscription(
  supabaseUrl: string,
  supabaseAnonKey: string,
  creatorId?: string,
  options: {
    maxRetries?: number;
    retryDelay?: number;
    onReconnect?: () => void;
  } = {}
): VideoProcessingSubscription {
  const { maxRetries = 5, retryDelay = 3000, onReconnect } = options;
  let retryCount = 0;
  let reconnectTimer: NodeJS.Timeout | null = null;

  const subscription = new VideoProcessingSubscription(
    supabaseUrl,
    supabaseAnonKey,
    creatorId
  );

  // Handle errors with retry logic
  subscription.onError((error) => {
    console.error(`[VideoProcessing] Connection error (attempt ${retryCount + 1}/${maxRetries}):`, error);

    if (retryCount < maxRetries) {
      if (reconnectTimer) clearTimeout(reconnectTimer);

      reconnectTimer = setTimeout(() => {
        retryCount++;
        console.log(`[VideoProcessing] Reconnecting... (attempt ${retryCount})`);

        subscription.unsubscribe().then(() => {
          subscription.subscribe();
          if (onReconnect) onReconnect();
        });
      }, retryDelay * retryCount); // Exponential backoff
    } else {
      console.error('[VideoProcessing] Max reconnection attempts reached');
    }
  });

  return subscription;
}
