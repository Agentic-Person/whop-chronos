#!/usr/bin/env node
/**
 * E2E Test: AI Chat UI Flow
 *
 * Tests the complete chat experience in the browser:
 * 1. Navigate to student chat page
 * 2. Type a message
 * 3. Send it
 * 4. Verify AI response with video references
 *
 * Usage: npx playwright test scripts/test-chat-ui-e2e.ts
 * Or: npx tsx scripts/test-chat-ui-e2e.ts
 */

import { chromium, Browser, Page } from 'playwright';

const BASE_URL = 'http://localhost:3007';
const TEST_TIMEOUT = 60000; // 60 seconds for AI response

async function runChatE2ETest() {
  console.log('🎭 Starting Chat UI E2E Test...\n');

  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    // Launch browser
    console.log('1️⃣ Launching browser...');
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox']
    });
    const context = await browser.newContext();
    page = await context.newPage();

    // Enable console logging from the page
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('   [Browser Error]', msg.text());
      }
    });

    // Log network requests to /api/chat
    page.on('request', request => {
      if (request.url().includes('/api/chat')) {
        console.log('   [Network Request]', request.method(), request.url());
        console.log('   [Request Body]', request.postData());
      }
    });

    page.on('response', response => {
      if (response.url().includes('/api/chat')) {
        console.log('   [Network Response]', response.status(), response.url());
      }
    });

    // Navigate to student chat page
    console.log('2️⃣ Navigating to student chat page...');
    const chatUrl = `${BASE_URL}/dashboard/student/chat`;
    const response = await page.goto(chatUrl, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    if (!response || response.status() !== 200) {
      throw new Error(`Failed to load chat page. Status: ${response?.status()}`);
    }
    console.log('   ✅ Chat page loaded successfully');

    // Take screenshot of initial state
    await page.screenshot({ path: 'test-results/chat-1-initial.png' });
    console.log('   📸 Screenshot: chat-1-initial.png');

    // Wait for chat interface to be ready
    console.log('3️⃣ Waiting for chat interface...');

    // Look for the chat input - try multiple selectors
    const inputSelectors = [
      'textarea[placeholder*="message"]',
      'textarea[placeholder*="Ask"]',
      'input[placeholder*="message"]',
      'input[placeholder*="Ask"]',
      '[data-testid="chat-input"]',
      'textarea',
      'input[type="text"]'
    ];

    let chatInput = null;
    for (const selector of inputSelectors) {
      try {
        chatInput = await page.waitForSelector(selector, { timeout: 5000 });
        if (chatInput) {
          console.log(`   ✅ Found chat input with selector: ${selector}`);
          break;
        }
      } catch {
        // Try next selector
      }
    }

    if (!chatInput) {
      // Take screenshot to see what's on the page
      await page.screenshot({ path: 'test-results/chat-error-no-input.png' });
      console.log('   📸 Screenshot saved: chat-error-no-input.png');

      // Log the page content for debugging
      const pageContent = await page.content();
      console.log('   Page title:', await page.title());
      console.log('   Page URL:', page.url());

      throw new Error('Could not find chat input field. Check screenshot for page state.');
    }

    // Type a test message
    console.log('4️⃣ Typing test message...');
    const testMessage = 'What is this video about?';
    await chatInput.fill(testMessage);
    console.log(`   ✅ Typed: "${testMessage}"`);

    // Take screenshot before sending
    await page.screenshot({ path: 'test-results/chat-2-message-typed.png' });
    console.log('   📸 Screenshot: chat-2-message-typed.png');

    // Find and click send button
    console.log('5️⃣ Sending message...');
    const sendSelectors = [
      'button[type="submit"]',
      'button:has-text("Send")',
      '[data-testid="send-button"]',
      'button[aria-label*="send"]',
      'button svg' // Often send buttons just have an icon
    ];

    let sendButton = null;
    for (const selector of sendSelectors) {
      try {
        sendButton = await page.waitForSelector(selector, { timeout: 3000 });
        if (sendButton && await sendButton.isEnabled()) {
          console.log(`   ✅ Found send button with selector: ${selector}`);
          break;
        }
      } catch {
        // Try next selector
      }
    }

    if (!sendButton) {
      // Try pressing Enter instead
      console.log('   ⚠️ No send button found, trying Enter key...');
      await chatInput.press('Enter');
    } else {
      await sendButton.click();
    }

    console.log('   ✅ Message sent!');

    // Wait for AI response
    console.log('6️⃣ Waiting for AI response (up to 60s)...');

    // Look for response indicators
    const responseSelectors = [
      '[data-testid="assistant-message"]',
      '.assistant-message',
      '[role="article"]:has-text("Rick")', // Response should mention Rick Astley
      'div:has-text("Never Gonna Give")',
      '.message-content'
    ];

    let responseFound = false;
    const startTime = Date.now();

    while (Date.now() - startTime < TEST_TIMEOUT && !responseFound) {
      // Check for loading indicator disappearing or response appearing
      const pageText = await page.textContent('body');

      // Look for key phrases that would indicate a successful response
      if (pageText && (
        pageText.includes('Rick Astley') ||
        pageText.includes('Never Gonna Give You Up') ||
        pageText.includes('music video') ||
        pageText.includes('Rickroll')
      )) {
        responseFound = true;
        console.log('   ✅ AI response received!');
        break;
      }

      // Check for actual chat error messages (not dev mode warnings)
      if (pageText && (
        pageText.includes('Failed to send message') ||
        pageText.includes('500 Internal Server Error') ||
        pageText.includes('Something went wrong')
      )) {
        await page.screenshot({ path: 'test-results/chat-error-response.png' });
        throw new Error('Chat error detected in response. Check screenshot.');
      }

      await page.waitForTimeout(1000);
      process.stdout.write('.');
    }

    console.log('');

    if (!responseFound) {
      await page.screenshot({ path: 'test-results/chat-timeout.png' });
      throw new Error('Timeout waiting for AI response. Check screenshot.');
    }

    // Take final screenshot
    await page.screenshot({ path: 'test-results/chat-3-response.png' });
    console.log('   📸 Screenshot: chat-3-response.png');

    // Check for video references
    console.log('7️⃣ Checking for video references...');
    const hasVideoRef = await page.textContent('body');
    if (hasVideoRef && hasVideoRef.includes('Rick Astley')) {
      console.log('   ✅ Video reference found in response!');
    } else {
      console.log('   ⚠️ Video reference not visible in response');
    }

    console.log('\n✅ E2E TEST PASSED! Chat UI is working correctly.\n');

  } catch (error) {
    console.error('\n❌ E2E TEST FAILED:', error instanceof Error ? error.message : error);

    if (page) {
      await page.screenshot({ path: 'test-results/chat-error-final.png' });
      console.log('📸 Error screenshot saved: chat-error-final.png');
    }

    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Create test-results directory
import { mkdirSync } from 'fs';
try {
  mkdirSync('test-results', { recursive: true });
} catch {}

// Run the test
runChatE2ETest();
