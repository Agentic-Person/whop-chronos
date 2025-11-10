'use client';

import { useState, useEffect } from 'react';
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
import type { ChatVolumeData, TimeRange } from './chat-types';

interface ChatVolumeChartProps {
  creatorId: string;
  timeRange?: TimeRange;
}

export function ChatVolumeChart({
  creatorId,
  timeRange = '30d',
}: ChatVolumeChartProps) {
  const [data, setData] = useState<ChatVolumeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/analytics/chat?creatorId=${creatorId}&timeRange=${timeRange}&metric=volume`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch chat volume data');
        }

        const result = await response.json();
        setData(result.data || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setData([]);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [creatorId, timeRange]);

  if (loading) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Loading chat volume data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">No chat data available</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Chat Volume Over Time
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Student messages, AI responses, and average response time
        </p>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
          <XAxis
            dataKey="date"
            className="text-gray-600 dark:text-gray-400"
            tick={{ fontSize: 12 }}
          />
          <YAxis
            yAxisId="left"
            className="text-gray-600 dark:text-gray-400"
            tick={{ fontSize: 12 }}
            label={{ value: 'Messages', angle: -90, position: 'insideLeft' }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            className="text-gray-600 dark:text-gray-400"
            tick={{ fontSize: 12 }}
            label={{
              value: 'Response Time (s)',
              angle: 90,
              position: 'insideRight',
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
            }}
            labelClassName="font-semibold"
          />
          <Legend />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="studentMessages"
            stackId="1"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.6}
            name="Student Messages"
          />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="aiResponses"
            stackId="1"
            stroke="#8b5cf6"
            fill="#8b5cf6"
            fillOpacity={0.6}
            name="AI Responses"
          />
          <Area
            yAxisId="right"
            type="monotone"
            dataKey="avgResponseTime"
            stroke="#10b981"
            fill="none"
            strokeWidth={2}
            name="Avg Response Time (s)"
            dot={{ fill: '#10b981', r: 3 }}
          />
        </AreaChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {data.reduce((sum, d) => sum + d.studentMessages, 0).toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Student Messages</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {data.reduce((sum, d) => sum + d.aiResponses, 0).toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total AI Responses</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {(
              data.reduce((sum, d) => sum + d.avgResponseTime, 0) / data.length
            ).toFixed(1)}
            s
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Avg Response Time</div>
        </div>
      </div>
    </div>
  );
}
