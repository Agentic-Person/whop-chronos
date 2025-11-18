# Student Dashboard Documentation

## Overview

The student dashboard provides students with a comprehensive overview of their learning progress, recent activity, and quick access to courses and AI chat features.

## Architecture

### Component Hierarchy

```
app/dashboard/student/
├── layout.tsx                    # Auth wrapper + StudentNav
├── page.tsx                      # Dashboard home page
├── courses/
│   └── page.tsx                  # Course catalog (existing)
├── chat/
│   └── page.tsx                  # AI chat interface (existing)
└── settings/
    └── page.tsx                  # Settings placeholder

components/
├── layout/
│   └── StudentNav.tsx            # Student navigation component
└── dashboard/
    ├── StudentStats.tsx          # Stats overview cards
    └── RecentActivity.tsx        # Activity feed component
```

### Data Flow

```
Student Dashboard Home
├─ Fetch: GET /api/students/dashboard/[id]
│   ├─ Returns: stats, continueWatching, recentSessions, recentActivity
│   └─ Aggregated in single API call for performance
│
├─ Display Components:
│   ├─ StudentStats (4 metric cards)
│   ├─ Continue Learning (course cards with progress)
│   ├─ Recent Chats (chat sessions list)
│   └─ Recent Activity (activity feed)
```

## Components

### 1. StudentNav (`components/layout/StudentNav.tsx`)

**Purpose:** Primary navigation for student dashboard pages

**Features:**
- 3 main navigation items:
  - My Courses → `/dashboard/student/courses`
  - AI Chat → `/dashboard/student/chat`
  - Settings → `/dashboard/student/settings`
- Active route highlighting (purple accent)
- Mobile responsive (collapsible menu)
- Role switcher (for dual-role users)
- Logout button

**Props:**
```typescript
// No props required - uses usePathname() for active state
```

**Implementation:**
```typescript
import { StudentNav } from '@/components/layout/StudentNav';

// In layout.tsx
<StudentNav />
```

---

### 2. StudentStats (`components/dashboard/StudentStats.tsx`)

**Purpose:** Display 4 key student metrics

**Features:**
- Courses Enrolled count
- Videos Watched count
- Chat Messages sent count
- Completion Rate percentage
- Hover effects
- Icon-based visual design

**Props:**
```typescript
interface StudentStatsProps {
  coursesEnrolled: number;
  videosWatched: number;
  chatMessages: number;
  completionRate: number; // 0-100
}
```

**Layout:**
- 2x2 grid on mobile
- 4x1 grid on desktop
- Each card has icon, value, and label

**Implementation:**
```typescript
<StudentStats
  coursesEnrolled={5}
  videosWatched={42}
  chatMessages={18}
  completionRate={67}
/>
```

---

### 3. RecentActivity (`components/dashboard/RecentActivity.tsx`)

**Purpose:** Activity feed showing recent student actions

**Features:**
- Support for 4 activity types:
  - `video_watched` - Blue icon
  - `lesson_completed` - Green checkmark icon
  - `chat_message` - Orange chat icon
  - `course_started` - Purple book icon
- Relative timestamps ("2 hours ago")
- Clickable items (navigate to related page)
- Empty state for new students

**Props:**
```typescript
interface Activity {
  id: string;
  type: 'video_watched' | 'lesson_completed' | 'chat_message' | 'course_started';
  title: string;
  description?: string;
  timestamp: Date;
  link?: string;
}

interface RecentActivityProps {
  activities: Activity[];
  limit?: number; // Default: 10
}
```

**Implementation:**
```typescript
const activities = [
  {
    id: '1',
    type: 'video_watched',
    title: 'Introduction to Trading',
    timestamp: new Date('2024-11-18T10:00:00Z'),
    link: '/dashboard/student/courses/course-1',
  },
  {
    id: '2',
    type: 'chat_message',
    title: 'What is a candlestick pattern?',
    description: 'Trading Basics Chat',
    timestamp: new Date('2024-11-18T09:30:00Z'),
    link: '/dashboard/student/chat?session=session-1',
  },
];

<RecentActivity activities={activities} limit={10} />
```

---

## API Endpoints

### GET /api/students/dashboard/[id]

**Purpose:** Aggregated dashboard data endpoint (single request for all dashboard data)

**Parameters:**
- `id` - Student ID (UUID)

**Response:**
```typescript
{
  stats: {
    coursesEnrolled: number;
    videosWatched: number;
    chatMessages: number;
    completionRate: number;
  },
  continueWatching: [
    {
      id: string;
      title: string;
      description: string;
      thumbnail_url: string | null;
      progress: number; // 0-100
      total_videos: number;
      watched_videos: number;
      last_accessed: string; // ISO timestamp
    }
  ],
  recentSessions: [
    {
      id: string;
      title: string;
      last_message: string;
      created_at: string; // ISO timestamp
      message_count: number;
    }
  ],
  recentActivity: [
    {
      id: string;
      type: 'video_watched' | 'lesson_completed' | 'chat_message' | 'course_started';
      title: string;
      description?: string;
      timestamp: Date;
      link?: string;
    }
  ]
}
```

**Data Sources:**
- `stats` - Aggregated from `student_courses`, `video_watch_sessions`, `chat_messages`
- `continueWatching` - Top 3 in-progress courses (0% < progress < 100%)
- `recentSessions` - Last 5 chat sessions
- `recentActivity` - Last 10 activities (videos, chats, completions)

**Performance:**
- All queries run in parallel using `Promise.all()`
- Reduces client-side API calls from 3-4 to 1
- Cached for 5 minutes (recommended)

**Error Handling:**
- Returns empty arrays on query failures
- Never throws errors (degrades gracefully)
- 400 if student ID missing
- 500 on critical failures

---

## Dashboard Home Page (`app/dashboard/student/page.tsx`)

### Layout Structure

```
┌─────────────────────────────────────────┐
│ Welcome back!                           │
│ Continue where you left off             │
├─────────────────────────────────────────┤
│ Stats Row (4 cards)                     │
│ [Courses] [Videos] [Chats] [Completion] │
├─────────────────────────────────────────┤
│ Continue Learning                       │
│ ┌────────┐ ┌────────┐ ┌────────┐       │
│ │Course 1│ │Course 2│ │Course 3│       │
│ │ 45%    │ │ 78%    │ │ 12%    │       │
│ └────────┘ └────────┘ └────────┘       │
├─────────────────────────────────────────┤
│ Recent Chats                            │
│ • How to use trading indicators?        │
│ • Explain candlestick patterns          │
│ • What is risk management?              │
├─────────────────────────────────────────┤
│ Recent Activity                         │
│ • Watched: Technical Analysis Basics    │
│ • Completed: Module 2, Lesson 3         │
│ • Asked: "What is stop loss?"           │
└─────────────────────────────────────────┘
```

### States

1. **Loading State**
   - Shows skeleton cards for all sections
   - Uses `StudentStatsSkeleton` and `RecentActivitySkeleton`

2. **Empty State (New Student)**
   - Welcome card with CTA to browse courses
   - No continue watching section
   - Empty recent chats
   - Empty activity feed

3. **Active State (Enrolled Student)**
   - Full dashboard with all sections
   - Continue watching shows 3 courses
   - Recent chats shows 5 sessions
   - Activity feed shows 10 items

4. **Error State**
   - Centered error message
   - Shows error details
   - No retry button (refresh page)

### Responsive Behavior

**Desktop (1440px+):**
- Stats: 4 columns
- Continue Learning: 3 columns
- Full width sections

**Tablet (768px-1439px):**
- Stats: 4 columns
- Continue Learning: 2 columns
- Full width sections

**Mobile (< 768px):**
- Stats: 2 columns (2x2 grid)
- Continue Learning: 1 column (stacked)
- Sections stack vertically

---

## Authentication & Layout

### Student Layout (`app/dashboard/student/layout.tsx`)

**Purpose:** Auth wrapper for all student pages

**Features:**
- Server-side authentication check using `requireAuth()`
- Redirects to login if not authenticated
- Wraps all student pages
- Includes StudentNav component
- Includes RoleSwitcher (for dual-role users)

**Implementation:**
```typescript
export default async function StudentDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireAuth();

  return (
    <AuthProvider session={session}>
      <div className="min-h-screen bg-gray-1">
        <StudentNav />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-4">
            <RoleSwitcher />
          </div>
          {children}
        </main>
      </div>
    </AuthProvider>
  );
}
```

---

## Database Queries

### Stats Calculation

```sql
-- Courses Enrolled
SELECT COUNT(*) FROM student_courses WHERE student_id = $1;

-- Videos Watched
SELECT COUNT(DISTINCT video_id) FROM video_watch_sessions
WHERE student_id = $1 AND total_watch_time_seconds > 0;

-- Chat Messages
SELECT COUNT(*) FROM chat_messages
WHERE role = 'user' AND session_id IN (
  SELECT id FROM chat_sessions WHERE student_id = $1
);

-- Completion Rate
SELECT AVG(progress) FROM student_courses WHERE student_id = $1;
```

### Continue Watching

```sql
SELECT
  sc.course_id,
  sc.progress,
  sc.last_accessed,
  c.title,
  c.description,
  c.thumbnail_url
FROM student_courses sc
JOIN courses c ON c.id = sc.course_id
WHERE sc.student_id = $1
  AND sc.progress > 0
  AND sc.progress < 100
ORDER BY sc.last_accessed DESC
LIMIT 3;
```

### Recent Chat Sessions

```sql
SELECT
  cs.id,
  cs.title,
  cs.created_at,
  COUNT(cm.id) as message_count,
  (SELECT content FROM chat_messages WHERE session_id = cs.id ORDER BY created_at DESC LIMIT 1) as last_message
FROM chat_sessions cs
LEFT JOIN chat_messages cm ON cm.session_id = cs.id
WHERE cs.student_id = $1
GROUP BY cs.id
ORDER BY cs.created_at DESC
LIMIT 5;
```

### Recent Activity

```sql
-- Watch Sessions
SELECT
  'video_watched' as type,
  v.title,
  vws.created_at as timestamp,
  v.id as video_id
FROM video_watch_sessions vws
JOIN videos v ON v.id = vws.video_id
WHERE vws.student_id = $1
ORDER BY vws.created_at DESC
LIMIT 5;

-- Chat Messages
SELECT
  'chat_message' as type,
  cm.content as title,
  cs.title as description,
  cm.created_at as timestamp,
  cs.id as session_id
FROM chat_messages cm
JOIN chat_sessions cs ON cs.id = cm.session_id
WHERE cm.role = 'user' AND cs.student_id = $1
ORDER BY cm.created_at DESC
LIMIT 5;

-- Merge and sort by timestamp, limit 10
```

---

## Testing

### Manual Testing Checklist

- [ ] StudentNav displays with 3 navigation items
- [ ] Active route highlighting works
- [ ] Click each nav item navigates correctly
- [ ] Mobile menu toggles properly
- [ ] Role switcher appears for dual-role users
- [ ] Dashboard page loads without errors
- [ ] Stats cards display correctly
- [ ] Continue learning section shows courses
- [ ] Recent chats section shows sessions
- [ ] Activity feed displays activities
- [ ] Empty state shows for new students
- [ ] Loading skeletons display while fetching
- [ ] Error state shows on API failure
- [ ] Responsive layout works on mobile

### Automated Testing (Playwright)

**Note:** Playwright tests require running dev server with test data seeded.

```bash
# Start dev server
npm run dev

# Seed test data (if needed)
curl -X POST http://localhost:3000/api/seed/dev-creator

# Run Playwright tests (using ui.mcp.json)
# Tests are executed via Playwright MCP in browser
```

**Test Scenarios:**
1. Navigate to `/dashboard/student` → Verify page loads
2. Check StudentNav → All 3 items visible
3. Click "My Courses" → Navigate to courses page
4. Click "AI Chat" → Navigate to chat page
5. Check stats cards → 4 cards visible with values
6. Check responsive layout → 1440px desktop first

---

## Future Enhancements

### Phase 2 Features (Not Implemented)

1. **Settings Page**
   - Profile management
   - Notification preferences
   - Learning preferences
   - Privacy settings

2. **Dashboard Customization**
   - Reorderable sections
   - Show/hide sections
   - Custom dashboard layouts

3. **Advanced Analytics**
   - Learning streak tracking
   - Weekly goals
   - Achievements/badges
   - Leaderboard (optional)

4. **Progress Insights**
   - Time spent learning
   - Topics mastered
   - Recommended next steps
   - AI-powered recommendations

5. **Social Features**
   - Study groups
   - Peer discussions
   - Share progress

---

## Files Created

1. `components/layout/StudentNav.tsx` - Student navigation component
2. `components/dashboard/StudentStats.tsx` - Stats overview cards
3. `components/dashboard/RecentActivity.tsx` - Activity feed component
4. `app/dashboard/student/layout.tsx` - Student dashboard layout wrapper
5. `app/dashboard/student/page.tsx` - Dashboard home page
6. `app/dashboard/student/settings/page.tsx` - Settings placeholder
7. `app/api/students/dashboard/[id]/route.ts` - Aggregated dashboard API
8. `docs/student-experience/dashboard.md` - This documentation

---

## Dependencies

**Required:**
- `frosted-ui` - Whop UI components
- `lucide-react` - Icons
- `date-fns` - Relative timestamp formatting
- `next` - Next.js framework
- `react` - React library

**Auth:**
- `@/lib/contexts/AuthContext` - Auth state management
- `@/lib/whop/auth` - Server-side auth (requireAuth)

**Database:**
- `@/lib/db/client` - Supabase client

---

## Troubleshooting

### Dashboard not loading
- Check authentication: User must be authenticated
- Check API endpoint: `/api/students/dashboard/[id]` should return 200
- Check browser console for errors
- Verify student ID is valid UUID

### Stats showing 0
- Check database: Student may have no enrolled courses
- Verify student_courses table has data
- Check video_watch_sessions for watch data
- Check chat_sessions and chat_messages for chat data

### Continue Learning empty
- Student must have courses with 0% < progress < 100%
- Check student_courses.progress field
- Verify last_accessed timestamp is set

### Activity feed empty
- Check video_watch_sessions for recent watches
- Check chat_messages for recent messages
- Verify timestamps are recent

---

## Performance Optimization

### Current Optimizations

1. **Aggregated API Endpoint**
   - Single request instead of 3-4
   - Parallel database queries
   - Reduces network overhead

2. **Client-side Caching**
   - React state caching
   - No re-fetch on navigation back

3. **Loading States**
   - Skeleton screens for better UX
   - No blocking renders

### Recommended Future Optimizations

1. **Server-side Caching**
   - Cache dashboard data for 5 minutes
   - Use Redis/Vercel KV
   - Invalidate on student activity

2. **Database Indexes**
   - Index on `student_courses.student_id`
   - Index on `video_watch_sessions.student_id`
   - Index on `chat_sessions.student_id`
   - Composite index on `student_courses(student_id, last_accessed)`

3. **Query Optimization**
   - Use database views for complex queries
   - Precompute stats daily
   - Limit activity feed to last 30 days

---

## Accessibility

- All interactive elements have proper ARIA labels
- Keyboard navigation supported
- Color contrast meets WCAG AA standards
- Screen reader friendly

---

## Deployment Notes

- No environment variables required beyond existing Supabase config
- No database migrations needed (uses existing tables)
- No special build configuration
- Works with existing auth system

---

## Support

For questions or issues:
1. Check console for errors
2. Verify authentication status
3. Check API endpoint responses
4. Review database data
5. Contact development team

---

**Last Updated:** November 18, 2024
**Version:** 1.0.0
**Author:** Agent 3 - Student Dashboard Implementation
