# Whop Integration

Complete Whop OAuth and webhook integration for Chronos.

## Features

- OAuth 2.0 authentication flow
- Secure session management with encrypted cookies
- Webhook signature verification
- Membership validation and tier mapping
- Type-safe API client
- Next.js middleware for route protection

## Setup

### 1. Environment Variables

Add to `.env.local`:

```bash
# Whop API Configuration
WHOP_API_KEY=your_api_key
NEXT_PUBLIC_WHOP_APP_ID=your_app_id
WHOP_CLIENT_ID=your_client_id
WHOP_CLIENT_SECRET=your_client_secret
WHOP_WEBHOOK_SECRET=your_webhook_secret

# Token Encryption (generate with: openssl rand -hex 32)
WHOP_TOKEN_ENCRYPTION_KEY=your_64_char_hex_key

# OAuth Redirect
WHOP_OAUTH_REDIRECT_URI=http://localhost:3000/api/whop/auth/callback
```

### 2. Configure Whop Developer Portal

1. Go to https://dev.whop.com
2. Create a new app or select existing
3. Add OAuth redirect URL: `http://localhost:3000/api/whop/auth/callback`
4. Configure webhook URL: `http://localhost:3000/api/whop/webhook`
5. Copy credentials to `.env.local`

### 3. Set Up Webhook Events

In Whop Developer Portal, enable these webhook events:
- `membership.created`
- `membership.went_valid`
- `membership.went_invalid`
- `membership.deleted`
- `payment.succeeded`
- `payment.failed`

## Usage

### Authentication

#### Protect Routes with Middleware

Routes starting with `/dashboard` are automatically protected by the middleware in `middleware.ts`.

#### Manual Authentication in API Routes

```typescript
import { requireAuth } from '@/lib/whop';

export async function GET() {
  const session = await requireAuth();
  // User is authenticated
  return Response.json({ user: session.user });
}
```

#### Check Authentication Status

```typescript
import { isAuthenticated, getAuthUser } from '@/lib/whop';

const isLoggedIn = await isAuthenticated();
const user = await getAuthUser(); // null if not authenticated
```

### Membership Validation

#### Validate Membership

```typescript
import { validateUserMembership } from '@/lib/whop';

const validated = await validateUserMembership('mem_xxx');
// validated.isValid
// validated.tier ('free' | 'basic' | 'pro' | 'enterprise')
// validated.membership
// validated.user
```

#### Require Specific Tier

```typescript
import { requireTier } from '@/lib/whop';

export async function POST(request: Request) {
  // Throws error if user doesn't have pro tier or higher
  const validated = await requireTier('mem_xxx', 'pro');

  // User has required tier
  return Response.json({ tier: validated.tier });
}
```

### API Client

#### List Products

```typescript
import { whopApi } from '@/lib/whop';

const products = await whopApi.listProducts(10);
```

#### Get User Info

```typescript
const user = await whopApi.getUser('user_xxx');
```

#### Validate Membership

```typescript
const result = await whopApi.validateMembership('mem_xxx');
console.log(result.valid); // boolean
```

### Webhooks

#### Register Custom Handlers

```typescript
import { onWebhook } from '@/lib/whop';
import type { MembershipWebhookData } from '@/lib/whop';

onWebhook('membership.created', async (data: MembershipWebhookData) => {
  // Create student in database
  await db.students.create({
    whop_user_id: data.user.id,
    whop_membership_id: data.membership.id,
    email: data.user.email,
    tier: mapTier(data.membership),
  });

  // Send welcome email
  await sendEmail(data.user.email, 'welcome');
});
```

#### Default Handlers

Default handlers are already registered in `lib/whop/webhooks.ts`:
- `membership.created` - Logs event
- `membership.went_valid` - Logs event
- `membership.went_invalid` - Logs event
- `payment.succeeded` - Logs event
- `payment.failed` - Logs event

Override these by calling `onWebhook()` with your custom handler.

### OAuth Flow

The OAuth flow is handled automatically by the API routes:

1. User visits `/api/whop/auth/login?redirect=/dashboard`
2. Redirected to Whop OAuth page
3. After authorization, redirected to `/api/whop/auth/callback`
4. Session created and user redirected to original destination

#### Login Button Example

```tsx
<a href="/api/whop/auth/login?redirect=/dashboard">
  Login with Whop
</a>
```

#### Logout Button Example

```tsx
<button onClick={async () => {
  await fetch('/api/whop/auth/logout', { method: 'POST' });
  window.location.href = '/';
}}>
  Logout
</button>
```

## Architecture

### Files

- `lib/whop/types.ts` - TypeScript type definitions
- `lib/whop/api-client.ts` - Whop API wrapper
- `lib/whop/auth.ts` - Authentication & session management
- `lib/whop/webhooks.ts` - Webhook handling
- `lib/whop/index.ts` - Centralized exports
- `middleware.ts` - Next.js middleware for route protection

### API Routes

- `GET /api/whop/auth/login` - Initiate OAuth
- `GET /api/whop/auth/callback` - OAuth callback
- `POST /api/whop/auth/logout` - Clear session
- `POST /api/whop/webhook` - Webhook endpoint

### Session Management

Sessions are stored as encrypted cookies with these properties:
- Cookie name: `whop_session`
- Encryption: AES-256-CBC
- Max age: 30 days
- Auto-refresh when expired

### Tier Mapping

Map Whop products to subscription tiers in `lib/whop/auth.ts`:

```typescript
function mapMembershipToTier(membership: WhopMembership): SubscriptionTier {
  const productId = membership.product_id;

  switch (productId) {
    case 'prod_basic_id':
      return 'basic';
    case 'prod_pro_id':
      return 'pro';
    case 'prod_enterprise_id':
      return 'enterprise';
    default:
      return 'free';
  }
}
```

## Security

- ✅ Webhook signature verification
- ✅ Encrypted session cookies
- ✅ HTTPS enforcement in production
- ✅ Token auto-refresh
- ✅ Timing-safe signature comparison
- ✅ Timestamp validation on webhooks

## Testing

### Test OAuth Flow Locally

```bash
npm run dev
# Visit http://localhost:3000/api/whop/auth/login
```

### Test Webhooks with Whop CLI

```bash
whop webhooks trigger membership.created
```

### Generate Test Webhook Signature

```typescript
import { webhooks } from '@/lib/whop';

const payload = JSON.stringify({
  action: 'membership.created',
  data: { /* ... */ },
  timestamp: Date.now(),
});

const signature = webhooks.test.generateSignature(payload);
```

## Troubleshooting

### "Invalid webhook signature"

- Verify `WHOP_WEBHOOK_SECRET` matches Whop portal
- Check webhook is coming from Whop (not a replay attack)
- Ensure timestamp is recent (within 5 minutes)

### "Authentication required"

- Check `whop_session` cookie exists
- Verify `WHOP_TOKEN_ENCRYPTION_KEY` is set
- Try clearing cookies and logging in again

### "Invalid or expired membership"

- Verify membership is active in Whop dashboard
- Check membership hasn't been cancelled
- Validate product ID mapping in `mapMembershipToTier()`

## MCP Server Integration

The Whop MCP server is configured in `.mcp.json`. When properly configured, it enables AI assistants to:
- List products
- Validate memberships
- Get company info
- Manage users

Current implementation uses direct API calls as fallback for reliability.

## Next Steps

1. Configure webhook handlers in `lib/whop/webhooks.ts`
2. Set up product-to-tier mapping in `lib/whop/auth.ts`
3. Create database schemas for students/creators
4. Implement usage limit enforcement based on tiers
5. Add billing page to show tier limits and upgrade options
