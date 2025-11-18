'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface StorageData {
  date: string;
  storage_gb: number;
  cumulative_gb: number;
}

interface StorageUsageChartProps {
  data: StorageData[];
  quotaGb?: number; // Storage quota limit (default: 10GB for free tier)
}

export function StorageUsageChart({ data, quotaGb = 10 }: StorageUsageChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <div className="text-center">
          <p className="text-gray-11 mb-2">No storage data available</p>
          <p className="text-2 text-gray-10">Upload videos to see storage usage</p>
        </div>
      </div>
    );
  }

  // Format dates for display
  const formattedData = data.map((item) => ({
    ...item,
    displayDate: new Date(item.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
  }));

  // Get current storage usage
  const currentStorage = data[data.length - 1]?.cumulative_gb || 0;
  const storagePercent = (currentStorage / quotaGb) * 100;

  // Determine warning color
  const getStorageColor = (percent: number) => {
    if (percent >= 90) return 'var(--red-9)';
    if (percent >= 75) return 'var(--orange-9)';
    return 'var(--blue-9)';
  };

  const storageColor = getStorageColor(storagePercent);

  return (
    <div className="space-y-4">
      {/* Storage Summary */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center p-3 bg-gray-a2 rounded-lg">
          <div className="text-5 font-bold text-gray-12">{currentStorage.toFixed(2)} GB</div>
          <div className="text-2 text-gray-11">Current Usage</div>
        </div>
        <div className="text-center p-3 bg-gray-a2 rounded-lg">
          <div className="text-5 font-bold text-gray-12">{quotaGb} GB</div>
          <div className="text-2 text-gray-11">Storage Quota</div>
        </div>
        <div className="text-center p-3 bg-gray-a2 rounded-lg">
          <div
            className="text-5 font-bold"
            style={{
              color: storageColor,
            }}
          >
            {storagePercent.toFixed(1)}%
          </div>
          <div className="text-2 text-gray-11">Used</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-a3 rounded-full h-3 overflow-hidden">
        <div
          className="h-3 rounded-full transition-all duration-500"
          style={{
            width: `${Math.min(storagePercent, 100)}%`,
            backgroundColor: storageColor,
          }}
        />
      </div>

      {/* Area Chart */}
      <ResponsiveContainer width="100%" height={240} aspect={2}>
        <AreaChart data={formattedData}>
          <defs>
            <linearGradient id="colorStorage" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={storageColor} stopOpacity={0.8} />
              <stop offset="95%" stopColor={storageColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-a6)" />
          <XAxis
            dataKey="displayDate"
            stroke="var(--gray-11)"
            style={{ fontSize: '12px' }}
            tick={{ fill: 'var(--gray-11)' }}
          />
          <YAxis
            stroke="var(--gray-11)"
            style={{ fontSize: '12px' }}
            tick={{ fill: 'var(--gray-11)' }}
            label={{ value: 'Storage (GB)', angle: -90, position: 'insideLeft', fill: 'var(--gray-11)' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--gray-2)',
              border: '1px solid var(--gray-a6)',
              borderRadius: '8px',
              padding: '8px 12px',
            }}
            labelStyle={{ color: 'var(--gray-12)', fontWeight: 'bold' }}
            formatter={(value: number) => [`${value.toFixed(2)} GB`, 'Storage']}
          />
          <Area
            type="monotone"
            dataKey="cumulative_gb"
            stroke={storageColor}
            fillOpacity={1}
            fill="url(#colorStorage)"
            strokeWidth={2}
          />
          {/* Quota reference line */}
          <ReferenceLine
            y={quotaGb}
            stroke="var(--red-9)"
            strokeDasharray="3 3"
            strokeWidth={2}
            label={{
              value: `Quota: ${quotaGb} GB`,
              position: 'right',
              fill: 'var(--red-11)',
              fontSize: 12,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Warning message if near quota */}
      {storagePercent >= 75 && (
        <div
          className="p-3 rounded-lg text-sm"
          style={{
            backgroundColor: storagePercent >= 90 ? 'var(--red-a3)' : 'var(--orange-a3)',
            border: `1px solid ${storagePercent >= 90 ? 'var(--red-a6)' : 'var(--orange-a6)'}`,
            color: storagePercent >= 90 ? 'var(--red-11)' : 'var(--orange-11)',
          }}
        >
          {storagePercent >= 90 ? (
            <span className="font-medium">Storage almost full! Consider upgrading your plan or deleting unused videos.</span>
          ) : (
            <span className="font-medium">Storage usage is high ({storagePercent.toFixed(1)}%). Consider upgrading soon.</span>
          )}
        </div>
      )}
    </div>
  );
}
