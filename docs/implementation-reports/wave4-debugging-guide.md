# Wave 4: Debugging Guide for Student Pages Timeout

**Issue:** All student pages hang indefinitely on load
**Priority:** 🔴 CRITICAL
**Impact:** 100% of student functionality broken

---

## Quick Diagnosis Checklist

Run these commands to quickly identify the issue:

### Step 1: Test Supabase Connection

```bash
# Navigate to project
cd D:/APS/Projects/whop/chronos

# Test Supabase connection with curl
curl -X GET \
  "$(grep NEXT_PUBLIC_SUPABASE_URL .env.local | cut -d '=' -f2)/rest/v1/" \
  -H "apikey: $(grep NEXT_PUBLIC_SUPABASE_ANON_KEY .env.local | cut -d '=' -f2)"

# Expected: {"message":"Welcome to PostgREST..."}
# If error: Supabase connection failed
```

### Step 2: Check Database Tables

```bash
# Using Supabase CLI
supabase db pull --local

# List all tables
supabase db execute "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"

# Expected tables:
# - courses
# - course_modules
# - module_lessons
# - video_watch_sessions
# - students
# - creators
# - videos
# - video_chunks
# - chat_sessions
# - chat_messages
```

### Step 3: Test API Endpoint Directly

```bash
# Test student courses API
curl -v "http://localhost:3000/api/courses/student?student_id=00000000-0000-0000-0000-000000000002" \
  --max-time 10

# Expected: JSON response within 5 seconds
# If timeout: Database query issue
# If 400: Missing student_id or validation error
# If 500: Server/database error
```

### Step 4: Check Auth Context

Add this to `app/dashboard/student/courses/page.tsx` line 39:

```typescript
const { userId: studentId } = useAuth();

// Add debug logging
useEffect(() => {
  console.log('[COURSES PAGE] Auth state:', {
    studentId,
    hasStudentId: !!studentId,
    timestamp: new Date().toISOString()
  });
}, [studentId]);
```

Reload page and check browser console. If `studentId` never appears, auth context is stuck.

### Step 5: Check API Route Execution

Add this to `app/api/courses/student/route.ts` line 45:

```typescript
export async function GET(req: NextRequest) {
  console.log('[API] Student courses request received', {
    timestamp: new Date().toISOString(),
    url: req.url,
  });

  try {
    const { searchParams } = new URL(req.url);
    console.log('[API] Query params:', Object.fromEntries(searchParams));

    // ... rest of code
```

Reload page and check server logs. If no log appears, request never reaches API.

---

## Common Issues & Fixes

### Issue 1: Supabase Connection Failed

**Symptoms:**
- API endpoint returns 500 error
- Error message: "Failed to fetch courses"
- Server logs show database connection error

**Fix:**

1. Check `.env.local` has correct credentials:
   ```bash
   cat .env.local | grep SUPABASE
   ```

2. Verify Supabase project is active:
   - Go to https://app.supabase.com
   - Check project status
   - Unpause if paused

3. Update `.env.local` with correct URLs:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

4. Restart dev server:
   ```bash
   npm run dev
   ```

---

### Issue 2: Database Tables Missing

**Symptoms:**
- API endpoint returns empty array
- Error message: "relation does not exist"
- Supabase query fails

**Fix:**

1. Check which migrations have been applied:
   ```bash
   supabase migration list
   ```

2. Apply all pending migrations:
   ```bash
   supabase db push
   ```

3. Verify tables exist:
   ```bash
   supabase db execute "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"
   ```

4. If tables still missing, create them manually using Supabase Studio or SQL editor

---

### Issue 3: Database Query Timeout

**Symptoms:**
- API endpoint times out after 30-60 seconds
- No error message
- Server logs show query started but never completed

**Fix:**

1. Add query timeout to API route (`app/api/courses/student/route.ts`):

```typescript
// After line 66, wrap Supabase query with timeout
const queryPromise = supabase
  .from('courses')
  .select(`...`)
  .eq('is_published', true);

const timeoutPromise = new Promise((_, reject) =>
  setTimeout(() => reject(new Error('Database query timeout')), 10000)
);

const { data: courses, error: coursesError } = await Promise.race([
  queryPromise,
  timeoutPromise
]) as any;
```

2. Add database indices for faster queries:

```sql
-- Add index on courses.is_published
CREATE INDEX IF NOT EXISTS idx_courses_published
ON courses(is_published, is_deleted)
WHERE is_published = true AND is_deleted = false;

-- Add index on course_modules.course_id
CREATE INDEX IF NOT EXISTS idx_course_modules_course_id
ON course_modules(course_id);

-- Add index on module_lessons.module_id
CREATE INDEX IF NOT EXISTS idx_module_lessons_module_id
ON module_lessons(module_id);

-- Add index on video_watch_sessions.student_id
CREATE INDEX IF NOT EXISTS idx_video_watch_sessions_student
ON video_watch_sessions(student_id, video_id);
```

3. Simplify query by removing unnecessary joins:

```typescript
// Instead of fetching all related data in one query,
// fetch courses first, then get modules separately
const { data: courses } = await supabase
  .from('courses')
  .select('id, title, description, thumbnail_url, created_at, updated_at')
  .eq('is_published', true)
  .eq('is_deleted', false)
  .limit(50);

// Then fetch modules for those courses
const courseIds = courses.map(c => c.id);
const { data: modules } = await supabase
  .from('course_modules')
  .select('id, course_id, module_lessons(id, video_id, estimated_duration_minutes)')
  .in('course_id', courseIds);
```

---

### Issue 4: Auth Context Infinite Loop

**Symptoms:**
- Page loads but stays in loading state forever
- No API request is made
- `studentId` never resolves in `useAuth()`

**Fix:**

1. Check `AuthContext` implementation (`lib/contexts/AuthContext.tsx`):
   - Ensure it has proper loading state management
   - Check for infinite loops in `useEffect`
   - Verify it eventually sets `isLoading: false`

2. Add timeout to page loading state:

```typescript
// In app/dashboard/student/courses/page.tsx
const [loadingTimeout, setLoadingTimeout] = useState(false);

useEffect(() => {
  const timer = setTimeout(() => {
    if (isLoading) {
      setLoadingTimeout(true);
      setError('Page took too long to load. Please refresh.');
      setIsLoading(false);
    }
  }, 30000); // 30 second timeout

  return () => clearTimeout(timer);
}, [isLoading]);
```

3. Add fallback UI if auth fails:

```typescript
if (!studentId && !isLoading) {
  return (
    <div className="min-h-screen bg-gray-1 flex items-center justify-center">
      <div className="text-center">
        <Heading size="6" className="mb-2">Not Authenticated</Heading>
        <Text size="3" className="text-gray-11 mb-4">
          Please log in to view courses.
        </Text>
        <Button onClick={() => window.location.href = '/login'}>
          Go to Login
        </Button>
      </div>
    </div>
  );
}
```

---

### Issue 5: Network/Proxy Issue

**Symptoms:**
- curl to localhost:3000 works
- Browser to localhost:3000 hangs
- whop-proxy logs show errors

**Fix:**

1. Test bypassing proxy (use port 3007 directly):
   ```bash
   # Find the bypass port in server logs
   # Example: "to bypass the proxy, use the following original port: 55415"
   curl "http://localhost:55415/api/courses/student?student_id=..."
   ```

2. If bypass works, issue is with whop-proxy:
   - Check whop-proxy configuration
   - Try running without proxy: `next dev --port 3000`
   - Check for port conflicts: `netstat -ano | findstr :3000`

3. Clear browser cache and restart:
   - Hard refresh: Ctrl+Shift+R (Chrome)
   - Clear site data: DevTools → Application → Clear storage
   - Restart browser

---

## Testing After Fix

Once you believe the issue is fixed, test with these steps:

### 1. Test API Endpoint
```bash
curl "http://localhost:3000/api/courses/student?student_id=00000000-0000-0000-0000-000000000002"
```
**Expected:** JSON response within 5 seconds

### 2. Test Page Load
```bash
# Using Playwright
npx playwright test --headed
```
**Expected:** Page loads within 5 seconds

### 3. Manual Browser Test
1. Open browser to `http://localhost:3000/dashboard/student/courses`
2. Page should load within 5 seconds
3. Should see either:
   - Loading skeleton (briefly)
   - Course grid with courses
   - Empty state with "No courses found"
   - Error message with retry button

### 4. Test All Student Pages
- `/dashboard/student` - Dashboard home
- `/dashboard/student/courses` - Course catalog
- `/dashboard/student/chat` - Chat interface
- `/dashboard/student/settings` - Settings

All should load within 5 seconds.

---

## Logging Strategy

Add these logs to track down the issue:

### Browser Console Logs

```typescript
// app/dashboard/student/courses/page.tsx

// Log component mount
useEffect(() => {
  console.log('[COURSES] Component mounted');
  return () => console.log('[COURSES] Component unmounted');
}, []);

// Log auth state changes
useEffect(() => {
  console.log('[COURSES] Auth changed:', { studentId, hasId: !!studentId });
}, [studentId]);

// Log filter changes
useEffect(() => {
  console.log('[COURSES] Filters changed:', { filter, searchQuery, sortBy });
}, [filter, searchQuery, sortBy]);

// Log fetch start/end
const fetchCourses = useCallback(async () => {
  console.log('[COURSES] Fetch started');
  try {
    // ... fetch logic
    console.log('[COURSES] Fetch completed:', { count: data.length });
  } catch (err) {
    console.error('[COURSES] Fetch failed:', err);
  }
}, [studentId, filter, searchQuery, sortBy]);
```

### Server Logs

```typescript
// app/api/courses/student/route.ts

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  console.log('[API] Request received:', {
    url: req.url,
    timestamp: new Date().toISOString(),
  });

  try {
    // ... processing

    console.log('[API] Database query started');
    const { data, error } = await supabase.from('courses').select('...');
    console.log('[API] Database query completed:', {
      duration: Date.now() - startTime,
      rowCount: data?.length,
      hasError: !!error,
    });

    // ... more processing

    console.log('[API] Request completed:', {
      duration: Date.now() - startTime,
      status: 200,
    });

    return NextResponse.json(...);
  } catch (error) {
    console.error('[API] Request failed:', {
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown',
    });
    return NextResponse.json(...);
  }
}
```

---

## Performance Benchmarks

After fixing, these are the expected performance metrics:

| Metric | Target | Acceptable | Unacceptable |
|--------|--------|------------|--------------|
| API Response Time | < 1s | < 3s | > 5s |
| Page Load Time | < 2s | < 5s | > 10s |
| Time to Interactive | < 3s | < 7s | > 15s |
| Database Query Time | < 500ms | < 2s | > 5s |
| Auth Context Resolution | < 100ms | < 500ms | > 2s |

If any metric is in "Unacceptable" range, further optimization needed.

---

## Monitoring Setup

After fixing, add monitoring to prevent regression:

### 1. Add Health Check Endpoint

Create `app/api/health/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/db/client';

export async function GET() {
  const startTime = Date.now();

  try {
    // Test database connection
    const { data, error } = await supabase
      .from('courses')
      .select('id')
      .limit(1);

    const duration = Date.now() - startTime;

    if (error) {
      return NextResponse.json({
        status: 'unhealthy',
        database: 'error',
        error: error.message,
        duration,
      }, { status: 500 });
    }

    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      duration,
    });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown',
      duration: Date.now() - startTime,
    }, { status: 500 });
  }
}
```

Test with: `curl http://localhost:3000/api/health`

### 2. Add Performance Monitoring

Use Vercel Analytics or add custom logging:

```typescript
// lib/monitoring/performance.ts
export function trackPageLoad(page: string, duration: number) {
  console.log('[PERF]', { page, duration });

  // Send to analytics service
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'page_load', {
      page_path: page,
      duration_ms: duration,
    });
  }
}

// Use in pages
useEffect(() => {
  const startTime = performance.now();
  return () => {
    trackPageLoad('/dashboard/student/courses', performance.now() - startTime);
  };
}, []);
```

---

## Contact

If you're still stuck after trying all fixes above, document:

1. Which diagnostic steps you ran
2. Output of each command
3. Any error messages
4. Server logs
5. Browser console logs

Then escalate to senior developer or create detailed GitHub issue.

---

**Document Version:** 1.0
**Last Updated:** 2025-11-18
**Author:** Agent 7 (Browser Testing Specialist)
