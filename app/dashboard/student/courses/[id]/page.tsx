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
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { useAuth } from '@/lib/contexts/AuthContext';
import type { Database } from '@/lib/db/types';

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading course...</p>
        </div>
      </div>
    );
  }

  if (error || !courseData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-md">
          <p className="text-red-600 mb-4">{error || 'Course not found'}</p>
          <Button onClick={() => router.push('/dashboard/student/courses')}>
            Back to Courses
          </Button>
        </div>
      </div>
    );
  }

  if (allLessons.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-md">
          <p className="text-gray-600 mb-4">This course has no lessons yet.</p>
          <Button onClick={() => router.push('/dashboard/student/courses')}>
            Back to Courses
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
        <div className="flex-1 flex overflow-hidden">
          {/* Video and Lesson Content */}
          <div className="flex-1 flex flex-col overflow-y-auto">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="max-w-7xl mx-auto flex items-center gap-4">
                <Button
                  onClick={() => router.push('/dashboard/student/courses')}
                  variant="ghost"
                  size="sm"
                  icon={<ArrowLeft className="h-4 w-4" />}
                  iconPosition="left"
                >
                  Back to Courses
                </Button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-500 truncate">
                    {courseData.course.title}
                  </p>
                  <p className="text-xs text-gray-400">
                    Lesson {currentLessonIndex + 1} of {allLessons.length}
                  </p>
                </div>

                {/* Keyboard shortcuts help button */}
                <button
                  onClick={() => setShowShortcutsHelp(true)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Keyboard shortcuts (Press ?)"
                >
                  <HelpCircle className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Resume Banner (placeholder for future) */}
            {showResumeBanner && resumePosition !== null && (
              <div className="bg-blue-50 border-b border-blue-200 p-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                  <span className="text-sm text-blue-900">
                    Resume from {Math.floor(resumePosition / 60)}:{String(Math.floor(resumePosition % 60)).padStart(2, '0')}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowResumeBanner(false)}
                    >
                      Resume
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowResumeBanner(false)}
                    >
                      Start Over
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Video Player */}
            {currentLesson && (
              <>
                <div className="bg-black">
                  <div className="max-w-7xl mx-auto">
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
                </div>

                {/* Lesson Metadata */}
                <div className="flex-1 overflow-y-auto">
                  <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                    <LessonMetadata
                      title={currentLesson.title}
                      description={currentLesson.description}
                      estimatedDuration={currentLesson.estimated_duration_minutes}
                      metadata={currentLesson.metadata}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Navigation Controls */}
            <NavigationControls
              hasPrevious={hasPrevious}
              hasNext={hasNext}
              isCompleted={isCurrentLessonCompleted}
              isLoading={isSavingProgress}
              autoAdvance={autoAdvance}
              onPrevious={goToPreviousLesson}
              onNext={goToNextLesson}
              onMarkComplete={markLessonComplete}
              onAutoAdvanceToggle={setAutoAdvance}
              className="sticky bottom-0"
            />
          </div>

          {/* Chat Panel (Collapsible) */}
          {isChatOpen && (
            <div className="w-96 border-l border-gray-200 flex flex-col h-full bg-white">
              <ChatInterface
                sessionId={undefined}
                currentVideoId={currentLesson?.video_id}
                className="h-full"
              />
            </div>
          )}

          {/* Chat Toggle Button */}
          <button
            onClick={toggleChat}
            className="fixed right-4 top-20 z-10 p-3 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 transition-colors"
            title={isChatOpen ? 'Hide chat (Press C)' : 'Show chat (Press C)'}
          >
            {isChatOpen ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <MessageSquare className="h-5 w-5" />
            )}
          </button>
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
