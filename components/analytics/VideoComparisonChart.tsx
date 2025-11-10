'use client';

import React, { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { VideoComparisonData, MetricType, ChartProps } from './types';

interface VideoComparisonChartProps extends ChartProps {
  videoIds: string[];
  videoTitles: Record<string, string>; // Map of videoId to title
  metric: MetricType;
  data: VideoComparisonData[];
  isLoading?: boolean;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    dataKey: string;
  }>;
  label?: string;
}

const VIDEO_COLORS = [
  '#8b5cf6', // Purple
  '#3b82f6', // Blue
  '#10b981', // Green
  '#f59e0b', // Amber
  '#ef4444', // Red
];

const getMetricLabel = (metric: MetricType): string => {
  switch (metric) {
    case 'views':
      return 'Views';
    case 'watchTime':
      return 'Watch Time (min)';
    case 'completionRate':
      return 'Completion Rate (%)';
    default:
      return metric;
  }
};

const formatMetricValue = (value: number, metric: MetricType): string => {
  switch (metric) {
    case 'views':
      return value.toLocaleString();
    case 'watchTime':
      return `${Math.round(value / 60)} min`;
    case 'completionRate':
      return `${value.toFixed(1)}%`;
    default:
      return value.toString();
  }
};

const CustomTooltip: React.FC<CustomTooltipProps & { metric: MetricType }> = ({
  active,
  payload,
  label,
  metric,
}) => {
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
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-lg max-w-xs">
      <p className="text-sm font-medium text-gray-200 mb-2">
        {formatDate(label || '')}
      </p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-sm mb-1">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-400 text-xs truncate max-w-[100px]">
            {entry.name}:
          </span>
          <span className="text-gray-100 font-semibold text-xs">
            {formatMetricValue(entry.value, metric)}
          </span>
        </div>
      ))}
    </div>
  );
};

const truncateTitle = (title: string, maxLength: number = 25): string => {
  if (title.length <= maxLength) return title;
  return `${title.substring(0, maxLength)}...`;
};

const SkeletonLoader: React.FC<{ height: number }> = ({ height }) => (
  <div
    className="w-full animate-pulse bg-gray-800 rounded-lg"
    style={{ height }}
  >
    <div className="h-full flex items-center justify-center">
      <div className="text-gray-500">Loading comparison data...</div>
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
      <h3 className="mt-2 text-sm font-medium text-gray-400">No comparison data</h3>
      <p className="mt-1 text-sm text-gray-500">
        Select videos to compare their performance over time.
      </p>
    </div>
  </div>
);

export const VideoComparisonChart: React.FC<VideoComparisonChartProps> = React.memo(({
  videoIds,
  videoTitles,
  metric,
  data,
  isLoading = false,
  className = '',
  height = 400,
}) => {
  const [hiddenVideos, setHiddenVideos] = useState<Set<string>>(new Set());

  const visibleVideoIds = useMemo(() => {
    return videoIds.filter(id => !hiddenVideos.has(id));
  }, [videoIds, hiddenVideos]);

  const chartData = useMemo(() => {
    return data.map(item => {
      const formattedItem: Record<string, string | number> = {
        date: item.date,
      };

      videoIds.forEach(videoId => {
        const value = item[videoId];
        if (typeof value === 'number') {
          formattedItem[videoId] = value;
        }
      });

      return formattedItem;
    });
  }, [data, videoIds]);

  const formatXAxis = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const toggleVideo = (videoId: string) => {
    setHiddenVideos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(videoId)) {
        newSet.delete(videoId);
      } else {
        newSet.add(videoId);
      }
      return newSet;
    });
  };

  const renderLegend = (props: any) => {
    const { payload } = props;

    return (
      <div className="flex flex-wrap gap-2 justify-center mt-4">
        {payload.map((entry: any, index: number) => {
          const isHidden = hiddenVideos.has(entry.value);
          const videoTitle = videoTitles[entry.value] || entry.value;

          return (
            <button
              key={index}
              onClick={() => toggleVideo(entry.value)}
              className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs transition-all ${
                isHidden
                  ? 'bg-gray-800 text-gray-500'
                  : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
              }`}
            >
              <div
                className={`w-3 h-3 rounded-full ${isHidden ? 'opacity-30' : ''}`}
                style={{ backgroundColor: entry.color }}
              />
              <span className="max-w-[150px] truncate">
                {truncateTitle(videoTitle)}
              </span>
            </button>
          );
        })}
      </div>
    );
  };

  if (isLoading) {
    return <SkeletonLoader height={height} />;
  }

  if (!data || data.length === 0 || videoIds.length === 0) {
    return <EmptyState height={height} />;
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="mb-2 text-sm font-medium text-gray-300">
        Comparing {getMetricLabel(metric)}
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
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
            label={{
              value: getMetricLabel(metric),
              angle: -90,
              position: 'insideLeft',
              style: { fill: '#9ca3af', fontSize: '12px' }
            }}
          />
          <Tooltip content={<CustomTooltip metric={metric} />} />
          <Legend content={renderLegend} />
          {visibleVideoIds.map((videoId, index) => (
            <Line
              key={videoId}
              type="monotone"
              dataKey={videoId}
              name={videoId}
              stroke={VIDEO_COLORS[index % VIDEO_COLORS.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
});

VideoComparisonChart.displayName = 'VideoComparisonChart';
