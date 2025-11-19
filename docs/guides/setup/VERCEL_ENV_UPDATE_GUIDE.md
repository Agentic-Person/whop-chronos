# Vercel Environment Variable Update Guide

**Project:** Chronos AI
**Goal:** Update Vercel to use ONLY OLD Whop app credentials
**Date:** November 17, 2025

---

## Quick Access

**Vercel Dashboard:** https://vercel.com/dashboard
**Direct Project Settings:** https://vercel.com/[your-username]/chronos/settings/environment-variables

---

## Method 1: Via Vercel Dashboard (Recommended)

### Step 1: Navigate to Environment Variables
1. Go to https://vercel.com/dashboard
2. Click on your **chronos** project
3. Click **Settings** in the top navigation
4. Click **Environment Variables** in the left sidebar

### Step 2: Update Each Variable

For EACH variable below, do this:
1. **Find the existing variable** in the list
2. Click the **⋯ (three dots)** menu on the right
3. Click **Edit**
4. **Replace the value** with the new value from OLD app
5. **Select environments:** ✅ Production, ✅ Preview, ✅ Development
6. Click **Save**

### Variables to Update

#### 1. WHOP_CLIENT_ID
- **Current (wrong):** `app_p2sU9MQCeFnT4o` (NEW app)
- **New (correct):** `app_eqT0GnpajX3KD9` (OLD app)
- **Environments:** Production, Preview, Development

#### 2. NEXT_PUBLIC_WHOP_APP_ID
- **Current (wrong):** `app_p2sU9MQCeFnT4o` (NEW app)
- **New (correct):** `app_eqT0GnpajX3KD9` (OLD app)
- **Environments:** Production, Preview, Development

#### 3. WHOP_CLIENT_SECRET
- **Current:** Mixed/wrong secret
- **New:** Get from OLD app in Whop dashboard
- **Environments:** Production, Preview, Development

#### 4. WHOP_API_KEY
- **Current:** Verify if from OLD or NEW app
- **New:** Get from OLD app in Whop dashboard (if different)
- **Environments:** Production, Preview, Development

#### 5. WHOP_WEBHOOK_SECRET
- **Current:** Verify if from OLD or NEW app
- **New:** Get from OLD app in Whop dashboard (if different)
- **Environments:** Production, Preview, Development

#### 6. NEXT_PUBLIC_WHOP_COMPANY_ID
- **Current:** `biz_5aH5YEHvkNgNS2`
- **Action:** Verify this is correct (should be same for both apps)
- **Environments:** Production, Preview, Development

---

## Method 2: Via Vercel CLI (Alternative)

### Prerequisites
```bash
# Install Vercel CLI globally
npm i -g vercel

# Login to Vercel
vercel login

# Link to your project (if not already linked)
cd /path/to/chronos
vercel link
```

### Remove Old Values
```bash
vercel env rm WHOP_CLIENT_ID production
vercel env rm WHOP_CLIENT_ID preview
vercel env rm WHOP_CLIENT_ID development

vercel env rm NEXT_PUBLIC_WHOP_APP_ID production
vercel env rm NEXT_PUBLIC_WHOP_APP_ID preview
vercel env rm NEXT_PUBLIC_WHOP_APP_ID development

vercel env rm WHOP_CLIENT_SECRET production
vercel env rm WHOP_CLIENT_SECRET preview
vercel env rm WHOP_CLIENT_SECRET development
```

### Add New Values
```bash
# WHOP_CLIENT_ID
echo "app_eqT0GnpajX3KD9" | vercel env add WHOP_CLIENT_ID production
echo "app_eqT0GnpajX3KD9" | vercel env add WHOP_CLIENT_ID preview
echo "app_eqT0GnpajX3KD9" | vercel env add WHOP_CLIENT_ID development

# NEXT_PUBLIC_WHOP_APP_ID
echo "app_eqT0GnpajX3KD9" | vercel env add NEXT_PUBLIC_WHOP_APP_ID production
echo "app_eqT0GnpajX3KD9" | vercel env add NEXT_PUBLIC_WHOP_APP_ID preview
echo "app_eqT0GnpajX3KD9" | vercel env add NEXT_PUBLIC_WHOP_APP_ID development

# WHOP_CLIENT_SECRET (replace YOUR_CLIENT_SECRET_HERE with actual value)
echo "YOUR_CLIENT_SECRET_HERE" | vercel env add WHOP_CLIENT_SECRET production
echo "YOUR_CLIENT_SECRET_HERE" | vercel env add WHOP_CLIENT_SECRET preview
echo "YOUR_CLIENT_SECRET_HERE" | vercel env add WHOP_CLIENT_SECRET development
```

---

## After Updating Variables

### Trigger Redeploy

**Option A: Via Dashboard**
1. Go to **Deployments** tab in Vercel
2. Click the **⋯** menu on the latest deployment
3. Click **Redeploy**
4. ✅ Check "Use existing Build Cache" for faster deployment
5. Click **Redeploy** button

**Option B: Via Git Push**
```bash
git commit --allow-empty -m "chore: trigger redeploy after Whop env var update"
git push origin main
```

**Option C: Via Vercel CLI**
```bash
vercel --prod
```

---

## Verification Checklist

After redeployment, verify these:

### 1. Check Build Logs
- [ ] Go to Vercel → Deployments → Latest deployment
- [ ] Click to view build logs
- [ ] Verify no errors about missing Whop credentials
- [ ] Verify build completed successfully

### 2. Test OAuth Flow
- [ ] Visit https://whop-chronos.vercel.app
- [ ] Click "Sign in with Whop" button
- [ ] Should redirect to Whop authorization page
- [ ] Click "Authorize" on Whop
- [ ] **Should redirect to `/dashboard`** (NOT back to `/`)
- [ ] Dashboard should load with your user data

### 3. Check for Errors
- [ ] Open browser DevTools (F12)
- [ ] Look at Console tab for errors
- [ ] Look at Network tab for failed requests
- [ ] Check Vercel → Your Project → Logs for runtime errors

---

## Troubleshooting

### "Invalid Client ID" Error
- Verify `WHOP_CLIENT_ID` matches `NEXT_PUBLIC_WHOP_APP_ID`
- Both should be `app_eqT0GnpajX3KD9`
- Check Vercel env vars were saved for all environments
- Redeploy after changing

### Redirects to `/` Instead of `/dashboard`
- Check Vercel logs for errors in `/api/whop/auth/callback`
- Verify `WHOP_CLIENT_SECRET` is correct for OLD app
- Check if cookies are being set (DevTools → Application → Cookies)

### "Webhook Signature Invalid"
- Update `WHOP_WEBHOOK_SECRET` with OLD app's webhook secret
- Verify webhook URL in Whop dashboard matches production URL

---

## Quick Reference

| Variable | OLD App Value | Environments |
|----------|---------------|-------------|
| `WHOP_CLIENT_ID` | `app_eqT0GnpajX3KD9` | All |
| `NEXT_PUBLIC_WHOP_APP_ID` | `app_eqT0GnpajX3KD9` | All |
| `WHOP_CLIENT_SECRET` | Get from Whop dashboard | All |
| `WHOP_API_KEY` | Get from Whop dashboard | All |
| `WHOP_WEBHOOK_SECRET` | Get from Whop dashboard | All |
| `NEXT_PUBLIC_WHOP_COMPANY_ID` | `biz_5aH5YEHvkNgNS2` | All |

---

**Status:** ⏳ Waiting for credential updates
**Next Step:** Redeploy and test OAuth flow
