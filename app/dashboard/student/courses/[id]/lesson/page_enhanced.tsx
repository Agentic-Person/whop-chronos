'use client';

/**
 * Enhanced Lesson Viewer Page
 *
 * Features:
 * - Error boundaries for graceful error handling
 * - Loading skeletons for progressive loading
 * - Notes feature with auto-save and export
 * - Keyboard shortcuts for video control
 * - Timestamp navigation from chat
 *
 * Layout:
 * - Desktop: Top 60% (video + metadata) | Bottom 40% (chat + notes)
 * - Mobile: Vertical stack
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import VideoPlayer, { type VideoPlayerHandle } from '@/components/video/VideoPlayer';
import { VideoMetadataPanel } from '@/components/video/VideoMetadataPanel';
import { ChatInterface } from '@/components/chat';
import { LessonNotes } from '@/components/courses/LessonNotes';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/contexts/AuthContext';
import { supabase } from '@/lib/db/client-browser';
import { toast } from '@/lib/utils/toast';
import { formatDuration } from '@/lib/utils/format';
import type { Database } from '@/lib/db/types';
import {
  ErrorBoundary,
  VideoPlayerFallback,
  ChatFallback,
  VideoPlayerSkeleton,
  ChatInterfaceSkeleton,
  MetadataPanelSkeleton,
} from '@/components/common';

type Video = Database['public']['Tables']['videos']['Row'];

interface WatchSession {
  id: string;
  video_id: string;
  student_id: string;
  session_start: string;
  session_end: string | null;
  watch_time_seconds: number;
  percent_complete: number;
  completed: boolean;
  device_type: string | null;
  referrer_type: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface ProgressData {
  percent_complete: number;
  watch_time_seconds: number;
  last_watched: string;
}

export default function EnhancedLessonViewerPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userId: studentId, creatorId } = useAuth();

  const courseId = params['id'] as string;
  const videoId = searchParams.get('videoId');

  // Refs
  const videoPlayerRef = useRef<VideoPlayerHandle>(null);
  const progressSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // State
  const [video, setVideo] = useState<Video | null>(null);
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const [watchSession, setWatchSession] = useState<WatchSession | null>(null);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [isChatLoading, setIsChatLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch video details
   */
  const fetchVideo = useCallback(async () => {
    if (!videoId) return;

    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('id', videoId)
        .eq('is_deleted', false)
        .single();

      if (error || !data) {
        throw new Error('Video not found');
      }

      setVideo(data);
      setIsVideoLoading(false);
    } catch (err) {
      console.error('[LessonViewer] Failed to fetch video:', err);
      setError(err instanceof Error ? err.message : 'Failed to load video');
      setIsVideoLoading(false);
    }
  }, [videoId]);

  /**
   * Fetch or create chat session
   */
  const fetchOrCreateChatSession = useCallback(async () => {
    if (!videoId || !studentId || !creatorId) return;

    try {
      const response = await fetch(
        `/api/chat/sessions?student_id=${studentId}&video_id=${videoId}`
      );
      const result = await response.json();

      let sessionId = result.data?.sessions?.[0]?.id;

      if (!sessionId) {
        const createResponse = await fetch('/api/chat/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            student_id: studentId,
            creator_id: creatorId,
            title: video?.title ? `Chat about ${video.title}` : undefined,
            context_video_ids: [videoId],
            metadata: {
              video_id: videoId,
              course_id: courseId,
            },
          }),
        });

        const createResult = await createResponse.json();
        sessionId = createResult.data?.session?.id || createResult.session?.id;
      }

      setChatSessionId(sessionId || null);
      setIsChatLoading(false);
    } catch (err) {
      console.error('[LessonViewer] Failed to fetch/create chat session:', err);
      setIsChatLoading(false);
    }
  }, [videoId, studentId, creatorId, video?.title, courseId]);

  /**
   * Fetch or create watch session
   */
  const fetchOrCreateWatchSession = useCallback(async () => {
    if (!videoId || !studentId || !creatorId) return;

    try {
      const { data: sessions, error: fetchError } = await supabase
        .from('video_watch_sessions')
        .select('*')
        .eq('video_id', videoId)
        .eq('student_id', studentId)
        .order('session_start', { ascending: false })
        .limit(1);

      if (fetchError) {
        console.error('[LessonViewer] Failed to fetch watch session:', fetchError);
      }

      let currentSession: WatchSession | null = sessions?.[0] ? (sessions[0] as WatchSession) : null;

      if (!currentSession || currentSession.session_end) {
        const createResponse = await fetch('/api/analytics/watch-sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            video_id: videoId,
            student_id: studentId,
            creator_id: creatorId,
            device_type: window.innerWidth < 768 ? 'mobile' : 'desktop',
            referrer_type: 'course_page',
          }),
        });

        const createResult = await createResponse.json();

        if (createResult.success && createResult.session_id) {
          const { data: newSession } = await supabase
            .from('video_watch_sessions')
            .select('*')
            .eq('id', createResult.session_id)
            .single();

          currentSession = newSession ? (newSession as WatchSession) : null;
        }
      }

      setWatchSession(currentSession);

      if (currentSession) {
        setProgress({
          percent_complete: currentSession.percent_complete,
          watch_time_seconds: currentSession.watch_time_seconds,
          last_watched: currentSession.updated_at,
        });
      }
    } catch (err) {
      console.error('[LessonViewer] Failed to fetch/create watch session:', err);
    }
  }, [videoId, studentId, creatorId]);

  /**
   * Save progress (debounced)
   */
  const saveProgress = useCallback(
    async (currentTime: number) => {
      if (!watchSession || !video?.duration_seconds) return;

      const percentComplete = Math.min(
        Math.round((currentTime / video.duration_seconds) * 100),
        100
      );

      try {
        const response = await fetch(
          `/api/analytics/watch-sessions/${watchSession.id}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              percent_complete: percentComplete,
              watch_time_seconds: Math.floor(currentTime),
              current_time_seconds: currentTime,
              completed: percentComplete >= 90,
            }),
          }
        );

        if (response.ok) {
          setProgress({
            percent_complete: percentComplete,
            watch_time_seconds: Math.floor(currentTime),
            last_watched: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.error('[LessonViewer] Failed to save progress:', err);
      }
    },
    [watchSession, video?.duration_seconds]
  );

  /**
   * Handle progress updates (debounced)
   */
  const handleProgressUpdate = useCallback(
    (currentTime: number) => {
      if (progressSaveTimeoutRef.current) {
        clearTimeout(progressSaveTimeoutRef.current);
      }

      progressSaveTimeoutRef.current = setTimeout(() => {
        saveProgress(currentTime);
      }, 10000);
    },
    [saveProgress]
  );

  /**
   * Handle timestamp clicks from chat
   */
  const handleTimestampClick = useCallback(
    (seconds: number, clickedVideoId: string) => {
      if (clickedVideoId !== videoId) {
        return;
      }

      const duration = videoPlayerRef.current?.getDuration() || video?.duration_seconds || 0;

      if (seconds > duration) {
        toast.warning(
          `Timestamp (${formatDuration(seconds)}) is beyond video duration. Seeking to end.`
        );
        videoPlayerRef.current?.seekTo(duration);
        return;
      }

      if (seconds < 0) {
        toast.error('Invalid timestamp');
        return;
      }

      videoPlayerRef.current?.seekTo(seconds);
      toast.success(`Jumped to ${formatDuration(seconds)}`);

      // Scroll video into view
      const videoElement = document.getElementById('video-player-container');
      if (videoElement) {
        videoElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },
    [videoId, video?.duration_seconds]
  );

  /**
   * Auto-resume from last position
   */
  useEffect(() => {
    if (!watchSession || !videoPlayerRef.current) return undefined;

    const lastPosition = watchSession.watch_time_seconds;
    const percentComplete = watchSession.percent_complete;

    if (lastPosition > 30 && percentComplete < 90) {
      const resumeTimer = setTimeout(() => {
        videoPlayerRef.current?.seekTo(lastPosition);
        toast.info(`Resumed from ${formatDuration(lastPosition)}`);
      }, 1000);

      return () => clearTimeout(resumeTimer);
    }

    return undefined;
  }, [watchSession]);

  /**
   * Keyboard shortcuts for video control
   */
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore if typing in input or textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const player = videoPlayerRef.current;
      if (!player) return;

      const duration = player.getDuration();

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          // Rewind 10 seconds
          if (duration > 0) {
            const newTime = Math.max(0, (duration * (progress?.percent_complete || 0) / 100) - 10);
            player.seekTo(newTime);
            toast.info('Rewound 10 seconds');
          }
          break;

        case 'ArrowRight':
          e.preventDefault();
          // Forward 10 seconds
          if (duration > 0) {
            const newTime = Math.min(duration, (duration * (progress?.percent_complete || 0) / 100) + 10);
            player.seekTo(newTime);
            toast.info('Forwarded 10 seconds');
          }
          break;

        default:
          // 0-9: Jump to percentage
          if (e.key >= '0' && e.key <= '9') {
            const percent = parseInt(e.key) * 10;
            const seekTime = (duration * percent) / 100;
            player.seekTo(seekTime);
            toast.info(`Jumped to ${percent}%`);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [progress]);

  /**
   * Initial data fetch
   */
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      if (!videoId) {
        setError('No video ID provided');
        setIsLoading(false);
        return;
      }

      await fetchVideo();
      await fetchOrCreateWatchSession();
      await fetchOrCreateChatSession();

      setIsLoading(false);
    };

    loadData();
  }, [videoId, fetchVideo, fetchOrCreateWatchSession, fetchOrCreateChatSession]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (progressSaveTimeoutRef.current) {
        clearTimeout(progressSaveTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Loading state
   */
  if (isLoading) {
    return (
      <div className="h-screen flex flex-col bg-gray-1">
        <div className="bg-white border-b border-gray-6 px-4 py-3">
          <Button
            onClick={() => router.push(`/dashboard/student/courses/${courseId}`)}
            variant="ghost"
            size="sm"
            icon={<ArrowLeft className="h-4 w-4" />}
            iconPosition="left"
          >
            Back to Course
          </Button>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-[6] flex flex-col lg:flex-row gap-4 p-4 bg-gray-2">
            <div className="flex-1">
              <VideoPlayerSkeleton />
            </div>
            <div className="hidden lg:block lg:w-80">
              <MetadataPanelSkeleton />
            </div>
          </div>

          <div className="flex-[4] border-t border-gray-6 bg-white">
            <ChatInterfaceSkeleton />
          </div>
        </div>
      </div>
    );
  }

  /**
   * Error state
   */
  if (error || !video) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-1 p-4">
        <div className="text-center max-w-md">
          <p className="text-red-9 mb-4">{error || 'Video not found'}</p>
          <Button onClick={() => router.push(`/dashboard/student/courses/${courseId}`)}>
            Back to Course
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-1">
      {/* Header */}
      <div className="bg-white border-b border-gray-6 px-4 py-3 flex-shrink-0">
        <Button
          onClick={() => router.push(`/dashboard/student/courses/${courseId}`)}
          variant="ghost"
          size="sm"
          icon={<ArrowLeft className="h-4 w-4" />}
          iconPosition="left"
        >
          Back to Course
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Top Section: Video + Metadata (60%) */}
        <div className="flex-[6] min-h-0 flex flex-col lg:flex-row gap-4 p-4 bg-gray-2">
          {/* Video Player with Error Boundary */}
          <div className="flex-1 min-w-0 flex flex-col gap-4">
            <div id="video-player-container">
              <ErrorBoundary
                fallback={<VideoPlayerFallback />}
                componentName="VideoPlayer"
              >
                {isVideoLoading ? (
                  <VideoPlayerSkeleton />
                ) : (
                  <VideoPlayer
                    ref={videoPlayerRef}
                    video={video}
                    studentId={studentId}
                    creatorId={creatorId}
                    courseId={courseId}
                    onProgress={handleProgressUpdate}
                    enableAnalytics={true}
                  />
                )}
              </ErrorBoundary>
            </div>

            {/* Video Metadata Panel (below video on mobile) */}
            <div className="lg:hidden">
              <VideoMetadataPanel
                video={{
                  id: video.id,
                  title: video.title,
                  duration_seconds: video.duration_seconds || 0,
                }}
                progress={progress || undefined}
              />
            </div>
          </div>

          {/* Metadata Panel (side panel on desktop) */}
          <div className="hidden lg:block lg:w-80 flex-shrink-0">
            <div className="bg-white rounded-lg p-4 border border-gray-6 h-full overflow-y-auto">
              <VideoMetadataPanel
                video={{
                  id: video.id,
                  title: video.title,
                  duration_seconds: video.duration_seconds || 0,
                }}
                progress={progress || undefined}
              />
            </div>
          </div>
        </div>

        {/* Bottom Section: Chat + Notes (40%) */}
        <div className="flex-[4] min-h-0 border-t border-gray-6 bg-white flex flex-col lg:flex-row">
          {/* Chat Interface with Error Boundary */}
          <div className="flex-1 min-h-0 lg:border-r lg:border-gray-6">
            <ErrorBoundary fallback={<ChatFallback />} componentName="ChatInterface">
              {isChatLoading ? (
                <ChatInterfaceSkeleton />
              ) : chatSessionId ? (
                <ChatInterface
                  sessionId={chatSessionId}
                  currentVideoId={videoId || undefined}
                  onTimestampClick={handleTimestampClick}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-10">
                  <p>Chat unavailable</p>
                </div>
              )}
            </ErrorBoundary>
          </div>

          {/* Notes Panel (collapsible on mobile) */}
          {studentId && videoId && (
            <div className="w-full lg:w-96 flex-shrink-0 border-t lg:border-t-0 border-gray-6">
              <ErrorBoundary componentName="LessonNotes">
                <LessonNotes
                  lessonId={videoId}
                  studentId={studentId}
                  videoTitle={video.title}
                  className="h-full"
                />
              </ErrorBoundary>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
