/**
 * Customer AI Chat Page - Whop Embedded App
 */

'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ChatInterface } from '@/components/chat/ChatInterface';

export default function CustomerChatPage() {
  const params = useParams();
  const experienceId = params.experienceId as string;

  // State for customer data
  const [studentId, setStudentId] = useState('user_test_student_00000000');
  const [creatorId, setCreatorId] = useState('test_company_id');

  // Get customer data from the hidden script tag
  useEffect(() => {
    const dataScript = document.getElementById('__CUSTOMER_DATA__');
    if (dataScript) {
      try {
        const data = JSON.parse(dataScript.textContent || '{}');
        if (data.studentId) setStudentId(data.studentId);
        if (data.creatorId) setCreatorId(data.creatorId);
      } catch (e) {
        console.error('Failed to parse customer data:', e);
      }
    }
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-12 mb-2">AI Chat</h1>
        <p className="text-gray-11">Ask questions about your course content</p>
      </div>
      <div className="h-[calc(100vh-300px)] min-h-[500px]">
        <ChatInterface
          creatorId={creatorId}
          studentId={studentId}
          embedded={true}
        />
      </div>
    </div>
  );
}
