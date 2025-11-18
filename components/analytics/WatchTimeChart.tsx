'use client';

import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { WatchTimeData, ChartProps } from './types';

interface WatchTimeChartProps extends ChartProps {
  creatorId: string;
  topN?: number;
  data: WatchTimeData[];
  isLoading?: boolean;
  onVideoClick?: (videoId: string) => void;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: {
      videoTitle: string;
      watchTime: number;
    };
  }>;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0]!.payload;
  const hours = Math.floor(data.watchTime / 3600);
  const minutes = Math.floor((data.watchTime % 3600) / 60);

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-lg max-w-xs">
      <p className="text-sm font-medium text-gray-200 mb-1">
        {data.videoTitle}
      </p>
      <p className="text-xs text-gray-400">
        Total Watch Time: <span className="text-gray-100 font-semibold">
          {hours}h {minutes}m
        </span>
      </p>
    </div>
  );
};

const getGradientColor = (value: number, max: number): string => {
  const percentage = value / max;

  if (percentage >= 0.8) return '#10b981'; // Green
  if (percentage >= 0.6) return '#3b82f6'; // Blue
  if (percentage >= 0.4) return '#8b5cf6'; // Purple
  if (percentage >= 0.2) return '#f59e0b'; // Amber
  return '#ef4444'; // Red
};

const truncateTitle = (title: string, maxLength: number = 20): string => {
  if (title.length <= maxLength) return title;
  return `${title.substring(0, maxLength)}...`;
};

const SkeletonLoader: React.FC<{ height: number }> = ({ height }) => (
  <div
    className="w-full animate-pulse bg-gray-800 rounded-lg"
    style={{ height }}
  >
    <div className="h-full flex items-center justify-center">
      <div className="text-gray-500">Loading watch time data...</div>
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
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <h3 className="mt-2 text-sm font-medium text-gray-400">No watch time data</h3>
      <p className="mt-1 text-sm text-gray-500">
        Watch time statistics will appear here once students start watching.
      </p>
    </div>
  </div>
);

export const WatchTimeChart: React.FC<WatchTimeChartProps> = React.memo(({
  creatorId: _creatorId,
  topN = 10,
  data,
  isLoading = false,
  onVideoClick,
  className = '',
  height = 400,
}) => {
  const chartData = useMemo(() => {
    // Sort by watch time (highest first) and take top N
    const sorted = [...data]
      .sort((a, b) => b.watchTime - a.watchTime)
      .slice(0, topN);

    return sorted.map(item => ({
      videoId: item.videoId,
      videoTitle: truncateTitle(item.videoTitle),
      fullTitle: item.videoTitle,
      watchTime: item.watchTime,
      hours: Math.round((item.watchTime / 3600) * 10) / 10, // Round to 1 decimal
    }));
  }, [data, topN]);

  const maxWatchTime = useMemo(() => {
    return Math.max(...chartData.map(item => item.watchTime), 1);
  }, [chartData]);

  const handleBarClick = (data: any) => {
    if (onVideoClick && data?.videoId) {
      onVideoClick(data.videoId);
    }
  };

  if (isLoading) {
    return <SkeletonLoader height={height} />;
  }

  if (!data || data.length === 0) {
    return <EmptyState height={height} />;
  }

  return (
    <div className={`w-full ${className}`}>
      <ResponsiveContainer width="100%" height={height} aspect={2}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="videoTitle"
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
            label={{
              value: 'Watch Time (hours)',
              angle: -90,
              position: 'insideLeft',
              style: { fill: '#9ca3af', fontSize: '12px' }
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="hours"
            onClick={handleBarClick}
            cursor={onVideoClick ? 'pointer' : 'default'}
            radius={[8, 8, 0, 0]}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={getGradientColor(entry.watchTime, maxWatchTime)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});

WatchTimeChart.displayName = 'WatchTimeChart';
