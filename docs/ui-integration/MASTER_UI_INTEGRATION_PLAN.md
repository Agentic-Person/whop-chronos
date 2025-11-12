# Chronos UI Integration Master Plan

**Project Start Date:** November 12, 2025
**Estimated Completion:** 10-14 hours (wall time with parallel agents)
**Status:** Phase 1 - Not Started
**Last Updated:** November 12, 2025

---

## 📋 Executive Summary

This master plan addresses the critical UI integration issues in Chronos, focusing on fixing the broken CourseBuilder and integrating all backend features with frontend components. The backend is 95% complete with 44 functional API endpoints, but the frontend UI is only 65% complete with a **critical blocker** preventing core functionality.

### Current State
- ✅ **Backend:** 95% complete - All APIs working, RAG chat functional
- ⚠️ **Frontend:** 65% complete - Analytics/chat excellent, course builder broken
- 🔥 **Critical Issue:** CourseBuilder cannot display imported videos (empty blue boxes)

### Goals
1. Fix CourseBuilder video display (BLOCKER)
2. Integrate video players for all sources (YouTube, Mux, Loom, Upload)
3. Build missing UI components (video management, Whop import)
4. Polish UI with error handling and real-time updates
5. Implement advanced features (drag-drop, detailed analytics)

---

## 📊 Feature Tracking System

All features follow a 4-stage lifecycle:

| Stage | Description | Responsibility | Exit Criteria |
|-------|-------------|----------------|---------------|
| **1. In Progress** | Agent actively working | Agent | Code written, documented |
| **2. Complete** | Agent finished work | Agent | All implementation tasks done |
| **3. Tested** | Automated testing passed | Playwright MCP | Browser tests pass, screenshots captured |
| **4. Integrated** | Manual verification complete | User (Jimmy) | Manually tested, works in production |

### Tracking Document
See [`FEATURE_TRACKING.md`](./FEATURE_TRACKING.md) for current status of all features.

---

## 🗂️ Documentation Structure

```
docs/ui-integration/
├── MASTER_UI_INTEGRATION_PLAN.md          # This document
├── FEATURE_TRACKING.md                     # Feature status tracking
├── AGENT_HANDOFF_TEMPLATE.md              # Template for agent reports
├── phase-1-critical-fixes/
│   ├── agent-a-coursebuilder-fix.md
│   ├── agent-b-video-player.md
│   └── screenshots/
├── phase-2-video-integration/
│   ├── agent-c-student-viewer.md
│   ├── agent-d-video-dashboard.md
│   └── screenshots/
├── phase-3-missing-components/
│   ├── agent-e-whop-import.md
│   └── screenshots/
├── phase-4-polish/
│   ├── agent-f-error-handling.md
│   ├── agent-g-mobile-responsive.md
│   └── screenshots/
├── phase-5-advanced/
│   ├── agent-h-drag-drop.md
│   ├── agent-i-analytics-detail.md
│   └── screenshots/
└── testing-reports/
    ├── playwright-test-results.md
    ├── browser-compatibility.md
    └── performance-benchmarks.md
```

---

## 🎯 Phase 1: Critical Fixes (4-6 hours)

**Status:** Not Started
**Priority:** 🔥 CRITICAL - System Blocker
**Agents:** A, B
**Documentation:** `phase-1-critical-fixes/`

### Feature 1.1: Fix CourseBuilder Video Display
**Agent:** Agent A
**Estimated Time:** 2-3 hours
**Status:** Not Started
**Stage:** None

**Problem Statement:**
When videos are imported via YouTube URL in the CourseBuilder, they appear as empty blue boxes instead of proper video cards with thumbnails, titles, and durations. This makes the core course-building workflow completely unusable.

**Root Cause Analysis:**
- VideoUrlUploader component returns incomplete video object
- CourseBuilder expects different data structure in handleVideoUploaded
- State management broken between components
- Video metadata not being passed through prop chain

**Implementation Tasks:**
1. Debug VideoUrlUploader data return structure
2. Fix CourseBuilder handleVideoUploaded function signature
3. Ensure video thumbnails render from YouTube API
4. Display video titles and durations correctly
5. Wire up delete video functionality
6. Add loading states during video import
7. Implement error states for failed imports

**Files to Modify:**
- `components/courses/VideoUrlUploader.tsx` (541 lines)
- `components/courses/CourseBuilder.tsx` (627 lines)
- `components/video/VideoPreview.tsx` (if exists)

**Testing Requirements:**
1. Import YouTube video via URL
2. Verify video card displays with thumbnail
3. Verify title and duration shown
4. Test video deletion
5. Test error handling (invalid URL, private video)
6. Mobile responsive check (Playwright)

**Success Criteria:**
- ✅ Videos display with thumbnail, title, duration
- ✅ Can add multiple videos to lessons
- ✅ Can delete videos from lessons
- ✅ State persists correctly
- ✅ Mobile responsive

**Documentation Required:**
- Agent handoff report following template
- Before/after screenshots
- Code architecture diagram
- Troubleshooting guide

---

### Feature 1.2: Apply Missing Database Migration
**Agent:** Agent A (as part of Feature 1.1)
**Estimated Time:** 15 minutes
**Status:** Not Started
**Stage:** None

**Problem Statement:**
The `module_lessons` table doesn't exist in the database, causing lesson CRUD API endpoints to fail. This prevents course persistence.

**Migration File:**
`supabase/migrations/20250112000001_create_module_lessons.sql`

**Implementation Tasks:**
1. Verify migration file exists and is correct
2. Apply migration to database
3. Regenerate TypeScript types (`npm run db:types`)
4. Verify lesson API endpoints work
5. Test CourseBuilder persistence

**SQL Schema:**
```sql
CREATE TABLE module_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES course_modules(id) ON DELETE CASCADE,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  lesson_order INTEGER NOT NULL,
  title TEXT,
  description TEXT,
  is_required BOOLEAN DEFAULT true,
  estimated_duration_minutes INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Testing Requirements:**
1. Verify table exists in database
2. Test POST `/api/modules/[id]/lessons`
3. Test GET `/api/modules/[id]/lessons`
4. Test PATCH `/api/modules/[id]/lessons/[lessonId]`
5. Test DELETE `/api/modules/[id]/lessons/[lessonId]`

**Success Criteria:**
- ✅ Migration applied successfully
- ✅ Types regenerated
- ✅ All lesson API endpoints functional
- ✅ CourseBuilder can save lessons

---

### Feature 1.3: End-to-End Course Building Test
**Agent:** Agent A
**Estimated Time:** 1 hour
**Status:** Not Started
**Stage:** None

**Purpose:**
Verify complete course creation workflow works after fixes.

**Test Workflow:**
1. **Login as creator**
2. **Import YouTube video**
   - Navigate to CourseBuilder
   - Click "Add Video" → "YouTube" tab
   - Paste valid YouTube URL
   - Click "Fetch Metadata"
   - Verify metadata displays
   - Click "Import Video"
   - Wait for processing (5-6 seconds)
   - Verify video appears with thumbnail

3. **Create course**
   - Enter course title
   - Enter course description
   - Upload thumbnail (optional)
   - Click "Create Course"
   - Verify course created

4. **Add module**
   - Click "Add Module"
   - Enter module title
   - Enter module description
   - Click "Save"
   - Verify module appears

5. **Add lesson with video**
   - Click "Add Lesson" in module
   - Select imported video
   - Enter lesson title
   - Click "Save"
   - Verify lesson appears with video

6. **Verify persistence**
   - Refresh page
   - Verify course structure persists
   - Check database directly for records

7. **Check student view** (if exists)
   - Navigate to student course viewer
   - Verify course displays correctly
   - Test video playback

**Playwright Test Script:**
Test with real browser using Playwright MCP server.

**Success Criteria:**
- ✅ Complete workflow executes without errors
- ✅ Data persists to database
- ✅ UI reflects saved state
- ✅ Student can view course

---

### Feature 1.4: Unified Video Player Component
**Agent:** Agent B
**Estimated Time:** 2 hours
**Status:** Not Started
**Stage:** None

**Purpose:**
Create a single video player component that routes to the appropriate player based on video source type.

**Component Architecture:**
```typescript
<UnifiedVideoPlayer
  video={videoObject}
  onProgress={(percent) => {}}
  onComplete={() => {}}
  autoplay={false}
  startTime={0}
/>

// Routes to:
- YouTubePlayer (for source_type='youtube')
- MuxPlayer (for source_type='mux')
- LoomPlayer (for source_type='loom')
- GenericPlayer (for source_type='upload')
```

**Implementation Tasks:**
1. Create `components/video/UnifiedVideoPlayer.tsx`
2. Implement router logic based on `source_type`
3. Create `MuxPlayer.tsx` (HLS streaming)
4. Create `LoomPlayer.tsx` (iframe embed)
5. Update existing `VideoPlayer.tsx` (YouTube + upload)
6. Implement common player controls interface
7. Add analytics event tracking to all players
8. Add error handling for each player type

**Player Features (All Players):**
- Play/pause controls
- Volume control
- Seek bar with timestamps
- Playback speed (0.5x, 1x, 1.25x, 1.5x, 2x)
- Fullscreen mode
- Picture-in-picture (where supported)
- Keyboard shortcuts (space, arrow keys, f)
- Progress tracking (emit events at 10%, 25%, 50%, 75%, 90%)
- Completion tracking (90%+ = complete)
- Watch time tracking (actual seconds watched)
- Timestamp jumping (for chat citations)

**Analytics Events to Track:**
```typescript
- video_started (timestamp, device)
- video_progress (percent_complete: 10/25/50/75/90)
- video_completed (total_watch_time)
- video_paused (timestamp)
- video_resumed (timestamp)
- video_seeked (from_time, to_time)
- playback_speed_changed (old_speed, new_speed)
```

**Files to Create:**
- `components/video/UnifiedVideoPlayer.tsx`
- `components/video/MuxPlayer.tsx`
- `components/video/LoomPlayer.tsx`
- `components/video/PlayerControls.tsx` (shared controls)
- `lib/video/player-analytics.ts` (analytics helper)

**Testing Requirements (Playwright):**
1. Test YouTube video playback
2. Test Mux video playback (if available)
3. Test Loom video playback
4. Test uploaded video playback
5. Verify all controls work
6. Test keyboard shortcuts
7. Test mobile responsive controls
8. Verify analytics events fire correctly

**Success Criteria:**
- ✅ All 4 video sources play correctly
- ✅ Common controls work across all players
- ✅ Analytics events tracked accurately
- ✅ Mobile responsive (touch controls)
- ✅ Error states handled gracefully

---

## 🎯 Phase 2: Video Player Integration (3-4 hours)

**Status:** Not Started
**Priority:** HIGH - Core Functionality
**Agents:** C, D
**Documentation:** `phase-2-video-integration/`

### Feature 2.1: Student Course Viewer Page
**Agent:** Agent C
**Estimated Time:** 2-3 hours
**Status:** Not Started
**Stage:** None

**Purpose:**
Build student-facing course player page where students can watch videos and track progress.

**Page Route:**
`/dashboard/student/courses/[courseId]`

**Component Architecture:**
```
StudentCourseViewer
├── CourseSidebar (modules, lessons, progress)
├── VideoPlayerSection (UnifiedVideoPlayer)
├── LessonMetadata (title, description, resources)
└── NavigationControls (prev, next, mark complete)
```

**Implementation Tasks:**
1. Create page at `app/dashboard/student/courses/[courseId]/page.tsx`
2. Fetch course with modules and lessons
3. Build course navigation sidebar
4. Integrate UnifiedVideoPlayer
5. Implement lesson navigation (prev/next)
6. Add "Mark as Complete" button
7. Track watch progress to database
8. Show completion checkmarks on completed lessons
9. Calculate and display course progress percentage
10. Add breadcrumb navigation

**Database Integration:**
- Read: courses, course_modules, module_lessons, videos
- Write: video_watch_sessions, video_analytics_events

**UI Features:**
- Collapsible module sections
- Current lesson highlighted
- Progress indicators (checkmarks, percentages)
- Video autoplay next lesson (optional setting)
- Resume from last watched position
- Mobile responsive (full-width video on small screens)

**Testing Requirements (Playwright):**
1. Navigate to course as student
2. Verify course structure displays
3. Click lesson and verify video plays
4. Test prev/next navigation
5. Mark lesson complete and verify persists
6. Refresh and verify resumes at correct position
7. Test on mobile viewport (375px)

**Success Criteria:**
- ✅ Students can view course structure
- ✅ Videos play correctly
- ✅ Progress tracked and persists
- ✅ Navigation intuitive
- ✅ Mobile responsive

---

### Feature 2.2: Video Management Dashboard
**Agent:** Agent D
**Estimated Time:** 2 hours
**Status:** Not Started
**Stage:** None

**Purpose:**
Build comprehensive video library management interface for creators.

**Page Route:**
`/dashboard/creator/videos`

**Component Architecture:**
```
VideoManagementDashboard
├── VideoLibraryGrid (filterable, sortable grid)
├── VideoFilters (status, source, date range)
├── BulkActions (delete, reprocess, export)
├── ProcessingMonitor (real-time status updates)
└── VideoDetailModal (view/edit metadata, transcript)
```

**Implementation Tasks:**
1. Create page at `app/dashboard/creator/videos/page.tsx`
2. Fetch all creator videos with pagination
3. Build video grid with thumbnail, title, duration, status
4. Add filters (status, source_type, date range)
5. Add sorting (date, title, duration, views)
6. Implement bulk selection with checkboxes
7. Add bulk actions (delete, reprocess embeddings)
8. Build processing status monitor
9. Add retry buttons for failed videos
10. Create video detail modal
11. Build transcript viewer/editor in modal
12. Add video analytics preview in modal

**Video Card Display:**
```
┌─────────────────────┐
│   [Thumbnail]       │
│                     │
├─────────────────────┤
│ Video Title         │
│ Duration | Status   │
│ Views: 123          │
│ [Edit] [Delete]     │
└─────────────────────┘
```

**Status Badge Colors:**
- pending: gray
- uploading: blue (animated)
- transcribing: yellow (animated)
- processing: yellow (animated)
- embedding: yellow (animated)
- completed: green
- failed: red

**Bulk Actions:**
- Delete selected (with confirmation)
- Reprocess embeddings (for failed videos)
- Export metadata (CSV)
- Add to course (quick add)

**Testing Requirements (Playwright):**
1. Navigate to video dashboard
2. Verify all videos display with correct status
3. Test filters (status, source)
4. Test sorting options
5. Select multiple videos and test bulk delete
6. Click video and verify modal opens
7. Test transcript viewer in modal
8. Test on tablet viewport (768px)

**Success Criteria:**
- ✅ All videos display correctly
- ✅ Filters and sorting work
- ✅ Bulk operations functional
- ✅ Modal displays video details
- ✅ Retry buttons work for failed videos

---

## 🎯 Phase 3: Missing UI Components (4-5 hours)

**Status:** Not Started
**Priority:** MEDIUM - Enhanced Features
**Agents:** E
**Documentation:** `phase-3-missing-components/`

### Feature 3.1: Whop Video Import Wizard
**Agent:** Agent E
**Estimated Time:** 2 hours
**Status:** Not Started
**Stage:** None

**Purpose:**
Allow creators to bulk import existing Whop courses and videos into Chronos.

**Component Location:**
`components/courses/WhopImportWizard.tsx`

**Wizard Flow:**
```
Step 1: Select Whop Product
  ↓
Step 2: Select Videos to Import
  ↓
Step 3: Review Import Settings
  ↓
Step 4: Import Progress
  ↓
Step 5: Import Complete (summary)
```

**Implementation Tasks:**
1. Create wizard component with 5 steps
2. Use Whop MCP server tools to list products
3. Fetch videos from selected product
4. Display video previews with checkboxes
5. Allow bulk selection (select all, deselect all)
6. Configure import settings (auto-transcribe, add to course)
7. Implement import progress indicator
8. Show success/failure summary
9. Handle partial failures gracefully
10. Add "Import Another" button on completion

**Whop MCP Tools to Use:**
```typescript
mcp__whop__list_products()
mcp__whop__get_product_details(productId)
// Note: Video extraction may need custom API call to Whop
```

**API Endpoint:**
`POST /api/video/whop/import`

**UI Features:**
- Product thumbnail and title display
- Video count per product
- Estimated import time
- Real-time progress updates
- Error handling with retry options
- Skip already imported videos (duplicate detection)

**Testing Requirements (Playwright):**
1. Open wizard from CourseBuilder
2. Verify Whop products load
3. Select product and verify videos display
4. Select multiple videos
5. Test import process
6. Verify videos appear in library
7. Test error handling (network failure)

**Success Criteria:**
- ✅ Can browse Whop products
- ✅ Can select and import videos
- ✅ Progress tracked in real-time
- ✅ Errors handled gracefully
- ✅ Imported videos appear in library

---

### Feature 3.2: Course Preview Mode
**Agent:** Agent E
**Estimated Time:** 1 hour
**Status:** Not Started
**Stage:** None

**Purpose:**
Let creators preview their course exactly as students will see it.

**Implementation:**
Add "Preview as Student" button to CourseBuilder that opens course in student view in new tab.

**Implementation Tasks:**
1. Add preview button to CourseBuilder header
2. Generate preview URL with auth token
3. Open in new tab showing student view
4. Add banner indicating "Preview Mode"
5. Disable progress tracking in preview mode
6. Add "Exit Preview" button to return to builder

**URL Format:**
`/dashboard/student/courses/[courseId]?preview=true&token=xxxxx`

**UI Features:**
- Prominent "Preview Mode" banner
- "Exit Preview" button
- Same UI as student view
- No progress saved
- No analytics tracked

**Testing Requirements (Playwright):**
1. Click "Preview as Student" button
2. Verify opens in new tab
3. Verify student view renders correctly
4. Verify banner shows "Preview Mode"
5. Play video and verify no progress saved
6. Click "Exit Preview" and verify returns to builder

**Success Criteria:**
- ✅ Preview opens correctly
- ✅ Matches actual student view
- ✅ No data saved during preview
- ✅ Easy to exit preview

---

## 🎯 Phase 4: Polish & Integration (3-4 hours)

**Status:** Not Started
**Priority:** MEDIUM - User Experience
**Agents:** F, G
**Documentation:** `phase-4-polish/`

### Feature 4.1: Error Handling UI
**Agent:** Agent F
**Estimated Time:** 1.5 hours
**Status:** Not Started
**Stage:** None

**Purpose:**
Implement comprehensive error handling UI across all features.

**Components to Create:**
1. **ErrorBoundary** - Catch React errors
2. **ErrorCard** - Display errors with actions
3. **ToastNotification** - Success/error toasts
4. **RetryButton** - Retry failed operations
5. **ErrorModal** - Detailed error information

**Implementation Tasks:**
1. Wrap app in ErrorBoundary component
2. Create ErrorCard component (reusable)
3. Integrate toast notification library (react-hot-toast)
4. Add retry buttons to failed video cards
5. Create error state components for empty states
6. Add network error handling
7. Add validation error display (forms)
8. Add loading states with skeletons

**Error Types to Handle:**
- **Network Errors:** "Unable to connect. Check your internet."
- **API Errors:** "Something went wrong. Please try again."
- **Validation Errors:** "Invalid YouTube URL. Please check and try again."
- **Authentication Errors:** "Session expired. Please login again."
- **Quota Errors:** "Storage limit reached. Upgrade your plan."
- **Processing Errors:** "Video processing failed. Click to retry."

**Toast Notification Usage:**
```typescript
// Success
toast.success("Video imported successfully!")

// Error
toast.error("Failed to import video. Please try again.")

// Loading
toast.loading("Importing video...")
```

**Testing Requirements (Playwright):**
1. Trigger network error and verify error card displays
2. Verify retry button appears and works
3. Test form validation errors display correctly
4. Verify toast notifications appear and dismiss
5. Test error boundary catches and displays errors

**Success Criteria:**
- ✅ All errors display user-friendly messages
- ✅ Retry buttons work correctly
- ✅ Toast notifications intuitive
- ✅ Error states don't crash app

---

### Feature 4.2: Real-time Progress Updates
**Agent:** Agent F
**Estimated Time:** 2 hours
**Status:** Not Started
**Stage:** None

**Purpose:**
Show live updates during video processing without requiring page refresh.

**Implementation Approach:**
Use polling (WebSocket if time allows)

**Components:**
1. **ProcessingProgressBar** - Animated progress
2. **ProcessingStatusBadge** - Real-time status updates
3. **NotificationBell** - Alert when processing complete

**Implementation Tasks:**
1. Create polling hook `useVideoProcessingStatus(videoId)`
2. Poll `/api/video/[id]/status` every 3 seconds
3. Update UI when status changes
4. Show progress percentage where applicable
5. Add notification when video completes
6. Add notification count badge on bell icon
7. Stop polling when video reaches completed/failed state
8. Implement optimistic UI updates

**Polling Hook:**
```typescript
const { status, progress, error } = useVideoProcessingStatus(videoId, {
  interval: 3000,
  enabled: isProcessing
});
```

**Progress Mapping:**
```typescript
pending: 0%
uploading: 10%
transcribing: 30%
processing: 50%
embedding: 80%
completed: 100%
failed: error
```

**Notification System:**
- Store notifications in localStorage
- Show badge count on bell icon
- Dropdown list of recent notifications
- Click to view video
- Mark as read functionality

**Testing Requirements (Playwright):**
1. Import video and verify progress updates
2. Watch progress bar animate through stages
3. Verify notification appears when complete
4. Click notification and verify navigates to video
5. Test multiple simultaneous uploads

**Success Criteria:**
- ✅ Status updates in real-time
- ✅ Progress bar accurate
- ✅ Notifications work correctly
- ✅ No unnecessary API calls

---

### Feature 4.3: Mobile Responsiveness Audit
**Agent:** Agent G
**Estimated Time:** 1 hour
**Status:** Not Started
**Stage:** None

**Purpose:**
Ensure all new components work flawlessly on mobile devices.

**Test Viewports:**
- **Mobile:** 375px (iPhone SE)
- **Tablet:** 768px (iPad)
- **Desktop:** 1440px (standard)

**Pages to Test:**
1. CourseBuilder
2. Video Management Dashboard
3. Student Course Viewer
4. Whop Import Wizard
5. Video Player (all types)
6. Analytics Dashboard
7. Chat Interface

**Playwright Test Script:**
```typescript
// Test each page at 3 breakpoints
for (const viewport of [375, 768, 1440]) {
  await page.setViewportSize({ width: viewport, height: 800 });
  await page.goto('/dashboard/creator/courses');
  await page.screenshot({ path: `coursebuilder-${viewport}.png` });
  // Test interactions...
}
```

**Mobile-Specific Checks:**
- Touch targets at least 44x44px
- Text readable without zooming
- No horizontal scrolling
- Navigation accessible
- Forms usable with on-screen keyboard
- Video player has mobile controls
- Modals fit on screen
- Menus stack properly

**Testing Requirements (Playwright):**
1. Test all pages at 375px width
2. Test all pages at 768px width
3. Verify touch interactions work
4. Test on-screen keyboard doesn't break layout
5. Capture screenshots for comparison
6. Test landscape orientation on mobile
7. Verify video player fullscreen works

**Deliverables:**
- Screenshot comparison report
- List of responsive issues found
- Fixes implemented
- Updated responsive styles

**Success Criteria:**
- ✅ All pages work on mobile (375px)
- ✅ Touch targets appropriately sized
- ✅ No horizontal scroll
- ✅ Video player mobile-friendly
- ✅ Forms accessible on mobile

---

## 🎯 Phase 5: Advanced Features (4-5 hours)

**Status:** Not Started
**Priority:** LOW - Nice to Have
**Agents:** H, I
**Documentation:** `phase-5-advanced/`

### Feature 5.1: Drag-and-Drop Course Builder Enhancement
**Agent:** Agent H
**Estimated Time:** 2 hours
**Status:** Not Started
**Stage:** None

**Purpose:**
Add intuitive drag-and-drop functionality to CourseBuilder.

**Library to Use:**
`@dnd-kit/core` + `@dnd-kit/sortable`

**Drag-and-Drop Features:**
1. Drag modules to reorder
2. Drag lessons within module to reorder
3. Drag videos from library to lessons
4. Drag lessons between modules
5. Visual feedback during drag (ghost element)
6. Drop zones highlighted on hover
7. Auto-save on drop

**Implementation Tasks:**
1. Install @dnd-kit dependencies
2. Wrap CourseBuilder in DndContext
3. Make modules draggable/sortable
4. Make lessons draggable/sortable
5. Make video cards draggable from library
6. Implement drop zones in lessons
7. Update display_order on drop
8. Save changes to database via API
9. Add visual feedback (shadows, highlights)
10. Add undo button for accidental drops

**API Updates:**
```typescript
PATCH /api/courses/[id]/modules/reorder
PATCH /api/modules/[id]/lessons/reorder
```

**Visual Feedback:**
- Dragging item: 50% opacity
- Drop zone: green border + background tint
- Invalid drop: red border
- Successful drop: brief flash animation

**Testing Requirements (Playwright):**
1. Drag module to new position
2. Verify order persists after refresh
3. Drag lesson within module
4. Drag lesson to different module
5. Drag video from library to lesson
6. Test invalid drops rejected
7. Verify auto-save works

**Success Criteria:**
- ✅ All drag-and-drop interactions smooth
- ✅ Visual feedback clear
- ✅ Order persists to database
- ✅ Undo functionality works
- ✅ Mobile touch drag works (if possible)

---

### Feature 5.2: Video Analytics Detail Page
**Agent:** Agent I
**Estimated Time:** 2 hours
**Status:** Not Started
**Stage:** None

**Purpose:**
Provide in-depth analytics for individual videos.

**Page Route:**
`/dashboard/creator/videos/[id]/analytics`

**Component Architecture:**
```
VideoAnalyticsDetailPage
├── VideoHeader (title, thumbnail, basic stats)
├── PerformanceMetrics (cards: views, watch time, completion)
├── WatchTimeHeatmap (which parts watched most)
├── EngagementChart (views over time)
├── StudentEngagementTable (who watched, progress)
├── ChatReferencesCard (citations in chat)
└── ExportButton (export analytics as CSV/PDF)
```

**Metrics to Display:**

**1. Overview Cards:**
- Total Views
- Unique Viewers
- Avg Watch Time
- Completion Rate
- Rewatch Count
- Chat References

**2. Watch Time Heatmap:**
Show which video segments are watched most/least.
```
[████████░░░░░░░░████████]
0:00    2:30    5:00    7:30    10:00
```
- Dark bars = high watch time
- Light bars = low watch time
- Identify drop-off points

**3. Engagement Over Time:**
Line chart showing views per day (7/30/90 day filters)

**4. Student Engagement Table:**
| Student | Watch Time | Progress | Last Watched | Completion |
|---------|-----------|----------|--------------|------------|
| John D. | 8m 34s | 85% | 2 hours ago | ✅ |
| Jane S. | 3m 12s | 32% | 1 day ago | ⏸️ |

**5. Chat References:**
Show how often this video is cited in AI chat responses.
- Total citations
- Sample questions that triggered this video
- Timestamp references

**Implementation Tasks:**
1. Create page at `app/dashboard/creator/videos/[id]/analytics/page.tsx`
2. Fetch video analytics from `/api/analytics/videos/[id]`
3. Build watch time heatmap (Recharts)
4. Build engagement line chart (Recharts)
5. Build student engagement table (sortable)
6. Fetch chat citations
7. Add export functionality (CSV/PDF)
8. Add date range filter
9. Add comparison mode (compare to avg)

**Testing Requirements (Playwright):**
1. Navigate to video analytics page
2. Verify all metrics display correctly
3. Test date range filter
4. Test chart interactions (hover, tooltip)
5. Click student and navigate to profile (if applicable)
6. Test export functionality
7. Verify mobile responsive (768px)

**Success Criteria:**
- ✅ All metrics accurate
- ✅ Heatmap visualizes watch patterns
- ✅ Charts interactive and informative
- ✅ Export functionality works
- ✅ Mobile responsive

---

### Feature 5.3: Bulk Video Upload
**Agent:** Agent I
**Estimated Time:** 1 hour
**Status:** Not Started
**Stage:** None

**Purpose:**
Allow creators to upload multiple videos at once.

**Component:**
`components/video/BulkVideoUploader.tsx`

**Features:**
- Drag-and-drop multiple files
- File queue with progress bars
- Parallel uploads (max 3 concurrent)
- Pause/resume uploads
- Remove from queue
- Auto-trigger processing after upload
- Batch naming/tagging

**Implementation Tasks:**
1. Create multi-file upload component
2. Implement file queue management
3. Handle parallel uploads (limit 3)
4. Show individual progress bars
5. Add pause/resume functionality
6. Add bulk metadata editing
7. Trigger processing jobs for all videos
8. Show summary when all complete

**UI Layout:**
```
┌─────────────────────────────────────┐
│ Drag & Drop Files Here              │
│ or click to browse                  │
└─────────────────────────────────────┘

Upload Queue (3/10 completed):
┌─────────────────────────────────────┐
│ video1.mp4 ████████████░░ 75%       │
│ video2.mp4 █████░░░░░░░░░ 35%       │
│ video3.mp4 Queued... [X]             │
│ video4.mp4 Completed ✅              │
└─────────────────────────────────────┘

[Upload All] [Pause All] [Clear Completed]
```

**API Endpoint:**
Use existing `/api/video/upload` with multiple calls

**Testing Requirements (Playwright):**
1. Drop 5 video files
2. Verify queue displays correctly
3. Verify parallel uploads (max 3)
4. Test pause/resume
5. Test remove from queue
6. Verify all videos process after upload
7. Test on slow network (throttle)

**Success Criteria:**
- ✅ Can upload multiple videos simultaneously
- ✅ Progress tracked accurately
- ✅ Pause/resume works
- ✅ All videos process successfully
- ✅ Quota limits enforced

---

## 📝 Agent Documentation Standards

All agents must follow the handoff template at [`AGENT_HANDOFF_TEMPLATE.md`](./AGENT_HANDOFF_TEMPLATE.md).

### Required Sections:
1. **Executive Summary** (2-3 sentences)
2. **Feature Status** (current stage: In Progress/Complete/Tested/Integrated)
3. **Implementation Details** (what was built)
4. **Files Created/Modified** (with line counts)
5. **Key Decisions** (architecture choices and why)
6. **Challenges & Solutions** (problems encountered)
7. **Testing Results** (Playwright test outcomes)
8. **Integration Notes** (how it connects to other features)
9. **Handoff Checklist** (what's complete, what's pending)
10. **Next Steps** (for next agent or phase)

### Screenshots Required:
- Before state (if fixing bugs)
- After state
- Mobile responsive views (375px, 768px)
- Error states
- Empty states
- Loading states

### Code Quality Standards:
- TypeScript strict mode
- No `any` types (use proper types)
- Props interfaces defined
- Error boundaries used
- Loading states handled
- Comments on complex logic
- Consistent naming conventions
- Follow existing code patterns

---

## 🧪 Testing Strategy

### Playwright MCP Server (ui.mcp.json)

**Configuration:**
```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp"],
      "enabled": true
    }
  }
}
```

**Usage:**
```bash
claude --mcp-config ui.mcp.json
```

### Test Types:

**1. Component Tests**
- Render tests (does it appear?)
- Interaction tests (click, type, drag)
- State tests (props/state changes)
- Accessibility tests (ARIA labels, keyboard nav)

**2. Integration Tests**
- Multi-component workflows
- API integration tests
- Database persistence tests
- Real-time update tests

**3. E2E Tests**
- Complete user journeys
- Course creation flow
- Student learning flow
- Video import flow

**4. Visual Regression Tests**
- Screenshot comparison
- CSS rendering consistency
- Responsive layout checks

**5. Performance Tests**
- Lighthouse scores (target: >90)
- First Contentful Paint (<2s)
- Time to Interactive (<3s)
- Bundle size analysis

### Browser Testing Matrix:

| Browser | Desktop | Mobile | Tablet |
|---------|---------|--------|--------|
| Chrome | ✅ | ✅ | ✅ |
| Firefox | ✅ | ✅ | ✅ |
| Safari | ✅ | ✅ | ✅ |
| Edge | ✅ | - | - |

### Playwright Test Script Template:
```typescript
test('CourseBuilder displays imported YouTube video', async ({ page }) => {
  // Setup
  await page.goto('/dashboard/creator/courses');

  // Action
  await page.click('button:has-text("Add Video")');
  await page.fill('input[placeholder="YouTube URL"]', YOUTUBE_URL);
  await page.click('button:has-text("Import")');

  // Wait for processing
  await page.waitForSelector('.video-card', { timeout: 10000 });

  // Assert
  const thumbnail = await page.locator('.video-card img');
  expect(await thumbnail.isVisible()).toBeTruthy();

  const title = await page.locator('.video-card h3');
  expect(await title.textContent()).toContain('Expected Title');

  // Screenshot
  await page.screenshot({ path: 'coursebuilder-with-video.png' });
});
```

---

## 📊 Progress Tracking

### Overall Progress

| Phase | Features | Status | Progress | Est. Time | Actual Time |
|-------|----------|--------|----------|-----------|-------------|
| Phase 1 | 3 | Not Started | 0% | 4-6 hours | - |
| Phase 2 | 2 | Not Started | 0% | 3-4 hours | - |
| Phase 3 | 2 | Not Started | 0% | 4-5 hours | - |
| Phase 4 | 3 | Not Started | 0% | 3-4 hours | - |
| Phase 5 | 3 | Not Started | 0% | 4-5 hours | - |
| **Total** | **13** | **Not Started** | **0%** | **18-24 hours** | **0 hours** |

### Feature Status Summary

See [`FEATURE_TRACKING.md`](./FEATURE_TRACKING.md) for detailed tracking.

---

## 🚀 Execution Recommendations

### Session 1 (4-6 hours) - Critical Path
**Goal:** Fix blocker, make system usable

**Parallel Agents:**
- **Agent A:** Fix CourseBuilder + apply migration + E2E test
- **Agent B:** Build UnifiedVideoPlayer

**Deliverables:**
- CourseBuilder displays videos correctly ✅
- Video players functional ✅
- End-to-end course creation works ✅

**Exit Criteria:**
Can create a course with YouTube videos and students can watch.

---

### Session 2 (4-5 hours) - Core Features
**Goal:** Complete student experience, video management

**Parallel Agents:**
- **Agent C:** Student Course Viewer
- **Agent D:** Video Management Dashboard
- **Agent E:** Whop Import Wizard + Preview Mode

**Deliverables:**
- Student course viewer complete ✅
- Video library management ✅
- Whop import working ✅

**Exit Criteria:**
Complete creator and student workflows functional.

---

### Session 3 (3-4 hours) - Polish
**Goal:** Error handling, mobile responsive, real-time updates

**Parallel Agents:**
- **Agent F:** Error handling UI + real-time progress
- **Agent G:** Mobile responsiveness audit

**Deliverables:**
- Comprehensive error handling ✅
- Real-time progress updates ✅
- Mobile responsive across all pages ✅

**Exit Criteria:**
Production-ready UX with excellent error handling.

---

### Session 4 (4-5 hours) - Advanced Features
**Goal:** Drag-drop, detailed analytics, bulk upload

**Parallel Agents:**
- **Agent H:** Drag-and-drop course builder
- **Agent I:** Video analytics detail page + bulk upload

**Deliverables:**
- Drag-drop course building ✅
- Detailed video analytics ✅
- Bulk video upload ✅

**Exit Criteria:**
Feature-complete platform with advanced capabilities.

---

## ✅ Success Criteria

### Must Have (Phases 1-2)
- [x] CourseBuilder displays videos correctly
- [x] End-to-end course creation works
- [x] Video players functional for all sources
- [x] Student can watch courses
- [x] Progress persists to database
- [x] Video management dashboard working
- [x] Mobile responsive

### Should Have (Phases 3-4)
- [x] Whop import wizard
- [x] Course preview mode
- [x] Error handling UI
- [x] Real-time progress updates
- [x] Toast notifications
- [x] Comprehensive testing

### Nice to Have (Phase 5)
- [x] Drag-and-drop course builder
- [x] Video analytics detail page
- [x] Bulk video upload
- [x] Advanced visualizations

---

## 📞 Contact & Support

**Project Lead:** Jimmy Solutions Developer
**Email:** Jimmy@AgenticPersonnel.com
**Company:** Agentic Personnel LLC

**Claude Code Configuration:**
- Primary: Default configuration (backend/API work)
- UI Development: `ui.mcp.json` with Playwright MCP

**Documentation Location:**
`docs/ui-integration/`

---

## 📝 Changelog

### November 12, 2025
- Created master UI integration plan
- Set up documentation structure
- Defined 4-stage tracking system
- Created agent handoff template
- Initialized feature tracking

---

**Last Updated:** November 12, 2025
**Document Version:** 1.0
**Status:** Ready for Execution

---

