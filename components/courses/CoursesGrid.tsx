'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import CreateCourseModal from './CreateCourseModal';

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

interface CoursesGridProps {
  courses: Course[];
  onCourseCreated: (course: Course) => void;
  onCourseClick: (courseId: string) => void;
}

export default function CoursesGrid({ courses, onCourseCreated, onCourseClick }: CoursesGridProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Empty state - show grid of placeholders
  if (courses.length === 0) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Placeholder cards */}
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="relative border-2 border-dashed border-blue-6/30 rounded-lg aspect-[4/3] bg-gray-2/50 hover:border-blue-7/50 transition-colors"
            >
              {i === 1 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center justify-center w-12 h-12 bg-blue-9 hover:bg-blue-10 rounded-full shadow-lg transition-colors group"
                    aria-label="Add course"
                  >
                    <Plus className="w-6 h-6 text-white" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-center py-12">
          <h3 className="text-xl font-semibold text-gray-12 mb-2">No courses yet</h3>
          <p className="text-gray-11 mb-6">Get started by creating your first course</p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-9 hover:bg-blue-10 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Course
          </button>
        </div>

        <CreateCourseModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCourseCreated={onCourseCreated}
        />
      </div>
    );
  }

  // Populated state - show courses
  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-9 hover:bg-blue-10 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Course
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {courses.map((course) => (
          <div
            key={course.id}
            onClick={() => onCourseClick(course.id)}
            className="border border-gray-6 rounded-lg overflow-hidden hover:shadow-lg hover:border-blue-7 transition-all cursor-pointer group"
          >
            {/* Cover image */}
            <div className="aspect-video bg-gray-3 flex items-center justify-center overflow-hidden">
              {course.coverImage ? (
                <img
                  src={course.coverImage}
                  alt={course.name}
                  className={`w-full h-full ${
                    course.aspectRatio === '9:16' ? 'object-contain' : 'object-cover'
                  }`}
                />
              ) : (
                <div className="text-gray-9">No cover image</div>
              )}
            </div>

            {/* Course info */}
            <div className="p-4">
              <h3 className="font-semibold text-gray-12 mb-1 group-hover:text-blue-11 transition-colors">
                {course.name}
              </h3>
              <p className="text-sm text-gray-11 mb-3 line-clamp-2">{course.description}</p>

              <div className="flex items-center gap-4 text-xs text-gray-11">
                <span>{course.chapters} chapters</span>
                <span>{course.lessons} lessons</span>
              </div>

              <div className="mt-2 text-xs text-gray-10">
                Last edited {new Date(course.lastEdited).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>

      <CreateCourseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCourseCreated={onCourseCreated}
      />
    </div>
  );
}
