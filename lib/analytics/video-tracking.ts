/**
 * Video Analytics Tracking Library
 *
 * Centralized functions for tracking video analytics events
 * All functions call the /api/analytics/video-event endpoint
 *
 * Features:
 * - Track video start, progress, completion
 * - Update watch time
 * - Handle network errors gracefully with retry logic
 * - Batch progress updates to reduce API calls
 */

interface TrackingOptions {
  retries?: number;
  retryDelay?: number;
}

const DEFAULT_OPTIONS: TrackingOptions = {
  retries: 3,
  retryDelay: 1000, // 1 second
};

/**
 * Base function to track any video event
 */
async function trackVideoEvent(
  eventType: string,
  videoId: string,
  creatorId: string,
  studentId: string | null,
  metadata: Record<string, unknown> = {},
  options: TrackingOptions = DEFAULT_OPTIONS,
): Promise<{ success: boolean; eventId?: string; error?: string }> {
  const { retries = 3, retryDelay = 1000 } = options;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch('/api/analytics/video-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_type: eventType,
          video_id: videoId,
          creator_id: creatorId,
          student_id: studentId,
          metadata,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        eventId: data.event_id,
      };
    } catch (error) {
      console.error(`[VideoTracking] Attempt ${attempt + 1}/${retries + 1} failed:`, error);

      // If this was the last attempt, return error
      if (attempt === retries) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, retryDelay * (attempt + 1)));
    }
  }

  return {
    success: false,
    error: 'Max retries exceeded',
  };
}

/**
 * Track when video starts playing
 *
 * @param videoId - Video ID from database
 * @param creatorId - Creator who owns the video
 * @param studentId - Student watching the video
 * @param sessionId - Watch session ID
 * @param sourceType - Video source (youtube, mux, loom, upload)
 */
export async function trackVideoStart(
  videoId: string,
  creatorId: string,
  studentId: string,
  sessionId: string,
  sourceType?: 'youtube' | 'mux' | 'loom' | 'upload',
): Promise<void> {
  const result = await trackVideoEvent('video_started', videoId, creatorId, studentId, {
    session_id: sessionId,
    source_type: sourceType,
    timestamp: new Date().toISOString(),
  });

  if (!result.success) {
    console.error('[VideoTracking] Failed to track video start:', result.error);
  }
}

/**
 * Track progress milestone
 *
 * @param videoId - Video ID from database
 * @param creatorId - Creator who owns the video
 * @param studentId - Student watching the video
 * @param sessionId - Watch session ID
 * @param percentComplete - Percentage of video watched (10, 25, 50, 75, 90)
 * @param currentTime - Current playback time in seconds
 */
export async function trackVideoProgress(
  videoId: string,
  creatorId: string,
  studentId: string,
  sessionId: string,
  percentComplete: number,
  currentTime?: number,
): Promise<void> {
  const result = await trackVideoEvent('video_progress', videoId, creatorId, studentId, {
    session_id: sessionId,
    percent_complete: percentComplete,
    current_time_seconds: currentTime,
    timestamp: new Date().toISOString(),
  });

  if (!result.success) {
    console.error('[VideoTracking] Failed to track video progress:', result.error);
  }
}

/**
 * Track video completion (90%+ watched)
 *
 * @param videoId - Video ID from database
 * @param creatorId - Creator who owns the video
 * @param studentId - Student watching the video
 * @param sessionId - Watch session ID
 * @param watchTimeSeconds - Total watch time in seconds
 */
export async function trackVideoComplete(
  videoId: string,
  creatorId: string,
  studentId: string,
  sessionId: string,
  watchTimeSeconds: number,
): Promise<void> {
  const result = await trackVideoEvent('video_completed', videoId, creatorId, studentId, {
    session_id: sessionId,
    watch_time_seconds: watchTimeSeconds,
    timestamp: new Date().toISOString(),
  });

  if (!result.success) {
    console.error('[VideoTracking] Failed to track video completion:', result.error);
  }
}

/**
 * Track watch time update
 * Should be called periodically (every 5-10 seconds) during playback
 *
 * @param sessionId - Watch session ID
 * @param currentTimeSeconds - Current playback time in seconds
 */
export async function trackWatchTime(sessionId: string, currentTimeSeconds: number): Promise<void> {
  try {
    const response = await fetch(`/api/analytics/watch-sessions/${sessionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        current_time_seconds: currentTimeSeconds,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update watch time: ${response.statusText}`);
    }
  } catch (error) {
    console.error('[VideoTracking] Failed to track watch time:', error);
    // Don't retry watch time updates - they happen frequently
  }
}

/**
 * Batched progress tracker
 * Accumulates progress updates and sends them in batches to reduce API calls
 */
export class BatchedProgressTracker {
  private queue: Array<{
    videoId: string;
    creatorId: string;
    studentId: string;
    sessionId: string;
    percentComplete: number;
    currentTime?: number;
  }> = [];

  private flushInterval: NodeJS.Timeout | null = null;
  private readonly batchSize: number;
  private readonly flushIntervalMs: number;

  constructor(batchSize: number = 5, flushIntervalMs: number = 10000) {
    this.batchSize = batchSize;
    this.flushIntervalMs = flushIntervalMs;
  }

  /**
   * Add a progress event to the queue
   */
  track(
    videoId: string,
    creatorId: string,
    studentId: string,
    sessionId: string,
    percentComplete: number,
    currentTime?: number,
  ): void {
    this.queue.push({
      videoId,
      creatorId,
      studentId,
      sessionId,
      percentComplete,
      currentTime,
    });

    // Flush if batch size reached
    if (this.queue.length >= this.batchSize) {
      this.flush();
    }

    // Set up auto-flush if not already set
    if (!this.flushInterval) {
      this.flushInterval = setInterval(() => {
        this.flush();
      }, this.flushIntervalMs);
    }
  }

  /**
   * Flush all queued events
   */
  async flush(): Promise<void> {
    if (this.queue.length === 0) return;

    const events = [...this.queue];
    this.queue = [];

    // Send all events
    await Promise.all(
      events.map((event) =>
        trackVideoProgress(
          event.videoId,
          event.creatorId,
          event.studentId,
          event.sessionId,
          event.percentComplete,
          event.currentTime,
        ),
      ),
    );
  }

  /**
   * Clear the flush interval
   */
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    this.flush(); // Final flush
  }
}
