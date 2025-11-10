'use client';

import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { QualityMetrics } from './chat-types';

interface ResponseQualityChartProps {
  creatorId: string;
  dateRange?: string;
}

interface QualityData {
  name: string;
  value: number;
  target: number;
  unit: string;
}

export function ResponseQualityChart({
  creatorId,
  dateRange = '30d',
}: ResponseQualityChartProps) {
  const [metrics, setMetrics] = useState<QualityMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/analytics/chat?creatorId=${creatorId}&timeRange=${dateRange}&metric=quality`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch quality metrics');
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
  }, [creatorId, dateRange]);

  if (loading) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Loading quality metrics...</div>
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

  if (!metrics) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">No quality data available</div>
      </div>
    );
  }

  const data: QualityData[] = [
    {
      name: 'Avg Response Length',
      value: metrics.avgLength,
      target: 150,
      unit: 'words',
    },
    {
      name: 'Citation Rate',
      value: metrics.citationRate * 100,
      target: 80,
      unit: '%',
    },
    {
      name: 'Follow-up Rate',
      value: metrics.followUpRate * 100,
      target: 60,
      unit: '%',
    },
    {
      name: 'Satisfaction Score',
      value: (metrics.satisfactionScore || 0) * 100,
      target: 85,
      unit: '%',
    },
  ];

  const getBarColor = (value: number, target: number) => {
    const ratio = value / target;
    if (ratio >= 0.9) return '#10b981'; // green
    if (ratio >= 0.7) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          AI Response Quality Metrics
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Performance indicators with target benchmarks
        </p>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
          <XAxis
            dataKey="name"
            className="text-gray-600 dark:text-gray-400"
            tick={{ fontSize: 12 }}
            angle={-15}
            textAnchor="end"
            height={80}
          />
          <YAxis
            className="text-gray-600 dark:text-gray-400"
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
            }}
            formatter={(value: number, name: string, props: any) => [
              `${value.toFixed(1)} ${props.payload.unit}`,
              name,
            ]}
          />
          <Legend />
          <Bar
            dataKey="value"
            name="Current"
            radius={[8, 8, 0, 0]}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={getBarColor(entry.value, entry.target)}
              />
            ))}
          </Bar>
          <Bar
            dataKey="target"
            name="Target"
            fill="#9ca3af"
            fillOpacity={0.3}
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        {data.map((metric, index) => {
          const ratio = metric.value / metric.target;
          const status =
            ratio >= 0.9 ? 'Excellent' : ratio >= 0.7 ? 'Good' : 'Needs Improvement';
          const statusColor =
            ratio >= 0.9
              ? 'text-green-600 dark:text-green-400'
              : ratio >= 0.7
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-red-600 dark:text-red-400';

          return (
            <div key={index} className="text-center">
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                {metric.value.toFixed(1)}
                {metric.unit === '%' ? '%' : ` ${metric.unit}`}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">{metric.name}</div>
              <div className={`text-xs font-medium ${statusColor}`}>{status}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
