#!/bin/bash

# Clean Vercel Environment Variables Script
# This script deletes ALL environment variables from Vercel
# Use with caution - this is the nuclear option!

echo "🔥 Starting nuclear cleanup of Vercel environment variables..."
echo ""

# List of all variables to delete (from vercel env ls output)
VARS=(
  "WHOP_OAUTH_REDIRECT_URI"
  "WHOP_WEBHOOK_SECRET"
  "WHOP_TOKEN_ENCRYPTION_KEY"
  "WHOP_CLIENT_SECRET"
  "WHOP_CLIENT_ID"
  "WHOP_API_KEY"
  "KV_REST_API_URL"
  "KV_REST_API_TOKEN"
  "KV_REST_API_READ_ONLY_TOKEN"
  "INNGEST_EVENT_KEY"
  "INNGEST_SIGNING_KEY"
  "RESEND_API_KEY"
  "RESEND_FROM_EMAIL"
  "NODE_ENV"
  "LOG_LEVEL"
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  "SUPABASE_SERVICE_ROLE_KEY"
  "SUPABASE_PROJECT_ID"
  "SUPABASE_ACCESS_TOKEN"
  "SUPABASE_PASSWORD"
  "VERCEL_TOKEN"
  "ANTHROPIC_API_KEY"
  "ANTHROPIC_MODEL"
  "OPENAI_API_KEY"
  "YOUTUBE_API_KEY"
  "DISCORD_BOT_TOKEN"
  "DISCORD_CLIENT_ID"
  "DISCORD_CLIENT_SECRET"
  "DISCORD_GUILD_ID"
  "ENABLE_DISCORD_BOT"
  "SENTRY_DSN"
  "SENTRY_AUTH_TOKEN"
  "SENTRY_ORG"
  "SENTRY_PROJECT"
  "NEXT_PUBLIC_POSTHOG_KEY"
  "KV_URL"
  "NEXT_PUBLIC_WHOP_APP_ID"
  "NEXT_PUBLIC_WHOP_AGENT_USER_ID"
  "NEXT_PUBLIC_WHOP_COMPANY_ID"
  "NEXT_PUBLIC_APP_URL"
  "NEXT_PUBLIC_WHOP_BASIC_CHECKOUT_URL"
  "NEXT_PUBLIC_WHOP_PRO_CHECKOUT_URL"
  "NEXT_PUBLIC_WHOP_ENTERPRISE_CHECKOUT_URL"
  "NEXT_PUBLIC_SUPABASE_URL"
)

ENVIRONMENTS=("production" "preview" "development")

echo "Variables to delete: ${#VARS[@]}"
echo "Environments: ${ENVIRONMENTS[@]}"
echo ""

TOTAL_OPS=$((${#VARS[@]} * ${#ENVIRONMENTS[@]}))
CURRENT=0

for VAR in "${VARS[@]}"; do
  for ENV in "${ENVIRONMENTS[@]}"; do
    CURRENT=$((CURRENT + 1))
    echo "[$CURRENT/$TOTAL_OPS] Removing $VAR from $ENV..."

    # Remove with --yes flag to skip confirmation
    vercel env rm "$VAR" "$ENV" --yes 2>&1 | grep -v "^Vercel CLI" || true
  done
done

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "Next step: Import fresh variables from .env.update"
