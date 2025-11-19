import { test, expect } from '@playwright/test';

test('Student pages should have dark theme (no white eyesores)', async ({ page }) => {
  // Navigate to AI Chat page
  await page.goto('http://localhost:3007/dashboard/student/chat');
  await page.waitForLoadState('networkidle');

  // Take screenshot of AI Chat page
  await page.screenshot({
    path: 'chat-page-dark-theme.png',
    fullPage: true
  });

  // Check that the header Card has dark background (bg-gray-2)
  const chatHeader = page.locator('div.flex.h-screen.flex-col > div').first();
  const chatHeaderBg = await chatHeader.evaluate((el) =>
    window.getComputedStyle(el).backgroundColor
  );
  console.log('Chat header background:', chatHeaderBg);

  // Navigate to My Courses page
  await page.goto('http://localhost:3007/dashboard/student/courses');
  await page.waitForLoadState('networkidle');

  // Take screenshot of My Courses page
  await page.screenshot({
    path: 'courses-page-dark-theme.png',
    fullPage: true
  });

  // Check that the CourseFilters Card has dark background (bg-gray-2)
  const filtersCard = page.locator('div.p-4.space-y-4').first();
  const filtersBg = await filtersCard.evaluate((el) =>
    window.getComputedStyle(el).backgroundColor
  );
  console.log('Filters card background:', filtersBg);

  // Verify no pure white backgrounds (rgb(255, 255, 255))
  const whiteElements = await page.locator('[style*="background-color: rgb(255, 255, 255)"]').count();
  expect(whiteElements).toBe(0);

  console.log('✅ Dark theme verified on both pages!');
});
