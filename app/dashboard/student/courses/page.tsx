'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Heading, Text } from 'frosted-ui';
import { BookOpen } from 'lucide-react';
import { CourseCard, type CourseCardProps } from '@/components/courses/CourseCard';
import { CourseFilters } from '@/components/courses/CourseFilters';
import { Button } from '@/components/ui/Button';

interface CoursesResponse {
  success: boolean;
  data: {
    courses: CourseCardProps[];
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

/**
 * StudentCourseCatalogPage - Main course catalog page for students
 *
 * Features:
 * - Grid layout: 3 columns on desktop, responsive
 * - Search and filter functionality
 * - Sort options: Recent, Progress, Name
 * - Loading states with skeleton cards
 * - Empty state when no courses found
 * - Error handling with retry
 * - Click course card to navigate to viewer
 */
export default function StudentCourseCatalogPage() {
  const { userId: studentId } = useAuth();

  // State
  const [courses, setCourses] = useState<CourseCardProps[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [filter, setFilter] = useState<'all' | 'in_progress' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'progress' | 'name'>('recent');

  /**
   * Fetch courses from API
   */
  const fetchCourses = useCallback(async () => {
    if (!studentId) {
      setIsLoading(false);
      setError('Not authenticated');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        student_id: studentId,
        filter,
        search: searchQuery,
        sort: sortBy,
        limit: '50', // Get more courses for better filtering
      });

      const response = await fetch(`/api/courses/student?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }

      const data: CoursesResponse = await response.json();
      setCourses(data.data.courses);
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError(err instanceof Error ? err.message : 'Failed to load courses');
    } finally {
      setIsLoading(false);
    }
  }, [studentId, filter, searchQuery, sortBy]);

  /**
   * Fetch courses on mount and when filters change
   */
  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  /**
   * Handle filter change
   */
  const handleFilterChange = (newFilter: 'all' | 'in_progress' | 'completed') => {
    setFilter(newFilter);
  };

  /**
   * Handle search change (debounced in CourseFilters component)
   */
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  /**
   * Handle sort change
   */
  const handleSortChange = (newSort: 'recent' | 'progress' | 'name') => {
    setSortBy(newSort);
  };

  /**
   * Retry fetch on error
   */
  const handleRetry = () => {
    fetchCourses();
  };

  /**
   * Loading state - Skeleton cards
   */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-1 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header Skeleton */}
          <div className="mb-8 space-y-2">
            <div className="h-10 w-64 bg-gray-a3 rounded animate-pulse" />
            <div className="h-6 w-96 bg-gray-a3 rounded animate-pulse" />
          </div>

          {/* Filters Skeleton */}
          <div className="mb-6 h-32 bg-gray-a3 rounded-lg animate-pulse" />

          {/* Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-[500px] bg-gray-a3 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  /**
   * Error state
   */
  if (error) {
    return (
      <div className="min-h-screen bg-gray-1 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="mb-4">
            <BookOpen className="w-16 h-16 text-red-9 mx-auto mb-4" />
            <Heading size="6" className="mb-2">Error Loading Courses</Heading>
            <Text size="3" className="text-gray-11">{error}</Text>
          </div>
          <Button onClick={handleRetry}>Retry</Button>
        </div>
      </div>
    );
  }

  /**
   * Empty state
   */
  if (courses.length === 0) {
    return (
      <div className="min-h-screen bg-gray-1 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Heading size="8" className="mb-2">My Courses</Heading>
            <Text size="4" className="text-gray-11">
              Browse and continue your learning journey
            </Text>
          </div>

          {/* Filters */}
          <div className="mb-6">
            <CourseFilters
              onFilterChange={handleFilterChange}
              onSearchChange={handleSearchChange}
              onSortChange={handleSortChange}
              currentFilter={filter}
              currentSort={sortBy}
            />
          </div>

          {/* Empty State */}
          <div className="flex flex-col items-center justify-center py-16">
            <BookOpen className="w-20 h-20 text-gray-9 mb-4" />
            <Heading size="6" className="mb-2">No Courses Found</Heading>
            <Text size="3" className="text-gray-11 text-center mb-6">
              {searchQuery
                ? `No courses match your search "${searchQuery}"`
                : filter !== 'all'
                ? `No ${filter.replace('_', ' ')} courses`
                : 'No courses available yet'}
            </Text>
            {(searchQuery || filter !== 'all') && (
              <Button
                onClick={() => {
                  setSearchQuery('');
                  setFilter('all');
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  /**
   * Main content - Course grid
   */
  return (
    <div className="min-h-screen bg-gray-1 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Heading size="8" className="mb-2">My Courses</Heading>
          <Text size="4" className="text-gray-11">
            Browse and continue your learning journey
          </Text>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <CourseFilters
            onFilterChange={handleFilterChange}
            onSearchChange={handleSearchChange}
            onSortChange={handleSortChange}
            currentFilter={filter}
            currentSort={sortBy}
          />
        </div>

        {/* Results count */}
        <div className="mb-4">
          <Text size="2" className="text-gray-11">
            Showing {courses.length} {courses.length === 1 ? 'course' : 'courses'}
          </Text>
        </div>

        {/* Course Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <CourseCard key={course.id} {...course} />
          ))}
        </div>
      </div>
    </div>
  );
}
