'use client';

import { useState } from 'react';
import { Check, ChevronDown, ChevronRight, Menu, X } from 'lucide-react';
import { Card } from 'frosted-ui';
import { cn } from '@/lib/utils';
import type { Database } from '@/lib/db/types';

type Course = Database['public']['Tables']['courses']['Row'];
type Module = Database['public']['Tables']['course_modules']['Row'];
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
  video: any;
};

interface CourseSidebarProps {
  course: Course;
  modules: (Module & { lessons: Lesson[] })[];
  currentLessonId: string | null;
  completedLessonIds: string[];
  onLessonSelect: (lesson: Lesson) => void;
  className?: string;
}

/**
 * CourseSidebar - Displays course structure with modules and lessons
 *
 * Features:
 * - Collapsible module sections
 * - Highlights current lesson
 * - Shows completion checkmarks
 * - Displays course progress percentage
 * - Mobile responsive (collapsible)
 */
export function CourseSidebar({
  course,
  modules,
  currentLessonId,
  completedLessonIds,
  onLessonSelect,
  className = '',
}: CourseSidebarProps) {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set(modules.map((m) => m.id))
  );
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Calculate progress
  const totalLessons = modules.reduce((sum, mod) => sum + mod.lessons.length, 0);
  const completedCount = completedLessonIds.length;
  const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  const isLessonCompleted = (lessonId: string) => {
    return completedLessonIds.includes(lessonId);
  };

  const isCurrentLesson = (lessonId: string) => {
    return currentLessonId === lessonId;
  };

  const handleLessonClick = (lesson: Lesson) => {
    onLessonSelect(lesson);
    // Close mobile menu on lesson select
    if (window.innerWidth < 768) {
      setIsMobileOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-gray-1 rounded-lg shadow-lg border border-gray-a4"
        aria-label="Toggle course menu"
      >
        {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'bg-gray-1 border-r border-gray-a4 overflow-y-auto',
          // Mobile: slide in from left
          'md:relative md:translate-x-0',
          'fixed inset-y-0 left-0 z-40 w-80 transition-transform duration-300',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full',
          className
        )}
      >
        <div className="sticky top-0 bg-gray-1 border-b border-gray-a4 p-4 z-10">
          {/* Course Title */}
          <h2 className="text-lg font-bold text-gray-12 line-clamp-2 mb-2">
            {course.title}
          </h2>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-gray-11">
              <span>Progress</span>
              <span className="font-medium">{progressPercent}%</span>
            </div>
            <div className="w-full bg-gray-a3 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-purple-9 to-blue-9 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="text-xs text-gray-11">
              {completedCount} of {totalLessons} lessons complete
            </div>
          </div>
        </div>

        {/* Module List */}
        <div className="p-4 space-y-2">
          {modules.map((module, moduleIndex) => {
            const isExpanded = expandedModules.has(module.id);
            const moduleCompletedCount = module.lessons.filter((l) =>
              isLessonCompleted(l.id)
            ).length;
            const moduleProgress =
              module.lessons.length > 0
                ? Math.round((moduleCompletedCount / module.lessons.length) * 100)
                : 0;

            return (
              <div key={module.id} className="border border-gray-a4 rounded-lg overflow-hidden">
                {/* Module Header */}
                <button
                  onClick={() => toggleModule(module.id)}
                  className="w-full flex items-center gap-2 p-3 bg-gray-a2 hover:bg-gray-a3 transition-colors text-left"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-gray-11 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-11 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-11">
                        Module {moduleIndex + 1}
                      </span>
                      {moduleProgress === 100 && (
                        <Check className="h-3 w-3 text-green-9" />
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-gray-12 line-clamp-2">
                      {module.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-gray-a3 rounded-full h-1">
                        <div
                          className="bg-purple-9 h-full rounded-full transition-all"
                          style={{ width: `${moduleProgress}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-11">
                        {moduleCompletedCount}/{module.lessons.length}
                      </span>
                    </div>
                  </div>
                </button>

                {/* Lesson List */}
                {isExpanded && (
                  <div className="border-t border-gray-a4">
                    {module.lessons.map((lesson, lessonIndex) => {
                      const isCompleted = isLessonCompleted(lesson.id);
                      const isCurrent = isCurrentLesson(lesson.id);

                      return (
                        <button
                          key={lesson.id}
                          onClick={() => handleLessonClick(lesson)}
                          className={cn(
                            'w-full flex items-center gap-3 p-3 border-b border-gray-a3 last:border-b-0 text-left transition-colors',
                            isCurrent
                              ? 'bg-blue-a3 border-l-4 border-l-blue-9'
                              : 'hover:bg-gray-a2 border-l-4 border-l-transparent'
                          )}
                        >
                          {/* Completion Indicator */}
                          <div className="flex-shrink-0">
                            {isCompleted ? (
                              <div className="w-6 h-6 rounded-full bg-green-9 flex items-center justify-center">
                                <Check className="h-4 w-4 text-white" />
                              </div>
                            ) : (
                              <div
                                className={cn(
                                  'w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-medium',
                                  isCurrent
                                    ? 'border-blue-9 text-blue-11 bg-gray-1'
                                    : 'border-gray-a6 text-gray-a9'
                                )}
                              >
                                {lessonIndex + 1}
                              </div>
                            )}
                          </div>

                          {/* Lesson Info */}
                          <div className="flex-1 min-w-0">
                            <h4
                              className={cn(
                                'text-sm font-medium line-clamp-2',
                                isCurrent ? 'text-blue-11' : 'text-gray-12'
                              )}
                            >
                              {lesson.title}
                            </h4>
                            {lesson.estimated_duration_minutes && (
                              <p className="text-xs text-gray-11 mt-0.5">
                                {lesson.estimated_duration_minutes} min
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>
    </>
  );
}
