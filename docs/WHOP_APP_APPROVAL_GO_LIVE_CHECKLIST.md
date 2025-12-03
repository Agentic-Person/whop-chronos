# Whop App Approval: Go-Live Checklist

**Purpose:** This document contains the exact steps to take when your Whop app gets approved, transitioning from "pending approval" mode to "fully live" production mode.

**Created:** December 2, 2025
**Status:** Waiting for Whop approval

---

## Overview

During the approval process, we use `DEV_BYPASS_AUTH=true` to allow testing in the Whop iframe without real authentication tokens. Once Whop approves the app, they will start sending real `x-whop-user-token` headers, and we need to disable the bypass.

### Current State (Pending Approval)
- `DEV_BYPASS_AUTH=true` in Vercel environment
- App uses test user data when Whop doesn't send tokens
- Authentication is bypassed for testing

### Target State (Fully Live)
- `DEV_BYPASS_AUTH` removed or set to `false`
- Real Whop JWT tokens validated on every request
- Only authenticated users can access protected routes

---

## Pre-Approval Checklist

Before Whop approves your app, verify these are complete:

- [ ] All fixes from `Whop Production Integration Audit- Fix Plan.md` are implemented
- [ ] `TEST_MODE` uses `process.env['DEV_BYPASS_AUTH']` (not hardcoded `true`)
- [ ] All API routes have JWT validation (with bypass for DEV_BYPASS_AUTH)
- [ ] Build passes: `npm run build`
- [ ] App works in Whop iframe with `DEV_BYPASS_AUTH=true`

---

## When Whop Approves Your App

You'll receive notification from Whop that your app is approved. Follow these steps:

### Step 1: Update Vercel Environment Variables

**In Vercel Dashboard → Your Project → Settings → Environment Variables:**

#### Remove These Variables:
```
DEV_BYPASS_AUTH              ← DELETE THIS
NEXT_PUBLIC_DEV_BYPASS_AUTH  ← DELETE THIS (if exists)
NEXT_PUBLIC_DEV_SIMPLE_NAV   ← DELETE THIS (if exists)
```

#### Verify These Are Set:
```
WHOP_API_KEY                 ← Must be set
WHOP_APP_ID                  ← Must be set
NEXT_PUBLIC_WHOP_APP_ID      ← Must be set
WHOP_WEBHOOK_SECRET          ← Must be set
WHOP_CLIENT_ID               ← Must be set (for OAuth)
WHOP_CLIENT_SECRET           ← Must be set (for OAuth)
```

### Step 2: Redeploy the Application

```bash
# Option A: Via Vercel CLI
npx vercel --prod

# Option B: Via Git
git commit --allow-empty -m "chore: trigger redeploy for Whop approval"
git push origin main
```

### Step 3: Verify Authentication Works

#### Test 1: Embedded App (Whop Iframe)
1. Go to your Whop dashboard
2. Open your app from the sidebar
3. Verify:
   - Creator dashboard loads correctly
   - Your real user info appears (not "Test Creator")
   - Navigation works
   - API calls succeed

#### Test 2: Student Experience
1. Purchase access as a student (or use test membership)
2. Access the student experience from Whop
3. Verify:
   - Courses load correctly
   - AI chat works
   - Video player works

#### Test 3: OAuth Flow (Landing Page)
1. Go to your landing page
2. Click the CTA button to login via Whop
3. Verify:
   - Redirects to Whop OAuth
   - Returns to correct dashboard after login
   - Session persists

#### Test 4: Webhooks
1. Create a test purchase in Whop
2. Check your database for new student record
3. Verify webhook processed successfully

### Step 4: Monitor for Errors

Check these places for any authentication errors:

```bash
# Vercel Logs
npx vercel logs --prod

# Or via Vercel Dashboard
# Go to: Deployments → Latest → Functions → View logs
```

Look for:
- `401 Unauthorized` errors
- `403 Forbidden` errors
- "Whop user token not found" errors
- "Authentication failed" errors

---

## Rollback Plan

If something goes wrong after removing the bypass:

### Quick Rollback (Temporary)
1. Go to Vercel Dashboard → Environment Variables
2. Add back: `DEV_BYPASS_AUTH=true`
3. Redeploy

### Investigate Issues
Common problems after going live:

| Error | Cause | Fix |
|-------|-------|-----|
| "Whop user token not found" | Token not being sent | Check Whop app configuration |
| 401 on all requests | WHOP_APP_ID mismatch | Verify env var matches Whop dashboard |
| Webhook failures | Missing WHOP_WEBHOOK_SECRET | Add correct secret from Whop dashboard |
| OAuth redirect fails | Wrong callback URL | Update WHOP_OAUTH_REDIRECT_URI |

---

## Files That Change Behavior

These files behave differently based on `DEV_BYPASS_AUTH`:

### Layout Files (TEST_MODE)
```typescript
// app/dashboard/[companyId]/layout.tsx
// app/experiences/[experienceId]/layout.tsx

const TEST_MODE = process.env['DEV_BYPASS_AUTH'] === 'true';

if (TEST_MODE) {
  // Uses fake test user data
} else {
  // Validates real Whop JWT token
}
```

### API Routes
```typescript
// All protected API routes check:
const isDevBypass = process.env['DEV_BYPASS_AUTH'] === 'true';

if (!isDevBypass) {
  // Validates JWT and ownership
}
```

### Student Courses API
```typescript
// app/api/courses/student/route.ts
// When DEV_BYPASS_AUTH=true: Shows all courses
// When DEV_BYPASS_AUTH=false: Only shows enrolled courses
```

---

## Environment Variable Reference

### Production Environment (After Approval)

```bash
# Whop Authentication (REQUIRED)
WHOP_API_KEY=whop_xxxxxxxxxxxxxxxx
WHOP_APP_ID=app_xxxxxxxxxxxxxxxx
NEXT_PUBLIC_WHOP_APP_ID=app_xxxxxxxxxxxxxxxx
WHOP_WEBHOOK_SECRET=xxxxxxxxxxxxxxxx

# Whop OAuth (REQUIRED for landing page)
WHOP_CLIENT_ID=xxxxxxxxxxxxxxxx
WHOP_CLIENT_SECRET=xxxxxxxxxxxxxxxx
WHOP_OAUTH_REDIRECT_URI=https://your-app.vercel.app/api/whop/auth/callback
WHOP_TOKEN_ENCRYPTION_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Supabase (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxxxxxxxxxxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxxxxxxxxxxxxx

# AI APIs (REQUIRED)
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxx
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx

# App Configuration (REQUIRED)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
INNGEST_SIGNING_KEY=xxxxxxxxxxxxxxxx

# Development (REMOVE THESE IN PRODUCTION)
# DEV_BYPASS_AUTH=true          ← REMOVE
# NEXT_PUBLIC_DEV_BYPASS_AUTH=true  ← REMOVE
# NEXT_PUBLIC_DEV_SIMPLE_NAV=true   ← REMOVE
```

---

## Verification Checklist (Post Go-Live)

Run through this checklist 24 hours after going live:

### Authentication
- [ ] Creator can access their dashboard (not test data)
- [ ] Student can access their courses
- [ ] Unauthorized users get redirected to auth-error page
- [ ] OAuth login from landing page works

### Core Features
- [ ] Video import works
- [ ] AI chat responds correctly
- [ ] Course builder works
- [ ] Analytics show real data

### Webhooks
- [ ] New purchases create student records
- [ ] Membership changes update access
- [ ] No webhook failures in logs

### Performance
- [ ] Pages load in < 3 seconds
- [ ] No timeout errors
- [ ] No 500 errors in logs

---

## Support Contacts

If you encounter issues after going live:

- **Whop Support:** support@whop.com
- **Whop Developer Discord:** https://discord.gg/whop
- **Vercel Support:** support@vercel.com

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| Dec 2, 2025 | Document created | Claude |
| | Waiting for Whop approval | |

---

## Quick Reference Card

**To Go Live (After Whop Approval):**
```bash
# 1. Remove bypass in Vercel
# Delete: DEV_BYPASS_AUTH

# 2. Redeploy
npx vercel --prod

# 3. Test
# - Open app in Whop iframe
# - Verify real user data shows
# - Test OAuth from landing page
# - Check webhook processing
```

**To Rollback (If Issues):**
```bash
# 1. Add bypass back in Vercel
# Add: DEV_BYPASS_AUTH=true

# 2. Redeploy
npx vercel --prod

# 3. Investigate logs
npx vercel logs --prod
```
