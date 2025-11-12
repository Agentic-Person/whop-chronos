# Video Analytics Dashboard

## Overview

The Video Analytics Dashboard provides creators with comprehensive insights into video performance, student engagement, and cost tracking. Built with Recharts for interactive data visualization.

**Route:** `/dashboard/creator/analytics/videos`

**Key Features:**
- Real-time metrics with trend indicators
- Interactive charts (views, completion rates, costs, storage)
- Student engagement heatmap
- Top performing videos table
- CSV export functionality
- Date range filtering

## Dashboard Components

### 1. Video Metric Cards

**Component:** `VideoMetricCards.tsx`

Displays four key metrics with trend indicators:

1. **Total Views** - Count of `video_started` events
2. **Total Watch Time** - Sum of watch time from `video_completed` events
3. **Avg Completion Rate** - Percentage of videos watched to completion
4. **Total Videos** - Count of non-deleted videos

**Trend Calculation:**
```typescript
trend = ((current - previous) / previous) * 100
```

Trends compare current period to previous period of equal duration.

**Color Coding:**
- Blue: Total Views
- Purple: Watch Time
- Green: Completion Rate
- Orange: Total Videos

### 2. Views Over Time Chart

**Component:** `ViewsOverTimeChart.tsx`
**Chart Type:** Line Chart

**Data Source:**
```sql
SELECT
  DATE(created_at) as date,
  COUNT(*) as views
FROM video_analytics_events
WHERE event_type = 'video_started'
  AND creator_id = $1
  AND created_at >= $2 AND created_at <= $3
GROUP BY DATE(created_at)
ORDER BY date ASC
```

**Features:**
- Smooth monotone curve
- Responsive container (300px height)
- Hover tooltips showing exact view counts
- Missing dates filled with 0 views
- Customizable date range

### 3. Completion Rates Chart

**Component:** `CompletionRatesChart.tsx`
**Chart Type:** Horizontal Bar Chart

**Data Source:**
```sql
SELECT
  v.title,
  COUNT(CASE WHEN e.event_type = 'video_completed' THEN 1 END)::float /
  NULLIF(COUNT(CASE WHEN e.event_type = 'video_started' THEN 1 END), 0) * 100 as completion_rate,
  COUNT(CASE WHEN e.event_type = 'video_started' THEN 1 END) as views
FROM videos v
LEFT JOIN video_analytics_events e ON v.id = e.video_id
WHERE v.creator_id = $1
GROUP BY v.id, v.title
ORDER BY completion_rate DESC
LIMIT 10
```

**Features:**
- Top 10 videos by completion rate
- Color gradient based on performance:
  - Green (70%+): High completion
  - Yellow (50-70%): Medium completion
  - Orange (30-50%): Low completion
  - Red (<30%): Very low completion
- Truncated titles (25 chars max)
- Tooltip shows full title, completion rate, and view count

### 4. Cost Breakdown Chart

**Component:** `CostBreakdownChart.tsx`
**Chart Type:** Pie Chart

**Data Source:**
```sql
SELECT
  COALESCE(metadata->>'transcript_method', 'unknown') as method,
  SUM((metadata->>'cost')::float) as total_cost,
  COUNT(*) as video_count
FROM video_analytics_events
WHERE event_type = 'video_transcribed' AND creator_id = $1
GROUP BY metadata->>'transcript_method'
```

**Transcript Methods:**
- **YouTube Captions** (FREE) - Green
- **Loom API** (FREE) - Green
- **Mux Auto** (FREE) - Green
- **Whisper** (PAID) - Orange (~$0.21/hour)

**Features:**
- Summary cards showing total cost and video count
- Percentage labels on pie slices
- Legend with method names
- Detailed cost breakdown list
- Empty state when no transcription costs

**Cost Savings Insight:**
Always prefer FREE methods (YouTube, Loom, Mux) to minimize costs. Whisper should only be used when free methods are unavailable.

### 5. Storage Usage Chart

**Component:** `StorageUsageChart.tsx`
**Chart Type:** Area Chart with Reference Line

**Data Source:**
```sql
SELECT
  DATE(created_at) as date,
  SUM(SUM(file_size_bytes)) OVER (ORDER BY DATE(created_at)) as cumulative_bytes
FROM videos
WHERE creator_id = $1 AND source_type = 'upload'
GROUP BY DATE(created_at)
ORDER BY date ASC
```

**Features:**
- Cumulative storage trend
- Storage quota reference line (default: 10GB)
- Color-coded warning system:
  - Blue (<75%): Normal usage
  - Orange (75-90%): High usage warning
  - Red (90%+): Critical usage alert
- Progress bar showing current usage percentage
- Summary cards: Current Usage, Quota, Percentage Used

**Warning Messages:**
- 75-90%: "Storage usage is high. Consider upgrading soon."
- 90%+: "Storage almost full! Consider upgrading your plan or deleting unused videos."

### 6. Student Engagement Metrics

**Component:** `StudentEngagementMetrics.tsx`

**Summary Metrics:**

1. **Active Learners** - Unique students who started videos in date range
2. **Avg Videos per Student** - Average unique videos watched per student
3. **Peak Activity** - Most active day/hour combination

**Activity Heatmap:**

Shows video viewing activity by day of week and hour.

**Data Source:**
```sql
SELECT
  EXTRACT(HOUR FROM created_at) as hour,
  EXTRACT(DOW FROM created_at) as day_of_week,
  COUNT(*) as activity_count
FROM video_analytics_events
WHERE event_type = 'video_started' AND creator_id = $1
GROUP BY hour, day_of_week
```

**Heatmap Configuration:**
- Days: Sunday - Saturday (rows)
- Hours: 6am, 9am, 12pm, 3pm, 6pm, 9pm (columns)
- Color intensity: Based on activity count (lighter to darker blue)
- Hover tooltip: Shows exact activity count

**Color Scale:**
- Gray: No activity
- Light Blue (20-40%): Low activity
- Medium Blue (40-60%): Moderate activity
- Blue (60-80%): High activity
- Dark Blue (80-100%): Peak activity

**Use Cases:**
- Identify best times to release new content
- Schedule live events during peak engagement
- Understand student learning patterns

### 7. Top Performing Videos Table

**Component:** `TopVideosTable.tsx`

**Data Source:**
```sql
SELECT
  v.id,
  v.title,
  v.thumbnail_url,
  v.duration_seconds,
  v.source_type,
  COUNT(CASE WHEN e.event_type = 'video_started' THEN 1 END) as views,
  AVG(
    CASE WHEN e.event_type = 'video_completed'
    THEN (e.metadata->>'watch_time_seconds')::int
    END
  ) as avg_watch_time,
  COUNT(CASE WHEN e.event_type = 'video_completed' THEN 1 END)::float /
  NULLIF(COUNT(CASE WHEN e.event_type = 'video_started' THEN 1 END), 0) * 100 as completion_rate
FROM videos v
LEFT JOIN video_analytics_events e ON v.id = e.video_id
WHERE v.creator_id = $1
GROUP BY v.id
ORDER BY views DESC
LIMIT 20
```

**Features:**
- Search bar for filtering videos
- Sortable columns (title, views, watch time, completion)
- Pagination (10 videos per page)
- Click row to view detailed video analytics
- Source badges (YouTube, Loom, Mux, Upload)
- Responsive design (hidden columns on mobile)

**Columns:**
- Video (thumbnail + title + duration)
- Source (YouTube/Loom/Mux/Upload)
- Views (sortable)
- Avg Watch Time (sortable, formatted as MM:SS)
- Completion Rate (sortable, color-coded badge)

**Badge Colors:**
- Green (70%+): High completion
- Yellow (50-70%): Medium completion
- Red (<50%): Low completion

## API Endpoint

**Route:** `GET /api/analytics/videos/dashboard`

**Query Parameters:**
- `creator_id` (required): Creator UUID
- `start` (required): ISO date string
- `end` (required): ISO date string

**Response Structure:**
```typescript
{
  success: true,
  data: {
    metrics: {
      total_views: number,
      total_watch_time_seconds: number,
      avg_completion_rate: number,
      total_videos: number,
      trends: {
        views: number,
        watch_time: number,
        completion: number,
        videos: number
      }
    },
    views_over_time: Array<{ date: string; views: number }>,
    completion_rates: Array<{
      video_id: string;
      title: string;
      completion_rate: number;
      views: number;
    }>,
    cost_breakdown: Array<{
      method: string;
      total_cost: number;
      video_count: number;
    }>,
    storage_usage: Array<{
      date: string;
      storage_gb: number;
      cumulative_gb: number;
    }>,
    student_engagement: {
      active_learners: number;
      avg_videos_per_student: number;
      peak_hours: Array<{
        hour: number;
        day_of_week: number;
        activity_count: number;
      }>
    },
    top_videos: Array<{
      id: string;
      title: string;
      thumbnail_url: string | null;
      duration_seconds: number;
      source_type: string;
      views: number;
      avg_watch_time_seconds: number;
      completion_rate: number;
    }>
  }
}
```

**Performance:**
All data queries run in parallel using `Promise.all()` for optimal loading speed.

## Export Functionality

**Component:** `ExportVideoAnalyticsButton.tsx`
**Utility:** `lib/analytics/export-video-analytics.ts`

**Export Format:** CSV

**Exported Sections:**
1. Summary Metrics (views, watch time, completion rate, videos)
2. Trends (vs previous period)
3. Views Over Time (daily breakdown)
4. Completion Rates by Video (top performers)
5. Cost Breakdown (by transcript method)
6. Storage Usage (cumulative trend)
7. Student Engagement (active learners, avg videos per student)
8. Peak Activity Hours (top 20 time slots)
9. Top Performing Videos (top 20 by views)

**Filename Format:**
```
video-analytics-YYYY-MM-DD_to_YYYY-MM-DD.csv
```

**Usage:**
```typescript
import { exportVideoAnalyticsToCSV, downloadCSV } from '@/lib/analytics/export-video-analytics';

const csvContent = exportVideoAnalyticsToCSV(dashboardData);
const filename = `video-analytics-${start}_to_${end}.csv`;
downloadCSV(csvContent, filename);
```

## Database Schema

### Tables Used

**1. video_analytics_events**
- Tracks all video lifecycle events
- Event types: `video_started`, `video_completed`, `video_transcribed`, etc.
- Indexed on: `video_id`, `creator_id`, `student_id`, `event_type`, `timestamp`

**2. videos**
- Video metadata and configuration
- Fields: `title`, `duration_seconds`, `source_type`, `file_size_bytes`, `thumbnail_url`

**3. creators**
- Creator account information
- Used for authorization

## Query Optimization

**Indexes Used:**
```sql
-- Event lookups by creator
CREATE INDEX idx_video_analytics_creator_id ON video_analytics_events(creator_id);

-- Event filtering by type
CREATE INDEX idx_video_analytics_event_type ON video_analytics_events(event_type);

-- Time-series queries
CREATE INDEX idx_video_analytics_timestamp ON video_analytics_events(timestamp DESC);

-- Student engagement queries
CREATE INDEX idx_video_analytics_student_events ON video_analytics_events(student_id, video_id, event_type, timestamp DESC);
```

**Performance Tips:**
1. Use date range filters on `created_at` to limit row scans
2. Filter by `event_type` early in query chain
3. Group by date using `DATE(created_at)` for daily aggregations
4. Use `NULLIF` to avoid division by zero in completion rate calculations
5. Limit result sets appropriately (top 10, top 20)

## User Experience

**Loading States:**
- Dashboard skeleton shown while fetching data
- Smooth transitions between states
- Loading indicator on export button

**Error Handling:**
- Network errors show retry button
- Empty states with helpful messages
- Graceful degradation when data unavailable

**Responsive Design:**
- Mobile: Stacked cards, hidden table columns
- Tablet: 2-column grid for charts
- Desktop: Full layout with all columns

**Accessibility:**
- Semantic HTML structure
- Color-blind friendly palette
- Keyboard navigation support
- ARIA labels on interactive elements

## Future Enhancements

**Potential Features:**
1. Real-time auto-refresh (WebSocket integration)
2. Comparison mode (compare multiple date ranges)
3. Video recommendations based on performance
4. A/B testing for thumbnail optimization
5. Engagement scoring algorithm
6. Predictive analytics (forecast views/completion)
7. Custom report templates
8. Scheduled email reports
9. Cohort analysis (student segments)
10. Video duration optimization suggestions

## Related Documentation

- [Video Implementation Plan](../videos/VIDEO_IMPLEMENTATION_PLAN.md)
- [API Reference](../../api/reference.md)
- [Database Schema](../../database/schema.md)
- [Agent 6 Report (Event Tracking)](../../agent-reports/video-implementation/agent-6-event-tracking-report.md)
- [Agent 5 Report (Cost Tracking)](../../agent-reports/video-implementation/agent-5-cost-tracking-report.md)
