#!/bin/bash

# Whop OAuth Fix Deployment Script
# This script helps deploy the OAuth endpoint fix to production

echo "============================================"
echo "Whop OAuth Fix - Deployment Script"
echo "============================================"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Verify local changes
echo -e "${BLUE}Step 1: Verifying local changes...${NC}"
echo ""

if git diff --name-only | grep -q "lib/whop/api-client.ts"; then
  echo -e "${GREEN}✓${NC} Changes detected in lib/whop/api-client.ts"
else
  echo -e "${RED}✗${NC} No changes detected in lib/whop/api-client.ts"
  echo "Please ensure the OAuth endpoint fixes have been applied."
  exit 1
fi

# Step 2: Run verification script
echo ""
echo -e "${BLUE}Step 2: Running OAuth configuration verification...${NC}"
echo ""

if npx tsx scripts/verify-oauth-config.ts; then
  echo -e "${GREEN}✓${NC} Local OAuth configuration is valid"
else
  echo -e "${YELLOW}⚠${NC}  Some configuration warnings detected (this is OK for local dev)"
fi

# Step 3: Show changes
echo ""
echo -e "${BLUE}Step 3: Changes to be committed:${NC}"
echo ""
git diff lib/whop/api-client.ts | grep -A 2 -B 2 "oauth/token"

# Step 4: Confirm deployment
echo ""
echo -e "${YELLOW}============================================${NC}"
echo -e "${YELLOW}READY TO DEPLOY${NC}"
echo -e "${YELLOW}============================================${NC}"
echo ""
echo "This will:"
echo "  1. Commit the OAuth endpoint fixes"
echo "  2. Push to GitHub (triggers Vercel deployment)"
echo ""
echo -e "${YELLOW}BEFORE PROCEEDING:${NC}"
echo "  ☐ Have you updated Whop Dashboard redirect URIs?"
echo "  ☐ Have you verified Vercel environment variables?"
echo "  ☐ See: docs/deployment/WHOP_OAUTH_DEPLOYMENT_GUIDE.md"
echo ""
read -p "Continue with deployment? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo ""
  echo -e "${RED}Deployment cancelled.${NC}"
  echo ""
  echo "Next steps:"
  echo "  1. Review: docs/deployment/WHOP_OAUTH_DEPLOYMENT_GUIDE.md"
  echo "  2. Update Whop Dashboard settings"
  echo "  3. Update Vercel environment variables"
  echo "  4. Run this script again"
  exit 0
fi

# Step 5: Commit changes
echo ""
echo -e "${BLUE}Step 5: Committing changes...${NC}"
echo ""

git add lib/whop/api-client.ts

git commit -m "fix(auth): correct Whop OAuth token endpoint URLs

Changed from https://data.whop.com/api/v3/oauth/token
to https://data.whop.com/oauth/token

Fixes 'Client authentication failed' error during OAuth flow.

Affected functions:
- exchangeCodeForToken (line 231)
- refreshAccessToken (line 272)

Related files:
- docs/deployment/WHOP_OAUTH_DEPLOYMENT_GUIDE.md (deployment guide)
- docs/guides/setup/WHOP_OAUTH_FIX_GUIDE.md (setup guide)

Assisted by Jimmy Solutions Developer at Agentic Personnel LLC <Jimmy@AgenticPersonnel.com>"

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓${NC} Changes committed successfully"
else
  echo -e "${RED}✗${NC} Commit failed"
  exit 1
fi

# Step 6: Push to remote
echo ""
echo -e "${BLUE}Step 6: Pushing to GitHub...${NC}"
echo ""

current_branch=$(git branch --show-current)
echo "Pushing to branch: $current_branch"
echo ""

git push origin "$current_branch"

if [ $? -eq 0 ]; then
  echo ""
  echo -e "${GREEN}✓${NC} Successfully pushed to GitHub"
else
  echo ""
  echo -e "${RED}✗${NC} Push failed"
  exit 1
fi

# Step 7: Success message
echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}DEPLOYMENT INITIATED${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo "Next steps:"
echo ""
echo "  1. Monitor Vercel deployment:"
echo "     https://vercel.com/dashboard"
echo ""
echo "  2. Wait for deployment to complete (2-3 minutes)"
echo ""
echo "  3. Test OAuth flow:"
echo "     a. Visit: https://www.chronos-ai.app"
echo "     b. Click 'Sign in with Whop'"
echo "     c. Authorize the app"
echo "     d. Verify successful login"
echo ""
echo "  4. If OAuth still fails:"
echo "     - Check Vercel logs for errors"
echo "     - Verify Whop Dashboard redirect URI is registered"
echo "     - Verify Vercel environment variables are correct"
echo "     - See: docs/deployment/WHOP_OAUTH_DEPLOYMENT_GUIDE.md"
echo ""
echo -e "${BLUE}Deployment guide: ${NC}docs/deployment/WHOP_OAUTH_DEPLOYMENT_GUIDE.md"
echo ""
