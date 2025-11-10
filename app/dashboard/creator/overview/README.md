# Analytics Dashboard - Overview Page

This directory contains the main analytics dashboard layout and overview page for Chronos creators.

## Structure

```
overview/
├── page.tsx          # Main dashboard overview page
├── layout.tsx        # Dashboard layout with navigation
└── README.md         # This file
```

## Features

### Main Dashboard Components

1. **DashboardHeader** - Header with creator info, tier badge, and quick actions
2. **QuickStatsCards** - 4 key metrics cards with trends and sparklines
3. **DateRangePicker** - Date range selector with presets and custom range
4. **RefreshButton** - Manual refresh and auto-refresh toggle
5. **ExportButton** - Export dashboard data as CSV or PDF
6. **AnalyticsDashboardGrid** - Responsive grid layout system
7. **DashboardSkeleton** - Loading skeleton states
8. **AnalyticsEmptyState** - Empty states for no data scenarios

### Analytics Context

The `AnalyticsContext` provides:
- Global date range state
- Creator ID and tier information
- Refresh functionality
- Auto-refresh toggle
- Last updated timestamp

## Usage

### Basic Usage

```tsx
import { AnalyticsProvider } from '@/lib/contexts/AnalyticsContext';
import { DashboardHeader, QuickStatsCards } from '@/components/analytics';

export default function Dashboard() {
  return (
    <AnalyticsProvider creatorId="..." tier="pro">
      <DashboardHeader creatorName="John Doe" />
      <QuickStatsCards stats={...} />
    </AnalyticsProvider>
  );
}
```

### Using Analytics Context

```tsx
'use client';

import { useAnalytics } from '@/components/analytics';

export function MyComponent() {
  const { dateRange, creatorId, tier, refreshData } = useAnalytics();

  // Fetch data based on dateRange
  // ...
}
```

### API Integration

The overview page fetches data from `/api/analytics/overview`:

```typescript
GET /api/analytics/overview?creatorId=xxx&start=2024-01-01&end=2024-01-31

Response:
{
  quickStats: {
    totalVideos: 42,
    totalStudents: 150,
    aiMessagesThisMonth: 1200,
    totalWatchTime: "3d 5h",
    trends: {
      videos: 15,    // +15%
      students: 8,   // +8%
      messages: -5,  // -5%
      watchTime: 12  // +12%
    },
    sparklines: {
      videos: [10, 12, 15, ...],
      students: [100, 105, 110, ...],
      messages: [800, 900, 850, ...],
      watchTime: [1200, 1300, 1250, ...]
    }
  },
  usageMeters: {
    storage_used: 5000,
    storage_limit: 10000,
    ai_credits_used: 500,
    ai_credits_limit: 1000,
    videos_uploaded: 42,
    videos_limit: 50
  },
  topVideos: [...],
  tier: "pro"
}
```

## Navigation

The dashboard includes a navigation bar with:
- Overview (current page)
- Videos
- Students
- Chat
- Settings

## Responsive Design

Breakpoints:
- Mobile: < 640px (1 column)
- Tablet: 640px - 1024px (2 columns)
- Desktop: > 1024px (4 columns)

## Integration with Other Agents

This dashboard integrates components from:
- **Agent 1**: Video performance charts
- **Agent 2**: Student engagement metrics
- **Agent 3**: Usage meters and limits
- **Agent 4**: Chat analytics

Example integration:

```tsx
import {
  VideoPerformanceChart,
  WatchTimeChart,
  UsageMetersGrid,
  ChatVolumeChart,
} from '@/components/analytics';

<DashboardSection title="Video Analytics">
  <VideoPerformanceChart data={videoData} />
  <WatchTimeChart data={watchTimeData} />
</DashboardSection>
```

## Components Location

All dashboard components are in `/components/analytics/`:
- `AnalyticsDashboardGrid.tsx`
- `DashboardHeader.tsx`
- `QuickStatsCards.tsx`
- `DateRangePicker.tsx`
- `RefreshButton.tsx`
- `ExportButton.tsx`
- `AnalyticsEmptyState.tsx`
- `DashboardSkeleton.tsx`

## State Management

The dashboard uses React Context for state management:
- `/lib/contexts/AnalyticsContext.tsx`

## Future Enhancements

- [ ] Real-time updates via WebSocket
- [ ] More export formats (Excel, JSON)
- [ ] Scheduled email reports
- [ ] Custom dashboard widgets
- [ ] Dashboard sharing with public links
- [ ] Comparison with previous periods
- [ ] Goal setting and tracking
- [ ] Custom date range shortcuts
