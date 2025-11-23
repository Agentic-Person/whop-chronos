/**
 * Seller Product Layout - Whop Embedded App
 *
 * This layout wraps all seller pages and handles authentication.
 * Whop passes the experienceId in the URL path.
 */

import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { whopsdk } from '@/lib/whop-sdk';
import { DashboardNav } from '@/components/layout/DashboardNav';
import { AnalyticsProviderWithSuspense } from '@/lib/contexts/AnalyticsContext';

// Force dynamic rendering for authentication
export const dynamic = 'force-dynamic';

// Test mode configuration
const TEST_MODE = process.env['DEV_BYPASS_AUTH'] === 'true';
const TEST_USER_ID = 'user_test_00000000000000';

interface SellerLayoutProps {
  children: ReactNode;
  params: Promise<{ experienceId: string }>;
}

export default async function SellerProductLayout({
  children,
  params,
}: SellerLayoutProps) {
  const { experienceId } = await params;

  let userId: string;
  let user: Awaited<ReturnType<typeof whopsdk.users.retrieve>>;
  let experience: Awaited<ReturnType<typeof whopsdk.experiences.retrieve>>;
  let company: Awaited<ReturnType<typeof whopsdk.companies.retrieve>>;
  let accessLevel: string;

  if (TEST_MODE) {
    console.log('[Seller Layout] Test mode enabled');
    userId = TEST_USER_ID;
    user = {
      id: TEST_USER_ID,
      email: 'creator@test.chronos.ai',
      username: 'test_creator',
      name: 'Test Creator',
      profile_pic_url: null,
    } as Awaited<ReturnType<typeof whopsdk.users.retrieve>>;
    experience = {
      id: experienceId,
      name: 'Test Experience',
      company_id: 'test_company_id',
    } as Awaited<ReturnType<typeof whopsdk.experiences.retrieve>>;
    company = {
      id: 'test_company_id',
      title: 'Test Company',
      image_url: null,
    } as Awaited<ReturnType<typeof whopsdk.companies.retrieve>>;
    accessLevel = 'admin';
  } else {
    try {
      const result = await whopsdk.verifyUserToken(await headers());
      userId = result.userId;
    } catch (error) {
      console.error('[Seller Layout] Authentication failed:', error);
      redirect(`/auth-error?reason=unauthenticated&error=${encodeURIComponent(String(error))}`);
    }

    try {
      const experienceData = await whopsdk.experiences.retrieve(experienceId);
      experience = experienceData;

      const [userData, companyData, access] = await Promise.all([
        whopsdk.users.retrieve(userId),
        whopsdk.companies.retrieve(experience.company_id),
        whopsdk.users.checkAccess(experienceId, { id: userId }),
      ]);

      user = userData;
      company = companyData;
      accessLevel = access.access_level;

      if (accessLevel !== 'admin') {
        redirect(`/auth-error?reason=not_admin&experience=${experienceId}`);
      }
    } catch (error) {
      console.error('[Seller Layout] Failed to fetch data:', error);
      redirect(`/auth-error?reason=access_check_failed&error=${encodeURIComponent(String(error))}`);
    }
  }

  const creatorId = userId;
  const tier = 'pro';

  return (
    <AnalyticsProviderWithSuspense creatorId={creatorId} tier={tier}>
      <div className="min-h-screen bg-gray-1">
        <DashboardNav />

        {/* Company Header */}
        <div className="border-b border-gray-a4 bg-gray-2">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {company.image_url ? (
                  <img src={company.image_url} alt={company.title} className="w-10 h-10 rounded-lg object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-gray-a4 flex items-center justify-center">
                    <span className="text-lg font-bold text-gray-11">{company.title?.charAt(0) || 'C'}</span>
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
                    <img src={user.profile_pic_url} alt={user.name || 'User'} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <span className="text-sm font-medium text-gray-11">{(user.name || 'U').charAt(0).toUpperCase()}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        {/* Hidden data for client components */}
        <script
          id="__SELLER_DATA__"
          type="application/json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              creatorId,
              experienceId,
              companyId: experience.company_id,
              user: { id: user.id, email: user.email, name: user.name },
            }),
          }}
        />
      </div>
    </AnalyticsProviderWithSuspense>
  );
}
