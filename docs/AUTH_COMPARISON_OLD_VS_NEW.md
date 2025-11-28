# Authentication Comparison: Working Old App vs New Chronos

**Date:** November 28, 2025
**Purpose:** Document what was working in the old AI-Video-Learning-Assistant app and compare with the new Chronos implementation to identify why authentication is failing.

---

## Executive Summary

| Aspect | Old App (Working) | New Chronos (Broken) |
|--------|-------------------|----------------------|
| **Auth Type** | OAuth Flow | Native Auth (JWT headers) |
| **SDK Used** | `@whop/api` `WhopServerSdk` | `@whop/sdk` `Whop` class |
| **Token Source** | Exchange code for token | `x-whop-user-token` header |
| **App Type** | Standalone-capable | Embedded-only |
| **Status** | Was working until Nov 7 | Blocked by Whop routing |

---

## Critical Finding

The old app and new app are using **completely different authentication approaches**:

1. **Old App**: OAuth flow for **standalone** access
2. **New Chronos**: Native auth for **embedded** iframe access

**This means the working OAuth code from the old app may NOT be directly applicable** if Chronos is intended to be embedded-only.

However, if you want Chronos to work **both standalone AND embedded**, you may need to implement BOTH approaches like the old app was attempting before the crash.

---

## Part 1: Old App - What Was Working (Commit e3b2b67)

### OAuth Login Route
**File:** `app/api/whop/auth/login/route.ts`

```typescript
import { WhopServerSdk } from '@whop/api';

const whopApi = WhopServerSdk({
  appApiKey: process.env.WHOP_API_KEY!,
  appId: process.env.NEXT_PUBLIC_WHOP_APP_ID!,
});

export async function GET(req: NextRequest) {
  const { url, state } = whopApi.oauth.getAuthorizationUrl({
    redirectUri: WHOP_OAUTH_REDIRECT_URI,
    scope: ['read_user'],
  });

  const response = NextResponse.redirect(url);
  response.cookies.set('whop_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',  // CRITICAL: 'lax' not 'strict'
    maxAge: 600,
    path: '/',
  });

  return response;
}
```

### OAuth Callback Route
**File:** `app/api/whop/auth/callback/route.ts`

```typescript
const authResponse = await whopApi.oauth.exchangeCode({
  code,
  redirectUri: WHOP_OAUTH_REDIRECT_URI,
});

const { access_token } = authResponse.tokens;

const response = NextResponse.redirect(new URL('/dashboard', req.url));
response.cookies.set('whop_access_token', access_token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',  // CRITICAL
  maxAge: 60 * 60 * 24 * 7,
  path: '/',
});
```

### Key Success Factors

1. **Used `@whop/api` SDK** with `WhopServerSdk` (not raw fetch)
2. **Cookie settings**: `sameSite: 'lax'`, NOT 'strict' or 'none'
3. **State cookie** for CSRF protection
4. **SDK methods** for OAuth: `oauth.getAuthorizationUrl()` and `oauth.exchangeCode()`
5. **No middleware.ts** at root level

### Environment Variables Required
```bash
WHOP_API_KEY=                    # From dev.whop.com
NEXT_PUBLIC_WHOP_APP_ID=         # App ID (starts with "app_")
WHOP_OAUTH_REDIRECT_URI=         # ${APP_URL}/api/whop/auth/callback
WHOP_TOKEN_ENCRYPTION_KEY=       # 64-char hex for session encryption
```

---

## Part 2: New Chronos - Current Implementation

### Native Auth Approach
**File:** `lib/whop/native-auth.ts`

```typescript
import { whopsdk } from '@/lib/whop-sdk';

export async function verifyWhopUser(): Promise<WhopAuthResult> {
  const headersList = await headers();
  const { userId } = await whopsdk.verifyUserToken(headersList);
  return { userId, error: null };
}
```

### SDK Setup
**File:** `lib/whop-sdk.ts`

```typescript
import { Whop } from '@whop/sdk';
export const whopsdk = new Whop();
// Auto-reads WHOP_API_KEY, WHOP_APP_ID, WHOP_WEBHOOK_SECRET
```

### Environment Variables Used
```bash
WHOP_API_KEY=                    # From dev.whop.com
WHOP_APP_ID=                     # App ID (NOT NEXT_PUBLIC_)
WHOP_WEBHOOK_SECRET=             # For webhook verification
```

### Deprecated OAuth Routes
The OAuth routes exist but are marked **DEPRECATED** with warnings that they shouldn't be used for embedded apps.

---

## Part 3: Key Differences

### 1. SDK Package & Method

| Old App | New Chronos |
|---------|-------------|
| `@whop/api` | `@whop/sdk` |
| `WhopServerSdk()` | `new Whop()` |
| `whopApi.oauth.getAuthorizationUrl()` | N/A (native auth) |
| `whopApi.oauth.exchangeCode()` | N/A (native auth) |
| N/A | `whopsdk.verifyUserToken(headers)` |

### 2. Authentication Flow

**Old App (OAuth):**
```
User clicks "Sign in with Whop"
  → Redirect to Whop OAuth
  → User authorizes
  → Redirect back with code
  → Exchange code for token
  → Store token in cookie
  → Redirect to /dashboard
```

**New Chronos (Native):**
```
User opens app in Whop iframe
  → Whop injects x-whop-user-token header
  → App calls verifyUserToken(headers)
  → JWT decoded to get userId
  → No cookies needed
```

### 3. Environment Variable Naming

| Old App | New Chronos |
|---------|-------------|
| `NEXT_PUBLIC_WHOP_APP_ID` | `WHOP_APP_ID` |
| Has `WHOP_TOKEN_ENCRYPTION_KEY` | Not needed |
| Has `WHOP_OAUTH_REDIRECT_URI` | Not needed |

### 4. Landing Page Login Button

**Old App:**
```tsx
<a href="/api/whop/auth/login">
  <button>Sign In with Whop</button>
</a>
```

**New Chronos:**
- No login button needed for embedded apps
- JWT is auto-injected by Whop iframe

---

## Part 4: The Current Problem in Chronos

Based on `NATIVE_AUTH_MIGRATION_REPORT.md`:

### Status: BLOCKED by Whop Platform Routing

**What's Happening:**
1. App configured as B2B (creators only)
2. When clicked from Whop dashboard, iframe loads:
   - **Actual:** `https://naitj2bc6jnn909yqfds.apps.whop.com/experiences`
   - **Expected:** `https://www.chronos-ai.app/dashboard/biz_XXXXX`
3. Whop is loading the **Experience path** (for customers) instead of **Dashboard path** (for creators)

**Root Cause Hypothesis:**
- Whop may not properly route to B2B apps before App Store publication
- The app may need to be published first to test properly
- There may be a Whop configuration issue

---

## Part 5: Potential Solutions

### Option A: Stick with Native Auth (Embedded-Only)

**Contact Whop support with:**
```
App ID: app_p2sU9MQCeFnT4o
Company ID: biz_5aH5YEHvkNgNS2
Issue: B2B app loads /experiences instead of /dashboard

Questions:
1. How to test B2B apps before publishing?
2. Why is Experience path used for B2B app?
```

### Option B: Add OAuth Back (Standalone + Embedded)

If you want the app to work **both** standalone AND embedded:

1. **Restore OAuth routes** (remove DEPRECATED warnings)
2. **Use the old app's pattern** exactly:
   - `@whop/api` SDK with `WhopServerSdk`
   - `sameSite: 'lax'` cookies
   - CSRF state validation
3. **Keep native auth** for embedded iframe detection
4. **Auto-detect context:**
   ```typescript
   // In API routes
   const headers = await headers();
   const whopToken = headers.get('x-whop-user-token');

   if (whopToken) {
     // Embedded mode - use native auth
     return await verifyWhopUser();
   } else {
     // Standalone mode - check OAuth cookie
     return await getSessionFromCookie();
   }
   ```

### Option C: Replicate Working OAuth Exactly

Copy the working OAuth implementation from the old app:

1. **Install correct package:**
   ```bash
   npm install @whop/api
   ```

2. **Copy these files from old app:**
   - `app/api/whop/auth/login/route.ts`
   - `app/api/whop/auth/callback/route.ts`
   - `lib/whop/api-client.ts`
   - `lib/whop/auth.ts`

3. **Add environment variables:**
   ```bash
   NEXT_PUBLIC_WHOP_APP_ID=app_xxxxx
   WHOP_OAUTH_REDIRECT_URI=https://www.chronos-ai.app/api/whop/auth/callback
   WHOP_TOKEN_ENCRYPTION_KEY=<generate with: openssl rand -hex 32>
   ```

4. **Update landing page** to use OAuth login button

---

## Part 6: Critical Code to Port from Old App

If you choose Option B or C, here's the essential code:

### 1. WhopServerSdk Initialization
```typescript
import { WhopServerSdk } from '@whop/api';

const whopApi = WhopServerSdk({
  appApiKey: process.env.WHOP_API_KEY!,
  appId: process.env.NEXT_PUBLIC_WHOP_APP_ID!,
});
```

### 2. OAuth URL Generation
```typescript
const { url, state } = whopApi.oauth.getAuthorizationUrl({
  redirectUri: process.env.WHOP_OAUTH_REDIRECT_URI!,
  scope: ['read_user'],
});
```

### 3. Code Exchange
```typescript
const authResponse = await whopApi.oauth.exchangeCode({
  code,
  redirectUri: process.env.WHOP_OAUTH_REDIRECT_URI!,
});

if (!authResponse.ok) {
  throw new Error(authResponse.error?.message);
}

const { access_token } = authResponse.tokens;
```

### 4. Cookie Settings (CRITICAL)
```typescript
response.cookies.set('whop_access_token', access_token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',  // MUST be 'lax', not 'strict' or 'none'
  maxAge: 60 * 60 * 24 * 7,
  path: '/',
});
```

---

## Part 7: Checklist for Fixing Chronos Auth

### If Going OAuth Route:

- [ ] Install `@whop/api` package
- [ ] Set `NEXT_PUBLIC_WHOP_APP_ID` (with NEXT_PUBLIC_ prefix)
- [ ] Set `WHOP_OAUTH_REDIRECT_URI`
- [ ] Generate and set `WHOP_TOKEN_ENCRYPTION_KEY`
- [ ] Register redirect URI in Whop Developer Dashboard
- [ ] Implement login route with SDK's `oauth.getAuthorizationUrl()`
- [ ] Implement callback route with SDK's `oauth.exchangeCode()`
- [ ] Use `sameSite: 'lax'` for all cookies
- [ ] Add login button to landing page

### If Staying Native Auth:

- [ ] Contact Whop support about B2B routing issue
- [ ] Verify `WHOP_APP_ID` is set correctly (without NEXT_PUBLIC_)
- [ ] Ensure app is accessing through correct Whop URL
- [ ] Consider publishing to App Store to test properly
- [ ] Check if app needs to be "installed" to a company first

---

## Part 8: Files Reference

### Old App (Working OAuth)
```
D:\APS\Projects\whop\AI-Video-Learning-Assistant\
├── app/api/whop/auth/login/route.ts      # OAuth initiation
├── app/api/whop/auth/callback/route.ts   # Token exchange
├── app/api/whop/auth/logout/route.ts     # Session cleanup
├── lib/whop/api-client.ts                # Whop API wrapper
├── lib/whop/auth.ts                      # Session management
└── lib/middleware/with-auth.ts           # Route protection
```

### New Chronos (Native Auth)
```
D:\APS\Projects\whop\chronos\
├── app/api/whop/auth/login/route.ts      # DEPRECATED
├── app/api/whop/auth/callback/route.ts   # DEPRECATED
├── lib/whop/auth.ts                      # DEPRECATED OAuth
├── lib/whop/native-auth.ts               # Native auth helpers
├── lib/whop-sdk.ts                       # SDK initialization
└── lib/whop/api-client.ts                # API wrapper
```

---

## Conclusion

The authentication is failing in Chronos because:

1. **Different approach**: Native auth vs OAuth
2. **Platform routing issue**: Whop loading wrong path for B2B app
3. **Missing OAuth**: If standalone access is needed, OAuth isn't implemented

**Recommended Path Forward:**
1. First, try to resolve with Whop support (if embedded-only is fine)
2. If that fails, implement OAuth as backup/fallback using the working old app code
3. Consider hybrid approach: detect context and use appropriate auth method

---

**Document created:** November 28, 2025
**Source analysis:** AI-Video-Learning-Assistant commit e3b2b67 vs Chronos current state
