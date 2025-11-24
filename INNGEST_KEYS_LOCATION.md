# How to Get Your Inngest Production Keys

**Current Error:** "Signature verification failed. Is your app using the correct signing key?"

**Why:** Your app is deployed with placeholder keys (`sig_xxxxx`), not real production keys.

---

## Step 1: Find Your Inngest Keys

Your keys are located in the Inngest dashboard. Look for one of these locations:

### Option A: Settings → Keys
1. In the left sidebar, look for **⚙️ Settings** or **🔑 Keys**
2. Click on it
3. You should see:
   ```
   INNGEST_EVENT_KEY=evt_xxxxxxxxxxxxxxxxxxxxxxx
   INNGEST_SIGNING_KEY=signkey_prod_xxxxxxxxxxxx
   ```

### Option B: Getting Started Guide
1. Look at the right sidebar where it says "EXPLORE ONBOARDING GUIDE"
2. Click on **"Deploy your Inngest app"** or similar
3. The guide should show you the keys

### Option C: Environment Tab
1. Look for a tab called **Environment** or **Environment Variables**
2. Your keys should be listed there

### Option D: Return to Previous Step
1. Click **Back** or find a way to go to the previous step
2. The previous step (Step 2 of 4) likely showed you the keys

---

## Step 2: What the Keys Look Like

You're looking for TWO environment variables:

```bash
# Event Key (for sending events TO Inngest)
INNGEST_EVENT_KEY=evt_01234567890abcdefghijklmnopqrstuvwxyz

# Signing Key (for verifying webhooks FROM Inngest)
INNGEST_SIGNING_KEY=signkey_prod_01234567890abcdefghijklmnopqrstuvwxyz
```

**IMPORTANT:** Don't click "Sync app here" until you've added these to Vercel!

---

## Step 3: Add Keys to Vercel

Once you have the real keys:

1. Go to https://vercel.com/dashboard
2. Select your **Chronos** project
3. Go to **Settings** → **Environment Variables**
4. Find the existing `INNGEST_EVENT_KEY` and click **Edit**
   - Replace `evt_xxxxx` with the real value
   - Save
5. Find the existing `INNGEST_SIGNING_KEY` and click **Edit**
   - Replace `sig_xxxxx` with the real value
   - Save

---

## Step 4: Redeploy to Vercel

The environment variables won't take effect until you redeploy:

**Option A: Redeploy via Vercel Dashboard**
1. Go to Vercel Dashboard → Deployments
2. Find the latest deployment
3. Click **•••** (three dots)
4. Click **Redeploy**
5. Wait for deployment to complete (2-3 minutes)

**Option B: Push to Git**
```bash
# Make a small change to trigger redeployment
git commit --allow-empty -m "chore: redeploy with Inngest keys"
git push origin main
```

---

## Step 5: Return to Inngest Sync Screen

After the deployment completes:

1. Return to this Inngest sync screen you're on now
2. The URL should still be: `https://www.chronos-ai.app/api/inngest`
3. Click **"Sync app here"** (green button)
4. This time it should succeed! ✅

---

## Expected Success Message

After clicking "Sync app here" with the correct keys, you should see:

```
✅ 6 functions discovered
   - video/transcribe.youtube
   - video/extract-transcript
   - video/chunk-transcript
   - video/generate-embeddings
   - video/process-upload
   - video/recovery
```

---

## If You Can't Find the Keys

If you can't find the keys in the Inngest dashboard:

### Try This:
1. Look for a **"Create new signing key"** or **"Generate keys"** button
2. Or navigate back to an earlier step in the getting started flow
3. Or check the Inngest documentation for your specific plan

### Alternative - Use Vercel Integration
1. In the Inngest dashboard, click **"Sync with Vercel"** instead of "Sync manually"
2. This will automatically configure the keys in Vercel
3. You'll need to authorize the Vercel integration

---

## Current Status

❌ **What's wrong:**
- Your app has placeholder keys: `evt_xxxxx` and `sig_xxxxx`
- Inngest can reach your endpoint but signature verification fails
- Keys don't match

✅ **What to do:**
1. Find your real keys in Inngest dashboard (see Option A-D above)
2. Add them to Vercel environment variables
3. Redeploy
4. Click "Sync app here"

---

**Next Action:** Look for Settings → Keys in the Inngest left sidebar to find your production keys.

---

Last Updated: November 20, 2025
