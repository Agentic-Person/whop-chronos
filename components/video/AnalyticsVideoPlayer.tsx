'use client';

import { useState, useEffect } from 'react';
import VideoPlayer from './VideoPlayer';
import { useVideoWatchSession } from '@/hooks/useVideoWatchSession';
import { trackVideoStart, trackVideoProgress, trackVideoComplete } from '@/lib/analytics/video-tracking';
import type { Database } from '@/lib/db/types';

type Video = Database['public']['Tables']['videos']['Row'];

interface AnalyticsVideoPlayerProps {
  video: Video;
  studentId: string;
  creatorId: string;
  courseId?: string;
  moduleId?: string;
  deviceType?: 'desktop' | 'mobile' | 'tablet';
  referrerType?: 'course_page' | 'direct_link' | 'search' | 'chat_reference';
  autoplay?: boolean;
  className?: string;
}

/**
 * AnalyticsVideoPlayer Component
 *
 * Wrapper around VideoPlayer that automatically handles all analytics tracking
 *
 * Features:
 * - Creates and manages watch sessions
 * - Tracks video start, progress milestones, completion
 * - Updates watch time periodically
 * - Handles cleanup on unmount
 * - Works with all video sources (YouTube, Mux, Loom, upload)
 *
 * Usage:
 * ```tsx
 * <AnalyticsVideoPlayer
 *   video={videoData}
 *   studentId={user.id}
 *   creatorId={creator.id}
 *   referrerType="course_page"
 * />
 * ```
 *
 * @param video - Video object from database
 * @param studentId - Student watching the video
 * @param creatorId - Creator who owns the video
 * @param courseId - Optional course context
 * @param moduleId - Optional module context
 * @param deviceType - Device type (auto-detected if not provided)
 * @param referrerType - How user reached this video
 * @param autoplay - Whether to autoplay
 * @param className - Additional CSS classes
 */
export default function AnalyticsVideoPlayer({
  video,
  studentId,
  creatorId,
  courseId: _courseId,
  moduleId: _moduleId,
  deviceType,
  referrerType,
  autoplay = false,
  className = '',
}: AnalyticsVideoPlayerProps) {
  const [milestonesReached, setMilestonesReached] = useState<Set<number>>(new Set());
  const [hasStarted, setHasStarted] = useState(false);
  const [watchTimeSeconds, setWatchTimeSeconds] = useState(0);

  // Create and manage watch session
  const { sessionId, isLoading, error, trackProgress, endSession } = useVideoWatchSession(
    video.id,
    studentId,
    creatorId,
    { deviceType, referrerType },
  );

  /**
   * Handle video start
   */
  const handleStart = async () => {
    if (hasStarted || !sessionId) return;

    setHasStarted(true);

    // Track video start event
    await trackVideoStart(video.id, creatorId, studentId, sessionId, video.source_type);

    console.log('[AnalyticsVideoPlayer] Video started:', {
      videoId: video.id,
      sessionId,
      sourceType: video.source_type,
    });
  };

  /**
   * Handle progress updates
   * @param currentTime - Current playback time in seconds
   */
  const handleProgress = async (currentTime: number) => {
    if (!sessionId || !video.duration_seconds) return;

    const percentComplete = (currentTime / video.duration_seconds) * 100;

    // Track progress milestones (10%, 25%, 50%, 75%, 90%)
    const milestones = [10, 25, 50, 75, 90];
    for (const milestone of milestones) {
      if (percentComplete >= milestone && !milestonesReached.has(milestone)) {
        setMilestonesReached((prev) => new Set([...prev, milestone]));

        // Track milestone
        await trackVideoProgress(video.id, creatorId, studentId, sessionId, milestone, currentTime);

        console.log('[AnalyticsVideoPlayer] Milestone reached:', {
          milestone,
          currentTime,
          percentComplete,
        });

        // Track completion at 90%
        if (milestone === 90) {
          await trackVideoComplete(video.id, creatorId, studentId, sessionId, watchTimeSeconds);
          console.log('[AnalyticsVideoPlayer] Video completed');
        }
      }
    }

    // Update session progress
    await trackProgress(percentComplete, Math.floor(currentTime));
  };

  /**
   * Handle watch time updates
   * @param currentTime - Current playback time in seconds
   */
  const handleTimeUpdate = (currentTime: number) => {
    setWatchTimeSeconds(currentTime);
  };

  /**
   * Handle video completion
   */
  const handleComplete = async () => {
    if (!sessionId) return;

    // Ensure completion is tracked if not already done
    if (!milestonesReached.has(90)) {
      await trackVideoComplete(video.id, creatorId, studentId, sessionId, watchTimeSeconds);
    }

    // End session
    await endSession();

    console.log('[AnalyticsVideoPlayer] Video ended, session closed');
  };

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (sessionId) {
        endSession();
      }
    };
  }, [sessionId]);

  // Show loading state while session is being created
  if (isLoading) {
    return (
      <div className={`aspect-video w-full bg-gray-900 rounded-lg overflow-hidden ${className}`}>
        <div className="w-full h-full flex items-center justify-center text-white">
          <div className="text-center p-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
            <p className="text-gray-400">Initializing player...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error if session creation failed
  if (error) {
    console.error('[AnalyticsVideoPlayer] Session error:', error);
    // Continue to render player even if analytics fails
  }

  return (
    <VideoPlayer
      video={video}
      studentId={studentId}
      onPlay={handleStart}
      onProgress={handleProgress}
      onTimeUpdate={handleTimeUpdate}
      onComplete={handleComplete}
      autoplay={autoplay}
      className={className}
    />
  );
}
