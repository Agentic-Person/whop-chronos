'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Heading, Text, Card, Button } from 'frosted-ui';
import { ArrowRight, BookOpen, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { StudentStats, StudentStatsSkeleton } from '@/components/dashboard/StudentStats';
import { RecentActivity, RecentActivitySkeleton, type Activity } from '@/components/dashboard/RecentActivity';
import { CourseCard } from '@/components/courses/CourseCard';

interface DashboardStats {
  coursesEnrolled: number;
  videosWatched: number;
  chatMessages: number;
  completionRate: number;
}

interface CourseProgress {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string | null;
  progress: number;
  total_videos: number;
  watched_videos: number;
  last_accessed: string;
}

interface ChatSession {
  id: string;
  title: string;
  last_message: string;
  created_at: string;
  message_count: number;
}

interface DashboardData {
  stats: DashboardStats;
  continueWatching: CourseProgress[];
  recentSessions: ChatSession[];
  recentActivity: Activity[];
}

/**
 * StudentDashboardHomePage - Student dashboard overview/home page
 *
 * Features:
 * - Welcome section with student greeting
 * - StudentStats component (4 metric cards)
 * - "Continue Learning" section (3-4 course cards with progress)
 * - Recent chat sessions (5 most recent)
 * - Recent activity feed (10 most recent)
 * - Loading states for each section
 * - Empty states for new students
 */
export default function StudentDashboardHomePage() {
  const { userId: studentId } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboard() {
      if (!studentId) {
        setIsLoading(false);
        setError('Not authenticated');
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/students/dashboard/${studentId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        const dashboardData: DashboardData = await response.json();
        setData(dashboardData);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboard();
  }, [studentId]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Heading size="6" className="mb-2">
            Error Loading Dashboard
          </Heading>
          <Text size="3" className="text-gray-11">
            {error}
          </Text>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Heading size="6" className="mb-2">
            No Data Available
          </Heading>
          <Text size="3" className="text-gray-11">
            Start learning to see your progress here
          </Text>
        </div>
      </div>
    );
  }

  const isNewStudent = data.stats.coursesEnrolled === 0;

  return (
    <div className="flex flex-col gap-8">
      {/* Welcome Section */}
      <div>
        <Heading size="8" className="mb-2">
          Welcome back!
        </Heading>
        <Text size="4" className="text-gray-11">
          {isNewStudent
            ? 'Get started with your learning journey'
            : 'Continue where you left off'}
        </Text>
      </div>

      {/* Stats Row */}
      <StudentStats
        coursesEnrolled={data.stats.coursesEnrolled}
        videosWatched={data.stats.videosWatched}
        chatMessages={data.stats.chatMessages}
        completionRate={data.stats.completionRate}
      />

      {/* Continue Learning Section */}
      {data.continueWatching.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <Heading size="6">Continue Learning</Heading>
            <Link href="/dashboard/student/courses">
              <Button variant="ghost" size="2" className="gap-2">
                <span>View All Courses</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.continueWatching.map((course) => (
              <CourseCard
                key={course.id}
                id={course.id}
                title={course.title}
                description={course.description}
                thumbnail={course.thumbnail_url || undefined}
                moduleCount={course.total_videos}
                totalDuration={0}
                progress={course.progress}
                status={course.progress === 0 ? 'not_started' : course.progress === 100 ? 'completed' : 'in_progress'}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State for New Students */}
      {isNewStudent && (
        <Card size="3" className="bg-purple-a2 border-purple-a4">
          <div className="flex flex-col md:flex-row items-center gap-6 p-6">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-purple-a3 rounded-full flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-purple-11" />
              </div>
            </div>
            <div className="flex-1 text-center md:text-left">
              <Heading size="5" className="mb-2">
                Welcome to Chronos!
              </Heading>
              <Text size="3" className="text-gray-11 mb-4">
                Start your learning journey by enrolling in your first course.
                Our AI assistant is here to help you understand the material.
              </Text>
              <Link href="/dashboard/student/courses">
                <Button variant="solid" className="gap-2">
                  <BookOpen className="w-4 h-4" />
                  <span>Browse Courses</span>
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* Recent Chat Sessions */}
      {data.recentSessions.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <Heading size="6">Recent Chats</Heading>
            <Link href="/dashboard/student/chat">
              <Button variant="ghost" size="2" className="gap-2">
                <span>View All Chats</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <Card size="3">
            <div className="space-y-3">
              {data.recentSessions.map((session) => (
                <Link
                  key={session.id}
                  href={`/dashboard/student/chat?session=${session.id}`}
                  className="block"
                >
                  <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-a2 transition-colors">
                    <div className="p-2 bg-orange-a3 rounded-lg flex-shrink-0">
                      <MessageSquare className="w-4 h-4 text-orange-11" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Text size="2" weight="medium" className="text-gray-12 mb-1">
                        {session.title}
                      </Text>
                      <Text size="2" className="text-gray-11 truncate">
                        {session.last_message || 'No messages yet'}
                      </Text>
                      <Text size="1" className="text-gray-9 mt-1">
                        {session.message_count} {session.message_count === 1 ? 'message' : 'messages'}
                      </Text>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Recent Activity */}
      <div>
        <Heading size="6" className="mb-4">
          Recent Activity
        </Heading>
        <RecentActivity activities={data.recentActivity} limit={10} />
      </div>
    </div>
  );
}

/**
 * DashboardSkeleton - Loading state for dashboard
 */
function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-8 animate-pulse">
      {/* Welcome Skeleton */}
      <div>
        <div className="h-10 w-64 bg-gray-a3 rounded mb-2" />
        <div className="h-6 w-96 bg-gray-a3 rounded" />
      </div>

      {/* Stats Skeleton */}
      <StudentStatsSkeleton />

      {/* Continue Learning Skeleton */}
      <div>
        <div className="h-8 w-48 bg-gray-a3 rounded mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-[400px] bg-gray-a3 rounded-lg" />
          ))}
        </div>
      </div>

      {/* Recent Chats Skeleton */}
      <div>
        <div className="h-8 w-48 bg-gray-a3 rounded mb-4" />
        <div className="h-64 bg-gray-a3 rounded-lg" />
      </div>

      {/* Recent Activity Skeleton */}
      <div>
        <div className="h-8 w-48 bg-gray-a3 rounded mb-4" />
        <RecentActivitySkeleton />
      </div>
    </div>
  );
}
