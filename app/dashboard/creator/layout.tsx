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
import { getServiceSupabase } from '@/lib/db/client';
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

  // Look up or create creator record
  let creatorId = userId;
  let tier: 'basic' | 'pro' | 'enterprise' = 'pro';

  try {
    const supabase = getServiceSupabase();

    // For static routes (no company context), look up by whop_user_id
    const { data: existingCreator } = await supabase
      .from('creators')
      .select('id, subscription_tier')
      .eq('whop_user_id', userId)
      .single();

    if (existingCreator) {
      creatorId = existingCreator.id;
      tier = existingCreator.subscription_tier as 'basic' | 'pro' | 'enterprise';
      console.log('[Creator Layout Static] Found existing creator:', { userId, creatorId, tier });

      // Update last login timestamp
      await supabase
        .from('creators')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', creatorId);
    } else if (TEST_MODE) {
      // In test mode, auto-create a test creator
      console.log('[Creator Layout Static] Creating test creator for:', userId);

      const { data: newCreator, error: createError } = await supabase
        .from('creators')
        .insert({
          whop_company_id: `test_company_${userId}`, // Fake company ID for test mode
          whop_user_id: userId,
          email: user.email || `${userId}@test.chronos.ai`,
          name: user.name || user.username || 'Test Creator',
          subscription_tier: 'pro',
          is_active: true,
          last_login_at: new Date().toISOString(),
        })
        .select('id, subscription_tier')
        .single();

      if (!createError && newCreator) {
        creatorId = newCreator.id;
        tier = newCreator.subscription_tier as 'basic' | 'pro' | 'enterprise';
        console.log('[Creator Layout Static] Created test creator:', { userId, creatorId });
      } else {
        console.error('[Creator Layout Static] Failed to create test creator:', createError);
      }
    } else {
      console.warn('[Creator Layout Static] No creator found for user (use /dashboard/[companyId] for proper context):', userId);
    }
  } catch (error) {
    console.error('[Creator Layout Static] Failed to lookup/create creator:', error);
  }

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
