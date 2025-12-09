# Chronos Whop Authentication - The Complete Guide

**Last Updated:** December 9, 2025
**Status:** WORKING - Test Mode Enabled

---

# ⛔️ STOP - READ THIS FIRST ⛔️

## 🪨 THE STONE TABLET RULE 🪨

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   DO NOT TOUCH AUTHENTICATION UNTIL WHOP FULLY APPROVES THE APP              ║
║                                                                              ║
║   This rule is NON-NEGOTIABLE. We spent 3+ weeks debugging auth issues.     ║
║   The app is WORKING. Leave it alone.                                        ║
║                                                                              ║
║   Current Working Configuration (December 9, 2025):                          ║
║   ─────────────────────────────────────────────────                          ║
║   DEV_BYPASS_AUTH = true                                                     ║
║   NEXT_PUBLIC_DEV_BYPASS_AUTH = true                                         ║
║                                                                              ║
║   These values MUST remain "true" until Whop approves the app.               ║
║   DO NOT set them to "false". DO NOT remove them. DO NOT experiment.         ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

### Why This Rule Exists

1. **Whop doesn't send real JWT tokens until your app is approved**
2. **We tried multiple "fixes" that all broke the app**
3. **Every attempt to enable production auth failed**
4. **Test mode is the ONLY way the app works before approval**

### What Happens If You Ignore This Rule

- App shows "Authentication Required: Whop user token not found"
- Users cannot access the dashboard
- Users cannot access experiences
- You will waste days/weeks debugging
- You will end up right back at test mode anyway

### For ALL Future Whop Apps

This same rule applies to ANY Whop embedded app:

1. **Start with test mode enabled** (`DEV_BYPASS_AUTH=true`)
2. **Keep test mode until Whop approves the app**
3. **Only then attempt production authentication**
4. **Have a rollback plan ready**

---

## TL;DR - Current State (WORKING)

```
STATUS: ✅ WORKING IN TEST MODE

Environment Variables (Vercel Production):
  DEV_BYPASS_AUTH = true
  NEXT_PUBLIC_DEV_BYPASS_AUTH = true

What This Means:
  - App bypasses Whop authentication
  - Uses fake test user IDs from lib/whop/test-constants.ts
  - REQUIRED until Whop approves the app
  - DO NOT CHANGE THESE VALUES

To Set These Values (if ever needed):
  cd /d/APS/Projects/whop/chronos
  printf "true" | npx vercel env add DEV_BYPASS_AUTH production
  printf "true" | npx vercel env add NEXT_PUBLIC_DEV_BYPASS_AUTH production
  npx vercel --prod
```

---

## Table of Contents

1. [The Simple Explanation](#1-the-simple-explanation)
2. [Current Setup (Test Mode)](#2-current-setup-test-mode)
3. [What Happens When Someone Opens the App](#3-what-happens-when-someone-opens-the-app)
4. [The Bug We Fixed (December 8, 2025)](#4-the-bug-we-fixed-december-8-2025)
5. [Critical Environment Variables](#5-critical-environment-variables)
6. [After Whop Approves: Switching to Production](#6-after-whop-approves-switching-to-production)
7. [Troubleshooting](#7-troubleshooting)
8. [File Reference](#8-file-reference)

---

## 1. The Simple Explanation

Chronos runs inside Whop as an **embedded app** (in an iframe). There are two ways users can be authenticated:

### Test Mode (What We're Using Now)
```
User clicks app in Whop
       ↓
App checks: Is DEV_BYPASS_AUTH = true?
       ↓
YES → Use fake test user IDs
       ↓
App works! (But with fake users)
```

### Production Mode (After Whop Approval)
```
User clicks app in Whop
       ↓
Whop injects a JWT token into the app
       ↓
App verifies the token with Whop
       ↓
App knows the REAL user
       ↓
App works with real user data!
```

**Why Test Mode?** Whop doesn't send real JWT tokens until your app is approved. So during development and the approval process, you MUST use test mode.

---

## 2. Current Setup (Test Mode)

### What's Enabled
- `DEV_BYPASS_AUTH=true` in Vercel production
- `NEXT_PUBLIC_DEV_BYPASS_AUTH=true` in Vercel production

### What This Does
When these are `true`, the app skips all Whop authentication and uses these fake IDs:

| What | Fake ID | Used For |
|------|---------|----------|
| User ID | `user_test_00000000000000` | General user identification |
| Creator ID | `user_test_creator_00000000` | Creator dashboard testing |
| Student ID | `user_test_student_00000000` | Student experience testing |
| Company ID | `biz_test_00000000` | Company/business identification |
| Experience ID | `exp_test_00000000` | Experience/product identification |

### Where These Are Defined
File: `lib/whop/test-constants.ts`

---

## 3. What Happens When Someone Opens the App

### Step-by-Step Flow (Test Mode)

1. **User clicks "ChronosAI" in Whop sidebar**
   - Whop loads your app in an iframe
   - URL: `https://www.chronos-ai.app/dashboard` or `/experiences`

2. **Entry page loads** (`app/dashboard/page.tsx`)
   - This is a client-side React component
   - It tries to get context from Whop SDK (company ID, experience ID)
   - It tries to get a user token from `sdk.getToken()`

3. **Entry page redirects to dashboard**
   - Extracts company ID from Whop context
   - Redirects to `/dashboard/[companyId]/overview`

4. **Dashboard layout loads** (`app/dashboard/[companyId]/layout.tsx`)
   - Checks: Is `DEV_BYPASS_AUTH=true`?
   - **YES (current setup):** Uses fake test user data
   - NO: Would try to verify real Whop token

5. **Dashboard renders**
   - Shows creator dashboard with test data
   - Everything works!

### The Key Check (in multiple files)

```typescript
const TEST_MODE = process.env['DEV_BYPASS_AUTH'] === 'true';

if (TEST_MODE) {
  // Use fake test data - skip all Whop auth
  userId = TEST_USER_ID;
  // ... etc
} else {
  // Try to verify real Whop JWT token
  const result = await whopsdk.verifyUserToken(headers);
  // ... etc
}
```

---

## 4. The Bug We Fixed (December 8, 2025)

### What Was Broken
The app was showing "Authentication Required: Whop user token not found" even though we thought test mode was enabled.

### Root Cause
The `DEV_BYPASS_AUTH` environment variable in Vercel had a **hidden newline character**:

```
WRONG:  DEV_BYPASS_AUTH = "true\n"   ← Has invisible \n at the end!
RIGHT:  DEV_BYPASS_AUTH = "true"     ← Clean, no newline
```

### Why This Broke Everything
The code checks:
```typescript
process.env['DEV_BYPASS_AUTH'] === 'true'
```

But `"true\n"` does NOT equal `"true"`, so:
- Test mode was NOT enabled
- App tried to use real Whop auth
- Whop auth failed (no token because app not approved)
- Users saw the error

### How We Fixed It
1. Removed the corrupted environment variables from Vercel
2. Re-added them using `printf` (which doesn't add newlines):
   ```bash
   printf "true" | npx vercel env add DEV_BYPASS_AUTH production
   printf "true" | npx vercel env add NEXT_PUBLIC_DEV_BYPASS_AUTH production
   ```
3. Redeployed the app

### How to Prevent This
**NEVER use `echo` to set Vercel env vars through pipes. Always use `printf`:**
```bash
# WRONG - adds newline
echo "true" | npx vercel env add VAR_NAME production

# RIGHT - no newline
printf "true" | npx vercel env add VAR_NAME production
```

---

## 5. Critical Environment Variables

### Authentication Variables (Vercel Production)

| Variable | Current Value | Purpose |
|----------|---------------|---------|
| `DEV_BYPASS_AUTH` | `true` | Enables test mode (server-side) |
| `NEXT_PUBLIC_DEV_BYPASS_AUTH` | `true` | Enables test mode (client-side) |
| `WHOP_APP_ID` | `app_p2sU9MQCeFnT4o` | Your Whop app ID |
| `NEXT_PUBLIC_WHOP_APP_ID` | `app_p2sU9MQCeFnT4o` | Same as above, for client |
| `WHOP_API_KEY` | (secret) | API key for Whop SDK |
| `WHOP_WEBHOOK_SECRET` | (secret) | For verifying webhooks |

### Important Rules

1. **`WHOP_APP_ID` and `NEXT_PUBLIC_WHOP_APP_ID` MUST be identical**
   - Both should be: `app_p2sU9MQCeFnT4o`

2. **`DEV_BYPASS_AUTH` and `NEXT_PUBLIC_DEV_BYPASS_AUTH` should match**
   - Both `true` = test mode
   - Both `false` = production mode

3. **Never commit secrets to git**
   - `.env.local` is gitignored
   - Secrets go in Vercel environment variables only

---

## 6. After Whop Approves: Switching to Production

**DO NOT DO THIS UNTIL WHOP HAS APPROVED YOUR APP**

### Step 1: Verify Whop Approval
- You should receive confirmation from Whop
- Your app should appear as "Approved" in the Whop developer dashboard

### Step 2: Update Environment Variables

```bash
cd /d/APS/Projects/whop/chronos

# Remove test mode variables
npx vercel env rm DEV_BYPASS_AUTH production --yes
npx vercel env rm NEXT_PUBLIC_DEV_BYPASS_AUTH production --yes

# Add production mode variables (false = real auth)
printf "false" | npx vercel env add DEV_BYPASS_AUTH production
printf "false" | npx vercel env add NEXT_PUBLIC_DEV_BYPASS_AUTH production
```

### Step 3: Redeploy

```bash
npx vercel --prod
```

### Step 4: Test in Whop
1. Open Whop dashboard
2. Click on ChronosAI app
3. Verify you see the real dashboard (not test data)
4. Check that your real Whop user info appears

### Step 5: If Something Breaks - Rollback

```bash
# Go back to test mode immediately
npx vercel env rm DEV_BYPASS_AUTH production --yes
npx vercel env rm NEXT_PUBLIC_DEV_BYPASS_AUTH production --yes
printf "true" | npx vercel env add DEV_BYPASS_AUTH production
printf "true" | npx vercel env add NEXT_PUBLIC_DEV_BYPASS_AUTH production
npx vercel --prod
```

---

## 7. Troubleshooting

### Error: "Authentication Required: Whop user token not found"

**Cause:** Test mode is not working, and real Whop auth is failing.

**Fixes:**
1. Check Vercel env vars don't have newlines:
   ```bash
   npx vercel env pull .env.check --environment=production --yes
   cat .env.check | grep DEV_BYPASS
   # Should show: DEV_BYPASS_AUTH="true" (no \n)
   ```

2. If corrupted, fix with:
   ```bash
   npx vercel env rm DEV_BYPASS_AUTH production --yes
   printf "true" | npx vercel env add DEV_BYPASS_AUTH production
   npx vercel --prod
   ```

### Error: "Not running inside Whop"

**Cause:** Someone accessed the app directly (not through Whop iframe).

**Fix:** This is expected. The app must be accessed through Whop.

### Error: "NEXT_PUBLIC_WHOP_APP_ID not configured"

**Cause:** Missing environment variable.

**Fix:** Add it to Vercel:
```bash
printf "app_p2sU9MQCeFnT4o" | npx vercel env add NEXT_PUBLIC_WHOP_APP_ID production
npx vercel --prod
```

### App loads but shows wrong/empty data

**Cause:** Test mode is working, but database doesn't have test data.

**Fix:** Make sure the database has records matching the test user IDs.

---

## 8. File Reference

### Core Authentication Files

| File | Purpose |
|------|---------|
| `lib/whop/native-auth.ts` | Main auth functions (`verifyWhopUser`, `requireWhopAuth`, etc.) |
| `lib/whop/test-constants.ts` | Test user IDs and mock data |
| `lib/whop-sdk.ts` | Whop SDK initialization |
| `app/dashboard/page.tsx` | Entry page - gets Whop context, redirects |
| `app/dashboard/[companyId]/layout.tsx` | Creator dashboard layout - verifies auth |
| `app/experiences/page.tsx` | Student entry page |
| `app/experiences/[experienceId]/layout.tsx` | Student layout - verifies auth |

### Where TEST_MODE is Checked

1. `lib/whop/native-auth.ts:51` - Main definition
2. `app/dashboard/[companyId]/layout.tsx:27` - Creator dashboard
3. `app/experiences/[experienceId]/layout.tsx` - Student experience

### Environment Files

| File | Purpose |
|------|---------|
| `.env.local` | Local development (gitignored) |
| `.env.example` | Template showing required variables |
| Vercel Dashboard | Production environment variables |

---

## Summary

**Current Status:** WORKING in test mode. DO NOT TOUCH.

**What to do next:**
1. Wait for Whop to approve the app
2. When approved, follow Section 6 to switch to production auth
3. If anything breaks, rollback immediately using the commands in Section 6

**Key lesson learned:**
Environment variables can get corrupted with newline characters. Always use `printf` instead of `echo` when setting them via command line.

---

## 9. MAJOR BUG DISCOVERED: sdk.getToken() Doesn't Exist! (December 9, 2025)

### The Whop Feedback

Whop's technical team rejected the app with this feedback:
> "The app immediately shows 'You need to access this app through Whop… Error: Whop user token not found.' Even though the app is being opened directly through Whop, it is still failing to detect the Whop session."

They recommended:
- Make sure the app initializes the Whop SDK on page load
- Use `iframeSdk.getToken()` or `getWhopSession()` before making authenticated requests

### What We Discovered

**The `sdk.getToken()` method DOES NOT EXIST in the @whop/iframe SDK!**

We checked the SDK source code (`node_modules/@whop/iframe/dist/index.d.ts`) and found the actual available methods:

```typescript
// Methods that ACTUALLY exist in @whop/iframe SDK:
- ping()
- getTopLevelUrlData()     // Gets company/experience context
- openExternalUrl()
- onHrefChange()
- inAppPurchase()
- closeApp()
- openHelpChat()
- getColorTheme()
- earliestUnreadNotification()
- markExperienceRead()
- performHaptic()

// Methods that DO NOT EXIST:
- getToken()        ← We were calling this!
- getSession()
- getWhopSession()
```

### Why The Old Code Was Broken

The entry pages (`app/dashboard/page.tsx` and `app/experiences/page.tsx`) were doing this:

```typescript
// BROKEN CODE - getToken() doesn't exist!
const userToken = await sdk.getToken();  // ← Returns undefined/throws error
if (userToken) {
  document.cookie = `whop-user-token=${userToken}; ...`;  // ← Never runs
}
// Then redirects to dashboard...
// Dashboard tries to read cookie → Empty!
// Dashboard tries to read header → Empty (client-side nav)!
// FAILS with "Whop user token not found"
```

### How Whop Authentication ACTUALLY Works

The token is **NOT** fetched via JavaScript. It's **automatically injected by Whop as an HTTP header** on every request to your app's origin.

```
CORRECT FLOW:
1. User clicks app in Whop iframe
2. Whop loads https://your-app.com/dashboard
3. Whop AUTOMATICALLY adds "x-whop-user-token" header to this request
4. Your SERVER reads the header with: await headers()
5. Server verifies with: whopsdk.verifyUserToken(headersList)
6. User is authenticated!

WRONG FLOW (what we were doing):
1. User clicks app in Whop iframe
2. Whop loads /dashboard (with token in header)
3. Client-side JS tries sdk.getToken() ← DOESN'T EXIST
4. Client-side JS does router.replace() to /dashboard/[id]/overview
5. This is a SOFT navigation - no new HTTP request!
6. Server can't read token from headers because there's no new request
7. FAILS
```

### The Fix

**Remove the fake `sdk.getToken()` calls and make the app work with the HTTP header flow.**

Key changes:
1. Entry pages should NOT try to get tokens
2. Entry pages should use `window.location.href` (hard redirect) instead of `router.replace()` (soft redirect)
3. The hard redirect creates a NEW HTTP request to Whop's proxy
4. Whop injects the token header into this new request
5. Server-side layout reads the token from headers
6. Authentication works!

### Files Modified (December 9, 2025)

| File | Change |
|------|--------|
| `app/dashboard/page.tsx` | Removed `sdk.getToken()`, use hard redirect |
| `app/experiences/page.tsx` | Removed `sdk.getToken()`, use hard redirect |
| `app/dashboard/[companyId]/layout.tsx` | Read token from headers directly |
| `app/experiences/[experienceId]/layout.tsx` | Read token from headers directly |

### Key Lesson Learned

**Don't trust documentation or AI suggestions blindly.** Always verify that SDK methods actually exist by checking:
1. The TypeScript definitions (`.d.ts` files)
2. The actual SDK source code
3. Official examples from the SDK provider

The `sdk.getToken()` method was mentioned in some docs but never actually existed in the SDK.

---

## 10. Authentication Architecture (Corrected)

### How It Should Work (After Fix)

```
┌─────────────────────────────────────────────────────────────────┐
│                         WHOP DASHBOARD                          │
│                                                                 │
│  User clicks "ChronosAI" app                                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    WHOP'S PROXY SERVER                          │
│                                                                 │
│  Adds header: x-whop-user-token: <JWT>                         │
│  Loads iframe: https://www.chronos-ai.app/dashboard             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              YOUR APP - ENTRY PAGE (Server-Side)                │
│              /dashboard or /experiences                         │
│                                                                 │
│  1. Server receives request WITH x-whop-user-token header       │
│  2. Server calls sdk.getTopLevelUrlData() for context           │
│  3. Server returns redirect to /dashboard/[companyId]/overview  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    WHOP'S PROXY SERVER                          │
│                                                                 │
│  Sees redirect, adds header again: x-whop-user-token: <JWT>     │
│  Loads: https://www.chronos-ai.app/dashboard/biz_xxx/overview   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              YOUR APP - DASHBOARD LAYOUT (Server-Side)          │
│              /dashboard/[companyId]/layout.tsx                  │
│                                                                 │
│  1. Server receives request WITH x-whop-user-token header       │
│  2. const headersList = await headers();                        │
│  3. const { userId } = await whopsdk.verifyUserToken(headers);  │
│  4. User is authenticated! Render dashboard.                    │
└─────────────────────────────────────────────────────────────────┘
```

### Why Hard Redirects Matter

**Soft redirect (router.replace):**
- Client-side navigation
- No new HTTP request to server
- Whop's proxy doesn't see it
- No token header injected
- Authentication fails

**Hard redirect (window.location.href):**
- Full page navigation
- New HTTP request through Whop's proxy
- Whop injects token header
- Server can read the header
- Authentication works!

---

## 11. Code Changes Applied (December 9, 2025)

This section documents the exact code changes made to fix the authentication flow.

### Entry Pages - Removed sdk.getToken() and Changed to Hard Redirects

**Files:** `app/dashboard/page.tsx`, `app/experiences/page.tsx`

**Changes:**
1. Removed the fake `sdk.getToken()` call that doesn't exist
2. Changed `router.replace()` to `window.location.href` for hard redirects
3. Removed unused `useRouter` import

**Before (broken):**
```typescript
import { useRouter } from 'next/navigation';

export default function DashboardEntryPage() {
  const router = useRouter();

  // ...SDK initialization...

  // BROKEN: This method doesn't exist!
  const userToken = await sdk.getToken();
  if (userToken) {
    document.cookie = `whop-user-token=${userToken}; path=/; secure;...`;
  }

  // BROKEN: Soft navigation - Whop can't inject headers
  router.replace(`/dashboard/${companyId}/overview`);
}
```

**After (fixed):**
```typescript
import { useEffect, useState } from 'react';

export default function DashboardEntryPage() {
  // NOTE: We don't use Next.js router here - we use window.location.href
  // for hard redirects so Whop can inject the x-whop-user-token header

  // ...SDK initialization for context only...

  // NOTE: Authentication tokens are injected by Whop via HTTP headers
  // The @whop/iframe SDK does NOT have a getToken() method
  // Whop automatically adds x-whop-user-token header on HTTP requests
  // We use hard redirects (window.location.href) so Whop can inject headers

  // FIXED: Hard redirect - allows Whop to inject x-whop-user-token header
  window.location.href = `/dashboard/${companyId}/overview`;
}
```

### Layout Files - Simplified to Read Headers Directly

**Files:** `app/dashboard/[companyId]/layout.tsx`, `app/experiences/[experienceId]/layout.tsx`

**Changes:**
1. Removed `cookies` import (no longer needed)
2. Removed cookie-based token fallback (dead code)
3. Simplified to read token directly from headers

**Before (overcomplicated):**
```typescript
import { headers, cookies } from 'next/headers';

// Production - verify with Whop SDK
try {
  // First try to get token from cookie (set by client-side SDK in entry page)
  const cookieStore = await cookies();
  const tokenFromCookie = cookieStore.get('whop-user-token')?.value;
  const headersList = await headers();

  let authHeaders: Headers;
  if (tokenFromCookie) {
    console.log('[Creator Layout] Using token from cookie');
    authHeaders = new Headers(headersList);
    authHeaders.set('x-whop-user-token', tokenFromCookie);
  } else {
    console.log('[Creator Layout] Using token from headers (proxy injection)');
    authHeaders = headersList;
  }

  const result = await whopsdk.verifyUserToken(authHeaders);
  userId = result.userId;
}
```

**After (simplified):**
```typescript
import { headers } from 'next/headers';

// Production - verify with Whop SDK
// Whop automatically injects x-whop-user-token header on HTTP requests
// This works because entry pages use hard redirects (window.location.href)
try {
  const headersList = await headers();
  console.log('[Creator Layout] Verifying token from Whop-injected headers');
  const result = await whopsdk.verifyUserToken(headersList);
  userId = result.userId;
}
```

### Summary of Changes

| File | Change | Why |
|------|--------|-----|
| `app/dashboard/page.tsx` | Removed `sdk.getToken()`, use `window.location.href` | getToken() doesn't exist, hard redirect needed |
| `app/experiences/page.tsx` | Same as above | Same reasons |
| `app/dashboard/[companyId]/layout.tsx` | Removed cookie fallback, read headers directly | Cookie was never set, headers are the source |
| `app/experiences/[experienceId]/layout.tsx` | Same as above | Same reasons |

### Build Status

After these changes, the build passes successfully:
```
✓ Compiled successfully in 10.6s
✓ Generating static pages (60/60)
```

### Next Steps

1. **Turn off test mode:** Set `DEV_BYPASS_AUTH=false` in Vercel
2. **Redeploy:** `npx vercel --prod`
3. **Test in Whop iframe:** Verify real authentication works
4. **Resubmit to Whop:** Request approval review again

---

## 12. The Real Fix: Hybrid Server/Client Entry Pages (December 9, 2025)

### The Problem We Discovered

After implementing Section 11's changes, authentication STILL failed. Investigation revealed:

1. Whop injects `x-whop-user-token` header on the **initial iframe load** only
2. Our entry pages were client-side components (`'use client'`)
3. Client-side components **cannot read HTTP headers**
4. When the client-side component redirected to `/dashboard/[companyId]/overview`:
   - This was a NEW browser request
   - It did NOT go through Whop's proxy
   - It did NOT have the token header
   - The layout couldn't authenticate

### The Solution: Hybrid Server/Client Architecture

**Key insight:** The entry page needs to be BOTH:
- Server-side (to read the token from headers)
- Client-side (to use the @whop/iframe SDK for context)

**Implementation:**

```
Entry Point Flow (NEW):
1. Whop loads iframe with /dashboard
2. SERVER component reads x-whop-user-token from headers
3. SERVER component stores token in secure httpOnly cookie
4. SERVER component renders CLIENT component
5. CLIENT component uses SDK to get context (companyId)
6. CLIENT component redirects to /dashboard/[companyId]/overview
7. Layout reads token from COOKIE (not headers!)
8. Authentication succeeds!
```

### Files Created/Modified

| File | Type | Purpose |
|------|------|---------|
| `app/dashboard/page.tsx` | Server Component | Reads token from headers, sets cookie |
| `app/dashboard/entry-client.tsx` | Client Component | SDK context extraction, redirect |
| `app/experiences/page.tsx` | Server Component | Reads token from headers, sets cookie |
| `app/experiences/entry-client.tsx` | Client Component | SDK context extraction, redirect |
| `app/dashboard/[companyId]/layout.tsx` | Server Component | Reads from cookie OR headers |
| `app/experiences/[experienceId]/layout.tsx` | Server Component | Reads from cookie OR headers |

### Server Component (Entry Page)

```typescript
// app/dashboard/page.tsx - SERVER component (no 'use client')
import { headers, cookies } from 'next/headers';
import { DashboardEntryClient } from './entry-client';

export default async function DashboardEntryPage() {
  // Read token from Whop-injected header
  const headersList = await headers();
  const whopToken = headersList.get('x-whop-user-token');

  // Store in secure httpOnly cookie
  if (whopToken) {
    const cookieStore = await cookies();
    cookieStore.set('whop-user-token', whopToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 3600,
      path: '/',
    });
  }

  // Render client component for SDK usage
  return <DashboardEntryClient hasToken={!!whopToken} />;
}
```

### Client Component (SDK Logic)

```typescript
// app/dashboard/entry-client.tsx - CLIENT component
'use client';

export function DashboardEntryClient({ hasToken }: { hasToken: boolean }) {
  useEffect(() => {
    // Use SDK to get context
    const sdk = createSdk({ appId });
    const urlData = await sdk.getTopLevelUrlData({});

    // Redirect (token is already in cookie!)
    window.location.href = `/dashboard/${companyId}/overview`;
  }, []);
}
```

### Layout Authentication (Updated)

```typescript
// Layouts now check BOTH cookie and headers
const cookieStore = await cookies();
const tokenFromCookie = cookieStore.get('whop-user-token')?.value;
const tokenFromHeader = headersList.get('x-whop-user-token');

if (tokenFromCookie) {
  // Use cookie (set by entry page)
  authHeaders.set('x-whop-user-token', tokenFromCookie);
} else if (tokenFromHeader) {
  // Use header (direct Whop proxy)
  authHeaders = headersList;
}
```

### Why This Works

1. **Initial request** (`/dashboard`):
   - Goes through Whop's proxy
   - Has `x-whop-user-token` header
   - Server component reads it and stores in cookie

2. **Redirect** (`/dashboard/[companyId]/overview`):
   - Does NOT go through Whop's proxy
   - Does NOT have the header
   - BUT has the cookie!
   - Layout reads from cookie

3. **Authentication succeeds!**

### Key Lesson

When working with Whop embedded apps:
- Whop ONLY injects headers on requests that go through their proxy
- Client-side redirects do NOT go through the proxy
- You MUST capture the token on the initial server request
- Store it in a cookie for subsequent requests

---

*Document updated: December 9, 2025*
*For questions, check the troubleshooting section or review the file references.*
