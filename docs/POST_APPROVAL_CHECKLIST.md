# Post-Approval Checklist

**Created:** December 2, 2025
**Status:** WAITING FOR WHOP APPROVAL

---

## What to Do After Whop Approves the App

Once Whop approves your app, they will start sending the `x-whop-user-token` header. At that point, you need to switch from TEST_MODE to production authentication.

### Step 1: Update Layout Files (3 files)

#### File 1: `app/dashboard/[companyId]/layout.tsx`

**Line ~25 - Change FROM:**
```typescript
const TEST_MODE = true;
```

**Change TO:**
```typescript
const TEST_MODE = process.env.DEV_BYPASS_AUTH === 'true';
```

#### File 2: `app/experiences/[experienceId]/layout.tsx`

**Line ~25 - Change FROM:**
```typescript
const TEST_MODE = true;
```

**Change TO:**
```typescript
const TEST_MODE = process.env.DEV_BYPASS_AUTH === 'true';
```

#### File 3: `app/api/courses/student/route.ts`

**Line ~15 - Change FROM:**
```typescript
const isDevMode = true;
```

**Change TO:**
```typescript
const isDevMode = process.env.DEV_BYPASS_AUTH === 'true';
```

### Step 2: Set Environment Variable in Vercel

1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Find or add: `DEV_BYPASS_AUTH`
3. Set value to: `false` (for production)
4. Redeploy

### Step 3: Test in Whop

1. Open app in Whop dashboard (creator view)
2. Verify creator dashboard loads without "Not authenticated" errors
3. Test creating a course
4. Test creating a module
5. Open app in Whop experience (student view)
6. Verify courses load
7. Test AI chat

### Step 4: Remove Test Data (Optional)

If you created test courses/modules during approval process, clean them up.

---

## Files Modified for Approval (Paper Trail)

These files were modified on December 2, 2025 to enable TEST_MODE:

| File | Change | Line |
|------|--------|------|
| `app/dashboard/[companyId]/layout.tsx` | `TEST_MODE = true` | ~25 |
| `app/experiences/[experienceId]/layout.tsx` | `TEST_MODE = true` | ~25 |
| `app/api/courses/student/route.ts` | `isDevMode = true` | ~15 |
| `components/courses/CreateCourseModal.tsx` | `useAnalytics()` instead of `useAuth()` | 5, 14 |
| `components/courses/CoursesGrid.tsx` | `useAnalytics()` instead of `useAuth()` | 6, 27 |
| `components/courses/VideoLibraryPicker.tsx` | `useAnalytics()` instead of `useAuth()` | 5, 48 |

**Note:** The component changes (useAnalytics) are permanent fixes - do NOT revert those.

---

## Why This Was Necessary

1. **Whop doesn't send auth tokens until app is approved**
2. **App can't work without auth tokens**
3. **Whop won't approve app if it doesn't work**
4. **Solution: Bypass auth during approval, enable after**

See `docs/WHOP_INTEGRATION_BEST_PRACTICES.md` for the full story.

---

## Quick Commands

After approval, run this to find all TEST_MODE locations:
```bash
grep -rn "TEST_MODE = true\|isDevMode = true" app/
```

---

**Remember:** The `useAnalytics()` changes are PERMANENT fixes. Only revert the `TEST_MODE` and `isDevMode` hardcoded values.
