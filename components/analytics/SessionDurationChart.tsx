'use client';

/**
 * Session Duration Chart Component
 * Displays histogram of session length distribution
 * Shows average session duration indicator
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { SessionDurationData, TimeRange } from './engagement-types';

interface SessionDurationChartProps {
  creatorId: string;
  dateRange?: TimeRange;
  data?: SessionDurationData[];
  averageDuration?: number; // in minutes
  isLoading?: boolean;
}

export default function SessionDurationChart({
  creatorId,
  dateRange = '30d',
  data = [],
  averageDuration = 0,
  isLoading = false,
}: SessionDurationChartProps) {
  // Calculate total sessions
  const totalSessions = data.reduce((sum, bucket) => sum + bucket.count, 0);

  // Calculate median bucket (where 50% of sessions fall)
  let cumulativeCount = 0;
  let medianBucket = '';
  for (const bucket of data) {
    cumulativeCount += bucket.count;
    if (cumulativeCount >= totalSessions / 2) {
      medianBucket = bucket.bucket;
      break;
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-1/4 mb-4" />
          <div className="h-80 bg-gray-200 dark:bg-gray-800 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Session Duration
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Distribution of student session lengths
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
          <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
            Total Sessions
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {totalSessions.toLocaleString()}
          </div>
        </div>

        <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20">
          <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">
            Average Duration
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {averageDuration}m
          </div>
        </div>

        <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
          <div className="text-sm text-green-600 dark:text-green-400 font-medium">
            Median Range
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {medianBucket || 'N/A'}
          </div>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#374151"
            opacity={0.1}
          />
          <XAxis
            dataKey="bucket"
            stroke="#9CA3AF"
            fontSize={12}
            label={{
              value: 'Session Duration',
              position: 'insideBottom',
              offset: -5,
            }}
          />
          <YAxis
            stroke="#9CA3AF"
            fontSize={12}
            label={{
              value: 'Number of Sessions',
              angle: -90,
              position: 'insideLeft',
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1F2937',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
            }}
            formatter={(value: number, name: string, props: any) => {
              const percentage = totalSessions > 0
                ? ((value as number / totalSessions) * 100).toFixed(1)
                : 0;
              return [`${value} sessions (${percentage}%)`, 'Count'];
            }}
          />
          <Bar
            dataKey="count"
            fill="#3B82F6"
            radius={[8, 8, 0, 0]}
            name="Sessions"
          />
        </BarChart>
      </ResponsiveContainer>

      {/* Engagement Insights */}
      <div className="mt-6 p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          Engagement Insights
        </h4>
        <div className="space-y-2 text-sm">
          {averageDuration >= 30 && (
            <div className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span className="text-gray-700 dark:text-gray-300">
                Strong engagement: Average session exceeds 30 minutes
              </span>
            </div>
          )}
          {averageDuration < 30 && averageDuration >= 15 && (
            <div className="flex items-start gap-2">
              <span className="text-yellow-500">•</span>
              <span className="text-gray-700 dark:text-gray-300">
                Moderate engagement: Consider adding interactive elements
              </span>
            </div>
          )}
          {averageDuration < 15 && totalSessions > 0 && (
            <div className="flex items-start gap-2">
              <span className="text-red-500">!</span>
              <span className="text-gray-700 dark:text-gray-300">
                Low engagement: Students may need more compelling content
              </span>
            </div>
          )}
          {data.find((d) => d.bucket === '60m+')?.count > totalSessions * 0.2 && (
            <div className="flex items-start gap-2">
              <span className="text-blue-500">★</span>
              <span className="text-gray-700 dark:text-gray-300">
                20%+ of sessions exceed 1 hour - excellent retention
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Distribution Table */}
      <div className="mt-6">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          Duration Breakdown
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="text-left py-2 px-3 text-gray-700 dark:text-gray-300 font-medium">
                  Duration Range
                </th>
                <th className="text-center py-2 px-3 text-gray-700 dark:text-gray-300 font-medium">
                  Sessions
                </th>
                <th className="text-center py-2 px-3 text-gray-700 dark:text-gray-300 font-medium">
                  Percentage
                </th>
                <th className="text-right py-2 px-3 text-gray-700 dark:text-gray-300 font-medium">
                  Visual
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((bucket, index) => {
                const percentage = totalSessions > 0
                  ? (bucket.count / totalSessions) * 100
                  : 0;

                return (
                  <tr
                    key={index}
                    className="border-b border-gray-100 dark:border-gray-800"
                  >
                    <td className="py-2 px-3 text-gray-900 dark:text-white font-medium">
                      {bucket.bucket}
                    </td>
                    <td className="text-center py-2 px-3 text-gray-600 dark:text-gray-400">
                      {bucket.count.toLocaleString()}
                    </td>
                    <td className="text-center py-2 px-3 text-gray-600 dark:text-gray-400">
                      {percentage.toFixed(1)}%
                    </td>
                    <td className="text-right py-2 px-3">
                      <div className="flex justify-end">
                        <div
                          className="h-4 bg-blue-500 rounded"
                          style={{ width: `${percentage}%`, minWidth: '2px' }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {data.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            No session duration data available
          </p>
        </div>
      )}
    </div>
  );
}
