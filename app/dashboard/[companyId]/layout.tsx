/**
 * Creator Dashboard Layout with Native Whop Authentication
 *
 * This layout wraps all creator dashboard pages and:
 * 1. Verifies the user is authenticated via Whop native auth
 * 2. Checks the user has admin access to the company
 * 3. Provides company and user context to child pages
 * 4. Renders the dashboard navigation
 */

import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { headers, cookies } from 'next/headers';
import { whopsdk } from '@/lib/whop-sdk';
import { getServiceSupabase } from '@/lib/db/client';
import { DashboardNav } from '@/components/layout/DashboardNav';
import { AnalyticsProviderWithSuspense } from '@/lib/contexts/AnalyticsContext';
import { TEST_USER_ID, TEST_CREATOR_USER, TEST_COMPANY } from '@/lib/whop/test-constants';

// Force dynamic rendering for authentication
export const dynamic = 'force-dynamic';

// Test mode configuration
// Controlled by DEV_BYPASS_AUTH environment variable
// When enabled, uses mock data from test-constants.ts to bypass Whop authentication
// SECURITY: Must be disabled (or not set) in production
const TEST_MODE = process.env['DEV_BYPASS_AUTH'] === 'true';

interface CreatorLayoutProps {
  children: ReactNode;
  params: Promise<{ companyId: string }>;
}

export default async function CreatorDashboardLayout({
  children,
  params,
}: CreatorLayoutProps) {
  const { companyId } = await params;

  let userId: string;
  let user: Awaited<ReturnType<typeof whopsdk.users.retrieve>>;
  let company: Awaited<ReturnType<typeof whopsdk.companies.retrieve>>;
  let accessLevel: string;

  if (TEST_MODE) {
    // Test mode - use mock data from centralized test constants
    console.log('⚠️ [Creator Layout] Test mode enabled');
    userId = TEST_USER_ID;
    user = TEST_CREATOR_USER as Awaited<ReturnType<typeof whopsdk.users.retrieve>>;
    company = {
      ...TEST_COMPANY,
      id: companyId, // Use the actual companyId from the route params
    } as Awaited<ReturnType<typeof whopsdk.companies.retrieve>>;
    accessLevel = 'admin';
  } else {
    // Production - verify with Whop SDK
    // Token can come from:
    // 1. Cookie (set by entry page from initial Whop request)
    // 2. Headers (if Whop proxy injects it directly)
    try {
      const headersList = await headers();
      const cookieStore = await cookies();
      const tokenFromCookie = cookieStore.get('whop-user-token')?.value;
      const tokenFromHeader = headersList.get('x-whop-user-token');

      // Create headers with the token (prefer cookie since it persists across navigations)
      let authHeaders: Headers;
      if (tokenFromCookie) {
        console.log('[Creator Layout] Using token from cookie');
        authHeaders = new Headers(headersList);
        authHeaders.set('x-whop-user-token', tokenFromCookie);
      } else if (tokenFromHeader) {
        console.log('[Creator Layout] Using token from headers');
        authHeaders = headersList;
      } else {
        throw new Error('No Whop user token found in cookie or headers');
      }

      const result = await whopsdk.verifyUserToken(authHeaders);
      userId = result.userId;
    } catch (error) {
      console.error('[Creator Layout] Authentication failed:', error);
      redirect(`/auth-error?reason=unauthenticated&error=${encodeURIComponent(String(error))}`);
    }

    // Check admin access to company
    try {
      const [userData, companyData, access] = await Promise.all([
        whopsdk.users.retrieve(userId),
        whopsdk.companies.retrieve(companyId),
        whopsdk.users.checkAccess(companyId, { id: userId }),
      ]);

      user = userData;
      company = companyData;
      accessLevel = access.access_level;

      if (accessLevel !== 'admin') {
        console.warn('[Creator Layout] User is not admin:', { userId, companyId, accessLevel });
        redirect(`/auth-error?reason=not_admin&company=${companyId}`);
      }
    } catch (error) {
      console.error('[Creator Layout] Failed to fetch user/company data:', error);
      redirect(`/auth-error?reason=access_check_failed&error=${encodeURIComponent(String(error))}`);
    }
  }

  // Look up or create the creator record by Whop company ID
  let creatorId: string = userId; // Fallback
  let tier: 'basic' | 'pro' | 'enterprise' = 'pro';

  try {
    const supabase = getServiceSupabase();

    // First, try to find existing creator
    const { data: existingCreator } = await supabase
      .from('creators')
      .select('id, subscription_tier')
      .eq('whop_company_id', companyId)
      .single();

    if (existingCreator) {
      creatorId = existingCreator.id;
      tier = existingCreator.subscription_tier as 'basic' | 'pro' | 'enterprise';
      console.log('[Creator Layout] Found existing creator:', { companyId, creatorId, tier });

      // Update last login timestamp
      await supabase
        .from('creators')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', creatorId);
    } else {
      // Creator doesn't exist - auto-create them
      console.log('[Creator Layout] Creating new creator for company:', companyId);

      const { data: newCreator, error: createError } = await supabase
        .from('creators')
        .insert({
          whop_company_id: companyId,
          whop_user_id: userId,
          email: user.email || `${userId}@whop.user`,
          name: user.name || user.username || company.title || 'Creator',
          subscription_tier: 'pro', // Default to pro for new creators
          is_active: true,
          last_login_at: new Date().toISOString(),
        })
        .select('id, subscription_tier')
        .single();

      if (createError) {
        console.error('[Creator Layout] Failed to create creator:', createError);
        // Check if it was a race condition (creator was created by another request)
        const { data: retryCreator } = await supabase
          .from('creators')
          .select('id, subscription_tier')
          .eq('whop_company_id', companyId)
          .single();

        if (retryCreator) {
          creatorId = retryCreator.id;
          tier = retryCreator.subscription_tier as 'basic' | 'pro' | 'enterprise';
          console.log('[Creator Layout] Found creator on retry:', { companyId, creatorId });
        }
      } else if (newCreator) {
        creatorId = newCreator.id;
        tier = newCreator.subscription_tier as 'basic' | 'pro' | 'enterprise';
        console.log('[Creator Layout] Created new creator:', { companyId, creatorId, tier });
      }
    }
  } catch (error) {
    console.error('[Creator Layout] Failed to lookup/create creator:', error);
  }

  return (
    <AnalyticsProviderWithSuspense creatorId={creatorId} tier={tier}>
      <div className="min-h-screen bg-gray-1">
        {/* Navigation */}
        <DashboardNav />

        {/* Company Header */}
        <div className="border-b border-gray-a4 bg-gray-2">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {company.image_url ? (
                  <img
                    src={company.image_url}
                    alt={company.title}
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-gray-a4 flex items-center justify-center">
                    <span className="text-lg font-bold text-gray-11">
                      {company.title?.charAt(0) || 'C'}
                    </span>
                  </div>
                )}
                <div>
                  <h2 className="font-semibold text-gray-12">{company.title}</h2>
                  <p className="text-sm text-gray-11">Creator Dashboard</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-11">{user.email}</span>
                <div className="w-8 h-8 rounded-full bg-gray-a4 flex items-center justify-center">
                  {user.profile_pic_url ? (
                    <img
                      src={user.profile_pic_url}
                      alt={user.name || user.username || 'User'}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-medium text-gray-11">
                      {(user.name || user.username || 'U').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
    </AnalyticsProviderWithSuspense>
  );
}
