/**
 * Customer Page - Whop Embedded App
 *
 * This is the main page shown to customers/students when they access the app from Whop.
 * Authentication is handled by the layout.
 *
 * Route: /customer/[experienceId]
 */

'use client';

import { useParams } from 'next/navigation';

export default function CustomerPage() {
  const params = useParams();
  const experienceId = params.experienceId as string;

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-9 to-purple-9 rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">
          Welcome to Your Learning Dashboard!
        </h2>
        <p className="opacity-90">
          Continue your learning journey with AI-powered assistance.
        </p>
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <a
          href={`/customer/${experienceId}/courses`}
          className="p-6 bg-gray-2 border border-gray-a4 rounded-xl hover:border-gray-a6 transition-colors group"
        >
          <div className="w-12 h-12 rounded-lg bg-blue-a4 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-blue-11" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-12 mb-2 group-hover:text-blue-11 transition-colors">
            My Courses
          </h3>
          <p className="text-gray-11">
            Browse and watch your enrolled courses
          </p>
        </a>

        <a
          href={`/customer/${experienceId}/chat`}
          className="p-6 bg-gray-2 border border-gray-a4 rounded-xl hover:border-gray-a6 transition-colors group"
        >
          <div className="w-12 h-12 rounded-lg bg-purple-a4 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-purple-11" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-12 mb-2 group-hover:text-purple-11 transition-colors">
            AI Chat
          </h3>
          <p className="text-gray-11">
            Ask questions about your course content
          </p>
        </a>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-gray-2 border border-gray-a4 rounded-lg text-center">
          <div className="text-2xl font-bold text-gray-12">0</div>
          <div className="text-sm text-gray-11">Courses Enrolled</div>
        </div>
        <div className="p-4 bg-gray-2 border border-gray-a4 rounded-lg text-center">
          <div className="text-2xl font-bold text-gray-12">0%</div>
          <div className="text-sm text-gray-11">Overall Progress</div>
        </div>
        <div className="p-4 bg-gray-2 border border-gray-a4 rounded-lg text-center">
          <div className="text-2xl font-bold text-gray-12">0</div>
          <div className="text-sm text-gray-11">Lessons Completed</div>
        </div>
        <div className="p-4 bg-gray-2 border border-gray-a4 rounded-lg text-center">
          <div className="text-2xl font-bold text-gray-12">0h</div>
          <div className="text-sm text-gray-11">Watch Time</div>
        </div>
      </div>
    </div>
  );
}
