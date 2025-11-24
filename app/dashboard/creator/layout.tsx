/**
 * Creator Dashboard Layout with Native Whop Authentication
 *
 * This layout uses native Whop authentication (JWT via x-whop-user-token header)
 * instead of the deprecated OAuth flow.
 *
 * For embedded Whop apps, authentication is handled automatically:
 * 1. Whop embeds the app in an iframe
 * 2. Whop injects JWT token via x-whop-user-token header
 * 3. We verify the token using whopsdk.verifyUserToken()
 *
 * @see docs/integrations/whop/NATIVE_AUTH_MIGRATION_REPORT.md
 */

import { ReactNode } from 'react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { DashboardNav } from '@/components/layout/DashboardNav';
import { AnalyticsProviderWithSuspense } from '@/lib/contexts/AnalyticsContext';
import { AuthProvider } from '@/lib/contexts/AuthContext';
import { RoleSwitcher } from '@/components/dashboard/RoleSwitcher';
import { whopsdk } from '@/lib/whop-sdk';
import type { WhopSession } from '@/lib/whop/types';

// Force dynamic rendering since we use headers for authentication
export const dynamic = 'force-dynamic';

// Test mode configuration
const TEST_MODE = process.env['DEV_BYPASS_AUTH'] === 'true';
const TEST_USER_ID = 'user_test_00000000000000';

export default async function CreatorDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  let userId: string;
  let user: { id: string; email?: string; username?: string; name?: string; profile_pic_url?: string | null };

  if (TEST_MODE) {
    // Test mode - use mock data for local development
    console.log('⚠️ [Creator Layout] Test mode enabled - using test user');
    userId = TEST_USER_ID;
    user = {
      id: TEST_USER_ID,
      email: 'creator@test.chronos.ai',
      username: 'test_creator',
      name: 'Test Creator',
      profile_pic_url: null,
    };
  } else {
    // Production - verify with Whop SDK native auth
    try {
      const result = await whopsdk.verifyUserToken(await headers());
      userId = result.userId;

      // Fetch user details
      const userDetails = await whopsdk.users.retrieve(userId);
      user = {
        id: userDetails.id,
        email: userDetails.email,
        username: userDetails.username,
        name: userDetails.name,
        profile_pic_url: userDetails.profile_pic_url,
      };
    } catch (error) {
      console.error('[Creator Layout] Native auth failed:', error);
      redirect(`/auth-error?reason=unauthenticated&error=${encodeURIComponent(String(error))}`);
    }
  }

  const creatorId = userId;
  const tier = 'pro'; // TODO: Get tier from Whop membership validation

  // Construct session object for AuthProvider (maintains compatibility)
  const session: WhopSession = {
    user: {
      id: user.id,
      email: user.email || '',
      username: user.username || null,
      profile_pic_url: user.profile_pic_url || null,
      social_accounts: {},
      created_at: Date.now(),
    },
    access_token: 'native-auth', // Placeholder - native auth uses JWT, not OAuth tokens
    refresh_token: 'native-auth',
    expires_at: Date.now() + (1000 * 60 * 60 * 24), // 24 hours
  };

  return (
    <AuthProvider session={session}>
      <AnalyticsProviderWithSuspense creatorId={creatorId} tier={tier}>
        <div className="min-h-screen bg-gray-1">
          <DashboardNav />
          <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-4">
              <RoleSwitcher />
            </div>
            {children}
          </main>
        </div>
      </AnalyticsProviderWithSuspense>
    </AuthProvider>
  );
}
