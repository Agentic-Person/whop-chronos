'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import CreateCourseModal from './CreateCourseModal';
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

interface CoursesGridProps {
  courses: Course[];
  onCourseCreated: (course: Course) => void;
  onCourseClick: (courseId: string) => void;
  onCourseDeleted: (courseId: string) => void;
}

export default function CoursesGrid({ courses, onCourseCreated, onCourseClick, onCourseDeleted }: CoursesGridProps) {
  const { creatorId } = useAnalytics();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ courseId: string; courseName: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent, courseId: string, courseName: string) => {
    e.stopPropagation(); // Prevent course click when clicking delete
    setDeleteConfirm({ courseId, courseName });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;

    if (!creatorId) {
      alert('Not authenticated');
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/courses/${deleteConfirm.courseId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creator_id: creatorId }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to delete course');
      }

      // Success - notify parent
      onCourseDeleted(deleteConfirm.courseId);
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting course:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete course');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirm(null);
  };

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
            className="relative border border-gray-6 rounded-lg overflow-hidden hover:shadow-lg hover:border-blue-7 transition-all cursor-pointer group"
          >
            {/* Delete button */}
            <button
              onClick={(e) => handleDeleteClick(e, course.id, course.name)}
              className="absolute top-2 right-2 z-10 p-2 bg-gray-1/90 hover:bg-red-9 border border-gray-6 hover:border-red-9 rounded-lg transition-all opacity-0 group-hover:opacity-100"
              aria-label="Delete course"
            >
              <Trash2 className="w-4 h-4 text-gray-11 hover:text-white transition-colors" />
            </button>

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

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-gray-2 border border-gray-6 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-xl font-semibold text-gray-12 mb-4">Delete Course</h3>
            <p className="text-gray-11 mb-6">
              Are you sure you want to delete <strong className="text-gray-12">&quot;{deleteConfirm.courseName}&quot;</strong>?
              <br />
              <span className="text-red-11 font-medium">This action cannot be undone.</span>
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelDelete}
                disabled={isDeleting}
                className="px-4 py-2 border border-gray-6 text-gray-12 rounded-lg hover:bg-gray-3 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-9 hover:bg-red-10 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Course
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
