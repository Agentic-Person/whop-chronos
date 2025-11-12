'use client';

import MuxPlayer from '@mux/mux-player-react';
import { useState, useEffect, useRef } from 'react';
import { VideoAnalyticsTracker } from '@/lib/video/player-analytics';

interface MuxVideoPlayerProps {
  playbackId: string;
  videoId: string;
  title?: string;
  studentId?: string;
  creatorId?: string;
  courseId?: string;
  moduleId?: string;
  onStart?: () => void;
  onProgress?: (percent: number, currentTime: number) => void;
  onComplete?: () => void;
  onTimeUpdate?: (watchTime: number) => void;
  autoPlay?: boolean;
  className?: string;
  enableAnalytics?: boolean;
}

/**
 * MuxVideoPlayer Component
 *
 * HLS video player for Mux-hosted videos with comprehensive analytics tracking
 *
 * Features:
 * - Auto-play support
 * - Quality selection
 * - Playback speed controls
 * - Responsive design
 * - Analytics event emission (start, progress, complete, time updates)
 *
 * @param playbackId - Mux playback ID from database (mux_playback_id)
 * @param videoId - Video ID for analytics tracking
 * @param title - Video title for player display
 * @param onStart - Callback when video starts playing
 * @param onProgress - Callback for progress milestones (percent, currentTime)
 * @param onComplete - Callback when video completes (90%+ watched)
 * @param onTimeUpdate - Callback for watch time updates
 * @param autoPlay - Whether to autoplay the video
 * @param className - Additional CSS classes
 */
export default function MuxVideoPlayer({
  playbackId,
  videoId,
  title,
  studentId,
  creatorId,
  courseId,
  moduleId,
  onStart,
  onProgress,
  onComplete,
  onTimeUpdate,
  autoPlay = false,
  className = '',
  enableAnalytics = true,
}: MuxVideoPlayerProps) {
  const [error, setError] = useState<string | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [milestonesReached, setMilestonesReached] = useState<Set<number>>(new Set());
  const playerRef = useRef<HTMLVideoElement>(null);
  const lastTimeUpdateRef = useRef<number>(0);
  const analyticsRef = useRef<VideoAnalyticsTracker | null>(null);

  // Initialize analytics tracker
  useEffect(() => {
    if (enableAnalytics && creatorId) {
      analyticsRef.current = new VideoAnalyticsTracker({
        videoId,
        creatorId,
        studentId,
        courseId,
        moduleId,
        sourceType: 'mux',
      });
    }

    return () => {
      analyticsRef.current = null;
    };
  }, [videoId, creatorId, studentId, courseId, moduleId, enableAnalytics]);

  // Reset state when video changes
  useEffect(() => {
    setHasStarted(false);
    setMilestonesReached(new Set());
    setError(null);
    analyticsRef.current?.reset();
  }, [playbackId, videoId]);

  /**
   * Handle play event
   * Fires when video starts playing for the first time
   */
  const handlePlay = () => {
    if (!hasStarted) {
      setHasStarted(true);
      onStart?.();
      analyticsRef.current?.trackStart();
    }
  };

  /**
   * Handle time update event
   * Tracks progress milestones and watch time
   */
  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    const currentTime = video.currentTime;
    const duration = video.duration;

    if (!duration || duration === 0) return;

    // Calculate percent complete
    const percentComplete = (currentTime / duration) * 100;

    // Track progress milestones (10%, 25%, 50%, 75%, 90%)
    const milestones = [10, 25, 50, 75, 90];
    for (const milestone of milestones) {
      if (percentComplete >= milestone && !milestonesReached.has(milestone)) {
        setMilestonesReached((prev) => new Set([...prev, milestone]));
        onProgress?.(milestone, currentTime);
        analyticsRef.current?.trackProgress(percentComplete, currentTime);

        // Check for completion at 90% milestone
        if (milestone === 90) {
          onComplete?.();
        }
      }
    }

    // Update watch time every 5 seconds to reduce API calls
    const now = Date.now();
    if (now - lastTimeUpdateRef.current >= 5000) {
      lastTimeUpdateRef.current = now;
      onTimeUpdate?.(Math.floor(currentTime));
      analyticsRef.current?.updateWatchTime();
    }
  };

  /**
   * Handle ended event
   * Fires when video playback reaches the end
   */
  const handleEnded = () => {
    // Ensure completion is tracked even if 90% milestone wasn't reached
    if (!milestonesReached.has(90)) {
      onComplete?.();
    }
    analyticsRef.current?.trackComplete();
  };

  /**
   * Handle error event
   * Captures and displays player errors
   */
  const handleError = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    console.error('[MuxVideoPlayer] Playback error:', e);
    setError('Failed to load video. Please check if the playback ID is valid.');
  };

  if (error) {
    return (
      <div className={`aspect-video w-full bg-gray-900 rounded-lg overflow-hidden ${className}`}>
        <div className="w-full h-full flex items-center justify-center text-white">
          <div className="text-center p-6">
            <p className="text-red-400 mb-2">{error}</p>
            <p className="text-sm text-gray-400">Playback ID: {playbackId}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`aspect-video w-full bg-black rounded-lg overflow-hidden ${className}`}>
      <MuxPlayer
        ref={playerRef}
        playbackId={playbackId}
        metadata={{
          video_id: videoId,
          video_title: title || 'Untitled Video',
        }}
        streamType="on-demand"
        autoPlay={autoPlay}
        onPlay={handlePlay}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onError={handleError}
        className="w-full h-full"
        style={{
          width: '100%',
          height: '100%',
          aspectRatio: '16 / 9',
        }}
      />
    </div>
  );
}
