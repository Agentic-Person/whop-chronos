/**
 * Customer Layout - Whop Embedded App
 *
 * This layout wraps all customer/student pages and handles authentication.
 * Whop passes the experienceId in the URL path.
 */

import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { whopsdk } from '@/lib/whop-sdk';
import { StudentNav } from '@/components/layout/StudentNav';

// Force dynamic rendering for authentication
export const dynamic = 'force-dynamic';

// Test mode configuration
const TEST_MODE = process.env['DEV_BYPASS_AUTH'] === 'true';
const TEST_USER_ID = 'user_test_student_00000000';

interface CustomerLayoutProps {
  children: ReactNode;
  params: Promise<{ experienceId: string }>;
}

export default async function CustomerLayout({
  children,
  params,
}: CustomerLayoutProps) {
  const { experienceId } = await params;

  let userId: string;
  let user: Awaited<ReturnType<typeof whopsdk.users.retrieve>>;
  let experience: Awaited<ReturnType<typeof whopsdk.experiences.retrieve>>;
  let accessLevel: string;

  if (TEST_MODE) {
    console.log('[Customer Layout] Test mode enabled');
    userId = TEST_USER_ID;
    user = {
      id: TEST_USER_ID,
      email: 'student@test.chronos.ai',
      username: 'test_student',
      name: 'Test Student',
      profile_pic_url: null,
    } as Awaited<ReturnType<typeof whopsdk.users.retrieve>>;
    experience = {
      id: experienceId,
      name: 'Test Experience',
      company_id: 'test_company_id',
    } as Awaited<ReturnType<typeof whopsdk.experiences.retrieve>>;
    accessLevel = 'customer';
  } else {
    try {
      const result = await whopsdk.verifyUserToken(await headers());
      userId = result.userId;
    } catch (error) {
      console.error('[Customer Layout] Authentication failed:', error);
      redirect(`/auth-error?reason=unauthenticated&error=${encodeURIComponent(String(error))}`);
    }

    try {
      const [userData, experienceData, access] = await Promise.all([
        whopsdk.users.retrieve(userId),
        whopsdk.experiences.retrieve(experienceId),
        whopsdk.users.checkAccess(experienceId, { id: userId }),
      ]);

      user = userData;
      experience = experienceData;
      accessLevel = access.access_level;

      // Allow both admin and customer access
      if (!access.has_access && accessLevel !== 'admin') {
        redirect(`/auth-error?reason=no_access&experience=${experienceId}`);
      }
    } catch (error) {
      console.error('[Customer Layout] Failed to fetch data:', error);
      redirect(`/auth-error?reason=access_check_failed&error=${encodeURIComponent(String(error))}`);
    }
  }

  const studentId = userId;
  const creatorId = experience.company_id;

  return (
    <div className="min-h-screen bg-gray-1">
      <StudentNav />

      {/* Header */}
      <div className="border-b border-gray-a4 bg-gray-2">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-12">
                {experience.name || 'Learning Dashboard'}
              </h1>
              <p className="text-sm text-gray-11">Your learning journey</p>
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
        id="__CUSTOMER_DATA__"
        type="application/json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            studentId,
            creatorId,
            experienceId,
            user: { id: user.id, email: user.email, name: user.name },
          }),
        }}
      />
    </div>
  );
}
