#!/bin/bash
# Set Whop environment variables in Vercel Production

# Extract values from .env.local
WHOP_API_KEY="0u_46cKC_VSlKurR5yvKTiPBY_vfEkmmxKpS5-ztfkQ"
WHOP_CLIENT_ID="app_eqT0GnpajX3KD9"
WHOP_CLIENT_SECRET="apik_ZjhuU1j150VpD_A2018039_b9122655a8b32209c7ed12fb3c59f3a78150485ee58508c4bc7acf0164cac954"
WHOP_TOKEN_ENCRYPTION_KEY="e77993f3f6352372eeda10ad2dec78256d811c89cdbc4aeffd234ede6983f4f6"
WHOP_WEBHOOK_SECRET="ws_f06a57521e31e9d0aedf5e2e4cb38498431026b26ff8fea9e16a23ae6d75273a"
WHOP_OAUTH_REDIRECT_URI="https://whop-chronos.vercel.app/api/whop/auth/callback"

echo "Setting WHOP environment variables in Vercel Production..."

# Remove existing vars first
vercel env rm WHOP_API_KEY production -y 2>/dev/null
vercel env rm WHOP_CLIENT_ID production -y 2>/dev/null
vercel env rm WHOP_CLIENT_SECRET production -y 2>/dev/null
vercel env rm WHOP_TOKEN_ENCRYPTION_KEY production -y 2>/dev/null
vercel env rm WHOP_WEBHOOK_SECRET production -y 2>/dev/null
vercel env rm WHOP_OAUTH_REDIRECT_URI production -y 2>/dev/null

# Add new values
echo "$WHOP_API_KEY" | vercel env add WHOP_API_KEY production
echo "$WHOP_CLIENT_ID" | vercel env add WHOP_CLIENT_ID production
echo "$WHOP_CLIENT_SECRET" | vercel env add WHOP_CLIENT_SECRET production
echo "$WHOP_TOKEN_ENCRYPTION_KEY" | vercel env add WHOP_TOKEN_ENCRYPTION_KEY production
echo "$WHOP_WEBHOOK_SECRET" | vercel env add WHOP_WEBHOOK_SECRET production
echo "$WHOP_OAUTH_REDIRECT_URI" | vercel env add WHOP_OAUTH_REDIRECT_URI production

echo "✅ Done! Environment variables set in Vercel Production."
echo "Now triggering a redeploy..."
