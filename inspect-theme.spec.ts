import { test } from '@playwright/test';

test('Inspect Card component styling', async ({ page }) => {
  await page.goto('http://localhost:3007/dashboard/student/chat');
  await page.waitForLoadState('networkidle');

  // Get the Card element
  const cardElement = await page.locator('div.flex.h-screen.flex-col > div').first();

  // Get all styles
  const styles = await cardElement.evaluate((el) => {
    const computed = window.getComputedStyle(el);
    const inline = el.getAttribute('style');
    const classes = el.className;

    return {
      backgroundColor: computed.backgroundColor,
      inlineStyle: inline,
      classes: classes,
      element: el.outerHTML.substring(0, 500)
    };
  });

  console.log('Card element details:', JSON.stringify(styles, null, 2));
});
