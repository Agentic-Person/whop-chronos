'use client';

import YouTube, { YouTubeProps } from 'react-youtube';
import { useState, useRef, useEffect } from 'react';
import type { Database } from '@/lib/db/types';

type Video = Database['public']['Tables']['videos']['Row'];

interface VideoPlayerProps {
  video: Video;
  onProgress?: (currentTime: number) => void;
  onComplete?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  autoplay?: boolean;
  className?: string;
}

/**
 * VideoPlayer Component
 *
 * Supports both YouTube embedded videos and uploaded video files
 * - YouTube videos: Uses react-youtube for full iframe API access
 * - Uploaded videos: Uses native HTML5 video element
 *
 * @param video - Video object from database with source_type field
 * @param onProgress - Callback fired when playback position changes (in seconds)
 * @param onComplete - Callback fired when video playback completes
 * @param onPlay - Callback fired when video starts playing
 * @param onPause - Callback fired when video is paused
 * @param autoplay - Whether to autoplay the video (default: false)
 * @param className - Additional CSS classes for the container
 */
export default function VideoPlayer({
  video,
  onProgress,
  onComplete,
  onPlay,
  onPause,
  autoplay = false,
  className = '',
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  // Handle YouTube embedded videos
  if (video.source_type === 'youtube') {
    const opts: YouTubeProps['opts'] = {
      width: '100%',
      height: '100%',
      playerVars: {
        autoplay: autoplay ? 1 : 0,
        modestbranding: 1, // Minimal YouTube branding
        rel: 0, // Don't show related videos from other channels
        enablejsapi: 1, // Enable JavaScript API for tracking
      },
    };

    const handleStateChange = (event: any) => {
      const player = event.target;
      const playerState = event.data;

      // YouTube Player States:
      // -1: unstarted
      // 0: ended
      // 1: playing
      // 2: paused
      // 3: buffering
      // 5: video cued

      if (playerState === 1) {
        // Playing
        onPlay?.();
      } else if (playerState === 2) {
        // Paused
        onPause?.();
      }

      // Track progress while playing
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

  // Handle uploaded video files
  const videoUrl = video.url || video.storage_path;

  if (!videoUrl) {
    return (
      <div className={`aspect-video w-full bg-gray-900 rounded-lg flex items-center justify-center ${className}`}>
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
          <p className="text-white p-4">
            Your browser does not support the video tag.
          </p>
        </video>
      )}
    </div>
  );
}
