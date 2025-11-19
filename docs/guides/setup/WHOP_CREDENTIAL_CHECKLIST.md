# Whop Credential Gathering Checklist

**Target App:** OLD/Original App (Client ID: `app_eqT0GnpajX3KD9`)
**Date:** November 17, 2025

## Instructions

1. Go to https://dev.whop.com or https://whop.com/apps
2. Log in to your Whop account
3. Navigate to your company's apps
4. **SELECT THE OLD APP** (the one with Client ID starting with `app_eqT0GnpajX3KD9`)
5. Gather the following credentials:

---

## Credentials to Gather

### 1. App ID / Client ID
- **Location:** App Settings → General
- **Variable Name:** `WHOP_CLIENT_ID` and `NEXT_PUBLIC_WHOP_APP_ID`
- **Expected Value:** `app_eqT0GnpajX3KD9`
- **Actual Value:** _______________________________

### 2. Client Secret
- **Location:** App Settings → OAuth
- **Variable Name:** `WHOP_CLIENT_SECRET`
- **Expected Format:** Starts with `apik_` or similar
- **Actual Value:** _______________________________

### 3. API Key
- **Location:** App Settings → API Keys OR Company Settings → API Keys
- **Variable Name:** `WHOP_API_KEY`
- **Expected Format:** Long alphanumeric string
- **Actual Value:** _______________________________

### 4. Webhook Secret
- **Location:** App Settings → Webhooks
- **Variable Name:** `WHOP_WEBHOOK_SECRET`
- **Expected Format:** Starts with `ws_` or `whsec_`
- **Actual Value:** _______________________________

### 5. Company ID
- **Location:** Company Settings OR URL when viewing company page
- **Variable Name:** `NEXT_PUBLIC_WHOP_COMPANY_ID`
- **Expected Format:** Starts with `biz_`
- **Actual Value:** _______________________________

---

## OAuth Configuration Verification

While in the Whop dashboard for the OLD app:

### OAuth Redirect URI
- [ ] Navigate to: App Settings → OAuth → Redirect URIs
- [ ] Verify this URL is listed: `https://whop-chronos.vercel.app/api/whop/auth/callback`
- [ ] If not listed, ADD it now
- [ ] Also add (for local testing): `http://localhost:3007/api/whop/auth/callback`

### Webhook URL
- [ ] Navigate to: App Settings → Webhooks
- [ ] Verify this URL is listed: `https://whop-chronos.vercel.app/api/whop/webhook`
- [ ] If not listed, ADD it now
- [ ] Verify these events are enabled:
  - [ ] `membership.created`
  - [ ] `membership.went_valid`
  - [ ] `membership.went_invalid`
  - [ ] `membership.deleted`
  - [ ] `payment.succeeded`
  - [ ] `payment.failed`

### App Status
- [ ] Verify app is **Published** or **Active** (not Draft or Disabled)
- [ ] Verify app has appropriate permissions enabled

---

## Quick Reference - Where to Find Things

| What | Where in Whop Dashboard |
|------|------------------------|
| Client ID | App Settings → General |
| Client Secret | App Settings → OAuth |
| API Key | Company Settings → API Keys |
| Webhook Secret | App Settings → Webhooks |
| Company ID | URL bar or Company Settings |
| OAuth Redirect URIs | App Settings → OAuth → Redirect URIs |
| Webhook URL | App Settings → Webhooks → Endpoints |

---

## After Gathering Credentials

Once you have all credentials above:
1. Keep this window/tab open for reference
2. Come back to the terminal/Claude Code
3. We'll update `.env.local` with these values
4. Then update Vercel environment variables
5. Then test!

---

## Notes

- Make sure you're looking at the **OLD app** (app_eqT0GnpajX3KD9), NOT the new one
- Copy credentials exactly as shown (no extra spaces)
- Keep credentials secure - don't share publicly
- If any credential is missing, it may need to be generated in Whop dashboard

---

**Status:** ⏳ Waiting for credential collection
**Next Step:** Return to Claude Code with gathered credentials
