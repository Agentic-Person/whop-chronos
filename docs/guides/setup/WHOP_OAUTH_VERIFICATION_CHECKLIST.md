# Whop OAuth Configuration Verification Checklist

**Created:** November 17, 2025
**Purpose:** Verify Whop app OAuth settings match our environment variables

---

## CRITICAL: What You Need to Check in Whop Dashboard

### Access Your Whop App Settings

1. Go to https://whop.com/apps OR https://dev.whop.com
2. Log in to your account
3. Navigate to **Your Apps** or **Developer Portal**
4. Find your app: `app_p2sU9MQCeFnT4o`

---

## Checklist Item #1: Verify App ID / Client ID

**Location:** App Settings → General → App ID

**What it should be:**
```
app_p2sU9MQCeFnT4o
```

**Questions to answer:**
- [ ] Does the App ID shown in Whop dashboard match `app_p2sU9MQCeFnT4o`?
- [ ] Is this the ACTIVE/PUBLISHED app (not draft)?
- [ ] Is the app status "Active" or "Published"?

**If different:**
- Write down the ACTUAL App ID: _______________________________

---

## Checklist Item #2: Verify OAuth Redirect URIs

**Location:** App Settings → OAuth → Redirect URIs

**What MUST be listed:**
```
https://whop-chronos.vercel.app/api/whop/auth/callback
```

**Also add for local testing:**
```
http://localhost:3007/api/whop/auth/callback
http://localhost:3000/api/whop/auth/callback
```

**Critical Questions:**
- [ ] Is `https://whop-chronos.vercel.app/api/whop/auth/callback` in the list?
- [ ] Are there ANY typos in the registered URL?
- [ ] Is the URL EXACTLY as shown (case-sensitive, no trailing slash)?

**If NOT listed:**
1. Click "Add Redirect URI"
2. Paste EXACTLY: `https://whop-chronos.vercel.app/api/whop/auth/callback`
3. Click Save
4. Also add the localhost URLs for testing

**Current registered URIs (write them down):**
1. _______________________________
2. _______________________________
3. _______________________________

---

## Checklist Item #3: Verify Client Secret

**Location:** App Settings → OAuth → Client Secret

**What to check:**
- [ ] Does the Client Secret exist?
- [ ] Can you regenerate it if needed?

**Action:**
1. **Copy the EXACT Client Secret** shown in Whop dashboard
2. Write it here: _______________________________
3. Compare with your `.env.local` file
4. If different, we need to update our environment variables

---

## Checklist Item #4: Verify OAuth Settings

**Location:** App Settings → OAuth

**Grant types enabled:**
- [ ] Authorization Code (REQUIRED for our flow)
- [ ] Refresh Token (REQUIRED for session management)

**Scopes:**
- Write down all enabled scopes: _______________________________

---

## Checklist Item #5: API Key

**Location:** Company Settings → API Keys OR App Settings → API Keys

**What to check:**
- [ ] API Key exists and is active
- [ ] Copy the EXACT API Key value

**API Key:** _______________________________

---

## Checklist Item #6: Webhook Configuration

**Location:** App Settings → Webhooks

**Webhook URL should be:**
```
https://whop-chronos.vercel.app/api/whop/webhook
```

**Webhook Secret:**
- Copy the exact secret: _______________________________

---

## Comparison Table

Once you've gathered the above info, fill this out:

| Variable | Whop Dashboard Value | .env.local Value | Vercel Value | Match? |
|----------|---------------------|------------------|--------------|--------|
| App ID | ________________ | app_p2sU9MQCeFnT4o | ? | ? |
| Client ID | ________________ | app_p2sU9MQCeFnT4o | ? | ? |
| Client Secret | ________________ | apik_xV1Qnl... | ? | ? |
| API Key | ________________ | apik_xV1Qnl... | ? | ? |
| Redirect URI | ________________ | https://whop-chronos.vercel.app/api/whop/auth/callback | ? | ? |

---

## Common Issues & Solutions

### Issue: "Invalid redirect_uri"
**Cause:** The redirect URI we're sending doesn't match what's registered in Whop

**Solution:**
1. Go to Whop Dashboard → Your App → OAuth → Redirect URIs
2. Add EXACTLY: `https://whop-chronos.vercel.app/api/whop/auth/callback`
3. Make sure there are NO typos, NO trailing slashes
4. Save changes
5. Wait 1-2 minutes for Whop to propagate the change

### Issue: "Invalid client_id"
**Cause:** The client ID doesn't match the app

**Solution:**
1. Verify App ID in Whop dashboard
2. Make sure BOTH `WHOP_CLIENT_ID` and `NEXT_PUBLIC_WHOP_APP_ID` use the SAME value
3. Update environment variables to match Whop dashboard

### Issue: App shows as "Draft" or "Inactive"
**Cause:** App not published

**Solution:**
1. In Whop dashboard, find your app
2. Click "Publish" or "Activate"
3. Confirm the app is live

---

## After Verification

Once you've completed this checklist:

1. **Take a screenshot** of the Whop OAuth settings page (for reference)
2. **Come back to Claude Code** with the information
3. We'll update environment variables to match EXACTLY what Whop expects
4. Deploy and test

---

## Emergency: If Nothing Above Works

If redirect URIs are correctly set but still failing:

**Option 1: Try the preview deployment URL**
The error might be because we're hitting a specific deployment URL instead of the main domain.

Register BOTH:
- `https://whop-chronos.vercel.app/api/whop/auth/callback` (main)
- `https://whop-chronos-*.vercel.app/api/whop/auth/callback` (wildcard - if Whop supports it)

**Option 2: Check deployment domain**
Look at your Vercel deployment logs to see which exact domain is being used when OAuth fails.

**Option 3: Test with localhost**
1. Add `http://localhost:3007/api/whop/auth/callback` to Whop redirect URIs
2. Test locally with `npm run dev`
3. If it works locally but not on Vercel, it's a deployment URL mismatch

---

**Status:** ⏳ Waiting for manual verification in Whop dashboard
**Next Step:** Return with findings and we'll fix environment variables
