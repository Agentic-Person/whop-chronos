'use client';

import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { VideoPerformanceData, TimeRange, ChartProps } from './types';

interface VideoPerformanceChartProps extends ChartProps {
  videoId: string;
  timeRange: TimeRange;
  data: VideoPerformanceData[];
  isLoading?: boolean;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-lg">
      <p className="text-sm font-medium text-gray-200 mb-2">
        {formatDate(label || '')}
      </p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-400">{entry.name}:</span>
          <span className="text-gray-100 font-semibold">
            {entry.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
};

const SkeletonLoader: React.FC<{ height: number }> = ({ height }) => (
  <div
    className="w-full animate-pulse bg-gray-800 rounded-lg"
    style={{ height }}
  >
    <div className="h-full flex items-center justify-center">
      <div className="text-gray-500">Loading chart data...</div>
    </div>
  </div>
);

const EmptyState: React.FC<{ height: number }> = ({ height }) => (
  <div
    className="w-full flex items-center justify-center bg-gray-800 rounded-lg border border-gray-700"
    style={{ height }}
  >
    <div className="text-center">
      <svg
        className="mx-auto h-12 w-12 text-gray-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
      <h3 className="mt-2 text-sm font-medium text-gray-400">No data available</h3>
      <p className="mt-1 text-sm text-gray-500">
        Video performance data will appear here once available.
      </p>
    </div>
  </div>
);

export const VideoPerformanceChart: React.FC<VideoPerformanceChartProps> = React.memo(({
  videoId: _videoId,
  timeRange: _timeRange,
  data,
  isLoading = false,
  className = '',
  height = 400,
}) => {
  const chartData = useMemo(() => {
    return data.map(item => ({
      date: item.date,
      Views: item.views,
      'Watch Time (min)': Math.round(item.watchTime / 60),
      'Unique Viewers': item.uniqueViewers,
    }));
  }, [data]);

  const formatXAxis = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (isLoading) {
    return <SkeletonLoader height={height} />;
  }

  if (!data || data.length === 0) {
    return <EmptyState height={height} />;
  }

  return (
    <div
      className={`w-full ${className}`}
      role="img"
      aria-label="Video performance chart showing views, watch time, and unique viewers over time"
    >
      <ResponsiveContainer width="100%" height={height} aspect={2}>
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorWatchTime" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorViewers" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="date"
            tickFormatter={formatXAxis}
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '14px', color: '#d1d5db' }}
          />
          <Area
            type="monotone"
            dataKey="Views"
            stroke="#8b5cf6"
            fillOpacity={1}
            fill="url(#colorViews)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="Watch Time (min)"
            stroke="#3b82f6"
            fillOpacity={1}
            fill="url(#colorWatchTime)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="Unique Viewers"
            stroke="#10b981"
            fillOpacity={1}
            fill="url(#colorViewers)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
});

VideoPerformanceChart.displayName = 'VideoPerformanceChart';
