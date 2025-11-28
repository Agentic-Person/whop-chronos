/**
 * Whop Iframe SDK Integration
 *
 * This module provides access to Whop's iframe communication SDK.
 * Use this to get context data (companyId, experienceId, viewType) from the parent Whop window.
 *
 * CRITICAL: This is how embedded apps receive parameters from Whop!
 * - verifyUserToken() only gives userId/appId
 * - getTopLevelUrlData() gives companyRoute, experienceId, viewType, etc.
 *
 * @see https://docs.whop.com/apps/sdk/iframe
 */

import { createSdk, type WhopIframeSdk } from '@whop/iframe';

// Singleton SDK instance
let iframeSdk: WhopIframeSdk | null = null;

/**
 * Get or create the Whop iframe SDK instance
 *
 * This SDK communicates with the parent Whop window via postMessage.
 * Only works when running inside a Whop iframe.
 */
export function getWhopIframeSdk(): WhopIframeSdk {
  if (typeof window === 'undefined') {
    throw new Error('Whop iframe SDK can only be used in the browser');
  }

  if (!iframeSdk) {
    iframeSdk = createSdk({
      appId: process.env.NEXT_PUBLIC_WHOP_APP_ID,
      onMessage: {
        appPing: async () => 'app_pong' as const,
        onColorThemeChange: async () => {
          // Handle theme changes from Whop
          console.log('[Whop Iframe] Theme change received');
        },
      },
    });
  }

  return iframeSdk;
}

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

/**
 * Get the current URL/context data from Whop
 *
 * This is THE way to get companyId/experienceId in embedded apps!
 *
 * @example
 * ```typescript
 * const urlData = await getWhopUrlData();
 * console.log(urlData.experienceId); // "exp_xxxxx"
 * console.log(urlData.viewType);     // "app" | "admin" | etc.
 * ```
 */
export async function getWhopUrlData(): Promise<WhopUrlData> {
  const sdk = getWhopIframeSdk();

  try {
    // SDK methods are accessed directly as properties
    const result = await sdk.getTopLevelUrlData({});
    console.log('[Whop Iframe] URL data received:', result);
    return result as WhopUrlData;
  } catch (error) {
    console.error('[Whop Iframe] Failed to get URL data:', error);
    throw new Error('Failed to get URL data from Whop. Are you running inside a Whop iframe?');
  }
}

/**
 * Check if we're running inside a Whop iframe
 */
export function isInsideWhopIframe(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    // If window.parent !== window, we're in an iframe
    // If the parent is whop.com, we're in Whop's iframe
    return window.parent !== window;
  } catch {
    // Cross-origin access denied = we're in an iframe
    return true;
  }
}

/**
 * Notify Whop when navigating within the app
 *
 * This keeps Whop's URL bar in sync with your app's navigation.
 */
export async function notifyHrefChange(href: string): Promise<void> {
  const sdk = getWhopIframeSdk();

  try {
    await sdk.onHrefChange({ href });
    console.log('[Whop Iframe] Notified href change:', href);
  } catch (error) {
    console.error('[Whop Iframe] Failed to notify href change:', error);
  }
}

/**
 * Open an external URL (opens in new tab or redirects parent)
 */
export async function openExternalUrl(url: string, newTab = true): Promise<void> {
  const sdk = getWhopIframeSdk();

  try {
    await sdk.openExternalUrl({ url, newTab });
  } catch (error) {
    console.error('[Whop Iframe] Failed to open external URL:', error);
    // Fallback to regular window.open
    if (newTab) {
      window.open(url, '_blank');
    } else {
      window.location.href = url;
    }
  }
}

/**
 * Close the app panel in Whop
 */
export async function closeApp(): Promise<void> {
  const sdk = getWhopIframeSdk();

  try {
    await sdk.closeApp(null);
  } catch (error) {
    console.error('[Whop Iframe] Failed to close app:', error);
  }
}

/**
 * Get current color theme from Whop
 */
export async function getColorTheme() {
  const sdk = getWhopIframeSdk();

  try {
    return await sdk.getColorTheme(undefined);
  } catch (error) {
    console.error('[Whop Iframe] Failed to get color theme:', error);
    return null;
  }
}

/**
 * Clean up SDK resources
 */
export function cleanupIframeSdk(): void {
  if (iframeSdk) {
    iframeSdk._cleanupTransport();
    iframeSdk = null;
  }
}
