/**
 * useWhopContext Hook
 *
 * React hook that provides context data from Whop's parent window.
 * This is how embedded apps get companyId, experienceId, and viewType.
 *
 * CRITICAL: Without this, embedded apps have NO WAY to know which
 * company/experience they're being accessed from!
 *
 * Uses the official @whop/react package for iframe communication.
 * IMPORTANT: Must be used within a WhopIframeSdkProvider!
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const { urlData, loading, error, isEmbedded } = useWhopContext();
 *
 *   if (loading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error}</div>;
 *   if (!isEmbedded) return <div>Not running in Whop</div>;
 *
 *   return <div>Experience: {urlData?.experienceId}</div>;
 * }
 * ```
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useIframeSdk } from '@whop/react';

/**
 * URL data from Whop's parent window
 */
export interface WhopUrlData {
  companyRoute: string;
  experienceRoute: string;
  experienceId: string;
  viewType: 'app' | 'admin' | 'analytics' | 'preview';
  baseHref: string;
  fullHref: string;
}

export interface WhopContextState {
  /** URL data from Whop (companyRoute, experienceId, viewType, etc.) */
  urlData: WhopUrlData | null;
  /** Whether we're still loading the context */
  loading: boolean;
  /** Error message if context loading failed */
  error: string | null;
  /** Whether the app is running inside a Whop iframe */
  isEmbedded: boolean;
  /** Refetch the URL data from Whop */
  refetch: () => Promise<void>;
  /** Notify Whop of navigation within the app */
  notifyNavigation: (path: string) => Promise<void>;
}

/**
 * Check if we're running inside a Whop iframe
 */
function isInsideWhopIframe(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    // If window.parent !== window, we're in an iframe
    return window.parent !== window;
  } catch {
    // Cross-origin access denied = we're in an iframe
    return true;
  }
}

/**
 * Hook to get and manage Whop context data
 *
 * IMPORTANT: This hook must be used within a WhopIframeSdkProvider!
 */
export function useWhopContext(): WhopContextState {
  const iframeSdk = useIframeSdk();
  const [urlData, setUrlData] = useState<WhopUrlData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEmbedded, setIsEmbedded] = useState(false);

  const fetchUrlData = useCallback(async () => {
    // Check if we're in an iframe
    const embedded = isInsideWhopIframe();
    setIsEmbedded(embedded);

    if (!embedded) {
      console.log('[useWhopContext] Not running in Whop iframe');
      setLoading(false);
      setError('Not running inside Whop iframe');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Use the official SDK to get URL data from Whop
      const data = await iframeSdk.getTopLevelUrlData({});
      setUrlData(data as WhopUrlData);

      console.log('[useWhopContext] Context loaded:', {
        experienceId: data.experienceId,
        viewType: data.viewType,
        companyRoute: data.companyRoute,
      });
    } catch (err) {
      console.error('[useWhopContext] Failed to load context:', err);
      setError(err instanceof Error ? err.message : 'Failed to load Whop context');
    } finally {
      setLoading(false);
    }
  }, [iframeSdk]);

  const notifyNavigation = useCallback(async (path: string) => {
    if (isEmbedded) {
      try {
        await iframeSdk.onHrefChange({ href: path });
        console.log('[useWhopContext] Notified navigation:', path);
      } catch (err) {
        console.error('[useWhopContext] Failed to notify navigation:', err);
      }
    }
  }, [isEmbedded, iframeSdk]);

  useEffect(() => {
    fetchUrlData();
  }, [fetchUrlData]);

  return {
    urlData,
    loading,
    error,
    isEmbedded,
    refetch: fetchUrlData,
    notifyNavigation,
  };
}

/**
 * Extract company ID from companyRoute
 *
 * companyRoute format: "/hub/biz_xxxxx" or similar
 */
export function extractCompanyId(companyRoute: string): string | null {
  // Look for biz_xxxxx pattern
  const match = companyRoute.match(/biz_[a-zA-Z0-9]+/);
  return match ? match[0] : null;
}

/**
 * Extract experience ID (already provided directly)
 */
export function extractExperienceId(experienceId: string): string {
  return experienceId;
}

export default useWhopContext;
