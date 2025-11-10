'use client';

import { Card } from '@whop/react/components';
import { TrendingUp, TrendingDown, Video, Users, MessageSquare, Clock } from 'lucide-react';
import { Sparklines, SparklinesLine } from 'react-sparklines';

interface QuickStat {
  label: string;
  value: string | number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  sparklineData?: number[];
  icon: React.ReactNode;
  href?: string;
}

interface QuickStatsCardsProps {
  stats: {
    totalVideos: number;
    totalStudents: number;
    aiMessagesThisMonth: number;
    totalWatchTime: string;
    trends: {
      videos: number;
      students: number;
      messages: number;
      watchTime: number;
    };
    sparklines?: {
      videos: number[];
      students: number[];
      messages: number[];
      watchTime: number[];
    };
  };
}

export function QuickStatsCards({ stats }: QuickStatsCardsProps) {
  const quickStats: QuickStat[] = [
    {
      label: 'Total Videos',
      value: stats.totalVideos,
      trend: {
        value: stats.trends.videos,
        isPositive: stats.trends.videos >= 0,
      },
      sparklineData: stats.sparklines?.videos,
      icon: <Video className="w-5 h-5" />,
      href: '/dashboard/creator/videos',
    },
    {
      label: 'Active Students',
      value: stats.totalStudents,
      trend: {
        value: stats.trends.students,
        isPositive: stats.trends.students >= 0,
      },
      sparklineData: stats.sparklines?.students,
      icon: <Users className="w-5 h-5" />,
      href: '/dashboard/creator/students',
    },
    {
      label: 'AI Messages',
      value: stats.aiMessagesThisMonth,
      trend: {
        value: stats.trends.messages,
        isPositive: stats.trends.messages >= 0,
      },
      sparklineData: stats.sparklines?.messages,
      icon: <MessageSquare className="w-5 h-5" />,
      href: '/dashboard/creator/chat',
    },
    {
      label: 'Watch Time',
      value: stats.totalWatchTime,
      trend: {
        value: stats.trends.watchTime,
        isPositive: stats.trends.watchTime >= 0,
      },
      sparklineData: stats.sparklines?.watchTime,
      icon: <Clock className="w-5 h-5" />,
      href: '/dashboard/creator/videos',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {quickStats.map((stat, index) => (
        <QuickStatCard key={index} stat={stat} />
      ))}
    </div>
  );
}

function QuickStatCard({ stat }: { stat: QuickStat }) {
  const TrendIcon = stat.trend?.isPositive ? TrendingUp : TrendingDown;
  const trendColor = stat.trend?.isPositive ? 'text-green-11' : 'text-red-11';

  return (
    <Card asChild>
      <a
        href={stat.href}
        className="p-4 hover:bg-gray-a2 transition-colors cursor-pointer block"
      >
        <div className="flex flex-col gap-3">
          {/* Header with icon */}
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-lg bg-gray-a3 text-gray-11">{stat.icon}</div>
            {stat.trend && (
              <div className={`flex items-center gap-1 ${trendColor}`}>
                <TrendIcon className="w-4 h-4" />
                <span className="text-2 font-medium">
                  {Math.abs(stat.trend.value)}%
                </span>
              </div>
            )}
          </div>

          {/* Value */}
          <div className="flex flex-col gap-1">
            <span className="text-8 font-bold text-gray-12">{stat.value}</span>
            <span className="text-3 text-gray-11">{stat.label}</span>
          </div>

          {/* Sparkline */}
          {stat.sparklineData && stat.sparklineData.length > 0 && (
            <div className="h-8 -mx-1">
              <Sparklines data={stat.sparklineData} width={200} height={32}>
                <SparklinesLine
                  color={stat.trend?.isPositive ? '#30a46c' : '#e5484d'}
                  style={{ strokeWidth: 2, fill: 'none' }}
                />
              </Sparklines>
            </div>
          )}
        </div>
      </a>
    </Card>
  );
}
