# Whop Integration Architecture

Visual guide to the Whop integration architecture in Chronos.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Chronos Application                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐         ┌──────────────┐                      │
│  │   Frontend   │         │   Next.js    │                      │
│  │  Components  │◄────────┤  Middleware  │                      │
│  └──────────────┘         └──────┬───────┘                      │
│         │                        │                               │
│         │                        │ Session Check                 │
│         │                        │                               │
│         ▼                        ▼                               │
│  ┌─────────────────────────────────────┐                        │
│  │      API Routes (App Router)         │                        │
│  ├─────────────────────────────────────┤                        │
│  │  /api/whop/auth/login               │◄──── User clicks login │
│  │  /api/whop/auth/callback            │◄──── OAuth redirect   │
│  │  /api/whop/auth/logout              │◄──── User logs out    │
│  │  /api/whop/webhook                  │◄──── Whop events      │
│  └─────────────┬───────────────────────┘                        │
│                │                                                  │
│                ▼                                                  │
│  ┌─────────────────────────────────────┐                        │
│  │      Whop Integration Layer          │                        │
│  ├─────────────────────────────────────┤                        │
│  │  lib/whop/auth.ts                   │ Session & Auth        │
│  │  lib/whop/api-client.ts             │ API Wrapper           │
│  │  lib/whop/webhooks.ts               │ Event Handlers        │
│  │  lib/whop/types.ts                  │ Type Definitions      │
│  └─────────────┬───────────────────────┘                        │
│                │                                                  │
│                ▼                                                  │
│  ┌─────────────────────────────────────┐                        │
│  │         Cookie Store (Encrypted)     │                        │
│  │  whop_session: {                     │                        │
│  │    access_token: "...",              │                        │
│  │    refresh_token: "...",             │                        │
│  │    user: {...}                       │                        │
│  │  }                                   │                        │
│  └─────────────────────────────────────┘                        │
│                                                                   │
└───────────────────────────┬───────────────────────────────────┘
                            │
                            │ HTTPS
                            │
                            ▼
              ┌─────────────────────────┐
              │      Whop Platform      │
              ├─────────────────────────┤
              │  • OAuth Server         │
              │  • API Endpoints        │
              │  • Webhook Dispatcher   │
              │  • Product Management   │
              │  • Membership System    │
              └─────────────────────────┘
```

## OAuth Flow Diagram

```
┌──────┐                ┌──────────┐              ┌──────────┐
│ User │                │ Chronos  │              │   Whop   │
└──┬───┘                └────┬─────┘              └────┬─────┘
   │                         │                         │
   │ 1. Click "Login"        │                         │
   ├────────────────────────►│                         │
   │                         │                         │
   │                         │ 2. Redirect to Whop     │
   │                         ├────────────────────────►│
   │                         │                         │
   │ 3. Whop Login Page      │                         │
   │◄────────────────────────┴─────────────────────────┤
   │                                                    │
   │ 4. Enter credentials & authorize                  │
   ├───────────────────────────────────────────────────►│
   │                                                    │
   │                         │ 5. Redirect with code   │
   │                         │◄────────────────────────┤
   │                         │                         │
   │                         │ 6. Exchange code        │
   │                         ├────────────────────────►│
   │                         │                         │
   │                         │ 7. Access token         │
   │                         │◄────────────────────────┤
   │                         │                         │
   │                         │ 8. Get user info        │
   │                         ├────────────────────────►│
   │                         │                         │
   │                         │ 9. User data            │
   │                         │◄────────────────────────┤
   │                         │                         │
   │  10. Set session cookie │                         │
   │◄────────────────────────┤                         │
   │                         │                         │
   │  11. Redirect to app    │                         │
   │◄────────────────────────┤                         │
   │                         │                         │
```

## Webhook Processing Flow

```
┌──────────┐                ┌──────────────┐              ┌──────────┐
│   Whop   │                │   Chronos    │              │ Database │
└────┬─────┘                └──────┬───────┘              └────┬─────┘
     │                             │                           │
     │ 1. Event occurs             │                           │
     │    (e.g. new member)        │                           │
     │                             │                           │
     │ 2. POST /api/whop/webhook   │                           │
     ├────────────────────────────►│                           │
     │    + signature              │                           │
     │                             │                           │
     │                             │ 3. Verify signature       │
     │                             │    (HMAC SHA-256)         │
     │                             │                           │
     │                             │ 4. Parse payload          │
     │                             │                           │
     │                             │ 5. Route to handler       │
     │                             │                           │
     │                             │ 6. Process event          │
     │                             ├──────────────────────────►│
     │                             │    (create/update)        │
     │                             │                           │
     │                             │ 7. Success                │
     │                             │◄──────────────────────────┤
     │                             │                           │
     │ 8. 200 OK                   │                           │
     │◄────────────────────────────┤                           │
     │                             │                           │
```

## Membership Validation Flow

```
┌──────────┐              ┌──────────────┐              ┌──────────┐
│  Client  │              │   API Route  │              │   Whop   │
└────┬─────┘              └──────┬───────┘              └────┬─────┘
     │                           │                           │
     │ 1. Request with           │                           │
     │    membershipId           │                           │
     ├──────────────────────────►│                           │
     │                           │                           │
     │                           │ 2. Get session from       │
     │                           │    cookie                 │
     │                           │                           │
     │                           │ 3. Validate membership    │
     │                           ├──────────────────────────►│
     │                           │                           │
     │                           │ 4. Membership data        │
     │                           │◄──────────────────────────┤
     │                           │                           │
     │                           │ 5. Map to tier            │
     │                           │    (free/basic/pro/ent)   │
     │                           │                           │
     │                           │ 6. Check tier limits      │
     │                           │                           │
     │                           │ 7. Process request        │
     │                           │    or deny                │
     │                           │                           │
     │ 8. Response               │                           │
     │◄──────────────────────────┤                           │
     │                           │                           │
```

## File Organization

```
chronos/
├── app/
│   └── api/
│       └── whop/
│           ├── auth/
│           │   ├── login/route.ts       ─── Initiate OAuth
│           │   ├── callback/route.ts    ─── Handle OAuth callback
│           │   └── logout/route.ts      ─── Clear session
│           └── webhook/route.ts         ─── Receive Whop events
│
├── lib/
│   └── whop/
│       ├── types.ts           ─── TypeScript definitions
│       ├── api-client.ts      ─── Whop API wrapper
│       ├── auth.ts            ─── Authentication logic
│       ├── webhooks.ts        ─── Webhook handlers
│       ├── index.ts           ─── Public exports
│       ├── test-integration.ts ─── Test suite
│       └── README.md          ─── API documentation
│
├── middleware.ts              ─── Route protection
│
└── docs/
    ├── WHOP_INTEGRATION_GUIDE.md  ─── Setup guide
    └── WHOP_ARCHITECTURE.md       ─── This file
```

## Data Flow Layers

```
┌─────────────────────────────────────────────────────────┐
│                     Presentation Layer                   │
│  • Next.js Pages & Components                           │
│  • Login/Logout UI                                      │
│  • Protected Routes                                     │
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────┐
│                     API Routes Layer                     │
│  • /api/whop/auth/*  (OAuth endpoints)                  │
│  • /api/whop/webhook (Event receiver)                   │
│  • Protected API routes                                 │
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────┐
│                   Business Logic Layer                   │
│  • lib/whop/auth.ts     (Authentication)                │
│  • lib/whop/webhooks.ts (Event processing)              │
│  • Tier validation                                      │
│  • Usage limit enforcement                              │
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────┐
│                   Integration Layer                      │
│  • lib/whop/api-client.ts (Whop API wrapper)            │
│  • HTTP client                                          │
│  • Error handling                                       │
│  • Type conversions                                     │
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────┐
│                    External Services                     │
│  • Whop OAuth Server                                    │
│  • Whop API (api.whop.com)                              │
│  • Whop Webhooks                                        │
└─────────────────────────────────────────────────────────┘
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Security Layers                      │
└─────────────────────────────────────────────────────────┘

Layer 1: Transport Security
├── HTTPS (TLS 1.2+)
├── Secure cookies
└── SameSite protection

Layer 2: Authentication
├── OAuth 2.0 Authorization Code Flow
├── Encrypted session tokens (AES-256-CBC)
├── Token refresh mechanism
└── 30-day session expiration

Layer 3: Webhook Verification
├── HMAC SHA-256 signature
├── Timing-safe comparison
├── Timestamp validation (5-min window)
└── Raw body verification

Layer 4: Authorization
├── Session validation
├── Membership status check
├── Tier-based access control
└── Feature flag enforcement

Layer 5: API Security
├── Bearer token authentication
├── Request rate limiting (ready)
├── Input validation
└── Error sanitization
```

## Tier System Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Subscription Tiers                     │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  FREE                                                     │
│  ├── 5 videos                                            │
│  ├── 1 GB storage                                        │
│  ├── 100 AI credits/month                                │
│  ├── 10 students                                         │
│  └── Basic features only                                 │
│                                                           │
│  BASIC                                                    │
│  ├── 50 videos                                           │
│  ├── 10 GB storage                                       │
│  ├── 1,000 AI credits/month                              │
│  ├── 100 students                                        │
│  └── + Analytics, Course builder                         │
│                                                           │
│  PRO                                                      │
│  ├── 500 videos                                          │
│  ├── 100 GB storage                                      │
│  ├── 10,000 AI credits/month                             │
│  ├── 1,000 students                                      │
│  └── + Bulk upload, Custom branding, API access          │
│                                                           │
│  ENTERPRISE                                               │
│  ├── Unlimited videos                                    │
│  ├── Unlimited storage                                   │
│  ├── Unlimited AI credits                                │
│  ├── Unlimited students                                  │
│  └── + Priority support, Custom features                 │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

## Event Handling Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Webhook Events                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  membership.created                                      │
│  ├── Create student record in DB                        │
│  ├── Send welcome email                                 │
│  └── Grant initial access                               │
│                                                          │
│  membership.went_valid                                   │
│  ├── Activate student account                           │
│  ├── Send activation email                              │
│  └── Enable features                                    │
│                                                          │
│  membership.went_invalid                                 │
│  ├── Revoke student access                              │
│  ├── Send expiration notice                             │
│  └── Archive data (optional)                            │
│                                                          │
│  membership.deleted                                      │
│  ├── Remove student access                              │
│  ├── Clean up resources                                 │
│  └── Archive student data                               │
│                                                          │
│  payment.succeeded                                       │
│  ├── Log for analytics                                  │
│  ├── Update billing records                             │
│  └── Send receipt                                       │
│                                                          │
│  payment.failed                                          │
│  ├── Send payment failure notice                        │
│  ├── Update billing status                              │
│  └── Grace period logic                                 │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Session Management Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Session Lifecycle                       │
└─────────────────────────────────────────────────────────┘

1. Session Creation
   ├── OAuth callback receives code
   ├── Exchange code for tokens
   ├── Fetch user info from Whop
   ├── Create session object
   ├── Encrypt with AES-256-CBC
   └── Store in httpOnly cookie

2. Session Validation
   ├── Read cookie from request
   ├── Decrypt session data
   ├── Check expiration
   ├── Auto-refresh if expired
   └── Return user data

3. Session Refresh
   ├── Detect expired token
   ├── Call refresh token endpoint
   ├── Get new access token
   ├── Update session
   └── Re-encrypt and store

4. Session Termination
   ├── User clicks logout
   ├── Clear session cookie
   ├── Redirect to home page
   └── Session destroyed

Cookie Properties:
├── Name: whop_session
├── Max Age: 30 days
├── HttpOnly: true
├── Secure: true (production)
├── SameSite: lax
└── Path: /
```

## Integration Points with Other Systems

```
┌─────────────────────────────────────────────────────────┐
│              External System Integrations                │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Whop Integration ──────┬──► Database (Supabase)        │
│                         │    ├── students table         │
│                         │    ├── creators table         │
│                         │    └── usage_metrics table    │
│                         │                               │
│                         ├──► Analytics System           │
│                         │    ├── Tier distribution      │
│                         │    ├── Revenue tracking       │
│                         │    └── Usage patterns         │
│                         │                               │
│                         ├──► Rate Limiter               │
│                         │    ├── Tier-based quotas      │
│                         │    ├── AI credit tracking     │
│                         │    └── Storage limits         │
│                         │                               │
│                         ├──► Email Service (Resend)     │
│                         │    ├── Welcome emails         │
│                         │    ├── Expiration notices     │
│                         │    └── Payment receipts       │
│                         │                               │
│                         └──► Monitoring (Sentry)        │
│                              ├── Error tracking         │
│                              ├── Performance metrics    │
│                              └── Event logging          │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## API Client Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Whop API Client                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  whopApi                                                 │
│  ├── listProducts()        ─── GET /products            │
│  ├── getProduct(id)        ─── GET /products/:id        │
│  ├── createProduct(data)   ─── POST /products           │
│  │                                                       │
│  ├── listMemberships()     ─── GET /memberships         │
│  ├── getMembership(id)     ─── GET /memberships/:id     │
│  ├── validateMembership()  ─── GET + validation logic   │
│  │                                                       │
│  ├── listUsers()           ─── GET /users               │
│  ├── getUser(id)           ─── GET /users/:id           │
│  ├── getCurrentUser()      ─── GET /me                  │
│  │                                                       │
│  ├── getCompanyInfo()      ─── GET /company             │
│  │                                                       │
│  ├── getOAuthUrl()         ─── Build OAuth URL          │
│  ├── exchangeCodeForToken() ─── POST /oauth/token       │
│  └── refreshAccessToken()  ─── POST /oauth/token        │
│                                                          │
│  Features:                                               │
│  ├── Type-safe interfaces                               │
│  ├── Error handling                                     │
│  ├── Bearer token auth                                  │
│  ├── Request/response logging                           │
│  └── MCP server fallback                                │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────┐
│                    Error Hierarchy                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  WhopApiError (Base)                                     │
│  ├── statusCode: number                                 │
│  ├── code: string                                       │
│  └── message: string                                    │
│      │                                                   │
│      ├── WhopAuthError (401)                            │
│      │   └── Invalid or missing credentials             │
│      │                                                   │
│      └── WhopMembershipError (403)                      │
│          └── Invalid or expired membership              │
│                                                          │
│  Error Handling Strategy:                               │
│  ├── API routes: Return JSON with status code           │
│  ├── Webhooks: Log and return 500 for retry             │
│  ├── Auth: Redirect to login                            │
│  └── Client: Display user-friendly message              │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                 Production Deployment                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Vercel Edge Network                                     │
│  ├── /api/whop/auth/* ──► Serverless Functions          │
│  ├── /api/whop/webhook ──► Serverless Function          │
│  └── Middleware ──────────► Edge Runtime                │
│                                                          │
│  Environment Variables (Vercel)                          │
│  ├── WHOP_API_KEY (encrypted)                           │
│  ├── WHOP_CLIENT_SECRET (encrypted)                     │
│  ├── WHOP_WEBHOOK_SECRET (encrypted)                    │
│  └── WHOP_TOKEN_ENCRYPTION_KEY (encrypted)              │
│                                                          │
│  Monitoring                                              │
│  ├── Sentry (Error tracking)                            │
│  ├── Vercel Analytics (Performance)                     │
│  └── PostHog (Product analytics)                        │
│                                                          │
│  Security                                                │
│  ├── HTTPS enforced                                     │
│  ├── CORS configured                                    │
│  ├── Rate limiting enabled                              │
│  └── Security headers set                               │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Performance Optimization

```
┌─────────────────────────────────────────────────────────┐
│                Performance Strategies                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Session Management                                      │
│  ├── In-memory cache for active sessions                │
│  ├── Auto-refresh on expiration (no user action)        │
│  └── 30-day cookie lifetime                             │
│                                                          │
│  API Calls                                               │
│  ├── Batch requests where possible                      │
│  ├── Cache membership validation (5 min)                │
│  └── Exponential backoff on errors                      │
│                                                          │
│  Webhook Processing                                      │
│  ├── Async event handlers                               │
│  ├── Queue for heavy operations                         │
│  └── Idempotency keys for retries                       │
│                                                          │
│  Middleware                                              │
│  ├── Edge runtime for low latency                       │
│  ├── Early return for public routes                     │
│  └── Cookie-only validation (fast)                      │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Testing Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Test Coverage                         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Unit Tests                                              │
│  ├── lib/whop/types.ts (Type validation)                │
│  ├── lib/whop/auth.ts (Encryption/decryption)           │
│  └── lib/whop/webhooks.ts (Signature verification)      │
│                                                          │
│  Integration Tests                                       │
│  ├── API Client (Whop API calls)                        │
│  ├── OAuth Flow (End-to-end)                            │
│  └── Webhook Handlers (Event processing)                │
│                                                          │
│  E2E Tests                                               │
│  ├── User login flow                                    │
│  ├── Protected route access                             │
│  └── Tier-based feature access                          │
│                                                          │
│  Test Utilities                                          │
│  ├── test-integration.ts (CLI test suite)               │
│  ├── Mock Whop API responses                            │
│  ├── Test webhook payload generator                     │
│  └── Test signature generator                           │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Summary

This Whop integration provides:

1. **Complete OAuth 2.0 flow** with secure session management
2. **Webhook event processing** with signature verification
3. **Tier-based access control** with configurable limits
4. **Type-safe API client** for all Whop operations
5. **Automatic route protection** via Next.js middleware
6. **Comprehensive documentation** and testing utilities

The architecture is production-ready, scalable, and follows security best practices.
