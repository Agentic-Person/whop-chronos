'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import CoursesGrid from '@/components/courses/CoursesGrid';
import CourseBuilder from '@/components/courses/CourseBuilder';
import { useAnalytics } from '@/lib/contexts/AnalyticsContext';

interface Course {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  aspectRatio: '16:9' | '9:16';
  chapters: number;
  lessons: number;
  lastEdited: string;
}

export default function CoursesPage() {
  const params = useParams();
  const companyId = params.companyId as string;
  const { creatorId } = useAnalytics();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [_isLoading, setIsLoading] = useState(true);
  const [_error, setError] = useState<string | null>(null);

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);

  // Load courses from database on mount
  useEffect(() => {
    if (!creatorId) {
      setIsLoading(false);
      setError('Not authenticated');
      return;
    }

    async function loadCourses() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/courses?creator_id=${creatorId}&include_unpublished=true`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to load courses');
        }

        if (result.success && result.data?.courses) {
          // Format courses from database to match component interface
          const formattedCourses: Course[] = result.data.courses.map((course: any) => ({
            id: course.id,
            name: course.title,
            description: course.description || '',
            coverImage: course.thumbnail_url || '',
            aspectRatio: '16:9' as const,
            chapters: course.module_count || 0,
            lessons: course.lesson_count || 0,
            lastEdited: course.updated_at || course.created_at,
          }));

          setCourses(formattedCourses);
        }
      } catch (err) {
        console.error('Error loading courses:', err);
        setError(err instanceof Error ? err.message : 'Failed to load courses');
      } finally {
        setIsLoading(false);
      }
    }

    loadCourses();
  }, [creatorId]);

  const handleCourseCreated = (newCourse: Course) => {
    setCourses([...courses, newCourse]);
    setSelectedCourseId(newCourse.id);
  };

  const handleCourseClick = (courseId: string) => {
    setSelectedCourseId(courseId);
  };

  const handleCourseDeleted = (courseId: string) => {
    setCourses(courses.filter(c => c.id !== courseId));
  };

  const handleBackFromBuilder = () => {
    setSelectedCourseId(null);
  };

  // If a course is selected, show the course builder
  if (selectedCourse) {
    return (
      <CourseBuilder
        course={selectedCourse}
        onBack={handleBackFromBuilder}
      />
    );
  }

  // Otherwise show the courses grid
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-7 font-bold text-gray-12">Courses</h1>
          <p className="text-3 text-gray-11 mt-1">Create and manage your courses</p>
        </div>
      </div>

      <CoursesGrid
        courses={courses}
        onCourseCreated={handleCourseCreated}
        onCourseClick={handleCourseClick}
        onCourseDeleted={handleCourseDeleted}
      />
    </div>
  );
}
