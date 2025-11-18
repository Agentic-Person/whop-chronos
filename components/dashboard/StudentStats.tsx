'use client';

import { Card, Heading, Text } from 'frosted-ui';
import { BookOpen, Video, MessageSquare, TrendingUp } from 'lucide-react';

interface StudentStatsProps {
  coursesEnrolled: number;
  videosWatched: number;
  chatMessages: number;
  completionRate: number; // 0-100
}

/**
 * StudentStats - Overview statistics component for student dashboard
 *
 * Displays 4 key metrics:
 * - Courses Enrolled
 * - Videos Watched
 * - Chat Messages
 * - Completion Rate
 *
 * Layout:
 * - 2x2 grid on mobile
 * - 4x1 grid on desktop
 */
export function StudentStats({
  coursesEnrolled,
  videosWatched,
  chatMessages,
  completionRate,
}: StudentStatsProps) {
  const stats = [
    {
      label: 'Courses Enrolled',
      value: coursesEnrolled,
      icon: BookOpen,
      color: 'purple',
      bgColor: 'bg-purple-a3',
      textColor: 'text-purple-11',
    },
    {
      label: 'Videos Watched',
      value: videosWatched,
      icon: Video,
      color: 'blue',
      bgColor: 'bg-blue-a3',
      textColor: 'text-blue-11',
    },
    {
      label: 'Chat Messages',
      value: chatMessages,
      icon: MessageSquare,
      color: 'orange',
      bgColor: 'bg-orange-a3',
      textColor: 'text-orange-11',
    },
    {
      label: 'Completion Rate',
      value: `${completionRate}%`,
      icon: TrendingUp,
      color: 'green',
      bgColor: 'bg-green-a3',
      textColor: 'text-green-11',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <Card
            key={stat.label}
            size="3"
            className="hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
          >
            <div className="flex flex-col gap-3">
              {/* Icon */}
              <div className={`p-3 ${stat.bgColor} rounded-lg w-fit`}>
                <Icon className={`w-6 h-6 ${stat.textColor}`} />
              </div>

              {/* Value */}
              <div>
                <Heading size="7" className="mb-1">
                  {stat.value}
                </Heading>
                <Text size="2" className="text-gray-11">
                  {stat.label}
                </Text>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

/**
 * StudentStatsSkeleton - Loading state for StudentStats
 */
export function StudentStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i} size="3">
          <div className="flex flex-col gap-3 animate-pulse">
            <div className="w-12 h-12 bg-gray-a3 rounded-lg" />
            <div>
              <div className="h-8 w-16 bg-gray-a3 rounded mb-2" />
              <div className="h-4 w-24 bg-gray-a3 rounded" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
