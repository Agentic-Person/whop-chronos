/**
 * Seller Courses Page - Whop Embedded App
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, Heading, Text, Button } from 'frosted-ui';
import { BookOpen, Plus, Play, Users, MoreVertical, Loader2 } from 'lucide-react';

interface CourseItem {
  id: string;
  name: string;
  description?: string;
  cover_image?: string;
  chapter_count: number;
  lesson_count: number;
  student_count: number;
  is_published: boolean;
  created_at: string;
}

export default function SellerCoursesPage() {
  const params = useParams();
  const experienceId = params.experienceId as string;
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const dataScript = document.getElementById('__SELLER_DATA__');
    if (dataScript) {
      try {
        const data = JSON.parse(dataScript.textContent || '{}');
        if (data.creatorId) {
          fetchCourses(data.creatorId);
        }
      } catch (e) {
        console.error('Failed to parse seller data:', e);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-11" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Heading size="7" className="mb-2">Courses</Heading>
          <Text size="3" className="text-gray-11">
            Create and manage your courses
          </Text>
        </div>
        <Button variant="solid">
          <Plus className="w-4 h-4 mr-2" />
          Create Course
        </Button>
      </div>

      {courses.length === 0 ? (
        <Card size="3">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 bg-blue-a3 rounded-full mb-4">
              <BookOpen className="w-8 h-8 text-blue-11" />
            </div>
            <Heading size="5" className="mb-2">No courses yet</Heading>
            <Text size="3" className="text-gray-11 mb-6 max-w-md">
              Create your first course to organize your videos into a structured learning experience.
            </Text>
            <Button variant="solid">
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Course
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card key={course.id} size="3" className="hover:shadow-lg transition-shadow">
              <div className="aspect-video bg-gray-a3 rounded-lg mb-4 flex items-center justify-center overflow-hidden relative">
                {course.cover_image ? (
                  <img
                    src={course.cover_image}
                    alt={course.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <BookOpen className="w-12 h-12 text-gray-11" />
                )}
                {/* Status badge */}
                <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium ${
                  course.is_published
                    ? 'bg-green-a3 text-green-11'
                    : 'bg-orange-a3 text-orange-11'
                }`}>
                  {course.is_published ? 'Published' : 'Draft'}
                </div>
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
                  <Text size="2">{course.lesson_count} lessons</Text>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <Text size="2">{course.student_count} students</Text>
                </div>
              </div>

              <div className="flex gap-2">
                <Link href={`/seller-product/${experienceId}/courses/${course.id}`} className="flex-1">
                  <Button variant="soft" className="w-full">
                    Edit Course
                  </Button>
                </Link>
                <Button variant="soft" size="2">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
