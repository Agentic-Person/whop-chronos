'use client';

import { Card, Button } from '@whop/react/components';
import { Video, Users, MessageSquare, Upload, UserPlus, Sparkles } from 'lucide-react';

type EmptyStateType = 'noVideos' | 'noStudents' | 'noChats' | 'noData';

interface AnalyticsEmptyStateProps {
  type: EmptyStateType;
  onAction?: () => void;
}

const EMPTY_STATE_CONFIG = {
  noVideos: {
    icon: Video,
    title: 'No videos uploaded yet',
    description: 'Upload your first video to start tracking analytics and engaging with students.',
    actionLabel: 'Upload Video',
    actionIcon: Upload,
  },
  noStudents: {
    icon: Users,
    title: 'No students enrolled',
    description: 'Share your course with students to start seeing engagement analytics.',
    actionLabel: 'Invite Students',
    actionIcon: UserPlus,
  },
  noChats: {
    icon: MessageSquare,
    title: 'No chat interactions yet',
    description: 'Students will see chat analytics here once they start asking questions.',
    actionLabel: 'Learn About AI Chat',
    actionIcon: Sparkles,
  },
  noData: {
    icon: Sparkles,
    title: 'No data available',
    description: 'Analytics will appear here once you have activity in the selected date range.',
    actionLabel: null,
    actionIcon: null,
  },
} as const;

export function AnalyticsEmptyState({ type, onAction }: AnalyticsEmptyStateProps) {
  const config = EMPTY_STATE_CONFIG[type];
  const Icon = config.icon;
  const ActionIcon = config.actionIcon;

  return (
    <Card className="p-8">
      <div className="flex flex-col items-center justify-center text-center gap-4 py-8">
        <div className="p-4 rounded-full bg-gray-a3">
          <Icon className="w-8 h-8 text-gray-11" />
        </div>

        <div className="flex flex-col gap-2 max-w-md">
          <h3 className="text-5 font-semibold text-gray-12">{config.title}</h3>
          <p className="text-3 text-gray-11">{config.description}</p>
        </div>

        {config.actionLabel && ActionIcon && onAction && (
          <Button variant="solid" size="3" onClick={onAction} className="gap-2 mt-2">
            <ActionIcon className="w-4 h-4" />
            {config.actionLabel}
          </Button>
        )}
      </div>
    </Card>
  );
}

interface EmptyStateWrapperProps {
  hasData: boolean;
  type: EmptyStateType;
  onAction?: () => void;
  children: React.ReactNode;
}

export function EmptyStateWrapper({
  hasData,
  type,
  onAction,
  children,
}: EmptyStateWrapperProps) {
  if (!hasData) {
    return <AnalyticsEmptyState type={type} onAction={onAction} />;
  }

  return <>{children}</>;
}
