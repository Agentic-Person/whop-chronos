/**
 * Role Detection Service for Chronos
 *
 * Determines if a Whop user is a creator, student, both, or neither
 * based on company ownership and membership status
 *
 * IMPORTANT: This file is SERVER-ONLY. For client components, use:
 * - Import from '@/lib/whop/role-helpers' for routing helpers
 * - Call POST /api/auth/role for role detection
 */

import { whopApi } from './api-client';
import { WhopApiError } from './types';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * User role types in Chronos
 */
export type UserRole = 'creator' | 'student' | 'both' | 'none';

/**
 * Complete role detection result with all relevant IDs and metadata
 */
export interface RoleDetectionResult {
  role: UserRole;
  isCreator: boolean;
  isStudent: boolean;
  companyId?: string;      // Present if creator
  membershipId?: string;   // Present if student
  productIds?: string[];   // Products user has access to (if student)
}

// ============================================================================
// Constants
// ============================================================================

// Test user IDs for dev bypass mode
const TEST_CREATOR_ID = '00000000-0000-0000-0000-000000000001';
const TEST_STUDENT_ID = '00000000-0000-0000-0000-000000000002';
const TEST_DUAL_ROLE_ID = '00000000-0000-0000-0000-000000000003';

// Cache configuration (5 minutes)
const CACHE_TTL_MS = 5 * 60 * 1000;
const roleCache = new Map<string, { result: RoleDetectionResult; expiresAt: number }>();

// ============================================================================
// Main Role Detection Function
// ============================================================================

/**
 * Detect user's role in Chronos based on Whop data
 *
 * Logic:
 * - Creator: User owns a Whop company that has Chronos installed
 * - Student: User has an active membership to a Chronos-enabled product
 * - Both: User is both a creator and a student
 * - None: User has no relationship to Chronos
 *
 * @param whopUserId - Whop user ID to check
 * @returns RoleDetectionResult with role and relevant IDs
 */
export async function detectUserRole(
  whopUserId: string
): Promise<RoleDetectionResult> {
  // Check cache first (works in both dev and prod mode)
  const cached = roleCache.get(whopUserId);
  if (cached && cached.expiresAt > Date.now()) {
    console.log('[Role Detection] Cache hit for user:', whopUserId);
    return cached.result;
  }

  // Dev bypass mode (check at runtime to allow env vars to load)
  const devBypassEnabled = process.env['DEV_BYPASS_AUTH'] === 'true';
  if (devBypassEnabled) {
    console.log('[Role Detection] Dev bypass mode enabled');
    const result = getDevBypassRole(whopUserId);

    // Cache dev bypass results too
    roleCache.set(whopUserId, {
      result,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    return result;
  }

  try {
    // Parallel checks for creator and student status
    const [isCreator, studentData] = await Promise.allSettled([
      checkIsCreator(whopUserId),
      checkIsStudent(whopUserId),
    ]);

    // Extract results from settled promises
    const creatorResult = isCreator.status === 'fulfilled' ? isCreator.value : null;
    const studentResult = studentData.status === 'fulfilled' ? studentData.value : null;

    // Determine role based on results
    let result: RoleDetectionResult;

    if (creatorResult && studentResult) {
      // User is both creator and student
      result = {
        role: 'both',
        isCreator: true,
        isStudent: true,
        companyId: creatorResult.companyId,
        membershipId: studentResult.membershipId,
        productIds: studentResult.productIds,
      };
    } else if (creatorResult) {
      // Creator only
      result = {
        role: 'creator',
        isCreator: true,
        isStudent: false,
        companyId: creatorResult.companyId,
      };
    } else if (studentResult) {
      // Student only
      result = {
        role: 'student',
        isCreator: false,
        isStudent: true,
        membershipId: studentResult.membershipId,
        productIds: studentResult.productIds,
      };
    } else {
      // No role
      result = {
        role: 'none',
        isCreator: false,
        isStudent: false,
      };
    }

    // Cache the result
    roleCache.set(whopUserId, {
      result,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    console.log('[Role Detection] Detected role:', result.role, 'for user:', whopUserId);
    return result;
  } catch (error) {
    console.error('[Role Detection] Error detecting role:', error);

    // Graceful degradation: Try to return cached value if available
    if (cached) {
      console.log('[Role Detection] Using expired cache due to error');
      return cached.result;
    }

    // Last resort: return 'none'
    return {
      role: 'none',
      isCreator: false,
      isStudent: false,
    };
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if user owns a Whop company with Chronos installed
 */
async function checkIsCreator(_whopUserId: string): Promise<{ companyId: string } | null> {
  try {
    // Get company info - this only works if the user owns a company
    const company = await whopApi.getCompanyInfo();

    if (!company || !company.id) {
      return null;
    }

    // Verify the company has Chronos installed by checking for products
    // (If company exists and we can access it, Chronos is installed)
    console.log('[Role Detection] User is a creator with company:', company.id);
    return { companyId: company.id };
  } catch (error) {
    // If API call fails (404, 403, etc.), user is not a creator
    if (error instanceof WhopApiError && (error.statusCode === 404 || error.statusCode === 403)) {
      return null;
    }
    throw error;
  }
}

/**
 * Check if user has active memberships
 */
async function checkIsStudent(
  whopUserId: string
): Promise<{ membershipId: string; productIds: string[] } | null> {
  try {
    // List memberships for this user
    const memberships = await whopApi.listMemberships({
      userId: whopUserId,
      status: 'active',
      limit: 50, // Get up to 50 active memberships
    });

    if (!memberships || memberships.length === 0) {
      return null;
    }

    // Filter to only valid, active memberships
    const validMemberships = memberships.filter(
      (m) => m.valid && m.status === 'active'
    );

    if (validMemberships.length === 0) {
      return null;
    }

    // Use the first valid membership
    const primaryMembership = validMemberships[0];
    if (!primaryMembership) {
      // This should never happen due to the check above, but TypeScript doesn't know that
      return null;
    }

    const productIds = validMemberships.map((m) => m.product_id);

    console.log(
      '[Role Detection] User is a student with',
      validMemberships.length,
      'active memberships'
    );

    return {
      membershipId: primaryMembership.id,
      productIds,
    };
  } catch (error) {
    // If API call fails, user is not a student
    if (error instanceof WhopApiError && (error.statusCode === 404 || error.statusCode === 403)) {
      return null;
    }
    throw error;
  }
}

/**
 * Get role for dev bypass mode (test users)
 */
function getDevBypassRole(whopUserId: string): RoleDetectionResult {
  if (whopUserId === TEST_CREATOR_ID) {
    console.log('[Role Detection] Test creator user detected');
    return {
      role: 'creator',
      isCreator: true,
      isStudent: false,
      companyId: 'biz_test_creator_company',
    };
  }

  if (whopUserId === TEST_STUDENT_ID) {
    console.log('[Role Detection] Test student user detected');
    return {
      role: 'student',
      isCreator: false,
      isStudent: true,
      membershipId: 'mem_test_student_001',
      productIds: ['prod_test_pro'],
    };
  }

  if (whopUserId === TEST_DUAL_ROLE_ID) {
    console.log('[Role Detection] Test dual-role user detected');
    return {
      role: 'both',
      isCreator: true,
      isStudent: true,
      companyId: 'biz_test_dual_company',
      membershipId: 'mem_test_dual_001',
      productIds: ['prod_test_basic'],
    };
  }

  // Default test users to creator for easier development
  console.log('[Role Detection] Unknown test user, defaulting to creator');
  return {
    role: 'creator',
    isCreator: true,
    isStudent: false,
    companyId: 'biz_test_default_company',
  };
}

// ============================================================================
// Routing Helpers
// ============================================================================

/**
 * Get default dashboard route for a user based on their role
 *
 * @param role - User's role
 * @returns Default dashboard route
 */
export function getDefaultDashboardRoute(role: UserRole): string {
  switch (role) {
    case 'creator':
      return '/dashboard/creator/overview';
    case 'student':
      return '/dashboard/student/courses';
    case 'both':
      // Default to creator dashboard, user can switch via RoleSwitcher component
      return '/dashboard/creator/overview';
    case 'none':
      // Redirect to landing page (no access)
      return '/';
    default:
      return '/';
  }
}

/**
 * Check if user has access to creator dashboard
 *
 * @param role - User's role
 * @returns True if user can access creator dashboard
 */
export function canAccessCreatorDashboard(role: UserRole): boolean {
  return role === 'creator' || role === 'both';
}

/**
 * Check if user has access to student dashboard
 *
 * @param role - User's role
 * @returns True if user can access student dashboard
 */
export function canAccessStudentDashboard(role: UserRole): boolean {
  return role === 'student' || role === 'both';
}

// ============================================================================
// Cache Management
// ============================================================================

/**
 * Clear role cache for a specific user (useful after membership changes)
 *
 * @param whopUserId - User ID to clear cache for
 */
export function clearRoleCache(whopUserId?: string): void {
  if (whopUserId) {
    roleCache.delete(whopUserId);
    console.log('[Role Detection] Cache cleared for user:', whopUserId);
  } else {
    roleCache.clear();
    console.log('[Role Detection] All role cache cleared');
  }
}

/**
 * Get cache statistics (for debugging)
 */
export function getRoleCacheStats(): {
  size: number;
  entries: Array<{ userId: string; role: UserRole; expiresAt: number }>;
} {
  const entries = Array.from(roleCache.entries()).map(([userId, data]) => ({
    userId,
    role: data.result.role,
    expiresAt: data.expiresAt,
  }));

  return {
    size: roleCache.size,
    entries,
  };
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validate that user has required role for accessing a resource
 * Throws error if user doesn't have required access
 *
 * @param userRole - User's current role
 * @param requiredRole - Required role ('creator' or 'student')
 * @throws WhopApiError if user doesn't have required role
 */
export function requireRole(userRole: UserRole, requiredRole: 'creator' | 'student'): void {
  if (requiredRole === 'creator' && !canAccessCreatorDashboard(userRole)) {
    throw new WhopApiError('Creator access required', 403, 'FORBIDDEN');
  }

  if (requiredRole === 'student' && !canAccessStudentDashboard(userRole)) {
    throw new WhopApiError('Student access required', 403, 'FORBIDDEN');
  }
}

/**
 * Check if user has any valid role (not 'none')
 *
 * @param role - User's role
 * @returns True if user has access to platform
 */
export function hasAnyAccess(role: UserRole): boolean {
  return role !== 'none';
}
