'use client';

import { useEffect, useState } from 'react';
import { Card } from '@whop/react/components';
import { DateRangePicker } from '@/components/analytics/DateRangePicker';
import { RefreshButton } from '@/components/analytics/RefreshButton';
import { ExportVideoAnalyticsButton } from '@/components/analytics/videos/ExportVideoAnalyticsButton';
import { DashboardSkeleton } from '@/components/analytics/DashboardSkeleton';
import { useAnalytics } from '@/lib/contexts/AnalyticsContext';
import { VideoMetricCards } from '@/components/analytics/videos/VideoMetricCards';
import { ViewsOverTimeChart } from '@/components/analytics/videos/ViewsOverTimeChart';
import { CompletionRatesChart } from '@/components/analytics/videos/CompletionRatesChart';
import { CostBreakdownChart } from '@/components/analytics/videos/CostBreakdownChart';
import { StorageUsageChart } from '@/components/analytics/videos/StorageUsageChart';
import { StudentEngagementMetrics } from '@/components/analytics/videos/StudentEngagementMetrics';
import { TopVideosTable } from '@/components/analytics/videos/TopVideosTable';

export interface VideoAnalyticsDashboardData {
  metrics: {
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
  };
  views_over_time: Array<{ date: string; views: number }>;
  completion_rates: Array<{
    video_id: string;
    title: string;
    completion_rate: number;
    views: number;
  }>;
  cost_breakdown: Array<{
    method: string;
    total_cost: number;
    video_count: number;
  }>;
  storage_usage: Array<{
    date: string;
    storage_gb: number;
    cumulative_gb: number;
  }>;
  student_engagement: {
    active_learners: number;
    avg_videos_per_student: number;
    peak_hours: Array<{
      hour: number;
      day_of_week: number;
      activity_count: number;
    }>;
  };
  top_videos: Array<{
    id: string;
    title: string;
    thumbnail_url: string | null;
    duration_seconds: number;
    source_type: string;
    views: number;
    avg_watch_time_seconds: number;
    completion_rate: number;
  }>;
}

export default function VideoAnalyticsDashboardPage() {
  const { dateRange, creatorId } = useAnalytics();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<VideoAnalyticsDashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          creator_id: creatorId,
          start: dateRange.start.toISOString(),
          end: dateRange.end.toISOString(),
        });

        const response = await fetch(`/api/analytics/videos/dashboard?${params}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch dashboard data: ${response.statusText}`);
        }

        const result = await response.json();

        if (result.success) {
          setData(result.data);
        } else {
          throw new Error(result.error || 'Unknown error');
        }
      } catch (err) {
        console.error('Error fetching video analytics dashboard:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [dateRange, creatorId]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="p-6">
          <p className="text-red-11 text-center">Error: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-accent-9 text-white rounded-lg hover:bg-accent-10"
          >
            Retry
          </button>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-11">No data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-7 font-bold text-gray-12">Video Analytics</h1>
            <p className="text-3 text-gray-11 mt-1">
              Comprehensive insights into your video performance and student engagement
            </p>
          </div>
          <div className="flex items-center gap-2">
            <DateRangePicker />
            <RefreshButton />
            <ExportVideoAnalyticsButton data={data} />
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <VideoMetricCards metrics={data.metrics} />

      {/* Views Over Time Chart */}
      <Card className="p-6">
        <h3 className="text-5 font-semibold text-gray-12 mb-4">Views Over Time</h3>
        <ViewsOverTimeChart data={data.views_over_time} />
      </Card>

      {/* Two Column Layout - Completion Rates and Cost Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-5 font-semibold text-gray-12 mb-4">Completion Rates by Video</h3>
          <CompletionRatesChart data={data.completion_rates} />
        </Card>

        <Card className="p-6">
          <h3 className="text-5 font-semibold text-gray-12 mb-4">Cost Breakdown</h3>
          <CostBreakdownChart data={data.cost_breakdown} />
        </Card>
      </div>

      {/* Storage Usage */}
      <Card className="p-6">
        <h3 className="text-5 font-semibold text-gray-12 mb-4">Storage Usage Trend</h3>
        <StorageUsageChart data={data.storage_usage} />
      </Card>

      {/* Student Engagement */}
      <Card className="p-6">
        <h3 className="text-5 font-semibold text-gray-12 mb-4">Student Engagement</h3>
        <StudentEngagementMetrics engagement={data.student_engagement} />
      </Card>

      {/* Top Performing Videos */}
      <Card className="p-6">
        <h3 className="text-5 font-semibold text-gray-12 mb-4">Top Performing Videos</h3>
        <TopVideosTable videos={data.top_videos} />
      </Card>
    </div>
  );
}
