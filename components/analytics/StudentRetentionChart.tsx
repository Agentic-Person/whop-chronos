'use client';

/**
 * Student Retention Chart Component
 * Displays cohort retention rates in heatmap style
 * Shows percentage of students returning each week
 */

import type { RetentionData } from './engagement-types';

interface StudentRetentionChartProps {
  creatorId: string;
  cohortSize?: number;
  data?: RetentionData[];
  isLoading?: boolean;
}

export default function StudentRetentionChart({
  creatorId,
  cohortSize = 5,
  data = [],
  isLoading = false,
}: StudentRetentionChartProps) {
  // Get color intensity based on retention percentage
  const getColorIntensity = (percentage: number): string => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-green-400';
    if (percentage >= 40) return 'bg-yellow-400';
    if (percentage >= 20) return 'bg-orange-400';
    if (percentage > 0) return 'bg-red-400';
    return 'bg-gray-300 dark:bg-gray-700';
  };

  const weeks = Array.from({ length: 13 }, (_, i) => i); // Week 0-12

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-1/4 mb-4" />
          <div className="h-96 bg-gray-200 dark:bg-gray-800 rounded" />
        </div>
      </div>
    );
  }

  // Calculate average retention per week
  const avgRetentionByWeek = weeks.map((week) => {
    if (week === 0) return 100;
    if (!data.length) return 0;

    const weekKey = `week${week}` as keyof RetentionData;
    const total = data.reduce((sum, cohort) => {
      return sum + (cohort[weekKey] as number || 0);
    }, 0);
    return Math.round(total / data.length);
  });

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Student Retention
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Cohort retention rates over 12 weeks
        </p>
      </div>

      {/* Average Retention Summary */}
      <div className="mb-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
        <div className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-2">
          Average Retention
        </div>
        <div className="flex gap-1">
          {avgRetentionByWeek.slice(0, 13).map((retention, week) => (
            <div key={week} className="flex-1 text-center">
              <div
                className={`h-8 rounded ${getColorIntensity(retention)} flex items-center justify-center text-xs font-semibold text-white`}
              >
                {retention}%
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                W{week}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Retention Heatmap */}
      <div className="overflow-x-auto">
        <div className="min-w-max">
          {/* Header Row */}
          <div className="flex gap-2 mb-2">
            <div className="w-32 text-xs font-medium text-gray-700 dark:text-gray-300">
              Cohort
            </div>
            {weeks.map((week) => (
              <div
                key={week}
                className="w-16 text-center text-xs font-medium text-gray-700 dark:text-gray-300"
              >
                Week {week}
              </div>
            ))}
          </div>

          {/* Cohort Rows */}
          {data.slice(0, cohortSize).map((cohort, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <div className="w-32 text-xs text-gray-600 dark:text-gray-400 flex items-center">
                {cohort.cohort}
              </div>
              {weeks.map((week) => {
                const weekKey = `week${week}` as keyof RetentionData;
                const retention = cohort[weekKey] as number || 0;
                return (
                  <div
                    key={week}
                    className="w-16 relative group"
                  >
                    <div
                      className={`h-10 rounded ${getColorIntensity(retention)} flex items-center justify-center text-xs font-semibold text-white cursor-pointer transition-transform hover:scale-105`}
                    >
                      {retention}%
                    </div>
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                      {cohort.cohort}: {retention}% retention
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center gap-4 text-xs">
        <span className="text-gray-600 dark:text-gray-400 font-medium">
          Retention Rate:
        </span>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500" />
          <span className="text-gray-600 dark:text-gray-400">80%+</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-400" />
          <span className="text-gray-600 dark:text-gray-400">60-79%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-yellow-400" />
          <span className="text-gray-600 dark:text-gray-400">40-59%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-orange-400" />
          <span className="text-gray-600 dark:text-gray-400">20-39%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-400" />
          <span className="text-gray-600 dark:text-gray-400">0-19%</span>
        </div>
      </div>

      {/* Empty State */}
      {data.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            No retention data available
          </p>
        </div>
      )}
    </div>
  );
}
