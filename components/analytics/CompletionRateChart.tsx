'use client';

import React, { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import type { CompletionRateData, ChartProps } from './types';

interface CompletionRateChartProps extends ChartProps {
  videoId?: string;
  creatorId?: string;
  data: CompletionRateData[];
  isLoading?: boolean;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: CompletionRateData;
  }>;
}

const SEGMENT_COLORS: Record<string, string> = {
  Completed: '#10b981', // Green
  High: '#3b82f6',      // Blue
  Medium: '#f59e0b',    // Amber
  Low: '#ef4444',       // Red
};

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0]!.payload;

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-lg">
      <p className="text-sm font-medium text-gray-200 mb-1">
        {data.segment}
      </p>
      <p className="text-xs text-gray-400">
        Count: <span className="text-gray-100 font-semibold">{data.count}</span>
      </p>
      <p className="text-xs text-gray-400">
        Percentage: <span className="text-gray-100 font-semibold">{data.percentage.toFixed(1)}%</span>
      </p>
    </div>
  );
};

interface CustomLabelProps {
  cx?: number;
  cy?: number;
  midAngle?: number;
  innerRadius?: number;
  outerRadius?: number;
  percent?: number;
}

const renderCustomLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: CustomLabelProps) => {
  if (!cx || !cy || midAngle === undefined || !innerRadius || !outerRadius || !percent) return null;

  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.05) return null; // Don't show label if segment is too small

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      className="text-xs font-semibold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const CenterLabel: React.FC<{ value: number }> = ({ value }) => (
  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
    <div className="text-3xl font-bold text-gray-100">{value.toFixed(1)}%</div>
    <div className="text-sm text-gray-400">Overall</div>
  </div>
);

const SkeletonLoader: React.FC<{ height: number }> = ({ height }) => (
  <div
    className="w-full animate-pulse bg-gray-800 rounded-lg"
    style={{ height }}
  >
    <div className="h-full flex items-center justify-center">
      <div className="text-gray-500">Loading completion data...</div>
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
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <h3 className="mt-2 text-sm font-medium text-gray-400">No completion data</h3>
      <p className="mt-1 text-sm text-gray-500">
        Completion statistics will appear here once students start watching.
      </p>
    </div>
  </div>
);

export const CompletionRateChart: React.FC<CompletionRateChartProps> = React.memo(({
  videoId: _videoId,
  creatorId: _creatorId,
  data,
  isLoading = false,
  className = '',
  height = 400,
}) => {
  const { chartData, overallRate } = useMemo(() => {
    const formattedData = data.map(item => ({
      ...item,
      name: item.segment,
      value: item.count,
    }));

    // Calculate overall completion rate (weighted average)
    const totalCount = data.reduce((sum, item) => sum + item.count, 0);
    const weightedSum = data.reduce((sum, item) => {
      const weight = item.segment === 'Completed' ? 100 :
                     item.segment === 'High' ? 87.5 :
                     item.segment === 'Medium' ? 50 : 12.5;
      return sum + (item.count * weight);
    }, 0);
    const overall = totalCount > 0 ? weightedSum / totalCount : 0;

    return { chartData: formattedData, overallRate: overall };
  }, [data]);

  if (isLoading) {
    return <SkeletonLoader height={height} />;
  }

  if (!data || data.length === 0 || data.every(item => item.count === 0)) {
    return <EmptyState height={height} />;
  }

  return (
    <div className={`w-full relative ${className}`}>
      <CenterLabel value={overallRate} />
      <ResponsiveContainer width="100%" height={height} aspect={2}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={120}
            innerRadius={60}
            fill="#8884d8"
            dataKey="value"
            paddingAngle={2}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={SEGMENT_COLORS[entry.segment] || '#6b7280'}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value, entry: any) => (
              <span className="text-sm text-gray-300">
                {value} ({entry.payload.count})
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
});

CompletionRateChart.displayName = 'CompletionRateChart';
