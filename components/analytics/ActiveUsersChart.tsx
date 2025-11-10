'use client';

/**
 * Active Users Chart Component
 * Displays Daily Active Users (DAU) and Monthly Active Users (MAU)
 * with period-over-period comparison
 */

import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { ActiveUserData, TimeRange } from './engagement-types';

interface ActiveUsersChartProps {
  creatorId: string;
  timeRange?: TimeRange;
  data?: ActiveUserData[];
  isLoading?: boolean;
}

type ViewMode = 'dau' | 'mau' | 'both';

export default function ActiveUsersChart({
  creatorId,
  timeRange = '30d',
  data = [],
  isLoading = false,
}: ActiveUsersChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('both');

  // Calculate summary metrics
  const latestData = data[data.length - 1];
  const previousData = data[data.length - 2];
  const dauChange = latestData?.change || 0;
  const currentDAU = latestData?.dau || 0;
  const currentMAU = latestData?.mau || 0;

  // Calculate MAU change
  const mauChange = previousData
    ? Math.round(
        ((currentMAU - previousData.mau) / previousData.mau) * 100
      )
    : 0;

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-1/4 mb-4" />
          <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded" />
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
            Active Users
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Daily and monthly active user trends
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('dau')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              viewMode === 'dau'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            DAU
          </button>
          <button
            onClick={() => setViewMode('mau')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              viewMode === 'mau'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            MAU
          </button>
          <button
            onClick={() => setViewMode('both')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              viewMode === 'both'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Both
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
          <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
            Daily Active Users
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {currentDAU.toLocaleString()}
            </div>
            <div
              className={`text-sm font-medium ${
                dauChange >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {dauChange >= 0 ? '+' : ''}
              {dauChange}%
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20">
          <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">
            Monthly Active Users
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {currentMAU.toLocaleString()}
            </div>
            <div
              className={`text-sm font-medium ${
                mauChange >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {mauChange >= 0 ? '+' : ''}
              {mauChange}%
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#374151"
            opacity={0.1}
          />
          <XAxis
            dataKey="date"
            stroke="#9CA3AF"
            fontSize={12}
            tickFormatter={(value) => {
              const date = new Date(value);
              return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              });
            }}
          />
          <YAxis
            yAxisId="left"
            stroke="#3B82F6"
            fontSize={12}
            label={{
              value: 'DAU',
              angle: -90,
              position: 'insideLeft',
              style: { fill: '#3B82F6' },
            }}
          />
          {viewMode === 'both' && (
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#8B5CF6"
              fontSize={12}
              label={{
                value: 'MAU',
                angle: 90,
                position: 'insideRight',
                style: { fill: '#8B5CF6' },
              }}
            />
          )}
          <Tooltip
            contentStyle={{
              backgroundColor: '#1F2937',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
            }}
            formatter={(value: number) => value.toLocaleString()}
          />
          <Legend />

          {(viewMode === 'dau' || viewMode === 'both') && (
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="dau"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={{ fill: '#3B82F6', r: 4 }}
              activeDot={{ r: 6 }}
              name="Daily Active Users"
            />
          )}

          {(viewMode === 'mau' || viewMode === 'both') && (
            <Line
              yAxisId={viewMode === 'both' ? 'right' : 'left'}
              type="monotone"
              dataKey="mau"
              stroke="#8B5CF6"
              strokeWidth={2}
              dot={{ fill: '#8B5CF6', r: 4 }}
              activeDot={{ r: 6 }}
              name="Monthly Active Users"
            />
          )}
        </LineChart>
      </ResponsiveContainer>

      {/* Empty State */}
      {data.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            No active user data available
          </p>
        </div>
      )}
    </div>
  );
}
