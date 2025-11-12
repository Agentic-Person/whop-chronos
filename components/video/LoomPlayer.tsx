'use client';

import { useState, useEffect, useRef } from 'react';

interface LoomPlayerProps {
  loomVideoId: string;
  videoId: string;
  title?: string;
  onStart?: () => void;
  onProgress?: (percent: number) => void;
  onComplete?: () => void;
  onTimeUpdate?: (watchTime: number) => void;
  autoPlay?: boolean;
  className?: string;
}

/**
 * LoomPlayer Component
 *
 * Iframe-based player for Loom videos with postMessage API integration
 *
 * Features:
 * - Loom iframe embedding
 * - postMessage API event listening
 * - Progress tracking via playback events
 * - Responsive sizing
 * - Analytics event emission
 *
 * Loom postMessage Events:
 * - PLAY: Video started playing
 * - PAUSE: Video paused
 * - SEEKED: User jumped to different timestamp
 * - ENDED: Video playback completed
 *
 * @param loomVideoId - Loom video ID from database (embed_id)
 * @param videoId - Video ID for analytics tracking
 * @param title - Video title for accessibility
 * @param onStart - Callback when video starts playing
 * @param onProgress - Callback for progress milestones (percent)
 * @param onComplete - Callback when video completes
 * @param onTimeUpdate - Callback for watch time updates
 * @param autoPlay - Whether to autoplay the video
 * @param className - Additional CSS classes
 */
export default function LoomPlayer({
  loomVideoId,
  videoId,
  title,
  onStart,
  onProgress,
  onComplete,
  onTimeUpdate,
  autoPlay = false,
  className = '',
}: LoomPlayerProps) {
  const [error, setError] = useState<string | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [milestonesReached, setMilestonesReached] = useState<Set<number>>(new Set());
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const currentTimeRef = useRef<number>(0);
  const durationRef = useRef<number>(0);
  const lastTimeUpdateRef = useRef<number>(0);

  // Build Loom embed URL
  const embedUrl = `https://www.loom.com/embed/${loomVideoId}?hide_owner=true&hideEmbedTopBar=true${autoPlay ? '&autoplay=1' : ''}`;

  /**
   * Handle postMessage events from Loom iframe
   */
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verify message is from Loom
      if (event.origin !== 'https://www.loom.com') return;

      try {
        const data = event.data;

        // Handle different Loom events
        switch (data.event) {
          case 'ready':
            // Player is ready
            console.log('[LoomPlayer] Player ready');
            break;

          case 'play':
            // Video started playing
            if (!hasStarted) {
              setHasStarted(true);
              onStart?.();
            }
            break;

          case 'pause':
            // Video paused - could track pause events here if needed
            break;

          case 'timeupdate':
            // Time update event
            if (data.currentTime !== undefined && data.duration !== undefined) {
              currentTimeRef.current = data.currentTime;
              durationRef.current = data.duration;

              trackProgress(data.currentTime, data.duration);
            }
            break;

          case 'seeked':
            // User seeked to different position
            if (data.currentTime !== undefined) {
              currentTimeRef.current = data.currentTime;
            }
            break;

          case 'ended':
            // Video ended
            onComplete?.();
            break;

          default:
            // Unknown event
            break;
        }
      } catch (err) {
        console.error('[LoomPlayer] Error handling message:', err);
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [hasStarted, onStart, onComplete]);

  /**
   * Track progress milestones
   */
  const trackProgress = (currentTime: number, duration: number) => {
    if (!duration || duration === 0) return;

    const percentComplete = (currentTime / duration) * 100;

    // Track progress milestones (10%, 25%, 50%, 75%, 90%)
    const milestones = [10, 25, 50, 75, 90];
    for (const milestone of milestones) {
      if (percentComplete >= milestone && !milestonesReached.has(milestone)) {
        setMilestonesReached((prev) => new Set([...prev, milestone]));
        onProgress?.(milestone);

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
    }
  };

  /**
   * Handle iframe load error
   */
  const handleIframeError = () => {
    setError('Failed to load Loom video. Please check if the video ID is valid.');
  };

  // Reset state when video changes
  useEffect(() => {
    setHasStarted(false);
    setMilestonesReached(new Set());
    setError(null);
    currentTimeRef.current = 0;
    durationRef.current = 0;
  }, [loomVideoId, videoId]);

  if (error) {
    return (
      <div className={`aspect-video w-full bg-gray-900 rounded-lg overflow-hidden ${className}`}>
        <div className="w-full h-full flex items-center justify-center text-white">
          <div className="text-center p-6">
            <p className="text-red-400 mb-2">{error}</p>
            <p className="text-sm text-gray-400">Loom Video ID: {loomVideoId}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`aspect-video w-full bg-black rounded-lg overflow-hidden ${className}`}>
      <iframe
        ref={iframeRef}
        src={embedUrl}
        title={title || 'Loom Video'}
        frameBorder="0"
        allowFullScreen
        allow="autoplay; fullscreen; picture-in-picture"
        className="w-full h-full"
        style={{
          width: '100%',
          height: '100%',
          aspectRatio: '16 / 9',
        }}
        onError={handleIframeError}
      />
    </div>
  );
}
