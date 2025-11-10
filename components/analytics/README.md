# Analytics Chart Components

Interactive Recharts-based visualization components for the Chronos creator dashboard.

## Components

### 1. VideoPerformanceChart

Line/Area chart showing video views, watch time, and unique viewers over time.

**Props:**
- `videoId: string` - Video identifier
- `timeRange: TimeRange` - Time period ('7d', '30d', '90d', 'all')
- `data: VideoPerformanceData[]` - Performance metrics by date
- `isLoading?: boolean` - Loading state
- `height?: number` - Chart height in pixels (default: 400)
- `className?: string` - Additional CSS classes

**Usage:**
```tsx
import { VideoPerformanceChart } from '@/components/analytics';

const data = [
  {
    date: '2025-01-01',
    views: 150,
    watchTime: 7200, // seconds
    uniqueViewers: 120
  },
  // ... more data points
];

<VideoPerformanceChart
  videoId="video-123"
  timeRange="30d"
  data={data}
  isLoading={false}
  height={400}
/>
```

---

### 2. WatchTimeChart

Bar chart displaying total watch time per video, sorted by highest first.

**Props:**
- `creatorId: string` - Creator identifier
- `topN?: number` - Number of top videos to show (default: 10)
- `data: WatchTimeData[]` - Watch time data by video
- `isLoading?: boolean` - Loading state
- `onVideoClick?: (videoId: string) => void` - Click handler for bars
- `height?: number` - Chart height (default: 400)
- `className?: string` - Additional CSS classes

**Usage:**
```tsx
import { WatchTimeChart } from '@/components/analytics';

const data = [
  {
    videoId: 'vid-1',
    videoTitle: 'Introduction to Trading',
    watchTime: 18000, // seconds
    thumbnailUrl: '/thumbnails/vid-1.jpg'
  },
  // ... more videos
];

<WatchTimeChart
  creatorId="creator-123"
  topN={10}
  data={data}
  onVideoClick={(videoId) => router.push(`/videos/${videoId}`)}
/>
```

---

### 3. CompletionRateChart

Doughnut/Pie chart showing distribution of completion rates.

**Props:**
- `videoId?: string` - Specific video ID (optional)
- `creatorId?: string` - Creator ID for aggregate stats (optional)
- `data: CompletionRateData[]` - Completion segments
- `isLoading?: boolean` - Loading state
- `height?: number` - Chart height (default: 400)
- `className?: string` - Additional CSS classes

**Segments:**
- Completed: 100% watched
- High: 75-99% watched
- Medium: 25-74% watched
- Low: 0-24% watched

**Usage:**
```tsx
import { CompletionRateChart } from '@/components/analytics';

const data = [
  { segment: 'Completed', count: 45, percentage: 30, color: '#10b981' },
  { segment: 'High', count: 30, percentage: 20, color: '#3b82f6' },
  { segment: 'Medium', count: 50, percentage: 33.3, color: '#f59e0b' },
  { segment: 'Low', count: 25, percentage: 16.7, color: '#ef4444' }
];

<CompletionRateChart
  videoId="video-123"
  data={data}
/>
```

---

### 4. EngagementHeatmap

Heatmap showing engagement patterns by hour and day of week.

**Props:**
- `videoId: string` - Video identifier
- `dateRange?: string` - Date range label
- `data: EngagementHeatmapData[]` - Engagement metrics by time slot
- `isLoading?: boolean` - Loading state
- `height?: number` - Chart height (default: 400)
- `className?: string` - Additional CSS classes

**Usage:**
```tsx
import { EngagementHeatmap } from '@/components/analytics';

const data = [
  { hour: 14, day: 'Mon', value: 25 },
  { hour: 15, day: 'Mon', value: 30 },
  { hour: 9, day: 'Tue', value: 15 },
  // ... more time slots
];

<EngagementHeatmap
  videoId="video-123"
  dateRange="Last 30 days"
  data={data}
/>
```

---

### 5. VideoComparisonChart

Multi-line chart comparing up to 5 videos across different metrics.

**Props:**
- `videoIds: string[]` - Array of video IDs (max 5)
- `videoTitles: Record<string, string>` - Map of videoId to title
- `metric: MetricType` - Metric to compare ('views', 'watchTime', 'completionRate')
- `data: VideoComparisonData[]` - Time series data for all videos
- `isLoading?: boolean` - Loading state
- `height?: number` - Chart height (default: 400)
- `className?: string` - Additional CSS classes

**Features:**
- Click legend items to toggle video visibility
- Interactive tooltips
- Color-coded lines (up to 5 unique colors)

**Usage:**
```tsx
import { VideoComparisonChart } from '@/components/analytics';

const videoIds = ['vid-1', 'vid-2', 'vid-3'];
const videoTitles = {
  'vid-1': 'Trading Basics',
  'vid-2': 'Advanced Strategies',
  'vid-3': 'Risk Management'
};

const data = [
  {
    date: '2025-01-01',
    'vid-1': 150,
    'vid-2': 120,
    'vid-3': 90
  },
  // ... more dates
];

<VideoComparisonChart
  videoIds={videoIds}
  videoTitles={videoTitles}
  metric="views"
  data={data}
/>
```

---

### 6. TrendIndicator

Small trend indicator showing percentage change with directional arrow.

**Props:**
- `currentValue: number` - Current metric value
- `previousValue: number` - Previous period value
- `metric: string` - Metric name
- `period?: string` - Time period label (default: 'vs last period')
- `showValue?: boolean` - Show current value (default: true)
- `formatValue?: (value: number) => string` - Custom formatter
- `className?: string` - Additional CSS classes

**Variants:**
- `TrendIndicator` - Full version with value
- `CompactTrendIndicator` - Icon and percentage only
- `TrendCard` - Card wrapper with label and icon

**Usage:**
```tsx
import {
  TrendIndicator,
  CompactTrendIndicator,
  TrendCard,
  metricFormatters
} from '@/components/analytics';

// Full trend indicator
<TrendIndicator
  currentValue={1250}
  previousValue={1000}
  metric="views"
  period="vs last week"
  formatValue={metricFormatters.number}
/>

// Compact version
<CompactTrendIndicator
  currentValue={75.5}
  previousValue={68.2}
  metric="completion"
/>

// Card version
<TrendCard
  label="Total Views"
  currentValue={5000}
  previousValue={4200}
  metric="views"
  period="vs last month"
  icon={<EyeIcon className="w-5 h-5" />}
/>
```

**Built-in Formatters:**
```tsx
metricFormatters.number(1234)      // "1,234"
metricFormatters.percentage(75.5)  // "75.5%"
metricFormatters.currency(1999)    // "$1,999"
metricFormatters.time(3665)        // "1h 1m"
metricFormatters.compact(1500000)  // "1.5M"
```

---

## Type Definitions

```typescript
type TimeRange = '7d' | '30d' | '90d' | 'all';
type MetricType = 'views' | 'watchTime' | 'completionRate';
type CompletionSegment = 'Completed' | 'High' | 'Medium' | 'Low';

interface VideoPerformanceData {
  date: string; // ISO format (YYYY-MM-DD)
  views: number;
  watchTime: number; // seconds
  uniqueViewers: number;
}

interface WatchTimeData {
  videoId: string;
  videoTitle: string;
  watchTime: number; // seconds
  thumbnailUrl?: string;
}

interface CompletionRateData {
  segment: CompletionSegment;
  count: number;
  percentage: number;
  color: string;
}

interface EngagementHeatmapData {
  hour: number; // 0-23
  day: string; // 'Mon', 'Tue', etc.
  value: number;
}

interface VideoComparisonData {
  date: string; // ISO format
  [videoId: string]: string | number; // Dynamic keys
}
```

---

## Features

### Responsive Design
All charts use `ResponsiveContainer` for automatic width adjustment. Works on mobile and desktop.

### Dark Mode
Charts are styled for dark backgrounds matching Whop's Frosted UI design system.

### Loading States
Built-in skeleton loaders for async data fetching.

### Empty States
Friendly empty states with icons and messages when no data available.

### Accessibility
- Proper ARIA labels
- Keyboard navigation support
- Screen reader friendly tooltips

### Performance
- React.memo for preventing unnecessary re-renders
- useMemo for data transformations
- Lazy loading ready (wrap in `dynamic()` for code splitting)

---

## Integration Examples

### Complete Dashboard Page

```tsx
'use client';

import {
  VideoPerformanceChart,
  WatchTimeChart,
  CompletionRateChart,
  TrendCard,
  metricFormatters
} from '@/components/analytics';
import { useAnalytics } from '@/hooks/useAnalytics';

export default function AnalyticsDashboard() {
  const { data, isLoading } = useAnalytics();

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TrendCard
          label="Total Views"
          currentValue={data.totalViews}
          previousValue={data.previousViews}
          metric="views"
          period="vs last week"
          formatValue={metricFormatters.compact}
        />
        <TrendCard
          label="Watch Time"
          currentValue={data.totalWatchTime}
          previousValue={data.previousWatchTime}
          metric="watchTime"
          period="vs last week"
          formatValue={metricFormatters.time}
        />
        <TrendCard
          label="Completion Rate"
          currentValue={data.completionRate}
          previousValue={data.previousCompletionRate}
          metric="completion"
          period="vs last week"
          formatValue={metricFormatters.percentage}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Performance Over Time</h3>
          <VideoPerformanceChart
            videoId={data.selectedVideoId}
            timeRange="30d"
            data={data.performanceData}
            isLoading={isLoading}
          />
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Top Videos by Watch Time</h3>
          <WatchTimeChart
            creatorId={data.creatorId}
            topN={10}
            data={data.watchTimeData}
            isLoading={isLoading}
            onVideoClick={(id) => router.push(`/videos/${id}`)}
          />
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Completion Distribution</h3>
          <CompletionRateChart
            creatorId={data.creatorId}
            data={data.completionData}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
```

---

## Styling Notes

Charts use Tailwind CSS classes and match Whop's Frosted UI color palette:

**Colors:**
- Purple: `#8b5cf6` (primary)
- Blue: `#3b82f6`
- Green: `#10b981` (positive trends)
- Amber: `#f59e0b` (warnings)
- Red: `#ef4444` (negative trends)

**Backgrounds:**
- Chart containers: `bg-gray-800`
- Tooltips: `bg-gray-900` with `border-gray-700`
- Grid lines: `#374151`
- Text: `text-gray-100` (primary), `text-gray-400` (secondary)

---

## Performance Tips

1. **Lazy Loading:**
```tsx
import dynamic from 'next/dynamic';

const VideoPerformanceChart = dynamic(
  () => import('@/components/analytics').then(mod => mod.VideoPerformanceChart),
  { ssr: false, loading: () => <SkeletonLoader /> }
);
```

2. **Data Memoization:**
```tsx
const chartData = useMemo(() => {
  return processAnalyticsData(rawData);
}, [rawData]);
```

3. **Batch Updates:**
Use a single state update for multiple chart data instead of individual updates.

---

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Recharts uses SVG rendering (widely supported)
- No IE11 support (Next.js 14 requirement)

---

## License

Part of the Chronos project. See main LICENSE file.
