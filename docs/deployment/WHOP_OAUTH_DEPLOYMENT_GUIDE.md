# Whop App Integration Guide - Native Authentication

**Last Updated:** November 22, 2025
**Version:** 2.0 - Complete Rewrite for Native Auth
**Status:** ✅ Active - Use this guide for all Whop app integrations

---

## 🚨 CRITICAL: OAuth vs Native Authentication

### ❌ DO NOT USE: V5 OAuth Flow (Deprecated)

If you're seeing this error:
```
Client authentication failed due to unknown client
```

**The problem:** You cannot use your App API Key and App ID as OAuth client credentials. They are different things in Whop's system. The V5 OAuth endpoint has been deprecated.

**What Whop told us (November 22, 2025):**
> "The issue is you can't use your app api key and id as the client id / secret for the v5 api. You'd need to create those separately, but though we don't recommend it since v5 has been deprecated for some time. Ideally, you'd use whop authentication natively depending on your usecase."

### ✅ USE: Native Authentication (Recommended)

Whop's native authentication is:
- **Simpler** - No OAuth redirect dance
- **More secure** - Per-request JWT verification
- **Better supported** - This is Whop's recommended approach
- **Built-in** - Authentication handled by Whop automatically

---

## 📚 Table of Contents

1. [Understanding Whop Authentication](#understanding-whop-authentication)
2. [App Types: Embedded vs Standalone](#app-types-embedded-vs-standalone)
3. [Native Auth Implementation](#native-auth-implementation)
4. [Route Structure for Whop Apps](#route-structure-for-whop-apps)
5. [Identifying Creators vs Students](#identifying-creators-vs-students)
6. [Environment Variables](#environment-variables)
7. [Local Development](#local-development)
8. [Migration from OAuth](#migration-from-oauth)
9. [Troubleshooting](#troubleshooting)
10. [Reference Implementation](#reference-implementation)

---

## 1. Understanding Whop Authentication

### How Native Auth Works

When your app is embedded within Whop's iframe:

```
┌────────────────────────────────────────────────┐
│  Whop Platform (whop.com)                      │
│  ┌──────────────────────────────────────────┐  │
│  │  Your App (embedded iframe)              │  │
│  │                                          │  │
│  │  ←── x-whop-user-token header ───        │  │
│  │      (automatically injected)            │  │
│  │                                          │  │
│  └──────────────────────────────────────────┘  │
└────────────────────────────────────────────────┘
```

**Flow:**
1. User accesses your app through Whop
2. Whop embeds your app in an iframe
3. Whop automatically injects `x-whop-user-token` header on all requests
4. Your app verifies this token using the SDK
5. No login page needed - users are already authenticated!

### The Key Functions

```typescript
import { whopsdk } from "@/lib/whop-sdk";
import { headers } from "next/headers";

// 1. Verify the user token (get user ID)
const { userId } = await whopsdk.verifyUserToken(await headers());
// Returns: { userId: "user_xxxxxxxxxxxxx" }

// 2. Check what access level the user has
const access = await whopsdk.users.checkAccess(resourceId, { id: userId });
// Returns: { access_level: "admin" | "customer" | "no_access", has_access: boolean }
```

### Access Levels Explained

| Level | Meaning | Typical Use |
|-------|---------|-------------|
| `admin` | Team member of the company | Creator dashboards, settings, analytics |
| `customer` | Valid membership holder | Student views, course content, chat |
| `no_access` | No permissions | Redirect to upgrade/purchase page |

---

## 2. App Types: Embedded vs Standalone

### Embedded Apps (Recommended)

**Characteristics:**
- Runs inside Whop's iframe
- Authentication handled automatically
- Uses native token verification
- Seamless user experience

**URL Patterns:**
- Creators access via: `https://whop.com/dashboard/apps/[appId]`
- Students access via: `https://whop.com/[company-slug]/app/[experienceId]`

**When to use:**
- ✅ You want seamless Whop integration
- ✅ You want automatic authentication
- ✅ You're building for Whop creators and their customers

### Standalone Apps (Complex)

**Characteristics:**
- Users visit your domain directly (e.g., `chronos-ai.app`)
- Requires proper OAuth credentials (NOT app API key)
- Must create separate OAuth client credentials in Whop
- More complex setup and maintenance

**When to use:**
- ⚠️ You need users to access outside of Whop
- ⚠️ You need deep linking from external sources
- ⚠️ V5 OAuth is deprecated - not recommended

---

## 3. Native Auth Implementation

### Step 1: Install the Whop SDK

```bash
pnpm add @whop/sdk
# or
npm install @whop/sdk
```

### Step 2: Initialize the SDK

Create `lib/whop-sdk.ts`:

```typescript
import { Whop } from "@whop/sdk";

if (!process.env['NEXT_PUBLIC_WHOP_APP_ID']) {
  throw new Error('NEXT_PUBLIC_WHOP_APP_ID is required');
}

if (!process.env['WHOP_API_KEY']) {
  throw new Error('WHOP_API_KEY is required');
}

export const whopsdk = new Whop({
  appID: process.env['NEXT_PUBLIC_WHOP_APP_ID'],
  apiKey: process.env['WHOP_API_KEY'],
  webhookKey: btoa(process.env['WHOP_WEBHOOK_SECRET'] || ""),
});
```

### Step 3: Create Auth Helper Functions

Create `lib/whop/native-auth.ts`:

```typescript
import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";
import { redirect } from "next/navigation";

/**
 * Verify user token from Whop iframe
 * Use in Server Components and API Routes
 */
export async function verifyWhopUser() {
  try {
    const { userId } = await whopsdk.verifyUserToken(await headers());
    return { userId, error: null };
  } catch (error) {
    console.error("[Whop Auth] Token verification failed:", error);
    return { userId: null, error: "Authentication failed" };
  }
}

/**
 * Require authentication - redirects if not authenticated
 */
export async function requireWhopAuth() {
  const { userId, error } = await verifyWhopUser();

  if (!userId) {
    redirect("/auth-error?reason=unauthenticated");
  }

  return userId;
}

/**
 * Check if user is a creator (admin) for a company
 */
export async function requireCreatorAccess(companyId: string) {
  const userId = await requireWhopAuth();

  const access = await whopsdk.users.checkAccess(companyId, { id: userId });

  if (access.access_level !== "admin") {
    redirect("/auth-error?reason=not_admin");
  }

  return { userId, access };
}

/**
 * Check if user has customer access to an experience
 */
export async function requireStudentAccess(experienceId: string) {
  const userId = await requireWhopAuth();

  const access = await whopsdk.users.checkAccess(experienceId, { id: userId });

  if (!access.has_access) {
    redirect("/auth-error?reason=no_access");
  }

  return { userId, access };
}

/**
 * Get full user context with profile data
 */
export async function getWhopUserContext(resourceId: string) {
  const userId = await requireWhopAuth();

  const [user, access] = await Promise.all([
    whopsdk.users.retrieve(userId),
    whopsdk.users.checkAccess(resourceId, { id: userId }),
  ]);

  return {
    userId,
    user,
    access,
    isCreator: access.access_level === "admin",
    isStudent: access.access_level === "customer",
  };
}
```

### Step 4: Use in Server Components

```typescript
// app/dashboard/[companyId]/page.tsx
import { requireCreatorAccess, getWhopUserContext } from "@/lib/whop/native-auth";
import { whopsdk } from "@/lib/whop-sdk";

export default async function CreatorDashboard({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;

  // Verify user is a creator for this company
  const { userId, access } = await requireCreatorAccess(companyId);

  // Fetch company data
  const company = await whopsdk.companies.retrieve(companyId);

  return (
    <div>
      <h1>Welcome, Creator!</h1>
      <p>Company: {company.title}</p>
      <p>Access Level: {access.access_level}</p>
    </div>
  );
}
```

### Step 5: Use in API Routes

```typescript
// app/api/videos/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyWhopUser } from "@/lib/whop/native-auth";

export async function GET(request: NextRequest) {
  const { userId, error } = await verifyWhopUser();

  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // User is authenticated, proceed with request
  const videos = await getVideosForUser(userId);

  return NextResponse.json({ videos });
}
```

---

## 4. Route Structure for Whop Apps

### Required Route Patterns

Whop embedded apps use dynamic routes with resource IDs:

```
app/
├── dashboard/
│   └── [companyId]/           # Creator routes (admin access)
│       ├── page.tsx           # Dashboard overview
│       ├── layout.tsx         # Auth wrapper + navigation
│       ├── videos/
│       │   └── page.tsx       # Video management
│       ├── courses/
│       │   └── page.tsx       # Course builder
│       ├── analytics/
│       │   └── page.tsx       # Analytics dashboard
│       └── settings/
│           └── page.tsx       # App settings
│
├── experiences/
│   └── [experienceId]/        # Student routes (customer access)
│       ├── page.tsx           # Student home
│       ├── layout.tsx         # Auth wrapper + navigation
│       ├── courses/
│       │   ├── page.tsx       # Course catalog
│       │   └── [courseId]/
│       │       └── page.tsx   # Course viewer
│       └── chat/
│           └── page.tsx       # AI chat interface
│
└── auth-error/
    └── page.tsx               # Error page for auth failures
```

### Why Dynamic Routes?

The `[companyId]` and `[experienceId]` are passed by Whop when embedding your app. They identify:

- **companyId**: Which creator's dashboard is being accessed
- **experienceId**: Which product/experience the student purchased

This allows your app to:
1. Serve multiple creators with one deployment
2. Isolate data between different creator companies
3. Validate access per resource

---

## 5. Identifying Creators vs Students

### Method 1: Check Access Level

```typescript
const access = await whopsdk.users.checkAccess(resourceId, { id: userId });

if (access.access_level === "admin") {
  // User is a creator/team member
  // Show creator dashboard
}

if (access.access_level === "customer") {
  // User is a paying customer
  // Show student view
}

if (access.access_level === "no_access") {
  // User doesn't have access
  // Show upgrade/purchase prompt
}
```

### Method 2: Route-Based Detection

Use different route patterns for different user types:

```typescript
// Creator route: /dashboard/[companyId]/...
// - Always check for "admin" access
// - companyId comes from Whop

// Student route: /experiences/[experienceId]/...
// - Check for "customer" access
// - experienceId comes from Whop
```

### Method 3: Combined User Context

```typescript
async function getUserRole(companyId: string, experienceId?: string) {
  const userId = await requireWhopAuth();

  // Check company access (creator?)
  const companyAccess = await whopsdk.users.checkAccess(companyId, { id: userId });

  if (companyAccess.access_level === "admin") {
    return { role: "creator", userId, companyId };
  }

  // Check experience access (student?)
  if (experienceId) {
    const expAccess = await whopsdk.users.checkAccess(experienceId, { id: userId });
    if (expAccess.has_access) {
      return { role: "student", userId, experienceId };
    }
  }

  return { role: "none", userId };
}
```

---

## 6. Environment Variables

### Required Variables

```bash
# ===== WHOP NATIVE AUTH (Required) =====

# Your Whop App ID (from dev.whop.com)
NEXT_PUBLIC_WHOP_APP_ID=app_xxxxxxxxxxxxxx

# App API Key (from Whop Dashboard → Settings → API Keys)
WHOP_API_KEY=your_api_key_here

# Webhook Secret (from Whop Dashboard → Settings → Webhooks)
WHOP_WEBHOOK_SECRET=your_webhook_secret_here


# ===== OTHER REQUIRED VARIABLES =====

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxx...

# AI APIs
ANTHROPIC_API_KEY=sk-ant-xxx
OPENAI_API_KEY=sk-xxx


# ===== DEPRECATED (Remove these) =====
# WHOP_CLIENT_ID          # NOT NEEDED - was for OAuth
# WHOP_CLIENT_SECRET      # NOT NEEDED - was for OAuth
# WHOP_OAUTH_REDIRECT_URI # NOT NEEDED - was for OAuth
# WHOP_TOKEN_ENCRYPTION_KEY # NOT NEEDED - no session cookies
```

### Getting Your Credentials

1. **App ID**:
   - Go to https://dev.whop.com
   - Select your app
   - Copy the App ID (format: `app_xxxxxxxxxxxxxx`)

2. **API Key**:
   - Go to your app's settings
   - Navigate to API Keys section
   - Create or copy an existing key

3. **Webhook Secret**:
   - Go to your app's settings
   - Navigate to Webhooks section
   - Copy the webhook signing secret

---

## 7. Local Development

### Option 1: Use Whop's Dev Proxy (Recommended)

Whop provides a development proxy that simulates the iframe environment:

```bash
# Install Whop CLI
npm install -g @whop/cli

# Start your app with Whop proxy
whop-proxy --command="npm run dev"
```

This will:
- Run your app on the specified port
- Provide a proxy URL that includes the auth headers
- Simulate the Whop iframe environment

### Option 2: Test Mode Bypass

For rapid development, you can bypass auth locally:

Create `lib/whop/native-auth.ts` with test mode:

```typescript
const TEST_MODE = process.env['DEV_BYPASS_AUTH'] === 'true';
const TEST_USER_ID = 'user_test_123';

export async function verifyWhopUser() {
  if (TEST_MODE) {
    console.log('⚠️ [Auth] Test mode enabled - using mock user');
    return { userId: TEST_USER_ID, error: null };
  }

  // ... real implementation
}
```

**⚠️ WARNING:** Never enable `DEV_BYPASS_AUTH` in production!

### Option 3: Direct Testing in Whop

1. Deploy your app to a preview URL (e.g., Vercel preview)
2. Update your app's URL in Whop Dashboard to the preview URL
3. Test directly within Whop's iframe

---

## 8. Migration from OAuth

If you have an existing OAuth implementation, follow these steps:

### Phase 1: Add Native Auth (Parallel)

1. Install SDK: `pnpm add @whop/sdk`
2. Create `lib/whop-sdk.ts`
3. Create `lib/whop/native-auth.ts`
4. Keep existing OAuth code temporarily

### Phase 2: Create New Routes

1. Create `/dashboard/[companyId]/` routes
2. Create `/experiences/[experienceId]/` routes
3. Implement native auth in new routes
4. Test in Whop iframe environment

### Phase 3: Migrate Pages

For each existing page:

```typescript
// OLD (OAuth)
import { requireAuth } from "@/lib/whop/auth";

export default async function Page() {
  const session = await requireAuth();
  const userId = session.user.id;
  // ...
}

// NEW (Native)
import { requireCreatorAccess } from "@/lib/whop/native-auth";

export default async function Page({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const { userId } = await requireCreatorAccess(companyId);
  // ...
}
```

### Phase 4: Remove OAuth Code

After all pages migrated:

1. Delete `app/api/whop/auth/login/`
2. Delete `app/api/whop/auth/callback/`
3. Delete `app/api/whop/auth/logout/`
4. Remove OAuth functions from `lib/whop/auth.ts`
5. Remove session encryption code
6. Remove OAuth environment variables

### Phase 5: Update Documentation

1. Update README with new setup instructions
2. Update deployment guides
3. Remove OAuth references

---

## 9. Troubleshooting

### Error: "Token verification failed"

**Symptoms:**
- `verifyUserToken()` throws an error
- User appears unauthenticated

**Causes:**
1. App not running in Whop iframe
2. Invalid `WHOP_API_KEY`
3. Token expired or malformed

**Solutions:**
1. Ensure you're accessing app through Whop, not directly
2. Verify API key in environment variables
3. Check that SDK is initialized correctly

### Error: "No access" but user should have access

**Symptoms:**
- `checkAccess()` returns `no_access`
- User has a valid membership

**Causes:**
1. Wrong resource ID (companyId/experienceId)
2. Membership expired
3. User hasn't purchased the product

**Solutions:**
1. Log the resource ID and verify it matches Whop
2. Check user's membership status in Whop Dashboard
3. Ensure product is properly configured

### Error: "Headers not available"

**Symptoms:**
- `headers()` returns undefined
- Can't access `x-whop-user-token`

**Causes:**
1. Calling from client component (headers only available server-side)
2. Not using `await` with `headers()`

**Solutions:**
1. Move authentication to Server Components or API Routes
2. Use `const h = await headers()` (Next.js 15+)

### Local Development Not Working

**Symptoms:**
- Auth works in production but not locally
- Token header not present

**Solutions:**
1. Use `whop-proxy` for local development
2. Enable `DEV_BYPASS_AUTH` for testing
3. Deploy to preview URL and test in Whop iframe

---

## 10. Reference Implementation

### Complete Layout Example

```typescript
// app/dashboard/[companyId]/layout.tsx
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { whopsdk } from "@/lib/whop-sdk";

export default async function CreatorLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;

  // Verify authentication
  let userId: string;
  try {
    const result = await whopsdk.verifyUserToken(await headers());
    userId = result.userId;
  } catch (error) {
    redirect("/auth-error?reason=unauthenticated");
  }

  // Check creator access
  const access = await whopsdk.users.checkAccess(companyId, { id: userId });

  if (access.access_level !== "admin") {
    redirect("/auth-error?reason=not_admin");
  }

  // Fetch user and company data
  const [user, company] = await Promise.all([
    whopsdk.users.retrieve(userId),
    whopsdk.companies.retrieve(companyId),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="flex items-center justify-between p-4">
          <span className="font-bold">{company.title}</span>
          <span>{user.email}</span>
        </div>
      </nav>
      <main className="p-4">
        {children}
      </main>
    </div>
  );
}
```

### Complete API Route Example

```typescript
// app/api/videos/[videoId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  const { videoId } = await params;

  // Verify authentication
  let userId: string;
  try {
    const result = await whopsdk.verifyUserToken(await headers());
    userId = result.userId;
  } catch (error) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // Get the video and check access
  const video = await getVideoById(videoId);

  if (!video) {
    return NextResponse.json(
      { error: "Video not found" },
      { status: 404 }
    );
  }

  // Check if user has access to the video's company/experience
  const access = await whopsdk.users.checkAccess(
    video.companyId,
    { id: userId }
  );

  if (!access.has_access) {
    return NextResponse.json(
      { error: "Access denied" },
      { status: 403 }
    );
  }

  return NextResponse.json({ video });
}
```

---

## 📞 Resources

### Whop Documentation
- **Developer Portal:** https://dev.whop.com
- **Authentication Guide:** https://docs.whop.com/developer/guides/authentication
- **SDK Reference:** https://docs.whop.com/sdk
- **B2B Apps Guide:** https://docs.whop.com/whop-apps/b2b-apps

### Support
- **Whop Discord:** https://discord.gg/whop
- **Whop Support:** support@whop.com

---

## 📋 Quick Checklist

### Before Development
- [ ] Created app in Whop Developer Portal
- [ ] Got App ID (`app_xxxxxx`)
- [ ] Created API Key
- [ ] Set up webhook secret (optional)
- [ ] Configured environment variables

### During Development
- [ ] Installed `@whop/sdk`
- [ ] Created SDK initialization file
- [ ] Created native auth helpers
- [ ] Used dynamic routes (`[companyId]`, `[experienceId]`)
- [ ] Implemented `verifyUserToken()` in layouts
- [ ] Implemented `checkAccess()` for authorization

### Before Deployment
- [ ] Removed any `DEV_BYPASS_AUTH` flags
- [ ] Tested in Whop iframe environment
- [ ] Verified all environment variables in production
- [ ] Removed deprecated OAuth code (if migrating)

### After Deployment
- [ ] Verified authentication works in production
- [ ] Tested both creator and student flows
- [ ] Checked access control works correctly
- [ ] Monitored for any auth errors

---

**Document Version:** 2.0
**Last Updated:** November 22, 2025
**Author:** Chronos Development Team
**Status:** ✅ Active - Recommended approach for all Whop apps
