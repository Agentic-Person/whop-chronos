'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface ViewsData {
  date: string;
  views: number;
}

interface ViewsOverTimeChartProps {
  data: ViewsData[];
}

export function ViewsOverTimeChart({ data }: ViewsOverTimeChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <p className="text-gray-11">No view data available for this period</p>
      </div>
    );
  }

  // Format dates for display (show only month/day)
  const formattedData = data.map((item) => ({
    ...item,
    displayDate: new Date(item.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
  }));

  return (
    <ResponsiveContainer width="100%" height={300} aspect={2}>
      <LineChart data={formattedData}>
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
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--gray-2)',
            border: '1px solid var(--gray-a6)',
            borderRadius: '8px',
            padding: '8px 12px',
          }}
          labelStyle={{ color: 'var(--gray-12)', fontWeight: 'bold', marginBottom: '4px' }}
          itemStyle={{ color: 'var(--accent-11)' }}
          cursor={{ stroke: 'var(--gray-a6)', strokeWidth: 1 }}
        />
        <Line
          type="monotone"
          dataKey="views"
          stroke="var(--accent-9)"
          strokeWidth={2}
          dot={{ r: 3, fill: 'var(--accent-9)' }}
          activeDot={{ r: 5, fill: 'var(--accent-10)' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
