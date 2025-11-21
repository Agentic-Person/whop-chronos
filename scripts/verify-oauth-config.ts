/**
 * Whop OAuth Configuration Verification Script
 *
 * This script verifies that all Whop OAuth environment variables are correctly configured
 * and provides actionable feedback for any issues found.
 *
 * Run with: npx tsx scripts/verify-oauth-config.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

interface ConfigCheck {
  name: string;
  value: string | undefined;
  required: boolean;
  validation?: (value: string) => { valid: boolean; message?: string };
  description: string;
}

const checks: ConfigCheck[] = [
  {
    name: 'WHOP_CLIENT_ID',
    value: process.env.WHOP_CLIENT_ID,
    required: true,
    validation: (value) => {
      if (!value.startsWith('app_')) {
        return { valid: false, message: 'Should start with "app_"' };
      }
      if (value !== process.env.NEXT_PUBLIC_WHOP_APP_ID) {
        return { valid: false, message: 'Should match NEXT_PUBLIC_WHOP_APP_ID' };
      }
      return { valid: true };
    },
    description: 'Whop OAuth client ID',
  },
  {
    name: 'WHOP_CLIENT_SECRET',
    value: process.env.WHOP_CLIENT_SECRET,
    required: true,
    validation: (value) => {
      if (!value.startsWith('apik_')) {
        return { valid: false, message: 'Should start with "apik_"' };
      }
      if (value.length < 50) {
        return { valid: false, message: 'Client secret seems too short' };
      }
      return { valid: true };
    },
    description: 'Whop OAuth client secret',
  },
  {
    name: 'WHOP_OAUTH_REDIRECT_URI',
    value: process.env.WHOP_OAUTH_REDIRECT_URI,
    required: true,
    validation: (value) => {
      if (!value.includes('/api/whop/auth/callback')) {
        return { valid: false, message: 'Should end with "/api/whop/auth/callback"' };
      }
      if (value.startsWith('http://') && !value.includes('localhost')) {
        return { valid: false, message: 'HTTP only allowed for localhost' };
      }
      if (!value.startsWith('http://') && !value.startsWith('https://')) {
        return { valid: false, message: 'Must start with http:// or https://' };
      }
      return { valid: true };
    },
    description: 'OAuth callback redirect URI',
  },
  {
    name: 'NEXT_PUBLIC_APP_URL',
    value: process.env.NEXT_PUBLIC_APP_URL,
    required: true,
    validation: (value) => {
      if (value.includes('/api/whop/auth/callback')) {
        return {
          valid: false,
          message: '❌ CRITICAL: Should be base URL only, not callback path! Fix: Remove "/api/whop/auth/callback"',
        };
      }
      if (!value.startsWith('http://') && !value.startsWith('https://')) {
        return { valid: false, message: 'Must start with http:// or https://' };
      }
      if (value.endsWith('/')) {
        return { valid: false, message: 'Should not have trailing slash' };
      }
      return { valid: true };
    },
    description: 'Base application URL',
  },
  {
    name: 'WHOP_API_KEY',
    value: process.env.WHOP_API_KEY,
    required: true,
    validation: (value) => {
      if (!value.startsWith('apik_')) {
        return { valid: false, message: 'Should start with "apik_"' };
      }
      return { valid: true };
    },
    description: 'Whop API key for server-side requests',
  },
  {
    name: 'WHOP_TOKEN_ENCRYPTION_KEY',
    value: process.env.WHOP_TOKEN_ENCRYPTION_KEY,
    required: true,
    validation: (value) => {
      if (value.length !== 64) {
        return { valid: false, message: 'Must be exactly 64 hex characters' };
      }
      if (!/^[0-9a-f]{64}$/i.test(value)) {
        return { valid: false, message: 'Must be hexadecimal characters only' };
      }
      return { valid: true };
    },
    description: 'AES-256 encryption key for session tokens',
  },
  {
    name: 'NEXT_PUBLIC_WHOP_APP_ID',
    value: process.env.NEXT_PUBLIC_WHOP_APP_ID,
    required: true,
    validation: (value) => {
      if (!value.startsWith('app_')) {
        return { valid: false, message: 'Should start with "app_"' };
      }
      if (value !== process.env.WHOP_CLIENT_ID) {
        return { valid: false, message: 'Should match WHOP_CLIENT_ID' };
      }
      return { valid: true };
    },
    description: 'Public-facing Whop app ID',
  },
  {
    name: 'DEV_BYPASS_AUTH',
    value: process.env.DEV_BYPASS_AUTH,
    required: false,
    validation: (value) => {
      if (value !== 'true' && value !== 'false') {
        return { valid: false, message: 'Should be "true" or "false"' };
      }
      return { valid: true };
    },
    description: 'Development mode auth bypass (local only)',
  },
  {
    name: 'NEXT_PUBLIC_DEV_BYPASS_AUTH',
    value: process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH,
    required: false,
    validation: (value) => {
      if (value !== 'true' && value !== 'false') {
        return { valid: false, message: 'Should be "true" or "false"' };
      }
      if (value !== process.env.DEV_BYPASS_AUTH) {
        return { valid: false, message: 'Should match DEV_BYPASS_AUTH' };
      }
      return { valid: true };
    },
    description: 'Client-side dev bypass flag',
  },
];

console.log('\n🔍 Whop OAuth Configuration Verification\n');
console.log('═'.repeat(80));

let hasErrors = false;
let hasWarnings = false;
const errors: string[] = [];
const warnings: string[] = [];

for (const check of checks) {
  const isSet = check.value !== undefined && check.value !== '';

  if (!isSet) {
    if (check.required) {
      console.log(`❌ ${check.name}`);
      console.log(`   Status: MISSING (required)`);
      console.log(`   Description: ${check.description}`);
      errors.push(`Missing required variable: ${check.name}`);
      hasErrors = true;
    } else {
      console.log(`⚠️  ${check.name}`);
      console.log(`   Status: Not set (optional)`);
      console.log(`   Description: ${check.description}`);
    }
  } else {
    if (check.validation) {
      const result = check.validation(check.value);
      if (!result.valid) {
        console.log(`❌ ${check.name}`);
        console.log(`   Status: INVALID`);
        console.log(`   Value: ${check.value.substring(0, 20)}${check.value.length > 20 ? '...' : ''}`);
        console.log(`   Issue: ${result.message}`);
        console.log(`   Description: ${check.description}`);
        errors.push(`${check.name}: ${result.message}`);
        hasErrors = true;
      } else {
        console.log(`✅ ${check.name}`);
        console.log(`   Status: Valid`);
        console.log(`   Value: ${check.value.substring(0, 20)}${check.value.length > 20 ? '...' : ''}`);
        console.log(`   Description: ${check.description}`);
      }
    } else {
      console.log(`✅ ${check.name}`);
      console.log(`   Status: Set`);
      console.log(`   Value: ${check.value.substring(0, 20)}${check.value.length > 20 ? '...' : ''}`);
      console.log(`   Description: ${check.description}`);
    }
  }
  console.log('─'.repeat(80));
}

// Additional checks
console.log('\n📋 Additional Configuration Checks\n');
console.log('═'.repeat(80));

// Check redirect URI consistency
const redirectUri = process.env.WHOP_OAUTH_REDIRECT_URI;
const appUrl = process.env.NEXT_PUBLIC_APP_URL;

if (redirectUri && appUrl) {
  const expectedRedirectUri = `${appUrl}/api/whop/auth/callback`;
  if (redirectUri === expectedRedirectUri) {
    console.log('✅ Redirect URI matches app URL');
    console.log(`   WHOP_OAUTH_REDIRECT_URI: ${redirectUri}`);
    console.log(`   NEXT_PUBLIC_APP_URL: ${appUrl}`);
  } else {
    console.log('⚠️  Redirect URI and app URL mismatch');
    console.log(`   WHOP_OAUTH_REDIRECT_URI: ${redirectUri}`);
    console.log(`   NEXT_PUBLIC_APP_URL: ${appUrl}`);
    console.log(`   Expected: ${expectedRedirectUri}`);
    warnings.push('Redirect URI should be: NEXT_PUBLIC_APP_URL + /api/whop/auth/callback');
    hasWarnings = true;
  }
} else {
  console.log('❌ Cannot check redirect URI consistency (missing variables)');
  hasErrors = true;
}

console.log('─'.repeat(80));

// Check dev bypass configuration
const devBypass = process.env.DEV_BYPASS_AUTH === 'true';
const publicDevBypass = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true';

if (devBypass || publicDevBypass) {
  console.log('ℹ️  Development Mode: AUTH BYPASS ENABLED');
  console.log('   DEV_BYPASS_AUTH:', devBypass ? 'true' : 'false');
  console.log('   NEXT_PUBLIC_DEV_BYPASS_AUTH:', publicDevBypass ? 'true' : 'false');
  console.log('   ⚠️  WARNING: This should ONLY be enabled in local development!');
  console.log('   ⚠️  NEVER deploy to production with DEV_BYPASS_AUTH=true');

  if (process.env.NODE_ENV === 'production') {
    console.log('   ❌ CRITICAL: Dev bypass is enabled in production environment!');
    errors.push('DEV_BYPASS_AUTH should not be enabled in production');
    hasErrors = true;
  }
} else {
  console.log('✅ Development Mode: AUTH BYPASS DISABLED (production-safe)');
  console.log('   OAuth flow will be required for authentication');
}

console.log('─'.repeat(80));

// Summary
console.log('\n📊 Configuration Summary\n');
console.log('═'.repeat(80));

if (hasErrors) {
  console.log('❌ CONFIGURATION ERRORS FOUND\n');
  console.log('The following issues must be fixed:\n');
  errors.forEach((error, i) => {
    console.log(`${i + 1}. ${error}`);
  });
  console.log('\n👉 See docs/guides/setup/WHOP_OAUTH_FIX_GUIDE.md for detailed instructions');
} else if (hasWarnings) {
  console.log('⚠️  CONFIGURATION WARNINGS\n');
  console.log('The following should be reviewed:\n');
  warnings.forEach((warning, i) => {
    console.log(`${i + 1}. ${warning}`);
  });
  console.log('\n✅ Core configuration is valid, but consider addressing warnings');
} else {
  console.log('✅ ALL CHECKS PASSED\n');
  console.log('Your Whop OAuth configuration appears to be correct!');

  if (devBypass) {
    console.log('\n🚀 Next Steps (Local Development):');
    console.log('   1. Run: npm run dev');
    console.log('   2. Visit: http://localhost:3007');
    console.log('   3. You should be auto-logged in (dev bypass enabled)');
  } else {
    console.log('\n🚀 Next Steps (Production Setup):');
    console.log('   1. Register redirect URI in Whop Developer Dashboard:');
    console.log(`      ${redirectUri}`);
    console.log('   2. Update Vercel environment variables with these values');
    console.log('   3. Redeploy your application');
    console.log('   4. Test OAuth flow on production URL');
  }
}

console.log('\n═'.repeat(80));

// Exit with appropriate code
if (hasErrors) {
  console.log('\n❌ Configuration check FAILED\n');
  process.exit(1);
} else {
  console.log('\n✅ Configuration check PASSED\n');
  process.exit(0);
}
