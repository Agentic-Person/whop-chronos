"use client";

/**
 * Example Integration: Chat Interface with Video Player
 *
 * This example demonstrates how to integrate the enhanced ChatInterface
 * with a video player to enable clickable timestamp navigation.
 *
 * Wave 2 Implementation: The IntegratedLessonViewer should use this pattern
 * to wire up timestamp clicks with the video player.
 */

import { useRef, useState, useImperativeHandle } from 'react';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { toast } from '@/lib/utils/toast';

// Example video player ref interface
// Replace with actual VideoPlayer ref type from your implementation
interface VideoPlayerHandle {
  seekTo: (seconds: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
}

// Mock video player component for example purposes
const MockVideoPlayer = ({ playerRef, videoId }: {
  playerRef: React.RefObject<VideoPlayerHandle | null>;
  videoId: string;
}) => {
  const [currentTime, setCurrentTime] = useState(0);

  // Expose methods via ref
  useImperativeHandle(playerRef, () => ({
    seekTo: (seconds: number) => {
      console.log(`Seeking to ${seconds}s`);
      setCurrentTime(seconds);
      toast.success(`Jumped to ${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`);
    },
    getCurrentTime: () => currentTime,
    getDuration: () => 3600, // Example: 1 hour video
  }));

  return (
    <div className="aspect-video w-full rounded-lg bg-gray-900 flex items-center justify-center text-white">
      <div className="text-center">
        <div className="text-2xl font-bold mb-2">Video Player</div>
        <div className="text-sm">Video ID: {videoId}</div>
        <div className="text-sm">Current Time: {Math.floor(currentTime)}s</div>
      </div>
    </div>
  );
};

/**
 * Integrated Lesson Viewer Example
 *
 * Shows how to connect ChatInterface timestamp clicks to video player
 */
export function IntegratedLessonViewerExample() {
  const playerRef = useRef<VideoPlayerHandle>(null);
  const [currentVideoId, setCurrentVideoId] = useState('video_123');
  const [sessionId, setSessionId] = useState('session_abc');

  /**
   * Handle timestamp clicks from chat interface
   *
   * This is the key integration point for Wave 2
   */
  const handleTimestampClick = (seconds: number, videoId: string) => {
    console.log(`Timestamp clicked: ${seconds}s from video ${videoId}`);

    // If clicking timestamp from current video, seek immediately
    if (videoId === currentVideoId) {
      const duration = playerRef.current?.getDuration() || 0;

      // Handle edge cases
      if (seconds > duration) {
        toast.warning('Timestamp is beyond video duration. Seeking to end.');
        playerRef.current?.seekTo(duration);
        return;
      }

      if (seconds < 0) {
        toast.error('Invalid timestamp');
        return;
      }

      // Seek to timestamp
      playerRef.current?.seekTo(seconds);
    } else {
      // ChatInterface already handles showing toast for different videos
      // This else block is for future enhancement: auto-switch videos
      console.log(`Would switch to video ${videoId} and seek to ${seconds}s`);
    }
  };

  /**
   * Handle video changes
   * Call this when user manually switches videos
   */
  const handleVideoChange = (newVideoId: string) => {
    setCurrentVideoId(newVideoId);
    toast.info(`Switched to new video: ${newVideoId}`);
  };

  return (
    <div className="flex h-screen flex-col lg:flex-row gap-4 p-4">
      {/* Video Player Section */}
      <div className="flex-1 flex flex-col gap-4">
        <div className="bg-white rounded-lg p-4 shadow-lg">
          <h2 className="text-xl font-bold mb-4">Video Player</h2>
          <MockVideoPlayer playerRef={playerRef} videoId={currentVideoId} />

          {/* Example: Video switcher */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => handleVideoChange('video_123')}
              className={`px-4 py-2 rounded-lg ${
                currentVideoId === 'video_123'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              Video 1
            </button>
            <button
              onClick={() => handleVideoChange('video_456')}
              className={`px-4 py-2 rounded-lg ${
                currentVideoId === 'video_456'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              Video 2
            </button>
          </div>
        </div>
      </div>

      {/* Chat Interface Section */}
      <div className="flex-1 flex flex-col">
        <div className="bg-white rounded-lg shadow-lg h-full">
          <ChatInterface
            sessionId={sessionId}
            currentVideoId={currentVideoId}
            onTimestampClick={handleTimestampClick}
            onSessionChange={setSessionId}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Integration Checklist for Wave 2:
 *
 * 1. Import ChatInterface with new props
 * 2. Pass currentVideoId to ChatInterface
 * 3. Implement onTimestampClick handler:
 *    - Validate timestamp is within video duration
 *    - Handle edge cases (timestamp > duration, etc.)
 *    - Call video player's seekTo method
 * 4. Update currentVideoId when user switches videos
 * 5. Optional: Implement auto-video-switching for cross-video timestamps
 *
 * Example Usage in Real Component:
 *
 * ```typescript
 * const IntegratedLessonViewer = () => {
 *   const videoPlayerRef = useRef<VideoPlayerHandle>(null);
 *   const [currentVideoId, setCurrentVideoId] = useState<string>();
 *
 *   const handleTimestampClick = (seconds: number, videoId: string) => {
 *     if (videoId === currentVideoId) {
 *       videoPlayerRef.current?.seekTo(seconds);
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       <VideoPlayer ref={videoPlayerRef} ... />
 *       <ChatInterface
 *         currentVideoId={currentVideoId}
 *         onTimestampClick={handleTimestampClick}
 *       />
 *     </div>
 *   );
 * };
 * ```
 */
