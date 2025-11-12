/**
 * Test Script for YouTube Import API Endpoint
 *
 * Tests the /api/video/youtube/import endpoint with various scenarios
 *
 * Usage:
 * npx tsx scripts/test-youtube-import-endpoint.ts
 */

import 'dotenv/config';

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const TEST_CREATOR_ID = process.env.TEST_CREATOR_ID || 'test-creator-id';

interface TestCase {
  name: string;
  url: string;
  shouldSucceed: boolean;
  expectedError?: string;
}

const testCases: TestCase[] = [
  // Valid YouTube URLs
  {
    name: 'Standard YouTube URL',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    shouldSucceed: true,
  },
  {
    name: 'Short YouTube URL',
    url: 'https://youtu.be/dQw4w9WgXcQ',
    shouldSucceed: true,
  },
  {
    name: 'YouTube Embed URL',
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    shouldSucceed: true,
  },

  // Invalid URLs
  {
    name: 'Invalid URL format',
    url: 'not-a-valid-url',
    shouldSucceed: false,
    expectedError: 'Invalid YouTube URL',
  },
  {
    name: 'Non-YouTube URL',
    url: 'https://vimeo.com/123456',
    shouldSucceed: false,
    expectedError: 'Invalid YouTube URL',
  },
  {
    name: 'Empty URL',
    url: '',
    shouldSucceed: false,
    expectedError: 'Missing or invalid videoUrl',
  },
];

async function testYouTubeImport(testCase: TestCase): Promise<void> {
  console.log(`\n🧪 Testing: ${testCase.name}`);
  console.log(`   URL: ${testCase.url}`);

  try {
    const response = await fetch(`${API_BASE_URL}/api/video/youtube/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        videoUrl: testCase.url,
        creatorId: TEST_CREATOR_ID,
      }),
    });

    const data = await response.json();

    if (testCase.shouldSucceed) {
      if (response.ok && data.success) {
        console.log(`   ✅ SUCCESS`);
        console.log(`   Video ID: ${data.video.id}`);
        console.log(`   Title: ${data.video.title}`);
        console.log(`   YouTube ID: ${data.video.youtube_video_id}`);
        console.log(`   Status: ${data.video.status}`);
      } else {
        console.log(`   ❌ FAILED (expected success)`);
        console.log(`   Response:`, data);
      }
    } else {
      if (!response.ok && data.error) {
        console.log(`   ✅ CORRECTLY REJECTED`);
        console.log(`   Error: ${data.error}`);
        if (testCase.expectedError && !data.error.includes(testCase.expectedError)) {
          console.log(`   ⚠️  Expected error message to include: "${testCase.expectedError}"`);
        }
      } else {
        console.log(`   ❌ FAILED (expected rejection)`);
        console.log(`   Response:`, data);
      }
    }
  } catch (error) {
    console.log(`   ❌ REQUEST FAILED`);
    console.error(`   Error:`, error);
  }
}

async function runTests(): Promise<void> {
  console.log('🚀 Starting YouTube Import API Tests');
  console.log(`   API Base URL: ${API_BASE_URL}`);
  console.log(`   Test Creator ID: ${TEST_CREATOR_ID}`);
  console.log('='.repeat(60));

  for (const testCase of testCases) {
    await testYouTubeImport(testCase);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✨ Tests completed');
}

// Run tests
runTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
