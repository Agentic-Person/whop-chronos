'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, MessageSquare, ChevronRight, HelpCircle } from 'lucide-react';
import VideoPlayer from '@/components/video/VideoPlayer';
import { CourseSidebar } from '@/components/courses/CourseSidebar';
import { LessonMetadata } from '@/components/courses/LessonMetadata';
import { NavigationControls } from '@/components/courses/NavigationControls';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { CompletionModal } from '@/components/courses/CompletionModal';
import { KeyboardShortcutsHelp } from '@/components/courses/KeyboardShortcutsHelp';
import { toast } from 'sonner';
import { useAuth } from '@/lib/contexts/AuthContext';
import type { Database } from '@/lib/db/types';
import { Button, Card, Text } from 'frosted-ui';

type Course = Database['public']['Tables']['courses']['Row'];
type Module = Database['public']['Tables']['course_modules']['Row'];
type Video = Database['public']['Tables']['videos']['Row'];

type Lesson = {
  id: string;
  module_id: string;
  video_id: string;
  title: string;
  description: string | null;
  lesson_order: number;
  is_required: boolean;
  estimated_duration_minutes: number | null;
  metadata: any;
  created_at: string;
  updated_at: string;
  video: Video;
};

type ModuleWithLessons = Module & {
  lessons: Lesson[];
};

interface CourseData {
  course: Course;
  modules: ModuleWithLessons[];
}

interface ProgressData {
  completed_lesson_ids: string[];
  watch_sessions: any[];
  course_progress_percent: number;
}

/**
 * StudentCourseViewer - Enhanced student course viewing page
 *
 * Features:
 * - Video playback with analytics
 * - Course navigation sidebar
 * - Progress tracking
 * - Lesson completion
 * - Auto-advance option
 * - Chat integration (collapsible)
 * - Completion celebration modal
 * - Keyboard shortcuts
 * - Auto-resume (placeholder for future)
 * - Mobile responsive
 */
export default function StudentCourseViewerPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params['id'] as string;
  const { userId: studentId, creatorId, isAuthenticated } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // State
  const [courseData, setCourseData] = useState<CourseData | null>(null);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSavingProgress, setIsSavingProgress] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(false);

  // Chat and UI state
  const [isChatOpen, setIsChatOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('course-chat-open') !== 'false';
    }
    return true;
  });
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [resumePosition] = useState<number | null>(null);
  const [showResumeBanner, setShowResumeBanner] = useState(false);

  // Flatten lessons from all modules
  const allLessons: Lesson[] = courseData
    ? courseData.modules.flatMap((module) => module.lessons)
    : [];

  const currentLesson = allLessons[currentLessonIndex] || null;
  const hasPrevious = currentLessonIndex > 0;
  const hasNext = currentLessonIndex < allLessons.length - 1;
  const isCurrentLessonCompleted = progress
    ? progress.completed_lesson_ids.includes(currentLesson?.id || '')
    : false;

  // Check if all lessons are completed
  const allLessonsCompleted =
    allLessons.length > 0 &&
    progress &&
    allLessons.every((lesson) =>
      progress.completed_lesson_ids.includes(lesson.id)
    );

  /**
   * Fetch course data with modules and lessons
   */
  const fetchCourseData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const courseRes = await fetch(`/api/courses/${courseId}`);
      if (!courseRes.ok) {
        throw new Error('Failed to fetch course');
      }
      const courseJson = await courseRes.json();
      const course = courseJson.data;

      const modulesWithLessons: ModuleWithLessons[] = [];
      for (const module of course.course_modules || []) {
        const lessonsRes = await fetch(`/api/modules/${module.id}/lessons`);
        if (!lessonsRes.ok) {
          console.error(`Failed to fetch lessons for module ${module.id}`);
          continue;
        }
        const lessonsJson = await lessonsRes.json();
        modulesWithLessons.push({
          ...module,
          lessons: lessonsJson.data.lessons || [],
        });
      }

      setCourseData({
        course,
        modules: modulesWithLessons,
      });
    } catch (err) {
      console.error('Error fetching course data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load course');
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  /**
   * Fetch student progress
   */
  const fetchProgress = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/courses/${courseId}/progress?student_id=${studentId}`
      );
      if (!res.ok) {
        console.error('Failed to fetch progress');
        return;
      }
      const json = await res.json();
      setProgress(json.data);
    } catch (err) {
      console.error('Error fetching progress:', err);
    }
  }, [courseId, studentId]);

  /**
   * Save watch progress
   */
  const saveProgress = useCallback(
    async (percentComplete: number, watchTime: number) => {
      if (!currentLesson) return;

      try {
        await fetch(`/api/courses/${courseId}/progress`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            student_id: studentId,
            video_id: currentLesson.video_id,
            percent_complete: percentComplete,
            watch_time_seconds: watchTime,
            device_type: window.innerWidth < 768 ? 'mobile' : 'desktop',
          }),
        });

        await fetchProgress();
      } catch (err) {
        console.error('Error saving progress:', err);
      }
    },
    [currentLesson, courseId, studentId, fetchProgress]
  );

  /**
   * Mark lesson as complete
   */
  const markLessonComplete = useCallback(async () => {
    if (!currentLesson) return;

    setIsSavingProgress(true);
    try {
      await fetch(`/api/courses/${courseId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          video_id: currentLesson.video_id,
          percent_complete: 100,
          watch_time_seconds: currentLesson.video.duration_seconds || 0,
          completed: true,
          device_type: window.innerWidth < 768 ? 'mobile' : 'desktop',
        }),
      });

      await fetchProgress();

      if (autoAdvance && hasNext) {
        setTimeout(() => {
          goToNextLesson();
        }, 1000);
      }
    } catch (err) {
      console.error('Error marking lesson complete:', err);
    } finally {
      setIsSavingProgress(false);
    }
  }, [currentLesson, courseId, studentId, fetchProgress, autoAdvance, hasNext]);

  /**
   * Toggle chat panel
   */
  const toggleChat = () => {
    const newState = !isChatOpen;
    setIsChatOpen(newState);
    localStorage.setItem('course-chat-open', String(newState));
  };

  /**
   * Handle certificate download
   */
  const handleDownloadCertificate = () => {
    toast.success('Certificate download started!');
    console.log('Download certificate for course:', courseId);
  };

  /**
   * Handle share achievement
   */
  const handleShareAchievement = () => {
    const shareText = `I just completed "${courseData?.course.title}" on Chronos!`;
    navigator.clipboard.writeText(shareText);
    toast.success('Achievement copied to clipboard!');
  };

  /**
   * Handle start next course
   */
  const handleStartNextCourse = () => {
    router.push('/dashboard/student/courses');
  };

  /**
   * Navigation handlers
   */
  const goToPreviousLesson = () => {
    if (hasPrevious) {
      setCurrentLessonIndex(currentLessonIndex - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToNextLesson = () => {
    if (hasNext) {
      setCurrentLessonIndex(currentLessonIndex + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleLessonSelect = (lesson: Lesson) => {
    const index = allLessons.findIndex((l) => l.id === lesson.id);
    if (index !== -1) {
      setCurrentLessonIndex(index);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  /**
   * Video player callbacks
   */
  const handleVideoProgress = (currentTime: number) => {
    if (!currentLesson?.video.duration_seconds) return;

    const percentComplete = Math.min(
      Math.round((currentTime / currentLesson.video.duration_seconds) * 100),
      100
    );

    if (percentComplete % 10 === 0) {
      saveProgress(percentComplete, Math.floor(currentTime));
    }
  };

  const handleVideoComplete = () => {
    markLessonComplete();
  };

  /**
   * Initial data fetch
   */
  useEffect(() => {
    fetchCourseData();
    fetchProgress();
  }, [fetchCourseData, fetchProgress]);

  /**
   * Check for course completion and show celebration
   */
  useEffect(() => {
    if (allLessonsCompleted && courseData && !showCompletionModal) {
      const hasShownCelebration = localStorage.getItem(
        `course-${courseId}-celebrated`
      );
      if (!hasShownCelebration) {
        setShowCompletionModal(true);
        localStorage.setItem(`course-${courseId}-celebrated`, 'true');
      }
    }
  }, [allLessonsCompleted, courseId, courseData, showCompletionModal]);

  /**
   * Enhanced keyboard shortcuts
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          goToPreviousLesson();
          break;
        case 'ArrowRight':
          e.preventDefault();
          goToNextLesson();
          break;
        case 'c':
        case 'C':
          e.preventDefault();
          toggleChat();
          break;
        case 'Escape':
          e.preventDefault();
          setShowCompletionModal(false);
          setShowShortcutsHelp(false);
          break;
        case '?':
          e.preventDefault();
          setShowShortcutsHelp(true);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentLessonIndex, hasPrevious, hasNext, isChatOpen]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-1">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <Text className="text-gray-11">Loading course...</Text>
        </div>
      </div>
    );
  }

  if (error || !courseData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-1 p-4">
        <div className="text-center max-w-md">
          <Text className="text-red-11 mb-4">{error || 'Course not found'}</Text>
          <Button onClick={() => router.push('/dashboard/student/courses')}>
            Back to Courses
          </Button>
        </div>
      </div>
    );
  }

  if (allLessons.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-1 p-4">
        <div className="text-center max-w-md">
          <Text className="text-gray-11 mb-4">This course has no lessons yet.</Text>
          <Button onClick={() => router.push('/dashboard/student/courses')}>
            Back to Courses
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-1">
      <div className="flex h-screen overflow-hidden">
        {/* Course Sidebar */}
        <CourseSidebar
          course={courseData.course}
          modules={courseData.modules}
          currentLessonId={currentLesson?.id || null}
          completedLessonIds={progress?.completed_lesson_ids || []}
          onLessonSelect={handleLessonSelect}
          className="w-80 flex-shrink-0"
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Video Player - Full Width */}
          {currentLesson && (
            <div className="bg-black flex-shrink-0">
              <VideoPlayer
                video={currentLesson.video}
                studentId={studentId}
                creatorId={creatorId}
                courseId={courseId}
                moduleId={currentLesson.module_id}
                onProgress={handleVideoProgress}
                onComplete={handleVideoComplete}
                enableAnalytics={true}
              />
            </div>
          )}

          {/* Video Title */}
          {currentLesson && (
            <div className="flex-shrink-0 p-4 border-b border-gray-a4 bg-gray-2">
              <h2 className="text-lg font-semibold text-gray-12">
                {currentLesson.title}
              </h2>
              {currentLesson.description && (
                <p className="text-sm text-gray-11 mt-1">{currentLesson.description}</p>
              )}
            </div>
          )}

          {/* AI Chat Section - Below Video */}
          <div className="flex-1 flex flex-col min-h-0">
            <ChatInterface
              sessionId={undefined}
              currentVideoId={currentLesson?.video_id}
              creatorId={creatorId || ''}
              studentId={studentId || ''}
              className="flex-1"
            />
          </div>
        </div>
      </div>

      {/* Completion Modal */}
      {showCompletionModal && (
        <CompletionModal
          courseTitle={courseData.course.title}
          courseThumbnail={courseData.course.thumbnail_url || undefined}
          completionDate={new Date()}
          onDownloadCertificate={handleDownloadCertificate}
          onShareAchievement={handleShareAchievement}
          onStartNextCourse={handleStartNextCourse}
          onClose={() => setShowCompletionModal(false)}
        />
      )}

      {/* Keyboard Shortcuts Help */}
      {showShortcutsHelp && (
        <KeyboardShortcutsHelp onClose={() => setShowShortcutsHelp(false)} />
      )}
    </div>
  );
}
