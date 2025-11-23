/**
 * Customer Courses Page - Whop Embedded App
 */

'use client';

import { useParams } from 'next/navigation';
import { StudentCourseList } from '@/components/courses/StudentCourseList';

export default function CustomerCoursesPage() {
  const params = useParams();
  const experienceId = params.experienceId as string;

  // Get customer data from the hidden script tag
  let studentId = 'user_test_student_00000000';
  let creatorId = 'test_company_id';

  if (typeof document !== 'undefined') {
    const dataScript = document.getElementById('__CUSTOMER_DATA__');
    if (dataScript) {
      try {
        const data = JSON.parse(dataScript.textContent || '{}');
        studentId = data.studentId || studentId;
        creatorId = data.creatorId || creatorId;
      } catch (e) {
        console.error('Failed to parse customer data:', e);
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-12 mb-2">My Courses</h1>
        <p className="text-gray-11">Browse and continue your enrolled courses</p>
      </div>
      <StudentCourseList />
    </div>
  );
}
