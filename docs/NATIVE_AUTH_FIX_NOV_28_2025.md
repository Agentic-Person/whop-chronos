# Native Auth Fix - November 28, 2025

## Status: IMPLEMENTED + DEBUGGING COMPLETE

**Last Updated:** November 28, 2025 (Evening)
**Status:** Production code ready, pending Whop configuration verification

## The Problem

Tech support said: **"The app is not taking in any parameters from Whop"**

This was 100% correct. Here's what was happening:

### What We Thought
```
Whop loads iframe → URL contains /dashboard/{companyId} → App extracts companyId from URL
```

### What Actually Happens
```
Whop loads iframe → URL is just /dashboard (no params!) → App must ASK Whop for context
```

## Root Cause

The `verifyUserToken()` function from `@whop/sdk` only returns:
```typescript
{
  userId: string;
  appId: string;
}
```

It does **NOT** return `companyId`, `experienceId`, or `viewType`. These must be requested separately using the `@whop/iframe` SDK (or `@whop/react` for React apps).

## The Fix

### 1. Created Iframe SDK Integration
**File:** `lib/whop/iframe-sdk.ts`

```typescript
import { createSdk } from '@whop/iframe';

const sdk = createSdk({ appId: process.env.NEXT_PUBLIC_WHOP_APP_ID });

// This is how you get companyId/experienceId!
const urlData = await sdk.getTopLevelUrlData({});
// Returns: { companyRoute, experienceRoute, experienceId, viewType, baseHref, fullHref }
```

### 2. Created React Hook
**File:** `hooks/useWhopContext.ts`

```typescript
const { urlData, loading, error, isEmbedded } = useWhopContext();

// urlData contains:
// - companyRoute: "/hub/biz_xxxxx"
// - experienceId: "exp_xxxxx"
// - viewType: "app" | "admin" | "analytics" | "preview"
```

### 3. Created Router Component
**File:** `components/whop/WhopContextRouter.tsx`

This component:
1. Uses the iframe SDK to get context from Whop
2. Extracts companyId from `companyRoute`
3. Redirects to the correct route based on `viewType`:
   - `admin` → `/dashboard/{companyId}/overview`
   - `app` → `/experiences/{experienceId}/courses`
   - `analytics` → `/dashboard/{companyId}/analytics`

### 4. Updated Entry Points
**Files:** `app/dashboard/page.tsx`, `app/experiences/page.tsx`

Both now use `<WhopContextRouter />` to handle the routing.

## How It Works Now

```
1. Whop loads iframe with /dashboard
   ↓
2. WhopContextRouter renders
   ↓
3. useWhopContext hook calls sdk.getTopLevelUrlData({})
   ↓
4. Whop responds via postMessage with:
   {
     companyRoute: "/hub/biz_5aH5YEHvkNgNS2",
     experienceId: "exp_xxxxx",
     viewType: "admin"
   }
   ↓
5. Router extracts companyId from companyRoute
   ↓
6. Router redirects to /dashboard/biz_5aH5YEHvkNgNS2/overview
   ↓
7. [companyId] layout verifies auth with verifyUserToken()
   ↓
8. Page renders with correct context
```

## Environment Variables Required

```bash
# Server-side
WHOP_API_KEY=your_key
WHOP_APP_ID=app_xxxxx

# Client-side (needed for iframe SDK)
NEXT_PUBLIC_WHOP_APP_ID=app_xxxxx  # SAME as WHOP_APP_ID
```

## Files Changed/Added

### New Files
- `lib/whop/iframe-sdk.ts` - Iframe SDK wrapper
- `hooks/useWhopContext.ts` - React hook for Whop context
- `components/whop/WhopContextRouter.tsx` - Router component
- `app/experiences/page.tsx` - Experiences entry point
- `app/api/debug/whop-context/route.ts` - Debug endpoint

### Modified Files
- `app/dashboard/page.tsx` - Now uses WhopContextRouter
- `.env.example` - Added NEXT_PUBLIC_WHOP_APP_ID

## Testing

### Debug Endpoint
Visit `/api/debug/whop-context` to see what headers and context the app is receiving.

### In Whop Iframe
1. Deploy to Vercel
2. Access app through Whop dashboard
3. Check browser console for `[Whop Iframe]` and `[WhopContextRouter]` logs
4. Should see context data and redirect to correct route

### Local Development
Set `DEV_BYPASS_AUTH=true` to bypass authentication checks during local development.

## Key Insight

**Embedded apps in Whop iframes must use `@whop/iframe` SDK to get context via postMessage.**

The URL doesn't contain the parameters - they're communicated via the iframe SDK.

## Related Documentation
- `docs/WHOP_NATIVE_AUTH.md` - Complete implementation guide (THE authoritative doc)
- `docs/AUTH_COMPARISON_OLD_VS_NEW.md` - Comparison with old working app
- `docs/integrations/whop/NATIVE_AUTH_MIGRATION_REPORT.md` - Previous migration attempt
- `@whop/iframe` SDK types - See `node_modules/@whop/iframe/dist/index.d.ts`

---

## November 28, 2025 (Evening) - Debugging Session with Whop Tech Support

### What We Discovered

**The Good News:** Native auth IS working! The JWT token is being received and user ID is being extracted successfully.

```
User ID extracted: user_7ut5CAChWsxQR
```

**The Bad News:** Two issues still prevented the app from working correctly.

### Issue 1: Wrong View Displayed

**Symptom:** App showed "Student courses page" instead of "Creator dashboard"

**Root Cause:** Whop was sending `viewType: 'app'` instead of `viewType: 'admin'`

**Evidence from browser console:**
```javascript
[WhopContextRouter] Context state: {
  isEmbedded: true,
  urlData: {
    viewType: 'app',  // ← This should be 'admin' for creators!
    companyRoute: '/hub/biz_xxxxx',
    experienceId: 'exp_xxxxx'
  }
}
```

**Resolution:** This is a Whop-side configuration issue. Added debug panel to help diagnose what Whop is sending.

### Issue 2: 500 Error on API Calls

**Symptom:**
```
POST /api/courses?creator_id=user_7ut5CAChWsxQR → 500 Internal Server Error
```

**Root Cause:** Creator record didn't exist in the `creators` database table. The API tried to query courses for a creator that hadn't been set up yet.

**Resolution:** Implemented auto-creation of creator records on first access.

### Code Changes Made

#### 1. Added Debug Panel to WhopContextRouter

**File:** `components/whop/WhopContextRouter.tsx`

Added a visual debug panel that shows:
- isEmbedded (true/false)
- viewType (admin/app/analytics/preview)
- companyRoute
- experienceId
- extractedCompanyId

Enable with: `NEXT_PUBLIC_DEBUG_WHOP_CONTEXT=true`

#### 2. Auto-Create Creator Records

**File:** `app/dashboard/[companyId]/layout.tsx`

Added logic to automatically create creator records when:
1. User is authenticated via native auth (verifyUserToken succeeds)
2. User has admin access to the company (checkAccess confirms)
3. Creator doesn't exist in database yet

```typescript
if (!existingCreator) {
  const { data: newCreator } = await supabase
    .from('creators')
    .insert({
      whop_company_id: companyId,
      whop_user_id: userId,
      email: user.email,
      name: user.name || user.username || company.title,
      subscription_tier: 'pro',
      is_active: true,
      last_login_at: new Date().toISOString(),
    })
    .select('id, subscription_tier')
    .single();
}
```

Also added retry logic for race conditions (if another request creates the record simultaneously).

#### 3. Auto-Create Test Creator in Dev Mode

**File:** `app/dashboard/creator/layout.tsx`

For local development with `DEV_BYPASS_AUTH=true`, automatically creates test creator records so the static routes work properly.

### The Critical Insight

`verifyUserToken()` only gives you **WHO** (userId, appId).

`@whop/iframe` SDK's `getTopLevelUrlData()` gives you **WHERE** (companyId, experienceId, viewType).

You need BOTH to fully authenticate and route a user in an embedded Whop app.

### Questions for Whop Tech Support

If the app is still showing the wrong view:

1. What `viewType` is Whop's system sending to Chronos?
2. How is the app configured in the Whop Developer Dashboard - as a B2B (creator) app or B2C (customer) app?
3. Can they check what context data is being sent when loading the app?

**Key Message:**
> The app is receiving the user token correctly (auth works), but it's showing the Student view instead of Creator view. This suggests Whop is sending `viewType: 'app'` instead of `viewType: 'admin'`. Can you check what viewType and context data your system is passing to the app?

### Testing Checklist

After deploying these changes:

1. [ ] Set `NEXT_PUBLIC_DEBUG_WHOP_CONTEXT=true` in Vercel
2. [ ] Access app through Whop dashboard (not directly)
3. [ ] Check debug panel in bottom-right corner
4. [ ] Verify `viewType` shows 'admin' for creator access
5. [ ] Verify `companyRoute` is populated
6. [ ] Check for any 500 errors in browser console
7. [ ] Confirm creator record exists in database after first access

### Success Criteria

The fix is complete when:

1. Creator accesses app via Whop → sees Creator Dashboard (not Student view)
2. Debug panel shows `viewType: 'admin'`
3. No 500 errors on API calls
4. Creator record auto-created in database on first access
5. All dashboard pages load successfully
