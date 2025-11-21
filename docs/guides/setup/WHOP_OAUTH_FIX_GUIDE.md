# Whop OAuth Configuration Fix Guide

**Date Created:** November 20, 2025
**Issue:** OAuth login failing due to redirect URI misconfiguration
**Status:** ✅ Local environment fixed | ⚠️ Whop Dashboard & Vercel pending

---

## Problem Summary

The Whop OAuth login was failing because:
1. ❌ `NEXT_PUBLIC_APP_URL` included callback path instead of base URL
2. ⚠️ Redirect URI may not be registered in Whop Developer Dashboard
3. ⚠️ Vercel production environment variables need updating

---

## ✅ Step 1: Local Environment (COMPLETED)

**File:** `.env.local`

**Fixed:**
- ✅ `NEXT_PUBLIC_APP_URL=https://www.chronos-ai.app` (removed callback path)
- ✅ `DEV_BYPASS_AUTH=true` (already enabled - local testing uses test accounts)
- ✅ `WHOP_OAUTH_REDIRECT_URI=https://www.chronos-ai.app/api/whop/auth/callback` (correct)

**Local Testing:**
- Run `npm run dev` to start development server
- OAuth is bypassed - you'll be auto-logged in as test creator
- No need to test OAuth flow locally (using dev bypass mode)

---

## ⚠️ Step 2: Whop Developer Dashboard Configuration (ACTION REQUIRED)

### 2.1 Access Whop Dashboard

1. Navigate to: **https://dev.whop.com** or **https://dash.whop.com**
2. Log in with your Whop account
3. Select your app: **Chronos AI Learning Assistant**
4. Go to **Settings** → **OAuth** (or **Developer Settings**)

### 2.2 Verify App Configuration

**Check these settings:**

| Setting | Expected Value | Current Status |
|---------|---------------|----------------|
| **App ID** | `app_p2sU9MQCeFnT4o` | ✅ Correct in .env.local |
| **Client ID** | `app_p2sU9MQCeFnT4o` | ✅ Matches App ID |
| **Client Secret** | `apik_xV1QnlPVqe...` | ✅ Present in .env.local |
| **App Status** | Active/Published | ⚠️ **VERIFY THIS** |

### 2.3 Register OAuth Redirect URIs

**CRITICAL:** Add this redirect URI to your Whop app:

```
https://www.chronos-ai.app/api/whop/auth/callback
```

**How to add:**
1. In Whop Dashboard → OAuth Settings
2. Find "Redirect URIs" or "Authorized Redirect URIs" section
3. Click "Add Redirect URI"
4. Enter: `https://www.chronos-ai.app/api/whop/auth/callback`
5. Click "Save" or "Update"

**Optional (for local OAuth testing):**
If you want to test OAuth locally (instead of using DEV_BYPASS_AUTH):
```
http://localhost:3007/api/whop/auth/callback
```

### 2.4 Verify OAuth Settings

**Ensure these are enabled:**
- ✅ **Grant Type:** Authorization Code
- ✅ **Grant Type:** Refresh Token
- ✅ **Allow Public Clients:** No (keep disabled for security)
- ✅ **PKCE Required:** No (current implementation doesn't use PKCE)

### 2.5 Check Webhook Configuration (Optional)

If webhooks are used, verify:
- **Webhook URL:** `https://www.chronos-ai.app/api/whop/webhooks`
- **Webhook Secret:** `ws_f06a57521e31e9d0...` (matches .env.local)
- **Events Subscribed:**
  - `membership.created`
  - `membership.expired`
  - `payment.succeeded`

---

## ⚠️ Step 3: Vercel Production Environment Variables (ACTION REQUIRED)

### 3.1 Access Vercel Dashboard

1. Navigate to: **https://vercel.com/dashboard**
2. Select your project: **chronos** or **whop-chronos**
3. Go to **Settings** → **Environment Variables**

### 3.2 Update/Add Environment Variables

**CRITICAL:** Update these variables for **Production** environment:

| Variable Name | Value | Notes |
|--------------|-------|-------|
| `WHOP_OAUTH_REDIRECT_URI` | `https://www.chronos-ai.app/api/whop/auth/callback` | ⚠️ Verify this matches Whop Dashboard |
| `NEXT_PUBLIC_APP_URL` | `https://www.chronos-ai.app` | ❌ Currently wrong in production |
| `WHOP_CLIENT_ID` | `app_p2sU9MQCeFnT4o` | ✅ Should already be set |
| `WHOP_CLIENT_SECRET` | `apik_xV1QnlPVqe...` | ✅ Should already be set |
| `WHOP_API_KEY` | `apik_xV1QnlPVqe...` | ✅ Should already be set |
| `WHOP_WEBHOOK_SECRET` | `ws_f06a57521e31e9d0...` | ✅ Should already be set |
| `WHOP_TOKEN_ENCRYPTION_KEY` | `e77993f3f6352372...` | ✅ Should already be set |

**IMPORTANT SECURITY NOTE:**
- ❌ **DO NOT** set `DEV_BYPASS_AUTH=true` in production
- ❌ **DO NOT** set `NEXT_PUBLIC_DEV_BYPASS_AUTH=true` in production
- These should ONLY exist in local `.env.local`

### 3.3 How to Update Variables

**For each variable:**
1. Click **Edit** next to the variable (or **Add** if it doesn't exist)
2. Enter the correct value
3. Select environment: **Production** (uncheck Preview and Development if checked)
4. Click **Save**

### 3.4 Redeploy Application

After updating environment variables:
1. Go to **Deployments** tab
2. Click **Redeploy** on the latest deployment
3. Or push a new commit to trigger automatic deployment

**Environment variables only take effect after redeployment!**

---

## ✅ Step 4: Test & Verify

### 4.1 Local Testing (DEV_BYPASS_AUTH)

**Test with dev bypass mode:**
```bash
npm run dev
```

**Expected behavior:**
1. Visit `http://localhost:3007`
2. You should be **automatically redirected** to `/dashboard/creator` (no login needed)
3. Check top-right corner - should show "Test Creator" (if creator) or "Test Student" (if student)
4. Navigation should work without authentication prompts

**If this doesn't work:**
- Verify `.env.local` has `DEV_BYPASS_AUTH=true`
- Restart dev server
- Clear browser cache and cookies
- Check terminal for error messages

### 4.2 Production OAuth Testing

**Test on production:**
1. Visit `https://www.chronos-ai.app`
2. Click **"Sign in with Whop"** button
3. Should redirect to Whop OAuth page: `https://whop.com/oauth?client_id=app_p2sU9MQCeFnT4o&redirect_uri=...`
4. Click **"Authorize"** or **"Allow"**
5. Should redirect back to: `https://www.chronos-ai.app/api/whop/auth/callback?code=...`
6. Should then redirect to dashboard: `https://www.chronos-ai.app/dashboard/creator`
7. User should be logged in with their Whop account

**If OAuth fails, check:**
- Browser console for error messages
- Vercel function logs: `https://vercel.com/[your-project]/logs`
- Whop Dashboard for any error logs
- Redirect URI in Whop Dashboard exactly matches `.env` value

### 4.3 Common OAuth Error Messages

| Error | Cause | Fix |
|-------|-------|-----|
| `redirect_uri_mismatch` | Redirect URI not registered in Whop | Add URI to Whop Dashboard |
| `invalid_client` | Client ID or Secret incorrect | Verify credentials in Vercel env vars |
| `access_denied` | User declined authorization | Normal behavior - user chose not to login |
| `Invalid OAuth state` | State parameter mismatch | Check for cookie issues or session conflicts |
| `Failed to exchange code` | Token exchange failed | Check Vercel logs for detailed error |

---

## 📋 Verification Checklist

Use this checklist to ensure everything is configured correctly:

### Local Environment
- [ ] `.env.local` has `NEXT_PUBLIC_APP_URL=https://www.chronos-ai.app` (no callback path)
- [ ] `.env.local` has `DEV_BYPASS_AUTH=true`
- [ ] `.env.local` has `NEXT_PUBLIC_DEV_BYPASS_AUTH=true`
- [ ] `npm run dev` works without errors
- [ ] Automatic redirect to dashboard works locally

### Whop Developer Dashboard
- [ ] App ID is `app_p2sU9MQCeFnT4o`
- [ ] App status is "Active" or "Published" (not "Draft")
- [ ] Redirect URI registered: `https://www.chronos-ai.app/api/whop/auth/callback`
- [ ] Authorization Code grant type enabled
- [ ] Refresh Token grant type enabled
- [ ] Webhook URL configured (optional): `https://www.chronos-ai.app/api/whop/webhooks`

### Vercel Production Environment
- [ ] `WHOP_OAUTH_REDIRECT_URI=https://www.chronos-ai.app/api/whop/auth/callback`
- [ ] `NEXT_PUBLIC_APP_URL=https://www.chronos-ai.app`
- [ ] `WHOP_CLIENT_ID=app_p2sU9MQCeFnT4o`
- [ ] `WHOP_CLIENT_SECRET` is set (starts with `apik_`)
- [ ] `WHOP_API_KEY` is set (starts with `apik_`)
- [ ] `WHOP_TOKEN_ENCRYPTION_KEY` is set (64 hex characters)
- [ ] `DEV_BYPASS_AUTH` is **NOT** set in production
- [ ] Application redeployed after env var changes

### Production Testing
- [ ] Can access `https://www.chronos-ai.app` without errors
- [ ] "Sign in with Whop" button is visible and clickable
- [ ] Clicking button redirects to Whop OAuth page
- [ ] After authorization, redirects back to Chronos
- [ ] User is successfully logged in to dashboard
- [ ] Session persists across page refreshes
- [ ] No errors in browser console or Vercel logs

---

## 🐛 Troubleshooting

### Problem: Local dev not auto-logging in

**Solution:**
1. Verify `.env.local` has `DEV_BYPASS_AUTH=true` and `NEXT_PUBLIC_DEV_BYPASS_AUTH=true`
2. Restart dev server: `Ctrl+C` then `npm run dev`
3. Clear browser cookies for `localhost:3007`
4. Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

### Problem: "redirect_uri_mismatch" error in production

**Solution:**
1. Go to Whop Developer Dashboard
2. Check registered redirect URIs
3. Ensure **exact match**: `https://www.chronos-ai.app/api/whop/auth/callback`
4. No trailing slash, no extra parameters
5. Save changes in Whop Dashboard
6. Wait 1-2 minutes for changes to propagate

### Problem: "Invalid client" error

**Solution:**
1. Verify `WHOP_CLIENT_ID` in Vercel matches Whop Dashboard App ID
2. Verify `WHOP_CLIENT_SECRET` is correct (copy from Whop Dashboard)
3. Redeploy Vercel application after updating env vars

### Problem: OAuth succeeds but user not logged in

**Solution:**
1. Check Vercel function logs for `/api/whop/auth/callback` errors
2. Verify `WHOP_TOKEN_ENCRYPTION_KEY` is set and 64 hex characters
3. Check browser cookies - should have `whop_session` cookie
4. Verify session creation logic in `lib/whop/auth.ts:84-112`

### Problem: Session expires immediately

**Solution:**
1. Check token expiration in Whop API response
2. Verify auto-refresh logic in `lib/whop/auth.ts:114-166`
3. Check `WHOP_TOKEN_ENCRYPTION_KEY` matches between deployments
4. Verify cookie settings (httpOnly, secure, sameSite) are correct

---

## 📞 Support

If you continue experiencing issues after following this guide:

1. **Check Vercel Logs:**
   - Go to Vercel Dashboard → Functions → Logs
   - Filter by `/api/whop/auth/callback`
   - Look for error messages and stack traces

2. **Check Browser Console:**
   - Open browser DevTools (F12)
   - Check Console tab for error messages
   - Check Network tab for failed API requests

3. **Review Whop API Docs:**
   - https://docs.whop.com/api-reference/oauth/introduction
   - https://docs.whop.com/api-reference/oauth/authorize

4. **Contact Whop Support:**
   - If Whop API is returning errors
   - If redirect URIs aren't saving
   - If app status issues

---

## 📝 Related Documentation

- **OAuth Implementation:** `lib/whop/auth.ts`, `lib/whop/api-client.ts`
- **Auth Context:** `lib/contexts/AuthContext.tsx`
- **Login Endpoints:** `app/api/whop/auth/login/route.ts`, `app/api/whop/auth/callback/route.ts`
- **Environment Variables:** `.env.local`, `.env.example`
- **Previous Fixes:** `docs/integrations/OAUTH_FIX_CHANGELOG.md`

---

**Last Updated:** November 20, 2025
**Status:** ✅ Local environment fixed | ⚠️ Awaiting Whop Dashboard & Vercel configuration
