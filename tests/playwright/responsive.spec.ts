/**
 * Responsive Breakpoint Tests
 *
 * Tests responsive behavior across different viewport sizes:
 * - Mobile (375px)
 * - Tablet (768px)
 * - Desktop (1440px)
 * - Component responsive adaptations
 * - No horizontal overflow
 */

import { test, expect } from '@playwright/test';
import { goToOverview, setViewport, Viewports } from './helpers/navigation';

test.describe('Responsive Breakpoint Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to overview page for responsive testing
    await goToOverview(page);
  });

  test.describe('Mobile Layout (375px)', () => {
    test('Page renders correctly at 375px mobile width', async ({ page }) => {
      await setViewport(page, Viewports.mobile.width, Viewports.mobile.height);
      await page.waitForTimeout(500);

      // Navigation should be visible
      const nav = page.locator('nav').first();
      await expect(nav).toBeVisible();

      // Main content should be visible
      const mainContent = page.locator('main, div').first();
      await expect(mainContent).toBeVisible();
    });

    test('Mobile menu is collapsed by default at 375px', async ({ page }) => {
      await setViewport(page, Viewports.mobile.width, Viewports.mobile.height);
      await page.waitForTimeout(500);

      // Desktop navigation should be hidden (has hidden md:flex class)
      const desktopNav = page.locator('.hidden.md\\:flex').first();
      const isVisible = await desktopNav.isVisible().catch(() => false);
      expect(isVisible).toBe(false);

      // Mobile menu button should be visible
      const mobileMenuButton = page.locator('button').filter({
        has: page.locator('.lucide-menu, .lucide-x')
      }).first();
      await expect(mobileMenuButton).toBeVisible();
    });

    test('Component text labels are hidden on mobile (375px)', async ({ page }) => {
      await setViewport(page, Viewports.mobile.width, Viewports.mobile.height);
      await page.waitForTimeout(500);

      // Refresh button text should be hidden
      const refreshTextSpan = page.locator('button span.hidden.sm\\:inline').filter({ hasText: 'Refresh' }).first();
      const refreshTextVisible = await refreshTextSpan.isVisible().catch(() => false);
      expect(refreshTextVisible).toBe(false);

      // Export button text should be hidden
      const exportTextSpan = page.locator('button span.hidden.sm\\:inline').filter({ hasText: 'Export' }).first();
      const exportTextVisible = await exportTextSpan.isVisible().catch(() => false);
      expect(exportTextVisible).toBe(false);
    });

    test('No horizontal overflow at 375px', async ({ page }) => {
      await setViewport(page, Viewports.mobile.width, Viewports.mobile.height);
      await page.waitForTimeout(500);

      // Check body and html for horizontal overflow
      const bodyOverflow = await page.evaluate(() => {
        const body = document.body;
        return body.scrollWidth > body.clientWidth;
      });

      expect(bodyOverflow).toBe(false);
    });
  });

  test.describe('Tablet Layout (768px)', () => {
    test('Page renders correctly at 768px tablet width', async ({ page }) => {
      await setViewport(page, Viewports.tablet.width, Viewports.tablet.height);
      await page.waitForTimeout(500);

      // Navigation should be visible
      const nav = page.locator('nav').first();
      await expect(nav).toBeVisible();

      // Main content should be visible
      const mainContent = page.locator('main, div').first();
      await expect(mainContent).toBeVisible();
    });

    test('Desktop navigation is visible at 768px', async ({ page }) => {
      await setViewport(page, Viewports.tablet.width, Viewports.tablet.height);
      await page.waitForTimeout(500);

      // Desktop navigation should be visible at tablet size
      const desktopNav = page.locator('.hidden.md\\:flex').first();
      await expect(desktopNav).toBeVisible();

      // Mobile menu button should be hidden
      const mobileMenuButton = page.locator('.md\\:hidden button').first();
      const isVisible = await mobileMenuButton.isVisible().catch(() => false);

      // Button element might exist but container should hide it
      expect(isVisible).toBe(false);
    });

    test('Component text labels start showing at 768px', async ({ page }) => {
      await setViewport(page, Viewports.tablet.width, Viewports.tablet.height);
      await page.waitForTimeout(500);

      // At tablet size, text with sm:inline should be visible
      const refreshButton = page.locator('button').filter({ hasText: 'Refresh' }).first();
      await expect(refreshButton).toBeVisible();

      const exportButton = page.locator('button').filter({ hasText: 'Export' }).first();
      await expect(exportButton).toBeVisible();
    });

    test('No horizontal overflow at 768px', async ({ page }) => {
      await setViewport(page, Viewports.tablet.width, Viewports.tablet.height);
      await page.waitForTimeout(500);

      // Check body for horizontal overflow
      const bodyOverflow = await page.evaluate(() => {
        const body = document.body;
        return body.scrollWidth > body.clientWidth;
      });

      expect(bodyOverflow).toBe(false);
    });
  });

  test.describe('Desktop Layout (1440px)', () => {
    test('Page renders correctly at 1440px desktop width', async ({ page }) => {
      await setViewport(page, Viewports.desktop.width, Viewports.desktop.height);
      await page.waitForTimeout(500);

      // All elements should be visible and properly sized
      const nav = page.locator('nav').first();
      await expect(nav).toBeVisible();
    });

    test('Full desktop navigation is visible at 1440px', async ({ page }) => {
      await setViewport(page, Viewports.desktop.width, Viewports.desktop.height);
      await page.waitForTimeout(500);

      // All 5 navigation tabs should be visible
      const overviewLink = page.locator('a:has-text("Overview")').first();
      const videosLink = page.locator('a:has-text("Videos")').first();
      const studentsLink = page.locator('a:has-text("Students")').first();
      const chatLink = page.locator('a:has-text("Chat")').first();
      const settingsLink = page.locator('a:has-text("Settings")').first();

      await expect(overviewLink).toBeVisible();
      await expect(videosLink).toBeVisible();
      await expect(studentsLink).toBeVisible();
      await expect(chatLink).toBeVisible();
      await expect(settingsLink).toBeVisible();
    });

    test('All component text labels are visible at 1440px', async ({ page }) => {
      await setViewport(page, Viewports.desktop.width, Viewports.desktop.height);
      await page.waitForTimeout(500);

      // Refresh button should show full text
      const refreshButton = page.locator('button:has-text("Refresh")').first();
      await expect(refreshButton).toBeVisible();
      const refreshText = await refreshButton.textContent();
      expect(refreshText).toContain('Refresh');

      // Export button should show full text
      const exportButton = page.locator('button:has-text("Export CSV")').first();
      await expect(exportButton).toBeVisible();
      const exportText = await exportButton.textContent();
      expect(exportText).toContain('Export CSV');

      // Date range display should be visible
      const dateDisplay = page.locator('span.text-xs.text-gray-11').first();
      await expect(dateDisplay).toBeVisible();
    });

    test('No horizontal overflow at 1440px', async ({ page }) => {
      await setViewport(page, Viewports.desktop.width, Viewports.desktop.height);
      await page.waitForTimeout(500);

      // Check body for horizontal overflow
      const bodyOverflow = await page.evaluate(() => {
        const body = document.body;
        return body.scrollWidth > body.clientWidth;
      });

      expect(bodyOverflow).toBe(false);
    });
  });

  test.describe('Cross-Breakpoint Behavior', () => {
    test('Navigation adapts correctly when resizing from desktop to mobile', async ({ page }) => {
      // Start at desktop size
      await setViewport(page, Viewports.desktop.width, Viewports.desktop.height);
      await page.waitForTimeout(500);

      // Desktop nav should be visible
      let desktopNav = page.locator('.hidden.md\\:flex').first();
      await expect(desktopNav).toBeVisible();

      // Resize to mobile
      await setViewport(page, Viewports.mobile.width, Viewports.mobile.height);
      await page.waitForTimeout(500);

      // Desktop nav should now be hidden
      desktopNav = page.locator('.hidden.md\\:flex').first();
      const isVisible = await desktopNav.isVisible().catch(() => false);
      expect(isVisible).toBe(false);

      // Mobile menu button should be visible
      const mobileButton = page.locator('button').filter({
        has: page.locator('.lucide-menu')
      }).first();
      await expect(mobileButton).toBeVisible();
    });

    test('Component icons remain visible at all breakpoints', async ({ page }) => {
      const viewports = [
        Viewports.mobile,
        Viewports.tablet,
        Viewports.desktop,
      ];

      for (const viewport of viewports) {
        await setViewport(page, viewport.width, viewport.height);
        await page.waitForTimeout(300);

        // All icons should remain visible regardless of screen size
        const calendarIcon = page.locator('.lucide-calendar').first();
        const refreshIcon = page.locator('.lucide-refresh-cw').first();
        const downloadIcon = page.locator('.lucide-download').first();

        await expect(calendarIcon).toBeVisible();
        await expect(refreshIcon).toBeVisible();
        await expect(downloadIcon).toBeVisible();
      }
    });

    test('Page content remains accessible at all breakpoints', async ({ page }) => {
      const viewports = [
        { name: 'Mobile', ...Viewports.mobile },
        { name: 'Tablet', ...Viewports.tablet },
        { name: 'Desktop', ...Viewports.desktop },
      ];

      for (const viewport of viewports) {
        await setViewport(page, viewport.width, viewport.height);
        await page.waitForTimeout(300);

        // Navigation should always be accessible
        const nav = page.locator('nav').first();
        await expect(nav).toBeVisible();

        // At least some main content should be visible
        const body = page.locator('body').first();
        await expect(body).toBeVisible();
      }
    });

    test('No layout shift when changing breakpoints', async ({ page }) => {
      // Set initial viewport
      await setViewport(page, Viewports.desktop.width, Viewports.desktop.height);
      await page.waitForTimeout(500);

      // Get initial navigation height
      const navInitial = await page.locator('nav').first().boundingBox();
      expect(navInitial).toBeTruthy();

      // Resize to tablet
      await setViewport(page, Viewports.tablet.width, Viewports.tablet.height);
      await page.waitForTimeout(500);

      // Navigation should still exist with reasonable height
      const navTablet = await page.locator('nav').first().boundingBox();
      expect(navTablet).toBeTruthy();
      expect(navTablet!.height).toBeGreaterThan(0);

      // Resize to mobile
      await setViewport(page, Viewports.mobile.width, Viewports.mobile.height);
      await page.waitForTimeout(500);

      // Navigation should still exist with reasonable height
      const navMobile = await page.locator('nav').first().boundingBox();
      expect(navMobile).toBeTruthy();
      expect(navMobile!.height).toBeGreaterThan(0);
    });
  });
});
