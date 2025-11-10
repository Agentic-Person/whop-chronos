'use client';

import { useEffect, useState } from 'react';
import { useAnalytics } from '@/lib/contexts/AnalyticsContext';
import { DashboardHeader } from '@/components/analytics/DashboardHeader';
import { QuickStatsCards } from '@/components/analytics/QuickStatsCards';
import { DateRangePicker } from '@/components/analytics/DateRangePicker';
import { RefreshButton } from '@/components/analytics/RefreshButton';
import { ExportButton } from '@/components/analytics/ExportButton';
import {
  AnalyticsDashboardGrid,
  DashboardSection,
  DashboardCard,
} from '@/components/analytics/AnalyticsDashboardGrid';
import { DashboardSkeleton } from '@/components/analytics/DashboardSkeleton';
import { AnalyticsEmptyState } from '@/components/analytics/AnalyticsEmptyState';

interface OverviewData {
  quickStats: {
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
  usageMeters: {
    storage_used: number;
    storage_limit: number;
    ai_credits_used: number;
    ai_credits_limit: number;
    videos_uploaded: number;
    videos_limit: number;
  };
  topVideos: any[];
  tier: string;
}

export default function OverviewPage() {
  const { creatorId, dateRange } = useAnalytics();
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOverview() {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          creatorId,
          start: dateRange.start.toISOString(),
          end: dateRange.end.toISOString(),
        });

        const response = await fetch(`/api/analytics/overview?${params}`);

        if (!response.ok) {
          throw new Error('Failed to fetch overview data');
        }

        const overview = await response.json();
        setData(overview);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error('Overview fetch error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchOverview();
  }, [creatorId, dateRange]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h3 className="text-5 font-semibold text-gray-12 mb-2">Error loading dashboard</h3>
          <p className="text-3 text-gray-11">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return <AnalyticsEmptyState type="noData" />;
  }

  const hasNoData = data.quickStats.totalVideos === 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Header with Actions */}
      <DashboardHeader
        creatorName="Creator Dashboard"
        pageTitle="Analytics Overview"
      >
        <div className="flex items-center gap-2">
          <DateRangePicker />
          <RefreshButton />
          <ExportButton />
        </div>
      </DashboardHeader>

      {hasNoData ? (
        <AnalyticsEmptyState
          type="noVideos"
          onAction={() => (window.location.href = '/dashboard/creator/videos')}
        />
      ) : (
        <>
          {/* Quick Stats */}
          <DashboardSection>
            <QuickStatsCards stats={data.quickStats} />
          </DashboardSection>

          {/* Usage Meters Section */}
          <DashboardSection
            title="Usage & Limits"
            description="Monitor your plan limits and usage"
          >
            <AnalyticsDashboardGrid columns={3}>
              <UsageMeterCard
                label="Storage"
                used={data.usageMeters.storage_used}
                limit={data.usageMeters.storage_limit}
                unit="MB"
              />
              <UsageMeterCard
                label="AI Credits"
                used={data.usageMeters.ai_credits_used}
                limit={data.usageMeters.ai_credits_limit}
                unit="credits"
              />
              <UsageMeterCard
                label="Videos"
                used={data.usageMeters.videos_uploaded}
                limit={data.usageMeters.videos_limit}
                unit="videos"
              />
            </AnalyticsDashboardGrid>
          </DashboardSection>

          {/* Video Performance Section */}
          <DashboardSection
            title="Top Performing Videos"
            description="Your most viewed videos in the selected period"
          >
            <TopVideosTable videos={data.topVideos} />
          </DashboardSection>

          {/* Placeholder for future charts from other agents */}
          <DashboardSection
            title="Analytics Charts"
            description="Video performance and student engagement over time"
          >
            <AnalyticsDashboardGrid columns={2}>
              <DashboardCard>
                <PlaceholderChart title="Video Performance" />
              </DashboardCard>
              <DashboardCard>
                <PlaceholderChart title="Student Engagement" />
              </DashboardCard>
            </AnalyticsDashboardGrid>
          </DashboardSection>
        </>
      )}
    </div>
  );
}

// Helper Components
function UsageMeterCard({
  label,
  used,
  limit,
  unit,
}: {
  label: string;
  used: number;
  limit: number;
  unit: string;
}) {
  const percentage = Math.min((used / limit) * 100, 100);
  const isNearLimit = percentage >= 80;

  return (
    <div className="p-4 rounded-lg border border-gray-a4 bg-gray-a2">
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <span className="text-3 font-medium text-gray-12">{label}</span>
          <span className="text-2 text-gray-11">
            {used.toLocaleString()} / {limit.toLocaleString()} {unit}
          </span>
        </div>

        <div className="w-full bg-gray-a3 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              isNearLimit ? 'bg-red-9' : 'bg-blue-9'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        <span className="text-2 text-gray-11">{percentage.toFixed(1)}% used</span>
      </div>
    </div>
  );
}

function TopVideosTable({ videos }: { videos: any[] }) {
  if (!videos || videos.length === 0) {
    return (
      <div className="p-8 text-center text-gray-11">
        <p>No video data available for the selected period</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-a4 overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-a2">
          <tr>
            <th className="px-4 py-3 text-left text-3 font-medium text-gray-11">Video</th>
            <th className="px-4 py-3 text-right text-3 font-medium text-gray-11">Views</th>
            <th className="px-4 py-3 text-right text-3 font-medium text-gray-11 hidden sm:table-cell">
              Watch Time
            </th>
            <th className="px-4 py-3 text-right text-3 font-medium text-gray-11 hidden md:table-cell">
              Completion
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-a4">
          {videos.map((video, index) => (
            <tr key={index} className="hover:bg-gray-a2 transition-colors">
              <td className="px-4 py-3 text-3 text-gray-12">
                {video.videos?.title || 'Untitled Video'}
              </td>
              <td className="px-4 py-3 text-3 text-gray-12 text-right">
                {video.views?.toLocaleString() || 0}
              </td>
              <td className="px-4 py-3 text-3 text-gray-12 text-right hidden sm:table-cell">
                {formatMinutes(video.watch_time || 0)}
              </td>
              <td className="px-4 py-3 text-3 text-gray-12 text-right hidden md:table-cell">
                {((video.completion_rate || 0) * 100).toFixed(1)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PlaceholderChart({ title }: { title: string }) {
  return (
    <div className="p-6 rounded-lg border border-gray-a4 bg-gray-a2">
      <h3 className="text-4 font-semibold text-gray-12 mb-4">{title}</h3>
      <div className="h-64 flex items-center justify-center bg-gray-a3 rounded-lg">
        <p className="text-3 text-gray-11">Chart from other agent will be integrated here</p>
      </div>
    </div>
  );
}

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);

  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}
