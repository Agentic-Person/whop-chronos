/**
 * Whop Integration Test Suite
 *
 * Run with: npx tsx lib/whop/test-integration.ts
 */

import { whopApi } from './api-client';
import { webhooks } from './webhooks';

// ============================================================================
// Test Configuration
// ============================================================================

const TESTS_ENABLED = process.env.NODE_ENV === 'development';

// ============================================================================
// API Client Tests
// ============================================================================

async function testApiClient() {
  console.log('\n🔍 Testing Whop API Client...\n');

  try {
    // Test: List Products
    console.log('📦 Listing products...');
    const products = await whopApi.listProducts(5);
    console.log(`✅ Found ${products.length} products`);
    if (products.length > 0) {
      console.log('   First product:', products[0]?.name);
    }
  } catch (error) {
    console.error('❌ Failed to list products:', error);
  }

  try {
    // Test: Get Company Info
    console.log('\n🏢 Getting company info...');
    const company = await whopApi.getCompanyInfo();
    console.log('✅ Company:', company.name);
  } catch (error) {
    console.error('❌ Failed to get company info:', error);
  }

  try {
    // Test: List Memberships
    console.log('\n👥 Listing memberships...');
    const memberships = await whopApi.listMemberships({ limit: 5 });
    console.log(`✅ Found ${memberships.length} memberships`);
    if (memberships.length > 0) {
      console.log('   First membership:', {
        id: memberships[0]?.id,
        status: memberships[0]?.status,
        valid: memberships[0]?.valid,
      });
    }
  } catch (error) {
    console.error('❌ Failed to list memberships:', error);
  }

  try {
    // Test: List Users
    console.log('\n👤 Listing users...');
    const users = await whopApi.listUsers(5);
    console.log(`✅ Found ${users.length} users`);
    if (users.length > 0) {
      console.log('   First user:', users[0]?.username || users[0]?.email);
    }
  } catch (error) {
    console.error('❌ Failed to list users:', error);
  }
}

// ============================================================================
// Webhook Tests
// ============================================================================

async function testWebhooks() {
  console.log('\n🔗 Testing Webhook Handler...\n');

  // Create test webhook payload
  const testPayload = webhooks.test.createPayload('membership.created', {
    user: {
      id: 'user_test123',
      email: 'test@example.com',
      username: 'testuser',
      profile_pic_url: null,
      social_accounts: {},
      created_at: Date.now(),
    },
    membership: {
      id: 'mem_test123',
      user_id: 'user_test123',
      product_id: 'prod_test123',
      plan_id: 'plan_test123',
      status: 'active',
      valid: true,
      cancel_at_period_end: false,
      renewal_period_start: Date.now(),
      renewal_period_end: Date.now() + 30 * 24 * 60 * 60 * 1000,
      created_at: Date.now(),
    },
    product: {
      id: 'prod_test123',
      name: 'Test Product',
      description: 'Test product for development',
      visibility: 'visible',
      created_at: Date.now(),
    },
  });

  // Generate signature
  const payloadString = JSON.stringify(testPayload);
  const signature = webhooks.test.generateSignature(payloadString);

  console.log('📝 Generated test payload');
  console.log('🔐 Generated test signature');

  // Verify signature
  const isValid = webhooks.verify(payloadString, signature);
  console.log(isValid ? '✅ Signature verified' : '❌ Signature verification failed');

  // Process webhook
  try {
    console.log('\n📨 Processing webhook...');
    await webhooks.process(testPayload);
    console.log('✅ Webhook processed successfully');
  } catch (error) {
    console.error('❌ Webhook processing failed:', error);
  }
}

// ============================================================================
// OAuth Tests
// ============================================================================

function testOAuth() {
  console.log('\n🔐 Testing OAuth Configuration...\n');

  try {
    const authUrl = whopApi.getOAuthUrl('test-state');
    console.log('✅ OAuth URL generated:', authUrl);

    // Parse URL to verify structure
    const url = new URL(authUrl);
    console.log('   Base:', url.origin + url.pathname);
    console.log('   Client ID:', url.searchParams.get('client_id'));
    console.log('   Redirect URI:', url.searchParams.get('redirect_uri'));
    console.log('   State:', url.searchParams.get('state'));
  } catch (error) {
    console.error('❌ OAuth configuration failed:', error);
  }
}

// ============================================================================
// Environment Check
// ============================================================================

function checkEnvironment() {
  console.log('\n⚙️  Environment Configuration Check\n');

  const requiredVars = [
    'WHOP_API_KEY',
    'NEXT_PUBLIC_WHOP_APP_ID',
    'WHOP_CLIENT_ID',
    'WHOP_CLIENT_SECRET',
    'WHOP_WEBHOOK_SECRET',
    'WHOP_TOKEN_ENCRYPTION_KEY',
  ];

  let allSet = true;

  for (const varName of requiredVars) {
    const isSet = !!process.env[varName];
    const status = isSet ? '✅' : '❌';
    console.log(`${status} ${varName}`);

    if (!isSet) {
      allSet = false;
    }
  }

  if (!allSet) {
    console.log('\n⚠️  Some environment variables are missing');
    console.log('   Copy .env.example to .env.local and fill in values');
  } else {
    console.log('\n✅ All environment variables configured');
  }

  return allSet;
}

// ============================================================================
// Run Tests
// ============================================================================

async function runTests() {
  console.log('╔═══════════════════════════════════════╗');
  console.log('║  Whop Integration Test Suite         ║');
  console.log('╚═══════════════════════════════════════╝');

  if (!TESTS_ENABLED) {
    console.log('\n⚠️  Tests disabled in production mode');
    console.log('   Set NODE_ENV=development to run tests');
    process.exit(0);
  }

  // Check environment
  const envOk = checkEnvironment();

  if (!envOk) {
    console.log('\n❌ Cannot run tests without proper environment configuration');
    process.exit(1);
  }

  // Run tests
  await testApiClient();
  testOAuth();
  await testWebhooks();

  console.log('\n╔═══════════════════════════════════════╗');
  console.log('║  Test Suite Complete                  ║');
  console.log('╚═══════════════════════════════════════╝\n');
}

// Run if executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

export { runTests, testApiClient, testWebhooks, testOAuth, checkEnvironment };
