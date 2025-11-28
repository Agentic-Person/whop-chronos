# Whop Product → Tier Mapping Configuration

This guide explains how to configure the mapping between Whop product IDs and subscription tiers in Chronos.

## Overview

Chronos supports three subscription tiers: **basic**, **pro**, and **enterprise** (plus **free** for users without memberships).

When a user authenticates via Whop, the system needs to map their Whop product to the correct subscription tier to enforce usage limits and feature access.

## Configuration Methods

### Method 1: Environment Variable (Recommended for Production)

Set the `WHOP_TIER_MAPPING` environment variable with a JSON object:

```bash
WHOP_TIER_MAPPING='{"prod_abc123":"basic","prod_xyz789":"pro","prod_def456":"enterprise"}'
```

**Advantages:**
- Easy to update without code changes
- Different mappings for dev/staging/production
- Keeps product IDs out of version control
- Works with Vercel environment variables

**Example in `.env.local`:**
```bash
WHOP_TIER_MAPPING='{"prod_F8x9Kp2Lm":"basic","prod_R4t7Wn5Sq":"pro","prod_Z1v3Bc8Jh":"enterprise"}'
```

### Method 2: Code Configuration (Default Fallback)

Update the `DEFAULT_PRODUCT_TIER_MAP` in the source code:

**Location:** `lib/whop/auth.ts` (lines 299-316) and `lib/whop/native-auth.ts` (lines 393-410)

```typescript
const DEFAULT_PRODUCT_TIER_MAP: Record<string, SubscriptionTier> = {
  // Basic tier products
  'prod_F8x9Kp2Lm': 'basic',
  'prod_starter_123': 'basic',

  // Pro tier products
  'prod_R4t7Wn5Sq': 'pro',
  'prod_professional_456': 'pro',

  // Enterprise tier products
  'prod_Z1v3Bc8Jh': 'enterprise',
  'prod_business_789': 'enterprise',
};
```

**Advantages:**
- Version controlled
- Type-safe (TypeScript validation)
- Clear for team members

**Disadvantages:**
- Requires code changes to update
- Same mapping for all environments

## Finding Your Whop Product IDs

### Step 1: Access Whop Dashboard
1. Go to https://dash.whop.com/products
2. Log in with your Whop account

### Step 2: Identify Each Product
Click on each product you want to map to a tier.

### Step 3: Copy the Product ID
The product ID is in the URL:
```
https://dash.whop.com/products/prod_F8x9Kp2Lm
                                 ^^^^^^^^^^^^^^
                                 This is the product ID
```

All Whop product IDs start with `prod_`.

### Step 4: Map to Tiers
Determine which tier each product should map to:

| Product Name | Product ID | Tier |
|-------------|-----------|------|
| Chronos Basic | `prod_F8x9Kp2Lm` | `basic` |
| Chronos Pro | `prod_R4t7Wn5Sq` | `pro` |
| Chronos Enterprise | `prod_Z1v3Bc8Jh` | `enterprise` |

## Tier Capabilities

Each tier has different limits defined in `lib/whop/types.ts` (lines 151-220):

### Free Tier (Default Fallback - NOT RECOMMENDED)
- 5 videos
- 1GB storage
- 100 AI credits/month
- 10 students
- Basic features only

### Basic Tier (Safe Fallback)
- 50 videos
- 10GB storage
- 1,000 AI credits/month
- 100 students
- Video upload, AI chat, analytics, course builder

### Pro Tier
- 500 videos
- 100GB storage
- 10,000 AI credits/month
- 1,000 students
- All basic features + bulk upload, custom branding, API access

### Enterprise Tier
- Unlimited videos
- Unlimited storage
- Unlimited AI credits
- Unlimited students
- All features + priority support

## Implementation Details

### How the Mapping Works

#### For OAuth Authentication (Deprecated)
Located in `lib/whop/auth.ts`:

```typescript
function mapMembershipToTier(membership: WhopMembership): SubscriptionTier {
  const productId = membership.product_id;
  const tierMap = getProductTierMap();
  const tier = tierMap[productId];

  if (tier) {
    return tier;
  }

  // Unknown product → fallback to 'basic'
  console.warn(`Unknown product ID: ${productId}, falling back to basic tier`);
  return 'basic';
}
```

#### For Native Authentication (Recommended)
Located in `lib/whop/native-auth.ts`:

```typescript
export function mapProductToTier(productId: string): SubscriptionTier {
  const tierMap = getProductTierMap();
  const tier = tierMap[productId];

  if (tier) {
    return tier;
  }

  // Unknown product → fallback to 'basic'
  console.warn(`Unknown product ID: ${productId}, falling back to basic tier`);
  return 'basic';
}

export async function getUserTier(userId: string): Promise<SubscriptionTier> {
  // Fetches user's memberships and returns the highest tier
  const memberships = await whopsdk.memberships.list({ user_id: userId, valid: true });

  // If user has multiple memberships, returns the highest tier
  // Example: If user has both 'basic' and 'pro', returns 'pro'
}
```

### Fallback Behavior

**If product ID is not found in mapping:**
- System logs a warning with the unknown product ID
- User is assigned **'basic'** tier (safer than 'free')
- Feature access is granted based on basic tier limits

**Why 'basic' instead of 'free'?**
- Better user experience (more features unlocked)
- Prevents legitimate users from being locked out
- Easier to debug (logs show which products need mapping)
- Safer for business (better to over-provision than under-provision)

## Testing the Mapping

### Development Mode (DEV_BYPASS_AUTH=true)
In development, authentication is bypassed and test products are used:

```typescript
// Test mode products (already in DEFAULT_PRODUCT_TIER_MAP)
'prod_test_basic': 'basic',
'prod_test_pro': 'pro',
'prod_test_enterprise': 'enterprise',
```

### Verify Mapping in Logs

When a user authenticates, check the logs:

```bash
# Successful mapping
[Tier Mapping] Product prod_R4t7Wn5Sq → pro tier

# Unknown product (triggers fallback)
[Tier Mapping] Unknown product ID: prod_unknown_123.
Falling back to 'basic' tier.
Update PRODUCT_TIER_MAP in lib/whop/auth.ts or set WHOP_TIER_MAPPING env var.
```

### Check User's Tier in Code

```typescript
// Using native-auth (recommended for embedded apps)
import { getUserTier } from '@/lib/whop/native-auth';

const tier = await getUserTier(userId);
console.log(`User tier: ${tier}`); // 'basic' | 'pro' | 'enterprise'

// Using OAuth auth (deprecated)
import { validateUserMembership } from '@/lib/whop';

const validated = await validateUserMembership(membershipId);
console.log(`User tier: ${validated.tier}`);
```

## Troubleshooting

### Problem: Users getting wrong tier

**Solution:**
1. Check the logs for the product ID being used
2. Verify the product ID exists in your mapping
3. Ensure `WHOP_TIER_MAPPING` env var is valid JSON
4. Restart the app after updating env vars

### Problem: "Unknown product ID" warnings in logs

**Solution:**
1. Copy the product ID from the warning log
2. Add it to your mapping:
   - Environment: Update `WHOP_TIER_MAPPING`
   - Code: Update `DEFAULT_PRODUCT_TIER_MAP`

### Problem: Environment variable not working

**Solution:**
1. Check the JSON format is valid (use a JSON validator)
2. Ensure the variable is set in the correct environment:
   - Local: `.env.local`
   - Vercel: Project Settings → Environment Variables
3. Restart the dev server or redeploy

### Problem: Multiple memberships for one user

**Solution:**
The system automatically returns the **highest tier**. This is handled by `getUserTier()` in native-auth.ts.

Example:
- User has membership to `prod_basic` (basic tier)
- User also has membership to `prod_pro` (pro tier)
- System returns: **'pro'** (highest tier)

## Production Deployment Checklist

- [ ] Find all Whop product IDs from https://dash.whop.com/products
- [ ] Create tier mapping (Method 1 or 2)
- [ ] Set `WHOP_TIER_MAPPING` in Vercel environment variables (if using Method 1)
- [ ] Deploy to staging and test authentication
- [ ] Verify tier assignment in logs
- [ ] Test feature access for each tier
- [ ] Deploy to production

## Example Configurations

### Minimal Setup (3 Products)
```bash
WHOP_TIER_MAPPING='{"prod_basic":"basic","prod_pro":"pro","prod_enterprise":"enterprise"}'
```

### Multiple Products per Tier
```bash
WHOP_TIER_MAPPING='{
  "prod_starter_monthly":"basic",
  "prod_starter_yearly":"basic",
  "prod_pro_monthly":"pro",
  "prod_pro_yearly":"pro",
  "prod_business":"enterprise",
  "prod_enterprise":"enterprise"
}'
```

### Legacy + New Products
```bash
WHOP_TIER_MAPPING='{
  "prod_old_plan_v1":"basic",
  "prod_old_plan_v2":"pro",
  "prod_new_basic_2024":"basic",
  "prod_new_pro_2024":"pro",
  "prod_enterprise_2024":"enterprise"
}'
```

## Related Files

- **Auth implementation:** `lib/whop/auth.ts` (lines 285-379)
- **Native auth implementation:** `lib/whop/native-auth.ts` (lines 375-537)
- **Type definitions:** `lib/whop/types.ts` (lines 131-220)
- **Environment example:** `.env.example` (lines 12-23)

## Questions?

- **Where are tiers used?** Analytics, usage quotas, feature access, storage limits
- **Can I add a 'free' tier?** Yes, but 'basic' is the recommended minimum
- **Can I have custom tier names?** No, must be: 'free' | 'basic' | 'pro' | 'enterprise'
- **How often is tier checked?** Every time user authenticates or accesses protected resources
- **What if Whop changes product IDs?** Update the mapping (no code changes if using env var)

---

**Last Updated:** November 28, 2025
**Maintained By:** Chronos Development Team
