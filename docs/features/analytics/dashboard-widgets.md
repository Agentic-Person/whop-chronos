# Analytics Dashboard Widgets

## Overview

This guide provides a reference for all Recharts components used in the Chronos analytics dashboards, with configuration examples and best practices.

## Recharts Configuration Guide

### General Setup

**Installation:**
```bash
npm install recharts
```

**Common Imports:**
```typescript
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
```

### Widget Types

## 1. Line Chart

**Use Case:** Time-series data (views over time, trends)

**Basic Configuration:**
```typescript
<ResponsiveContainer width="100%" height={300}>
  <LineChart data={data}>
    <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-a6)" />
    <XAxis
      dataKey="date"
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
      labelStyle={{ color: 'var(--gray-12)', fontWeight: 'bold' }}
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
```

**Data Format:**
```typescript
const data = [
  { date: '2025-01-01', views: 120 },
  { date: '2025-01-02', views: 145 },
  { date: '2025-01-03', views: 132 },
];
```

**Multiple Lines:**
```typescript
<Line type="monotone" dataKey="views" stroke="var(--blue-9)" strokeWidth={2} />
<Line type="monotone" dataKey="uniqueViewers" stroke="var(--green-9)" strokeWidth={2} />
<Legend />
```

## 2. Bar Chart

**Use Case:** Comparisons, rankings (completion rates, top videos)

**Vertical Bar Chart:**
```typescript
<ResponsiveContainer width="100%" height={300}>
  <BarChart data={data}>
    <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-a6)" />
    <XAxis dataKey="month" stroke="var(--gray-11)" />
    <YAxis stroke="var(--gray-11)" />
    <Tooltip />
    <Bar dataKey="students" fill="var(--accent-9)" radius={[8, 8, 0, 0]} />
  </BarChart>
</ResponsiveContainer>
```

**Horizontal Bar Chart:**
```typescript
<ResponsiveContainer width="100%" height={300}>
  <BarChart
    data={data}
    layout="vertical"
    margin={{ top: 5, right: 30, left: 150, bottom: 5 }}
  >
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis type="number" domain={[0, 100]} />
    <YAxis type="category" dataKey="title" width={150} />
    <Tooltip />
    <Bar dataKey="completion_rate" radius={[0, 4, 4, 0]}>
      {data.map((entry, index) => (
        <Cell key={`cell-${index}`} fill={getBarColor(entry.value)} />
      ))}
    </Bar>
  </BarChart>
</ResponsiveContainer>
```

**Color-Coded Bars:**
```typescript
function getBarColor(value: number): string {
  if (value >= 70) return 'var(--green-9)';
  if (value >= 50) return 'var(--yellow-9)';
  if (value >= 30) return 'var(--orange-9)';
  return 'var(--red-9)';
}
```

## 3. Area Chart

**Use Case:** Cumulative data, storage usage, revenue trends

**Basic Area Chart:**
```typescript
<ResponsiveContainer width="100%" height={300}>
  <AreaChart data={data}>
    <defs>
      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="var(--blue-9)" stopOpacity={0.8} />
        <stop offset="95%" stopColor="var(--blue-9)" stopOpacity={0} />
      </linearGradient>
    </defs>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="date" />
    <YAxis />
    <Tooltip />
    <Area
      type="monotone"
      dataKey="storage_gb"
      stroke="var(--blue-9)"
      fillOpacity={1}
      fill="url(#colorValue)"
      strokeWidth={2}
    />
  </AreaChart>
</ResponsiveContainer>
```

**With Reference Line (Quota/Target):**
```typescript
<ReferenceLine
  y={10}
  stroke="var(--red-9)"
  strokeDasharray="3 3"
  strokeWidth={2}
  label={{
    value: 'Quota: 10 GB',
    position: 'right',
    fill: 'var(--red-11)',
    fontSize: 12,
  }}
/>
```

**Multiple Areas (Stacked):**
```typescript
<Area
  type="monotone"
  dataKey="sessions"
  stackId="1"
  stroke="var(--blue-9)"
  fill="url(#colorSessions)"
  strokeWidth={2}
/>
<Area
  type="monotone"
  dataKey="messages"
  stackId="1"
  stroke="var(--purple-9)"
  fill="url(#colorMessages)"
  strokeWidth={2}
/>
```

## 4. Pie Chart

**Use Case:** Proportions, breakdowns (cost by method, traffic sources)

**Basic Pie Chart:**
```typescript
<ResponsiveContainer width="100%" height={240}>
  <PieChart>
    <Pie
      data={data}
      cx="50%"
      cy="50%"
      labelLine={false}
      label={renderLabel}
      outerRadius={80}
      fill="#8884d8"
      dataKey="value"
    >
      {data.map((entry, index) => (
        <Cell key={`cell-${index}`} fill={COLORS[entry.method]} />
      ))}
    </Pie>
    <Tooltip />
    <Legend verticalAlign="bottom" height={36} iconType="circle" />
  </PieChart>
</ResponsiveContainer>
```

**Custom Labels:**
```typescript
const renderLabel = (entry: any) => {
  const percentage = ((entry.value / total) * 100).toFixed(1);
  return `${percentage}%`;
};
```

**Color Mapping:**
```typescript
const COLORS: Record<string, string> = {
  youtube_captions: 'var(--green-9)',
  loom_api: 'var(--green-9)',
  mux_auto: 'var(--green-9)',
  whisper: 'var(--orange-9)',
};
```

**Data Format:**
```typescript
const data = [
  { name: 'YouTube Captions (FREE)', value: 45, method: 'youtube_captions' },
  { name: 'Whisper (PAID)', value: 12, method: 'whisper' },
];
```

## 5. Composed Chart

**Use Case:** Multiple data types on same chart (line + bar)

**Example:**
```typescript
<ResponsiveContainer width="100%" height={300}>
  <ComposedChart data={data}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="date" />
    <YAxis yAxisId="left" />
    <YAxis yAxisId="right" orientation="right" />
    <Tooltip />
    <Legend />
    <Bar yAxisId="left" dataKey="students" fill="var(--blue-9)" />
    <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="var(--green-9)" />
  </ComposedChart>
</ResponsiveContainer>
```

## Styling Best Practices

### Frosted UI Theme Integration

**Use CSS Variables:**
```typescript
// Colors
stroke="var(--accent-9)"      // Primary accent
stroke="var(--gray-11)"        // Text color
stroke="var(--gray-a6)"        // Border color
fill="var(--blue-9)"           // Blue
fill="var(--green-9)"          // Green
fill="var(--orange-9)"         // Orange
fill="var(--red-9)"            // Red

// Backgrounds
backgroundColor: 'var(--gray-2)'
border: '1px solid var(--gray-a6)'
```

**Consistent Tooltip Styling:**
```typescript
const tooltipStyle = {
  contentStyle: {
    backgroundColor: 'var(--gray-2)',
    border: '1px solid var(--gray-a6)',
    borderRadius: '8px',
    padding: '8px 12px',
  },
  labelStyle: {
    color: 'var(--gray-12)',
    fontWeight: 'bold',
    marginBottom: '4px',
  },
  itemStyle: {
    color: 'var(--accent-11)',
  },
  cursor: {
    stroke: 'var(--gray-a6)',
    strokeWidth: 1,
  },
};

<Tooltip {...tooltipStyle} />
```

### Responsive Heights

```typescript
// Small charts (metric cards)
height={120}

// Medium charts (dashboard widgets)
height={240}

// Large charts (main visualizations)
height={300}

// Full-height charts
height={400}
```

### Empty States

```typescript
if (!data || data.length === 0) {
  return (
    <div className="flex items-center justify-center h-[300px]">
      <div className="text-center">
        <p className="text-gray-11 mb-2">No data available</p>
        <p className="text-2 text-gray-10">Additional helpful message</p>
      </div>
    </div>
  );
}
```

## Custom Tooltips

**Advanced Tooltip:**
```typescript
<Tooltip
  content={({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="bg-gray-2 border border-gray-a6 rounded-lg p-3">
        <p className="text-gray-12 font-bold mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-11">
              {entry.name}: {entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }}
/>
```

## Performance Optimization

### 1. Data Aggregation

**Bad:**
```typescript
// Sending 1000+ data points
<LineChart data={allDataPoints} />
```

**Good:**
```typescript
// Aggregate by week/month for large datasets
const aggregatedData = aggregateByWeek(allDataPoints);
<LineChart data={aggregatedData} />
```

### 2. Lazy Loading

```typescript
'use client';

import dynamic from 'next/dynamic';

const LineChart = dynamic(
  () => import('recharts').then((mod) => mod.LineChart),
  { ssr: false }
);
```

### 3. Memoization

```typescript
import { useMemo } from 'react';

function ChartComponent({ data }) {
  const chartData = useMemo(() => {
    return data.map(item => ({
      ...item,
      displayDate: formatDate(item.date),
    }));
  }, [data]);

  return <LineChart data={chartData} />;
}
```

## Accessibility

### Color Blindness

**Use Color + Pattern:**
```typescript
// Don't rely only on color
<Bar dataKey="value" fill="var(--blue-9)" />

// Add pattern or texture
<Bar dataKey="value" fill="url(#pattern)" />

// Or use labels
<Bar dataKey="value" fill="var(--blue-9)" label />
```

**Safe Color Combinations:**
- Blue + Orange (not red + green)
- Purple + Yellow
- Blue + Yellow
- Green + Magenta

### Keyboard Navigation

```typescript
<ResponsiveContainer
  tabIndex={0}
  role="img"
  aria-label="Chart showing video views over time"
>
  <LineChart data={data}>
    {/* ... */}
  </LineChart>
</ResponsiveContainer>
```

## Widget Library Reference

### Metric Card

```typescript
interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend?: number;
  color?: 'blue' | 'purple' | 'green' | 'orange';
}

function MetricCard({ icon, label, value, trend, color = 'blue' }: MetricCardProps) {
  const isPositive = (trend ?? 0) >= 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <Card className="p-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className={`p-2 rounded-lg bg-${color}-a3 text-${color}-11`}>
            {icon}
          </div>
          {trend !== undefined && (
            <div className={`flex items-center gap-1 ${isPositive ? 'text-green-11' : 'text-red-11'}`}>
              <TrendIcon className="w-4 h-4" />
              <span className="text-2 font-medium">{Math.abs(trend)}%</span>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-8 font-bold text-gray-12">{value}</span>
          <span className="text-3 text-gray-11">{label}</span>
        </div>
      </div>
    </Card>
  );
}
```

## Common Patterns

### Date Formatting

```typescript
function formatChartDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

// Usage
const chartData = data.map(item => ({
  ...item,
  displayDate: formatChartDate(item.date),
}));
```

### Number Formatting

```typescript
// Thousands separator
value.toLocaleString() // 1,234,567

// Currency
`$${value.toFixed(2)}` // $123.45

// Percentage
`${value.toFixed(1)}%` // 45.3%

// Duration
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
```

## Related Resources

- [Recharts Official Docs](https://recharts.org/)
- [Recharts Examples](https://recharts.org/en-US/examples)
- [Frosted UI Theme System](https://storybook.whop.dev)
- [Video Analytics Dashboard Guide](./video-analytics-dashboard.md)
- [Analytics Context Documentation](../../api/reference.md#analytics-context)
