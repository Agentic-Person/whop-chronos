'use client';

import { Card, Heading, Text } from 'frosted-ui';
import { Play, CheckCircle, MessageSquare, BookOpen, Clock } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

export interface Activity {
  id: string;
  type: 'video_watched' | 'lesson_completed' | 'chat_message' | 'course_started';
  title: string;
  description?: string;
  timestamp: Date;
  link?: string;
}

interface RecentActivityProps {
  activities: Activity[];
  limit?: number;
}

/**
 * RecentActivity - Activity feed component for student dashboard
 *
 * Displays recent student actions:
 * - Videos watched
 * - Lessons completed
 * - Chat messages sent
 * - Courses started
 *
 * Features:
 * - Icon for each activity type
 * - Relative timestamps ("2 hours ago")
 * - Clickable items (navigate to related page)
 * - Empty state
 * - Loading skeleton
 */
export function RecentActivity({ activities, limit = 10 }: RecentActivityProps) {
  const displayedActivities = activities.slice(0, limit);

  if (displayedActivities.length === 0) {
    return (
      <Card size="3">
        <div className="flex flex-col items-center justify-center py-12">
          <Clock className="w-12 h-12 text-gray-9 mb-3" />
          <Heading size="5" className="mb-2">
            No Recent Activity
          </Heading>
          <Text size="3" className="text-gray-11 text-center">
            Your learning activity will appear here once you get started
          </Text>
        </div>
      </Card>
    );
  }

  return (
    <Card size="3">
      <div className="flex flex-col gap-4">
        <Heading size="5">Recent Activity</Heading>

        <div className="space-y-3">
          {displayedActivities.map((activity) => (
            <ActivityItem key={activity.id} activity={activity} />
          ))}
        </div>
      </div>
    </Card>
  );
}

/**
 * ActivityItem - Individual activity list item
 */
function ActivityItem({ activity }: { activity: Activity }) {
  const { icon: Icon, color, bgColor, textColor } = getActivityStyle(activity.type);

  const content = (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-a2 transition-colors">
      {/* Icon */}
      <div className={`p-2 ${bgColor} rounded-lg flex-shrink-0`}>
        <Icon className={`w-4 h-4 ${textColor}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <Text size="2" weight="medium" className="text-gray-12 mb-0.5">
          {getActivityLabel(activity.type)}
        </Text>
        <Text size="2" className="text-gray-11 truncate">
          {activity.title}
        </Text>
        {activity.description && (
          <Text size="1" className="text-gray-10 line-clamp-1 mt-1">
            {activity.description}
          </Text>
        )}
        <Text size="1" className="text-gray-9 mt-1">
          {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
        </Text>
      </div>
    </div>
  );

  if (activity.link) {
    return (
      <Link href={activity.link} className="block">
        {content}
      </Link>
    );
  }

  return content;
}

/**
 * Get icon and color for activity type
 */
function getActivityStyle(type: Activity['type']) {
  switch (type) {
    case 'video_watched':
      return {
        icon: Play,
        color: 'blue',
        bgColor: 'bg-blue-a3',
        textColor: 'text-blue-11',
      };
    case 'lesson_completed':
      return {
        icon: CheckCircle,
        color: 'green',
        bgColor: 'bg-green-a3',
        textColor: 'text-green-11',
      };
    case 'chat_message':
      return {
        icon: MessageSquare,
        color: 'orange',
        bgColor: 'bg-orange-a3',
        textColor: 'text-orange-11',
      };
    case 'course_started':
      return {
        icon: BookOpen,
        color: 'purple',
        bgColor: 'bg-purple-a3',
        textColor: 'text-purple-11',
      };
    default:
      return {
        icon: Clock,
        color: 'gray',
        bgColor: 'bg-gray-a3',
        textColor: 'text-gray-11',
      };
  }
}

/**
 * Get label for activity type
 */
function getActivityLabel(type: Activity['type']) {
  switch (type) {
    case 'video_watched':
      return 'Watched';
    case 'lesson_completed':
      return 'Completed';
    case 'chat_message':
      return 'Asked';
    case 'course_started':
      return 'Started';
    default:
      return 'Activity';
  }
}

/**
 * RecentActivitySkeleton - Loading state for RecentActivity
 */
export function RecentActivitySkeleton() {
  return (
    <Card size="3">
      <div className="flex flex-col gap-4 animate-pulse">
        <div className="h-6 w-32 bg-gray-a3 rounded" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-start gap-3 p-3">
              <div className="w-8 h-8 bg-gray-a3 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-20 bg-gray-a3 rounded" />
                <div className="h-4 w-full bg-gray-a3 rounded" />
                <div className="h-3 w-24 bg-gray-a3 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
