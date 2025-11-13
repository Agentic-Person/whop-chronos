'use client';

import React, { createContext, useContext } from 'react';

export interface AuthContextType {
  creatorId: string;
  userId: string;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * AuthContext provides authentication state across the app
 *
 * For development: Uses mock IDs when DEV_BYPASS_AUTH is enabled
 * For production: Will use Whop OAuth user data
 */
export function AuthProvider({ children }: AuthProviderProps) {
  // For development mode with bypass enabled, use mock creator ID
  // In production, this would come from Whop OAuth session
  const isDevelopment = process.env.NODE_ENV === 'development';
  const devBypass = process.env['DEV_BYPASS_AUTH'] === 'true';

  const value: AuthContextType = {
    // Use a consistent UUID for development
    creatorId: isDevelopment && devBypass
      ? '00000000-0000-0000-0000-000000000001'
      : '00000000-0000-0000-0000-000000000001', // TODO: Get from Whop session
    userId: isDevelopment && devBypass
      ? 'dev-user-001'
      : 'dev-user-001', // TODO: Get from Whop session
    isAuthenticated: true, // Always true when DEV_BYPASS_AUTH is enabled
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
