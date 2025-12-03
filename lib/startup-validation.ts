/**
 * Startup Environment Validation
 * Validates all required environment variables are set
 * Call this in instrumentation.ts or at app startup
 */

import { logger } from '@/lib/logger';

const REQUIRED_ENV_VARS = [
  'WHOP_API_KEY',
  'WHOP_APP_ID',
  'NEXT_PUBLIC_WHOP_APP_ID',
  'WHOP_WEBHOOK_SECRET',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'ANTHROPIC_API_KEY',
  'OPENAI_API_KEY',
];

const REQUIRED_FOR_OAUTH = [
  'WHOP_CLIENT_ID',
  'WHOP_CLIENT_SECRET',
  'WHOP_TOKEN_ENCRYPTION_KEY',
];

export function validateEnvironment(): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  for (const envVar of REQUIRED_ENV_VARS) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    if (process.env.NODE_ENV === 'production') {
      logger.error('Missing required environment variables', undefined, {
        component: 'startup-validation',
        missing,
      });
    } else {
      console.warn('⚠️ Missing environment variables:', missing.join(', '));
    }
  }

  return { valid: missing.length === 0, missing };
}

export function validateOAuthEnvironment(): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  for (const envVar of REQUIRED_FOR_OAUTH) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  return { valid: missing.length === 0, missing };
}

// Auto-run in development to warn about missing vars
if (process.env.NODE_ENV === 'development') {
  const result = validateEnvironment();
  if (!result.valid) {
    console.warn('⚠️ Some features may not work. Missing:', result.missing.join(', '));
  }
}
