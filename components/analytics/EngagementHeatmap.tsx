'use client';

import React, { useMemo } from 'react';
import type { EngagementHeatmapData, ChartProps } from './types';

interface EngagementHeatmapProps extends ChartProps {
  videoId: string;
  dateRange?: string;
  data: EngagementHeatmapData[];
  isLoading?: boolean;
}

interface CustomTooltipProps {
  hour: number;
  day: string;
  value: number;
  active: boolean;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const getColorIntensity = (value: number, max: number): string => {
  if (value === 0) return 'bg-gray-800';

  const percentage = value / max;

  if (percentage >= 0.8) return 'bg-purple-500';
  if (percentage >= 0.6) return 'bg-purple-600';
  if (percentage >= 0.4) return 'bg-purple-700';
  if (percentage >= 0.2) return 'bg-purple-800';
  return 'bg-purple-900';
};

const formatHour = (hour: number): string => {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
};

const CustomTooltip: React.FC<CustomTooltipProps> = ({ hour, day, value, active }) => {
  if (!active) return null;

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-lg">
      <p className="text-sm font-medium text-gray-200 mb-1">
        {day} at {formatHour(hour)}
      </p>
      <p className="text-xs text-gray-400">
        Engagement: <span className="text-gray-100 font-semibold">{value}</span>
      </p>
    </div>
  );
};

const SkeletonLoader: React.FC<{ height: number }> = ({ height }) => (
  <div
    className="w-full animate-pulse bg-gray-800 rounded-lg"
    style={{ height }}
  >
    <div className="h-full flex items-center justify-center">
      <div className="text-gray-500">Loading heatmap data...</div>
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
          d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
        />
      </svg>
      <h3 className="mt-2 text-sm font-medium text-gray-400">No heatmap data</h3>
      <p className="mt-1 text-sm text-gray-500">
        Engagement patterns will appear here once data is available.
      </p>
    </div>
  </div>
);

export const EngagementHeatmap: React.FC<EngagementHeatmapProps> = React.memo(({
  videoId,
  dateRange,
  data,
  isLoading = false,
  className = '',
  height = 400,
}) => {
  const [tooltipData, setTooltipData] = React.useState<CustomTooltipProps | null>(null);

  const { heatmapMatrix, maxValue } = useMemo(() => {
    // Create a matrix for all days and hours
    const matrix = DAYS.map(day =>
      HOURS.map(hour => {
        const dataPoint = data.find(d => d.day === day && d.hour === hour);
        return {
          day,
          hour,
          value: dataPoint?.value || 0,
        };
      })
    );

    const max = Math.max(...data.map(d => d.value), 1);

    return { heatmapMatrix: matrix, maxValue: max };
  }, [data]);

  const handleCellHover = (hour: number, day: string, value: number) => {
    setTooltipData({ hour, day, value, active: true });
  };

  const handleCellLeave = () => {
    setTooltipData(null);
  };

  if (isLoading) {
    return <SkeletonLoader height={height} />;
  }

  if (!data || data.length === 0) {
    return <EmptyState height={height} />;
  }

  const cellSize = 28; // Size of each heatmap cell in pixels
  const gap = 2; // Gap between cells

  return (
    <div className={`w-full ${className}`} style={{ height }}>
      <div className="flex flex-col h-full">
        {/* Legend */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-300">
            Engagement by Time of Day
          </h3>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>Less</span>
            <div className="flex gap-1">
              <div className="w-4 h-4 bg-gray-800 rounded" />
              <div className="w-4 h-4 bg-purple-900 rounded" />
              <div className="w-4 h-4 bg-purple-700 rounded" />
              <div className="w-4 h-4 bg-purple-600 rounded" />
              <div className="w-4 h-4 bg-purple-500 rounded" />
            </div>
            <span>More</span>
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="flex overflow-x-auto pb-4">
          <div className="flex flex-col gap-1 mr-2">
            <div style={{ height: cellSize }} /> {/* Spacer for hour labels */}
            {DAYS.map(day => (
              <div
                key={day}
                className="text-xs text-gray-400 flex items-center justify-end pr-2"
                style={{ height: cellSize }}
              >
                {day}
              </div>
            ))}
          </div>

          <div className="flex flex-col">
            {/* Hour labels */}
            <div className="flex gap-1 mb-1">
              {HOURS.filter((_, i) => i % 3 === 0).map(hour => (
                <div
                  key={hour}
                  className="text-xs text-gray-400 text-center"
                  style={{ width: cellSize * 3 + gap * 2 }}
                >
                  {hour}
                </div>
              ))}
            </div>

            {/* Heatmap cells */}
            {heatmapMatrix.map((dayData, dayIndex) => (
              <div key={dayIndex} className="flex" style={{ gap: `${gap}px`, marginBottom: gap }}>
                {dayData.map((cell, hourIndex) => (
                  <div
                    key={hourIndex}
                    className={`rounded transition-all duration-200 hover:ring-2 hover:ring-purple-400 cursor-pointer ${getColorIntensity(cell.value, maxValue)}`}
                    style={{ width: cellSize, height: cellSize }}
                    onMouseEnter={() => handleCellHover(cell.hour, cell.day, cell.value)}
                    onMouseLeave={handleCellLeave}
                    aria-label={`${cell.day} at ${formatHour(cell.hour)}: ${cell.value} interactions`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Tooltip */}
        {tooltipData && (
          <div className="mt-4">
            <CustomTooltip {...tooltipData} />
          </div>
        )}
      </div>
    </div>
  );
});

EngagementHeatmap.displayName = 'EngagementHeatmap';
