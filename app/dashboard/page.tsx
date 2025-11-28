/**
 * Dashboard Router
 *
 * Entry point for /dashboard route that handles routing for embedded Whop apps.
 *
 * HOW IT WORKS:
 * 1. Uses @whop/iframe SDK to get context from Whop's parent window
 * 2. Extracts companyId/experienceId/viewType from Whop
 * 3. Redirects to the appropriate dashboard route with those parameters
 *
 * This is CRITICAL for embedded apps - without it, the app has no way to know
 * which company/experience it's being accessed from!
 *
 * @see lib/whop/iframe-sdk.ts for the SDK implementation
 * @see components/whop/WhopContextRouter.tsx for the routing logic
 */

'use client';

import { WhopContextRouter } from '@/components/whop/WhopContextRouter';

export default function DashboardRouter() {
  return <WhopContextRouter />;
}
