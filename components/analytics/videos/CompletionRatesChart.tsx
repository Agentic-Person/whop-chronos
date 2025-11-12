'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface CompletionRateData {
  video_id: string;
  title: string;
  completion_rate: number;
  views: number;
}

interface CompletionRatesChartProps {
  data: CompletionRateData[];
}

// Color gradient based on completion rate
function getBarColor(rate: number): string {
  if (rate >= 70) return 'var(--green-9)';
  if (rate >= 50) return 'var(--yellow-9)';
  if (rate >= 30) return 'var(--orange-9)';
  return 'var(--red-9)';
}

// Truncate long titles
function truncateTitle(title: string, maxLength: number = 25): string {
  if (title.length <= maxLength) return title;
  return title.substring(0, maxLength - 3) + '...';
}

export function CompletionRatesChart({ data }: CompletionRatesChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <p className="text-gray-11">No completion data available</p>
      </div>
    );
  }

  // Limit to top 10 videos and truncate titles
  const displayData = data.slice(0, 10).map((item) => ({
    ...item,
    displayTitle: truncateTitle(item.title),
    completion_rate: Math.round(item.completion_rate * 10) / 10, // Round to 1 decimal
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={displayData}
        layout="vertical"
        margin={{ top: 5, right: 30, left: 150, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-a6)" />
        <XAxis
          type="number"
          domain={[0, 100]}
          stroke="var(--gray-11)"
          style={{ fontSize: '12px' }}
          tick={{ fill: 'var(--gray-11)' }}
          label={{ value: 'Completion Rate (%)', position: 'bottom', fill: 'var(--gray-11)' }}
        />
        <YAxis
          type="category"
          dataKey="displayTitle"
          stroke="var(--gray-11)"
          style={{ fontSize: '11px' }}
          tick={{ fill: 'var(--gray-11)' }}
          width={150}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--gray-2)',
            border: '1px solid var(--gray-a6)',
            borderRadius: '8px',
            padding: '8px 12px',
          }}
          cursor={{ fill: 'var(--gray-a3)' }}
          formatter={(value: number, name: string, props: any) => {
            if (name === 'completion_rate') {
              return [
                <div key="tooltip-content">
                  <div className="font-bold text-gray-12">{props.payload.title}</div>
                  <div className="text-gray-11">Completion: {value}%</div>
                  <div className="text-gray-11">Views: {props.payload.views}</div>
                </div>,
                '',
              ];
            }
            return [value, name];
          }}
        />
        <Bar dataKey="completion_rate" radius={[0, 4, 4, 0]}>
          {displayData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getBarColor(entry.completion_rate)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
