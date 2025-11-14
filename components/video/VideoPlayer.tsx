'use client';

import { lazy, Suspense, forwardRef, useImperativeHandle, useRef } from 'react';
import YouTube, { YouTubeProps } from 'react-youtube';
import { useState, useEffect } from 'react';
import type { Database } from '@/lib/db/types';
import { VideoAnalyticsTracker } from '@/lib/video/player-analytics';

// Lazy load player components for better performance
const MuxVideoPlayer = lazy(() => import('./MuxVideoPlayer'));
const LoomPlayer = lazy(() => import('./LoomPlayer'));

type Video = Database['public']['Tables']['videos']['Row'];

/**
 * Video Player Control Interface
 * Exposed via ref to parent components for programmatic control
 */
export interface VideoPlayerHandle {
  /** Seek to a specific time in seconds */
  seekTo: (seconds: number) => void;
  /** Start or resume playback */
  play: () => Promise<void>;
  /** Pause playback */
  pause: () => void;
  /** Get current playback position in seconds */
  getCurrentTime: () => number;
  /** Get total video duration in seconds */
  getDuration: () => number;
  /** Set volume (0-1) */
  setVolume: (volume: number) => void;
  /** Set playback rate (0.5, 1, 1.5, 2) */
  setPlaybackRate: (rate: number) => void;
}

interface VideoPlayerProps {
  video: Video;
  studentId?: string;
  creatorId?: string; // For analytics tracking
  courseId?: string; // For analytics tracking
  moduleId?: string; // For analytics tracking
  onProgress?: (currentTime: number) => void;
  onComplete?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onTimeUpdate?: (watchTime: number) => void;
  autoplay?: boolean;
  className?: string;
  enableAnalytics?: boolean; // Default: true
}

/**
 * VideoPlayer Component - Unified video player with multi-source support
 *
 * Routes to appropriate player based on source_type:
 * - youtube: YouTube iframe player
 * - mux: Mux HLS player
 * - loom: Loom iframe player
 * - upload: HTML5 video player
 *
 * All players emit standardized analytics events
 *
 * Exposed Methods (via ref):
 * - seekTo(seconds): Jump to specific timestamp
 * - play(): Start/resume playback
 * - pause(): Pause playback
 * - getCurrentTime(): Get current position
 * - getDuration(): Get video duration
 * - setVolume(0-1): Set volume
 * - setPlaybackRate(0.5-2): Set playback speed
 *
 * @param video - Video object from database with source_type field
 * @param studentId - Student ID for analytics tracking
 * @param onProgress - Callback fired when playback position changes (in seconds)
 * @param onComplete - Callback fired when video playback completes
 * @param onPlay - Callback fired when video starts playing
 * @param onPause - Callback fired when video is paused
 * @param onTimeUpdate - Callback fired for watch time updates
 * @param autoplay - Whether to autoplay the video (default: false)
 * @param className - Additional CSS classes for the container
 * @param enableAnalytics - Whether to track analytics (default: true)
 */
const VideoPlayer = forwardRef<VideoPlayerHandle, VideoPlayerProps>(({
  video,
  studentId,
  creatorId,
  courseId,
  moduleId,
  onProgress,
  onComplete,
  onPlay,
  onPause,
  onTimeUpdate,
  autoplay = false,
  className = '',
  enableAnalytics = true,
}, ref) => {
  // Refs for each player type
  const youtubePlayerRef = useRef<any>(null);
  const muxPlayerRef = useRef<any>(null);
  const loomIframeRef = useRef<HTMLIFrameElement>(null);
  const html5VideoRef = useRef<HTMLVideoElement>(null);

  // Expose control methods via ref
  useImperativeHandle(ref, () => ({
    seekTo: (seconds: number) => {
      try {
        // Validate input
        if (seconds < 0) {
          console.warn('[VideoPlayer] seekTo: Invalid time (negative)');
          return;
        }

        switch (video.source_type) {
          case 'youtube':
            youtubePlayerRef.current?.seekTo(seconds, true);
            break;
          case 'mux':
            if (muxPlayerRef.current) {
              muxPlayerRef.current.currentTime = seconds;
            }
            break;
          case 'loom':
            loomIframeRef.current?.contentWindow?.postMessage({
              method: 'setCurrentTime',
              value: seconds
            }, 'https://www.loom.com');
            break;
          case 'upload':
            if (html5VideoRef.current) {
              html5VideoRef.current.currentTime = seconds;
            }
            break;
        }
      } catch (error) {
        console.error('[VideoPlayer] seekTo error:', error);
      }
    },

    play: async () => {
      try {
        switch (video.source_type) {
          case 'youtube':
            youtubePlayerRef.current?.playVideo();
            break;
          case 'mux':
            await muxPlayerRef.current?.play();
            break;
          case 'loom':
            loomIframeRef.current?.contentWindow?.postMessage({
              method: 'play'
            }, 'https://www.loom.com');
            break;
          case 'upload':
            await html5VideoRef.current?.play();
            break;
        }
      } catch (error) {
        console.error('[VideoPlayer] play error:', error);
      }
    },

    pause: () => {
      try {
        switch (video.source_type) {
          case 'youtube':
            youtubePlayerRef.current?.pauseVideo();
            break;
          case 'mux':
            muxPlayerRef.current?.pause();
            break;
          case 'loom':
            loomIframeRef.current?.contentWindow?.postMessage({
              method: 'pause'
            }, 'https://www.loom.com');
            break;
          case 'upload':
            html5VideoRef.current?.pause();
            break;
        }
      } catch (error) {
        console.error('[VideoPlayer] pause error:', error);
      }
    },

    getCurrentTime: () => {
      try {
        switch (video.source_type) {
          case 'youtube':
            return youtubePlayerRef.current?.getCurrentTime() || 0;
          case 'mux':
            return muxPlayerRef.current?.currentTime || 0;
          case 'loom':
            // Loom doesn't expose getCurrentTime directly, return 0
            console.warn('[VideoPlayer] getCurrentTime not available for Loom');
            return 0;
          case 'upload':
            return html5VideoRef.current?.currentTime || 0;
          default:
            return 0;
        }
      } catch (error) {
        console.error('[VideoPlayer] getCurrentTime error:', error);
        return 0;
      }
    },

    getDuration: () => {
      try {
        switch (video.source_type) {
          case 'youtube':
            return youtubePlayerRef.current?.getDuration() || 0;
          case 'mux':
            return muxPlayerRef.current?.duration || 0;
          case 'loom':
            // Loom doesn't expose duration directly, fallback to database
            return video.duration_seconds || 0;
          case 'upload':
            return html5VideoRef.current?.duration || 0;
          default:
            return video.duration_seconds || 0;
        }
      } catch (error) {
        console.error('[VideoPlayer] getDuration error:', error);
        return video.duration_seconds || 0;
      }
    },

    setVolume: (volume: number) => {
      try {
        const clampedVolume = Math.max(0, Math.min(1, volume));

        switch (video.source_type) {
          case 'youtube':
            youtubePlayerRef.current?.setVolume(clampedVolume * 100);
            break;
          case 'mux':
            if (muxPlayerRef.current) {
              muxPlayerRef.current.volume = clampedVolume;
            }
            break;
          case 'loom':
            loomIframeRef.current?.contentWindow?.postMessage({
              method: 'setVolume',
              value: clampedVolume
            }, 'https://www.loom.com');
            break;
          case 'upload':
            if (html5VideoRef.current) {
              html5VideoRef.current.volume = clampedVolume;
            }
            break;
        }
      } catch (error) {
        console.error('[VideoPlayer] setVolume error:', error);
      }
    },

    setPlaybackRate: (rate: number) => {
      try {
        const validRates = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
        const clampedRate = validRates.reduce((prev, curr) =>
          Math.abs(curr - rate) < Math.abs(prev - rate) ? curr : prev
        );

        switch (video.source_type) {
          case 'youtube':
            youtubePlayerRef.current?.setPlaybackRate(clampedRate);
            break;
          case 'mux':
            if (muxPlayerRef.current) {
              muxPlayerRef.current.playbackRate = clampedRate;
            }
            break;
          case 'loom':
            loomIframeRef.current?.contentWindow?.postMessage({
              method: 'setPlaybackRate',
              value: clampedRate
            }, 'https://www.loom.com');
            break;
          case 'upload':
            if (html5VideoRef.current) {
              html5VideoRef.current.playbackRate = clampedRate;
            }
            break;
        }
      } catch (error) {
        console.error('[VideoPlayer] setPlaybackRate error:', error);
      }
    },
  }), [video.source_type, video.duration_seconds]);
  /**
   * Loading fallback for lazy-loaded components
   */
  const LoadingFallback = () => (
    <div className={`aspect-video w-full bg-gray-900 rounded-lg overflow-hidden ${className}`}>
      <div className="w-full h-full flex items-center justify-center text-white">
        <div className="text-center p-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
          <p className="text-gray-400">Loading video player...</p>
        </div>
      </div>
    </div>
  );

  /**
   * Error state component
   */
  const ErrorState = ({ message, details }: { message: string; details?: string }) => (
    <div className={`aspect-video w-full bg-gray-900 rounded-lg overflow-hidden ${className}`}>
      <div className="w-full h-full flex items-center justify-center text-white">
        <div className="text-center p-6">
          <p className="text-red-400 mb-2">{message}</p>
          {details && <p className="text-sm text-gray-400">{details}</p>}
        </div>
      </div>
    </div>
  );

  // Route to appropriate player based on source_type
  switch (video.source_type) {
    case 'youtube':
      return (
        <YouTubePlayer
          ref={youtubePlayerRef}
          video={video}
          studentId={studentId}
          creatorId={creatorId || video.creator_id}
          courseId={courseId}
          moduleId={moduleId}
          onProgress={onProgress}
          onComplete={onComplete}
          onPlay={onPlay}
          onPause={onPause}
          autoplay={autoplay}
          className={className}
          enableAnalytics={enableAnalytics}
        />
      );

    case 'mux':
      if (!video.mux_playback_id) {
        return <ErrorState message="Mux playback ID not found" details={`Video ID: ${video.id}`} />;
      }
      return (
        <Suspense fallback={<LoadingFallback />}>
          <MuxVideoPlayer
            ref={muxPlayerRef}
            playbackId={video.mux_playback_id}
            videoId={video.id}
            title={video.title}
            studentId={studentId}
            creatorId={creatorId || video.creator_id}
            courseId={courseId}
            moduleId={moduleId}
            onStart={onPlay}
            onProgress={(_percent, currentTime) => {
              onProgress?.(currentTime);
            }}
            onComplete={onComplete}
            onTimeUpdate={onTimeUpdate}
            autoPlay={autoplay}
            className={className}
            enableAnalytics={enableAnalytics}
          />
        </Suspense>
      );

    case 'loom':
      if (!video.embed_id) {
        return <ErrorState message="Loom video ID not found" details={`Video ID: ${video.id}`} />;
      }
      return (
        <Suspense fallback={<LoadingFallback />}>
          <LoomPlayer
            ref={loomIframeRef}
            loomVideoId={video.embed_id}
            videoId={video.id}
            title={video.title}
            studentId={studentId}
            creatorId={creatorId || video.creator_id}
            courseId={courseId}
            moduleId={moduleId}
            onStart={onPlay}
            onProgress={(_percent) => {
              // Loom only provides percent, not current time
            }}
            onComplete={onComplete}
            onTimeUpdate={onTimeUpdate}
            autoPlay={autoplay}
            className={className}
            enableAnalytics={enableAnalytics}
          />
        </Suspense>
      );

    case 'upload':
      return (
        <HTML5VideoPlayer
          ref={html5VideoRef}
          video={video}
          studentId={studentId}
          creatorId={creatorId || video.creator_id}
          courseId={courseId}
          moduleId={moduleId}
          onProgress={onProgress}
          onComplete={onComplete}
          onPlay={onPlay}
          onPause={onPause}
          onTimeUpdate={onTimeUpdate}
          autoplay={autoplay}
          className={className}
          enableAnalytics={enableAnalytics}
        />
      );

    default:
      return (
        <ErrorState
          message="Unsupported video type"
          details={`Source type: ${video.source_type || 'unknown'}`}
        />
      );
  }
});

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;

/**
 * YouTube Player Component
 */
const YouTubePlayer = forwardRef<any, Omit<VideoPlayerProps, 'onTimeUpdate'>>(({
  video,
  studentId,
  creatorId,
  courseId,
  moduleId,
  onProgress,
  onComplete,
  onPlay,
  onPause,
  autoplay = false,
  className = '',
  enableAnalytics = true,
}, ref) => {
  const [error, setError] = useState<string | null>(null);
  const analyticsRef = useRef<VideoAnalyticsTracker | null>(null);
  const playerInstanceRef = useRef<any>(null);

  // Initialize analytics tracker
  useEffect(() => {
    if (enableAnalytics && creatorId) {
      analyticsRef.current = new VideoAnalyticsTracker({
        videoId: video.id,
        creatorId,
        studentId,
        courseId,
        moduleId,
        sourceType: 'youtube',
      });
    }

    return () => {
      analyticsRef.current = null;
    };
  }, [video.id, creatorId, studentId, courseId, moduleId, enableAnalytics]);

  // Expose player instance via ref
  useEffect(() => {
    if (ref && typeof ref === 'object') {
      (ref as any).current = playerInstanceRef.current;
    }
  }, [ref]);

  const opts: YouTubeProps['opts'] = {
    width: '100%',
    height: '100%',
    playerVars: {
      autoplay: autoplay ? 1 : 0,
      modestbranding: 1,
      rel: 0,
      enablejsapi: 1,
    },
  };

  const handleReady = (event: any) => {
    playerInstanceRef.current = event.target;
    if (ref && typeof ref === 'object') {
      (ref as any).current = event.target;
    }
  };

  const handleStateChange = (event: any) => {
    const player = event.target;
    const playerState = event.data;

    if (playerState === 1) {
      // Playing
      onPlay?.();
      analyticsRef.current?.trackStart();
    } else if (playerState === 2) {
      // Paused
      onPause?.();
      const currentTime = player.getCurrentTime();
      analyticsRef.current?.trackPause(currentTime);
    }

    if (playerState === 1 && onProgress) {
      const currentTime = player.getCurrentTime();
      const duration = player.getDuration();

      onProgress(currentTime);

      // Track progress milestones
      if (duration > 0) {
        const percentComplete = (currentTime / duration) * 100;
        analyticsRef.current?.trackProgress(percentComplete, currentTime);
      }
    }
  };

  const handleEnd = () => {
    onComplete?.();
    analyticsRef.current?.trackComplete();
  };

  const handleError = (event: any) => {
    console.error('[VideoPlayer] YouTube player error:', event);
    setError('Failed to load YouTube video. Please check if the video is available.');
  };

  return (
    <div className={`aspect-video w-full bg-black rounded-lg overflow-hidden ${className}`}>
      {error ? (
        <div className="w-full h-full flex items-center justify-center text-white bg-gray-900">
          <div className="text-center p-6">
            <p className="text-red-400 mb-2">{error}</p>
            <p className="text-sm text-gray-400">Video ID: {video.youtube_video_id}</p>
          </div>
        </div>
      ) : (
        <YouTube
          videoId={video.youtube_video_id!}
          className="w-full h-full"
          iframeClassName="w-full h-full"
          opts={opts}
          onReady={handleReady}
          onStateChange={handleStateChange}
          onEnd={handleEnd}
          onError={handleError}
        />
      )}
    </div>
  );
});

YouTubePlayer.displayName = 'YouTubePlayer';

/**
 * HTML5 Video Player Component (for uploaded videos)
 */
const HTML5VideoPlayer = forwardRef<HTMLVideoElement, Omit<VideoPlayerProps, 'video'> & { video: Video }>(({
  video,
  studentId,
  creatorId,
  courseId,
  moduleId,
  onProgress,
  onComplete,
  onPlay,
  onPause,
  onTimeUpdate,
  autoplay = false,
  className = '',
  enableAnalytics = true,
}, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const lastTimeUpdateRef = useRef<number>(0);
  const analyticsRef = useRef<VideoAnalyticsTracker | null>(null);

  // Expose video element via ref
  useEffect(() => {
    if (ref && typeof ref === 'object' && videoRef.current) {
      (ref as any).current = videoRef.current;
    }
  }, [ref]);

  // Initialize analytics tracker
  useEffect(() => {
    if (enableAnalytics && creatorId) {
      analyticsRef.current = new VideoAnalyticsTracker({
        videoId: video.id,
        creatorId,
        studentId,
        courseId,
        moduleId,
        sourceType: 'upload',
      });
    }

    return () => {
      analyticsRef.current = null;
    };
  }, [video.id, creatorId, studentId, courseId, moduleId, enableAnalytics]);

  const videoUrl = video.url || video.storage_path;

  if (!videoUrl) {
    return (
      <div
        className={`aspect-video w-full bg-gray-900 rounded-lg flex items-center justify-center ${className}`}
      >
        <div className="text-center p-6">
          <p className="text-gray-400">No video source available</p>
          <p className="text-sm text-gray-500 mt-2">Video ID: {video.id}</p>
        </div>
      </div>
    );
  }

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const currentTime = e.currentTarget.currentTime;
    const duration = e.currentTarget.duration;

    onProgress?.(currentTime);

    // Track progress milestones
    if (duration > 0) {
      const percentComplete = (currentTime / duration) * 100;
      analyticsRef.current?.trackProgress(percentComplete, currentTime);
    }

    // Update watch time every 5 seconds to reduce API calls
    const now = Date.now();
    if (onTimeUpdate && now - lastTimeUpdateRef.current >= 5000) {
      lastTimeUpdateRef.current = now;
      onTimeUpdate(Math.floor(currentTime));
      analyticsRef.current?.updateWatchTime();
    }
  };

  const handleVideoPlay = () => {
    onPlay?.();
    analyticsRef.current?.trackStart();
  };

  const handleVideoPause = () => {
    onPause?.();
    if (videoRef.current) {
      analyticsRef.current?.trackPause(videoRef.current.currentTime);
    }
  };

  const handleVideoEnded = () => {
    onComplete?.();
    analyticsRef.current?.trackComplete();
  };

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    console.error('[VideoPlayer] Video load error:', e);
    setError('Failed to load video. Please check if the file is accessible.');
  };

  return (
    <div className={`aspect-video w-full bg-black rounded-lg overflow-hidden ${className}`}>
      {error ? (
        <div className="w-full h-full flex items-center justify-center text-white bg-gray-900">
          <div className="text-center p-6">
            <p className="text-red-400 mb-2">{error}</p>
            <p className="text-sm text-gray-400">Video path: {videoUrl}</p>
          </div>
        </div>
      ) : (
        <video
          ref={videoRef}
          src={videoUrl}
          controls
          autoPlay={autoplay}
          className="w-full h-full"
          onTimeUpdate={handleTimeUpdate}
          onPlay={handleVideoPlay}
          onPause={handleVideoPause}
          onEnded={handleVideoEnded}
          onError={handleVideoError}
          preload="metadata"
        >
          <p className="text-white p-4">Your browser does not support the video tag.</p>
        </video>
      )}
    </div>
  );
});

HTML5VideoPlayer.displayName = 'HTML5VideoPlayer';
