/**
 * WhopContextRouter
 *
 * This component is THE KEY to making embedded apps work in Whop!
 *
 * It:
 * 1. Uses the @whop/iframe SDK to get context from Whop's parent window
 * 2. Extracts companyId/experienceId/viewType
 * 3. Redirects to the appropriate route with those parameters
 *
 * Without this, the app has NO WAY to know which company/experience it's for.
 *
 * Usage: Place this at your app's entry point routes (e.g., /dashboard, /experiences)
 *
 * IMPORTANT: Wraps itself with WhopIframeSdkProvider since useWhopContext requires it.
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { WhopIframeSdkProvider } from '@whop/react';
import { useWhopContext, extractCompanyId, type WhopUrlData } from '@/hooks/useWhopContext';

interface WhopContextRouterProps {
  /** Fallback UI while loading */
  loadingComponent?: React.ReactNode;
  /** UI to show if not running in Whop iframe */
  notEmbeddedComponent?: React.ReactNode;
  /** UI to show on error */
  errorComponent?: React.ReactNode;
  /** Children to render after context is loaded (optional - usually redirects instead) */
  children?: React.ReactNode;
}

/**
 * Inner router component that uses the hooks
 * Must be wrapped with WhopIframeSdkProvider
 */
function WhopContextRouterInner({
  loadingComponent,
  notEmbeddedComponent,
  errorComponent,
  children,
}: WhopContextRouterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { urlData, loading, error, isEmbedded } = useWhopContext();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (loading || redirecting) return;

    // Log what we received
    console.log('[WhopContextRouter] Context state:', {
      isEmbedded,
      urlData,
      error,
      pathname,
    });

    // Not in Whop iframe - handle differently
    if (!isEmbedded) {
      console.log('[WhopContextRouter] Not in Whop iframe - may need OAuth login');
      return;
    }

    // Error getting context
    if (error || !urlData) {
      console.error('[WhopContextRouter] Failed to get context:', error);
      return;
    }

    // We have context! Now route appropriately
    const { viewType, experienceId, companyRoute } = urlData;
    const companyId = extractCompanyId(companyRoute);

    console.log('[WhopContextRouter] Routing based on:', {
      viewType,
      experienceId,
      companyId,
    });

    setRedirecting(true);

    // Route based on viewType
    switch (viewType) {
      case 'admin':
        // Creator/admin view - route to dashboard with company ID
        if (companyId) {
          const dashboardPath = `/dashboard/${companyId}/overview`;
          console.log('[WhopContextRouter] Redirecting admin to:', dashboardPath);
          router.replace(dashboardPath);
        } else {
          console.error('[WhopContextRouter] Admin view but no companyId found');
          router.replace('/auth-error?reason=no_company_id');
        }
        break;

      case 'app':
        // Customer/student view - route to experience
        if (experienceId) {
          const experiencePath = `/experiences/${experienceId}/courses`;
          console.log('[WhopContextRouter] Redirecting customer to:', experiencePath);
          router.replace(experiencePath);
        } else {
          console.error('[WhopContextRouter] App view but no experienceId found');
          router.replace('/auth-error?reason=no_experience_id');
        }
        break;

      case 'analytics':
        // Analytics view - route to analytics dashboard
        if (companyId) {
          const analyticsPath = `/dashboard/${companyId}/analytics`;
          console.log('[WhopContextRouter] Redirecting analytics to:', analyticsPath);
          router.replace(analyticsPath);
        }
        break;

      case 'preview':
        // Preview mode - could be either view
        if (experienceId) {
          router.replace(`/experiences/${experienceId}/courses`);
        } else if (companyId) {
          router.replace(`/dashboard/${companyId}/overview`);
        }
        break;

      default:
        console.warn('[WhopContextRouter] Unknown viewType:', viewType);
        // Fallback - try to determine from available data
        if (experienceId && experienceId.startsWith('exp_')) {
          router.replace(`/experiences/${experienceId}/courses`);
        } else if (companyId) {
          router.replace(`/dashboard/${companyId}/overview`);
        } else {
          router.replace('/auth-error?reason=unknown_context');
        }
    }
  }, [loading, urlData, error, isEmbedded, router, pathname, redirecting]);

  // Loading state
  if (loading || redirecting) {
    return (
      loadingComponent || (
        <div className="min-h-screen flex items-center justify-center bg-gray-1">
          <div className="text-center">
            <div className="animate-spin h-12 w-12 border-4 border-purple-9 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-11">
              {redirecting ? 'Redirecting to your dashboard...' : 'Connecting to Whop...'}
            </p>
          </div>
        </div>
      )
    );
  }

  // Not in Whop iframe
  if (!isEmbedded) {
    return (
      notEmbeddedComponent || (
        <div className="min-h-screen flex items-center justify-center bg-gray-1">
          <div className="text-center max-w-md px-4">
            <h1 className="text-2xl font-bold text-gray-12 mb-4">
              Whop Integration Required
            </h1>
            <p className="text-gray-11 mb-6">
              This app is designed to run inside Whop. Please access it through your Whop dashboard.
            </p>
            <a
              href="https://whop.com/hub"
              className="inline-flex items-center justify-center px-6 py-3 bg-purple-9 text-white rounded-lg hover:bg-purple-10 transition-colors"
            >
              Go to Whop Hub
            </a>
          </div>
        </div>
      )
    );
  }

  // Error state
  if (error) {
    return (
      errorComponent || (
        <div className="min-h-screen flex items-center justify-center bg-gray-1">
          <div className="text-center max-w-md px-4">
            <h1 className="text-2xl font-bold text-red-11 mb-4">
              Connection Error
            </h1>
            <p className="text-gray-11 mb-2">
              Failed to connect to Whop:
            </p>
            <p className="text-red-11 font-mono text-sm mb-6">
              {error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center px-6 py-3 bg-gray-a4 text-gray-12 rounded-lg hover:bg-gray-a5 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )
    );
  }

  // If we have children and haven't redirected, render them
  return <>{children}</>;
}

/**
 * WhopContextRouter - Main export
 *
 * Wraps the inner router with WhopIframeSdkProvider.
 * This provides the iframe SDK context that useWhopContext needs.
 */
export function WhopContextRouter(props: WhopContextRouterProps) {
  return (
    <WhopIframeSdkProvider
      options={{
        appId: process.env.NEXT_PUBLIC_WHOP_APP_ID,
        onMessage: {
          appPing: async () => 'app_pong' as const,
          onColorThemeChange: async () => {
            console.log('[WhopContextRouter] Theme change received');
          },
        },
      }}
    >
      <WhopContextRouterInner {...props} />
    </WhopIframeSdkProvider>
  );
}

export default WhopContextRouter;
