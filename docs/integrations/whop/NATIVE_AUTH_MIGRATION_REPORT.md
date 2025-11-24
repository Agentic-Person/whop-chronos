# Whop Native Authentication Migration Report

**Date:** November 22, 2025
**Status:** Completed
**Migration Type:** OAuth to Native Authentication
**Time Spent Debugging:** ~5 days
**Root Cause:** Wrong authentication approach for app type

---

## Executive Summary

### What Went Wrong

We spent approximately **5 days debugging authentication issues** that could have been avoided with proper understanding of Whop's app architecture. The core problem:

> **We implemented OAuth authentication for an embedded app when OAuth is only meant for standalone apps.**

#### Timeline of the Issue

1. **Day 1-2**: Implemented full OAuth flow with token exchange, encrypted cookies, and session management
2. **Day 2-3**: Debugged "invalid_client" errors, tried different client ID/secret combinations
3. **Day 3-4**: Discovered V5 API deprecation, contacted Whop support
4. **Day 4-5**: Received clarification from Whop Tech that embedded apps should use Native Auth
5. **Day 5**: Migrated to Native Authentication - everything worked immediately

#### Key Quote from Whop Tech Support

> "The issue is you can't use your app api key and id as the client id / secret for the v5 api. You'd need to create those separately, but though we don't recommend it since v5 has been deprecated for some time. **Ideally, you'd use whop authentication natively depending on your usecase.**"

### The Root Cause

The fundamental mistake was **not understanding the difference between embedded and standalone Whop apps**:

| Aspect | What We Did (Wrong) | What We Should Have Done |
|--------|---------------------|-------------------------|
| **App Type** | Treated Chronos as standalone | Recognized it as embedded |
| **Auth Method** | Implemented OAuth flow | Used Native Auth with JWT headers |
| **Token Source** | Exchange code for tokens | Read JWT from `x-whop-user-token` header |
| **Session Storage** | Encrypted cookies | No storage needed (stateless JWT) |
| **Complexity** | 500+ lines of auth code | ~50 lines of auth code |

### The Fix

Replace the entire OAuth implementation with a simple JWT verification:

```typescript
// This is ALL you need for embedded apps
const { userId } = await whopsdk.verifyUserToken(await headers());
```

---

## Embedded vs Standalone Apps: Critical Comparison

Understanding this distinction **before starting development** would have saved 5 days of debugging.

### Comparison Table

| Feature | Embedded App (Chronos) | Standalone App |
|---------|----------------------|----------------|
| **How users access** | Inside Whop iframe | Direct URL visit |
| **URL structure** | `whop.com/hub/...` with app panel | `yourapp.com/...` |
| **Auth method** | Native (JWT in headers) | OAuth (redirect flow) |
| **Token delivery** | Auto-injected by Whop iframe | Exchanged via OAuth callback |
| **User experience** | Seamless, no login needed | "Sign in with Whop" button |
| **Cookies required** | No | Yes (session storage) |
| **Redirects required** | No | Yes (OAuth dance) |
| **Token management** | Whop handles it | You handle refresh |
| **Code complexity** | ~50 lines | ~500+ lines |
| **Setup complexity** | Just API key | OAuth client setup |

### How to Identify Your App Type

**Your app is EMBEDDED if:**
- Users access it through the Whop dashboard (`whop.com/hub/...`)
- Your app appears in a panel/iframe within Whop
- You configure "Seller Page" and "Customer Page" in Whop Developer Dashboard
- Users never see your app's domain directly

**Your app is STANDALONE if:**
- Users visit your domain directly (e.g., `yourapp.com`)
- Your app has its own landing page with "Sign in with Whop"
- Users are redirected between your site and Whop for authentication
- Your app works outside of Whop's interface

### Chronos: Why It's Embedded

Chronos is configured as an embedded app because:
1. Creators access it from their Whop company dashboard
2. Students access it through their purchased membership experience
3. All access happens within the Whop iframe
4. No external URL is ever visited directly

---

## The Mistake: OAuth for Embedded App

### What We Built (Unnecessarily)

```
app/
├── api/
│   └── whop/
│       └── auth/
│           ├── login/route.ts      # OAuth redirect initiation
│           ├── callback/route.ts   # Token exchange
│           └── logout/route.ts     # Session destruction
lib/
└── whop/
    ├── auth.ts                     # requireAuth(), session management
    ├── api-client.ts               # Token exchange logic
    └── types.ts                    # Session types
```

### The OAuth Flow We Implemented (Wrong Approach)

```
1. User clicks "Sign in with Whop"
   ↓
2. Redirect to Whop OAuth page
   ↓
3. User authorizes app
   ↓
4. Redirect back with auth code
   ↓
5. Exchange code for tokens (POST to Whop API)
   ↓
6. Fetch user profile
   ↓
7. Encrypt tokens with AES-256-CBC
   ↓
8. Store in HttpOnly cookie
   ↓
9. Redirect to dashboard
   ↓
10. On each request: decrypt cookie, validate tokens, refresh if needed
```

### Why It Failed

1. **App API Key != OAuth Client Credentials**: The `WHOP_API_KEY` and `WHOP_APP_ID` cannot be used as OAuth `client_id` and `client_secret`
2. **V5 API Deprecated**: The OAuth token exchange endpoint we were calling is deprecated
3. **Unnecessary Complexity**: Embedded apps don't need any of this - Whop handles auth automatically
4. **Cookie Issues in Iframe**: Cross-origin iframe restrictions made cookie handling problematic

---

## The Fix: Native Authentication

### What Native Auth Actually Means

When your app runs inside Whop's iframe, Whop automatically:
1. Authenticates the user on their end
2. Creates a JWT with user info
3. Injects it into every request via `x-whop-user-token` header
4. Your app just needs to **verify and decode** this token

### The Simple Implementation

```typescript
// lib/whop/native-auth.ts
import { WhopSDK } from '@whop/api';
import { headers } from 'next/headers';

const whopsdk = new WhopSDK({
  apiKey: process.env.WHOP_API_KEY!
});

export async function verifyWhopUser() {
  const { userId } = await whopsdk.verifyUserToken(await headers());
  return userId;
}

export async function requireCreatorAccess(companyId: string) {
  const userId = await verifyWhopUser();
  const access = await whopsdk.users.checkAccess(companyId, { id: userId });

  if (access.hasAccess !== 'admin') {
    throw new Error('Not authorized as admin');
  }

  return { userId, access };
}

export async function requireStudentAccess(experienceId: string) {
  const userId = await verifyWhopUser();
  const access = await whopsdk.users.checkAccess(experienceId, { id: userId });

  if (access.hasAccess === 'no_access') {
    throw new Error('No access to this experience');
  }

  return { userId, access };
}
```

### Usage in Server Components

```typescript
// app/dashboard/[companyId]/layout.tsx
import { requireCreatorAccess } from '@/lib/whop/native-auth';
import { redirect } from 'next/navigation';

export default async function CreatorLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { companyId: string };
}) {
  try {
    const { userId, access } = await requireCreatorAccess(params.companyId);

    return (
      <DashboardShell userId={userId} companyId={params.companyId}>
        {children}
      </DashboardShell>
    );
  } catch (error) {
    redirect('/auth-error');
  }
}
```

### That's It. No OAuth. No Cookies. No Token Refresh.

---

## Correct Implementation Details

### Route Structure for Native Auth

Native auth uses dynamic route segments to identify the resource being accessed:

#### Creator Routes (Company Admin Access)
```
/dashboard/[companyId]/overview    - Dashboard home
/dashboard/[companyId]/courses     - Course management
/dashboard/[companyId]/videos      - Video library
/dashboard/[companyId]/analytics   - Analytics
/dashboard/[companyId]/usage       - Usage & billing
```

#### Student Routes (Customer Access)
```
/experiences/[experienceId]/courses  - Course catalog
/experiences/[experienceId]/chat     - AI chat interface
```

### Access Verification

| Route Pattern | Access Check | Who Has Access |
|--------------|--------------|----------------|
| `/dashboard/[companyId]/*` | `checkAccess(companyId)` returns `admin` | Company owners, team members |
| `/experiences/[experienceId]/*` | `checkAccess(experienceId)` returns `customer` or `admin` | Users with active membership |

### Full Layout Example

```typescript
// app/dashboard/[companyId]/layout.tsx
import { WhopSDK } from '@whop/api';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

const whopsdk = new WhopSDK({ apiKey: process.env.WHOP_API_KEY! });

export default async function CreatorDashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { companyId: string };
}) {
  // Development bypass for local testing
  if (process.env.DEV_BYPASS_AUTH === 'true') {
    return <DashboardShell companyId={params.companyId}>{children}</DashboardShell>;
  }

  try {
    // 1. Verify the JWT token from Whop iframe
    const { userId } = await whopsdk.verifyUserToken(await headers());

    // 2. Check if user has admin access to this company
    const access = await whopsdk.users.checkAccess(params.companyId, { id: userId });

    if (access.hasAccess !== 'admin') {
      redirect('/auth-error?reason=not_admin');
    }

    // 3. Optionally fetch more user/company data
    const [user, company] = await Promise.all([
      whopsdk.users.retrieve(userId),
      whopsdk.companies.retrieve(params.companyId),
    ]);

    // 4. Render dashboard with context
    return (
      <DashboardShell
        companyId={params.companyId}
        userId={userId}
        companyName={company.title}
      >
        {children}
      </DashboardShell>
    );
  } catch (error) {
    console.error('Auth error:', error);
    redirect('/auth-error');
  }
}
```

---

## Environment Variables

### Required for Native Auth (Embedded Apps)

```bash
# From Whop Developer Dashboard > Your App > API Keys
WHOP_API_KEY=whop_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Your app's ID (used for SDK initialization)
WHOP_APP_ID=app_xxxxxxxxxxxxxxxx

# For webhook signature verification
WHOP_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxx
```

### Development Mode

```bash
# Bypass auth for local testing (NEVER in production)
DEV_BYPASS_AUTH=true
NEXT_PUBLIC_DEV_BYPASS_AUTH=true
```

### Deprecated - NOT NEEDED for Embedded Apps

```bash
# These were required for OAuth but are NOT needed for native auth:
# WHOP_CLIENT_ID         - Not needed (no OAuth)
# WHOP_CLIENT_SECRET     - Not needed (no OAuth)
# WHOP_TOKEN_ENCRYPTION_KEY  - Not needed (no cookies)
# WHOP_OAUTH_REDIRECT_URI    - Not needed (no redirects)
```

---

## Code Examples

### Verifying User in API Route

```typescript
// app/api/courses/route.ts
import { WhopSDK } from '@whop/api';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

const whopsdk = new WhopSDK({ apiKey: process.env.WHOP_API_KEY! });

export async function GET(request: Request) {
  try {
    // Verify user from Whop iframe
    const { userId } = await whopsdk.verifyUserToken(await headers());

    // Your logic here
    const courses = await db.courses.findMany({ creatorId: userId });

    return NextResponse.json({ courses });
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
```

### Getting User Details

```typescript
const { userId } = await whopsdk.verifyUserToken(await headers());
const user = await whopsdk.users.retrieve(userId);

// user contains:
// - id: string
// - username: string
// - email: string
// - name: string
// - image: string (avatar URL)
```

### Getting Company Details

```typescript
const company = await whopsdk.companies.retrieve(companyId);

// company contains:
// - id: string
// - title: string
// - image: string
// - authorized_users: User[]
```

### Checking Access Level

```typescript
const access = await whopsdk.users.checkAccess(resourceId, { id: userId });

// access.hasAccess can be:
// - 'admin'     - Full access (company owner/team)
// - 'customer'  - Purchased membership
// - 'no_access' - No permission
```

---

## Checklist for Future Whop Apps

Before starting ANY Whop app development, answer these questions:

### 1. Determine App Type

- [ ] Where will users access this app?
  - Inside Whop iframe = **EMBEDDED** (use Native Auth)
  - Direct URL visit = **STANDALONE** (use OAuth)

### 2. If Embedded (Native Auth)

- [ ] Configure app in Whop Developer Dashboard:
  - [ ] Set Seller Page URL (`/dashboard/{company_id}/overview`)
  - [ ] Set Customer Page URL (`/experiences/{experience_id}/courses`)
- [ ] Install `@whop/api` SDK
- [ ] Use `whopsdk.verifyUserToken(headers)` for auth
- [ ] Use dynamic route segments: `[companyId]`, `[experienceId]`
- [ ] Use `whopsdk.users.checkAccess()` for authorization
- [ ] **DO NOT** implement OAuth
- [ ] **DO NOT** use cookies for session storage
- [ ] **DO NOT** implement token refresh logic

### 3. If Standalone (OAuth)

- [ ] Create OAuth client in Whop Developer Dashboard (separate from API key)
- [ ] Implement full OAuth flow:
  - [ ] Login redirect endpoint
  - [ ] Callback handler with token exchange
  - [ ] Session storage (encrypted cookies)
  - [ ] Token refresh mechanism
  - [ ] Logout handler
- [ ] Set `WHOP_CLIENT_ID` and `WHOP_CLIENT_SECRET`
- [ ] Configure redirect URIs

### 4. Environment Variables Checklist

**For Embedded Apps:**
- [ ] `WHOP_API_KEY` - Set
- [ ] `WHOP_APP_ID` - Set
- [ ] `WHOP_WEBHOOK_SECRET` - Set (if using webhooks)
- [ ] `WHOP_CLIENT_*` variables - **NOT NEEDED**

**For Standalone Apps:**
- [ ] `WHOP_API_KEY` - Set
- [ ] `WHOP_CLIENT_ID` - Set (OAuth client, NOT app ID)
- [ ] `WHOP_CLIENT_SECRET` - Set
- [ ] `WHOP_OAUTH_REDIRECT_URI` - Set
- [ ] `WHOP_TOKEN_ENCRYPTION_KEY` - Generate with `openssl rand -hex 32`

### 5. Testing Checklist

**For Embedded Apps:**
- [ ] Test in actual Whop iframe (not just localhost)
- [ ] Verify `x-whop-user-token` header is present
- [ ] Test both creator (admin) and student (customer) flows
- [ ] Test access denial for unauthorized users

**For Standalone Apps:**
- [ ] Test full OAuth redirect flow
- [ ] Test session persistence across page refreshes
- [ ] Test token refresh before expiration
- [ ] Test logout clears session

---

## Migration Checklist (OAuth to Native)

If you've already built OAuth and need to migrate:

- [x] Create `lib/whop/native-auth.ts` helper functions
- [x] Create `/auth-error` page for failed authentication
- [x] Create `/dashboard/[companyId]/*` route structure
- [x] Create `/experiences/[experienceId]/*` route structure
- [x] Update navigation components for dynamic routes
- [x] Update `.env.example` with native auth config
- [x] Add deprecation notices to OAuth files
- [x] Remove OAuth client credentials from production env
- [ ] Delete deprecated OAuth files (optional cleanup):
  - `app/api/whop/auth/login/route.ts`
  - `app/api/whop/auth/callback/route.ts`
  - `app/api/whop/auth/logout/route.ts`
  - `lib/whop/auth.ts` (OAuth version)
  - `lib/whop/api-client.ts`

---

## References

### Official Whop Documentation

- **Authentication Guide**: https://docs.whop.com/developer/guides/authentication
- **SDK Reference**: https://docs.whop.com/apps/sdk
- **Embedded Apps Guide**: https://docs.whop.com/apps/embedded-apps
- **User Access Check**: https://docs.whop.com/apps/sdk/users#check-access

### Whop SDK Methods

```typescript
// Core auth
whopsdk.verifyUserToken(headers)  // Verify JWT from iframe

// User operations
whopsdk.users.retrieve(userId)    // Get user details
whopsdk.users.checkAccess(resourceId, { id: userId })  // Check permissions

// Company operations
whopsdk.companies.retrieve(companyId)  // Get company details

// Experience operations
whopsdk.experiences.retrieve(experienceId)  // Get experience details
```

### Related Project Documentation

- **Deprecated OAuth Docs**: `docs/archive/WHOP_OAUTH_INTEGRATION_DEPRECATED.md`
- **Whop Integration Guide**: `docs/integrations/whop/WHOP_INTEGRATION_GUIDE.md`
- **Project Status**: `docs/PROJECT_STATUS.md`

---

## Conclusion

The migration from OAuth to Native Authentication was a significant learning experience. The key takeaway:

> **Always determine if your Whop app is embedded or standalone BEFORE writing any authentication code.**

For embedded apps (like Chronos), Native Authentication is:
- **Simpler**: ~50 lines vs 500+ lines of code
- **Faster**: No redirect delays
- **More reliable**: No token refresh edge cases
- **Better UX**: Seamless iframe experience
- **Less maintenance**: Whop handles token lifecycle

This document should serve as a reference to prevent the same 5-day debugging session in future Whop app projects.

---

**Document Revision History:**
- November 22, 2025: Initial comprehensive documentation
- November 22, 2025: Added 5-day debugging timeline and lessons learned
