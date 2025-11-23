'use client';

/**
 * Student Courses Page
 *
 * Displays available courses for the student in this experience.
 * Uses native Whop authentication via the layout.
 */

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, Text, Heading, Badge } from 'frosted-ui';
import { BookOpen, Play, Clock, CheckCircle } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string | null;
  module_count: number;
  lesson_count: number;
  progress?: number;
}

export default function StudentCoursesPage() {
  const params = useParams();
  const experienceId = params.experienceId as string;
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studentContext, setStudentContext] = useState<{ studentId: string; creatorId: string } | null>(null);

  // Load context from server-rendered data
  useEffect(() => {
    const contextElement = document.getElementById('student-context');
    if (contextElement) {
      try {
        const context = JSON.parse(contextElement.textContent || '{}');
        setStudentContext(context);
      } catch (e) {
        console.error('Failed to parse student context:', e);
      }
    }
  }, []);

  // Fetch courses
  useEffect(() => {
    if (!studentContext?.creatorId) return;

    async function loadCourses() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/courses?creator_id=${studentContext.creatorId}`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to load courses');
        }

        if (result.success && result.data?.courses) {
          setCourses(result.data.courses);
        }
      } catch (err) {
        console.error('Error loading courses:', err);
        setError(err instanceof Error ? err.message : 'Failed to load courses');
      } finally {
        setIsLoading(false);
      }
    }

    loadCourses();
  }, [studentContext?.creatorId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-9 mx-auto mb-4"></div>
          <Text className="text-gray-11">Loading courses...</Text>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Text className="text-red-11 mb-4">{error}</Text>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-purple-9 text-white rounded-lg hover:bg-purple-10"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Heading size="7" className="text-gray-12">My Courses</Heading>
        <Text size="3" className="text-gray-11 mt-1">
          Continue learning or start a new course
        </Text>
      </div>

      {/* Courses Grid */}
      {courses.length === 0 ? (
        <Card className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-a3 mb-4">
            <BookOpen className="h-8 w-8 text-purple-11" />
          </div>
          <Heading size="5" className="text-gray-12 mb-2">No courses available yet</Heading>
          <Text size="3" className="text-gray-11">
            Check back soon for new learning content!
          </Text>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/experiences/${experienceId}/courses/${course.id}`}
              className="block"
            >
              <Card className="h-full hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer">
                {/* Thumbnail */}
                <div className="aspect-video bg-gray-a3 rounded-lg mb-4 overflow-hidden">
                  {course.thumbnail_url ? (
                    <img
                      src={course.thumbnail_url}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-gray-11" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="space-y-3">
                  <Heading size="4" className="text-gray-12 line-clamp-2">
                    {course.title}
                  </Heading>

                  {course.description && (
                    <Text size="2" className="text-gray-11 line-clamp-2">
                      {course.description}
                    </Text>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-gray-11">
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      <span>{course.module_count} modules</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Play className="w-4 h-4" />
                      <span>{course.lesson_count} lessons</span>
                    </div>
                  </div>

                  {/* Progress (if available) */}
                  {course.progress !== undefined && (
                    <div className="pt-2">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-11">Progress</span>
                        <span className="text-purple-11 font-medium">{course.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-a3 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-purple-9 transition-all"
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
