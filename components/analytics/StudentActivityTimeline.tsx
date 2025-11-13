'use client';

/**
 * Student Activity Timeline Component
 * Displays stacked area chart showing activity types over time
 * Video views, chat messages, and course progress events
 */

import { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { ActivityTimelineData, TimeRange } from './engagement-types';

interface StudentActivityTimelineProps {
  creatorId: string;
  dateRange?: TimeRange;
  data?: ActivityTimelineData[];
  isLoading?: boolean;
}

type ActivityType = 'videoViews' | 'chatMessages' | 'courseProgress';

export default function StudentActivityTimeline({
  creatorId: _creatorId,
  dateRange: _dateRange = '30d',
  data = [],
  isLoading = false,
}: StudentActivityTimelineProps) {
  const [hiddenActivities, setHiddenActivities] = useState<Set<ActivityType>>(
    new Set()
  );

  // Toggle activity visibility
  const toggleActivity = (activity: ActivityType) => {
    setHiddenActivities((prev) => {
      const next = new Set(prev);
      if (next.has(activity)) {
        next.delete(activity);
      } else {
        next.add(activity);
      }
      return next;
    });
  };

  // Calculate totals
  const totals = data.reduce(
    (acc, day) => ({
      videoViews: acc.videoViews + day.videoViews,
      chatMessages: acc.chatMessages + day.chatMessages,
      courseProgress: acc.courseProgress + day.courseProgress,
      total: acc.total + day.total,
    }),
    { videoViews: 0, chatMessages: 0, courseProgress: 0, total: 0 }
  );

  // Calculate daily average
  const avgTotal = data.length > 0 ? Math.round(totals.total / data.length) : 0;

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
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Student Activity Timeline
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Activity breakdown over time
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
          <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
            Video Views
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {totals.videoViews.toLocaleString()}
          </div>
        </div>

        <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
          <div className="text-sm text-green-600 dark:text-green-400 font-medium">
            Chat Messages
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {totals.chatMessages.toLocaleString()}
          </div>
        </div>

        <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20">
          <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">
            Course Progress
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {totals.courseProgress.toLocaleString()}
          </div>
        </div>

        <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
          <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
            Avg Daily
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {avgTotal.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Activity Type Toggles */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => toggleActivity('videoViews')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
            hiddenActivities.has('videoViews')
              ? 'bg-gray-100 dark:bg-gray-800 opacity-50'
              : 'bg-blue-50 dark:bg-blue-900/20'
          }`}
        >
          <div className="w-3 h-3 rounded bg-blue-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Video Views
          </span>
        </button>

        <button
          onClick={() => toggleActivity('chatMessages')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
            hiddenActivities.has('chatMessages')
              ? 'bg-gray-100 dark:bg-gray-800 opacity-50'
              : 'bg-green-50 dark:bg-green-900/20'
          }`}
        >
          <div className="w-3 h-3 rounded bg-green-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Chat Messages
          </span>
        </button>

        <button
          onClick={() => toggleActivity('courseProgress')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
            hiddenActivities.has('courseProgress')
              ? 'bg-gray-100 dark:bg-gray-800 opacity-50'
              : 'bg-purple-50 dark:bg-purple-900/20'
          }`}
        >
          <div className="w-3 h-3 rounded bg-purple-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Course Progress
          </span>
        </button>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={350}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorVideoViews" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="colorChatMessages" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient
              id="colorCourseProgress"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1} />
            </linearGradient>
          </defs>
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
          <YAxis stroke="#9CA3AF" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1F2937',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
            }}
            labelFormatter={(label) => {
              const date = new Date(label);
              return date.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              });
            }}
          />
          <Legend />

          {!hiddenActivities.has('courseProgress') && (
            <Area
              type="monotone"
              dataKey="courseProgress"
              stackId="1"
              stroke="#8B5CF6"
              fill="url(#colorCourseProgress)"
              name="Course Progress"
            />
          )}

          {!hiddenActivities.has('chatMessages') && (
            <Area
              type="monotone"
              dataKey="chatMessages"
              stackId="1"
              stroke="#10B981"
              fill="url(#colorChatMessages)"
              name="Chat Messages"
            />
          )}

          {!hiddenActivities.has('videoViews') && (
            <Area
              type="monotone"
              dataKey="videoViews"
              stackId="1"
              stroke="#3B82F6"
              fill="url(#colorVideoViews)"
              name="Video Views"
            />
          )}
        </AreaChart>
      </ResponsiveContainer>

      {/* Activity Distribution */}
      <div className="mt-6 p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          Activity Distribution
        </h4>
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-700 dark:text-gray-300">
                Video Views
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {totals.total > 0
                  ? ((totals.videoViews / totals.total) * 100).toFixed(1)
                  : 0}
                %
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{
                  width: `${
                    totals.total > 0
                      ? (totals.videoViews / totals.total) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-700 dark:text-gray-300">
                Chat Messages
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {totals.total > 0
                  ? ((totals.chatMessages / totals.total) * 100).toFixed(1)
                  : 0}
                %
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{
                  width: `${
                    totals.total > 0
                      ? (totals.chatMessages / totals.total) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-700 dark:text-gray-300">
                Course Progress
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {totals.total > 0
                  ? ((totals.courseProgress / totals.total) * 100).toFixed(1)
                  : 0}
                %
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-purple-500 h-2 rounded-full transition-all"
                style={{
                  width: `${
                    totals.total > 0
                      ? (totals.courseProgress / totals.total) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {data.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            No activity data available
          </p>
        </div>
      )}
    </div>
  );
}
