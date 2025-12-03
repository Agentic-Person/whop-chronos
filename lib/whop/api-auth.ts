/**
 * API Route Authentication Helper
 * Provides JWT validation for protected API routes
 *
 * Security Layer:
 * - Validates Whop JWT tokens from request headers
 * - Verifies creator ownership before allowing access
 * - Prevents unauthorized access to other creators' data
 * - Supports DEV_BYPASS_AUTH for local testing
 *
 * Usage:
 * ```typescript
 * import { validateApiAuth, verifyCreatorOwnership } from '@/lib/whop/api-auth';
 *
 * const auth = await validateApiAuth();
 * if (!auth.userId && !auth.isDevBypass) {
 *   return Response.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
 * }
 *
 * const ownership = await verifyCreatorOwnership(auth.userId!, creatorId, auth.isDevBypass);
 * if (!ownership.valid) {
 *   return Response.json({ error: ownership.error }, { status: 403 });
 * }
 * ```
 */

import { headers } from 'next/headers';
import { whopsdk } from '@/lib/whop-sdk';
import { getServiceSupabase } from '@/lib/db/client';

const DEV_BYPASS_AUTH = process.env['DEV_BYPASS_AUTH'] === 'true';

export interface AuthResult {
  userId: string | null;
  creatorId: string | null;
  error: string | null;
  isDevBypass: boolean;
}

/**
 * Validate the Whop JWT token from request headers
 * Returns userId if valid, null if not
 *
 * In development mode (DEV_BYPASS_AUTH=true), returns a test user ID
 * In production, validates the JWT token from the Authorization header
 */
export async function validateApiAuth(): Promise<AuthResult> {
  if (DEV_BYPASS_AUTH) {
    console.log('[API Auth] DEV_BYPASS_AUTH enabled - skipping authentication');
    return {
      userId: 'user_test_00000000000000',
      creatorId: null, // Will be looked up or passed
      error: null,
      isDevBypass: true,
    };
  }

  try {
    const headersList = await headers();

    // Verify the JWT token using Whop SDK
    const result = await whopsdk.verifyUserToken(headersList);

    if (!result.userId) {
      console.error('[API Auth] JWT validation succeeded but no userId found');
      return {
        userId: null,
        creatorId: null,
        error: 'Invalid token - no user ID',
        isDevBypass: false,
      };
    }

    console.log('[API Auth] JWT validated successfully for user:', result.userId);

    return {
      userId: result.userId,
      creatorId: null,
      error: null,
      isDevBypass: false,
    };
  } catch (error) {
    console.error('[API Auth] JWT validation failed:', error);
    return {
      userId: null,
      creatorId: null,
      error: error instanceof Error ? error.message : 'Authentication failed',
      isDevBypass: false,
    };
  }
}

/**
 * Verify that the authenticated user owns the given creator ID
 *
 * This prevents a user from accessing another creator's data by
 * checking that the whop_user_id in the creators table matches
 * the authenticated user's ID.
 *
 * In development mode (DEV_BYPASS_AUTH=true), always returns valid
 */
export async function verifyCreatorOwnership(
  userId: string,
  creatorId: string,
  isDevBypass: boolean
): Promise<{ valid: boolean; error: string | null }> {
  if (isDevBypass) {
    console.log('[API Auth] DEV_BYPASS_AUTH enabled - skipping ownership check');
    return { valid: true, error: null };
  }

  const supabase = getServiceSupabase();
  const { data: creator, error: dbError } = await supabase
    .from('creators')
    .select('id, whop_user_id')
    .eq('id', creatorId)
    .single();

  if (dbError) {
    console.error('[API Auth] Database error during ownership check:', dbError);
    return { valid: false, error: 'Database error during authorization' };
  }

  if (!creator) {
    console.error('[API Auth] Creator not found:', creatorId);
    return { valid: false, error: 'Creator not found' };
  }

  if (creator.whop_user_id !== userId) {
    console.error(
      '[API Auth] Ownership mismatch. Expected user:',
      userId,
      'but creator belongs to:',
      creator.whop_user_id
    );
    return { valid: false, error: 'Not authorized to access this creator' };
  }

  console.log('[API Auth] Ownership verified for creator:', creatorId);
  return { valid: true, error: null };
}

/**
 * Verify that the authenticated user owns the given student ID
 *
 * Similar to verifyCreatorOwnership but for student resources
 */
export async function verifyStudentOwnership(
  userId: string,
  studentId: string,
  isDevBypass: boolean
): Promise<{ valid: boolean; error: string | null }> {
  if (isDevBypass) {
    console.log('[API Auth] DEV_BYPASS_AUTH enabled - skipping student ownership check');
    return { valid: true, error: null };
  }

  const supabase = getServiceSupabase();
  const { data: student, error: dbError } = await supabase
    .from('students')
    .select('id, whop_user_id')
    .eq('id', studentId)
    .single();

  if (dbError) {
    console.error('[API Auth] Database error during student ownership check:', dbError);
    return { valid: false, error: 'Database error during authorization' };
  }

  if (!student) {
    console.error('[API Auth] Student not found:', studentId);
    return { valid: false, error: 'Student not found' };
  }

  if (student.whop_user_id !== userId) {
    console.error(
      '[API Auth] Student ownership mismatch. Expected user:',
      userId,
      'but student belongs to:',
      student.whop_user_id
    );
    return { valid: false, error: 'Not authorized to access this student' };
  }

  console.log('[API Auth] Student ownership verified for:', studentId);
  return { valid: true, error: null };
}

/**
 * Combined auth helper for routes that need both authentication and creator ownership
 *
 * Usage:
 * ```typescript
 * const auth = await requireCreatorAuth(creatorId);
 * if (!auth.valid) {
 *   return Response.json({ error: auth.error }, { status: auth.status });
 * }
 * // Proceed with the request - user is authenticated and owns the creator
 * ```
 */
export async function requireCreatorAuth(creatorId: string): Promise<{
  valid: boolean;
  error: string | null;
  status: number;
  userId: string | null;
}> {
  // Step 1: Validate JWT
  const auth = await validateApiAuth();

  if (!auth.userId && !auth.isDevBypass) {
    return {
      valid: false,
      error: auth.error || 'Unauthorized',
      status: 401,
      userId: null,
    };
  }

  // Step 2: Verify creator ownership
  if (!auth.isDevBypass && creatorId) {
    const ownership = await verifyCreatorOwnership(auth.userId!, creatorId, auth.isDevBypass);
    if (!ownership.valid) {
      return {
        valid: false,
        error: ownership.error,
        status: 403,
        userId: auth.userId,
      };
    }
  }

  return {
    valid: true,
    error: null,
    status: 200,
    userId: auth.userId,
  };
}

/**
 * Combined auth helper for routes that need both authentication and student ownership
 */
export async function requireStudentAuth(studentId: string): Promise<{
  valid: boolean;
  error: string | null;
  status: number;
  userId: string | null;
}> {
  // Step 1: Validate JWT
  const auth = await validateApiAuth();

  if (!auth.userId && !auth.isDevBypass) {
    return {
      valid: false,
      error: auth.error || 'Unauthorized',
      status: 401,
      userId: null,
    };
  }

  // Step 2: Verify student ownership
  if (!auth.isDevBypass && studentId) {
    const ownership = await verifyStudentOwnership(auth.userId!, studentId, auth.isDevBypass);
    if (!ownership.valid) {
      return {
        valid: false,
        error: ownership.error,
        status: 403,
        userId: auth.userId,
      };
    }
  }

  return {
    valid: true,
    error: null,
    status: 200,
    userId: auth.userId,
  };
}
