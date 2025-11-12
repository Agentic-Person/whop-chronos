'use client';

import { useState } from 'react';
import CoursesGrid from '@/components/courses/CoursesGrid';
import CourseBuilder from '@/components/courses/CourseBuilder';

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
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);

  const handleCourseCreated = (newCourse: Course) => {
    setCourses([...courses, newCourse]);
    // Automatically open the course builder for the new course
    setSelectedCourseId(newCourse.id);
  };

  const handleCourseClick = (courseId: string) => {
    setSelectedCourseId(courseId);
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
      />
    </div>
  );
}
