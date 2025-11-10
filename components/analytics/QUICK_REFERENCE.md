# Analytics Charts Quick Reference

**Phase 4 Agent 1** - Video Analytics Charts (Recharts)

---

## Import Statement

```tsx
import {
  // Charts
  VideoPerformanceChart,
  WatchTimeChart,
  CompletionRateChart,
  EngagementHeatmap,
  VideoComparisonChart,

  // Trends
  TrendIndicator,
  CompactTrendIndicator,
  TrendCard,
  metricFormatters,

  // Types
  type VideoPerformanceData,
  type WatchTimeData,
  type CompletionRateData,
  type EngagementHeatmapData,
  type VideoComparisonData,
  type TimeRange,
  type MetricType,
} from '@/components/analytics';
```

---

## Component Cheat Sheet

### 1. VideoPerformanceChart
**Type:** Area Chart | **Use:** Show views/watch time over time

```tsx
<VideoPerformanceChart
  videoId="vid-123"
  timeRange="30d"  // '7d' | '30d' | '90d' | 'all'
  data={[
    { date: '2025-01-01', views: 150, watchTime: 7200, uniqueViewers: 120 }
  ]}
  isLoading={false}
  height={400}
/>
```

---

### 2. WatchTimeChart
**Type:** Bar Chart | **Use:** Rank videos by total watch time

```tsx
<WatchTimeChart
  creatorId="creator-123"
  topN={10}
  data={[
    { videoId: 'vid-1', videoTitle: 'Intro', watchTime: 18000 }
  ]}
  onVideoClick={(id) => router.push(`/videos/${id}`)}
  isLoading={false}
/>
```

---

### 3. CompletionRateChart
**Type:** Doughnut/Pie Chart | **Use:** Show completion distribution

```tsx
<CompletionRateChart
  videoId="vid-123"  // or creatorId for aggregate
  data={[
    { segment: 'Completed', count: 45, percentage: 30, color: '#10b981' },
    { segment: 'High', count: 30, percentage: 20, color: '#3b82f6' },
    { segment: 'Medium', count: 50, percentage: 33.3, color: '#f59e0b' },
    { segment: 'Low', count: 25, percentage: 16.7, color: '#ef4444' }
  ]}
/>
```

---

### 4. EngagementHeatmap
**Type:** Custom Heatmap | **Use:** Show engagement by hour/day

```tsx
<EngagementHeatmap
  videoId="vid-123"
  dateRange="Last 30 days"
  data={[
    { hour: 14, day: 'Mon', value: 25 },
    { hour: 15, day: 'Mon', value: 30 }
  ]}
/>
```

---

### 5. VideoComparisonChart
**Type:** Multi-Line Chart | **Use:** Compare 2-5 videos

```tsx
<VideoComparisonChart
  videoIds={['vid-1', 'vid-2', 'vid-3']}
  videoTitles={{
    'vid-1': 'Trading Basics',
    'vid-2': 'Advanced',
    'vid-3': 'Risk Management'
  }}
  metric="views"  // 'views' | 'watchTime' | 'completionRate'
  data={[
    { date: '2025-01-01', 'vid-1': 150, 'vid-2': 120, 'vid-3': 90 }
  ]}
/>
```

---

### 6. TrendIndicator
**Type:** Trend Arrow | **Use:** Show metric change

```tsx
// Full version
<TrendIndicator
  currentValue={1250}
  previousValue={1000}
  metric="views"
  period="vs last week"
  showValue={true}
  formatValue={metricFormatters.number}
/>

// Compact version (no value shown)
<CompactTrendIndicator
  currentValue={75.5}
  previousValue={68.2}
  metric="completion"
/>

// Card version (with label and icon)
<TrendCard
  label="Total Views"
  currentValue={5000}
  previousValue={4200}
  metric="views"
  period="vs last month"
  icon={<EyeIcon className="w-5 h-5" />}
  formatValue={metricFormatters.compact}
/>
```

---

## Built-in Formatters

```tsx
metricFormatters.number(1234)        // "1,234"
metricFormatters.percentage(75.5)    // "75.5%"
metricFormatters.currency(1999)      // "$1,999"
metricFormatters.time(3665)          // "1h 1m"
metricFormatters.compact(1500000)    // "1.5M"
```

---

## Common Props

All charts accept:
- `className?: string` - Additional CSS classes
- `height?: number` - Chart height in pixels (default: 400)
- `isLoading?: boolean` - Show skeleton loader

---

## Data Interfaces

### VideoPerformanceData
```typescript
{
  date: string;          // ISO format (YYYY-MM-DD)
  views: number;
  watchTime: number;     // seconds
  uniqueViewers: number;
}
```

### WatchTimeData
```typescript
{
  videoId: string;
  videoTitle: string;
  watchTime: number;     // seconds
  thumbnailUrl?: string;
}
```

### CompletionRateData
```typescript
{
  segment: 'Completed' | 'High' | 'Medium' | 'Low';
  count: number;
  percentage: number;
  color: string;         // hex color
}
```

### EngagementHeatmapData
```typescript
{
  hour: number;          // 0-23
  day: string;           // 'Mon', 'Tue', etc.
  value: number;         // engagement metric
}
```

### VideoComparisonData
```typescript
{
  date: string;          // ISO format
  [videoId: string]: string | number;  // dynamic keys
}
```

---

## Color Palette (Frosted UI)

```tsx
Purple:  #8b5cf6  // Primary brand
Blue:    #3b82f6  // Secondary
Green:   #10b981  // Success/Positive
Amber:   #f59e0b  // Warning
Red:     #ef4444  // Error/Negative

Gray-800: bg-gray-800  // Container backgrounds
Gray-900: bg-gray-900  // Tooltip backgrounds
Gray-700: border-gray-700  // Borders
```

---

## Responsive Breakpoints

All charts are responsive:
- Mobile: 320px - 768px (full width)
- Tablet: 768px - 1024px (flexible)
- Desktop: 1024px+ (fixed or grid)

---

## Loading States

```tsx
// Manual loading state
<VideoPerformanceChart
  data={data}
  isLoading={isLoading}  // Shows skeleton
/>

// With React Query
const { data, isLoading } = useQuery('performance', fetchData);

<VideoPerformanceChart
  data={data || []}
  isLoading={isLoading}
/>
```

---

## Empty States

Charts automatically show friendly empty states when:
- `data` is empty array `[]`
- `data` is undefined
- All data values are zero

---

## Performance Tips

1. **Memoize data transformations:**
```tsx
const chartData = useMemo(() =>
  transformData(rawData),
  [rawData]
);
```

2. **Lazy load charts:**
```tsx
const VideoPerformanceChart = dynamic(
  () => import('@/components/analytics').then(m => m.VideoPerformanceChart),
  { ssr: false }
);
```

3. **Limit data points:**
- Keep datasets under 1000 points
- Aggregate older data
- Use pagination for large datasets

---

## Common Patterns

### Dashboard Stats Grid
```tsx
<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
  <TrendCard label="Views" currentValue={5000} previousValue={4200} />
  <TrendCard label="Watch Time" currentValue={7200} previousValue={6000} />
  <TrendCard label="Completion" currentValue={75} previousValue={68} />
  <TrendCard label="Students" currentValue={150} previousValue={120} />
</div>
```

### Charts Grid
```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <div className="bg-gray-800 p-6 rounded-lg">
    <h3 className="text-lg font-semibold mb-4">Performance</h3>
    <VideoPerformanceChart {...props} />
  </div>

  <div className="bg-gray-800 p-6 rounded-lg">
    <h3 className="text-lg font-semibold mb-4">Watch Time</h3>
    <WatchTimeChart {...props} />
  </div>
</div>
```

---

## TypeScript Tips

Enable strict mode and import types:

```tsx
import type {
  VideoPerformanceData,
  TimeRange,
  MetricType
} from '@/components/analytics';

// Use in component props
interface DashboardProps {
  timeRange: TimeRange;
  data: VideoPerformanceData[];
}

// Use in state
const [timeRange, setTimeRange] = useState<TimeRange>('30d');
```

---

## Accessibility

All charts include:
- ✅ ARIA labels on interactive elements
- ✅ Keyboard navigation (tab/enter)
- ✅ Screen reader friendly tooltips
- ✅ High contrast colors
- ✅ Focus indicators

---

## Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers
- ❌ IE11 (not supported)

---

## Troubleshooting

**Charts not rendering?**
- Check 'use client' directive at top of file
- Verify data is not undefined
- Check console for errors

**TypeScript errors?**
- Import types from '@/components/analytics'
- Ensure data matches interface shape
- Check for missing required props

**Performance issues?**
- Reduce data points (< 1000)
- Use React.memo on parent components
- Memoize data transformations

**Tooltips clipping?**
- Check viewport edges
- Adjust chart margins
- Consider tooltip portal

---

## Documentation

- **Full Docs:** `components/analytics/README.md`
- **Integration Guide:** `components/analytics/INTEGRATION_NOTES.md`
- **This Reference:** `components/analytics/QUICK_REFERENCE.md`
- **Types:** `components/analytics/types.ts`

---

## Support

For questions or issues:
1. Check README.md for detailed usage
2. Review INTEGRATION_NOTES.md for examples
3. Inspect types.ts for data interfaces
4. Check component source code

**All components are fully typed and documented inline.**
