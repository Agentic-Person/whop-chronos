/**
 * StorageBreakdownChart Component
 *
 * Pie chart showing storage usage breakdown by video
 */

'use client';

import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { formatStorage } from '@/lib/analytics/usage';
import type { StorageBreakdown } from './usage-types';

interface StorageBreakdownChartProps {
  creatorId: string;
  onVideoClick?: (videoId: string) => void;
}

const COLORS = [
  '#3b82f6', // blue-500
  '#10b981', // green-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
  '#f97316', // orange-500
  '#6366f1', // indigo-500
  '#14b8a6', // teal-500
];

interface ChartDataItem {
  name: string;
  value: number;
  videoId: string;
  sizeGB: number;
}

export function StorageBreakdownChart({
  creatorId,
  onVideoClick,
}: StorageBreakdownChartProps) {
  const [breakdown, setBreakdown] = useState<StorageBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBreakdown = async () => {
      try {
        setError(null);
        const response = await fetch(
          `/api/analytics/usage/storage-breakdown?creatorId=${creatorId}`,
        );

        if (!response.ok) {
          throw new Error('Failed to fetch storage breakdown');
        }

        const data = await response.json();
        setBreakdown(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchBreakdown();
  }, [creatorId]);

  if (loading) {
    return (
      <div className="h-80 animate-pulse rounded-lg border border-gray-200 bg-gray-50" />
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
        Error loading storage breakdown: {error}
      </div>
    );
  }

  if (breakdown.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center rounded-lg border border-gray-200 bg-gray-50">
        <p className="text-gray-500">No videos uploaded yet</p>
      </div>
    );
  }

  // Take top 10, group rest as "Other"
  const top10 = breakdown.slice(0, 10);
  const rest = breakdown.slice(10);

  const chartData: ChartDataItem[] = top10.map((item) => ({
    name:
      item.videoTitle.length > 30
        ? `${item.videoTitle.slice(0, 30)}...`
        : item.videoTitle,
    value: item.sizeBytes,
    videoId: item.videoId,
    sizeGB: item.sizeGB,
  }));

  if (rest.length > 0) {
    const otherSize = rest.reduce((sum, item) => sum + item.sizeBytes, 0);
    chartData.push({
      name: `Other (${rest.length} videos)`,
      value: otherSize,
      videoId: 'other',
      sizeGB: otherSize / (1024 * 1024 * 1024),
    });
  }

  const handleClick = (data: ChartDataItem) => {
    if (data.videoId !== 'other' && onVideoClick) {
      onVideoClick(data.videoId);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">
        Storage Breakdown
      </h3>

      <ResponsiveContainer width="100%" height={300} aspect={2}>
        <PieChart>
          <Pie
            data={chartData as any}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={(entry: any) => `${entry.sizeGB.toFixed(2)} GB`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            onClick={(data) => handleClick(data as unknown as ChartDataItem)}
            className="cursor-pointer"
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${entry.videoId}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => formatStorage(value)}
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => (
              <span className="text-sm text-gray-700">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="mt-4 border-t border-gray-200 pt-4">
        <p className="text-sm text-gray-500">
          Click on a segment to view video details
        </p>
      </div>
    </div>
  );
}
