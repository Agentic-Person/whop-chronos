/**
 * Verification Script: Database Security Fix
 *
 * This script verifies that the critical security vulnerability has been fixed:
 * - Service role key is NOT exposed in browser code
 * - Browser client only uses anon key
 * - Student courses API uses DEV_BYPASS_AUTH correctly
 */

import fs from 'fs';
import path from 'path';

const PROJECT_ROOT = path.resolve(__dirname, '..');

interface SecurityCheck {
  name: string;
  passed: boolean;
  details: string;
}

const checks: SecurityCheck[] = [];

// Check 1: Verify client-browser.ts does NOT use service role key
console.log('\n🔍 Check 1: Browser client security...');
const browserClientPath = path.join(PROJECT_ROOT, 'lib/db/client-browser.ts');
const browserClientContent = fs.readFileSync(browserClientPath, 'utf-8');

const hasServiceRoleKeyRef = browserClientContent.includes('NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY');
const hasServiceRoleKeyUsage = browserClientContent.includes('serviceRoleKey');
const alwaysUsesAnonKey = browserClientContent.includes('supabaseAnonKey') &&
                          browserClientContent.includes('createClient<Database>(supabaseUrl, supabaseAnonKey');

checks.push({
  name: 'Browser client does NOT reference NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY',
  passed: !hasServiceRoleKeyRef,
  details: hasServiceRoleKeyRef
    ? '❌ SECURITY ISSUE: Browser client still references service role key'
    : '✅ Service role key not referenced'
});

checks.push({
  name: 'Browser client does NOT use service role key variable',
  passed: !hasServiceRoleKeyUsage,
  details: hasServiceRoleKeyUsage
    ? '❌ SECURITY ISSUE: Browser client has serviceRoleKey variable'
    : '✅ No service role key variable'
});

checks.push({
  name: 'Browser client ALWAYS uses anon key',
  passed: alwaysUsesAnonKey,
  details: alwaysUsesAnonKey
    ? '✅ Browser client correctly uses anon key'
    : '❌ Browser client may not be using anon key correctly'
});

// Check 2: Verify student courses API uses DEV_BYPASS_AUTH
console.log('\n🔍 Check 2: Student courses API security...');
const studentApiPath = path.join(PROJECT_ROOT, 'app/api/courses/student/route.ts');
const studentApiContent = fs.readFileSync(studentApiPath, 'utf-8');

const usesDEV_BYPASS_AUTH = studentApiContent.includes("process.env.DEV_BYPASS_AUTH === 'true'");
const usesServiceSupabase = studentApiContent.includes('getServiceSupabase()');
const hasProperConditional = studentApiContent.includes('if (!isDev || !bypassAuth)');

checks.push({
  name: 'Student API uses DEV_BYPASS_AUTH environment variable',
  passed: usesDEV_BYPASS_AUTH,
  details: usesDEV_BYPASS_AUTH
    ? '✅ Uses DEV_BYPASS_AUTH for dev mode logic'
    : '❌ Does not use DEV_BYPASS_AUTH'
});

checks.push({
  name: 'Student API uses service role client (server-side is OK)',
  passed: usesServiceSupabase,
  details: usesServiceSupabase
    ? '✅ Uses getServiceSupabase() (server-side only - this is safe)'
    : '⚠️  Does not use service supabase client'
});

checks.push({
  name: 'Student API has proper dev bypass conditional',
  passed: hasProperConditional,
  details: hasProperConditional
    ? '✅ Has proper conditional for dev mode'
    : '❌ Missing proper conditional logic'
});

// Check 3: Verify no NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY in env examples
console.log('\n🔍 Check 3: Environment variable examples...');
const envExamplePath = path.join(PROJECT_ROOT, '.env.example');
const envProdExamplePath = path.join(PROJECT_ROOT, '.env.production.example');

const envExampleContent = fs.readFileSync(envExamplePath, 'utf-8');
const envProdExampleContent = fs.readFileSync(envProdExamplePath, 'utf-8');

const envHasBadKey = envExampleContent.includes('NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY');
const envProdHasBadKey = envProdExampleContent.includes('NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY');
const envHasGoodKey = envExampleContent.includes('SUPABASE_SERVICE_ROLE_KEY=');
const envProdHasGoodKey = envProdExampleContent.includes('SUPABASE_SERVICE_ROLE_KEY=');

checks.push({
  name: '.env.example does NOT have NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY',
  passed: !envHasBadKey,
  details: envHasBadKey
    ? '❌ SECURITY ISSUE: .env.example exposes service role key'
    : '✅ .env.example is secure'
});

checks.push({
  name: '.env.production.example does NOT have NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY',
  passed: !envProdHasBadKey,
  details: envProdHasBadKey
    ? '❌ SECURITY ISSUE: .env.production.example exposes service role key'
    : '✅ .env.production.example is secure'
});

checks.push({
  name: '.env.example HAS SUPABASE_SERVICE_ROLE_KEY (server-side)',
  passed: envHasGoodKey,
  details: envHasGoodKey
    ? '✅ .env.example has server-side service role key'
    : '⚠️  .env.example missing service role key example'
});

checks.push({
  name: '.env.production.example HAS SUPABASE_SERVICE_ROLE_KEY (server-side)',
  passed: envProdHasGoodKey,
  details: envProdHasGoodKey
    ? '✅ .env.production.example has server-side service role key'
    : '⚠️  .env.production.example missing service role key example'
});

// Check 4: Verify security documentation exists
console.log('\n🔍 Check 4: Security documentation...');
const securityDocPath = path.join(PROJECT_ROOT, 'docs/security/SUPABASE_SECURITY.md');
const securityDocExists = fs.existsSync(securityDocPath);

checks.push({
  name: 'Security documentation exists',
  passed: securityDocExists,
  details: securityDocExists
    ? '✅ SUPABASE_SECURITY.md exists'
    : '❌ Security documentation missing'
});

if (securityDocExists) {
  const securityDocContent = fs.readFileSync(securityDocPath, 'utf-8');
  const hasServiceRoleSection = securityDocContent.includes('NEVER Expose Service Role Key');
  const hasExamples = securityDocContent.includes('✅ CORRECT:') && securityDocContent.includes('❌ WRONG:');

  checks.push({
    name: 'Security documentation has service role key warnings',
    passed: hasServiceRoleSection,
    details: hasServiceRoleSection
      ? '✅ Documentation explains service role key risks'
      : '⚠️  Documentation may be incomplete'
  });

  checks.push({
    name: 'Security documentation has code examples',
    passed: hasExamples,
    details: hasExamples
      ? '✅ Documentation has correct/incorrect examples'
      : '⚠️  Documentation missing examples'
  });
}

// Print results
console.log('\n' + '='.repeat(80));
console.log('📊 SECURITY FIX VERIFICATION RESULTS');
console.log('='.repeat(80));

const passed = checks.filter(c => c.passed).length;
const total = checks.length;
const allPassed = passed === total;

for (const check of checks) {
  const icon = check.passed ? '✅' : '❌';
  console.log(`\n${icon} ${check.name}`);
  console.log(`   ${check.details}`);
}

console.log('\n' + '='.repeat(80));
console.log(`📈 Score: ${passed}/${total} checks passed (${Math.round((passed/total) * 100)}%)`);
console.log('='.repeat(80));

if (allPassed) {
  console.log('\n🎉 SUCCESS! All security checks passed.');
  console.log('✅ Service role key is no longer exposed in browser code');
  console.log('✅ Dev bypass logic is properly implemented server-side');
  console.log('✅ Environment variables are correctly configured');
  console.log('✅ Security documentation is in place\n');
  process.exit(0);
} else {
  console.log('\n⚠️  WARNING: Some security checks failed.');
  console.log('Please review the failed checks above and fix any issues.\n');
  process.exit(1);
}
