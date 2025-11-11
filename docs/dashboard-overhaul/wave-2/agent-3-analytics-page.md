# Wave 2 - Agent 3: Analytics Page

**Agent:** Agent 3
**Wave:** Wave 2 - Page Development
**Status:** 🔵 Pending
**Start Time:** Not started
**End Time:** Not started
**Duration:** TBD

---

## 📋 Assigned Tasks

**Primary Goal:** Build comprehensive analytics dashboard with charts, tables, and video performance metrics

**Current State:** Placeholder page with "Coming Soon" content
**Target State:** Full analytics dashboard with real data visualization

### 1. Video Performance Metrics

**Top Stats Cards:**
- Total video views (all time)
- Total watch time (hours)
- Average completion rate (%)
- Active students/viewers

**Video Performance Table:**
- Sortable columns:
  - Video title (with thumbnail)
  - Views count
  - Watch time (minutes)
  - Completion rate (%)
  - Engagement score
  - Last viewed date
- Search/filter functionality
- Pagination (20 per page)
- Export to CSV button

**Individual Video Deep Dive:**
- Click video to see detailed analytics
- Views over time (line chart)
- Completion rate funnel
- Drop-off points (where students stop watching)
- Rewatch rate
- Student feedback/ratings

### 2. Student Engagement Tracking

**Engagement Overview:**
- Active students (daily/weekly/monthly)
- New students this period
- Student retention rate
- Average session duration

**Student Activity Chart:**
- Line chart showing daily/weekly activity
- Heatmap of most active times
- Course completion rates
- Chat usage correlation

**Engagement Metrics Table:**
- Most engaged students
- Least engaged students (at risk)
- Average questions asked per student
- Course progress distribution

### 3. Growth & Revenue Metrics

**Growth Charts:**
- Student enrollment over time (line chart)
- Revenue over time (line chart)
- Course popularity trends
- Chat API usage trends

**Conversion Metrics:**
- Trial to paid conversion rate
- Course completion to next purchase
- Upsell success rate
- Churn rate

### 4. AI Chat Analytics

**Chat Usage:**
- Total chat sessions
- Messages per session (average)
- Most asked questions (word cloud or list)
- AI response satisfaction (if tracked)
- Cost per chat session

**Chat Performance:**
- Response time (average)
- Successful resolutions
- Topics causing confusion (low satisfaction)
- Video reference click-through rate

### 5. Time Period Filters

**Date Range Selector:**
- Last 7 days
- Last 30 days
- Last 90 days
- This month
- Last month
- Custom date range

**Comparison Mode:**
- Compare current period to previous period
- Show delta (+ or - %)
- Highlight trends (up/down arrows)

### 6. Export & Reporting

**Export Options:**
- Download as CSV
- Download as PDF report
- Schedule automated reports (future)
- Email report to team (future)

---

## 📁 Files to Modify

- `app/dashboard/creator/analytics/page.tsx`
  - [ ] Remove placeholder "Coming Soon" content
  - [ ] Build full analytics dashboard
  - [ ] Implement all metric sections
  - [ ] Add charts using Recharts
  - [ ] Add data tables
  - [ ] Add filters and date range selector
  - [ ] Responsive design
  - [ ] Loading states
  - [ ] Error handling

---

## 🎨 Frosted UI Components to Use

- `Card` - Metric cards, chart containers
- `Table` - Video performance, engagement tables
- `Select` - Date range, filters
- `Button` - Export, filter actions
- `Badge` - Status indicators, trends
- `Tabs` - Switch between different analytics views
- `Skeleton` - Loading states
- `Progress` - Completion rates
- `Tooltip` - Chart data points
- Design tokens: `--gray-*`, `--accent-*`

### Recharts Components
- `LineChart` - Trends over time
- `BarChart` - Comparisons
- `PieChart` - Distribution
- `AreaChart` - Engagement over time
- `ResponsiveContainer` - Responsive charts
- `Tooltip` - Data point details
- `Legend` - Chart legends

---

## 🧪 Playwright Tests Required (MANDATORY)

### Test 1: Analytics Page Loads
- [ ] Navigate to /dashboard/creator/analytics
- [ ] Verify no more "Coming Soon" message
- [ ] Verify all metric cards visible
- [ ] No console errors
- **Result:** PENDING

### Test 2: Top Stats Display
- [ ] Check total views displays
- [ ] Check watch time displays
- [ ] Check completion rate displays
- [ ] Check active students displays
- **Result:** PENDING

### Test 3: Video Performance Table
- [ ] Verify table renders with data
- [ ] Click column headers to sort
- [ ] Search for specific video
- [ ] Test pagination
- [ ] Click "Export CSV" button
- **Result:** PENDING

### Test 4: Charts Render Correctly
- [ ] Verify line charts display
- [ ] Verify bar charts display
- [ ] Hover over data points
- [ ] Check tooltips show
- [ ] Verify responsive sizing
- **Result:** PENDING

### Test 5: Date Range Filter
- [ ] Click date range selector
- [ ] Select "Last 7 days"
- [ ] Verify data updates
- [ ] Select "Last 30 days"
- [ ] Select custom date range
- **Result:** PENDING

### Test 6: Comparison Mode
- [ ] Enable comparison mode
- [ ] Verify delta percentages show
- [ ] Check up/down trend arrows
- [ ] Verify previous period data
- **Result:** PENDING

### Test 7: Individual Video Deep Dive
- [ ] Click on a video in table
- [ ] Verify detailed view opens
- [ ] Check all charts render
- [ ] Check drop-off analysis
- **Result:** PENDING

### Test 8: Chat Analytics Section
- [ ] Scroll to chat analytics
- [ ] Verify chat metrics display
- [ ] Check most asked questions list
- [ ] Verify cost per session
- **Result:** PENDING

### Test 9: Responsive Design
- [ ] Test at 375px (mobile)
- [ ] Test at 768px (tablet)
- [ ] Test at 1440px (desktop)
- [ ] Charts adapt to viewport
- [ ] Tables scroll horizontally on mobile
- **Result:** PENDING

### Test 10: Loading States
- [ ] Verify skeletons show while loading
- [ ] Verify smooth transition to data
- [ ] No layout shift
- **Result:** PENDING

---

## 📸 Screenshots (MANDATORY - Use Playwright MCP!)

**Naming Convention:** `wave-2-agent-3-analytics-[feature]-[viewport].png`

Screenshots to capture:
- [ ] Full analytics dashboard - desktop
- [ ] Top stats cards - close-up
- [ ] Video performance table - desktop
- [ ] Line chart example - close-up
- [ ] Date range selector - open state
- [ ] Chat analytics section - desktop
- [ ] Individual video deep dive - desktop
- [ ] Mobile view (375px) - dashboard
- [ ] Loading state with skeletons
- [ ] Export menu - open state

---

## 🚨 Issues Encountered

*Document any issues here as they arise*

---

## 🔗 Dependencies

- **Recharts library** - Already installed for charts
- **Supabase analytics queries** - `lib/analytics/` functions
- **Video analytics table** - `video_analytics` in database
- **Chat analytics** - `chat_sessions` and `chat_messages` tables
- **Date range calculations** - Need helper functions
- **CSV export library** - May need `papaparse` or similar
- **Whop membership data** - For student metrics

---

## ✅ Completion Checklist

- [ ] Placeholder content removed
- [ ] All metric sections implemented
- [ ] Charts using Recharts working
- [ ] Video performance table functional
- [ ] Student engagement metrics showing
- [ ] Growth charts implemented
- [ ] Chat analytics section complete
- [ ] Date range filter working
- [ ] Comparison mode functional
- [ ] Export to CSV working
- [ ] All Frosted UI components used
- [ ] Responsive design verified
- [ ] All Playwright tests passing
- [ ] Screenshots saved
- [ ] No console errors
- [ ] Code follows project patterns
- [ ] Ready for integration testing

---

## 📝 Implementation Notes

### Before Starting
- Review existing analytics functions in `lib/analytics/`
- Check database schema for `video_analytics` table
- Plan data fetching strategy (API routes vs. server components)
- Decide on caching strategy for expensive queries
- Test Recharts with sample data first

### Color Scheme for Charts
Use Frosted UI color tokens:
- Primary line: `--accent-9`
- Secondary line: `--accent-6`
- Success: `--green-9`
- Warning: `--orange-9`
- Danger: `--red-9`
- Neutral: `--gray-9`

### Chart Configuration
- Responsive: Always use `ResponsiveContainer`
- Tooltips: Show on hover with formatted values
- Legends: Position top-right
- Grid: Subtle gray lines (`--gray-4`)
- Animation: Smooth transitions (300ms)

### Data Fetching Strategy
- Server components for initial data
- Client components for interactive charts
- SWR or React Query for real-time updates
- Cache analytics data for 5-10 minutes
- Refresh on user action (date range change)

### During Implementation
- **USE PLAYWRIGHT MCP** - Test each chart as you build it
- Start with one section at a time
- Test with real data if available, mock data if not
- Verify calculations are correct
- Check performance with large datasets

### After Completion
- Full dashboard walkthrough
- Test all filters and interactions
- Verify chart responsiveness
- Check accessibility (keyboard navigation)
- Performance audit (should load in < 3 seconds)
- Mobile testing on actual device

---

## 🎯 Success Criteria

✅ Full analytics dashboard replaces placeholder
✅ All key metrics displayed with real data
✅ Charts render correctly using Recharts
✅ Video performance table sortable and searchable
✅ Date range filter works smoothly
✅ Export to CSV functional
✅ Chat analytics section complete
✅ Individual video deep dive working
✅ Responsive on all screen sizes
✅ All Playwright tests passing with browser verification
✅ Performance is acceptable (< 3s load)
✅ Provides valuable insights for creators
