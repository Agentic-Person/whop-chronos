/**
 * Dashboard Navigation Tests
 *
 * Tests the main dashboard navigation functionality:
 * - All navigation tabs are visible and clickable
 * - Navigation routing works correctly
 * - Active tab highlighting works
 * - Mobile menu functionality
 * - No console errors during navigation
 */

import { test, expect } from '@playwright/test';
import {
  goToOverview,
  Routes,
  waitForDashboardLoad,
  getCurrentPath,
  setViewport,
  Viewports
} from './helpers/navigation';
import { Selectors } from './helpers/selectors';

test.describe('Dashboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to overview page before each test
    await goToOverview(page);
  });

  test('All 5 navigation tabs are visible on desktop', async ({ page }) => {
    await setViewport(page, Viewports.desktop.width, Viewports.desktop.height);

    // Check that all navigation items are visible
    const overviewLink = page.locator(Selectors.nav.overview).first();
    const videosLink = page.locator(Selectors.nav.videos).first();
    const studentsLink = page.locator(Selectors.nav.students).first();
    const chatLink = page.locator(Selectors.nav.chat).first();
    const settingsLink = page.locator(Selectors.nav.settings).first();

    await expect(overviewLink).toBeVisible();
    await expect(videosLink).toBeVisible();
    await expect(studentsLink).toBeVisible();
    await expect(chatLink).toBeVisible();
    await expect(settingsLink).toBeVisible();
  });

  test('Overview tab is clickable and navigates correctly', async ({ page }) => {
    // Click Overview tab
    await page.locator(Selectors.nav.overview).first().click();
    await waitForDashboardLoad(page);

    // Verify URL
    expect(await getCurrentPath(page)).toContain('/dashboard/creator/overview');
  });

  test('Videos tab is clickable and navigates correctly', async ({ page }) => {
    // Click Videos tab
    await page.locator(Selectors.nav.videos).first().click();
    await page.waitForURL(/.*videos/);

    // Verify URL
    expect(await getCurrentPath(page)).toContain('/dashboard/creator/videos');
  });

  test('Students tab is clickable and navigates correctly', async ({ page }) => {
    // Click Students tab
    await page.locator(Selectors.nav.students).first().click();
    await page.waitForURL(/.*students/);

    // Verify URL
    expect(await getCurrentPath(page)).toContain('/dashboard/creator/students');
  });

  test('Chat tab is clickable and navigates correctly', async ({ page }) => {
    // Click Chat tab
    await page.locator(Selectors.nav.chat).first().click();
    await page.waitForURL(/.*chat/);

    // Verify URL
    expect(await getCurrentPath(page)).toContain('/dashboard/creator/chat');
  });

  test('Settings tab is clickable and navigates correctly', async ({ page }) => {
    // Click Settings tab
    await page.locator(Selectors.nav.settings).first().click();
    await page.waitForURL(/.*settings/);

    // Verify URL
    expect(await getCurrentPath(page)).toContain('/dashboard/creator/settings');
  });

  test('Active tab is highlighted correctly', async ({ page }) => {
    // Navigate to Videos page
    await page.locator(Selectors.nav.videos).first().click();
    await page.waitForURL(/.*videos/);
    await waitForDashboardLoad(page);

    // Check that Videos link has active styling
    const videosLink = page.locator('a[href="/dashboard/creator/videos"]').first();
    const classes = await videosLink.getAttribute('class');

    // Active links should have specific classes
    expect(classes).toContain('bg-gray-a4');
    expect(classes).toContain('text-gray-12');
  });

  test('Mobile menu button is visible on small screens', async ({ page }) => {
    // Set mobile viewport
    await setViewport(page, Viewports.mobile.width, Viewports.mobile.height);
    await page.waitForTimeout(500);

    // Mobile menu button should be visible
    const menuButton = page.locator('button').filter({ has: page.locator('.lucide-menu') }).first();
    await expect(menuButton).toBeVisible();
  });

  test('Mobile menu opens and closes correctly', async ({ page }) => {
    // Set mobile viewport
    await setViewport(page, Viewports.mobile.width, Viewports.mobile.height);
    await page.waitForTimeout(500);

    // Find and click the menu button
    const menuButton = page.locator('button').filter({ has: page.locator('.lucide-menu, .lucide-x') }).first();
    await menuButton.click();
    await page.waitForTimeout(300);

    // Mobile menu should be visible
    const mobileMenu = page.locator('.md\\:hidden.py-4');
    await expect(mobileMenu).toBeVisible();

    // Click menu button again to close
    await menuButton.click();
    await page.waitForTimeout(300);

    // Mobile menu should be hidden
    await expect(mobileMenu).not.toBeVisible();
  });

  test('Mobile menu navigation works correctly', async ({ page }) => {
    // Set mobile viewport
    await setViewport(page, Viewports.mobile.width, Viewports.mobile.height);
    await page.waitForTimeout(500);

    // Open mobile menu
    const menuButton = page.locator('button').filter({ has: page.locator('.lucide-menu') }).first();
    await menuButton.click();
    await page.waitForTimeout(300);

    // Click Videos in mobile menu
    const mobileVideosLink = page.locator('.md\\:hidden a:has-text("Videos")').first();
    await mobileVideosLink.click();
    await page.waitForURL(/.*videos/);

    // Verify navigation worked
    expect(await getCurrentPath(page)).toContain('/dashboard/creator/videos');

    // Mobile menu should close after navigation
    const mobileMenu = page.locator('.md\\:hidden.py-4');
    await expect(mobileMenu).not.toBeVisible();
  });

  test('No console errors during navigation', async ({ page }) => {
    const errors: string[] = [];

    // Listen for console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Navigate through all tabs
    await page.locator(Selectors.nav.overview).first().click();
    await page.waitForTimeout(500);

    await page.locator(Selectors.nav.videos).first().click();
    await page.waitForTimeout(500);

    await page.locator(Selectors.nav.students).first().click();
    await page.waitForTimeout(500);

    await page.locator(Selectors.nav.chat).first().click();
    await page.waitForTimeout(500);

    await page.locator(Selectors.nav.settings).first().click();
    await page.waitForTimeout(500);

    // Filter out known harmless errors
    const criticalErrors = errors.filter(
      err => !err.includes('favicon') && !err.includes('DevTools')
    );

    expect(criticalErrors.length).toBe(0);
  });

  test('Logo navigates back to overview', async ({ page }) => {
    // Navigate away from overview
    await page.locator(Selectors.nav.videos).first().click();
    await page.waitForURL(/.*videos/);

    // Click logo
    await page.locator(Selectors.nav.logo).first().click();
    await page.waitForURL(/.*overview/);

    // Should be back on overview
    expect(await getCurrentPath(page)).toContain('/dashboard/creator/overview');
  });

  test('Navigation persists across page reloads', async ({ page }) => {
    // Navigate to Settings
    await page.locator(Selectors.nav.settings).first().click();
    await page.waitForURL(/.*settings/);

    // Reload page
    await page.reload();
    await waitForDashboardLoad(page);

    // Should still be on Settings
    expect(await getCurrentPath(page)).toContain('/dashboard/creator/settings');

    // Settings tab should still be active
    const settingsLink = page.locator('a[href="/dashboard/creator/settings"]').first();
    const classes = await settingsLink.getAttribute('class');
    expect(classes).toContain('bg-gray-a4');
  });
});
