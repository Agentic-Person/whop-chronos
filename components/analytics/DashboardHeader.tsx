'use client';

import { Avatar } from '@whop/react/components';
import { Badge } from '@whop/react/components';
import { formatDistanceToNow } from 'date-fns';
import { useAnalytics } from '@/lib/contexts/AnalyticsContext';

interface DashboardHeaderProps {
  creatorName: string;
  creatorAvatar?: string;
  pageTitle?: string;
  children?: React.ReactNode;
}

const TIER_COLORS = {
  free: 'gray',
  starter: 'blue',
  pro: 'purple',
  enterprise: 'gold',
} as const;

const TIER_LABELS = {
  free: 'Free',
  starter: 'Starter',
  pro: 'Pro',
  enterprise: 'Enterprise',
} as const;

export function DashboardHeader({
  creatorName,
  creatorAvatar,
  pageTitle = 'Analytics Overview',
  children,
}: DashboardHeaderProps) {
  const { tier, lastUpdated } = useAnalytics();

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div className="flex items-center gap-4">
        {creatorAvatar && (
          <Avatar
            src={creatorAvatar}
            alt={creatorName}
            size="3"
            fallback={creatorName.charAt(0).toUpperCase()}
          />
        )}
        <div className="flex flex-col gap-1">
          <h1 className="text-7 font-bold text-gray-12">{pageTitle}</h1>
          <div className="flex items-center gap-2">
            <span className="text-3 text-gray-11">{creatorName}</span>
            <Badge variant="solid" color={TIER_COLORS[tier]} size="1">
              {TIER_LABELS[tier]}
            </Badge>
          </div>
          {lastUpdated && (
            <span className="text-2 text-gray-10">
              Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
            </span>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}
