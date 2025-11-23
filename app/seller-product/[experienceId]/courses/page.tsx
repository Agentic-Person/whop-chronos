/**
 * Seller Courses Page - Whop Embedded App
 */

'use client';

import { useParams } from 'next/navigation';
import { CourseBuilder } from '@/components/courses/CourseBuilder';

export default function SellerCoursesPage() {
  const params = useParams();
  const experienceId = params.experienceId as string;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-12 mb-2">Course Builder</h1>
        <p className="text-gray-11">Create and organize your courses</p>
      </div>
      <CourseBuilder />
    </div>
  );
}
