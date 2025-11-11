/**
 * Navigation helper functions for Playwright tests
 */

import { Page } from 'playwright';

/**
 * Base URL for the application
 */
export const BASE_URL = 'http://localhost:3007';

/**
 * Test creator ID (hardcoded for testing)
 */
export const TEST_CREATOR_ID = '00000000-0000-0000-0000-000000000001';

/**
 * Dashboard routes
 */
export const Routes = {
  overview: '/dashboard/creator/overview',
  videos: '/dashboard/creator/videos',
  students: '/dashboard/creator/students',
  chat: '/dashboard/creator/chat',
  settings: '/dashboard/creator/settings',
};

/**
 * Navigate to creator dashboard overview
 */
export async function goToOverview(page: Page) {
  await page.goto(`${BASE_URL}${Routes.overview}`, { waitUntil: 'networkidle' });
  await waitForDashboardLoad(page);
}

/**
 * Navigate to videos page
 */
export async function goToVideos(page: Page) {
  await page.goto(`${BASE_URL}${Routes.videos}`, { waitUntil: 'networkidle' });
  await waitForDashboardLoad(page);
}

/**
 * Navigate to students page
 */
export async function goToStudents(page: Page) {
  await page.goto(`${BASE_URL}${Routes.students}`, { waitUntil: 'networkidle' });
  await waitForDashboardLoad(page);
}

/**
 * Navigate to chat page
 */
export async function goToChat(page: Page) {
  await page.goto(`${BASE_URL}${Routes.chat}`, { waitUntil: 'networkidle' });
  await waitForDashboardLoad(page);
}

/**
 * Navigate to settings page
 */
export async function goToSettings(page: Page) {
  await page.goto(`${BASE_URL}${Routes.settings}`, { waitUntil: 'networkidle' });
  await waitForDashboardLoad(page);
}

/**
 * Wait for dashboard to fully load
 */
export async function waitForDashboardLoad(page: Page) {
  // Wait for navigation to be visible
  await page.waitForSelector('nav', { state: 'visible' });

  // Wait for network to be idle
  await page.waitForLoadState('networkidle');

  // Small delay for any animations
  await page.waitForTimeout(500);
}

/**
 * Check if navigation is visible
 */
export async function isNavigationVisible(page: Page): Promise<boolean> {
  try {
    const nav = await page.locator('nav').first();
    return await nav.isVisible();
  } catch {
    return false;
  }
}

/**
 * Get current URL path
 */
export async function getCurrentPath(page: Page): Promise<string> {
  const url = page.url();
  return new URL(url).pathname;
}

/**
 * Check if we're on a specific route
 */
export async function isOnRoute(page: Page, route: string): Promise<boolean> {
  const currentPath = await getCurrentPath(page);
  return currentPath.includes(route);
}

/**
 * Wait for specific URL pattern
 */
export async function waitForUrl(page: Page, pattern: string | RegExp) {
  await page.waitForURL(pattern);
}

/**
 * Check for console errors
 */
export async function getConsoleErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  return errors;
}

/**
 * Set viewport size for responsive testing
 */
export async function setViewport(page: Page, width: number, height: number = 900) {
  await page.setViewportSize({ width, height });
}

/**
 * Common viewport sizes
 */
export const Viewports = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1440, height: 900 },
  wide: { width: 1920, height: 1080 },
};
