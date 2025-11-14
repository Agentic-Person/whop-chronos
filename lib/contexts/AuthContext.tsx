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
  session: WhopSession;
}

/**
 * AuthContext provides authentication state across the app
 * Uses real Whop OAuth session data
 */
export function AuthProvider({ children, session }: AuthProviderProps) {
  const value: AuthContextType = {
    creatorId: session.user.id,
    userId: session.user.id,
    isAuthenticated: true,
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
