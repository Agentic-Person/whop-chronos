/**
 * Dashboard Router
 *
 * Entry point for /dashboard route that:
 * 1. Detects user role (creator, student, both, none)
 * 2. Auto-redirects to the correct dashboard
 * 3. Shows loading state during detection
 * 4. Handles errors gracefully
 *
 * Users should never manually see this page - it's a router only.
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { getDefaultDashboardRoute, type RoleDetectionResult } from '@/lib/whop/role-helpers';

export default function DashboardRouter() {
  const router = useRouter();
  const { userId, isAuthenticated } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function detectAndRedirect() {
      // Wait for auth to initialize
      if (userId === undefined) {
        return; // Still loading auth state
      }

      // Not authenticated - redirect to login
      if (!isAuthenticated || !userId) {
        router.push('/api/whop/auth/login');
        return;
      }

      try {
        setError(null);

        // Detect user role via API (keeps server-only code on server)
        const response = await fetch('/api/auth/role', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });

        if (!response.ok) {
          throw new Error('Failed to detect user role');
        }

        const roleResult: RoleDetectionResult = await response.json();

        // Get the default route for this role
        const defaultRoute = getDefaultDashboardRoute(roleResult.role);

        // Redirect to appropriate dashboard
        router.push(defaultRoute);
      } catch (err) {
        console.error('Role detection failed:', err);
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to determine your dashboard. Please try again.'
        );
      }
    }

    detectAndRedirect();
  }, [userId, isAuthenticated, router]);

  // Error state - show retry option
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md px-4">
          <div className="mb-6">
            <svg
              className="mx-auto h-12 w-12 text-destructive"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <h2 className="text-xl font-semibold mb-2 text-foreground">
            Unable to Load Dashboard
          </h2>

          <p className="text-destructive mb-6">
            {error}
          </p>

          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
          >
            Try Again
          </button>

          <p className="mt-4 text-sm text-muted-foreground">
            If the problem persists, please contact support.
          </p>
        </div>
      </div>
    );
  }

  // Loading state - show spinner during auth or role detection
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        {/* Animated spinner */}
        <div className="relative mx-auto mb-6">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-6 w-6 bg-background rounded-full" />
          </div>
        </div>

        <p className="text-lg font-medium text-foreground mb-2">
          Loading your dashboard...
        </p>

        <p className="text-sm text-muted-foreground">
          {userId === undefined
            ? 'Checking authentication...'
            : 'Detecting your role...'}
        </p>
      </div>
    </div>
  );
}
