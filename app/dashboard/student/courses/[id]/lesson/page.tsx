'use client';

/**
 * IntegratedLessonViewer Page - Wave 2 Integration
 *
 * This is the main student lesson viewing page that combines:
 * - VideoPlayer with seekTo() control
 * - VideoMetadataPanel with progress display
 * - ChatInterface with clickable timestamp navigation
 *
 * Layout:
 * - Desktop: Top 70% (video + metadata side-by-side) | Bottom 30% (chat)
 * - Mobile: Vertical stack (video → metadata → chat)
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import VideoPlayer, { type VideoPlayerHandle } from '@/components/video/VideoPlayer';
import { VideoMetadataPanel } from '@/components/video/VideoMetadataPanel';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/contexts/AuthContext';
import { supabase } from '@/lib/db/client-browser';
import { toast } from '@/lib/utils/toast';
import { formatDuration } from '@/lib/utils/format';
import type { Database } from '@/lib/db/types';

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

export default function IntegratedLessonViewerPage() {
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
    } catch (err) {
      console.error('[LessonViewer] Failed to fetch video:', err);
      setError(err instanceof Error ? err.message : 'Failed to load video');
    }
  }, [videoId]);

  /**
   * Fetch or create chat session for this video
   */
  const fetchOrCreateChatSession = useCallback(async () => {
    if (!videoId || !studentId || !creatorId) return;

    try {
      // Try to get existing session for this video
      const response = await fetch(
        `/api/chat/sessions?student_id=${studentId}&video_id=${videoId}`
      );
      const result = await response.json();

      let sessionId = result.data?.sessions?.[0]?.id;

      // Create new session if none exists
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
    } catch (err) {
      console.error('[LessonViewer] Failed to fetch/create chat session:', err);
      // Non-critical error, chat will just be disabled
    }
  }, [videoId, studentId, creatorId, video?.title, courseId]);

  /**
   * Fetch or create watch session
   */
  const fetchOrCreateWatchSession = useCallback(async () => {
    if (!videoId || !studentId || !creatorId) return;

    try {
      // Try to get most recent watch session for this video
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

      // Create new watch session if none exists or last one ended
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
          // Fetch the newly created session
          const { data: newSession } = await supabase
            .from('video_watch_sessions')
            .select('*')
            .eq('id', createResult.session_id)
            .single();

          currentSession = newSession ? (newSession as WatchSession) : null;
        }
      }

      setWatchSession(currentSession);

      // Set progress data for metadata panel
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
   * Save progress to database (debounced)
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
          // Update local progress state
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
   * Handle video progress updates (debounced to save every 10 seconds)
   */
  const handleProgressUpdate = useCallback(
    (currentTime: number) => {
      // Clear existing timeout
      if (progressSaveTimeoutRef.current) {
        clearTimeout(progressSaveTimeoutRef.current);
      }

      // Set new timeout to save progress after 10 seconds
      progressSaveTimeoutRef.current = setTimeout(() => {
        saveProgress(currentTime);
      }, 10000);
    },
    [saveProgress]
  );

  /**
   * Handle timestamp clicks from chat interface
   */
  const handleTimestampClick = useCallback(
    (seconds: number, clickedVideoId: string) => {
      // Validate that timestamp is for current video
      if (clickedVideoId !== videoId) {
        // ChatInterface already shows warning toast
        return;
      }

      // Validate timestamp is within video duration
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

      // Seek to timestamp
      videoPlayerRef.current?.seekTo(seconds);
      toast.success(`Jumped to ${formatDuration(seconds)}`);
    },
    [videoId, video?.duration_seconds]
  );

  /**
   * Auto-resume from last watched position
   */
  useEffect(() => {
    if (!watchSession || !videoPlayerRef.current) return undefined;

    const lastPosition = watchSession.watch_time_seconds;
    const percentComplete = watchSession.percent_complete;

    // Only auto-resume if watched more than 30 seconds and not completed
    if (lastPosition > 30 && percentComplete < 90) {
      const resumeTimer = setTimeout(() => {
        videoPlayerRef.current?.seekTo(lastPosition);
        toast.info(`Resumed from ${formatDuration(lastPosition)}`);
      }, 1000); // Small delay to let player initialize

      return () => clearTimeout(resumeTimer);
    }

    return undefined;
  }, [watchSession]);

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
      <div className="min-h-screen flex items-center justify-center bg-gray-1">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-9 mx-auto mb-4" />
          <p className="text-gray-11">Loading lesson...</p>
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
        <div className="flex items-center gap-3">
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
      </div>

      {/* Main Content: Top 70% + Bottom 30% Split */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Top Section: Video + Metadata (70%) */}
        <div className="flex-[7] min-h-0 flex flex-col lg:flex-row gap-4 p-4 bg-gray-2">
          {/* Video Player */}
          <div className="flex-1 min-w-0 flex flex-col gap-4">
            <VideoPlayer
              ref={videoPlayerRef}
              video={video}
              studentId={studentId}
              creatorId={creatorId}
              courseId={courseId}
              onProgress={handleProgressUpdate}
              enableAnalytics={true}
            />

            {/* Video Metadata Panel (below video on mobile, beside on desktop) */}
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

        {/* Bottom Section: Chat Interface (30%) */}
        <div className="flex-[3] min-h-0 border-t border-gray-6 bg-white">
          {chatSessionId ? (
            <ChatInterface
              sessionId={chatSessionId}
              currentVideoId={videoId || undefined}
              onTimestampClick={handleTimestampClick}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-10">
              <p>Loading chat...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
