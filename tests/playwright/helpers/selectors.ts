/**
 * Common selectors for Playwright tests
 * These provide reusable selector patterns for the dashboard
 */

export const Selectors = {
  // Navigation selectors
  nav: {
    logo: 'a[href="/dashboard/creator/overview"]',
    mobileMenuButton: 'button:has-text("Toggle menu")',
    mobileMenu: '.md\\:hidden .flex.flex-col',

    // Navigation links - using text content
    overview: 'a:has-text("Overview")',
    videos: 'a:has-text("Videos")',
    students: 'a:has-text("Students")',
    chat: 'a:has-text("Chat")',
    settings: 'a:has-text("Settings")',

    // Alternative selectors by href
    overviewHref: 'a[href="/dashboard/creator/overview"]',
    videosHref: 'a[href="/dashboard/creator/videos"]',
    studentsHref: 'a[href="/dashboard/creator/students"]',
    chatHref: 'a[href="/dashboard/creator/chat"]',
    settingsHref: 'a[href="/dashboard/creator/settings"]',
  },

  // Analytics components
  analytics: {
    // DateRangePicker
    dateRangePicker: 'select',
    dateRangeDisplay: 'span.text-xs.text-gray-11',

    // RefreshButton
    refreshButton: 'button:has-text("Refresh")',
    refreshIcon: '.lucide-refresh-cw',

    // ExportButton
    exportButton: 'button:has-text("Export CSV")',
    downloadIcon: '.lucide-download',
  },

  // Common elements
  common: {
    heading: 'h1',
    subheading: 'h2',
    card: '.bg-gray-a2',
    button: 'button',
    link: 'a',
  },
};

/**
 * Helper function to get navigation link by name
 */
export function getNavLink(name: 'Overview' | 'Videos' | 'Students' | 'Chat' | 'Settings') {
  return `a:has-text("${name}")`;
}

/**
 * Helper function to get active navigation link
 */
export function getActiveNavLink() {
  return '.bg-gray-a4.text-gray-12';
}

/**
 * Helper function to wait for navigation to complete
 */
export async function waitForNavigation(page: any, expectedUrl: string) {
  await page.waitForURL(new RegExp(expectedUrl));
  await page.waitForLoadState('networkidle');
}
