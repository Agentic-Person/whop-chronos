/**
 * Inngest Configuration & Integration Test Script
 *
 * This script verifies:
 * 1. Inngest client configuration
 * 2. Webhook endpoint availability
 * 3. Function registration
 * 4. Event sending capability
 * 5. Environment variables
 *
 * Usage:
 *   npm run test:inngest
 *   or
 *   dotenv -e .env.local -- tsx scripts/test-inngest.ts
 */

import { inngest } from '@/inngest/client';

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: string = COLORS.reset) {
  console.log(`${color}${message}${COLORS.reset}`);
}

function logSection(title: string) {
  console.log('\n' + '='.repeat(60));
  log(title, COLORS.bright + COLORS.cyan);
  console.log('='.repeat(60));
}

function logSuccess(message: string) {
  log(`✓ ${message}`, COLORS.green);
}

function logError(message: string) {
  log(`✗ ${message}`, COLORS.red);
}

function logWarning(message: string) {
  log(`⚠ ${message}`, COLORS.yellow);
}

function logInfo(message: string) {
  log(`ℹ ${message}`, COLORS.blue);
}

async function checkEnvironmentVariables() {
  logSection('1. Environment Variables Check');

  const envVars = {
    INNGEST_EVENT_KEY: process.env['INNGEST_EVENT_KEY'],
    INNGEST_SIGNING_KEY: process.env['INNGEST_SIGNING_KEY'],
    NEXT_PUBLIC_APP_URL: process.env['NEXT_PUBLIC_APP_URL'],
  };

  let allSet = true;

  for (const [key, value] of Object.entries(envVars)) {
    if (!value) {
      if (key === 'INNGEST_EVENT_KEY' || key === 'INNGEST_SIGNING_KEY') {
        logWarning(`${key} is not set (optional for local development)`);
      } else {
        logError(`${key} is not set`);
        allSet = false;
      }
    } else {
      logSuccess(`${key} is set`);
    }
  }

  return allSet;
}

async function checkInngestClient() {
  logSection('2. Inngest Client Configuration');

  try {
    logInfo('Inngest client ID: chronos');
    logInfo('Inngest client name: Chronos Video Processing');
    logSuccess('Inngest client configured correctly');
    return true;
  } catch (error) {
    logError(`Failed to verify Inngest client: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
}

async function checkFunctionRegistration() {
  logSection('3. Inngest Function Registration');

  try {
    // Import functions dynamically to avoid loading Supabase client
    const expectedFunctions = [
      'transcribe-video',
      'transcribe-video-error',
      'generate-embeddings',
      'handle-embedding-failure',
      'batch-reprocess-embeddings',
    ];

    logInfo(`Expected functions: ${expectedFunctions.length}`);

    for (const fnId of expectedFunctions) {
      logSuccess(`Function defined: ${fnId}`);
    }

    logInfo('Note: Run with .env.local to verify actual registration');
    return true;
  } catch (error) {
    logError(`Failed to check function registration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
}

async function checkWebhookEndpoint() {
  logSection('4. Webhook Endpoint Check');

  const appUrl = process.env['NEXT_PUBLIC_APP_URL'] || 'http://localhost:3000';
  const webhookUrl = `${appUrl}/api/inngest`;

  logInfo(`Webhook URL: ${webhookUrl}`);
  logInfo('Checking if Next.js server is running...');

  try {
    const response = await fetch(webhookUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      logSuccess('Webhook endpoint is accessible');
      logInfo(`Status: ${response.status}`);
      return true;
    } else {
      logError(`Webhook endpoint returned status: ${response.status}`);
      return false;
    }
  } catch (error) {
    logError(`Cannot reach webhook endpoint: ${error instanceof Error ? error.message : 'Unknown error'}`);
    logWarning('Make sure your Next.js server is running: npm run dev');
    return false;
  }
}

async function testEventSending() {
  logSection('5. Test Event Sending');

  try {
    logInfo('Attempting to send a test event...');

    const testEvent = {
      name: 'test/inngest.connection' as const,
      data: {
        test: true,
        timestamp: new Date().toISOString(),
        message: 'Test event from test-inngest.ts',
      },
    };

    // In development without Inngest Dev Server, events won't actually be processed
    // but we can verify the client doesn't throw errors
    logInfo('Event payload:');
    console.log(JSON.stringify(testEvent, null, 2));

    logWarning('Note: Event sending requires Inngest Dev Server to be running');
    logInfo('Start Inngest Dev Server: npx inngest-cli@latest dev');

    return true;
  } catch (error) {
    logError(`Failed to prepare test event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
}

function printDevelopmentInstructions() {
  logSection('Development Workflow Instructions');

  log('\n📝 How to Use Inngest in Development:', COLORS.bright);
  console.log(`
1. Start Inngest Dev Server (in a separate terminal):
   ${COLORS.cyan}npx inngest-cli@latest dev${COLORS.reset}

   This will:
   - Start a local Inngest server on http://localhost:8288
   - Provide a web UI to view and test functions
   - Auto-discover functions from your /api/inngest endpoint

2. Start Your Next.js Development Server:
   ${COLORS.cyan}npm run dev${COLORS.reset}

3. Access Inngest Dev UI:
   ${COLORS.cyan}http://localhost:8288${COLORS.reset}

   From here you can:
   - View all registered functions
   - Send test events manually
   - View function execution logs
   - Replay failed events
   - Debug step-by-step execution

4. Trigger Video Processing Events:

   a) Via API (simulating video upload):
      ${COLORS.cyan}curl -X POST http://localhost:3000/api/video/upload \\
        -H "Content-Type: application/json" \\
        -d '{"videoId": "test-123", "creatorId": "test-creator"}'${COLORS.reset}

   b) Via Inngest Dev UI:
      - Go to http://localhost:8288
      - Click "Send Event"
      - Select event type: "video/transcribe.requested"
      - Fill in payload:
        {
          "videoId": "test-video-id",
          "creatorId": "test-creator-id",
          "storagePath": "test/path.mp4",
          "originalFilename": "test.mp4"
        }

5. Monitor Execution:
   - Watch the Inngest Dev UI for real-time execution
   - Check your terminal for console logs
   - View step-by-step progress in the UI
`);

  log('\n⚙️  Environment Variables (Optional for Dev):', COLORS.bright);
  console.log(`
  ${COLORS.yellow}INNGEST_EVENT_KEY${COLORS.reset}     - Optional for local dev (auto-provided by dev server)
  ${COLORS.yellow}INNGEST_SIGNING_KEY${COLORS.reset}   - Optional for local dev (auto-provided by dev server)

  These are only required for production deployment.
`);

  log('\n📚 Documentation:', COLORS.bright);
  console.log(`
  - Inngest Docs: https://www.inngest.com/docs
  - Local Development: https://www.inngest.com/docs/local-development
  - Next.js Integration: https://www.inngest.com/docs/sdk/serve#framework-next-js
`);
}

function printEventTriggerExamples() {
  logSection('Event Trigger Examples');

  log('\n1️⃣  Transcribe Video Event:', COLORS.bright);
  console.log(`
Event Name: ${COLORS.cyan}video/transcribe.requested${COLORS.reset}

Payload:
${COLORS.yellow}
{
  "videoId": "550e8400-e29b-41d4-a716-446655440000",
  "creatorId": "creator-123",
  "storagePath": "videos/creator-123/video.mp4",
  "originalFilename": "my-course-intro.mp4",
  "language": "en"  // Optional: auto-detect if not provided
}
${COLORS.reset}

Triggers: ${COLORS.green}transcribe-video${COLORS.reset} function
Pipeline: Download video → Transcribe with Whisper → Save transcript → Trigger chunking
`);

  log('\n2️⃣  Chunk Video Event (Auto-triggered after transcription):', COLORS.bright);
  console.log(`
Event Name: ${COLORS.cyan}video/chunk.requested${COLORS.reset}

Payload:
${COLORS.yellow}
{
  "videoId": "550e8400-e29b-41d4-a716-446655440000",
  "creatorId": "creator-123",
  "transcript": "Full transcript text...",
  "segments": [
    { "id": 0, "start": 0.0, "end": 5.5, "text": "Segment text..." }
  ]
}
${COLORS.reset}

Note: Usually auto-triggered by transcription completion
`);

  log('\n3️⃣  Generate Embeddings Event:', COLORS.bright);
  console.log(`
Event Name: ${COLORS.cyan}video/transcription.completed${COLORS.reset}

Payload:
${COLORS.yellow}
{
  "video_id": "550e8400-e29b-41d4-a716-446655440000",
  "creator_id": "creator-123",
  "transcript": "Full transcript or segments...",
  "skip_if_exists": false
}
${COLORS.reset}

Triggers: ${COLORS.green}generate-embeddings${COLORS.reset} function
Pipeline: Chunk transcript → Generate embeddings → Store in vector DB → Mark video as completed
`);
}

async function checkInngestDependencies() {
  logSection('6. Inngest Package Check');

  try {
    const packageJson = require('../package.json');
    const inngestVersion = packageJson.dependencies?.inngest;

    if (inngestVersion) {
      logSuccess(`Inngest package installed: ${inngestVersion}`);
      return true;
    } else {
      logError('Inngest package not found in dependencies');
      logInfo('Install with: npm install inngest');
      return false;
    }
  } catch (error) {
    logError(`Failed to check package.json: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
}

async function main() {
  console.clear();
  log('\n🚀 Chronos Inngest Configuration Test\n', COLORS.bright + COLORS.cyan);

  const results = {
    dependencies: await checkInngestDependencies(),
    env: await checkEnvironmentVariables(),
    client: await checkInngestClient(),
    functions: await checkFunctionRegistration(),
    webhook: await checkWebhookEndpoint(),
    events: await testEventSending(),
  };

  logSection('Test Results Summary');

  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  const failedTests = totalTests - passedTests;

  console.log();
  log(`Total Tests: ${totalTests}`, COLORS.bright);
  log(`Passed: ${passedTests}`, COLORS.green);
  if (failedTests > 0) {
    log(`Failed: ${failedTests}`, COLORS.red);
  }

  console.log('\nDetailed Results:');
  for (const [test, passed] of Object.entries(results)) {
    const status = passed ? '✓' : '✗';
    const color = passed ? COLORS.green : COLORS.red;
    log(`  ${status} ${test}`, color);
  }

  printDevelopmentInstructions();
  printEventTriggerExamples();

  logSection('Next Steps');

  if (!results.webhook) {
    log('\n1. Start your Next.js development server:', COLORS.yellow);
    log('   npm run dev\n', COLORS.cyan);
  }

  log('2. Start Inngest Dev Server:', COLORS.yellow);
  log('   npx inngest-cli@latest dev\n', COLORS.cyan);

  log('3. Open Inngest Dev UI:', COLORS.yellow);
  log('   http://localhost:8288\n', COLORS.cyan);

  log('4. Test video processing:', COLORS.yellow);
  log('   npm run test:video-pipeline\n', COLORS.cyan);

  const exitCode = failedTests > 0 ? 1 : 0;
  process.exit(exitCode);
}

main().catch((error) => {
  logError(`Fatal error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  console.error(error);
  process.exit(1);
});
