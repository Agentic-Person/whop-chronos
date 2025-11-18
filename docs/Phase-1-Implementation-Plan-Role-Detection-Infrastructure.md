# Phase 1 Implementation Plan: Role Detection Infrastructure

**Timeline:** 2-3 hours (with parallel agent execution)
**Status:** Ready to Execute
**Dependencies:** None (Phase 1 is foundational)

---

## Executive Summary

Phase 1 establishes the foundational role detection infrastructure that enables Chronos to correctly route Whop users to either the creator dashboard or student dashboard based on their relationship to the platform.

**Key Deliverables:**
- Role detection service (`lib/whop/roles.ts`)
- Dashboard entry router (`app/dashboard/page.tsx`)
- Enhanced auth context with role awareness
- Role switching UI component (for dual-role users)

**Why This Matters:**
- Without role detection, users will be confused about which dashboard to use
- Enables separate development of creator vs student experiences
- Allows parallel work by multiple Claude Code instances
- Foundation for all future role-based features

---

## Architecture Overview

### Current State
```
User visits /dashboard
  ↓
No role detection
  ↓
Shows creator dashboard by default (wrong for students)
```

### Target State
```
User visits /dashboard
  ↓
Role detection service checks:
  - Is user a Whop company owner? → Creator
  - Is user a Whop member? → Student
  - Both? → Show role switcher
  ↓
Auto-redirect to correct dashboard
  ↓
/dashboard/creator/* OR /dashboard/student/*
```

---

## Implementation Strategy: Parallel Agent Orchestration

**Orchestrator:** Claude Code (this instance)
**Execution Model:** 3 agents working simultaneously
**Estimated Time:** 2-3 hours total (vs 6-8 hours sequential)

### Agent 1: Role Detection Service
**File:** `lib/whop/roles.ts`
**Duration:** 1-1.5 hours
**Dependencies:** None (standalone service)

### Agent 2: Dashboard Router
**File:** `app/dashboard/page.tsx`
**Duration:** 1 hour
**Dependencies:** Uses Agent 1's service (but can be built in parallel with mocked interface)

### Agent 3: Enhanced Auth Context
**File:** `lib/contexts/AuthContext.tsx`
**Duration:** 1.5 hours
**Dependencies:** None (extends existing context)

---

## Agent 1: Role Detection Service

### File to Create
`lib/whop/roles.ts`

### Responsibilities
1. Detect user role from Whop membership data
2. Handle edge cases (no membership, dual roles, etc.)
3. Provide TypeScript types for roles
4. Cache role data to avoid repeated API calls

### Implementation Spec

```typescript
// lib/whop/roles.ts

import { WhopSDK } from '@whop/sdk';

/**
 * User role types in Chronos
 */
export type UserRole = 'creator' | 'student' | 'both' | 'none';

export interface RoleDetectionResult {
  role: UserRole;
  isCreator: boolean;
  isStudent: boolean;
  companyId?: string;      // Present if creator
  membershipId?: string;   // Present if student
  productIds?: string[];   // Products user has access to
}

/**
 * Detect user's role in Chronos based on Whop data
 *
 * Logic:
 * - Creator: User owns a Whop company that has Chronos installed
 * - Student: User has an active membership to a Chronos-enabled product
 * - Both: User is both a creator and a student
 * - None: User has no relationship to Chronos
 */
export async function detectUserRole(
  whopUserId: string
): Promise<RoleDetectionResult> {
  // Implementation here
}

/**
 * Get default dashboard route for a user based on their role
 */
export function getDefaultDashboardRoute(role: UserRole): string {
  switch (role) {
    case 'creator':
      return '/dashboard/creator/overview';
    case 'student':
      return '/dashboard/student/courses';
    case 'both':
      // Default to creator dashboard, show role switcher
      return '/dashboard/creator/overview';
    case 'none':
      return '/'; // Redirect to landing page
  }
}

/**
 * Check if user has access to creator dashboard
 */
export function canAccessCreatorDashboard(role: UserRole): boolean {
  return role === 'creator' || role === 'both';
}

/**
 * Check if user has access to student dashboard
 */
export function canAccessStudentDashboard(role: UserRole): boolean {
  return role === 'student' || role === 'both';
}
```

### Edge Cases to Handle

1. **Dev Bypass Mode**
   - When `DEV_BYPASS_AUTH=true`, use hardcoded test roles
   - Creator test user: `00000000-0000-0000-0000-000000000001`
   - Student test user: `00000000-0000-0000-0000-000000000002`

2. **No Membership**
   - User authenticated but has no Whop membership
   - Return `role: 'none'` and redirect to landing page

3. **Expired Membership**
   - Student had access but membership expired
   - Return `role: 'none'` and show upgrade prompt

4. **Multiple Companies**
   - Creator owns multiple Whop companies
   - Use the first company with Chronos installed

5. **API Failures**
   - Whop API timeout or error
   - Gracefully degrade, cache last known role
   - Show error UI with retry option

### Testing Checklist

- [ ] Creator-only user routes to `/dashboard/creator/overview`
- [ ] Student-only user routes to `/dashboard/student/courses`
- [ ] Dual-role user routes to creator dashboard with role switcher visible
- [ ] No-membership user redirects to landing page
- [ ] Dev bypass mode uses hardcoded roles correctly
- [ ] API error shows graceful error message
- [ ] Role caching prevents repeated API calls

---

## Agent 2: Dashboard Router

### File to Create
`app/dashboard/page.tsx`

### Responsibilities
1. Entry point for `/dashboard` route
2. Call role detection service
3. Auto-redirect to correct dashboard
4. Show loading state during detection
5. Handle errors gracefully

### Implementation Spec

```typescript
// app/dashboard/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { detectUserRole, getDefaultDashboardRoute } from '@/lib/whop/roles';
import type { UserRole } from '@/lib/whop/roles';

export default function DashboardRouter() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [isDetectingRole, setIsDetectingRole] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function detectAndRedirect() {
      if (authLoading) return; // Wait for auth to load

      if (!user) {
        // Not authenticated, redirect to login
        router.push('/api/whop/auth/login');
        return;
      }

      try {
        setIsDetectingRole(true);

        // Detect user role
        const roleResult = await detectUserRole(user.id);

        // Get default route for this role
        const defaultRoute = getDefaultDashboardRoute(roleResult.role);

        // Redirect to appropriate dashboard
        router.push(defaultRoute);
      } catch (err) {
        console.error('Role detection failed:', err);
        setError('Failed to determine your dashboard. Please try again.');
        setIsDetectingRole(false);
      }
    }

    detectAndRedirect();
  }, [user, authLoading, router]);

  // Loading state
  if (authLoading || isDetectingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-destructive mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Should never reach here (router.push redirects)
  return null;
}
```

### User Experience

**Before (Current):**
```
User → /dashboard → Shows creator dashboard (confusing for students)
```

**After (Phase 1):**
```
User → /dashboard →
  Loading spinner (0.5-1s) →
  Auto-redirect to correct dashboard
```

### Testing Checklist

- [ ] Loading spinner shows during role detection
- [ ] Creator redirects to `/dashboard/creator/overview`
- [ ] Student redirects to `/dashboard/student/courses`
- [ ] Unauthenticated user redirects to login
- [ ] Error shows retry button on API failure
- [ ] No flash of wrong dashboard content

---

## Agent 3: Enhanced Auth Context

### File to Update
`lib/contexts/AuthContext.tsx`

### Responsibilities
1. Add role detection to auth context
2. Expose role data to all components
3. Provide role switching functionality (for dual-role users)
4. Cache role data to avoid repeated detections

### Implementation Spec

```typescript
// lib/contexts/AuthContext.tsx (additions)

import { detectUserRole, type RoleDetectionResult, type UserRole } from '@/lib/whop/roles';

interface AuthContextType {
  // Existing fields
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;

  // NEW: Role detection fields
  role: UserRole | null;
  roleData: RoleDetectionResult | null;
  isDetectingRole: boolean;
  currentDashboard: 'creator' | 'student' | null;

  // NEW: Role switching (for dual-role users)
  switchToCreatorDashboard: () => void;
  switchToStudentDashboard: () => void;
  canSwitchRole: boolean;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // NEW: Role detection state
  const [roleData, setRoleData] = useState<RoleDetectionResult | null>(null);
  const [isDetectingRole, setIsDetectingRole] = useState(false);
  const [currentDashboard, setCurrentDashboard] = useState<'creator' | 'student' | null>(null);

  // NEW: Detect role when user loads
  useEffect(() => {
    async function loadUserRole() {
      if (!user) {
        setRoleData(null);
        return;
      }

      setIsDetectingRole(true);
      try {
        const result = await detectUserRole(user.id);
        setRoleData(result);

        // Set default dashboard based on role
        if (result.role === 'creator') {
          setCurrentDashboard('creator');
        } else if (result.role === 'student') {
          setCurrentDashboard('student');
        } else if (result.role === 'both') {
          // Check localStorage for user preference
          const savedPreference = localStorage.getItem('chronos_dashboard_preference');
          setCurrentDashboard((savedPreference as 'creator' | 'student') || 'creator');
        }
      } catch (error) {
        console.error('Failed to detect user role:', error);
      } finally {
        setIsDetectingRole(false);
      }
    }

    loadUserRole();
  }, [user]);

  // NEW: Role switching functions
  const switchToCreatorDashboard = useCallback(() => {
    if (roleData?.role === 'both' || roleData?.role === 'creator') {
      setCurrentDashboard('creator');
      localStorage.setItem('chronos_dashboard_preference', 'creator');
      router.push('/dashboard/creator/overview');
    }
  }, [roleData, router]);

  const switchToStudentDashboard = useCallback(() => {
    if (roleData?.role === 'both' || roleData?.role === 'student') {
      setCurrentDashboard('student');
      localStorage.setItem('chronos_dashboard_preference', 'student');
      router.push('/dashboard/student/courses');
    }
  }, [roleData, router]);

  const canSwitchRole = roleData?.role === 'both';

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signOut,
        role: roleData?.role || null,
        roleData,
        isDetectingRole,
        currentDashboard,
        switchToCreatorDashboard,
        switchToStudentDashboard,
        canSwitchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
```

### New Context API

Components can now access role data:

```typescript
const {
  role,                      // 'creator' | 'student' | 'both' | 'none'
  roleData,                  // Full role detection result
  currentDashboard,          // Which dashboard user is viewing
  switchToCreatorDashboard,  // Function to switch to creator view
  switchToStudentDashboard,  // Function to switch to student view
  canSwitchRole              // Boolean: true if user has both roles
} = useAuth();
```

### Testing Checklist

- [ ] Role detected automatically on login
- [ ] Role data accessible via `useAuth()` hook
- [ ] `canSwitchRole` is true for dual-role users
- [ ] Dashboard preference persists in localStorage
- [ ] Role switching updates URL correctly
- [ ] Role data cached (no repeated API calls)

---

## Bonus Component: Role Switcher UI

### File to Create
`components/dashboard/RoleSwitcher.tsx`

### When to Show
- User has `role === 'both'` (creator AND student)
- Display in both creator and student dashboard layouts

### Implementation Spec

```typescript
// components/dashboard/RoleSwitcher.tsx

'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { UserCircle, GraduationCap } from 'lucide-react';

export function RoleSwitcher() {
  const {
    canSwitchRole,
    currentDashboard,
    switchToCreatorDashboard,
    switchToStudentDashboard
  } = useAuth();

  if (!canSwitchRole) return null;

  return (
    <div className="flex items-center gap-2 p-2 bg-secondary/10 rounded-lg border border-border">
      <span className="text-sm text-muted-foreground">View as:</span>

      <Button
        variant={currentDashboard === 'creator' ? 'default' : 'ghost'}
        size="sm"
        onClick={switchToCreatorDashboard}
        className="gap-2"
      >
        <UserCircle className="h-4 w-4" />
        Creator
      </Button>

      <Button
        variant={currentDashboard === 'student' ? 'default' : 'ghost'}
        size="sm"
        onClick={switchToStudentDashboard}
        className="gap-2"
      >
        <GraduationCap className="h-4 w-4" />
        Student
      </Button>
    </div>
  );
}
```

### Placement

**Creator Dashboard Layout:**
```typescript
// app/dashboard/creator/layout.tsx
import { RoleSwitcher } from '@/components/dashboard/RoleSwitcher';

export default function CreatorLayout({ children }) {
  return (
    <div>
      <DashboardNav />
      <div className="p-4">
        <RoleSwitcher />  {/* Add here */}
        {children}
      </div>
    </div>
  );
}
```

**Student Dashboard Layout:**
```typescript
// app/dashboard/student/layout.tsx (to be created)
import { RoleSwitcher } from '@/components/dashboard/RoleSwitcher';

export default function StudentLayout({ children }) {
  return (
    <div>
      <StudentNav />  {/* To be created */}
      <div className="p-4">
        <RoleSwitcher />  {/* Add here */}
        {children}
      </div>
    </div>
  );
}
```

---

## Integration & Testing Strategy

### Integration Steps

1. **Agent 1 completes** → Provides `lib/whop/roles.ts` service
2. **Agent 2 & 3 complete** → Can now import and use the service
3. **Orchestrator integrates** → Ensure all pieces work together
4. **Add RoleSwitcher component** → Final polish for dual-role users

### Testing Sequence

**Unit Testing (Per Agent):**
- Agent 1: Test role detection with mock Whop data
- Agent 2: Test routing logic with mocked role service
- Agent 3: Test context updates and role switching

**Integration Testing (Orchestrator):**
1. **Test 1: Creator-only user**
   ```
   Visit /dashboard →
   Role detected as 'creator' →
   Redirect to /dashboard/creator/overview →
   No role switcher shown
   ```

2. **Test 2: Student-only user**
   ```
   Visit /dashboard →
   Role detected as 'student' →
   Redirect to /dashboard/student/courses →
   No role switcher shown
   ```

3. **Test 3: Dual-role user**
   ```
   Visit /dashboard →
   Role detected as 'both' →
   Redirect to /dashboard/creator/overview (default) →
   Role switcher shown →
   Click "Student" →
   Redirect to /dashboard/student/courses →
   Preference saved to localStorage
   ```

4. **Test 4: No membership**
   ```
   Visit /dashboard →
   Role detected as 'none' →
   Redirect to / (landing page) →
   Show message about no active membership
   ```

5. **Test 5: Dev bypass mode**
   ```
   DEV_BYPASS_AUTH=true →
   Use test creator ID →
   Role should be 'creator' →
   Verify hardcoded test data works
   ```

### Browser Testing

Test in multiple browsers:
- Chrome (primary)
- Firefox
- Safari (if available)
- Mobile Safari (responsive)
- Chrome Mobile (responsive)

**Key scenarios:**
- Page reload preserves dashboard preference
- Back button doesn't break routing
- Direct URL access works (e.g., `/dashboard/creator/videos`)
- No infinite redirect loops
- Loading states show correctly

---

## Timeline & Milestones

### Phase 1 Execution (2-3 hours)

**Hour 0-1:**
- Launch all 3 agents in parallel
- Each agent builds their assigned component
- Agents work independently (no blockers)

**Hour 1-2:**
- Agents complete and report back
- Orchestrator reviews all code
- Run initial integration tests

**Hour 2-3:**
- Build RoleSwitcher component
- Add to both dashboard layouts
- Run full integration test suite
- Fix any bugs found
- Deploy to development environment

### Success Criteria

Phase 1 is complete when:
- [ ] All 3 agent deliverables are complete
- [ ] Integration tests pass (all 5 test cases)
- [ ] Role switcher works for dual-role users
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Dev bypass mode works correctly
- [ ] Code deployed and working on dev server

---

## Post-Phase 1 Handoff

### What This Enables

With Phase 1 complete:
1. **Parallel development** - Creator and student dashboards can be built simultaneously
2. **Proper routing** - Users always see the correct dashboard
3. **Role awareness** - All components can access role data via `useAuth()`
4. **Foundation for features** - Enrollment, progress tracking, analytics all depend on role detection

### Next Steps (Future Phases)

**Phase 2: Complete Student Dashboard** (assigned to separate Claude Code instance)
- Student course catalog
- Student chat interface
- Student settings
- Student navigation component

**Phase 3: Creator Enrollment Features**
- Invite students to courses
- Manage student access
- View student progress

**Phase 4: Student Progress Tracking**
- Course enrollment system
- Progress persistence
- Completion tracking

---

## Risk Mitigation

### Potential Issues

1. **Whop API Rate Limiting**
   - **Mitigation:** Cache role data aggressively, use 5-minute expiry
   - **Fallback:** If API fails, use last known role from localStorage

2. **Dual-Role User Confusion**
   - **Mitigation:** Clear role switcher UI with icons and labels
   - **Guidance:** Show tooltip explaining the difference

3. **Role Detection Latency**
   - **Mitigation:** Show loading spinner during detection
   - **Optimization:** Parallel API calls to Whop services

4. **Infinite Redirect Loops**
   - **Mitigation:** Add redirect guards, max redirect counter
   - **Testing:** Verify all redirect paths thoroughly

5. **Dev Bypass Mode in Production**
   - **Mitigation:** Environment check, throw error if bypass enabled in production
   - **Safety:** Add prominent warning in UI when bypass is active

---

## Code Quality Standards

### TypeScript Requirements
- All functions fully typed
- No `any` types without explicit comment explaining why
- Export all types for reusability

### Error Handling
- All async functions wrapped in try/catch
- User-friendly error messages
- Console logging for debugging (with context)

### Performance
- Cache API responses (5-minute TTL)
- Minimize re-renders in AuthContext
- Lazy load role detection (only when needed)

### Documentation
- JSDoc comments on all exported functions
- Inline comments for complex logic
- README updates for new context API

---

## Dependencies

### No External Packages Needed
All functionality uses existing dependencies:
- `@whop/sdk` - Already installed
- `next/navigation` - Already installed
- React hooks - Already installed

### Environment Variables
No new environment variables required for Phase 1.

---

## Appendix: Code Snippets

### Usage Example: Protected Route

```typescript
// app/dashboard/creator/videos/page.tsx

import { useAuth } from '@/lib/contexts/AuthContext';
import { canAccessCreatorDashboard } from '@/lib/whop/roles';

export default function CreatorVideosPage() {
  const { role } = useAuth();

  // Protect route
  if (!role || !canAccessCreatorDashboard(role)) {
    return <div>Access denied. Creator dashboard only.</div>;
  }

  return <div>Creator Videos Page</div>;
}
```

### Usage Example: Conditional UI

```typescript
// components/chat/ChatInterface.tsx

import { useAuth } from '@/lib/contexts/AuthContext';

export function ChatInterface() {
  const { role, roleData } = useAuth();

  return (
    <div>
      {role === 'creator' && (
        <p>You're chatting as a creator. Access to all videos.</p>
      )}

      {role === 'student' && (
        <p>You're chatting as a student. Access to enrolled courses only.</p>
      )}

      {role === 'both' && (
        <p>You have both creator and student access.</p>
      )}
    </div>
  );
}
```

---

## Questions & Clarifications

**Q: What if a creator is also a student in another creator's course?**
**A:** The `both` role handles this. User can switch between creator and student dashboards.

**Q: How do we handle company owners who don't have Chronos installed?**
**A:** Role detection checks if company has Chronos installed. If not, treat as `none`.

**Q: What about team members (not owners) of a Whop company?**
**A:** Phase 1 treats them as students. Future: Add team member role detection.

**Q: Can students become creators later?**
**A:** Yes. Role detection runs on every dashboard load, so role changes are picked up automatically.

---

**Document Version:** 1.0
**Last Updated:** 2025-01-18
**Author:** Claude Code (Orchestrator)
**Status:** Ready for execution

Assisted by Jimmy Solutions Developer at Agentic Personnel LLC <Jimmy@AgenticPersonnel.com>
