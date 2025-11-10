'use client';

import { useState, useEffect } from 'react';
import type { StudentChatActivityData, SortBy } from './chat-types';

interface StudentChatActivityProps {
  creatorId: string;
  sortBy?: SortBy;
}

export function StudentChatActivity({
  creatorId,
  sortBy: initialSortBy = 'messages',
}: StudentChatActivityProps) {
  const [students, setStudents] = useState<StudentChatActivityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>(initialSortBy);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/analytics/chat?creatorId=${creatorId}&metric=student-activity&sortBy=${sortBy}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch student activity data');
        }

        const result = await response.json();
        setStudents(result.data || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setStudents([]);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [creatorId, sortBy]);

  const handleViewHistory = (studentId: string) => {
    // Navigate to student chat history (implement routing)
    console.log('View history for student:', studentId);
    // In a real app: router.push(`/dashboard/creator/students/${studentId}/chat-history`)
  };

  const formatLastActive = (date: string): string => {
    const now = new Date();
    const lastActive = new Date(date);
    const diffMs = now.getTime() - lastActive.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return lastActive.toLocaleDateString();
  };

  const formatSessionLength = (minutes: number): string => {
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  const filteredStudents = students.filter((s) =>
    s.studentEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Loading student activity...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Student Chat Activity
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Individual student engagement with AI assistant
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="w-full sm:w-auto px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="messages">Sort by Messages</option>
            <option value="sessions">Sort by Sessions</option>
            <option value="lastActive">Sort by Last Active</option>
          </select>
        </div>
      </div>

      {filteredStudents.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          {searchTerm ? 'No matching students found' : 'No student activity data available'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3">Student</th>
                <th className="px-6 py-3 text-center">Total Messages</th>
                <th className="px-6 py-3 text-center">Sessions</th>
                <th className="px-6 py-3 text-center">Last Active</th>
                <th className="px-6 py-3 text-center">Avg Session</th>
                <th className="px-6 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student, index) => (
                <tr
                  key={student.studentId}
                  className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {student.studentEmail}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                      {student.totalMessages}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-gray-900 dark:text-white">
                    {student.sessions}
                  </td>
                  <td className="px-6 py-4 text-center text-gray-900 dark:text-white">
                    {formatLastActive(student.lastActive)}
                  </td>
                  <td className="px-6 py-4 text-center text-gray-900 dark:text-white">
                    {formatSessionLength(student.avgSessionLength)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleViewHistory(student.studentId)}
                      className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
                    >
                      View History
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredStudents.length} of {students.length} students
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Total messages: {students.reduce((sum, s) => sum + s.totalMessages, 0).toLocaleString()}
        </div>
      </div>
    </div>
  );
}
