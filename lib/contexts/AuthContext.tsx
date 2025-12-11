'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { WhopSession } from '@/lib/whop/types';
import { type RoleDetectionResult, type UserRole } from '@/lib/whop/role-helpers';
import { TEST_CREATOR_ID, TEST_STUDENT_ID } from '@/lib/whop/test-constants';

export interface AuthContextType {
  // Existing auth fields
  creatorId: string | undefined;
  userId: string | undefined;
  isAuthenticated: boolean;

  // NEW: Role detection fields
  role: UserRole | null;
  roleData: RoleDetectionResult | null;
  isDetectingRole: boolean;
  currentDashboard: 'creator' | 'student' | null;

  // NEW: Role switching (for dual-role users)
  switchToCreatorDashboard: () => void;
  switchToStudentDashboard: () => void;
  canSwitchRole: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
  session?: WhopSession; // Optional in dev mode
}

/**
 * AuthContext provides authentication state across the app
 *
 * Production: Uses real Whop OAuth session data
 * Development (DEV_BYPASS_AUTH=true): Uses mock test user IDs
 *
 * Enhanced with role detection for creator/student dashboard routing
 */
export function AuthProvider({ children, session }: AuthProviderProps) {
  const router = useRouter();

  // Dev/Test mode: Use mock test user IDs when DEV_BYPASS_AUTH is true
  // NOTE: This works in BOTH development AND production to allow testing before Whop approval
  const isDevMode = process.env['NEXT_PUBLIC_DEV_BYPASS_AUTH'] === 'true';

  // Role detection state
  const [roleData, setRoleData] = useState<RoleDetectionResult | null>(null);
  const [isDetectingRole, setIsDetectingRole] = useState(false);
  const [currentDashboard, setCurrentDashboard] = useState<'creator' | 'student' | null>(null);

  // Compute base auth values (memoized to prevent infinite re-renders)
  const baseAuthData = useMemo(() => {
    // Dev/Test mode takes priority - always use test IDs when DEV_BYPASS_AUTH is true
    if (isDevMode) {
      // Mock auth values for development/production testing
      // creatorId = the creator whose content is being accessed
      // userId = the student/user accessing the content
      // These IDs MUST match the test-constants.ts file
      return {
        creatorId: TEST_CREATOR_ID, // UUID of creator with test content
        userId: TEST_STUDENT_ID,    // Whop user ID for test student
        isAuthenticated: true,
      };
    } else if (session) {
      // Production: Use real Whop session
      // Note: In production, creatorId should come from the course/video context,
      // not the session. For now, userId represents the logged-in user.
      return {
        creatorId: session.user.id, // TODO: This should be the creator's ID, not user's
        userId: session.user.id,
        isAuthenticated: true,
      };
    } else {
      // No session - unauthenticated state (for static pages, public routes, etc.)
      return {
        creatorId: undefined,
        userId: undefined,
        isAuthenticated: false,
      };
    }
  }, [isDevMode, session]);

  // Detect role when user loads
  useEffect(() => {
    async function loadUserRole() {
      // Only detect role if user is authenticated
      if (!baseAuthData.isAuthenticated || !baseAuthData.userId) {
        setRoleData(null);
        setCurrentDashboard(null);
        return;
      }

      setIsDetectingRole(true);
      try {
        // Detect role via API (keeps server-only code on server)
        const response = await fetch('/api/auth/role', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: baseAuthData.userId }),
        });

        if (!response.ok) {
          throw new Error('Failed to detect user role');
        }

        const result: RoleDetectionResult = await response.json();
        setRoleData(result);

        // Set default dashboard based on role
        if (result.role === 'creator') {
          setCurrentDashboard('creator');
        } else if (result.role === 'student') {
          setCurrentDashboard('student');
        } else if (result.role === 'both') {
          // Check localStorage for user preference
          if (typeof window !== 'undefined') {
            const savedPreference = localStorage.getItem('chronos_dashboard_preference');
            setCurrentDashboard((savedPreference as 'creator' | 'student') || 'creator');
          } else {
            setCurrentDashboard('creator'); // Default to creator if no localStorage
          }
        } else {
          // role === 'none'
          setCurrentDashboard(null);
        }
      } catch (error) {
        console.error('Failed to detect user role:', error);
        // On error, don't block auth - just log and continue without role data
        setRoleData(null);
      } finally {
        setIsDetectingRole(false);
      }
    }

    loadUserRole();
  }, [baseAuthData.isAuthenticated, baseAuthData.userId]);

  // Role switching functions
  const switchToCreatorDashboard = useCallback(() => {
    if (roleData?.role === 'both' || roleData?.role === 'creator') {
      setCurrentDashboard('creator');
      if (typeof window !== 'undefined') {
        localStorage.setItem('chronos_dashboard_preference', 'creator');
      }
      router.push('/dashboard/creator/overview');
    }
  }, [roleData, router]);

  const switchToStudentDashboard = useCallback(() => {
    if (roleData?.role === 'both' || roleData?.role === 'student') {
      setCurrentDashboard('student');
      if (typeof window !== 'undefined') {
        localStorage.setItem('chronos_dashboard_preference', 'student');
      }
      router.push('/dashboard/student/courses');
    }
  }, [roleData, router]);

  const canSwitchRole = roleData?.role === 'both';

  const value: AuthContextType = {
    // Existing fields
    ...baseAuthData,

    // New role detection fields
    role: roleData?.role || null,
    roleData,
    isDetectingRole,
    currentDashboard,

    // Role switching
    switchToCreatorDashboard,
    switchToStudentDashboard,
    canSwitchRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
