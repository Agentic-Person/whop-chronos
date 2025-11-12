'use client';

import LiteYouTubeEmbed from 'react-lite-youtube-embed';
import 'react-lite-youtube-embed/dist/LiteYouTubeEmbed.css';
import { useState } from 'react';
import type { Database } from '@/lib/db/types';

type Video = Database['public']['Tables']['videos']['Row'];

interface LiteVideoPlayerProps {
  video: Video;
  className?: string;
  poster?: 'default' | 'hqdefault' | 'mqdefault' | 'sddefault' | 'maxresdefault';
  aspectHeight?: number;
  aspectWidth?: number;
}

/**
 * LiteVideoPlayer Component
 *
 * Lightweight video player optimized for performance on student-facing pages
 * - YouTube videos: Uses react-lite-youtube-embed (3KB, lazy loads iframe)
 * - Uploaded videos: Uses native HTML5 video element
 *
 * Benefits:
 * - Only loads YouTube iframe when user clicks play button
 * - Significantly faster page load times for course pages with multiple videos
 * - Reduces bandwidth consumption
 * - Improves page speed scores
 *
 * Use Cases:
 * - Course catalog pages
 * - Video library listings
 * - Student dashboard
 * - Any page with multiple videos
 *
 * For creator dashboard with advanced controls, use VideoPlayer instead
 *
 * @param video - Video object from database with source_type field
 * @param className - Additional CSS classes for the container
 * @param poster - YouTube thumbnail quality (default: 'maxresdefault' for high quality)
 * @param aspectHeight - Custom aspect ratio height (default: 9)
 * @param aspectWidth - Custom aspect ratio width (default: 16)
 */
export default function LiteVideoPlayer({
  video,
  className = '',
  poster = 'maxresdefault',
  aspectHeight = 9,
  aspectWidth = 16,
}: LiteVideoPlayerProps) {
  const [error, setError] = useState<string | null>(null);

  // Handle YouTube embedded videos with lite player
  if (video.source_type === 'youtube') {
    if (!video.youtube_video_id) {
      return (
        <div className={`aspect-video w-full bg-gray-900 rounded-lg flex items-center justify-center ${className}`}>
          <div className="text-center p-6">
            <p className="text-gray-400">YouTube video ID not found</p>
            <p className="text-sm text-gray-500 mt-2">Video ID: {video.id}</p>
          </div>
        </div>
      );
    }

    return (
      <div className={`w-full rounded-lg overflow-hidden ${className}`}>
        <LiteYouTubeEmbed
          id={video.youtube_video_id}
          title={video.title || 'Video'}
          poster={poster}
          aspectHeight={aspectHeight}
          aspectWidth={aspectWidth}
          noCookie={true} // Use youtube-nocookie.com for privacy
        />
      </div>
    );
  }

  // Handle uploaded video files with native player
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

  const handleError = () => {
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
          src={videoUrl}
          controls
          className="w-full h-full"
          preload="metadata"
          onError={handleError}
          poster={video.thumbnail_url || undefined}
        >
          <p className="text-white p-4">
            Your browser does not support the video tag.
          </p>
        </video>
      )}
    </div>
  );
}
