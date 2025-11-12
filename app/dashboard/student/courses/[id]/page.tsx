'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import VideoPlayer from '@/components/video/VideoPlayer';
import { CourseSidebar } from '@/components/courses/CourseSidebar';
import { LessonMetadata } from '@/components/courses/LessonMetadata';
import { NavigationControls } from '@/components/courses/NavigationControls';
import { Button } from '@/components/ui/Button';
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
 * StudentCourseViewer - Main student course viewing page
 *
 * Features:
 * - Video playback with analytics
 * - Course navigation sidebar
 * - Progress tracking
 * - Lesson completion
 * - Auto-advance option
 * - Mobile responsive
 */
export default function StudentCourseViewerPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  // Temporary hardcoded student ID (replace with real auth)
  const TEMP_STUDENT_ID = 'temp-student-123';
  const TEMP_CREATOR_ID = 'temp-creator-456';

  // State
  const [courseData, setCourseData] = useState<CourseData | null>(null);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSavingProgress, setIsSavingProgress] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(false);

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

  /**
   * Fetch course data with modules and lessons
   */
  const fetchCourseData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch course with modules
      const courseRes = await fetch(`/api/courses/${courseId}`);
      if (!courseRes.ok) {
        throw new Error('Failed to fetch course');
      }
      const courseJson = await courseRes.json();
      const course = courseJson.data;

      // Fetch lessons for each module
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
        `/api/courses/${courseId}/progress?student_id=${TEMP_STUDENT_ID}`
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
  }, [courseId, TEMP_STUDENT_ID]);

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
            student_id: TEMP_STUDENT_ID,
            video_id: currentLesson.video_id,
            percent_complete: percentComplete,
            watch_time_seconds: watchTime,
            device_type: window.innerWidth < 768 ? 'mobile' : 'desktop',
          }),
        });

        // Refresh progress
        await fetchProgress();
      } catch (err) {
        console.error('Error saving progress:', err);
      }
    },
    [currentLesson, courseId, TEMP_STUDENT_ID, fetchProgress]
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
          student_id: TEMP_STUDENT_ID,
          video_id: currentLesson.video_id,
          percent_complete: 100,
          watch_time_seconds: currentLesson.video.duration_seconds || 0,
          completed: true,
          device_type: window.innerWidth < 768 ? 'mobile' : 'desktop',
        }),
      });

      // Refresh progress
      await fetchProgress();

      // Auto-advance if enabled and there's a next lesson
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
  }, [currentLesson, courseId, TEMP_STUDENT_ID, fetchProgress, autoAdvance, hasNext]);

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

    // Save progress every 10% milestone
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
   * Keyboard shortcuts
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
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
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentLessonIndex, hasPrevious, hasNext]);

  /**
   * Loading state
   */
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

  /**
   * Error state
   */
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

  /**
   * No lessons state
   */
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
        {/* Sidebar */}
        <CourseSidebar
          course={courseData.course}
          modules={courseData.modules}
          currentLessonId={currentLesson?.id || null}
          completedLessonIds={progress?.completed_lesson_ids || []}
          onLessonSelect={handleLessonSelect}
          className="w-80 flex-shrink-0"
        />

        {/* Main Content */}
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
            </div>
          </div>

          {/* Video Player */}
          <div className="bg-black">
            <div className="max-w-7xl mx-auto">
              <VideoPlayer
                video={currentLesson.video}
                studentId={TEMP_STUDENT_ID}
                creatorId={TEMP_CREATOR_ID}
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
      </div>
    </div>
  );
}
