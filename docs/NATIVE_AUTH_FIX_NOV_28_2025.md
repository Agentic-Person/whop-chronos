# Native Auth Fix - November 28, 2025

## Status: IMPLEMENTED - Ready for Testing

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
- `docs/AUTH_COMPARISON_OLD_VS_NEW.md` - Comparison with old working app
- `docs/integrations/whop/NATIVE_AUTH_MIGRATION_REPORT.md` - Previous migration attempt
- `@whop/iframe` SDK types - See `node_modules/@whop/iframe/dist/index.d.ts`
