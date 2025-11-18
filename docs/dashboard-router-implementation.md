# Dashboard Router Implementation

**Component:** `app/dashboard/page.tsx`
**Purpose:** Auto-redirect users to correct dashboard based on role detection
**Status:** Complete
**Agent:** Agent 2

---

## Overview

The Dashboard Router is the entry point for `/dashboard` that intelligently routes users to either the creator dashboard or student dashboard based on their Whop account role. Users should never manually see this page - it acts as a transparent routing layer.

---

## How It Works

### 1. Authentication Check

```typescript
const { userId, isAuthenticated } = useAuth();
```

The router first checks if the user is authenticated by:
- Reading `userId` from AuthContext
- Checking `isAuthenticated` boolean
- Waiting for auth to initialize (`userId === undefined` means still loading)

### 2. Role Detection Flow

```
User visits /dashboard
    ↓
Check auth state
    ↓
userId === undefined? → Wait (still loading)
    ↓
!isAuthenticated? → Redirect to login (/api/whop/auth/login)
    ↓
Authenticated → Call detectUserRole(userId)
    ↓
Get roleResult { role: 'creator' | 'student' | 'both' | 'none' }
    ↓
Call getDefaultDashboardRoute(roleResult.role)
    ↓
Auto-redirect to correct dashboard
```

### 3. Routing Logic (from `lib/whop/roles.ts`)

| Role | Default Route | Behavior |
|------|---------------|----------|
| `creator` | `/dashboard/creator/overview` | Creator-only user |
| `student` | `/dashboard/student/courses` | Student-only user |
| `both` | `/dashboard/creator/overview` | Dual-role user (shows role switcher) |
| `none` | `/` | No Whop relationship, back to landing |

---

## UI States

### 1. Loading State (Default)

**When:**
- Auth is initializing (`userId === undefined`)
- Role detection is in progress

**UI:**
```
┌─────────────────────────────┐
│                             │
│         ◉ (spinner)         │
│                             │
│  Loading your dashboard...  │
│  Checking authentication... │
│                             │
└─────────────────────────────┘
```

**Features:**
- Animated spinner with double-ring design
- Dynamic status message
- Centered full-screen layout

### 2. Error State

**When:**
- Role detection API fails
- Network timeout
- Unexpected error in flow

**UI:**
```
┌─────────────────────────────┐
│                             │
│    ⚠️ Unable to Load        │
│       Dashboard             │
│                             │
│  [Error message here]       │
│                             │
│      [Try Again Button]     │
│                             │
│  If problem persists...     │
│                             │
└─────────────────────────────┘
```

**Features:**
- Warning icon (triangle with exclamation)
- Clear error message
- Retry button (reloads page)
- Support guidance

### 3. Redirect State

**When:**
- Role successfully detected
- Route determined
- `router.push()` called

**UI:**
- Returns `null` (no render needed)
- Browser redirects immediately
- No flash of content

---

## Key Implementation Details

### useEffect Dependencies

```typescript
useEffect(() => {
  async function detectAndRedirect() {
    // ... role detection logic
  }
  detectAndRedirect();
}, [userId, isAuthenticated, router]);
```

**Why these dependencies?**
- `userId` - Triggers when auth loads
- `isAuthenticated` - Triggers on auth state change
- `router` - Required by React hooks rules (stable reference)

### Early Return Patterns

**Pattern 1: Wait for Auth**
```typescript
if (userId === undefined) {
  return; // Still loading, don't do anything yet
}
```

**Pattern 2: Redirect Unauthenticated**
```typescript
if (!isAuthenticated || !userId) {
  router.push('/api/whop/auth/login');
  return; // Exit early
}
```

**Pattern 3: Handle Errors**
```typescript
catch (err) {
  console.error('Role detection failed:', err);
  setError(err.message);
  setIsDetectingRole(false); // Stop loading state
}
```

### Loading State Management

```typescript
const [isDetectingRole, setIsDetectingRole] = useState(true);
```

**Why start with `true`?**
- Prevents flash of error state
- Shows loading immediately on mount
- Set to `false` only on error (success redirects away)

---

## Integration with Other Components

### AuthContext Integration

**What we use:**
- `userId` - Whop user ID for role detection
- `isAuthenticated` - Boolean flag
- `useAuth()` - React hook to access context

**What we don't use (yet):**
- `creatorId` - Not needed for routing logic
- Future role fields from Agent 3's enhancements

### Role Detection Service Integration

**Import:**
```typescript
import { detectUserRole, getDefaultDashboardRoute } from '@/lib/whop/roles';
```

**Usage:**
```typescript
// 1. Detect role
const roleResult = await detectUserRole(userId);

// 2. Get route
const defaultRoute = getDefaultDashboardRoute(roleResult.role);

// 3. Redirect
router.push(defaultRoute);
```

**Note:** This service is built by Agent 1 in parallel. We can mock it during development.

---

## Error Handling Strategy

### 1. Network Errors

**Cause:** Whop API timeout, offline mode
**Handling:**
```typescript
catch (err) {
  console.error('Role detection failed:', err);
  setError('Failed to connect. Please check your internet connection.');
}
```

### 2. Invalid User Data

**Cause:** User has no Whop account, corrupted session
**Handling:**
```typescript
// detectUserRole returns { role: 'none' }
// getDefaultDashboardRoute('none') returns '/'
router.push('/'); // Back to landing page
```

### 3. Unexpected Errors

**Cause:** Bug in role detection logic
**Handling:**
```typescript
setError(
  err instanceof Error
    ? err.message
    : 'Failed to determine your dashboard. Please try again.'
);
```

### 4. Retry Mechanism

**User Action:** Click "Try Again" button
**Behavior:**
```typescript
onClick={() => window.location.reload()}
```

**Why `window.location.reload()`?**
- Clears any stale state
- Re-fetches auth from server
- Simpler than managing retry counter
- Forces fresh role detection

---

## User Experience Flow

### Creator User

```
1. Visit chronos.app/dashboard
2. See loading spinner (0.5s)
3. Auto-redirect to /dashboard/creator/overview
4. See creator dashboard immediately
5. No role switcher (creator-only)
```

### Student User

```
1. Visit chronos.app/dashboard
2. See loading spinner (0.5s)
3. Auto-redirect to /dashboard/student/courses
4. See student course catalog immediately
5. No role switcher (student-only)
```

### Dual-Role User

```
1. Visit chronos.app/dashboard
2. See loading spinner (0.5s)
3. Auto-redirect to /dashboard/creator/overview (default)
4. See creator dashboard
5. Role switcher appears (can switch to student view)
6. localStorage remembers preference
```

### Unauthenticated User

```
1. Visit chronos.app/dashboard
2. See loading spinner (0.3s)
3. Auto-redirect to /api/whop/auth/login
4. Whop OAuth flow starts
5. After login, return to /dashboard
6. Process restarts with authenticated state
```

### No Membership User

```
1. Visit chronos.app/dashboard
2. See loading spinner (0.5s)
3. Role detected as 'none'
4. Auto-redirect to /
5. Landing page shows "Get Started" CTA
```

---

## Performance Considerations

### No Flash of Wrong Content

**Problem:** User sees creator dashboard for 1 frame before redirect to student
**Solution:**
- Return `null` during redirect
- No render happens
- Browser redirects immediately

### Minimal Loading Time

**Optimizations:**
- Role detection service caches results (5min TTL)
- Parallel API calls in `detectUserRole()`
- Whop SDK is already initialized
- No heavy computations in router

**Expected timings:**
- Auth check: < 100ms
- Role detection (cached): < 50ms
- Role detection (fresh): 300-500ms
- Total time to redirect: 500-700ms

### Accessibility

**Loading state:**
- Semantic HTML (divs with proper structure)
- Color contrast compliant (WCAG AA)
- Loading message for screen readers
- Keyboard navigable retry button

**Error state:**
- Clear error icon (triangle warning)
- Descriptive error text
- Actionable retry button
- Focus trap on button

---

## Testing Checklist

### Unit Tests (Component Level)

- [ ] Loading spinner shows on mount
- [ ] Waits for `userId !== undefined` before proceeding
- [ ] Redirects unauthenticated users to login
- [ ] Calls `detectUserRole()` with correct userId
- [ ] Calls `getDefaultDashboardRoute()` with detected role
- [ ] Redirects to returned route
- [ ] Shows error UI on detection failure
- [ ] Retry button reloads page
- [ ] Returns null during redirect (no render)

### Integration Tests (with Role Service)

- [ ] Creator user redirects to `/dashboard/creator/overview`
- [ ] Student user redirects to `/dashboard/student/courses`
- [ ] Dual-role user redirects to `/dashboard/creator/overview`
- [ ] No-membership user redirects to `/`
- [ ] Dev bypass mode uses test user IDs
- [ ] API error shows retry button

### Browser Tests (Manual QA)

- [ ] No infinite redirect loops
- [ ] Back button works correctly
- [ ] Direct URL access works (e.g., `/dashboard`)
- [ ] Page reload preserves redirect
- [ ] Mobile responsive (spinner centered)
- [ ] Error state readable on mobile
- [ ] Loading state shows immediately (no blank screen)

---

## Code Quality

### TypeScript Coverage

- ✅ All variables typed
- ✅ Error handling typed (`Error | unknown`)
- ✅ Imports typed from role service
- ✅ React hooks properly typed

### React Best Practices

- ✅ Client component directive (`'use client'`)
- ✅ useEffect with correct dependencies
- ✅ Cleanup not needed (redirect exits component)
- ✅ No memory leaks (no subscriptions)
- ✅ Error boundaries can catch errors

### Tailwind Styling

- ✅ Responsive classes
- ✅ Theme-aware colors (`primary`, `destructive`, `muted-foreground`)
- ✅ Accessible focus states
- ✅ Smooth transitions

---

## Future Enhancements (Post-Phase 1)

### 1. Role Caching (Agent 3)

Once AuthContext includes role data:
```typescript
const { role, isDetectingRole } = useAuth();

// Skip detection if role already in context
if (role) {
  const route = getDefaultDashboardRoute(role);
  router.push(route);
  return;
}
```

### 2. Preload Dashboard Data

```typescript
// After role detection, preload data for target dashboard
const route = getDefaultDashboardRoute(roleResult.role);
await prefetchDashboardData(route); // Fetch before redirect
router.push(route);
```

### 3. Analytics Tracking

```typescript
// Track role detection timing
const startTime = Date.now();
const roleResult = await detectUserRole(userId);
const detectionTime = Date.now() - startTime;

trackEvent('role_detection', {
  role: roleResult.role,
  detectionTime,
  userId
});
```

### 4. Fallback Route on Error

```typescript
catch (err) {
  console.error('Role detection failed:', err);

  // Fallback: Guess role based on URL params or localStorage
  const lastKnownRole = localStorage.getItem('chronos_last_role');
  if (lastKnownRole) {
    router.push(getDefaultDashboardRoute(lastKnownRole as UserRole));
  } else {
    setError('Failed to determine your dashboard.');
  }
}
```

---

## Dependencies

### Runtime Dependencies

- `react` - useState, useEffect hooks
- `next/navigation` - useRouter for client-side navigation
- `@/lib/contexts/AuthContext` - Authentication state
- `@/lib/whop/roles` - Role detection service (Agent 1)

### No New Package Installs

All dependencies already exist in the project.

---

## Environment Variables

No environment variables needed for this component.

Uses existing:
- `NEXT_PUBLIC_DEV_BYPASS_AUTH` (read by AuthContext)

---

## Git Commit

When committing this file:

```bash
git add app/dashboard/page.tsx
git commit -m "feat(dashboard): add role-based dashboard router

Implements auto-redirect to correct dashboard based on user role:
- Detects creator/student/both/none roles
- Shows loading state during detection
- Handles errors with retry option
- Integrates with role detection service

Part of Phase 1 parallel agent execution.

Assisted by Jimmy Solutions Developer at Agentic Personnel LLC <Jimmy@AgenticPersonnel.com>"
```

---

## Documentation Updates

### README Addition

Add to main README.md:

```markdown
## Dashboard Routing

Chronos uses intelligent role-based routing:
- `/dashboard` auto-redirects based on user role
- `/dashboard/creator/*` for creators
- `/dashboard/student/*` for students
- Role switcher for dual-role users

Direct access to `/dashboard` is transparent - users are automatically routed to the correct dashboard.
```

---

**Document Version:** 1.0
**Last Updated:** 2025-01-18
**Status:** Complete - Ready for integration testing

Assisted by Jimmy Solutions Developer at Agentic Personnel LLC <Jimmy@AgenticPersonnel.com>
