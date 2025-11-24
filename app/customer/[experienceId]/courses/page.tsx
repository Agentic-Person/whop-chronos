/**
 * Customer Courses Page - Whop Embedded App
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, Heading, Text, Button } from 'frosted-ui';
import { BookOpen, Play, Clock, CheckCircle, Loader2 } from 'lucide-react';

interface CourseItem {
  id: string;
  name: string;
  description?: string;
  cover_image?: string;
  total_lessons: number;
  completed_lessons: number;
  total_duration?: number;
}

export default function CustomerCoursesPage() {
  const params = useParams();
  const experienceId = params.experienceId as string;
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatorId, setCreatorId] = useState('test_company_id');

  useEffect(() => {
    const dataScript = document.getElementById('__CUSTOMER_DATA__');
    if (dataScript) {
      try {
        const data = JSON.parse(dataScript.textContent || '{}');
        if (data.creatorId) {
          setCreatorId(data.creatorId);
          fetchCourses(data.creatorId);
        }
      } catch (e) {
        console.error('Failed to parse customer data:', e);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const fetchCourses = async (creatorId: string) => {
    try {
      const response = await fetch(`/api/courses?creator_id=${creatorId}`);
      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses || []);
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const getProgress = (completed: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-11" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Heading size="7" className="mb-2">My Courses</Heading>
        <Text size="3" className="text-gray-11">
          Browse and continue your enrolled courses
        </Text>
      </div>

      {courses.length === 0 ? (
        <Card size="3">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 bg-blue-a3 rounded-full mb-4">
              <BookOpen className="w-8 h-8 text-blue-11" />
            </div>
            <Heading size="5" className="mb-2">No courses available yet</Heading>
            <Text size="3" className="text-gray-11 max-w-md">
              Check back soon! The creator is working on adding courses for you.
            </Text>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => {
            const progress = getProgress(course.completed_lessons, course.total_lessons);
            return (
              <Card key={course.id} size="3" className="hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-gray-a3 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                  {course.cover_image ? (
                    <img
                      src={course.cover_image}
                      alt={course.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <BookOpen className="w-12 h-12 text-gray-11" />
                  )}
                </div>

                <Heading size="5" className="mb-2 line-clamp-2">{course.name}</Heading>

                {course.description && (
                  <Text size="2" className="text-gray-11 mb-4 line-clamp-2">
                    {course.description}
                  </Text>
                )}

                <div className="flex items-center gap-4 text-gray-11 mb-4">
                  <div className="flex items-center gap-1">
                    <Play className="w-4 h-4" />
                    <Text size="2">{course.total_lessons} lessons</Text>
                  </div>
                  {course.total_duration && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <Text size="2">{formatDuration(course.total_duration)}</Text>
                    </div>
                  )}
                </div>

                {/* Progress bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <Text size="2" className="text-gray-11">Progress</Text>
                    <div className="flex items-center gap-1">
                      {progress === 100 && <CheckCircle className="w-4 h-4 text-green-11" />}
                      <Text size="2" className="text-gray-12 font-medium">{progress}%</Text>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-a3 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-9 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <Link href={`/customer/${experienceId}/courses/${course.id}`}>
                  <Button variant="soft" className="w-full">
                    {progress === 0 ? 'Start Course' : progress === 100 ? 'Review Course' : 'Continue'}
                  </Button>
                </Link>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
