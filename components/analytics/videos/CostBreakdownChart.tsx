'use client';

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface CostData {
  method: string;
  total_cost: number;
  video_count: number;
}

interface CostBreakdownChartProps {
  data: CostData[];
}

// Color mapping for different transcript methods
const COLORS: Record<string, string> = {
  youtube_captions: 'var(--green-9)', // FREE
  loom_api: 'var(--green-9)', // FREE
  mux_auto: 'var(--green-9)', // FREE
  whisper: 'var(--orange-9)', // PAID
  unknown: 'var(--gray-9)',
};

// Display names for methods
const METHOD_NAMES: Record<string, string> = {
  youtube_captions: 'YouTube Captions (FREE)',
  loom_api: 'Loom API (FREE)',
  mux_auto: 'Mux Auto (FREE)',
  whisper: 'Whisper (PAID)',
  unknown: 'Unknown',
};

export function CostBreakdownChart({ data }: CostBreakdownChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <div className="text-center">
          <p className="text-gray-11 mb-2">No cost data available</p>
          <p className="text-2 text-gray-10">Upload or import videos to see cost breakdown</p>
        </div>
      </div>
    );
  }

  // Calculate total cost
  const totalCost = data.reduce((sum, item) => sum + item.total_cost, 0);
  const totalVideos = data.reduce((sum, item) => sum + item.video_count, 0);

  // Format data for pie chart
  const chartData = data.map((item) => ({
    name: METHOD_NAMES[item.method] || item.method,
    value: item.total_cost,
    videoCount: item.video_count,
    percentage: totalCost > 0 ? ((item.total_cost / totalCost) * 100).toFixed(1) : '0',
  }));

  // Custom label for pie slices
  const renderLabel = (entry: any) => {
    return `${entry.percentage}%`;
  };

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center p-3 bg-gray-a2 rounded-lg">
          <div className="text-5 font-bold text-gray-12">${totalCost.toFixed(2)}</div>
          <div className="text-2 text-gray-11">Total Cost</div>
        </div>
        <div className="text-center p-3 bg-gray-a2 rounded-lg">
          <div className="text-5 font-bold text-gray-12">{totalVideos}</div>
          <div className="text-2 text-gray-11">Videos Processed</div>
        </div>
      </div>

      {/* Pie Chart */}
      <ResponsiveContainer width="100%" height={240} aspect={2}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderLabel}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((_entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[data[index]?.method ?? 'unknown'] || COLORS['unknown']}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--gray-2)',
              border: '1px solid var(--gray-a6)',
              borderRadius: '8px',
              padding: '8px 12px',
            }}
            formatter={(value: number, name: string, props: any) => {
              return [
                <div key="tooltip-content">
                  <div className="font-bold text-gray-12">{name}</div>
                  <div className="text-gray-11">Cost: ${value.toFixed(2)}</div>
                  <div className="text-gray-11">Videos: {props.payload.videoCount}</div>
                </div>,
                '',
              ];
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            wrapperStyle={{ fontSize: '12px' }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Cost Breakdown List */}
      <div className="space-y-2 text-xs">
        {chartData.map((item, index) => (
          <div key={index} className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor: COLORS[data[index]?.method ?? 'unknown'] || COLORS['unknown'],
                }}
              />
              <span className="text-gray-11">{item.name}</span>
            </div>
            <span className="text-gray-12 font-medium">${item.value.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
