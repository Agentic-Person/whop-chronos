/**
 * AICreditsUsageChart Component
 *
 * Line chart showing AI message credits usage over time with trend projection
 */

'use client';

import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { format } from 'date-fns';

interface AICreditsUsageChartProps {
  creatorId: string;
  monthlyLimit: number;
  timeRange?: number; // Days to show
}

interface TrendData {
  date: string;
  count: number;
  cumulative: number;
}

export function AICreditsUsageChart({
  creatorId,
  monthlyLimit,
  timeRange = 30,
}: AICreditsUsageChartProps) {
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrend = async () => {
      try {
        setError(null);
        const response = await fetch(
          `/api/analytics/usage/ai-trend?creatorId=${creatorId}&days=${timeRange}`,
        );

        if (!response.ok) {
          throw new Error('Failed to fetch AI usage trend');
        }

        const data = await response.json();
        setTrendData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchTrend();
  }, [creatorId, timeRange]);

  if (loading) {
    return (
      <div className="h-96 animate-pulse rounded-lg border border-gray-200 bg-gray-50" />
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
        Error loading AI usage trend: {error}
      </div>
    );
  }

  if (trendData.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center rounded-lg border border-gray-200 bg-gray-50">
        <p className="text-gray-500">No AI usage data yet</p>
      </div>
    );
  }

  // Calculate projected overage
  const currentUsage = trendData[trendData.length - 1]?.cumulative || 0;
  const isUnlimited = monthlyLimit === -1;
  const projectedOverage =
    !isUnlimited && currentUsage > monthlyLimit * 0.9;

  // Format data for chart
  const chartData = trendData.map((item) => ({
    date: format(new Date(item.date), 'MMM dd'),
    daily: item.count,
    cumulative: item.cumulative,
  }));

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            AI Message Usage
          </h3>
          <p className="text-sm text-gray-500">
            {isUnlimited
              ? 'Unlimited plan'
              : `${currentUsage.toLocaleString()} of ${monthlyLimit.toLocaleString()} messages this month`}
          </p>
        </div>

        {projectedOverage && (
          <div className="rounded-md bg-orange-50 px-3 py-2">
            <p className="text-xs font-medium text-orange-800">
              Approaching limit
            </p>
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis
            dataKey="date"
            stroke="#6b7280"
            style={{ fontSize: '0.75rem' }}
          />
          <YAxis stroke="#6b7280" style={{ fontSize: '0.75rem' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: '0.875rem' }}
            iconType="line"
          />

          {/* Monthly limit line */}
          {!isUnlimited && (
            <ReferenceLine
              y={monthlyLimit}
              label="Limit"
              stroke="#ef4444"
              strokeDasharray="5 5"
            />
          )}

          {/* Daily usage line */}
          <Line
            type="monotone"
            dataKey="daily"
            stroke="#3b82f6"
            strokeWidth={2}
            name="Daily Messages"
            dot={{ fill: '#3b82f6', r: 3 }}
          />

          {/* Cumulative usage line */}
          <Line
            type="monotone"
            dataKey="cumulative"
            stroke="#10b981"
            strokeWidth={2}
            name="Total This Month"
            dot={{ fill: '#10b981', r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>

      {projectedOverage && !isUnlimited && (
        <div className="mt-4 rounded-md bg-orange-50 p-3">
          <p className="text-sm text-orange-800">
            Based on current usage trends, you may exceed your monthly limit.
            Consider upgrading your plan.
          </p>
        </div>
      )}
    </div>
  );
}
