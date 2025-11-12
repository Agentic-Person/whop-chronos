'use client';

import { lazy, Suspense } from 'react';
import YouTube, { YouTubeProps } from 'react-youtube';
import { useState, useRef } from 'react';
import type { Database } from '@/lib/db/types';

// Lazy load player components for better performance
const MuxVideoPlayer = lazy(() => import('./MuxVideoPlayer'));
const LoomPlayer = lazy(() => import('./LoomPlayer'));

type Video = Database['public']['Tables']['videos']['Row'];

interface VideoPlayerProps {
  video: Video;
  studentId?: string;
  onProgress?: (currentTime: number) => void;
  onComplete?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onTimeUpdate?: (watchTime: number) => void;
  autoplay?: boolean;
  className?: string;
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
 * @param video - Video object from database with source_type field
 * @param studentId - Student ID for analytics tracking
 * @param onProgress - Callback fired when playback position changes (in seconds)
 * @param onComplete - Callback fired when video playback completes
 * @param onPlay - Callback fired when video starts playing
 * @param onPause - Callback fired when video is paused
 * @param onTimeUpdate - Callback fired for watch time updates
 * @param autoplay - Whether to autoplay the video (default: false)
 * @param className - Additional CSS classes for the container
 */
export default function VideoPlayer({
  video,
  studentId,
  onProgress,
  onComplete,
  onPlay,
  onPause,
  onTimeUpdate,
  autoplay = false,
  className = '',
}: VideoPlayerProps) {
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
          video={video}
          onProgress={onProgress}
          onComplete={onComplete}
          onPlay={onPlay}
          onPause={onPause}
          autoplay={autoplay}
          className={className}
        />
      );

    case 'mux':
      if (!video.mux_playback_id) {
        return <ErrorState message="Mux playback ID not found" details={`Video ID: ${video.id}`} />;
      }
      return (
        <Suspense fallback={<LoadingFallback />}>
          <MuxVideoPlayer
            playbackId={video.mux_playback_id}
            videoId={video.id}
            title={video.title}
            onStart={onPlay}
            onProgress={(percent, currentTime) => {
              onProgress?.(currentTime);
            }}
            onComplete={onComplete}
            onTimeUpdate={onTimeUpdate}
            autoPlay={autoplay}
            className={className}
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
            loomVideoId={video.embed_id}
            videoId={video.id}
            title={video.title}
            onStart={onPlay}
            onProgress={(percent) => {
              // Loom only provides percent, not current time
            }}
            onComplete={onComplete}
            onTimeUpdate={onTimeUpdate}
            autoPlay={autoplay}
            className={className}
          />
        </Suspense>
      );

    case 'upload':
      return (
        <HTML5VideoPlayer
          video={video}
          onProgress={onProgress}
          onComplete={onComplete}
          onPlay={onPlay}
          onPause={onPause}
          onTimeUpdate={onTimeUpdate}
          autoplay={autoplay}
          className={className}
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
}

/**
 * YouTube Player Component
 */
function YouTubePlayer({
  video,
  onProgress,
  onComplete,
  onPlay,
  onPause,
  autoplay = false,
  className = '',
}: Omit<VideoPlayerProps, 'studentId' | 'onTimeUpdate'>) {
  const [error, setError] = useState<string | null>(null);

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

  const handleStateChange = (event: any) => {
    const player = event.target;
    const playerState = event.data;

    if (playerState === 1) {
      onPlay?.();
    } else if (playerState === 2) {
      onPause?.();
    }

    if (playerState === 1 && onProgress) {
      const currentTime = player.getCurrentTime();
      onProgress(currentTime);
    }
  };

  const handleEnd = () => {
    onComplete?.();
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
          onStateChange={handleStateChange}
          onEnd={handleEnd}
          onError={handleError}
        />
      )}
    </div>
  );
}

/**
 * HTML5 Video Player Component (for uploaded videos)
 */
function HTML5VideoPlayer({
  video,
  onProgress,
  onComplete,
  onPlay,
  onPause,
  onTimeUpdate,
  autoplay = false,
  className = '',
}: Omit<VideoPlayerProps, 'studentId'>) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const lastTimeUpdateRef = useRef<number>(0);

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
    onProgress?.(currentTime);

    // Update watch time every 5 seconds to reduce API calls
    const now = Date.now();
    if (onTimeUpdate && now - lastTimeUpdateRef.current >= 5000) {
      lastTimeUpdateRef.current = now;
      onTimeUpdate(Math.floor(currentTime));
    }
  };

  const handleVideoPlay = () => {
    onPlay?.();
  };

  const handleVideoPause = () => {
    onPause?.();
  };

  const handleVideoEnded = () => {
    onComplete?.();
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
}
