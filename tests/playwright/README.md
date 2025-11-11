# Playwright Testing Guide for Chronos

This guide provides comprehensive documentation for writing and running Playwright tests for the Chronos dashboard application.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Common Selectors](#common-selectors)
- [Helper Functions](#helper-functions)
- [Test Patterns](#test-patterns)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

---

## Overview

### What We're Testing

The Chronos test suite focuses on:

1. **Dashboard Navigation** - All 5 navigation tabs and routing
2. **Analytics Components** - DateRangePicker, RefreshButton, ExportButton
3. **Responsive Behavior** - Mobile (375px), Tablet (768px), Desktop (1440px)

### Why Playwright MCP

We use Playwright MCP server integration for:
- Real browser testing across Chrome, Firefox, and Safari
- Automated screenshot capture
- Visual feedback during test execution
- Integration with Claude Code development workflow

### Testing Philosophy

- **Real Browser Testing**: Tests run in actual browsers, not simulated environments
- **User-Centric**: Tests focus on user interactions and visible behavior
- **Responsive First**: All tests verify behavior across breakpoints
- **Fast and Reliable**: Tests are optimized for speed and stability
- **Maintainable**: Clear selectors and helper functions for easy updates

---

## Prerequisites

### Required Setup

1. **Development Server Running**
   - Server must be running on `http://localhost:3007`
   - Start with: `npm run dev`
   - Verify: `curl http://localhost:3007`

2. **Test Data**
   - Hardcoded test creator ID: `00000000-0000-0000-0000-000000000001`
   - Database should have seed data for analytics
   - No authentication required (bypassed for testing)

3. **Playwright Installed**
   - Install: `npm install -D @playwright/test`
   - Install browsers: `npx playwright install`

### Project Structure

```
tests/playwright/
├── README.md                          # This file
├── dashboard-navigation.spec.ts       # Navigation tests (13 tests)
├── analytics-components.spec.ts       # Component tests (17 tests)
├── responsive.spec.ts                 # Responsive tests (16 tests)
└── helpers/
    ├── selectors.ts                   # Common selectors
    └── navigation.ts                  # Navigation helpers
```

---

## Running Tests

### Run All Tests

```bash
# Run all test suites
npx playwright test

# Run with UI mode
npx playwright test --ui

# Run in headed mode (see browser)
npx playwright test --headed
```

### Run Specific Test Files

```bash
# Run navigation tests only
npx playwright test dashboard-navigation.spec.ts

# Run analytics components tests only
npx playwright test analytics-components.spec.ts

# Run responsive tests only
npx playwright test responsive.spec.ts
```

### Run Single Test

```bash
# Run a specific test by name
npx playwright test -g "All 5 navigation tabs are visible"

# Run a specific describe block
npx playwright test -g "DateRangePicker"
```

### Run in Different Browsers

```bash
# Run in Chromium (default)
npx playwright test --project=chromium

# Run in Firefox
npx playwright test --project=firefox

# Run in WebKit (Safari)
npx playwright test --project=webkit

# Run in all browsers
npx playwright test --project=chromium --project=firefox --project=webkit
```

### Debug Tests

```bash
# Run in debug mode with inspector
npx playwright test --debug

# Run specific test in debug mode
npx playwright test -g "Mobile menu opens" --debug

# Generate trace
npx playwright test --trace on
```

### View Test Reports

```bash
# Generate and open HTML report
npx playwright show-report

# Run tests and show report
npx playwright test --reporter=html
```

---

## Writing Tests

### Test Structure

All tests follow this pattern:

```typescript
import { test, expect } from '@playwright/test';
import { goToOverview, setViewport, Viewports } from './helpers/navigation';
import { Selectors } from './helpers/selectors';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Navigate to test page
    await goToOverview(page);
  });

  test('Descriptive test name', async ({ page }) => {
    // Arrange
    const element = page.locator(Selectors.nav.overview);

    // Act
    await element.click();

    // Assert
    await expect(element).toBeVisible();
  });
});
```

### Using Selectors

Import common selectors from the helpers:

```typescript
import { Selectors } from './helpers/selectors';

// Navigation selectors
const overviewLink = page.locator(Selectors.nav.overview);
const videosLink = page.locator(Selectors.nav.videos);

// Analytics selectors
const dateRangePicker = page.locator(Selectors.analytics.dateRangePicker);
const refreshButton = page.locator(Selectors.analytics.refreshButton);
```

### Waiting for Elements

```typescript
// Wait for element to be visible
await expect(element).toBeVisible();

// Wait for navigation
await page.waitForURL(/.*overview/);

// Wait for network idle
await page.waitForLoadState('networkidle');

// Custom timeout
await element.waitFor({ state: 'visible', timeout: 5000 });

// Wait for specific time (use sparingly)
await page.waitForTimeout(500);
```

### Common Assertions

```typescript
// Visibility
await expect(element).toBeVisible();
await expect(element).not.toBeVisible();

// Text content
await expect(element).toHaveText('Expected text');
await expect(element).toContainText('Partial text');

// Attributes
await expect(element).toHaveClass('active-class');
await expect(element).toHaveAttribute('href', '/path');

// State
await expect(element).toBeEnabled();
await expect(element).toBeDisabled();
await expect(element).toBeChecked();

// Count
await expect(page.locator('button')).toHaveCount(3);

// URL
await expect(page).toHaveURL(/.*overview/);
expect(page.url()).toContain('/overview');
```

### Responsive Testing

```typescript
import { setViewport, Viewports } from './helpers/navigation';

// Set mobile viewport
await setViewport(page, Viewports.mobile.width, Viewports.mobile.height);

// Set tablet viewport
await setViewport(page, Viewports.tablet.width, Viewports.tablet.height);

// Set desktop viewport
await setViewport(page, Viewports.desktop.width, Viewports.desktop.height);

// Custom viewport
await setViewport(page, 1024, 768);
```

---

## Common Selectors

### Navigation Selectors

```typescript
// Navigation links by text
const overviewLink = page.locator('a:has-text("Overview")');
const videosLink = page.locator('a:has-text("Videos")');
const studentsLink = page.locator('a:has-text("Students")');
const chatLink = page.locator('a:has-text("Chat")');
const settingsLink = page.locator('a:has-text("Settings")');

// Navigation links by href
const overviewHref = page.locator('a[href="/dashboard/creator/overview"]');
const videosHref = page.locator('a[href="/dashboard/creator/videos"]');

// Active navigation link
const activeLink = page.locator('.bg-gray-a4.text-gray-12');

// Mobile menu
const mobileMenuButton = page.locator('button').filter({
  has: page.locator('.lucide-menu')
});
const mobileMenu = page.locator('.md\\:hidden.py-4');
```

### Analytics Component Selectors

```typescript
// DateRangePicker
const dateRangePicker = page.locator('select').first();
const dateRangeDisplay = page.locator('span.text-xs.text-gray-11');

// RefreshButton
const refreshButton = page.locator('button:has-text("Refresh")');
const refreshIcon = page.locator('.lucide-refresh-cw');

// ExportButton
const exportButton = page.locator('button:has-text("Export CSV")');
const downloadIcon = page.locator('.lucide-download');
```

### Responsive Selectors

```typescript
// Hidden on mobile, visible on desktop
const desktopOnlyText = page.locator('span.hidden.sm\\:inline');
const desktopOnlyElement = page.locator('span.hidden.md\\:inline');

// Desktop navigation (hidden on mobile)
const desktopNav = page.locator('.hidden.md\\:flex');

// Mobile-only elements
const mobileOnlyButton = page.locator('.md\\:hidden button');
```

---

## Helper Functions

### Navigation Helpers

```typescript
import {
  goToOverview,
  goToVideos,
  goToStudents,
  goToChat,
  goToSettings,
  waitForDashboardLoad,
  getCurrentPath,
  isOnRoute,
} from './helpers/navigation';

// Navigate to pages
await goToOverview(page);
await goToVideos(page);

// Wait for dashboard to load
await waitForDashboardLoad(page);

// Check current path
const currentPath = await getCurrentPath(page);
expect(currentPath).toContain('/overview');

// Check if on specific route
const onOverview = await isOnRoute(page, '/overview');
expect(onOverview).toBe(true);
```

### Viewport Helpers

```typescript
import { setViewport, Viewports } from './helpers/navigation';

// Predefined viewports
await setViewport(page, Viewports.mobile.width, Viewports.mobile.height);
await setViewport(page, Viewports.tablet.width, Viewports.tablet.height);
await setViewport(page, Viewports.desktop.width, Viewports.desktop.height);

// Available viewport sizes
Viewports = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1440, height: 900 },
  wide: { width: 1920, height: 1080 },
}
```

### Selector Helpers

```typescript
import { Selectors, getNavLink, getActiveNavLink } from './helpers/selectors';

// Get navigation link by name
const videosLink = page.locator(getNavLink('Videos'));

// Get active navigation link
const activeLink = page.locator(getActiveNavLink());
```

---

## Test Patterns

### Pattern 1: Navigation Test

```typescript
test('Tab navigates to correct page', async ({ page }) => {
  // Navigate to overview first
  await goToOverview(page);

  // Click tab
  await page.locator(Selectors.nav.videos).first().click();

  // Wait for navigation
  await page.waitForURL(/.*videos/);

  // Verify URL
  const path = await getCurrentPath(page);
  expect(path).toContain('/dashboard/creator/videos');
});
```

### Pattern 2: Responsive Test

```typescript
test('Component adapts to mobile', async ({ page }) => {
  // Set mobile viewport
  await setViewport(page, Viewports.mobile.width, Viewports.mobile.height);
  await page.waitForTimeout(300);

  // Check mobile-specific behavior
  const mobileButton = page.locator('.md\\:hidden button').first();
  await expect(mobileButton).toBeVisible();

  // Check desktop elements are hidden
  const desktopNav = page.locator('.hidden.md\\:flex').first();
  const isVisible = await desktopNav.isVisible().catch(() => false);
  expect(isVisible).toBe(false);
});
```

### Pattern 3: Component Interaction Test

```typescript
test('Button click triggers action', async ({ page }) => {
  // Find button
  const button = page.locator(Selectors.analytics.refreshButton).first();

  // Verify button is clickable
  await expect(button).toBeVisible();
  await expect(button).toBeEnabled();

  // Click button
  await button.click();
  await page.waitForTimeout(200);

  // Verify action occurred (check state change)
  const icon = button.locator('.lucide-refresh-cw').first();
  const classes = await icon.getAttribute('class');
  expect(classes).toBeTruthy();
});
```

### Pattern 4: Cross-Breakpoint Test

```typescript
test('Element visible at all breakpoints', async ({ page }) => {
  const viewports = [Viewports.mobile, Viewports.tablet, Viewports.desktop];

  for (const viewport of viewports) {
    await setViewport(page, viewport.width, viewport.height);
    await page.waitForTimeout(300);

    const element = page.locator('.lucide-calendar').first();
    await expect(element).toBeVisible();
  }
});
```

---

## Troubleshooting

### Server Not Running

**Problem**: Tests fail with connection errors

**Solution**:
```bash
# Check if server is running
curl http://localhost:3007

# Start development server
npm run dev

# Verify port is 3007 (not 3000 or other)
```

### Tests Timing Out

**Problem**: Tests fail with timeout errors

**Solutions**:
```typescript
// Increase timeout for specific test
test('Slow test', async ({ page }) => {
  test.setTimeout(60000); // 60 seconds
  // ... test code
});

// Wait for network idle
await page.waitForLoadState('networkidle');

// Add explicit waits
await page.waitForTimeout(1000);
```

### Selectors Not Found

**Problem**: Element not found errors

**Solutions**:
```typescript
// Use .first() for multiple matches
const element = page.locator('button').first();

// Use more specific selectors
const button = page.locator('button:has-text("Refresh")').first();

// Check if element exists before interacting
const count = await page.locator('button').count();
if (count > 0) {
  await page.locator('button').first().click();
}

// Wait for element to appear
await page.waitForSelector('button', { state: 'visible' });
```

### Escaping CSS Classes

**Problem**: Tailwind classes with special characters not working

**Solution**:
```typescript
// Escape colons and other special characters
const element = page.locator('.md\\:hidden');
const text = page.locator('span.sm\\:inline');

// Or use attribute selectors
const element = page.locator('[class*="md:hidden"]');
```

### Screenshot Comparison Issues

**Problem**: Visual regression tests failing

**Solutions**:
```typescript
// Take screenshot with specific name
await page.screenshot({
  path: 'screenshots/test-name.png',
  fullPage: true
});

// Compare with threshold
await expect(page).toHaveScreenshot('expected.png', {
  maxDiffPixels: 100
});
```

### Flaky Tests

**Problem**: Tests pass sometimes, fail other times

**Solutions**:
```typescript
// Add proper waits
await page.waitForLoadState('networkidle');
await element.waitFor({ state: 'visible' });

// Avoid using arbitrary timeouts
// BAD: await page.waitForTimeout(1000);
// GOOD: await element.waitFor({ state: 'visible' });

// Use stable selectors
// BAD: nth(2)
// GOOD: filter({ hasText: 'specific text' })

// Retry assertions
await expect(async () => {
  const text = await element.textContent();
  expect(text).toContain('Expected');
}).toPass({ timeout: 5000 });
```

---

## Best Practices

### 1. Use Data Attributes for Testing

Add `data-testid` attributes to components for stable selectors:

```tsx
// Component
<button data-testid="refresh-button">Refresh</button>

// Test
const button = page.locator('[data-testid="refresh-button"]');
```

### 2. Avoid Brittle Selectors

```typescript
// ❌ BAD - Can break with style changes
page.locator('.px-3.py-2.rounded-lg')

// ✅ GOOD - Semantic selectors
page.locator('button:has-text("Refresh")')
page.locator('[data-testid="refresh-button"]')
page.locator('a[href="/dashboard/creator/videos"]')
```

### 3. Keep Tests Independent

```typescript
// ❌ BAD - Tests depend on each other
test('Create item', async ({ page }) => {
  // Creates item
});
test('Edit item', async ({ page }) => {
  // Assumes item exists from previous test
});

// ✅ GOOD - Each test is independent
test('Edit item', async ({ page }) => {
  // Create item first
  // Then edit it
  // Clean up after
});
```

### 4. Clean Up After Tests

```typescript
test.afterEach(async ({ page }) => {
  // Clean up test data
  // Close open modals
  // Reset state
});
```

### 5. Use Descriptive Test Names

```typescript
// ❌ BAD
test('Test 1', async ({ page }) => { ... });
test('It works', async ({ page }) => { ... });

// ✅ GOOD
test('DateRangePicker displays all 5 presets', async ({ page }) => { ... });
test('Mobile menu opens and closes correctly', async ({ page }) => { ... });
```

### 6. Group Related Tests

```typescript
test.describe('DateRangePicker', () => {
  test.describe('Preset Selection', () => {
    test('displays all presets', async ({ page }) => { ... });
    test('changes date on selection', async ({ page }) => { ... });
  });

  test.describe('Responsive Behavior', () => {
    test('shows date on desktop', async ({ page }) => { ... });
    test('hides date on mobile', async ({ page }) => { ... });
  });
});
```

### 7. Document Complex Tests

```typescript
test('Complex user flow', async ({ page }) => {
  // STEP 1: Navigate to overview
  await goToOverview(page);

  // STEP 2: Open date picker and select last month
  const picker = page.locator('select').first();
  await picker.selectOption('lastMonth');

  // STEP 3: Verify data updates
  await page.waitForTimeout(1000); // Wait for data fetch
  const chart = page.locator('[data-testid="analytics-chart"]');
  await expect(chart).toBeVisible();
});
```

### 8. Use Page Object Model for Complex Pages

```typescript
// page-objects/DashboardPage.ts
export class DashboardPage {
  constructor(private page: Page) {}

  async navigateToVideos() {
    await this.page.locator('a:has-text("Videos")').click();
    await this.page.waitForURL(/.*videos/);
  }

  async getActiveTab() {
    return this.page.locator('.bg-gray-a4.text-gray-12').first();
  }
}

// In test
const dashboard = new DashboardPage(page);
await dashboard.navigateToVideos();
```

### 9. Handle Async Operations Properly

```typescript
// ❌ BAD - Not waiting for async operation
const text = element.textContent();
expect(text).toBe('Expected');

// ✅ GOOD - Awaiting async operation
const text = await element.textContent();
expect(text).toBe('Expected');

// ✅ BETTER - Using Playwright's built-in assertions
await expect(element).toHaveText('Expected');
```

### 10. Test Error States

```typescript
test('Handles API error gracefully', async ({ page }) => {
  // Intercept API and return error
  await page.route('/api/analytics', route =>
    route.fulfill({ status: 500 })
  );

  // Trigger action
  await page.locator('[data-testid="refresh-button"]').click();

  // Verify error handling
  const errorMessage = page.locator('[data-testid="error-message"]');
  await expect(errorMessage).toBeVisible();
});
```

---

## Summary

This testing infrastructure provides:

- **46 total tests** across 3 test suites
- **Comprehensive coverage** of navigation, components, and responsive behavior
- **Reusable patterns** for writing new tests
- **Helper functions** for common operations
- **Clear documentation** for team collaboration

For questions or issues, refer to:
- Playwright Documentation: https://playwright.dev
- Project documentation: `docs/dashboard-overhaul/`
- Agent 3 documentation: `docs/dashboard-overhaul/wave-1/agent-3-playwright-setup.md`

---

**Last Updated**: 2025-11-10
**Maintained By**: Wave 1 - Agent 3
**Version**: 1.0.0
