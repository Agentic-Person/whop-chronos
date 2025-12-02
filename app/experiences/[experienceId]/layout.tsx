/**
 * Student Experience Layout with Native Whop Authentication
 *
 * This layout wraps all student experience pages and:
 * 1. Verifies the user is authenticated via Whop native auth
 * 2. Checks the user has customer access to the experience
 * 3. Provides experience and user context to child pages
 * 4. Renders the student navigation
 */

import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { whopsdk } from '@/lib/whop-sdk';
import { getServiceSupabase } from '@/lib/db/client';
import Link from 'next/link';
import { BookOpen, MessageSquare, Home } from 'lucide-react';

// Force dynamic rendering for authentication
export const dynamic = 'force-dynamic';

// Test mode configuration
// TEMPORARY: Hardcoded to true until app is approved by Whop
// Once approved, change back to: process.env['DEV_BYPASS_AUTH'] === 'true'
const TEST_MODE = true;
const TEST_USER_ID = 'user_test_student_00000000';
const TEST_CREATOR_ID = 'user_test_creator_00000000';

interface StudentLayoutProps {
  children: ReactNode;
  params: Promise<{ experienceId: string }>;
}

export default async function StudentExperienceLayout({
  children,
  params,
}: StudentLayoutProps) {
  const { experienceId } = await params;

  let userId: string;
  let creatorId: string;
  let user: Awaited<ReturnType<typeof whopsdk.users.retrieve>>;
  let experience: Awaited<ReturnType<typeof whopsdk.experiences.retrieve>>;
  let accessLevel: string;

  if (TEST_MODE) {
    // Test mode - use mock data
    console.log('⚠️ [Student Layout] Test mode enabled');
    userId = TEST_USER_ID;
    creatorId = TEST_CREATOR_ID;
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
      company_id: 'biz_test_00000000',
    } as Awaited<ReturnType<typeof whopsdk.experiences.retrieve>>;
    accessLevel = 'customer';
  } else {
    // Production - verify with Whop SDK
    try {
      const result = await whopsdk.verifyUserToken(await headers());
      userId = result.userId;
    } catch (error) {
      console.error('[Student Layout] Authentication failed:', error);
      redirect(`/auth-error?reason=unauthenticated&error=${encodeURIComponent(String(error))}`);
    }

    // Check customer access to experience
    try {
      const [userData, experienceData, access] = await Promise.all([
        whopsdk.users.retrieve(userId),
        whopsdk.experiences.retrieve(experienceId),
        whopsdk.users.checkAccess(experienceId, { id: userId }),
      ]);

      user = userData;
      experience = experienceData;
      accessLevel = access.access_level;

      // Students need customer access (or admin access works too)
      if (!access.has_access && accessLevel !== 'admin') {
        console.warn('[Student Layout] User does not have access:', { userId, experienceId, accessLevel });
        redirect(`/auth-error?reason=no_access&experience=${experienceId}`);
      }

      // Get creator ID from experience's company
      // We need to look up our internal creator ID by the Whop company ID
      const whopCompanyId = (experience as any).company_id;
      const supabase = getServiceSupabase();

      if (whopCompanyId) {
        const { data: creator } = await supabase
          .from('creators')
          .select('id')
          .eq('whop_company_id', whopCompanyId)
          .single();

        if (creator) {
          creatorId = creator.id;
          console.log('[Student Layout] Found creator:', { whopCompanyId, creatorId });
        } else {
          console.warn('[Student Layout] No creator found for company:', whopCompanyId);
          // Redirect to error - creator must exist for students to access
          redirect(`/auth-error?reason=creator_not_found&company=${whopCompanyId}`);
        }
      } else {
        console.error('[Student Layout] No company_id on experience:', experienceId);
        redirect(`/auth-error?reason=no_company_id&experience=${experienceId}`);
      }

      // Auto-create student record if it doesn't exist
      const { data: existingStudent } = await supabase
        .from('students')
        .select('id')
        .eq('whop_user_id', userId)
        .eq('creator_id', creatorId)
        .single();

      if (!existingStudent) {
        console.log('[Student Layout] Creating new student record:', { userId, creatorId });
        const { error: createError } = await supabase
          .from('students')
          .insert({
            whop_user_id: userId,
            creator_id: creatorId,
            email: user.email || `${userId}@whop.user`,
            name: user.name || user.username || 'Student',
            is_active: true,
          });

        if (createError) {
          console.error('[Student Layout] Failed to create student:', createError);
          // Check if it was a race condition
          const { data: retryStudent } = await supabase
            .from('students')
            .select('id')
            .eq('whop_user_id', userId)
            .eq('creator_id', creatorId)
            .single();

          if (!retryStudent) {
            // Still failed - log but continue (student record is nice-to-have)
            console.error('[Student Layout] Failed to create student even on retry');
          } else {
            console.log('[Student Layout] Found student on retry:', retryStudent.id);
          }
        } else {
          console.log('[Student Layout] Created new student record');
        }
      } else {
        console.log('[Student Layout] Found existing student:', existingStudent.id);
      }
    } catch (error) {
      console.error('[Student Layout] Failed to fetch user/experience data:', error);
      redirect(`/auth-error?reason=access_check_failed&error=${encodeURIComponent(String(error))}`);
    }
  }

  // Use the Whop user ID as the student ID for our database
  const studentId = userId;

  return (
    <div className="min-h-screen bg-gray-1">
      {/* Navigation */}
      <nav className="border-b border-gray-a4 bg-gray-2">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo / Brand */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-9 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <span className="font-semibold text-gray-12">Chronos</span>
            </div>

            {/* Navigation Links */}
            <div className="flex items-center gap-1">
              <Link
                href={`/experiences/${experienceId}/courses`}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-11 hover:text-gray-12 hover:bg-gray-a3 transition-colors"
              >
                <BookOpen className="w-4 h-4" />
                <span className="text-sm font-medium">Courses</span>
              </Link>
              <Link
                href={`/experiences/${experienceId}/chat`}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-11 hover:text-gray-12 hover:bg-gray-a3 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="text-sm font-medium">AI Chat</span>
              </Link>
            </div>

            {/* User Info */}
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
      </nav>

      {/* Experience Header */}
      <div className="border-b border-gray-a4 bg-gray-2">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-a4 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-purple-11" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-12">{(experience as any).name || 'Learning Experience'}</h2>
              <p className="text-sm text-gray-11">Student Dashboard</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Pass context to client components via data attributes */}
      <script
        id="student-context"
        type="application/json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            studentId,
            creatorId,
            experienceId,
          }),
        }}
      />
    </div>
  );
}
