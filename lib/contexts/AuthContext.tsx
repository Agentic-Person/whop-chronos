'use client';

import React, { createContext, useContext } from 'react';
import type { WhopSession } from '@/lib/whop/types';

export interface AuthContextType {
  creatorId: string;
  userId: string;
  isAuthenticated: boolean;
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
 */
export function AuthProvider({ children, session }: AuthProviderProps) {
  // Dev mode: Use mock test user IDs when DEV_BYPASS_AUTH is true
  const isDevMode = process.env.NODE_ENV === 'development' &&
                    process.env['NEXT_PUBLIC_DEV_BYPASS_AUTH'] === 'true';

  let value: AuthContextType;

  if (isDevMode && !session) {
    // Mock auth values for development testing
    value = {
      creatorId: '00000000-0000-0000-0000-000000000001', // TEST_CREATOR_ID from seed
      userId: '00000000-0000-0000-0000-000000000002',    // TEST_STUDENT_ID from seed
      isAuthenticated: true,
    };
  } else if (session) {
    // Production: Use real Whop session
    value = {
      creatorId: session.user.id,
      userId: session.user.id,
      isAuthenticated: true,
    };
  } else {
    // No session - unauthenticated state (for static pages, public routes, etc.)
    value = {
      creatorId: undefined,
      userId: undefined,
      isAuthenticated: false,
    };
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
