#!/bin/bash
# Set for BOTH production and preview

VALUES=(
  "WHOP_API_KEY=0u_46cKC_VSlKurR5yvKTiPBY_vfEkmmxKpS5-ztfkQ"
  "WHOP_CLIENT_ID=app_eqT0GnpajX3KD9"
  "WHOP_CLIENT_SECRET=apik_ZjhuU1j150VpD_A2018039_b9122655a8b32209c7ed12fb3c59f3a78150485ee58508c4bc7acf0164cac954"
  "WHOP_TOKEN_ENCRYPTION_KEY=e77993f3f6352372eeda10ad2dec78256d811c89cdbc4aeffd234ede6983f4f6"
  "WHOP_WEBHOOK_SECRET=ws_f06a57521e31e9d0aedf5e2e4cb38498431026b26ff8fea9e16a23ae6d75273a"
  "WHOP_OAUTH_REDIRECT_URI=https://whop-chronos.vercel.app/api/whop/auth/callback"
)

for ENV_VAR in "${VALUES[@]}"; do
  KEY="${ENV_VAR%%=*}"
  VALUE="${ENV_VAR#*=}"
  
  echo "Setting $KEY..."
  
  # Remove existing
  vercel env rm "$KEY" production preview development -y 2>/dev/null
  
  # Add for all environments
  echo "$VALUE" | vercel env add "$KEY" production
  echo "$VALUE" | vercel env add "$KEY" preview  
  echo "$VALUE" | vercel env add "$KEY" development
done

echo "✅ Done!"
