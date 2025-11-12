# Analytics Features

## Overview

Chronos provides comprehensive analytics for both chat and video interactions, giving creators deep insights into student engagement, content performance, and cost tracking.

## Analytics Dashboards

### 1. Video Analytics Dashboard ⭐ NEW

**Route:** `/dashboard/creator/analytics/videos`

**Features:**
- Video performance metrics (views, watch time, completion rates)
- Interactive Recharts visualizations
- Cost breakdown (FREE vs PAID transcription)
- Storage usage tracking with quota alerts
- Student engagement heatmap
- Top performing videos table
- CSV export functionality

**Documentation:**
- [Video Analytics Dashboard Guide](./video-analytics-dashboard.md)
- [Dashboard Widgets Reference](./dashboard-widgets.md)
- [Agent 9 Implementation Report](../../agent-reports/video-implementation/agent-9-analytics-dashboard-report.md)

**Key Insights:**
- Identify best/worst performing videos
- Optimize content release timing based on peak engagement
- Reduce costs by switching to FREE transcription methods
- Manage storage before hitting quota limits
- Track student learning patterns

### 2. Chat Analytics Dashboard

**Route:** `/dashboard/creator/analytics` (main analytics page)

**Features:**
- Chat session volume and trends
- Most asked questions
- Response quality metrics
- AI cost tracking
- Student retention analysis

**Documentation:**
- See existing analytics documentation

## Analytics Context

All analytics pages use the `AnalyticsContext` for:
- Date range filtering
- Auto-refresh functionality
- Creator ID management
- Subscription tier tracking

**Usage:**
```typescript
import { useAnalytics } from '@/lib/contexts/AnalyticsContext';

function AnalyticsComponent() {
  const { dateRange, creatorId, refreshData } = useAnalytics();
  // ... fetch data based on dateRange and creatorId
}
```

## Date Range Presets

Available via `DateRangePicker` component:
- Last 7 days
- Last 30 days
- Last 90 days
- This Month
- Last Month
- Custom Range (future)

## Export Functionality

All dashboards support CSV export:

**Video Analytics Export:**
- Summary metrics
- Trends
- Views over time
- Completion rates
- Cost breakdown
- Storage usage
- Student engagement
- Peak activity hours
- Top performing videos

**File Format:** `video-analytics-YYYY-MM-DD_to_YYYY-MM-DD.csv`

## Database Tables

### Video Analytics
- `video_analytics_events` - Granular event tracking
- `video_watch_sessions` - Student watch sessions
- `video_analytics` - Aggregated daily stats (legacy)
- `videos` - Video metadata

### Chat Analytics
- `chat_sessions` - AI chat sessions
- `chat_messages` - Individual messages
- `chat_analytics` - Aggregated chat stats

## API Endpoints

### Video Analytics
- `GET /api/analytics/videos/dashboard` - Comprehensive dashboard data
- `GET /api/analytics/videos/[id]` - Individual video analytics
- `POST /api/analytics/video-event` - Track video events
- `GET /api/analytics/courses/[id]` - Course-level analytics
- `GET /api/analytics/watch-sessions` - Watch session data

### Chat Analytics
- `GET /api/analytics/chat` - Chat analytics
- `GET /api/analytics/chat/popular-questions` - Top questions
- `GET /api/analytics/chat/cost` - Chat cost tracking

### Usage & Limits
- `GET /api/analytics/usage` - Current usage stats
- `GET /api/analytics/usage/quota` - Quota limits
- `GET /api/analytics/usage/current` - Real-time usage
- `GET /api/analytics/usage/storage-breakdown` - Storage details

## Recharts Components

All charts use Recharts library with Frosted UI theming:
- Line Charts (trends over time)
- Bar Charts (comparisons, rankings)
- Area Charts (cumulative data)
- Pie Charts (proportions, breakdowns)

**See:** [Dashboard Widgets Reference](./dashboard-widgets.md)

## Performance Considerations

### Query Optimization
- All dashboard queries run in parallel
- Indexed database columns for fast lookups
- Date range filtering to limit data scans
- Result limiting (top 10, top 20)

**Typical Response Times:**
- Dashboard API: 400-500ms (8 parallel queries)
- Individual video: 150-200ms
- Watch sessions: 100-150ms

### Caching
- Dashboard data cached in browser
- Auto-refresh available (opt-in)
- Manual refresh button

### Responsive Design
- Mobile: Single column, hidden details
- Tablet: 2-column grid
- Desktop: Full layout

## User Experience

### Loading States
- Dashboard skeleton during initial load
- Loading indicators on refresh
- Smooth transitions

### Error Handling
- Network error messages with retry
- Empty states with helpful tips
- Graceful degradation

### Accessibility
- Semantic HTML
- ARIA labels
- Keyboard navigation
- Color-blind friendly palette

## Related Documentation

### Implementation
- [Video Implementation Plan](../videos/VIDEO_IMPLEMENTATION_PLAN.md)
- [Agent Reports](../../agent-reports/video-implementation/)
- [Database Schema](../../database/schema.md)
- [API Reference](../../api/reference.md)

### Usage
- [Video Analytics Dashboard](./video-analytics-dashboard.md)
- [Dashboard Widgets](./dashboard-widgets.md)
- [Analytics Context](../../api/reference.md#analytics-context)

## Future Enhancements

**High Priority:**
1. Real-time auto-refresh (WebSocket)
2. Custom date range picker
3. Comparison mode (vs previous period)
4. PDF export with charts
5. Storage quota from subscription tier

**Medium Priority:**
6. Video recommendations
7. Engagement scoring
8. Scheduled email reports
9. A/B testing for thumbnails
10. Predictive analytics

**Low Priority:**
11. Cohort analysis
12. Duration optimization
13. Custom dashboards
14. White-label reports

## Support

For questions or issues:
1. Check documentation in `docs/features/analytics/`
2. Review agent reports in `docs/agent-reports/`
3. See API reference in `docs/api/reference.md`
4. Contact development team

---

**Last Updated:** 2025-01-12 (Agent 9 Implementation)
**Status:** Production Ready
