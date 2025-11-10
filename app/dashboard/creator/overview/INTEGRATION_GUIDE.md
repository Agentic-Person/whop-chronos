# Dashboard Integration Guide

## Quick Start

### 1. Import Components

```tsx
import {
  // Layout
  AnalyticsDashboardGrid,
  DashboardSection,
  DashboardCard,
  DashboardHeader,

  // Controls
  DateRangePicker,
  RefreshButton,
  ExportButton,

  // Stats
  QuickStatsCards,

  // Utils
  DashboardSkeleton,
  AnalyticsEmptyState,

  // Context
  useAnalytics,
} from '@/components/analytics';
```

### 2. Wrap Page in Provider

```tsx
import { AnalyticsProvider } from '@/lib/contexts/AnalyticsContext';

export default function CreatorDashboard() {
  return (
    <AnalyticsProvider creatorId="user123" tier="pro">
      <DashboardContent />
    </AnalyticsProvider>
  );
}
```

### 3. Use Components

```tsx
function DashboardContent() {
  const { dateRange, creatorId } = useAnalytics();
  const { data, loading } = useDashboardData(creatorId, dateRange);

  if (loading) return <DashboardSkeleton />;

  return (
    <>
      <DashboardHeader creatorName="John Doe">
        <DateRangePicker />
        <RefreshButton />
        <ExportButton />
      </DashboardHeader>

      <QuickStatsCards stats={data.quickStats} />

      <DashboardSection title="Video Analytics">
        <AnalyticsDashboardGrid columns={2}>
          <VideoPerformanceChart />
          <WatchTimeChart />
        </AnalyticsDashboardGrid>
      </DashboardSection>
    </>
  );
}
```

## Component Hierarchy

```
┌─────────────────────────────────────────┐
│ AnalyticsProvider (Context)            │
│  ├─ dateRange                          │
│  ├─ creatorId                          │
│  ├─ tier                               │
│  ├─ refreshData()                      │
│  └─ autoRefresh                        │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│ Dashboard Layout                        │
│  ├─ DashboardNav (Top Navigation)      │
│  └─ Main Content Area                  │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│ DashboardHeader                         │
│  ├─ Creator Info + Tier Badge          │
│  └─ Quick Actions                       │
│      ├─ DateRangePicker                │
│      ├─ RefreshButton                  │
│      └─ ExportButton                   │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│ QuickStatsCards                         │
│  ├─ Total Videos Card                  │
│  ├─ Active Students Card               │
│  ├─ AI Messages Card                   │
│  └─ Watch Time Card                    │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│ DashboardSection (Repeatable)          │
│  ├─ Section Title + Description        │
│  └─ AnalyticsDashboardGrid             │
│      ├─ DashboardCard (span=1-4)       │
│      │   └─ Your Chart/Widget          │
│      ├─ DashboardCard                  │
│      │   └─ Your Chart/Widget          │
│      └─ ...                            │
└─────────────────────────────────────────┘
```

## Integration Examples

### Example 1: Add Video Performance Section

```tsx
import { VideoPerformanceChart } from '@/components/analytics';

<DashboardSection
  title="Video Performance"
  description="Your most viewed videos this period"
>
  <AnalyticsDashboardGrid columns={2}>
    <DashboardCard>
      <VideoPerformanceChart data={videoData} />
    </DashboardCard>
    <DashboardCard>
      <WatchTimeChart data={watchTimeData} />
    </DashboardCard>
  </AnalyticsDashboardGrid>
</DashboardSection>
```

### Example 2: Add Full-Width Chart

```tsx
<DashboardSection title="Student Engagement Over Time">
  <DashboardCard span="full">
    <EngagementTimelineChart data={engagementData} />
  </DashboardCard>
</DashboardSection>
```

### Example 3: Add Usage Meters

```tsx
import { UsageMetersGrid } from '@/components/analytics';

<DashboardSection title="Usage & Limits">
  <UsageMetersGrid
    storage={{ used: 5000, limit: 10000 }}
    aiCredits={{ used: 500, limit: 1000 }}
    videos={{ used: 42, limit: 50 }}
  />
</DashboardSection>
```

### Example 4: Add Chat Analytics

```tsx
import { ChatVolumeChart, PopularQuestionsTable } from '@/components/analytics';

<DashboardSection title="AI Chat Analytics">
  <AnalyticsDashboardGrid columns={2}>
    <DashboardCard>
      <ChatVolumeChart data={chatVolumeData} />
    </DashboardCard>
    <DashboardCard>
      <PopularQuestionsTable questions={topQuestions} />
    </DashboardCard>
  </AnalyticsDashboardGrid>
</DashboardSection>
```

## Fetching Data

### Using useAnalytics Hook

```tsx
function MyChart() {
  const { dateRange, creatorId, refreshData } = useAnalytics();

  useEffect(() => {
    // Fetch data when date range changes
    fetchChartData(creatorId, dateRange);
  }, [dateRange, creatorId]);

  // Or use the built-in hook
  const { data, loading, error } = useAnalyticsData(
    async (dateRange, creatorId) => {
      const response = await fetch(`/api/analytics/chart?...`);
      return response.json();
    }
  );
}
```

### Direct API Calls

```tsx
async function fetchDashboardData(creatorId: string, dateRange: DateRange) {
  const params = new URLSearchParams({
    creatorId,
    start: dateRange.start.toISOString(),
    end: dateRange.end.toISOString(),
  });

  const response = await fetch(`/api/analytics/overview?${params}`);
  return response.json();
}
```

## Responsive Layout Patterns

### Mobile First

```tsx
<AnalyticsDashboardGrid columns={1}> {/* Always 1 column */}
  <DashboardCard>...</DashboardCard>
</AnalyticsDashboardGrid>
```

### Tablet & Desktop

```tsx
<AnalyticsDashboardGrid columns={2}> {/* 1 col mobile, 2 col tablet+ */}
  <DashboardCard>...</DashboardCard>
  <DashboardCard>...</DashboardCard>
</AnalyticsDashboardGrid>
```

### Full Desktop

```tsx
<AnalyticsDashboardGrid columns={4}> {/* 1/2/4 cols */}
  <DashboardCard span={2}>...</DashboardCard>  {/* Takes 2 columns */}
  <DashboardCard span={1}>...</DashboardCard>
  <DashboardCard span={1}>...</DashboardCard>
</AnalyticsDashboardGrid>
```

## Empty State Handling

```tsx
<EmptyStateWrapper
  hasData={videos.length > 0}
  type="noVideos"
  onAction={() => router.push('/upload')}
>
  <VideoList videos={videos} />
</EmptyStateWrapper>
```

## Loading States

```tsx
if (loading) {
  return <DashboardSkeleton />;  // Full page skeleton
}

// Or for individual sections
if (chartLoading) {
  return <ChartSkeleton height="h-96" />;
}

if (cardLoading) {
  return <StatCardSkeleton />;
}
```

## Navigation

The dashboard includes a top navigation bar with 5 tabs:

1. **Overview** - Main dashboard (this page)
2. **Videos** - Video management and stats
3. **Students** - Student insights
4. **Chat** - AI chat analytics
5. **Settings** - Usage limits, billing

To add more tabs, edit `/components/layout/DashboardNav.tsx`:

```tsx
const navigation = [
  { name: 'Overview', href: '/dashboard/creator/overview', icon: LayoutDashboard },
  { name: 'Videos', href: '/dashboard/creator/videos', icon: Video },
  { name: 'Your New Tab', href: '/dashboard/creator/new', icon: YourIcon },
  // ...
];
```

## Styling Tips

### Using Frosted UI Colors

```tsx
// Background
<div className="bg-gray-1">...</div>     // Page background
<div className="bg-gray-2">...</div>     // Elevated surface
<div className="bg-gray-a2">...</div>    // Subtle background

// Text
<span className="text-gray-12">...</span>  // Primary text
<span className="text-gray-11">...</span>  // Secondary text
<span className="text-gray-10">...</span>  // Tertiary text

// Borders
<div className="border border-gray-a4">...</div>

// Accents
<div className="bg-blue-9">...</div>     // Primary accent
<div className="text-green-11">...</div>  // Success
<div className="text-red-11">...</div>    // Error
```

### Card Styling

```tsx
import { Card } from '@whop/react/components';

<Card className="p-6">
  <h3 className="text-5 font-semibold text-gray-12 mb-4">Card Title</h3>
  <p className="text-3 text-gray-11">Card content...</p>
</Card>
```

## Common Patterns

### Add Section Header with Action

```tsx
<DashboardSection
  title="Recent Activity"
  description="Your latest interactions"
  action={
    <Button variant="outline" size="2">
      View All
    </Button>
  }
>
  {/* Content */}
</DashboardSection>
```

### Grid with Mixed Spans

```tsx
<AnalyticsDashboardGrid columns={4}>
  <DashboardCard span={3}>  {/* Wide chart */}
    <LargeChart />
  </DashboardCard>
  <DashboardCard span={1}>  {/* Sidebar widget */}
    <StatWidget />
  </DashboardCard>
</AnalyticsDashboardGrid>
```

### Conditional Rendering

```tsx
{hasData ? (
  <QuickStatsCards stats={data} />
) : (
  <AnalyticsEmptyState type="noData" />
)}
```

## Troubleshooting

### Context Not Available

```
Error: useAnalytics must be used within an AnalyticsProvider
```

**Solution**: Wrap your component tree with `<AnalyticsProvider>`

### Date Range Not Updating

**Solution**: Make sure you're using the `setDateRange` function from context, not local state

### Sparklines Not Showing

**Solution**: Ensure `react-sparklines` is installed:
```bash
npm install react-sparklines @types/react-sparklines
```

### Export Button Not Working

**Solution**: Implement the `/api/analytics/export` endpoint (placeholder currently)

---

## Need Help?

Check the following files:
- `/app/dashboard/creator/overview/README.md` - Full documentation
- `/AGENT5_DASHBOARD_SUMMARY.md` - Implementation summary
- `/components/analytics/index.ts` - Available exports
