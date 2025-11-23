# Whop Native Authentication Migration Report

**Date:** November 22, 2025
**Status:** Completed
**Migration Type:** OAuth to Native Authentication

## Executive Summary

This document details the complete migration from Whop OAuth authentication to Native Authentication for the Chronos embedded app. The migration was required because:

1. **OAuth Client Credentials Error**: Whop Tech confirmed that App API Key/ID cannot be used as OAuth client credentials
2. **V5 API Deprecated**: The V5 OAuth flow has been deprecated by Whop
3. **Native Auth Recommended**: For embedded apps, Whop recommends native authentication

### Key Quote from Whop Tech Support:
> "The issue is you can't use your app api key and id as the client id / secret for the v5 api. You'd need to create those separately, but though we don't recommend it since v5 has been deprecated for some time. Ideally, you'd use whop authentication natively depending on your usecase."

## What Changed

### New Route Structure

#### Creator Dashboard Routes
| Old Route | New Route |
|-----------|-----------|
| `/dashboard/creator/overview` | `/dashboard/[companyId]/overview` |
| `/dashboard/creator/courses` | `/dashboard/[companyId]/courses` |
| `/dashboard/creator/videos` | `/dashboard/[companyId]/videos` |
| `/dashboard/creator/analytics` | `/dashboard/[companyId]/analytics` |
| `/dashboard/creator/usage` | `/dashboard/[companyId]/usage` |

#### Student Experience Routes
| Old Route | New Route |
|-----------|-----------|
| `/dashboard/student/courses` | `/experiences/[experienceId]/courses` |
| `/dashboard/student/chat` | `/experiences/[experienceId]/chat` |

### New Files Created

#### Core Authentication
- `lib/whop/native-auth.ts` - Native auth helper functions
- `app/auth-error/page.tsx` - Auth error handling page

#### Creator Dashboard
- `app/dashboard/[companyId]/layout.tsx` - Server-side auth layout
- `app/dashboard/[companyId]/page.tsx` - Redirect to overview
- `app/dashboard/[companyId]/overview/page.tsx` - Dashboard overview
- `app/dashboard/[companyId]/courses/page.tsx` - Course management
- `app/dashboard/[companyId]/videos/page.tsx` - Video library
- `app/dashboard/[companyId]/analytics/page.tsx` - Analytics dashboard
- `app/dashboard/[companyId]/usage/page.tsx` - Usage & billing

#### Student Experience
- `app/experiences/[experienceId]/layout.tsx` - Server-side auth layout
- `app/experiences/[experienceId]/page.tsx` - Redirect to courses
- `app/experiences/[experienceId]/courses/page.tsx` - Course catalog
- `app/experiences/[experienceId]/chat/page.tsx` - AI chat interface

### Files Modified
- `components/layout/DashboardNav.tsx` - Dynamic route support
- `.env.example` - Updated with native auth configuration
- `lib/whop/auth.ts` - Added deprecation notice
- `app/api/whop/auth/login/route.ts` - Added deprecation notice

## How Native Authentication Works

### Authentication Flow

```
1. User clicks app in Whop dashboard
   ↓
2. Whop opens app in iframe
   ↓
3. Whop injects JWT token in x-whop-user-token header
   ↓
4. App layout calls whopsdk.verifyUserToken(headers)
   ↓
5. SDK decodes JWT and returns userId
   ↓
6. App calls whopsdk.users.checkAccess() to verify permissions
   ↓
7. User is authorized or redirected to /auth-error
```

### Access Levels

| Level | Who | Access |
|-------|-----|--------|
| `admin` | Creators/Team Members | Full dashboard access |
| `customer` | Students with membership | Experience access |
| `no_access` | Everyone else | Redirected to error page |

### Key SDK Methods

```typescript
// Verify user token from Whop iframe
const { userId } = await whopsdk.verifyUserToken(await headers());

// Check access to a resource (company or experience)
const access = await whopsdk.users.checkAccess(resourceId, { id: userId });

// Get user profile
const user = await whopsdk.users.retrieve(userId);

// Get company details
const company = await whopsdk.companies.retrieve(companyId);

// Get experience details
const experience = await whopsdk.experiences.retrieve(experienceId);
```

## Environment Variables

### Required for Native Auth
```bash
WHOP_API_KEY=your_api_key          # From Whop Developer Dashboard
NEXT_PUBLIC_WHOP_APP_ID=your_app_id # Your app's ID
WHOP_WEBHOOK_SECRET=your_secret     # For webhook verification
```

### Development Mode
```bash
DEV_BYPASS_AUTH=true                # Bypass auth for local testing
NEXT_PUBLIC_DEV_BYPASS_AUTH=true
```

### Deprecated (Not Needed for Embedded Apps)
```bash
# These are no longer required:
# WHOP_CLIENT_ID
# WHOP_CLIENT_SECRET
# WHOP_TOKEN_ENCRYPTION_KEY
# WHOP_OAUTH_REDIRECT_URI
```

## Testing

### Local Development
1. Set `DEV_BYPASS_AUTH=true` in `.env.local`
2. Run `npm run dev`
3. Access routes directly:
   - Creator: `http://localhost:3007/dashboard/test-company-id/overview`
   - Student: `http://localhost:3007/experiences/test-experience-id/courses`

### In Whop Iframe
1. Deploy to production
2. Configure app in Whop Developer Dashboard:
   - Set App URL to your deployment
   - Configure seller and customer pages
3. Access through Whop dashboard
4. Whop will automatically inject auth token

## Deprecated Files

The following files are deprecated but kept for backward compatibility:

| File | Reason |
|------|--------|
| `lib/whop/auth.ts` | Uses OAuth flow |
| `lib/whop/api-client.ts` | OAuth token exchange |
| `app/api/whop/auth/login/route.ts` | OAuth login endpoint |
| `app/api/whop/auth/logout/route.ts` | OAuth logout endpoint |
| `app/api/whop/auth/callback/route.ts` | OAuth callback |

These files have deprecation notices added and can be removed in a future cleanup.

## Related Documentation

- **Full Guide**: `docs/deployment/WHOP_OAUTH_DEPLOYMENT_GUIDE.md` (renamed to cover native auth)
- **Whop Docs**: https://docs.whop.com/developer/guides/authentication
- **SDK Reference**: https://docs.whop.com/apps/sdk

## Migration Checklist

- [x] Create `lib/whop/native-auth.ts` helper functions
- [x] Create `/auth-error` page for failed authentication
- [x] Create `/dashboard/[companyId]/*` route structure
- [x] Create `/experiences/[experienceId]/*` route structure
- [x] Update `DashboardNav` for dynamic routes
- [x] Update `.env.example` with native auth config
- [x] Add deprecation notices to OAuth files
- [x] Update deployment documentation
- [ ] Deploy and test in Whop iframe (pending)
- [ ] Remove deprecated OAuth code (future cleanup)

## Conclusion

The migration to native authentication is complete. The app now uses Whop's recommended authentication pattern for embedded apps, which:

1. **Simplifies auth flow** - No OAuth dance, just JWT verification
2. **Improves security** - Tokens managed by Whop
3. **Better UX** - Seamless iframe experience
4. **Future-proof** - Using Whop's recommended approach

The legacy OAuth code is deprecated but preserved for reference. It can be safely removed once the native auth routes are fully tested in production.
