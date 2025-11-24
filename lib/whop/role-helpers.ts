/**
 * Client-safe Role Helpers for Chronos
 *
 * This file contains ONLY client-safe functions that don't require
 * server-side API access. Import this in client components instead
 * of the full roles.ts file.
 */

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
  companyId?: string;
  membershipId?: string;
  productIds?: string[];
}

// ============================================================================
// Routing Helpers (Client-Safe)
// ============================================================================

/**
 * Get default dashboard route for a user based on their role
 */
export function getDefaultDashboardRoute(role: UserRole): string {
  switch (role) {
    case 'creator':
      return '/dashboard/creator/overview';
    case 'student':
      return '/dashboard/student/courses';
    case 'both':
      return '/dashboard/creator/overview';
    case 'none':
      return '/';
    default:
      return '/';
  }
}

/**
 * Check if user has access to creator dashboard
 */
export function canAccessCreatorDashboard(role: UserRole): boolean {
  return role === 'creator' || role === 'both';
}

/**
 * Check if user has access to student dashboard
 */
export function canAccessStudentDashboard(role: UserRole): boolean {
  return role === 'student' || role === 'both';
}

/**
 * Check if user has any valid role (not 'none')
 */
export function hasAnyAccess(role: UserRole): boolean {
  return role !== 'none';
}
