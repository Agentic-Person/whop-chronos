'use client';

import { useState, useEffect } from 'react';
import type { SessionMetrics } from './chat-types';

interface SessionInsightsCardProps {
  creatorId: string;
}

export function SessionInsightsCard({ creatorId }: SessionInsightsCardProps) {
  const [metrics, setMetrics] = useState<SessionMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/analytics/chat?creatorId=${creatorId}&metric=sessions`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch session metrics');
        }

        const result = await response.json();
        setMetrics(result.data || null);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setMetrics(null);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [creatorId]);

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return '↗️';
      case 'down':
        return '↘️';
      case 'stable':
        return '→';
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return 'text-green-600 dark:text-green-400';
      case 'down':
        return 'text-red-600 dark:text-red-400';
      case 'stable':
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-center h-48">
          <div className="text-gray-500 dark:text-gray-400">Loading session insights...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-center h-48">
          <div className="text-red-500">Error: {error}</div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-center h-48">
          <div className="text-gray-500 dark:text-gray-400">No session data available</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Session Insights
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          This month's chat session metrics
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Total Sessions */}
        <div className="space-y-2">
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Sessions</div>
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {metrics.totalSessions.toLocaleString()}
            </div>
            <div className={`text-sm font-medium ${getTrendColor(metrics.trend)}`}>
              {getTrendIcon(metrics.trend)} {metrics.trendPercentage.toFixed(1)}%
            </div>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-500">
            vs. last period
          </div>
        </div>

        {/* Avg Messages Per Session */}
        <div className="space-y-2">
          <div className="text-sm text-gray-600 dark:text-gray-400">Avg Messages/Session</div>
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {metrics.avgMessagesPerSession.toFixed(1)}
            </div>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-500">
            messages per session
          </div>
        </div>

        {/* Avg Session Duration */}
        <div className="space-y-2">
          <div className="text-sm text-gray-600 dark:text-gray-400">Avg Session Duration</div>
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {formatDuration(metrics.avgSessionDuration)}
            </div>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-500">
            average time per session
          </div>
        </div>

        {/* Completion Rate */}
        <div className="space-y-2">
          <div className="text-sm text-gray-600 dark:text-gray-400">Completion Rate</div>
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {(metrics.completionRate * 100).toFixed(0)}%
            </div>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-500">
            sessions ended naturally
          </div>
        </div>
      </div>

      {/* Progress Bar for Completion Rate */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-600 dark:text-gray-400">Session Quality</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {metrics.completionRate >= 0.8 ? 'Excellent' : metrics.completionRate >= 0.6 ? 'Good' : 'Needs Improvement'}
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${
              metrics.completionRate >= 0.8
                ? 'bg-green-600 dark:bg-green-500'
                : metrics.completionRate >= 0.6
                  ? 'bg-amber-600 dark:bg-amber-500'
                  : 'bg-red-600 dark:bg-red-500'
            }`}
            style={{ width: `${metrics.completionRate * 100}%` }}
          ></div>
        </div>
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-500">
          Higher completion rates indicate more satisfying chat interactions
        </div>
      </div>
    </div>
  );
}
