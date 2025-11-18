"use client";

import { useState, useEffect } from "react";
import { Video, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoContextSelectorProps {
  studentId: string;
  creatorId: string;
  selectedCourseId?: string;
  selectedVideoId?: string;
  onContextChange: (courseId: string | null, videoId: string | null) => void;
}

interface Video {
  id: string;
  title: string;
}

interface Module {
  id: string;
  lessons: {
    id: string;
    video_id: string;
    title: string;
  }[];
}

interface Course {
  id: string;
  title: string;
  modules: Module[];
}

/**
 * VideoContextSelector
 *
 * Dropdown selector for chat context - allows students to focus chat on specific videos
 */
export function VideoContextSelector({
  studentId: _studentId,
  creatorId,
  selectedCourseId,
  selectedVideoId,
  onContextChange,
}: VideoContextSelectorProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch courses with modules and videos
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/courses?creator_id=${creatorId}`);
        if (!response.ok) {
          console.error("Failed to fetch courses");
          return;
        }
        const data = await response.json();

        // Fetch modules for each course
        const coursesWithModules = await Promise.all(
          (data.data?.courses || []).map(async (course: any) => {
            try {
              const modulesRes = await fetch(`/api/courses/${course.id}/modules`);
              if (!modulesRes.ok) return { ...course, modules: [] };
              const modulesData = await modulesRes.json();
              return {
                ...course,
                modules: modulesData.data?.modules || [],
              };
            } catch (err) {
              console.error(`Failed to fetch modules for course ${course.id}:`, err);
              return { ...course, modules: [] };
            }
          })
        );

        setCourses(coursesWithModules);
      } catch (error) {
        console.error("Failed to fetch courses:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (creatorId) {
      fetchCourses();
    }
  }, [creatorId]);

  // Get display text for selected context
  const getSelectedText = () => {
    if (!selectedVideoId && !selectedCourseId) {
      return "All Videos";
    }

    if (selectedVideoId) {
      // Find the video title
      for (const course of courses) {
        for (const module of course.modules || []) {
          const lesson = module.lessons?.find((l) => l.video_id === selectedVideoId);
          if (lesson) {
            return lesson.title;
          }
        }
      }
    }

    if (selectedCourseId) {
      const course = courses.find((c) => c.id === selectedCourseId);
      return course ? course.title : "All Videos";
    }

    return "All Videos";
  };

  const handleSelect = (courseId: string | null, videoId: string | null) => {
    onContextChange(courseId, videoId);
    setIsOpen(false);

    // Persist selection in session storage
    if (videoId) {
      sessionStorage.setItem("chat_context_video_id", videoId);
      sessionStorage.setItem("chat_context_course_id", courseId || "");
    } else if (courseId) {
      sessionStorage.setItem("chat_context_course_id", courseId);
      sessionStorage.removeItem("chat_context_video_id");
    } else {
      sessionStorage.removeItem("chat_context_video_id");
      sessionStorage.removeItem("chat_context_course_id");
    }
  };

  const isSelected = (courseId: string | null, videoId: string | null) => {
    if (!selectedVideoId && !selectedCourseId && !courseId && !videoId) {
      return true; // "All Videos" selected
    }
    if (videoId && selectedVideoId === videoId) {
      return true;
    }
    if (courseId && !videoId && selectedCourseId === courseId && !selectedVideoId) {
      return true;
    }
    return false;
  };

  return (
    <div className="relative">
      {/* Dropdown button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition-colors hover:border-purple-500 hover:bg-gray-50",
          isOpen && "border-purple-500 ring-2 ring-purple-500/20"
        )}
        aria-label="Select video context"
      >
        <Video className="h-4 w-4 text-gray-500" />
        <span className="text-gray-900">{getSelectedText()}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-gray-500 transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute left-0 top-full z-20 mt-2 w-72 rounded-lg border border-gray-200 bg-white shadow-lg">
            <div className="max-h-96 overflow-y-auto p-2">
              {isLoading ? (
                <div className="py-8 text-center text-sm text-gray-500">
                  Loading courses...
                </div>
              ) : (
                <>
                  {/* All Videos option */}
                  <button
                    onClick={() => handleSelect(null, null)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-gray-100",
                      isSelected(null, null) && "bg-purple-50"
                    )}
                  >
                    <span className="font-medium text-gray-900">All Videos</span>
                    {isSelected(null, null) && (
                      <Check className="h-4 w-4 text-purple-600" />
                    )}
                  </button>

                  {/* Divider */}
                  {courses.length > 0 && (
                    <div className="my-2 border-t border-gray-200" />
                  )}

                  {/* Courses and videos */}
                  {courses.map((course) => (
                    <div key={course.id} className="mb-2">
                      {/* Course option */}
                      <button
                        onClick={() => handleSelect(course.id, null)}
                        className={cn(
                          "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-gray-100",
                          isSelected(course.id, null) && "bg-purple-50"
                        )}
                      >
                        <span className="text-gray-900">{course.title}</span>
                        {isSelected(course.id, null) && (
                          <Check className="h-4 w-4 text-purple-600" />
                        )}
                      </button>

                      {/* Videos in course */}
                      {course.modules?.map((module) =>
                        module.lessons?.map((lesson) => (
                          <button
                            key={lesson.id}
                            onClick={() => handleSelect(course.id, lesson.video_id)}
                            className={cn(
                              "flex w-full items-center justify-between rounded-lg px-3 py-2 pl-6 text-left text-sm transition-colors hover:bg-gray-100",
                              isSelected(course.id, lesson.video_id) && "bg-purple-50"
                            )}
                          >
                            <span className="truncate text-gray-700">
                              {lesson.title}
                            </span>
                            {isSelected(course.id, lesson.video_id) && (
                              <Check className="ml-2 h-4 w-4 flex-shrink-0 text-purple-600" />
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  ))}

                  {/* Empty state */}
                  {courses.length === 0 && (
                    <div className="py-8 text-center text-sm text-gray-500">
                      No courses available
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
