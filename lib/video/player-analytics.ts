/**
 * Video Player Analytics Helper Library
 *
 * Centralized analytics tracking for all video player types
 * Handles event emission to /api/analytics/video-event endpoint
 *
 * Supports:
 * - YouTube Player
 * - Mux Player
 * - Loom Player
 * - HTML5 Upload Player
 *
 * Event Types:
 * - video_started: When video begins playing
 * - video_progress: At milestones (10%, 25%, 50%, 75%, 90%)
 * - video_completed: When 90%+ watched or video ends
 * - video_paused: When user pauses (optional)
 * - video_resumed: When user resumes (optional)
 * - video_seeked: When user jumps to different timestamp (optional)
 * - playback_speed_changed: When playback speed changes (optional)
 */

type VideoAnalyticsEventType =
  | 'video_started'
  | 'video_progress'
  | 'video_completed'
  | 'video_paused'
  | 'video_resumed'
  | 'video_seeked'
  | 'playback_speed_changed';

interface VideoAnalyticsEventData {
  event_type: VideoAnalyticsEventType;
  video_id: string;
  creator_id: string;
  student_id?: string;
  course_id?: string;
  module_id?: string;
  metadata: {
    source_type?: 'youtube' | 'mux' | 'loom' | 'upload';
    duration_seconds?: number;
    percent_complete?: number;
    watch_time_seconds?: number;
    current_time?: number;
    from_time?: number;
    to_time?: number;
    old_speed?: number;
    new_speed?: number;
    device?: string;
    user_agent?: string;
  };
}

/**
 * Track a video analytics event
 *
 * @param eventData - Event data to track
 * @returns Promise<boolean> - True if tracked successfully
 */
export async function trackVideoEvent(
  eventData: VideoAnalyticsEventData
): Promise<boolean> {
  try {
    const response = await fetch('/api/analytics/video-event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    });

    if (!response.ok) {
      console.error('[PlayerAnalytics] Failed to track event:', await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('[PlayerAnalytics] Error tracking event:', error);
    return false;
  }
}

/**
 * Video Player Analytics Tracker
 *
 * Manages analytics tracking for a single video playback session
 * Tracks milestones, watch time, and user interactions
 */
export class VideoAnalyticsTracker {
  private videoId: string;
  private creatorId: string;
  private studentId?: string;
  private courseId?: string;
  private moduleId?: string;
  private sourceType: 'youtube' | 'mux' | 'loom' | 'upload';

  private hasStarted: boolean = false;
  private milestonesReached: Set<number> = new Set();
  private startTime: number = 0;
  private totalWatchTime: number = 0;
  private lastTimeUpdate: number = 0;
  private isPlaying: boolean = false;

  constructor(config: {
    videoId: string;
    creatorId: string;
    studentId?: string;
    courseId?: string;
    moduleId?: string;
    sourceType: 'youtube' | 'mux' | 'loom' | 'upload';
  }) {
    this.videoId = config.videoId;
    this.creatorId = config.creatorId;
    this.studentId = config.studentId;
    this.courseId = config.courseId;
    this.moduleId = config.moduleId;
    this.sourceType = config.sourceType;
  }

  /**
   * Track video started event
   * Should be called when playback begins for the first time
   */
  async trackStart(): Promise<void> {
    if (this.hasStarted) return;

    this.hasStarted = true;
    this.isPlaying = true;
    this.startTime = Date.now();
    this.lastTimeUpdate = Date.now();

    await trackVideoEvent({
      event_type: 'video_started',
      video_id: this.videoId,
      creator_id: this.creatorId,
      student_id: this.studentId,
      course_id: this.courseId,
      module_id: this.moduleId,
      metadata: {
        source_type: this.sourceType,
        device: this.getDeviceType(),
        user_agent: navigator.userAgent,
      },
    });
  }

  /**
   * Track progress milestone
   * Should be called when video reaches 10%, 25%, 50%, 75%, 90%
   *
   * @param percentComplete - Percentage of video completed (0-100)
   * @param currentTime - Current playback position in seconds
   */
  async trackProgress(percentComplete: number, currentTime: number): Promise<void> {
    const milestones = [10, 25, 50, 75, 90];

    for (const milestone of milestones) {
      if (percentComplete >= milestone && !this.milestonesReached.has(milestone)) {
        this.milestonesReached.add(milestone);

        await trackVideoEvent({
          event_type: 'video_progress',
          video_id: this.videoId,
          creator_id: this.creatorId,
          student_id: this.studentId,
          course_id: this.courseId,
          module_id: this.moduleId,
          metadata: {
            source_type: this.sourceType,
            percent_complete: milestone,
            watch_time_seconds: this.totalWatchTime,
            current_time: currentTime,
          },
        });

        // If 90% milestone reached, also track completion
        if (milestone === 90) {
          await this.trackComplete(currentTime);
        }
      }
    }
  }

  /**
   * Track video completion
   * Should be called when video reaches 90% or playback ends
   *
   * @param currentTime - Final playback position in seconds
   */
  async trackComplete(currentTime?: number): Promise<void> {
    // Prevent duplicate completion events
    if (this.milestonesReached.has(100)) return;
    this.milestonesReached.add(100);

    await trackVideoEvent({
      event_type: 'video_completed',
      video_id: this.videoId,
      creator_id: this.creatorId,
      student_id: this.studentId,
      course_id: this.courseId,
      module_id: this.moduleId,
      metadata: {
        source_type: this.sourceType,
        watch_time_seconds: this.totalWatchTime,
        current_time: currentTime,
        percent_complete: 100,
      },
    });
  }

  /**
   * Track pause event
   * Optional - called when user pauses video
   *
   * @param currentTime - Current playback position in seconds
   */
  async trackPause(currentTime: number): Promise<void> {
    if (!this.isPlaying) return;

    this.isPlaying = false;
    this.updateWatchTime();

    await trackVideoEvent({
      event_type: 'video_paused',
      video_id: this.videoId,
      creator_id: this.creatorId,
      student_id: this.studentId,
      course_id: this.courseId,
      module_id: this.moduleId,
      metadata: {
        source_type: this.sourceType,
        current_time: currentTime,
        watch_time_seconds: this.totalWatchTime,
      },
    });
  }

  /**
   * Track resume event
   * Optional - called when user resumes video after pause
   *
   * @param currentTime - Current playback position in seconds
   */
  async trackResume(currentTime: number): Promise<void> {
    if (this.isPlaying) return;

    this.isPlaying = true;
    this.lastTimeUpdate = Date.now();

    await trackVideoEvent({
      event_type: 'video_resumed',
      video_id: this.videoId,
      creator_id: this.creatorId,
      student_id: this.studentId,
      course_id: this.courseId,
      module_id: this.moduleId,
      metadata: {
        source_type: this.sourceType,
        current_time: currentTime,
        watch_time_seconds: this.totalWatchTime,
      },
    });
  }

  /**
   * Track seek event
   * Optional - called when user jumps to different timestamp
   *
   * @param fromTime - Previous playback position in seconds
   * @param toTime - New playback position in seconds
   */
  async trackSeek(fromTime: number, toTime: number): Promise<void> {
    await trackVideoEvent({
      event_type: 'video_seeked',
      video_id: this.videoId,
      creator_id: this.creatorId,
      student_id: this.studentId,
      course_id: this.courseId,
      module_id: this.moduleId,
      metadata: {
        source_type: this.sourceType,
        from_time: fromTime,
        to_time: toTime,
        watch_time_seconds: this.totalWatchTime,
      },
    });
  }

  /**
   * Track playback speed change
   * Optional - called when user changes playback speed
   *
   * @param oldSpeed - Previous playback speed (e.g., 1.0)
   * @param newSpeed - New playback speed (e.g., 1.5)
   */
  async trackSpeedChange(oldSpeed: number, newSpeed: number): Promise<void> {
    await trackVideoEvent({
      event_type: 'playback_speed_changed',
      video_id: this.videoId,
      creator_id: this.creatorId,
      student_id: this.studentId,
      course_id: this.courseId,
      module_id: this.moduleId,
      metadata: {
        source_type: this.sourceType,
        old_speed: oldSpeed,
        new_speed: newSpeed,
      },
    });
  }

  /**
   * Update watch time
   * Should be called periodically during playback (e.g., every 5 seconds)
   * Automatically calculates elapsed time since last update
   */
  updateWatchTime(): void {
    if (!this.isPlaying) return;

    const now = Date.now();
    const elapsed = (now - this.lastTimeUpdate) / 1000; // Convert to seconds
    this.totalWatchTime += elapsed;
    this.lastTimeUpdate = now;
  }

  /**
   * Get total watch time in seconds
   * @returns Total seconds spent watching the video
   */
  getTotalWatchTime(): number {
    this.updateWatchTime();
    return Math.floor(this.totalWatchTime);
  }

  /**
   * Get device type for analytics
   * @returns 'mobile' | 'tablet' | 'desktop'
   */
  private getDeviceType(): string {
    const width = window.innerWidth;

    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  /**
   * Reset tracker for new playback session
   * Useful if same component is reused for different videos
   */
  reset(): void {
    this.hasStarted = false;
    this.milestonesReached.clear();
    this.startTime = 0;
    this.totalWatchTime = 0;
    this.lastTimeUpdate = 0;
    this.isPlaying = false;
  }
}

/**
 * Simple analytics tracker for quick integration
 * Use this if you don't need full VideoAnalyticsTracker features
 *
 * @example
 * ```typescript
 * // In your video player component:
 * const handlePlay = () => {
 *   trackSimpleEvent('video_started', videoId, creatorId, studentId, 'youtube');
 * };
 * ```
 */
export async function trackSimpleEvent(
  eventType: VideoAnalyticsEventType,
  videoId: string,
  creatorId: string,
  studentId?: string,
  sourceType?: 'youtube' | 'mux' | 'loom' | 'upload',
  metadata?: Record<string, any>
): Promise<void> {
  await trackVideoEvent({
    event_type: eventType,
    video_id: videoId,
    creator_id: creatorId,
    student_id: studentId,
    metadata: {
      source_type: sourceType,
      ...metadata,
    },
  });
}
