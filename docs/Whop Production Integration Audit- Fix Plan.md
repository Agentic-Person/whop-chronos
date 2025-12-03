# Chronos: Whop Production Integration Audit & Fix Plan

**Created:** December 2, 2025
**Status:** Ready for implementation
**Priority:** CRITICAL - Blocking production deployment
**Implementation:** Parallel agents (7 agents across 2 waves)
**App Approval Status:** Pending Whop approval

---

## Executive Summary

The app works locally with hardcoded bypasses, but **will fail in production** inside Whop's iframe. This audit identified **15 critical issues** that need to be fixed before going live.

### Dual Authentication Architecture
This app requires **TWO** auth flows:
1. **OAuth Flow** - Landing page CTA → Whop login → redirect back (for standalone access)
2. **Native Auth Flow** - Whop iframe → JWT token via `x-whop-user-token` header (for embedded app)

Both flows must work. OAuth routes should NOT be deleted.

### Root Cause
The codebase was built with development bypasses (`TEST_MODE = true`, `DEV_BYPASS_AUTH`) that completely disable Whop authentication. These bypasses are **hardcoded** rather than environment-controlled, meaning they'll be active in production too.

### Approval Strategy
Since the app is pending Whop approval:
- Change `TEST_MODE = true` to `TEST_MODE = process.env['DEV_BYPASS_AUTH'] === 'true'`
- Keep `DEV_BYPASS_AUTH=true` in production until approved
- After approval, set `DEV_BYPASS_AUTH=false` in production

**See:** `docs/WHOP_APP_APPROVAL_GO_LIVE_CHECKLIST.md` for post-approval steps.

---

## Critical Issues (Must Fix)

### Priority 1: Security Vulnerabilities

#### 1.1 Hardcoded TEST_MODE = true (CRITICAL)
**Files:**
- `app/dashboard/[companyId]/layout.tsx:25`
- `app/experiences/[experienceId]/layout.tsx:25`

**Problem:** Lines are literally `const TEST_MODE = true;` which bypasses ALL authentication. Anyone can access any dashboard.

**Fix:**
```typescript
// Change from:
const TEST_MODE = true;

// To:
const TEST_MODE = process.env['DEV_BYPASS_AUTH'] === 'true';
```

**Impact:** Without this fix, any user can access any creator's dashboard or any student's experience.

---

#### 1.2 API Routes Accept creatorId as Parameter (CRITICAL)
**Files:**
- `app/api/chat/route.ts:105-111`
- `app/api/video/youtube/import/route.ts`
- `app/api/courses/*`
- `app/api/analytics/*`

**Problem:** API routes accept `creatorId` from the request body instead of extracting it from the authenticated user's JWT. A malicious user can send any creatorId and access other creators' data.

**Current (Insecure):**
```typescript
const { creatorId, studentId } = body;
```

**Fix:** Add JWT validation to all protected API routes:
```typescript
import { verifyWhopUser } from '@/lib/whop/native-auth';

// At the start of every protected route:
const { userId, error } = await verifyWhopUser();
if (!userId) {
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}

// For creator routes: verify the user owns the creatorId
const supabase = getServiceSupabase();
const { data: creator } = await supabase
  .from('creators')
  .select('id')
  .eq('whop_user_id', userId)
  .single();

if (!creator || creator.id !== body.creatorId) {
  return Response.json({ error: 'Forbidden' }, { status: 403 });
}
```

---

#### 1.3 Service Role Key Exposed in Client Code (CRITICAL)
**File:** `lib/db/client-browser.ts:35-37`

**Problem:** The Supabase SERVICE_ROLE_KEY (which bypasses ALL Row Level Security) is conditionally exposed in browser code.

**Fix:**
1. Remove `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` from all environments
2. Never reference service role key in any file under `/lib/db/client-*.ts` that runs in browser
3. Create separate `lib/db/server.ts` for server-only operations

---

#### 1.4 Debug Endpoint Exposes Sensitive Data
**File:** `app/api/debug/whop-context/route.ts`

**Problem:** Unprotected endpoint that exposes:
- All HTTP headers (including auth tokens)
- Environment configuration

**Fix:** Either delete the file entirely, or add authentication:
```typescript
export async function GET(req: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }
  // ... rest of code
}
```

---

### Priority 2: Production Breaking Issues

#### 2.1 Student Courses API Shows All Courses
**File:** `app/api/courses/student/route.ts`

**Problem:** In dev mode, shows ALL published courses instead of only courses the student has access to via their Whop membership.

**Fix:** Always filter by student's actual enrollments/memberships:
```typescript
// Get courses student is enrolled in via Whop membership
const { data: enrollments } = await supabase
  .from('student_courses')
  .select('course_id')
  .eq('student_id', studentId);

// Only return those courses
```

---

#### 2.2 Webhook Secret Fails Silently
**File:** `lib/whop/webhooks.ts:32-35`

**Problem:** If `WHOP_WEBHOOK_SECRET` is not set, webhooks silently fail. Students won't be created when they purchase.

**Fix:**
1. Add startup validation
2. Return 500 error (not silent false) to trigger Whop retry:
```typescript
if (!WEBHOOK_SECRET) {
  logger.error('WHOP_WEBHOOK_SECRET not configured');
  throw new Error('Webhook configuration error');
}
```

---

#### 2.3 Hardcoded Localhost URLs
**Files:**
- `app/api/video/youtube/import/route.ts:206,223`
- `components/admin/VideoDebugPanel.tsx:237,258`
- `lib/video/processor.ts:725`

**Problem:** Error messages show `http://localhost:3007` URLs to production users.

**Fix:** Use environment variable or remove localhost references from user-facing messages entirely.

---

#### 2.4 App URL Port Mismatch
**Files:**
- `app/layout.tsx:19` - Uses port 3007
- `next.config.ts:43` - Uses port 3000

**Problem:** Inconsistent fallback URLs cause metadata/canonical URL issues.

**Fix:** Ensure `NEXT_PUBLIC_APP_URL` is always set in production. Remove localhost fallbacks:
```typescript
// next.config.ts - Add validation
if (!process.env.NEXT_PUBLIC_APP_URL && process.env.NODE_ENV === 'production') {
  throw new Error('NEXT_PUBLIC_APP_URL must be set in production');
}
```

---

#### 2.5 TypeScript Errors Disabled
**File:** `next.config.ts:25-27`

**Problem:** `ignoreBuildErrors: true` hides type errors that could cause runtime crashes.

**Fix:** Re-enable type checking:
```typescript
typescript: {
  ignoreBuildErrors: false,
},
```
Then fix any resulting type errors.

---

### Priority 3: Cleanup & Best Practices

#### 3.1 Fix OAuth Routes for Landing Page CTA
**Files:**
- `app/api/whop/auth/login/route.ts`
- `app/api/whop/auth/callback/route.ts`
- `app/api/whop/auth/logout/route.ts`

**Status:** KEEP - Required for landing page → Whop login flow

**Problem:** OAuth routes need to work for standalone login from landing page CTA button.

**Fix:** Ensure OAuth routes are properly configured:
1. Verify `WHOP_CLIENT_ID`, `WHOP_CLIENT_SECRET` are set
2. Verify `WHOP_OAUTH_REDIRECT_URI` points to production callback URL
3. Add clear routing after OAuth success:
   - If user is creator → redirect to `/dashboard/[companyId]`
   - If user is student → redirect to `/experiences/[experienceId]`

**Add to landing page:**
```typescript
// Landing page CTA button
<a href="/api/whop/auth/login">
  Start Learning with Whop →
</a>
```

---

#### 3.2 Remove Seed Endpoint from Production
**File:** `app/api/seed/dev-creator/route.ts`

**Problem:** Creates test data. Protected by NODE_ENV but shouldn't exist in production builds.

**Fix:** Move to `/scripts` folder or gate with environment check.

---

#### 3.3 Centralize Test Constants
**Files with inconsistent test IDs:**
- `lib/whop/auth.ts:55-56`
- `lib/whop/native-auth.ts:52-54`
- `lib/whop/roles.ts:41-43`
- `app/dashboard/[companyId]/layout.tsx:26-27`
- `app/experiences/[experienceId]/layout.tsx:26-27`

**Fix:** Create single source of truth:
```typescript
// lib/whop/test-constants.ts
export const TEST_USER_ID = 'user_test_00000000000000';
export const TEST_CREATOR_ID = 'user_test_creator_00000000';
export const TEST_STUDENT_ID = 'user_test_student_00000000';
export const TEST_COMPANY_ID = 'biz_test_00000000';
export const TEST_EXPERIENCE_ID = 'exp_test_00000000';
```

---

#### 3.4 Add Startup Validation
**File to create:** `lib/startup-validation.ts`

**Purpose:** Validate all required environment variables at startup:
```typescript
export function validateEnvironment() {
  const required = [
    'WHOP_API_KEY',
    'WHOP_APP_ID',
    'NEXT_PUBLIC_WHOP_APP_ID',
    'WHOP_WEBHOOK_SECRET',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'ANTHROPIC_API_KEY',
    'OPENAI_API_KEY',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0 && process.env.NODE_ENV === 'production') {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }
}
```

---

## Implementation Order (Parallel Agents)

### Wave 1: Critical Security (4 parallel agents)

**Agent 1: Layout Auth Fixes**
- Fix `TEST_MODE = true` → env var in `app/dashboard/[companyId]/layout.tsx`
- Fix `TEST_MODE = true` → env var in `app/experiences/[experienceId]/layout.tsx`
- Create `lib/whop/test-constants.ts` with centralized test IDs

**Agent 2: API Auth Hardening**
- Add JWT validation helper `lib/whop/api-auth.ts`
- Add auth to `/api/chat/route.ts`
- Add auth to `/api/video/youtube/import/route.ts`

**Agent 3: Database Security**
- Remove service role key from `lib/db/client-browser.ts`
- Create server-only `lib/db/server-client.ts`
- Fix student courses API filtering in `app/api/courses/student/route.ts`

**Agent 4: Debug & Validation**
- Protect/delete `app/api/debug/whop-context/route.ts`
- Add startup validation `lib/startup-validation.ts`
- Fix webhook secret silent failure in `lib/whop/webhooks.ts`

---

### Wave 2: Production Polish (3 parallel agents)

**Agent 5: OAuth Flow for Landing Page**
- Verify OAuth routes work correctly
- Add post-login role detection and routing
- Connect landing page CTA to OAuth flow

**Agent 6: URL & Config Cleanup**
- Remove localhost references from error messages
- Fix app URL port mismatch (3000 vs 3007)
- Update `next.config.ts` with production validation

**Agent 7: TypeScript & Build**
- Re-enable TypeScript checking in `next.config.ts`
- Fix resulting type errors
- Verify production build passes

---

## Environment Variables Checklist

**Production MUST have:**
```bash
# Whop Native Auth (for embedded iframe)
WHOP_API_KEY=whop_xxx
WHOP_APP_ID=app_xxx
NEXT_PUBLIC_WHOP_APP_ID=app_xxx
WHOP_WEBHOOK_SECRET=xxx

# Whop OAuth (for landing page CTA)
WHOP_CLIENT_ID=xxx
WHOP_CLIENT_SECRET=xxx
WHOP_OAUTH_REDIRECT_URI=https://your-app.vercel.app/api/whop/auth/callback
WHOP_TOKEN_ENCRYPTION_KEY=xxx  # 64 hex chars for session encryption

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx  # Server-side only!

# AI APIs
ANTHROPIC_API_KEY=sk-ant-xxx
OPENAI_API_KEY=sk-xxx

# App Config
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
INNGEST_SIGNING_KEY=xxx  # For production Inngest
```

**TEMPORARY (until Whop approval):**
```bash
DEV_BYPASS_AUTH=true  # Remove after Whop approves the app
```

**Production MUST NOT have (after approval):**
```bash
DEV_BYPASS_AUTH=true  # Remove after approval
NEXT_PUBLIC_DEV_BYPASS_AUTH=true
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=xxx  # NEVER expose this
NEXT_PUBLIC_DEV_SIMPLE_NAV=true
```

---

## Verification After Fix

1. **Build test:** `npm run build` should pass with no errors
2. **Type check:** `npm run type-check` should pass
3. **Auth test:** Try accessing `/dashboard/biz_xxx` without Whop token - should redirect to `/auth-error`
4. **API test:** Send request to `/api/chat` without JWT - should return 401
5. **Webhook test:** Send test webhook with valid signature - should process
6. **Production deploy:** Deploy to Vercel staging and test in Whop iframe

---

## Files to Modify (Complete List)

### Wave 1 Files (Security)
| File | Change | Agent |
|------|--------|-------|
| `app/dashboard/[companyId]/layout.tsx` | Fix TEST_MODE to use env var | 1 |
| `app/experiences/[experienceId]/layout.tsx` | Fix TEST_MODE to use env var | 1 |
| `lib/whop/test-constants.ts` | CREATE - centralized test IDs | 1 |
| `lib/whop/api-auth.ts` | CREATE - reusable auth helper | 2 |
| `app/api/chat/route.ts` | Add JWT validation | 2 |
| `app/api/video/youtube/import/route.ts` | Add JWT validation | 2 |
| `lib/db/client-browser.ts` | Remove service role key | 3 |
| `lib/db/server-client.ts` | CREATE - server-only client | 3 |
| `app/api/courses/student/route.ts` | Fix filtering logic | 3 |
| `app/api/debug/whop-context/route.ts` | Add NODE_ENV protection | 4 |
| `lib/startup-validation.ts` | CREATE - env var validation | 4 |
| `lib/whop/webhooks.ts` | Throw error on missing secret | 4 |

### Wave 2 Files (Polish)
| File | Change | Agent |
|------|--------|-------|
| `app/api/whop/auth/login/route.ts` | Verify OAuth works | 5 |
| `app/api/whop/auth/callback/route.ts` | Add role-based redirect | 5 |
| `app/page.tsx` | Add CTA linking to OAuth login | 5 |
| `app/api/video/youtube/import/route.ts` | Remove localhost refs | 6 |
| `lib/video/processor.ts` | Remove localhost refs | 6 |
| `next.config.ts` | Fix URL fallback, add validation | 6 |
| `app/layout.tsx` | Fix URL fallback | 6 |
| `next.config.ts` | Re-enable TypeScript checking | 7 |
| Various type files | Fix any type errors | 7 |

---

## Success Criteria

### Security (Wave 1)
- [ ] No hardcoded `TEST_MODE = true` anywhere - uses env var instead
- [ ] All API routes validate JWT tokens from Whop
- [ ] Service role key never in client bundle (only server-side)
- [ ] Debug endpoints protected by NODE_ENV check
- [ ] Startup validation fails fast if env vars missing

### Dual Auth Flows (Wave 2)
- [ ] **OAuth Flow:** Landing page CTA → Whop login → correct dashboard (creator/student)
- [ ] **Native Auth Flow:** Whop iframe loads correctly with JWT
- [ ] Both flows work in production environment

### Production Ready
- [ ] Build passes with TypeScript checking enabled
- [ ] No localhost references in user-facing error messages
- [ ] Webhook events create student records correctly
- [ ] AI chat works with proper creator/student context
- [ ] `DEV_BYPASS_AUTH=true` can be toggled off after Whop approval

### Verification Commands
```bash
# Build should pass
npm run build

# Type check should pass
npm run type-check

# Test OAuth flow
open http://localhost:3007/api/whop/auth/login

# Test embedded app (after deploy)
# Load from Whop dashboard
```

---

## Related Documentation

- **Post-Approval Checklist:** `docs/WHOP_APP_APPROVAL_GO_LIVE_CHECKLIST.md`
- **Native Auth Guide:** `docs/WHOP_NATIVE_AUTH.md`
- **Integration Best Practices:** `docs/WHOP_INTEGRATION_BEST_PRACTICES.md`
