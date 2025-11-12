'use client';

import { useEffect, useState } from 'react';
import { useAnalytics } from '@/lib/contexts/AnalyticsContext';
import { Card, Heading, Text, Button, Badge } from 'frosted-ui';
import { ArrowRight, Users, Video, BarChart3, Database, MessageSquare, TrendingUp, TrendingDown } from 'lucide-react';
import Link from 'next/link';

interface DashboardData {
  enrollment: {
    totalMembers: number;
    activeMembers: number;
    newThisWeek: number;
    newThisMonth: number;
    trend: number;
  };
  courses: {
    totalCourses: number;
    totalVideos: number;
    mostViewedCourse: {
      title: string;
      views: number;
    } | null;
  };
  analytics: {
    totalViews: number;
    totalWatchTime: string;
    avgCompletionRate: number;
    topVideo: {
      title: string;
      views: number;
    } | null;
  };
  usage: {
    storageUsed: number;
    storageLimit: number;
    aiCreditsUsed: number;
    aiCreditsLimit: number;
    apiCallsThisMonth: number;
    nearLimit: boolean;
  };
  chat: {
    totalSessions: number;
    messagesThisWeek: number;
    mostAskedQuestion: string | null;
    recentActivity: Array<{
      studentName: string;
      message: string;
      time: string;
    }>;
  };
}

export default function DashboardPage() {
  const { creatorId, dateRange } = useAnalytics();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          creatorId,
          start: dateRange.start.toISOString(),
          end: dateRange.end.toISOString(),
        });

        const response = await fetch(`/api/analytics/dashboard?${params}`);

        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        const dashboard = await response.json();
        setData(dashboard);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, [creatorId, dateRange]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Heading size="6" className="mb-2">Error loading dashboard</Heading>
          <Text size="3" className="text-gray-11">{error}</Text>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Heading size="6" className="mb-2">No data available</Heading>
          <Text size="3" className="text-gray-11">Start by uploading some videos</Text>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page Title */}
      <div>
        <Heading size="8" className="mb-2">Dashboard</Heading>
        <Text size="4" className="text-gray-11">
          Quick overview of your Chronos workspace
        </Text>
      </div>

      {/* Student/Member Enrollment Section */}
      <Card size="3">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-a3 rounded-lg">
                <Users className="w-6 h-6 text-blue-11" />
              </div>
              <div>
                <Heading size="6">Student Enrollment</Heading>
                <Text size="2" className="text-gray-11">Whop membership data</Text>
              </div>
            </div>
            <Badge size="2" color="blue">
              {data.enrollment.trend >= 0 ? (
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>+{data.enrollment.trend}%</span>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <TrendingDown className="w-3 h-3" />
                  <span>{data.enrollment.trend}%</span>
                </div>
              )}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Total Members"
              value={data.enrollment.totalMembers}
              color="blue"
            />
            <StatCard
              label="Active Members"
              value={data.enrollment.activeMembers}
              color="green"
            />
            <StatCard
              label="New This Week"
              value={data.enrollment.newThisWeek}
              color="purple"
            />
            <StatCard
              label="New This Month"
              value={data.enrollment.newThisMonth}
              color="orange"
            />
          </div>
        </div>
      </Card>

      {/* 4 Main Dashboard Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Courses Summary */}
        <Card size="3" className="hover:shadow-lg transition-shadow">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-a3 rounded-lg">
                  <Video className="w-6 h-6 text-purple-11" />
                </div>
                <div>
                  <Heading size="5">Courses</Heading>
                  <Text size="2" className="text-gray-11">Content overview</Text>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Text size="2" className="text-gray-11">Total Courses</Text>
                <Text size="4" weight="bold">{data.courses.totalCourses}</Text>
              </div>
              <div className="flex justify-between items-center">
                <Text size="2" className="text-gray-11">Total Videos</Text>
                <Text size="4" weight="bold">{data.courses.totalVideos}</Text>
              </div>
              {data.courses.mostViewedCourse && (
                <div className="p-3 bg-gray-a2 rounded-lg">
                  <Text size="1" className="text-gray-11 mb-1">Most Viewed Course</Text>
                  <Text size="2" weight="bold" className="text-gray-12">
                    {data.courses.mostViewedCourse.title}
                  </Text>
                  <Text size="1" className="text-gray-10 mt-1">
                    {data.courses.mostViewedCourse.views} views
                  </Text>
                </div>
              )}
            </div>

            <Link href="/dashboard/creator/courses" className="w-full">
              <Button variant="soft" className="w-full">
                <div className="flex items-center gap-2">
                  <span>View All Courses</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Button>
            </Link>
          </div>
        </Card>

        {/* Analytics Summary */}
        <Card size="3" className="hover:shadow-lg transition-shadow">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-a3 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-blue-11" />
                </div>
                <div>
                  <Heading size="5">Analytics</Heading>
                  <Text size="2" className="text-gray-11">Video performance</Text>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Text size="2" className="text-gray-11">Total Views</Text>
                <Text size="4" weight="bold">{data.analytics.totalViews.toLocaleString()}</Text>
              </div>
              <div className="flex justify-between items-center">
                <Text size="2" className="text-gray-11">Watch Time</Text>
                <Text size="4" weight="bold">{data.analytics.totalWatchTime}</Text>
              </div>
              <div className="flex justify-between items-center">
                <Text size="2" className="text-gray-11">Avg Completion</Text>
                <Text size="4" weight="bold">{data.analytics.avgCompletionRate}%</Text>
              </div>
              {data.analytics.topVideo && (
                <div className="p-3 bg-gray-a2 rounded-lg">
                  <Text size="1" className="text-gray-11 mb-1">Top Performing Video</Text>
                  <Text size="2" weight="bold" className="text-gray-12">
                    {data.analytics.topVideo.title}
                  </Text>
                  <Text size="1" className="text-gray-10 mt-1">
                    {data.analytics.topVideo.views} views
                  </Text>
                </div>
              )}
            </div>

            <Link href="/dashboard/creator/analytics" className="w-full">
              <Button variant="soft" className="w-full">
                <div className="flex items-center gap-2">
                  <span>View Analytics</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Button>
            </Link>
          </div>
        </Card>

        {/* Usage Summary */}
        <Card size="3" className="hover:shadow-lg transition-shadow">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-a3 rounded-lg">
                  <Database className="w-6 h-6 text-green-11" />
                </div>
                <div>
                  <Heading size="5">Usage</Heading>
                  <Text size="2" className="text-gray-11">Resources & limits</Text>
                </div>
              </div>
              {data.usage.nearLimit && (
                <Badge size="2" color="orange">Near Limit</Badge>
              )}
            </div>

            <div className="space-y-3">
              <UsageBar
                label="Storage"
                used={data.usage.storageUsed}
                limit={data.usage.storageLimit}
                unit="GB"
              />
              <UsageBar
                label="AI Credits"
                used={data.usage.aiCreditsUsed}
                limit={data.usage.aiCreditsLimit}
                unit="credits"
              />
              <div className="flex justify-between items-center">
                <Text size="2" className="text-gray-11">API Calls This Month</Text>
                <Text size="4" weight="bold">{data.usage.apiCallsThisMonth.toLocaleString()}</Text>
              </div>

              {data.usage.nearLimit && (
                <div className="p-3 bg-orange-a2 rounded-lg border border-orange-a4">
                  <Text size="2" className="text-orange-11">
                    You're approaching your plan limits. Consider upgrading for more resources.
                  </Text>
                </div>
              )}
            </div>

            <Link href="/dashboard/creator/usage" className="w-full">
              <Button variant="soft" className="w-full">
                <div className="flex items-center gap-2">
                  <span>View Usage Details</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Button>
            </Link>
          </div>
        </Card>

        {/* Chat Summary */}
        <Card size="3" className="hover:shadow-lg transition-shadow">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-a3 rounded-lg">
                  <MessageSquare className="w-6 h-6 text-orange-11" />
                </div>
                <div>
                  <Heading size="5">Chat Activity</Heading>
                  <Text size="2" className="text-gray-11">AI conversations</Text>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Text size="2" className="text-gray-11">Total Sessions</Text>
                <Text size="4" weight="bold">{data.chat.totalSessions}</Text>
              </div>
              <div className="flex justify-between items-center">
                <Text size="2" className="text-gray-11">Messages This Week</Text>
                <Text size="4" weight="bold">{data.chat.messagesThisWeek}</Text>
              </div>
              {data.chat.mostAskedQuestion && (
                <div className="p-3 bg-gray-a2 rounded-lg">
                  <Text size="1" className="text-gray-11 mb-1">Most Asked Question</Text>
                  <Text size="2" className="text-gray-12">
                    "{data.chat.mostAskedQuestion}"
                  </Text>
                </div>
              )}

              {data.chat.recentActivity.length > 0 && (
                <div>
                  <Text size="1" className="text-gray-11 mb-2">Recent Activity</Text>
                  <div className="space-y-2">
                    {data.chat.recentActivity.slice(0, 3).map((activity, idx) => (
                      <div key={idx} className="p-2 bg-gray-a2 rounded text-xs">
                        <Text size="1" weight="bold" className="text-gray-12">
                          {activity.studentName}
                        </Text>
                        <Text size="1" className="text-gray-10 truncate">
                          {activity.message}
                        </Text>
                        <Text size="1" className="text-gray-9">
                          {activity.time}
                        </Text>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Link href="/dashboard/creator/chat" className="w-full">
              <Button variant="soft" className="w-full">
                <div className="flex items-center gap-2">
                  <span>View All Chats</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

// Helper Components

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="p-4 bg-gray-a2 rounded-lg">
      <Text size="2" className="text-gray-11 mb-1">{label}</Text>
      <Heading size="6" className={`text-${color}-11`}>{value.toLocaleString()}</Heading>
    </div>
  );
}

function UsageBar({ label, used, limit, unit }: { label: string; used: number; limit: number; unit: string }) {
  const percentage = Math.min((used / limit) * 100, 100);
  const isNearLimit = percentage >= 80;

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <Text size="2" className="text-gray-11">{label}</Text>
        <Text size="2" className="text-gray-11">
          {used.toLocaleString()} / {limit.toLocaleString()} {unit}
        </Text>
      </div>
      <div className="w-full bg-gray-a3 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${
            isNearLimit ? 'bg-orange-9' : 'bg-green-9'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <Text size="1" className="text-gray-10 mt-1">{percentage.toFixed(1)}% used</Text>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6 animate-pulse">
      <div className="h-12 bg-gray-a3 rounded w-64" />
      <div className="h-48 bg-gray-a3 rounded" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-96 bg-gray-a3 rounded" />
        <div className="h-96 bg-gray-a3 rounded" />
        <div className="h-96 bg-gray-a3 rounded" />
        <div className="h-96 bg-gray-a3 rounded" />
      </div>
    </div>
  );
}
