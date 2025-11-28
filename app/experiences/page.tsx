/**
 * Experiences Router
 *
 * Entry point for /experiences route that handles routing for embedded Whop apps.
 *
 * This is the customer-facing entry point. When a student clicks on the app
 * from their Whop membership, Whop loads this route.
 *
 * HOW IT WORKS:
 * 1. Uses @whop/iframe SDK to get context from Whop's parent window
 * 2. Extracts experienceId from Whop
 * 3. Redirects to /experiences/[experienceId]/courses
 *
 * @see lib/whop/iframe-sdk.ts for the SDK implementation
 * @see components/whop/WhopContextRouter.tsx for the routing logic
 */

'use client';

import { WhopContextRouter } from '@/components/whop/WhopContextRouter';

export default function ExperiencesRouter() {
  return <WhopContextRouter />;
}
