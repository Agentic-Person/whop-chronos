# Whop OAuth Deployment Guide - CRITICAL FIX

**Date:** November 20, 2025
**Issue:** OAuth "Client authentication failed" error
**Status:** ✅ Code fixed | ⚠️ Deployment required

---

## 🚨 CRITICAL: What Was Fixed

### Code Changes (Already Applied)

**File:** `lib/whop/api-client.ts`

**Changed OAuth Token Endpoint URLs:**

```diff
- https://data.whop.com/api/v3/oauth/token  ❌ WRONG
+ https://data.whop.com/oauth/token          ✅ CORRECT
```

**Lines Changed:**
- Line 231: `exchangeCodeForToken` function
- Line 272: `refreshAccessToken` function

**Why This Fixes It:**
The `/api/v3/` prefix was incorrect and causing Whop to reject authentication requests with "Client authentication failed" error.

---

## 📋 DEPLOYMENT CHECKLIST

Complete these steps in order:

### ✅ Step 1: Verify Whop Developer Dashboard (10 minutes)

**Navigate to:** https://dev.whop.com or https://dash.whop.com

#### 1.1 Verify App Configuration

| Setting | Expected Value | Where to Find |
|---------|---------------|---------------|
| **App ID** | `app_p2sU9MQCeFnT4o` | Dashboard → Your App → Settings |
| **App Status** | Active / Published | Dashboard → Your App → Status |
| **App Name** | Chronos AI Learning Assistant | Dashboard → Your App |

#### 1.2 Get Correct Client Secret

**CRITICAL:** The client secret in production may be incorrect or expired.

**Steps to get correct client secret:**
1. Go to **Settings** → **OAuth** (or **Developer Settings**)
2. Find **Client Secret** section
3. If you can see the full secret, copy it
4. If it's masked, you may need to **regenerate** it:
   - Click "Regenerate Client Secret" or "Reset Secret"
   - Copy the new secret immediately (you won't see it again!)
   - **IMPORTANT:** This will invalidate the old secret

**Expected format:** `apik_[long_string_of_characters]`

#### 1.3 Register OAuth Redirect URI

**CRITICAL:** This exact URI must be registered:

```
https://www.chronos-ai.app/api/whop/auth/callback
```

**How to add/verify:**
1. Go to **OAuth Settings** → **Redirect URIs**
2. Check if `https://www.chronos-ai.app/api/whop/auth/callback` is listed
3. If not, click **"Add Redirect URI"**
4. Enter: `https://www.chronos-ai.app/api/whop/auth/callback`
5. Click **Save** or **Add**

**❌ Common Mistakes:**
- Adding trailing slash: `https://www.chronos-ai.app/api/whop/auth/callback/` ❌
- Using wrong domain: `https://chronos-ai.app/...` (missing www) ❌
- Using HTTP instead of HTTPS ❌

#### 1.4 Verify OAuth Grant Types

**Ensure these are enabled:**
- ✅ **Authorization Code** - Must be enabled
- ✅ **Refresh Token** - Must be enabled

#### 1.5 Get API Key (for Whop MCP Server)

The Whop MCP server is also failing, suggesting the API key may be incorrect.

**Steps:**
1. Go to **Settings** → **API Keys**
2. Copy your API key (starts with `apik_`)
3. If no API key exists, create one
4. Save this for Vercel environment variables

---

### ⚠️ Step 2: Update Vercel Environment Variables (15 minutes)

**Navigate to:** https://vercel.com/dashboard

#### 2.1 Select Your Project

1. Click on your project: **chronos** or **whop-chronos**
2. Go to **Settings** → **Environment Variables**

#### 2.2 Critical Variables to Update

**For Production Environment ONLY:**

| Variable Name | Value Source | Format | Example |
|--------------|--------------|--------|---------|
| `WHOP_CLIENT_ID` | Whop Dashboard | `app_[id]` | `app_p2sU9MQCeFnT4o` |
| `WHOP_CLIENT_SECRET` | Whop Dashboard (from Step 1.2) | `apik_[long_string]` | `apik_xV1QnlPVqeMYD_A20...` |
| `WHOP_API_KEY` | Whop Dashboard (from Step 1.5) | `apik_[long_string]` | `apik_xV1QnlPVqeMYD_A20...` |
| `WHOP_OAUTH_REDIRECT_URI` | Manual entry | Full URL | `https://www.chronos-ai.app/api/whop/auth/callback` |
| `NEXT_PUBLIC_APP_URL` | Manual entry | Base URL | `https://www.chronos-ai.app` |
| `WHOP_TOKEN_ENCRYPTION_KEY` | Verify existing | 64 hex chars | `e77993f3f6352372eeda...` |
| `WHOP_WEBHOOK_SECRET` | Whop Dashboard (optional) | `ws_[string]` | `ws_f06a57521e31e9d0...` |
| `NEXT_PUBLIC_WHOP_APP_ID` | Same as CLIENT_ID | `app_[id]` | `app_p2sU9MQCeFnT4o` |

#### 2.3 How to Update Each Variable

**For existing variables:**
1. Find the variable in the list
2. Click **Edit** (pencil icon)
3. Update the value
4. Ensure **Environment** is set to **Production** only
5. Click **Save**

**For missing variables:**
1. Click **Add New** button
2. Enter variable name exactly as shown above
3. Enter the value
4. Select **Production** environment only (uncheck Preview/Development)
5. Click **Save**

#### 2.4 CRITICAL: Variables to NEVER Set in Production

**❌ DO NOT SET THESE IN PRODUCTION:**
- `DEV_BYPASS_AUTH` - Security risk, only for local development
- `NEXT_PUBLIC_DEV_BYPASS_AUTH` - Security risk, only for local development
- `DEV_SIMPLE_NAV` - Development feature only

If these exist in production, **DELETE THEM**.

#### 2.5 Verification Checklist

After updating all variables, verify:

- [ ] `WHOP_CLIENT_ID` matches Whop Dashboard App ID
- [ ] `WHOP_CLIENT_SECRET` is the current/regenerated secret from Whop
- [ ] `WHOP_API_KEY` is valid and starts with `apik_`
- [ ] `WHOP_OAUTH_REDIRECT_URI` exactly matches registered URI in Whop
- [ ] `NEXT_PUBLIC_APP_URL` is base URL only (no `/api/whop/auth/callback`)
- [ ] `DEV_BYPASS_AUTH` is NOT set in production
- [ ] All variables are set for **Production** environment only

---

### 🚀 Step 3: Deploy to Production (5 minutes)

#### Option A: Automatic Deployment (Recommended)

**If you have automatic deployments enabled:**

1. Commit the code changes:
```bash
git add lib/whop/api-client.ts
git commit -m "fix(auth): correct Whop OAuth token endpoint URLs

Changed from https://data.whop.com/api/v3/oauth/token
to https://data.whop.com/oauth/token

Fixes 'Client authentication failed' error during OAuth flow.

Affected functions:
- exchangeCodeForToken (line 231)
- refreshAccessToken (line 272)

Assisted by Jimmy Solutions Developer at Agentic Personnel LLC <Jimmy@AgenticPersonnel.com>"
git push origin main
```

2. Vercel will automatically deploy
3. Wait for deployment to complete (2-3 minutes)
4. Check deployment status in Vercel dashboard

#### Option B: Manual Deployment

**If automatic deployments are not enabled:**

1. Go to Vercel Dashboard → Your Project
2. Go to **Deployments** tab
3. Click **Redeploy** on the latest deployment
4. Select **Use existing Build Cache** (faster)
5. Click **Redeploy** to confirm
6. Wait for deployment to complete

#### 3.1 Verify Deployment

1. Check **Deployments** tab in Vercel
2. Wait for status to show **Ready** (green checkmark)
3. Note the deployment URL (should be `https://www.chronos-ai.app`)

---

### ✅ Step 4: Test OAuth Flow (10 minutes)

#### 4.1 Test on Production Site

**Navigate to:** https://www.chronos-ai.app

**Test Steps:**
1. Click **"Sign in with Whop"** button
2. **Expected:** Redirect to Whop OAuth page
   - URL should be: `https://whop.com/oauth?client_id=app_p2sU9MQCeFnT4o&redirect_uri=...`
3. Click **"Authorize"** or **"Allow"**
4. **Expected:** Redirect back to Chronos
   - URL should briefly show: `https://www.chronos-ai.app/api/whop/auth/callback?code=...`
   - Then redirect to: `https://www.chronos-ai.app/dashboard/creator` or `/dashboard/student`
5. **Expected:** You are logged in
   - Should see your Whop username in top-right corner
   - Dashboard should load without errors
6. **Expected:** Session persists
   - Refresh the page - should stay logged in
   - Navigate between pages - should stay logged in

#### 4.2 What to Check If It Fails

**If you get redirected back to landing page with error:**

Check the URL for error details:
```
https://www.chronos-ai.app/?error=oauth_failed&details=[encoded_error]
```

**Common Errors:**

| Error Message | Cause | Fix |
|--------------|-------|-----|
| `redirect_uri_mismatch` | URI not registered in Whop | Go back to Step 1.3 |
| `invalid_client` | Wrong client ID/secret | Go back to Step 1.2 and 2.2 |
| `access_denied` | User declined authorization | Normal - user chose not to login |
| `Client authentication failed` | Wrong credentials in Vercel | Verify Step 2.2 |

#### 4.3 Check Vercel Logs

**If OAuth still fails:**

1. Go to Vercel Dashboard → Your Project
2. Click **Logs** or **Functions** → **Logs**
3. Filter by function: `/api/whop/auth/callback`
4. Look for error messages after your OAuth attempt
5. Check for:
   - `[Whop API] Token exchange failed:` - Shows the exact error from Whop
   - `Failed to complete OAuth flow:` - Shows the error passed to user

**Example of successful log:**
```
[Whop OAuth] Token exchange request: { client_id: 'app_p2sU9MQCeFnT4o', ... }
[Whop Auth] Session created for user: { id: '...', email: '...' }
```

**Example of failed log:**
```
[Whop API] Token exchange failed: {
  status: 401,
  error: 'invalid_client',
  description: 'Client authentication failed...'
}
```

#### 4.4 Test Whop MCP Server (Optional)

After OAuth works, test the Whop MCP server:

**In Claude Code with MCP config:**
```bash
claude --mcp-config default.mcp.json
```

**Try Whop MCP commands:**
- List products: Should return your Whop products
- Get company info: Should return your Whop company details

**If MCP server still fails:**
- Verify `WHOP_API_KEY` in Vercel is correct
- Check that API key has proper permissions in Whop Dashboard

---

## 🐛 Troubleshooting Guide

### Problem: "redirect_uri_mismatch"

**Symptoms:**
- OAuth redirects back with error
- Error message mentions redirect URI

**Solution:**
1. Go to Whop Developer Dashboard
2. Check registered redirect URIs
3. Ensure exact match: `https://www.chronos-ai.app/api/whop/auth/callback`
4. No trailing slash, no typos
5. Save and wait 1-2 minutes for changes to propagate

---

### Problem: "invalid_client" or "Client authentication failed"

**Symptoms:**
- OAuth callback fails during token exchange
- Vercel logs show "Client authentication failed"

**Root Causes:**
1. **Wrong Client ID** - Doesn't match Whop Dashboard
2. **Wrong Client Secret** - Expired or incorrect in Vercel
3. **Missing Credentials** - Not set in Vercel production environment

**Solution:**
1. Go to Whop Dashboard → Get correct Client ID and Secret
2. Go to Vercel → Update `WHOP_CLIENT_ID` and `WHOP_CLIENT_SECRET`
3. Verify values are exactly as shown in Whop Dashboard
4. Redeploy application
5. Test again

---

### Problem: Session doesn't persist (logs out on refresh)

**Symptoms:**
- OAuth succeeds initially
- User gets logged in
- Refresh page → logged out again

**Root Causes:**
1. **Encryption key mismatch** - Different key between deployments
2. **Cookie issues** - Browser blocking cookies
3. **Token expiration** - Tokens expiring immediately

**Solution:**
1. Verify `WHOP_TOKEN_ENCRYPTION_KEY` in Vercel is set and 64 hex characters
2. Check browser console for cookie errors
3. Check if browser is blocking third-party cookies
4. Test in incognito mode to rule out browser extensions

---

### Problem: Whop MCP Server not working

**Symptoms:**
- Whop MCP commands return errors
- "Cannot read properties of undefined" errors

**Root Cause:**
- Invalid `WHOP_API_KEY` in environment

**Solution:**
1. Go to Whop Dashboard → Get valid API key
2. Update `WHOP_API_KEY` in:
   - Vercel production environment (for deployed app)
   - Local `.env.local` (for MCP server)
3. Restart MCP server / redeploy application

---

## 📊 Expected Results After Fix

### ✅ Successful OAuth Flow

1. **Landing Page** → Click "Sign in with Whop"
2. **Whop OAuth Page** → User authorizes app
3. **Callback Processing** → Token exchange succeeds
4. **Session Creation** → Encrypted session cookie set
5. **Dashboard** → User logged in and redirected
6. **Persistence** → Session survives page refresh

### ✅ Vercel Logs (Success)

```
[Whop OAuth] Initiating OAuth flow...
[Whop OAuth] Token exchange request: { client_id: 'app_p2sU9MQCeFnT4o', ... }
[Whop Auth] Token exchange successful
[Whop Auth] Fetching user info...
[Whop Auth] Session created for user: user_ABC123
[Whop Auth] Redirecting to dashboard...
```

### ✅ User Experience

- Click "Sign in with Whop" → Smooth redirect to Whop
- Authorize app → Immediate redirect back
- Dashboard loads → User sees their account info
- Navigation works → No re-authentication needed
- Refresh page → Still logged in

---

## 📞 Support Resources

### Whop Documentation
- **OAuth Guide:** https://docs.whop.com/api-reference/oauth/introduction
- **Token Endpoint:** https://docs.whop.com/api-reference/oauth/token
- **Troubleshooting:** https://docs.whop.com/api-reference/oauth/troubleshooting

### Vercel Documentation
- **Environment Variables:** https://vercel.com/docs/concepts/projects/environment-variables
- **Deployments:** https://vercel.com/docs/concepts/deployments/overview
- **Function Logs:** https://vercel.com/docs/concepts/observability/runtime-logs

### Project Documentation
- **OAuth Implementation:** `lib/whop/auth.ts`, `lib/whop/api-client.ts`
- **Callback Handler:** `app/api/whop/auth/callback/route.ts`
- **Auth Context:** `lib/contexts/AuthContext.tsx`
- **Local Setup Guide:** `docs/guides/setup/WHOP_OAUTH_FIX_GUIDE.md`

---

## ✅ Final Verification Checklist

Before marking this as complete, verify ALL of these:

### Whop Dashboard
- [ ] App ID is `app_p2sU9MQCeFnT4o`
- [ ] App status is "Active" or "Published"
- [ ] Redirect URI `https://www.chronos-ai.app/api/whop/auth/callback` is registered
- [ ] Client Secret is current (not expired)
- [ ] API Key is valid and has proper permissions
- [ ] Authorization Code grant type enabled
- [ ] Refresh Token grant type enabled

### Vercel Production Environment
- [ ] `WHOP_CLIENT_ID=app_p2sU9MQCeFnT4o`
- [ ] `WHOP_CLIENT_SECRET` is current secret from Whop Dashboard
- [ ] `WHOP_API_KEY` is valid API key from Whop Dashboard
- [ ] `WHOP_OAUTH_REDIRECT_URI=https://www.chronos-ai.app/api/whop/auth/callback`
- [ ] `NEXT_PUBLIC_APP_URL=https://www.chronos-ai.app` (no callback path)
- [ ] `WHOP_TOKEN_ENCRYPTION_KEY` is set (64 hex characters)
- [ ] `DEV_BYPASS_AUTH` is NOT set in production
- [ ] All variables are for Production environment only

### Code Changes
- [ ] `lib/whop/api-client.ts` line 231: `https://data.whop.com/oauth/token`
- [ ] `lib/whop/api-client.ts` line 272: `https://data.whop.com/oauth/token`
- [ ] Changes committed to git
- [ ] Changes deployed to production

### Testing
- [ ] Can access https://www.chronos-ai.app
- [ ] "Sign in with Whop" button works
- [ ] OAuth redirects to Whop successfully
- [ ] Authorization redirects back to Chronos
- [ ] User is logged in to dashboard
- [ ] Session persists on page refresh
- [ ] No errors in browser console
- [ ] No errors in Vercel function logs

---

**Last Updated:** November 20, 2025
**Status:** ✅ Code fixed | ⚠️ Deployment pending
**Estimated Time:** 30-40 minutes total

**Once complete, mark this issue as RESOLVED.**
