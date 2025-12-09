# Whop Authentication Changes Log

This document tracks all authentication-related changes made to the Chronos app for Whop integration.

---

## December 3, 2025 - Fix: Add `sdk.getToken()` for Production Auth

### Problem
The Whop developer team reported:
> "The app is not correctly initializing the Whop SDK, not reading the session within the iframe, or not handling the production auth flow."

The app showed "Authentication Required: Whop user token not found" when accessed from Whop.

### Root Cause
Our entry pages (`app/dashboard/page.tsx`, `app/experiences/page.tsx`) were:
- ✅ Initializing the Whop SDK with `createSdk()`
- ✅ Calling `sdk.getTopLevelUrlData()` to get context (companyId, experienceId)
- ❌ **NOT calling `sdk.getToken()` to get the user authentication token!**

The layouts then tried to verify the token from headers, but the token was never fetched.

### Fix Applied

#### 1. Entry Pages - Added `sdk.getToken()` call

**Files modified:**
- `app/dashboard/page.tsx`
- `app/experiences/page.tsx`

**Change:** After getting URL data, now call `sdk.getToken()` and store in cookie:

```typescript
// Step 6.5: Get user token from SDK (CRITICAL for production auth)
const userToken = await sdk.getToken();
if (userToken) {
  document.cookie = `whop-user-token=${userToken}; path=/; secure; samesite=strict; max-age=3600`;
}
```

#### 2. Layout Files - Read token from cookie

**Files modified:**
- `app/dashboard/[companyId]/layout.tsx`
- `app/experiences/[experienceId]/layout.tsx`

**Change:** Read token from cookie in addition to headers:

```typescript
import { headers, cookies } from 'next/headers';

// First try to get token from cookie (set by client-side SDK in entry page)
const cookieStore = await cookies();
const tokenFromCookie = cookieStore.get('whop-user-token')?.value;

let authHeaders: Headers;
if (tokenFromCookie) {
  authHeaders = new Headers(headersList);
  authHeaders.set('x-whop-user-token', tokenFromCookie);
} else {
  authHeaders = headersList;
}

const result = await whopsdk.verifyUserToken(authHeaders);
```

### Auth Flow (After Fix)

1. User opens app in Whop iframe
2. Entry page loads (`/dashboard` or `/experiences`)
3. Entry page calls `sdk.getTopLevelUrlData()` for context
4. **NEW:** Entry page calls `sdk.getToken()` for auth token
5. **NEW:** Entry page stores token in `whop-user-token` cookie
6. Entry page redirects to dashboard/experience page
7. Layout reads token from cookie
8. Layout verifies token with `whopsdk.verifyUserToken()`
9. User is authenticated!

---

## Previous Auth Changes

### November 29, 2025 - Remove WhopContextRouter Entry Points
- Deleted `app/dashboard/page.tsx` (was using WhopContextRouter)
- Deleted `app/experiences/page.tsx` (was using WhopContextRouter)
- Whop loads `/dashboard/biz_xxx` directly with companyId in URL

**Note:** These files were later re-created with simpler SDK-based approach.

### December 2, 2025 - TEST_MODE for Approval Process
- Added `TEST_MODE` controlled by `DEV_BYPASS_AUTH` env var
- When enabled, uses mock data from `lib/whop/test-constants.ts`
- Required because Whop doesn't send tokens until app is approved

**Files with TEST_MODE:**
- `app/dashboard/[companyId]/layout.tsx`
- `app/experiences/[experienceId]/layout.tsx`
- `app/dashboard/creator/layout.tsx`
- `app/dashboard/student/layout.tsx`

---

## Environment Variables

| Variable | Purpose | Production Value |
|----------|---------|------------------|
| `NEXT_PUBLIC_WHOP_APP_ID` | App ID for SDK initialization | `app_p2sU9MQCeFnT4o` |
| `WHOP_API_KEY` | Server-side API key | (secret) |
| `WHOP_WEBHOOK_SECRET` | Webhook verification | (secret) |
| `DEV_BYPASS_AUTH` | Enable TEST_MODE | `false` or unset |

---

## Testing Checklist

- [ ] Open app from Whop Dashboard (creator view)
- [ ] Verify creator dashboard loads without auth error
- [ ] Open app from Whop Joined (student view)
- [ ] Verify student experience loads without auth error
- [ ] Check browser dev tools for `whop-user-token` cookie
- [ ] Check Vercel logs for token-related console messages

---

## Reverting Changes

If you need to revert to the old behavior:

1. Remove `sdk.getToken()` calls from entry pages
2. Remove cookie reading from layouts
3. Set `DEV_BYPASS_AUTH=true` to use test mode

---

## Related Files

- `lib/whop/native-auth.ts` - Native auth helper functions
- `lib/whop/test-constants.ts` - Test data for dev mode
- `lib/whop-sdk.ts` - Whop SDK initialization
- `components/whop/WhopContextRouter.tsx` - Legacy router (deprecated)
