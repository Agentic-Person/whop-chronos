'use client';

import { Card } from '@whop/react/components';
import { Eye, Clock, Award, Video, TrendingUp, TrendingDown } from 'lucide-react';

interface VideoMetricsData {
  total_views: number;
  total_watch_time_seconds: number;
  avg_completion_rate: number;
  total_videos: number;
  trends: {
    views: number;
    watch_time: number;
    completion: number;
    videos: number;
  };
}

interface VideoMetricCardsProps {
  metrics: VideoMetricsData;
}

function formatWatchTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export function VideoMetricCards({ metrics }: VideoMetricCardsProps) {
  const cards = [
    {
      icon: <Eye className="w-5 h-5" />,
      label: 'Total Views',
      value: metrics.total_views.toLocaleString(),
      trend: metrics.trends.views,
      color: 'blue' as const,
    },
    {
      icon: <Clock className="w-5 h-5" />,
      label: 'Total Watch Time',
      value: formatWatchTime(metrics.total_watch_time_seconds),
      trend: metrics.trends.watch_time,
      color: 'purple' as const,
    },
    {
      icon: <Award className="w-5 h-5" />,
      label: 'Avg Completion Rate',
      value: `${Math.round(metrics.avg_completion_rate)}%`,
      trend: metrics.trends.completion,
      color: 'green' as const,
    },
    {
      icon: <Video className="w-5 h-5" />,
      label: 'Total Videos',
      value: metrics.total_videos.toLocaleString(),
      trend: metrics.trends.videos,
      color: 'orange' as const,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <MetricCard key={index} {...card} />
      ))}
    </div>
  );
}

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend: number;
  color: 'blue' | 'purple' | 'green' | 'orange';
}

function MetricCard({ icon, label, value, trend, color }: MetricCardProps) {
  const isPositive = trend >= 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  const colorClasses = {
    blue: 'text-blue-11 bg-blue-a3',
    purple: 'text-purple-11 bg-purple-a3',
    green: 'text-green-11 bg-green-a3',
    orange: 'text-orange-11 bg-orange-a3',
  };

  return (
    <Card className="p-4">
      <div className="flex flex-col gap-3">
        {/* Header with icon and trend */}
        <div className="flex items-center justify-between">
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>{icon}</div>
          {trend !== 0 && (
            <div className={`flex items-center gap-1 ${isPositive ? 'text-green-11' : 'text-red-11'}`}>
              <TrendIcon className="w-4 h-4" />
              <span className="text-2 font-medium">{Math.abs(trend)}%</span>
            </div>
          )}
        </div>

        {/* Value and label */}
        <div className="flex flex-col gap-1">
          <span className="text-8 font-bold text-gray-12">{value}</span>
          <span className="text-3 text-gray-11">{label}</span>
        </div>

        {/* Trend label */}
        <span className="text-2 text-gray-11">vs previous period</span>
      </div>
    </Card>
  );
}
