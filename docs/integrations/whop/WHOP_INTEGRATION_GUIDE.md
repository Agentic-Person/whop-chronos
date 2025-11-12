# Whop Integration Guide

Complete guide for setting up and using Whop authentication, webhooks, and membership management in Chronos.

## Table of Contents

- [Quick Start](#quick-start)
- [Environment Setup](#environment-setup)
- [OAuth Flow](#oauth-flow)
- [Webhook Configuration](#webhook-configuration)
- [Membership Tiers](#membership-tiers)
- [API Routes](#api-routes)
- [Usage Examples](#usage-examples)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## Quick Start

### 1. Get Whop Credentials

1. Visit https://dev.whop.com
2. Create a new app or select existing
3. Note down:
   - API Key
   - App ID
   - Client ID
   - Client Secret
   - Webhook Secret

### 2. Configure Environment

```bash
# Copy example
cp .env.example .env.local

# Generate encryption key
openssl rand -hex 32

# Add to .env.local
WHOP_API_KEY=whop_xxx
NEXT_PUBLIC_WHOP_APP_ID=app_xxx
WHOP_CLIENT_ID=client_xxx
WHOP_CLIENT_SECRET=secret_xxx
WHOP_WEBHOOK_SECRET=webhook_xxx
WHOP_TOKEN_ENCRYPTION_KEY=your_64_char_hex_key
WHOP_OAUTH_REDIRECT_URI=http://localhost:3000/api/whop/auth/callback
```

### 3. Test Integration

```bash
# Run test suite
npx tsx lib/whop/test-integration.ts
```

## Environment Setup

### Required Variables

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `WHOP_API_KEY` | API key for Whop API | Whop Developer Dashboard → API Keys |
| `NEXT_PUBLIC_WHOP_APP_ID` | Your Whop app ID | Whop Developer Dashboard → App Settings |
| `WHOP_CLIENT_ID` | OAuth client ID | Whop Developer Dashboard → OAuth |
| `WHOP_CLIENT_SECRET` | OAuth client secret | Whop Developer Dashboard → OAuth |
| `WHOP_WEBHOOK_SECRET` | Webhook signing secret | Whop Developer Dashboard → Webhooks |
| `WHOP_TOKEN_ENCRYPTION_KEY` | 64-char hex key for encrypting session tokens | Generate with `openssl rand -hex 32` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `WHOP_OAUTH_REDIRECT_URI` | OAuth callback URL | `${NEXT_PUBLIC_APP_URL}/api/whop/auth/callback` |

## OAuth Flow

### How It Works

1. User clicks "Login with Whop"
2. Redirect to `GET /api/whop/auth/login?redirect=/dashboard`
3. Server redirects to Whop OAuth page
4. User authorizes app
5. Whop redirects to `GET /api/whop/auth/callback?code=xxx&state=xxx`
6. Server exchanges code for access token
7. Server creates encrypted session cookie
8. User redirected to original destination

### Implementation

#### Login Button

```tsx
// In your component
<a
  href="/api/whop/auth/login?redirect=/dashboard"
  className="btn btn-primary"
>
  Login with Whop
</a>
```

#### Logout Button

```tsx
// In your component
async function handleLogout() {
  await fetch('/api/whop/auth/logout', { method: 'POST' });
  window.location.href = '/';
}

<button onClick={handleLogout}>
  Logout
</button>
```

#### Get Current User

```typescript
// In server component or API route
import { getAuthUser } from '@/lib/whop';

const user = await getAuthUser();
if (user) {
  console.log(user.email, user.username);
}
```

#### Require Authentication

```typescript
// In API route
import { requireAuth } from '@/lib/whop';

export async function GET() {
  const session = await requireAuth(); // Throws if not authenticated
  return Response.json({ user: session.user });
}
```

## Webhook Configuration

### Setup in Whop Portal

1. Go to Whop Developer Dashboard → Webhooks
2. Add webhook endpoint: `https://yourdomain.com/api/whop/webhook`
3. Select events:
   - `membership.created`
   - `membership.went_valid`
   - `membership.went_invalid`
   - `membership.deleted`
   - `payment.succeeded`
   - `payment.failed`
4. Copy webhook secret to `.env.local`

### Custom Event Handlers

Register handlers in your app initialization (e.g., `app/layout.tsx` or API route):

```typescript
// lib/whop/handlers.ts
import { onWebhook } from '@/lib/whop';
import type { MembershipWebhookData, PaymentWebhookData } from '@/lib/whop';
import { db } from '@/lib/db';

// Handle new membership
onWebhook('membership.created', async (data: MembershipWebhookData) => {
  // Create student in database
  await db.students.create({
    data: {
      whop_user_id: data.user.id,
      whop_membership_id: data.membership.id,
      email: data.user.email,
      username: data.user.username,
      tier: mapTier(data.membership.product_id),
    },
  });

  // Send welcome email
  await sendEmail(data.user.email, 'welcome', {
    username: data.user.username,
  });

  console.log('New student onboarded:', data.user.email);
});

// Handle membership expiration
onWebhook('membership.went_invalid', async (data: MembershipWebhookData) => {
  // Revoke access
  await db.students.update({
    where: { whop_membership_id: data.membership.id },
    data: { is_active: false },
  });

  // Send expiration notice
  await sendEmail(data.user.email, 'membership_expired');

  console.log('Membership expired:', data.user.email);
});

// Handle successful payment
onWebhook('payment.succeeded', async (data: PaymentWebhookData) => {
  // Log for analytics
  await db.payments.create({
    data: {
      whop_payment_id: data.id,
      membership_id: data.membership_id,
      amount: data.amount,
      currency: data.currency,
      status: 'succeeded',
    },
  });

  console.log('Payment processed:', data.amount / 100, data.currency);
});

function mapTier(productId: string) {
  // Map your Whop product IDs to tiers
  const tierMap = {
    'prod_basic': 'basic',
    'prod_pro': 'pro',
    'prod_enterprise': 'enterprise',
  };
  return tierMap[productId] || 'free';
}
```

## Membership Tiers

### Tier Hierarchy

1. **Free** - Limited features, no payment
2. **Basic** - Entry-level paid plan
3. **Pro** - Advanced features
4. **Enterprise** - Unlimited access

### Tier Limits

Defined in `lib/whop/types.ts`:

```typescript
export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  free: {
    maxVideos: 5,
    maxStorageGB: 1,
    maxAICreditsPerMonth: 100,
    maxStudents: 10,
  },
  basic: {
    maxVideos: 50,
    maxStorageGB: 10,
    maxAICreditsPerMonth: 1000,
    maxStudents: 100,
  },
  pro: {
    maxVideos: 500,
    maxStorageGB: 100,
    maxAICreditsPerMonth: 10000,
    maxStudents: 1000,
  },
  enterprise: {
    maxVideos: -1, // unlimited
    maxStorageGB: -1,
    maxAICreditsPerMonth: -1,
    maxStudents: -1,
  },
};
```

### Mapping Products to Tiers

Update `lib/whop/auth.ts`:

```typescript
function mapMembershipToTier(membership: WhopMembership): SubscriptionTier {
  const productId = membership.product_id;

  // Replace with your actual Whop product IDs
  switch (productId) {
    case 'prod_abc123': // Basic plan product ID
      return 'basic';
    case 'prod_def456': // Pro plan product ID
      return 'pro';
    case 'prod_ghi789': // Enterprise plan product ID
      return 'enterprise';
    default:
      return 'free';
  }
}
```

### Enforcing Tier Limits

```typescript
import { requireTier } from '@/lib/whop';

export async function POST(request: Request) {
  // Require Pro tier or higher
  const validated = await requireTier('mem_xxx', 'pro');

  // User has required tier
  const { tier, user } = validated;

  return Response.json({
    message: `Welcome ${user.username}! You have ${tier} tier.`
  });
}
```

## API Routes

### Authentication Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/whop/auth/login` | GET | Initiate OAuth flow |
| `/api/whop/auth/callback` | GET | OAuth callback handler |
| `/api/whop/auth/logout` | POST/GET | Clear session |

### Webhook Route

| Route | Method | Description |
|-------|--------|-------------|
| `/api/whop/webhook` | POST | Receive webhook events |

### Protected Routes

All routes under `/dashboard/*` are automatically protected by Next.js middleware.

To protect additional routes, update `middleware.ts`:

```typescript
const PROTECTED_ROUTES = [
  '/dashboard',
  '/api/videos',
  '/api/courses',
  '/api/chat',
  '/creator', // Add your route
];
```

## Usage Examples

### Validate Membership in API Route

```typescript
// app/api/videos/upload/route.ts
import { requireMembership } from '@/lib/whop';
import { TIER_LIMITS } from '@/lib/whop/types';

export async function POST(request: Request) {
  const { membershipId } = await request.json();

  // Validate membership
  const validated = await requireMembership(membershipId);
  const limits = TIER_LIMITS[validated.tier];

  // Check if user can upload more videos
  const currentVideos = await db.videos.count({
    where: { creator_id: validated.user.id },
  });

  if (limits.maxVideos !== -1 && currentVideos >= limits.maxVideos) {
    return Response.json(
      { error: `Video limit reached. Upgrade to upload more.` },
      { status: 403 }
    );
  }

  // Proceed with upload
  return Response.json({ success: true });
}
```

### Display User Info in Component

```tsx
// app/dashboard/page.tsx
import { requireAuthUser } from '@/lib/whop';

export default async function DashboardPage() {
  const user = await requireAuthUser();

  return (
    <div>
      <h1>Welcome, {user.username || user.email}!</h1>
      {user.profile_pic_url && (
        <img src={user.profile_pic_url} alt="Profile" />
      )}
    </div>
  );
}
```

### Check Feature Access

```typescript
import { validateUserMembership } from '@/lib/whop';
import { TIER_LIMITS } from '@/lib/whop/types';

export async function checkFeatureAccess(
  membershipId: string,
  feature: keyof TierLimits['features']
) {
  const validated = await validateUserMembership(membershipId);
  const limits = TIER_LIMITS[validated.tier];

  return limits.features[feature];
}

// Usage
const canBulkUpload = await checkFeatureAccess('mem_xxx', 'bulkUpload');
```

## Testing

### Test Environment Setup

```bash
# Set development environment
NODE_ENV=development

# Run integration tests
npx tsx lib/whop/test-integration.ts
```

### Test OAuth Flow

```bash
npm run dev
# Visit http://localhost:3000/api/whop/auth/login
```

### Test Webhooks Locally

Use Whop CLI or create manual test:

```typescript
// test-webhook.ts
import { webhooks } from '@/lib/whop';

const payload = {
  action: 'membership.created',
  data: {
    user: { id: 'user_test', email: 'test@example.com' },
    membership: { id: 'mem_test', status: 'active', valid: true },
    product: { id: 'prod_test', name: 'Test Product' },
  },
  timestamp: Date.now(),
};

const payloadString = JSON.stringify(payload);
const signature = webhooks.test.generateSignature(payloadString);

// Send to webhook endpoint
await fetch('http://localhost:3000/api/whop/webhook', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-whop-signature': signature,
  },
  body: payloadString,
});
```

## Troubleshooting

### Invalid Webhook Signature

**Symptoms:** Webhook endpoint returns 401 Unauthorized

**Solutions:**
- Verify `WHOP_WEBHOOK_SECRET` matches Whop portal
- Check webhook is from Whop (not a test/replay)
- Ensure timestamp is recent (within 5 minutes)
- Confirm raw body is used for signature verification

### Authentication Required Error

**Symptoms:** Redirected to login unexpectedly

**Solutions:**
- Check `whop_session` cookie exists
- Verify `WHOP_TOKEN_ENCRYPTION_KEY` is 64 hex characters
- Clear cookies and login again
- Check token hasn't expired (30 day max)

### Membership Validation Fails

**Symptoms:** "Invalid or expired membership" error

**Solutions:**
- Verify membership is active in Whop dashboard
- Check membership hasn't been cancelled
- Validate product ID mapping in `mapMembershipToTier()`
- Ensure API key has correct permissions

### OAuth Callback Error

**Symptoms:** Error on `/api/whop/auth/callback`

**Solutions:**
- Verify `WHOP_OAUTH_REDIRECT_URI` matches Whop portal
- Check OAuth credentials are correct
- Ensure redirect URI is whitelisted in Whop app settings
- Verify state parameter is valid base64

## Security Best Practices

1. **Never expose secrets**
   - Keep `.env.local` out of git
   - Use environment variables only
   - Don't log tokens/secrets

2. **Validate all webhooks**
   - Always verify webhook signatures
   - Check timestamp freshness
   - Use timing-safe comparison

3. **Protect sessions**
   - Use httpOnly cookies
   - Enable secure flag in production
   - Implement CSRF protection
   - Set appropriate cookie lifetime

4. **Rate limiting**
   - Implement rate limits on auth endpoints
   - Throttle webhook processing
   - Add DDoS protection

## Next Steps

1. ✅ Complete environment setup
2. ✅ Test OAuth flow
3. ✅ Configure webhooks
4. Map your Whop products to tiers
5. Implement webhook handlers for your database
6. Add billing/upgrade UI
7. Set up usage tracking
8. Deploy to production
9. Configure production webhooks
10. Monitor error logs

## Resources

- [Whop Developer Docs](https://docs.whop.com)
- [Whop OAuth Guide](https://docs.whop.com/oauth)
- [Whop Webhook Guide](https://docs.whop.com/webhooks)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
