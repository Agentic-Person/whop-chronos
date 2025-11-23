/**
 * Whop Native Authentication
 *
 * This module provides authentication helpers for Whop embedded apps.
 * Use these functions instead of the deprecated OAuth flow.
 *
 * How it works:
 * 1. Whop embeds your app in an iframe
 * 2. Whop automatically injects x-whop-user-token header
 * 3. Use verifyUserToken() to decode and validate the JWT
 * 4. Use checkAccess() to verify user permissions
 *
 * @see https://docs.whop.com/developer/guides/authentication
 */

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { whopsdk } from "@/lib/whop-sdk";

// ============================================================================
// Types
// ============================================================================

export interface WhopAuthResult {
  userId: string | null;
  error: string | null;
}

export interface WhopAccessResult {
  userId: string;
  access: {
    access_level: "admin" | "customer" | "no_access";
    has_access: boolean;
  };
}

export interface WhopUserContext {
  userId: string;
  user: Awaited<ReturnType<typeof whopsdk.users.retrieve>>;
  access: Awaited<ReturnType<typeof whopsdk.users.checkAccess>>;
  isCreator: boolean;
  isStudent: boolean;
}

// ============================================================================
// Test Mode Configuration
// ============================================================================

const TEST_MODE = process.env['DEV_BYPASS_AUTH'] === 'true';
const TEST_USER_ID = 'user_test_00000000000000';
const TEST_COMPANY_ID = 'biz_test_00000000000000';
const TEST_EXPERIENCE_ID = 'exp_test_00000000000000';

if (TEST_MODE) {
  console.log('⚠️  [Whop Native Auth] Test mode enabled - authentication bypassed');
  console.log(`   Test User ID: ${TEST_USER_ID}`);
}

// ============================================================================
// Core Authentication Functions
// ============================================================================

/**
 * Verify user token from Whop iframe
 *
 * Use this in Server Components and API Routes to authenticate the user.
 * The token is automatically injected by Whop when your app runs in their iframe.
 *
 * @example
 * ```typescript
 * const { userId, error } = await verifyWhopUser();
 * if (!userId) {
 *   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 * }
 * ```
 */
export async function verifyWhopUser(): Promise<WhopAuthResult> {
  // Test mode bypass for local development
  if (TEST_MODE) {
    return { userId: TEST_USER_ID, error: null };
  }

  try {
    const headersList = await headers();
    const { userId } = await whopsdk.verifyUserToken(headersList);

    console.log('[Whop Auth] User verified:', userId);
    return { userId, error: null };
  } catch (error) {
    console.error('[Whop Auth] Token verification failed:', error);
    return {
      userId: null,
      error: error instanceof Error ? error.message : 'Authentication failed',
    };
  }
}

/**
 * Require authentication - throws/redirects if not authenticated
 *
 * Use this at the top of Server Components or layouts to protect pages.
 * Automatically redirects to auth-error page if authentication fails.
 *
 * @example
 * ```typescript
 * export default async function ProtectedPage() {
 *   const userId = await requireWhopAuth();
 *   // User is guaranteed to be authenticated here
 * }
 * ```
 */
export async function requireWhopAuth(): Promise<string> {
  const { userId, error } = await verifyWhopUser();

  if (!userId) {
    console.error('[Whop Auth] Authentication required but failed:', error);
    redirect(`/auth-error?reason=unauthenticated&error=${encodeURIComponent(error || 'Unknown error')}`);
  }

  return userId;
}

// ============================================================================
// Access Control Functions
// ============================================================================

/**
 * Check if user is a creator (admin) for a company
 *
 * Use this to protect creator-only routes like dashboards and settings.
 * Redirects to auth-error if user is not an admin of the company.
 *
 * @param companyId - The Whop company ID (from route params)
 *
 * @example
 * ```typescript
 * export default async function CreatorDashboard({ params }) {
 *   const { companyId } = await params;
 *   const { userId, access } = await requireCreatorAccess(companyId);
 *   // User is guaranteed to be a creator here
 * }
 * ```
 */
export async function requireCreatorAccess(companyId: string): Promise<WhopAccessResult> {
  // Test mode bypass
  if (TEST_MODE) {
    return {
      userId: TEST_USER_ID,
      access: { access_level: 'admin', has_access: true },
    };
  }

  const userId = await requireWhopAuth();

  try {
    const access = await whopsdk.users.checkAccess(companyId, { id: userId });

    console.log('[Whop Auth] Access check for company:', {
      companyId,
      userId,
      accessLevel: access.access_level,
    });

    if (access.access_level !== 'admin') {
      console.warn('[Whop Auth] User is not admin for company:', companyId);
      redirect(`/auth-error?reason=not_admin&company=${companyId}`);
    }

    return { userId, access };
  } catch (error) {
    console.error('[Whop Auth] Failed to check company access:', error);
    redirect(`/auth-error?reason=access_check_failed&error=${encodeURIComponent(String(error))}`);
  }
}

/**
 * Check if user has customer access to an experience
 *
 * Use this to protect student-only routes like course content and chat.
 * Redirects to auth-error if user doesn't have access to the experience.
 *
 * @param experienceId - The Whop experience ID (from route params)
 *
 * @example
 * ```typescript
 * export default async function StudentCourse({ params }) {
 *   const { experienceId } = await params;
 *   const { userId, access } = await requireStudentAccess(experienceId);
 *   // User is guaranteed to have access here
 * }
 * ```
 */
export async function requireStudentAccess(experienceId: string): Promise<WhopAccessResult> {
  // Test mode bypass
  if (TEST_MODE) {
    return {
      userId: TEST_USER_ID,
      access: { access_level: 'customer', has_access: true },
    };
  }

  const userId = await requireWhopAuth();

  try {
    const access = await whopsdk.users.checkAccess(experienceId, { id: userId });

    console.log('[Whop Auth] Access check for experience:', {
      experienceId,
      userId,
      accessLevel: access.access_level,
      hasAccess: access.has_access,
    });

    if (!access.has_access) {
      console.warn('[Whop Auth] User does not have access to experience:', experienceId);
      redirect(`/auth-error?reason=no_access&experience=${experienceId}`);
    }

    return { userId, access };
  } catch (error) {
    console.error('[Whop Auth] Failed to check experience access:', error);
    redirect(`/auth-error?reason=access_check_failed&error=${encodeURIComponent(String(error))}`);
  }
}

/**
 * Check access without redirecting
 *
 * Use this when you need to check access but handle the result yourself.
 * Returns the access result or null if check fails.
 *
 * @param resourceId - Company ID or Experience ID to check access for
 */
export async function checkAccess(resourceId: string): Promise<WhopAccessResult | null> {
  // Test mode bypass
  if (TEST_MODE) {
    return {
      userId: TEST_USER_ID,
      access: { access_level: 'admin', has_access: true },
    };
  }

  const { userId, error } = await verifyWhopUser();

  if (!userId) {
    console.error('[Whop Auth] Cannot check access - not authenticated:', error);
    return null;
  }

  try {
    const access = await whopsdk.users.checkAccess(resourceId, { id: userId });
    return { userId, access };
  } catch (error) {
    console.error('[Whop Auth] Access check failed:', error);
    return null;
  }
}

// ============================================================================
// User Context Functions
// ============================================================================

/**
 * Get full user context with profile data
 *
 * Use this when you need both the user profile and access information.
 * Useful for displaying user info in the UI.
 *
 * @param resourceId - Company ID or Experience ID for access check
 *
 * @example
 * ```typescript
 * const context = await getWhopUserContext(companyId);
 * console.log(context.user.email); // User's email
 * console.log(context.isCreator);  // true if admin
 * ```
 */
export async function getWhopUserContext(resourceId: string): Promise<WhopUserContext> {
  // Test mode bypass
  if (TEST_MODE) {
    return {
      userId: TEST_USER_ID,
      user: {
        id: TEST_USER_ID,
        email: 'test@chronos.ai',
        username: 'test_user',
        profile_pic_url: null,
      } as Awaited<ReturnType<typeof whopsdk.users.retrieve>>,
      access: {
        access_level: 'admin',
        has_access: true,
      } as Awaited<ReturnType<typeof whopsdk.users.checkAccess>>,
      isCreator: true,
      isStudent: false,
    };
  }

  const userId = await requireWhopAuth();

  const [user, access] = await Promise.all([
    whopsdk.users.retrieve(userId),
    whopsdk.users.checkAccess(resourceId, { id: userId }),
  ]);

  return {
    userId,
    user,
    access,
    isCreator: access.access_level === 'admin',
    isStudent: access.access_level === 'customer',
  };
}

/**
 * Get the current user without access check
 *
 * Use this when you just need user info but don't need to verify access.
 */
export async function getCurrentWhopUser() {
  // Test mode bypass
  if (TEST_MODE) {
    return {
      id: TEST_USER_ID,
      email: 'test@chronos.ai',
      username: 'test_user',
      profile_pic_url: null,
    };
  }

  const userId = await requireWhopAuth();
  return await whopsdk.users.retrieve(userId);
}

// ============================================================================
// Company & Experience Helpers
// ============================================================================

/**
 * Get company details
 *
 * @param companyId - The Whop company ID
 */
export async function getCompany(companyId: string) {
  // Test mode bypass
  if (TEST_MODE) {
    return {
      id: TEST_COMPANY_ID,
      title: 'Test Company',
      image_url: null,
    };
  }

  return await whopsdk.companies.retrieve(companyId);
}

/**
 * Get experience details
 *
 * @param experienceId - The Whop experience ID
 */
export async function getExperience(experienceId: string) {
  // Test mode bypass
  if (TEST_MODE) {
    return {
      id: TEST_EXPERIENCE_ID,
      name: 'Test Experience',
    };
  }

  return await whopsdk.experiences.retrieve(experienceId);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Determine user role based on access level
 *
 * @param access - The access result from checkAccess
 * @returns 'creator' | 'student' | 'none'
 */
export function getUserRole(access: { access_level: string; has_access: boolean }): 'creator' | 'student' | 'none' {
  if (access.access_level === 'admin') {
    return 'creator';
  }
  if (access.access_level === 'customer' && access.has_access) {
    return 'student';
  }
  return 'none';
}

/**
 * Check if running in test mode
 */
export function isTestMode(): boolean {
  return TEST_MODE;
}
