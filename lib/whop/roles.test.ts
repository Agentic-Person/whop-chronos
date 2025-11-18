/**
 * Role Detection Service Tests
 *
 * Run with: npx tsx lib/whop/roles.test.ts
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../../.env.local') });

import {
  detectUserRole,
  getDefaultDashboardRoute,
  canAccessCreatorDashboard,
  canAccessStudentDashboard,
  requireRole,
  hasAnyAccess,
  clearRoleCache,
  getRoleCacheStats,
} from './roles';

// ============================================================================
// Test Utilities
// ============================================================================

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, message: string): void {
  if (condition) {
    console.log(`✅ ${message}`);
    testsPassed++;
  } else {
    console.error(`❌ ${message}`);
    testsFailed++;
  }
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual === expected) {
    console.log(`✅ ${message}`);
    testsPassed++;
  } else {
    console.error(`❌ ${message}`);
    console.error(`   Expected: ${expected}`);
    console.error(`   Actual: ${actual}`);
    testsFailed++;
  }
}

function assertThrows(fn: () => void, message: string): void {
  try {
    fn();
    console.error(`❌ ${message} (did not throw)`);
    testsFailed++;
  } catch {
    console.log(`✅ ${message}`);
    testsPassed++;
  }
}

// ============================================================================
// Dev Bypass Mode Tests (requires DEV_BYPASS_AUTH=true)
// ============================================================================

async function testDevBypassMode(): Promise<void> {
  console.log('\n📋 Testing Dev Bypass Mode...\n');

  // Clear cache before tests
  clearRoleCache();

  // Test creator-only user
  const creatorResult = await detectUserRole('00000000-0000-0000-0000-000000000001');
  assertEqual(creatorResult.role, 'creator', 'Test creator has creator role');
  assert(creatorResult.isCreator, 'Test creator isCreator is true');
  assert(!creatorResult.isStudent, 'Test creator isStudent is false');
  assert(!!creatorResult.companyId, 'Test creator has companyId');

  // Test student-only user
  const studentResult = await detectUserRole('00000000-0000-0000-0000-000000000002');
  assertEqual(studentResult.role, 'student', 'Test student has student role');
  assert(!studentResult.isCreator, 'Test student isCreator is false');
  assert(studentResult.isStudent, 'Test student isStudent is true');
  assert(!!studentResult.membershipId, 'Test student has membershipId');

  // Test dual-role user
  const dualResult = await detectUserRole('00000000-0000-0000-0000-000000000003');
  assertEqual(dualResult.role, 'both', 'Test dual-role user has both role');
  assert(dualResult.isCreator, 'Test dual-role user isCreator is true');
  assert(dualResult.isStudent, 'Test dual-role user isStudent is true');
  assert(!!dualResult.companyId, 'Test dual-role user has companyId');
  assert(!!dualResult.membershipId, 'Test dual-role user has membershipId');

  // Test unknown user defaults to creator in dev mode
  const unknownResult = await detectUserRole('unknown-user-id');
  assertEqual(unknownResult.role, 'creator', 'Unknown test user defaults to creator');
}

// ============================================================================
// Routing Helper Tests
// ============================================================================

function testRoutingHelpers(): void {
  console.log('\n📋 Testing Routing Helpers...\n');

  // Test getDefaultDashboardRoute
  assertEqual(
    getDefaultDashboardRoute('creator'),
    '/dashboard/creator/overview',
    'Creator route is correct'
  );
  assertEqual(
    getDefaultDashboardRoute('student'),
    '/dashboard/student/courses',
    'Student route is correct'
  );
  assertEqual(
    getDefaultDashboardRoute('both'),
    '/dashboard/creator/overview',
    'Dual-role defaults to creator route'
  );
  assertEqual(getDefaultDashboardRoute('none'), '/', 'None role redirects to landing page');

  // Test canAccessCreatorDashboard
  assert(canAccessCreatorDashboard('creator'), 'Creator can access creator dashboard');
  assert(!canAccessCreatorDashboard('student'), 'Student cannot access creator dashboard');
  assert(canAccessCreatorDashboard('both'), 'Dual-role can access creator dashboard');
  assert(!canAccessCreatorDashboard('none'), 'None cannot access creator dashboard');

  // Test canAccessStudentDashboard
  assert(!canAccessStudentDashboard('creator'), 'Creator cannot access student dashboard');
  assert(canAccessStudentDashboard('student'), 'Student can access student dashboard');
  assert(canAccessStudentDashboard('both'), 'Dual-role can access student dashboard');
  assert(!canAccessStudentDashboard('none'), 'None cannot access student dashboard');

  // Test hasAnyAccess
  assert(hasAnyAccess('creator'), 'Creator has access');
  assert(hasAnyAccess('student'), 'Student has access');
  assert(hasAnyAccess('both'), 'Dual-role has access');
  assert(!hasAnyAccess('none'), 'None has no access');
}

// ============================================================================
// Validation Helper Tests
// ============================================================================

function testValidationHelpers(): void {
  console.log('\n📋 Testing Validation Helpers...\n');

  // Test requireRole for creator
  try {
    requireRole('creator', 'creator');
    console.log('✅ Creator role passes creator requirement');
    testsPassed++;
  } catch {
    console.error('❌ Creator role should pass creator requirement');
    testsFailed++;
  }

  assertThrows(
    () => requireRole('student', 'creator'),
    'Student role fails creator requirement'
  );

  // Test requireRole for student
  try {
    requireRole('student', 'student');
    console.log('✅ Student role passes student requirement');
    testsPassed++;
  } catch {
    console.error('❌ Student role should pass student requirement');
    testsFailed++;
  }

  assertThrows(
    () => requireRole('creator', 'student'),
    'Creator role fails student requirement'
  );

  // Test dual-role passes both requirements
  try {
    requireRole('both', 'creator');
    requireRole('both', 'student');
    console.log('✅ Dual-role passes both requirements');
    testsPassed++;
  } catch {
    console.error('❌ Dual-role should pass both requirements');
    testsFailed++;
  }
}

// ============================================================================
// Cache Tests
// ============================================================================

async function testCacheBehavior(): Promise<void> {
  console.log('\n📋 Testing Cache Behavior...\n');

  // Clear cache
  clearRoleCache();
  let stats = getRoleCacheStats();
  assertEqual(stats.size, 0, 'Cache is empty after clear');

  // First call should populate cache
  await detectUserRole('00000000-0000-0000-0000-000000000001');
  stats = getRoleCacheStats();
  assertEqual(stats.size, 1, 'Cache has 1 entry after first detection');

  // Second call should use cache
  const startTime = Date.now();
  await detectUserRole('00000000-0000-0000-0000-000000000001');
  const elapsed = Date.now() - startTime;
  assert(elapsed < 10, 'Second call is fast (uses cache)');

  // Clear specific user
  clearRoleCache('00000000-0000-0000-0000-000000000001');
  stats = getRoleCacheStats();
  assertEqual(stats.size, 0, 'Cache is empty after clearing specific user');

  // Multiple users
  await detectUserRole('00000000-0000-0000-0000-000000000001');
  await detectUserRole('00000000-0000-0000-0000-000000000002');
  stats = getRoleCacheStats();
  assertEqual(stats.size, 2, 'Cache has 2 entries for 2 users');

  // Clear all
  clearRoleCache();
  stats = getRoleCacheStats();
  assertEqual(stats.size, 0, 'Cache cleared for all users');
}

// ============================================================================
// Run All Tests
// ============================================================================

async function runAllTests(): Promise<void> {
  console.log('🧪 Role Detection Service Tests\n');
  console.log('='.repeat(50));

  // Check if dev bypass mode is enabled
  if (process.env['DEV_BYPASS_AUTH'] !== 'true') {
    console.error('\n⚠️  DEV_BYPASS_AUTH is not enabled');
    console.error('Please set DEV_BYPASS_AUTH=true in your .env.local file');
    console.error('These tests require dev bypass mode to work\n');
    process.exit(1);
  }

  try {
    await testDevBypassMode();
    testRoutingHelpers();
    testValidationHelpers();
    await testCacheBehavior();

    console.log('\n' + '='.repeat(50));
    console.log(`\n✅ Tests Passed: ${testsPassed}`);
    console.log(`❌ Tests Failed: ${testsFailed}`);
    console.log(`📊 Total Tests: ${testsPassed + testsFailed}\n`);

    if (testsFailed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Test suite failed with error:', error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}
