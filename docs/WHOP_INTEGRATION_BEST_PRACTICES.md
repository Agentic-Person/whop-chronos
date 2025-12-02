# Whop Integration Best Practices

**Last Updated:** December 2, 2025
**Status:** BATTLE-TESTED (After 6 weeks of debugging hell)
**Author:** Learned the hard way so you don't have to

---

## TL;DR - The Critical Things That Will Save You Weeks

### 1. PATH CONFIGURATION IS EVERYTHING

In Whop Developer Dashboard → App Details → Hosting:

```
Dashboard path:  /dashboard/[companyId]     ← NOT just /dashboard
Experience path: /experiences/[experienceId] ← NOT just /experiences
```

**Whop replaces `[companyId]` and `[experienceId]` with actual IDs.** Without these, your app has NO WAY to know which company/experience it's for.

### 2. UNPUBLISHED APPS DON'T GET AUTH TOKENS

Whop does NOT send the `x-whop-user-token` header until your app is published/approved. This creates a chicken-and-egg problem.

**Solution:** Hardcode `TEST_MODE = true` in your layouts to bypass auth during the approval process.

### 3. DON'T RELY ON THE IFRAME SDK FOR ROUTING

The `@whop/iframe` SDK's `getTopLevelUrlData()` times out frequently. Use path configuration (point 1) instead.

### 4. DEV MODE PANEL - ENVIRONMENT MATTERS

If you see a "Dev mode" panel in Whop, make sure Environment is set to **"Production"**, not "Localhost".

---

## Table of Contents

1. [The Big Picture](#the-big-picture)
2. [Whop App Configuration Checklist](#whop-app-configuration-checklist)
3. [Project Setup](#project-setup)
4. [File Structure](#file-structure)
5. [The Approval Process Workaround](#the-approval-process-workaround)
6. [Authentication Flow](#authentication-flow)
7. [Common Pitfalls & Solutions](#common-pitfalls--solutions)
8. [Debugging Guide](#debugging-guide)
9. [Timeline Expectations](#timeline-expectations)

---

## The Big Picture

### How Whop Embedded Apps Work

```
1. User clicks your app in Whop dashboard
         ↓
2. Whop loads YOUR app in an iframe with the path you configured:
   - Creator view: https://your-app.com/dashboard/biz_xxxxx
   - Member view:  https://your-app.com/experiences/exp_xxxxx
         ↓
3. Whop injects x-whop-user-token header (ONLY IF APP IS PUBLISHED)
         ↓
4. Your app reads companyId/experienceId from URL params
         ↓
5. Your app verifies user with verifyUserToken()
         ↓
6. App renders with correct context
```

### The Two Views

| View | Who Sees It | Whop URL Pattern | Your App Path |
|------|-------------|------------------|---------------|
| Dashboard | Creators/Admins | `whop.com/dashboard/biz_xxx/apps/...` | `/dashboard/[companyId]` |
| Experience | Members/Customers | `whop.com/joined/.../exp_xxx/app/` | `/experiences/[experienceId]` |

---

## Whop App Configuration Checklist

### In Whop Developer Dashboard (dev.whop.com)

#### 1. App Details Tab

| Field | Value | Notes |
|-------|-------|-------|
| Base URL | `https://your-app.com` | Your production domain |
| **Dashboard path** | `/dashboard/[companyId]` | CRITICAL - include the bracket notation! |
| **Experience path** | `/experiences/[experienceId]` | CRITICAL - include the bracket notation! |
| Discover path | `/discover` | Optional |

#### 2. Environment Variables Section

Copy these to your Vercel/hosting:
- `WHOP_API_KEY`
- `NEXT_PUBLIC_WHOP_APP_ID`

#### 3. OAuth Tab (If needed)

Only if you need standalone access outside Whop iframe.

#### 4. Webhooks Tab

Set up webhook URL and copy `WHOP_WEBHOOK_SECRET`.

---

## Project Setup

### 1. Install Dependencies

```bash
npm install @whop/sdk @whop/react
```

Note: `@whop/iframe` is included with `@whop/react`.

### 2. Environment Variables

```bash
# .env.local

# === REQUIRED ===
WHOP_API_KEY=whop_xxxxxxxxxxxxx
WHOP_APP_ID=app_xxxxxxxxxxxxx
NEXT_PUBLIC_WHOP_APP_ID=app_xxxxxxxxxxxxx  # Same value, needed client-side

# === FOR WEBHOOKS ===
WHOP_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# === FOR DEVELOPMENT/APPROVAL ===
DEV_BYPASS_AUTH=true  # Remove after app is approved!
```

### 3. SDK Setup

**File:** `lib/whop-sdk.ts`
```typescript
import { Whop } from "@whop/sdk";
export const whopsdk = new Whop();
// Auto-reads from WHOP_API_KEY, WHOP_APP_ID env vars
```

---

## File Structure

```
app/
├── layout.tsx                    # Root layout with <WhopApp> wrapper
├── dashboard/
│   ├── page.tsx                  # Fallback (redirect or error)
│   └── [companyId]/
│       ├── layout.tsx            # Creator auth + auto-create record
│       ├── page.tsx              # Redirect to overview
│       └── overview/
│           └── page.tsx          # Creator dashboard
├── experiences/
│   ├── page.tsx                  # Fallback (redirect or error)
│   └── [experienceId]/
│       ├── layout.tsx            # Student auth + auto-create record
│       ├── page.tsx              # Redirect to courses
│       └── courses/
│           └── page.tsx          # Student courses
└── auth-error/
    └── page.tsx                  # Error handling
```

### Root Layout

```typescript
// app/layout.tsx
import { WhopApp } from "@whop/react/components";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <WhopApp>
          {children}
        </WhopApp>
      </body>
    </html>
  );
}
```

### Dynamic Layout with Auth

```typescript
// app/dashboard/[companyId]/layout.tsx
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { whopsdk } from '@/lib/whop-sdk';

export const dynamic = 'force-dynamic';

// TEMPORARY: Set to true until app is approved by Whop
// Then change to: process.env.DEV_BYPASS_AUTH === 'true'
const TEST_MODE = true;

export default async function CreatorLayout({ children, params }) {
  const { companyId } = await params;

  if (TEST_MODE) {
    // Use mock data for approval process
    return <>{children}</>;
  }

  // Production auth
  try {
    const { userId } = await whopsdk.verifyUserToken(await headers());
    const access = await whopsdk.users.checkAccess(companyId, { id: userId });

    if (access.access_level !== 'admin') {
      redirect('/auth-error?reason=not_admin');
    }

    // Auto-create creator record in your database here

    return <>{children}</>;
  } catch (error) {
    redirect('/auth-error?reason=unauthenticated');
  }
}
```

---

## The Approval Process Workaround

### The Problem

1. Whop won't send auth tokens until your app is approved
2. Whop won't approve your app if it doesn't work
3. Your app can't work without auth tokens

### The Solution

**Step 1:** Hardcode `TEST_MODE = true` in your layouts

```typescript
// TEMPORARY: Hardcoded until app is approved
const TEST_MODE = true;
```

**Step 2:** Submit app for approval - it will show your UI with test data

**Step 3:** After approval, change to:

```typescript
const TEST_MODE = process.env.DEV_BYPASS_AUTH === 'true';
```

**Step 4:** Set `DEV_BYPASS_AUTH=false` in production environment

---

## Authentication Flow

### For Published Apps (Normal Flow)

```
Whop iframe loads /dashboard/biz_xxxxx
         ↓
[companyId] layout receives params.companyId = "biz_xxxxx"
         ↓
verifyUserToken(headers) extracts userId from JWT
         ↓
checkAccess(companyId, userId) verifies admin permission
         ↓
Auto-create creator record if first visit
         ↓
Render dashboard
```

### For Unpublished Apps (Approval Flow)

```
Whop iframe loads /dashboard/biz_xxxxx
         ↓
[companyId] layout receives params.companyId = "biz_xxxxx"
         ↓
TEST_MODE = true → Skip auth
         ↓
Render dashboard with test data
```

---

## Common Pitfalls & Solutions

### Pitfall 1: "SDK Timeout" Errors

**Symptom:** `@whop/iframe` SDK times out trying to get context
**Cause:** postMessage communication between iframe and Whop parent failing
**Solution:** DON'T use iframe SDK for routing. Configure paths properly in Whop Dashboard.

### Pitfall 2: "Whop user token not found"

**Symptom:** Auth fails with "ensure you have the dev proxy enabled"
**Cause:** App isn't published, so Whop doesn't send the token
**Solution:** Use TEST_MODE bypass during approval process

### Pitfall 3: Missing Company/Experience Context

**Symptom:** App loads but doesn't know which company it's for
**Cause:** Path not configured with `[companyId]` or `[experienceId]`
**Solution:** Update paths in Whop Developer Dashboard

### Pitfall 4: "Dev mode" Panel Shows Localhost

**Symptom:** App tries to load from localhost:3000
**Cause:** Environment dropdown set to "Localhost"
**Solution:** Change Environment to "Production" in the Dev mode panel

### Pitfall 5: 500 Errors on API Calls

**Symptom:** API returns 500, "creator not found"
**Cause:** User exists in Whop but not in your database
**Solution:** Auto-create database records on first access

### Pitfall 6: Wrong View Displayed

**Symptom:** Creator sees student view, or vice versa
**Cause:** Accessing from wrong Whop URL
**Solution:**
- Creator view: Access from `whop.com/dashboard/biz_xxx/apps/...`
- Member view: Access from `whop.com/joined/.../exp_xxx/app/`

---

## Debugging Guide

### 1. Check Path Configuration

In browser dev tools Network tab, verify the URL Whop is loading:
- Should be: `https://your-app.com/dashboard/biz_xxxxx`
- NOT: `https://your-app.com/dashboard`

### 2. Check Environment

If you see a "Dev mode" panel:
- Environment should be "Production"
- NOT "Localhost"

### 3. Check Auth Headers

In your server logs or API routes, log:
```typescript
const headersList = await headers();
console.log('x-whop-user-token:', headersList.get('x-whop-user-token'));
```

If null, app isn't published or there's a configuration issue.

### 4. Add Debug Logging

```typescript
// In your layout
console.log('[Layout] companyId:', companyId);
console.log('[Layout] TEST_MODE:', TEST_MODE);
```

### 5. Check Vercel Logs

```bash
vercel logs --follow
```

---

## Timeline Expectations

| Phase | Duration | Notes |
|-------|----------|-------|
| Initial setup | 1-2 days | If you follow this guide |
| Without this guide | 6+ weeks | Ask me how I know |
| App approval | 2-3 days | Whop review process |
| Total to production | ~1 week | With proper setup |

---

## Quick Reference Card

### Whop Developer Dashboard Settings

```
Base URL:        https://your-app.com
Dashboard path:  /dashboard/[companyId]
Experience path: /experiences/[experienceId]
```

### Environment Variables

```bash
WHOP_API_KEY=whop_xxx
WHOP_APP_ID=app_xxx
NEXT_PUBLIC_WHOP_APP_ID=app_xxx
WHOP_WEBHOOK_SECRET=whsec_xxx
DEV_BYPASS_AUTH=true  # Only during development/approval
```

### Key SDK Methods

```typescript
// Server-side auth
const { userId } = await whopsdk.verifyUserToken(await headers());

// Check access level
const access = await whopsdk.users.checkAccess(companyId, { id: userId });
// access.access_level: 'admin' | 'customer' | 'none'

// Get user details
const user = await whopsdk.users.retrieve(userId);

// Get company details
const company = await whopsdk.companies.retrieve(companyId);
```

---

## Files to Copy for New Projects

From this project, copy:
1. `lib/whop-sdk.ts` - SDK initialization
2. `app/layout.tsx` - Root layout with WhopApp wrapper
3. `app/dashboard/[companyId]/layout.tsx` - Creator auth pattern
4. `app/experiences/[experienceId]/layout.tsx` - Student auth pattern
5. `app/auth-error/page.tsx` - Error handling

---

## Resources

- [Whop Developer Docs](https://docs.whop.com)
- [Whop SDK Reference](https://docs.whop.com/sdk)
- [App Views Guide](https://docs.whop.com/developer/guides/app-views)
- This project's other docs:
  - `docs/WHOP_NATIVE_AUTH.md`
  - `docs/NATIVE_AUTH_FIX_NOV_28_2025.md`
  - `docs/AUTH_COMPARISON_OLD_VS_NEW.md`

---

## Lessons Learned the Hard Way

1. **The iframe SDK is unreliable** - Don't depend on `getTopLevelUrlData()` for routing
2. **Path configuration is the key** - Everything else falls into place once paths are correct
3. **Whop support takes 3-4 days** - You're on your own for debugging
4. **Approval creates a catch-22** - Use TEST_MODE bypass to break the cycle
5. **Read the official template** - https://github.com/whopio/whop-nextjs-app-template
6. **The "Dev mode" panel matters** - Check the Environment dropdown

---

**Document created after 6 weeks of integration hell. May this save you from the same fate.**
