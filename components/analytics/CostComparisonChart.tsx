'use client';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface CostData {
  name: string;
  value: number;
  color: string;
  percentage: number;
}

interface CostComparisonChartProps {
  transcriptionCost: number;
  embeddingsCost: number;
  storageCost: number;
  chatCost: number;
}

export function CostComparisonChart({
  transcriptionCost,
  embeddingsCost,
  storageCost,
  chatCost,
}: CostComparisonChartProps) {
  const totalCost = transcriptionCost + embeddingsCost + storageCost + chatCost;

  if (totalCost === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-11 mb-2">No cost data yet</p>
          <p className="text-sm text-gray-10">Start using the platform to see cost breakdown</p>
        </div>
      </div>
    );
  }

  const data: CostData[] = [
    {
      name: 'Transcription',
      value: transcriptionCost,
      color: '#3b82f6', // blue
      percentage: (transcriptionCost / totalCost) * 100,
    },
    {
      name: 'Embeddings',
      value: embeddingsCost,
      color: '#10b981', // green
      percentage: (embeddingsCost / totalCost) * 100,
    },
    {
      name: 'Storage',
      value: storageCost,
      color: '#8b5cf6', // purple
      percentage: (storageCost / totalCost) * 100,
    },
    {
      name: 'Chat',
      value: chatCost,
      color: '#f59e0b', // orange
      percentage: (chatCost / totalCost) * 100,
    },
  ].filter(item => item.value > 0); // Only show segments with cost

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-a2 border border-gray-a6 rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-gray-12">{data.name}</p>
          <p className="text-lg font-bold text-gray-12">${data.value.toFixed(4)}</p>
          <p className="text-xs text-gray-11">{data.percentage.toFixed(1)}% of total</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Pie Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data as any[]}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(props: any) => {
                const percentage = (props.value / totalCost) * 100;
                if (percentage < 5) return '';
                return `${percentage.toFixed(0)}%`;
              }}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={(value, entry: any) => {
                const data = entry.payload;
                return `${value}: $${data.value.toFixed(4)}`;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Cost Breakdown List */}
      <div className="grid grid-cols-2 gap-4">
        {data.map((item) => (
          <div key={item.name} className="bg-gray-a2 rounded-lg p-4 border border-gray-a6">
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-gray-11">{item.name}</span>
            </div>
            <div className="text-2xl font-bold text-gray-12">${item.value.toFixed(4)}</div>
            <div className="text-xs text-gray-11 mt-1">{item.percentage.toFixed(1)}% of total</div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="bg-gradient-to-br from-blue-a3 to-purple-a3 rounded-lg p-4 border border-gray-a6">
        <div className="text-sm text-gray-11 mb-1">Total Cost</div>
        <div className="text-3xl font-bold text-gray-12">${totalCost.toFixed(4)}</div>
      </div>
    </div>
  );
}
