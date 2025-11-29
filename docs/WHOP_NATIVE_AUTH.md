# Whop Native Authentication - Complete Implementation Guide

**Last Updated:** November 28, 2025
**Status:** Production Ready
**Author:** Compiled from debugging sessions with Whop Tech Support

---

## Table of Contents

1. [Overview](#overview)
2. [The Two Authentication Models](#the-two-authentication-models)
3. [Native Auth Architecture](#native-auth-architecture)
4. [Required Environment Variables](#required-environment-variables)
5. [Implementation Checklist](#implementation-checklist)
6. [Key Files Reference](#key-files-reference)
7. [Common Pitfalls](#common-pitfalls)
8. [Debugging Guide](#debugging-guide)
9. [Code Examples](#code-examples)
10. [Lessons Learned](#lessons-learned)

---

## Overview

Whop apps can run in two modes:
1. **Embedded (iframe)** - App runs inside Whop's dashboard
2. **Standalone** - Users visit your domain directly

**CRITICAL:** These modes require DIFFERENT authentication approaches!

| Mode | Auth Method | Use Case |
|------|-------------|----------|
| Embedded | Native Auth (JWT in header) | B2B apps for creators |
| Standalone | OAuth 2.0 | Direct-to-consumer apps |

**Chronos is an EMBEDDED app** and must use Native Authentication.

---

## The Two Authentication Models

### OAuth 2.0 (DEPRECATED for Embedded Apps)

```
User visits your-app.com
      ↓
Click "Sign in with Whop"
      ↓
Redirect to whop.com/oauth
      ↓
User authorizes
      ↓
Redirect back with code
      ↓
Exchange code for token
      ↓
Store token in cookie
```

**Problems with OAuth in iframes:**
- Redirects break iframe context
- Cookie issues with cross-origin
- Causes 500 errors and infinite loops
- User sees jarring redirects

### Native Auth (REQUIRED for Embedded Apps)

```
User clicks app in Whop dashboard
      ↓
Whop loads your app in iframe
      ↓
Whop injects JWT in x-whop-user-token header
      ↓
Your app verifies JWT with Whop SDK
      ↓
User is authenticated (no redirects!)
```

**Benefits:**
- Seamless user experience
- No cookies needed
- Stateless (JWT is self-contained)
- Whop handles token refresh

---

## Native Auth Architecture

### The Two-Part Problem

Native auth requires TWO separate pieces of information:

#### Part 1: User Identity (WHO)
```typescript
// From @whop/sdk - Server-side
const { userId } = await whopsdk.verifyUserToken(await headers());
```
Returns: `{ userId: "user_xxxxx", appId: "app_xxxxx" }`

**CRITICAL:** This does NOT return companyId or experienceId!

#### Part 2: Context (WHERE)
```typescript
// From @whop/iframe - Client-side
const urlData = await sdk.call('getTopLevelUrlData', {});
```
Returns:
```typescript
{
  companyRoute: "/hub/biz_xxxxx",      // Extract company ID from this
  experienceId: "exp_xxxxx",            // For customer views
  viewType: "admin" | "app" | "analytics" | "preview",
  baseHref: string,
  fullHref: string
}
```

### The Complete Flow

```
1. Whop loads iframe at /dashboard (no params!)
         ↓
2. WhopContextRouter component renders
         ↓
3. Client-side: @whop/iframe SDK calls getTopLevelUrlData()
         ↓
4. Whop parent window responds via postMessage:
   {
     companyRoute: "/hub/biz_5aH5YEHvkNgNS2",
     experienceId: "exp_xxxxx",
     viewType: "admin"  // or "app" for customers
   }
         ↓
5. Router extracts companyId from companyRoute (regex: /biz_[a-zA-Z0-9]+/)
         ↓
6. Router redirects based on viewType:
   - admin → /dashboard/[companyId]/overview
   - app   → /experiences/[experienceId]/courses
         ↓
7. Server-side layout: verifyUserToken() gets userId from JWT
         ↓
8. Server-side: Check user has admin/customer access
         ↓
9. Auto-create database record if first visit
         ↓
10. Render page with full context
```

---

## Required Environment Variables

```bash
# ============================================
# REQUIRED FOR NATIVE AUTH
# ============================================

# Server-side SDK (for verifyUserToken)
WHOP_API_KEY=whop_xxxxxxxxxxxxxxxxxxxxx
WHOP_APP_ID=app_xxxxxxxxxxxxx

# Client-side iframe SDK (for getTopLevelUrlData)
NEXT_PUBLIC_WHOP_APP_ID=app_xxxxxxxxxxxxx  # SAME value as WHOP_APP_ID!

# Webhooks (for membership events)
WHOP_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# ============================================
# DEPRECATED - NOT NEEDED FOR EMBEDDED APPS
# ============================================
# WHOP_CLIENT_ID          # OAuth only
# WHOP_CLIENT_SECRET      # OAuth only
# WHOP_OAUTH_REDIRECT_URI # OAuth only
# WHOP_TOKEN_ENCRYPTION_KEY # OAuth only

# ============================================
# DEVELOPMENT HELPERS
# ============================================
DEV_BYPASS_AUTH=true                    # Skip auth in dev
NEXT_PUBLIC_DEV_BYPASS_AUTH=true        # Client-side awareness
NEXT_PUBLIC_DEBUG_WHOP_CONTEXT=true     # Show debug panel
```

---

## Implementation Checklist

### Step 1: Install Dependencies

```bash
npm install @whop/sdk @whop/iframe @whop/react
```

### Step 2: Create SDK Wrapper

**File:** `lib/whop-sdk.ts`
```typescript
import { Whop } from "@whop/sdk";

export const whopsdk = new Whop();
// SDK auto-reads from WHOP_API_KEY, WHOP_APP_ID env vars
```

### Step 3: Create Iframe SDK Integration

**File:** `lib/whop/iframe-sdk.ts`
```typescript
import { createSdk, type WhopIframeSdk } from '@whop/iframe';

let iframeSdk: WhopIframeSdk | null = null;

export function getWhopIframeSdk(): WhopIframeSdk {
  if (!iframeSdk) {
    iframeSdk = createSdk({
      appId: process.env.NEXT_PUBLIC_WHOP_APP_ID,
    });
  }
  return iframeSdk;
}

export async function getWhopUrlData() {
  const sdk = getWhopIframeSdk();
  return await sdk.call('getTopLevelUrlData', {});
}
```

### Step 4: Create React Hook

**File:** `hooks/useWhopContext.ts`
```typescript
import { useState, useEffect } from 'react';
import { getWhopUrlData, isInsideWhopIframe } from '@/lib/whop/iframe-sdk';

export function useWhopContext() {
  const [urlData, setUrlData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEmbedded, setIsEmbedded] = useState(false);

  useEffect(() => {
    const embedded = isInsideWhopIframe();
    setIsEmbedded(embedded);

    if (!embedded) {
      setLoading(false);
      setError('Not in Whop iframe');
      return;
    }

    getWhopUrlData()
      .then(setUrlData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { urlData, loading, error, isEmbedded };
}

export function extractCompanyId(companyRoute: string): string | null {
  const match = companyRoute.match(/biz_[a-zA-Z0-9]+/);
  return match ? match[0] : null;
}
```

### Step 5: Create Context Router

**File:** `components/whop/WhopContextRouter.tsx`

This component:
1. Uses iframe SDK to get context from Whop parent window
2. Extracts companyId/experienceId
3. Redirects based on viewType

### Step 6: Set Up Entry Points

**File:** `app/dashboard/page.tsx`
```typescript
'use client';
import { WhopContextRouter } from '@/components/whop/WhopContextRouter';

export default function DashboardRouter() {
  return <WhopContextRouter />;
}
```

### Step 7: Create Dynamic Layouts

**File:** `app/dashboard/[companyId]/layout.tsx`
```typescript
export default async function CreatorLayout({ children, params }) {
  const { companyId } = await params;

  // Verify JWT token
  const { userId } = await whopsdk.verifyUserToken(await headers());

  // Check admin access
  const access = await whopsdk.users.checkAccess(companyId, { id: userId });
  if (access.access_level !== 'admin') {
    redirect('/auth-error?reason=not_admin');
  }

  // Auto-create creator in database
  await ensureCreatorExists(userId, companyId, user);

  return <>{children}</>;
}
```

### Step 8: Auto-Create Database Records

When a creator first accesses the app, automatically create their record:

```typescript
const { data: existing } = await supabase
  .from('creators')
  .select('id')
  .eq('whop_company_id', companyId)
  .single();

if (!existing) {
  await supabase.from('creators').insert({
    whop_company_id: companyId,
    whop_user_id: userId,
    email: user.email,
    name: user.name,
    subscription_tier: 'pro',
  });
}
```

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `lib/whop-sdk.ts` | Server-side Whop SDK wrapper |
| `lib/whop/iframe-sdk.ts` | Client-side iframe SDK wrapper |
| `hooks/useWhopContext.ts` | React hook for Whop context |
| `components/whop/WhopContextRouter.tsx` | Routes based on viewType |
| `app/dashboard/page.tsx` | Entry point - uses WhopContextRouter |
| `app/dashboard/[companyId]/layout.tsx` | Dynamic layout with auth |
| `app/experiences/[experienceId]/layout.tsx` | Student/customer layout |
| `app/api/debug/whop-context/route.ts` | Debug endpoint |

---

## Common Pitfalls

### 1. Using OAuth for Embedded Apps

**Wrong:**
```typescript
<a href="/api/whop/auth/login">Sign In with Whop</a>
```

**Right:**
Embedded apps don't need a sign-in button. Auth is automatic via JWT header.

### 2. Expecting companyId in URL

**Wrong:**
```typescript
// Expecting Whop to load /dashboard/biz_xxxxx
export default function Page({ params }) {
  const { companyId } = params; // undefined!
}
```

**Right:**
```typescript
// Whop loads /dashboard, you must get context via iframe SDK
const urlData = await getWhopUrlData();
const companyId = extractCompanyId(urlData.companyRoute);
```

### 3. Missing NEXT_PUBLIC_WHOP_APP_ID

The iframe SDK runs client-side and needs the public env var:
```bash
# Both must be set!
WHOP_APP_ID=app_xxxxx
NEXT_PUBLIC_WHOP_APP_ID=app_xxxxx  # Same value!
```

### 4. Not Auto-Creating Database Records

If user exists in Whop but not your database, API calls fail with 500.

**Fix:** Auto-create records on first access (see Step 8).

### 5. Confusing viewType with Access Level

- `viewType` = What UI to show (admin dashboard vs customer view)
- `access_level` = What permissions user has (admin, customer, none)

Check BOTH:
```typescript
// viewType determines the route
if (urlData.viewType === 'admin') {
  redirect(`/dashboard/${companyId}/overview`);
}

// access_level determines permissions
if (access.access_level !== 'admin') {
  redirect('/auth-error?reason=not_admin');
}
```

### 6. Not Using force-dynamic

Server components that read headers must be dynamic:
```typescript
export const dynamic = 'force-dynamic';

export default async function Layout({ children }) {
  const result = await whopsdk.verifyUserToken(await headers());
  // ...
}
```

---

## Debugging Guide

### Debug Panel

Add to your `.env`:
```bash
NEXT_PUBLIC_DEBUG_WHOP_CONTEXT=true
```

This shows a panel in the bottom-right with:
- isEmbedded: true/false
- viewType: admin/app
- companyRoute: /hub/biz_xxxxx
- experienceId: exp_xxxxx

### Console Logs

Look for these prefixes:
- `[WhopContextRouter]` - Context routing
- `[useWhopContext]` - Hook state
- `[Whop Iframe]` - SDK communication
- `[Creator Layout]` - Auth verification

### Debug Endpoint

Visit `/api/debug/whop-context` to see:
- Environment variables (masked)
- Headers received
- Context data

### Common Error Messages

| Error | Cause | Fix |
|-------|-------|-----|
| "Not in Whop iframe" | Accessing directly instead of through Whop | Access via Whop dashboard |
| "Admin view but no companyId" | companyRoute parsing failed | Check extractCompanyId regex |
| "Failed to create creator" | Database constraint violation | Check whop_company_id uniqueness |
| "User is not admin" | User lacks admin access | User needs admin role in Whop |

---

## Code Examples

### Verifying User Token (Server-Side)

```typescript
import { headers } from 'next/headers';
import { whopsdk } from '@/lib/whop-sdk';

export default async function ServerComponent() {
  try {
    const result = await whopsdk.verifyUserToken(await headers());
    const userId = result.userId;

    const user = await whopsdk.users.retrieve(userId);
    return <div>Hello, {user.name}</div>;
  } catch (error) {
    redirect('/auth-error');
  }
}
```

### Checking Access Level

```typescript
const access = await whopsdk.users.checkAccess(companyId, { id: userId });

if (access.access_level === 'admin') {
  // User owns this company
} else if (access.has_access) {
  // User is a customer
} else {
  // User has no access
}
```

### Getting Context (Client-Side)

```typescript
'use client';

import { useWhopContext, extractCompanyId } from '@/hooks/useWhopContext';

export function MyComponent() {
  const { urlData, loading, error, isEmbedded } = useWhopContext();

  if (loading) return <Spinner />;
  if (error) return <Error message={error} />;
  if (!isEmbedded) return <NeedWhop />;

  const companyId = extractCompanyId(urlData.companyRoute);

  return <Dashboard companyId={companyId} viewType={urlData.viewType} />;
}
```

---

## Lessons Learned

### November 28, 2025 Debugging Session

**Problem:** App showed "Student courses page" instead of "Creator dashboard"

**Root Cause:** Whop was sending `viewType: 'app'` instead of `viewType: 'admin'`

**Discovery:** Using the debug panel, we could see exactly what Whop was sending.

**Resolution:** This was a Whop-side configuration issue. The app code was correct.

---

**Problem:** API returned 500 error on `/api/courses`

**Root Cause:** Creator didn't exist in database. The `creator_id` (Whop user ID) wasn't in the `creators` table.

**Resolution:** Added auto-create logic in layout:
```typescript
if (!existingCreator) {
  await supabase.from('creators').insert({
    whop_company_id: companyId,
    whop_user_id: userId,
    email: user.email,
    // ...
  });
}
```

---

**Key Insight:** `verifyUserToken()` only gives you WHO (userId). You need `@whop/iframe` SDK to get WHERE (companyId, experienceId, viewType).

---

## Quick Start Template

For your next Whop embedded app:

1. Copy these files from Chronos:
   - `lib/whop-sdk.ts`
   - `lib/whop/iframe-sdk.ts`
   - `hooks/useWhopContext.ts`
   - `components/whop/WhopContextRouter.tsx`

2. Set up entry points at `/dashboard` and `/experiences`

3. Create dynamic layouts at `[companyId]` and `[experienceId]`

4. Add auto-create logic for database records

5. Set environment variables

6. Deploy and test!

---

## Resources

- [Whop SDK Documentation](https://docs.whop.com/sdk)
- [Whop Iframe SDK](https://docs.whop.com/apps/sdk/iframe)
- `docs/NATIVE_AUTH_FIX_NOV_28_2025.md` - Detailed fix notes
- `docs/AUTH_COMPARISON_OLD_VS_NEW.md` - OAuth vs Native comparison
