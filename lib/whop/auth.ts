/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  ⚠️  DEPRECATED - DO NOT USE FOR EMBEDDED WHOP APPS  ⚠️                    ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║  This module implements OAuth authentication which is DEPRECATED by Whop  ║
 * ║  for embedded applications (apps that run inside Whop's iframe).          ║
 * ║                                                                           ║
 * ║  For embedded apps, use NATIVE AUTHENTICATION instead:                    ║
 * ║  - Import: import { whopsdk } from '@/lib/whop-sdk'                       ║
 * ║  - Use: await whopsdk.verifyUserToken(await headers())                    ║
 * ║  - See: lib/whop/native-auth.ts                                          ║
 * ║  - Docs: docs/integrations/whop/NATIVE_AUTH_MIGRATION_REPORT.md          ║
 * ║                                                                           ║
 * ║  OAuth is ONLY for standalone apps where users visit your site directly.  ║
 * ║  Chronos is an embedded app - OAuth causes 500 errors in Whop iframe.    ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * @deprecated This module uses the OAuth flow which has been deprecated by Whop.
 *
 * For embedded apps, use native authentication instead:
 * - Import from '@/lib/whop/native-auth' for native auth helpers
 * - Use routes under /dashboard/[companyId]/* and /experiences/[experienceId]/*
 * - Whop automatically provides JWT tokens via x-whop-user-token header
 *
 * See docs/deployment/WHOP_OAUTH_DEPLOYMENT_GUIDE.md for migration guide.
 *
 * Whop Authentication & Authorization (LEGACY)
 *
 * Handles OAuth flow, token validation, and membership checks
 * This module is kept for backward compatibility with existing code.
 */

import { cookies } from 'next/headers';
import crypto from 'crypto';
import {
  WhopUser,
  WhopMembership,
  WhopSession,
  WhopAuthError,
  WhopMembershipError,
  type SubscriptionTier,
} from './types';
import { whopApi } from './api-client';

// ============================================================================
// Constants
// ============================================================================

const TOKEN_COOKIE_NAME = 'whop_session';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const ENCRYPTION_KEY = process.env['WHOP_TOKEN_ENCRYPTION_KEY'];

// Test Mode Configuration
const TEST_MODE = process.env['DEV_BYPASS_AUTH'] === 'true';
const TEST_CREATOR_ID = '00000000-0000-0000-0000-000000000001';
const TEST_STUDENT_ID = '00000000-0000-0000-0000-000000000002';

if (TEST_MODE) {
  console.log('⚠️  [AUTH] Test mode enabled - authentication bypassed');
  console.log(`   Creator ID: ${TEST_CREATOR_ID}`);
  console.log(`   Student ID: ${TEST_STUDENT_ID}`);
}

// ============================================================================
// Token Encryption/Decryption
// ============================================================================

function encrypt(text: string): string {
  if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
    throw new Error('Invalid WHOP_TOKEN_ENCRYPTION_KEY - must be 64 hex characters');
  }

  const algorithm = 'aes-256-cbc';
  const key = Buffer.from(ENCRYPTION_KEY, 'hex');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return `${iv.toString('hex')}:${encrypted}`;
}

function decrypt(encryptedText: string): string {
  if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
    throw new Error('Invalid WHOP_TOKEN_ENCRYPTION_KEY - must be 64 hex characters');
  }

  const algorithm = 'aes-256-cbc';
  const key = Buffer.from(ENCRYPTION_KEY, 'hex');
  const [ivHex, encrypted] = encryptedText.split(':');

  if (!ivHex || !encrypted) {
    throw new Error('Invalid encrypted token format');
  }

  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(algorithm, key, iv);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

// ============================================================================
// Session Management
// ============================================================================

export async function createSession(
  accessToken: string,
  refreshToken: string,
  expiresIn: number
): Promise<WhopSession> {
  // Fetch user info
  const user = await whopApi.getCurrentUser(accessToken);

  const session: WhopSession = {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_at: Date.now() + expiresIn * 1000,
    user,
  };

  // Encrypt and store session
  const encryptedSession = encrypt(JSON.stringify(session));
  const cookieStore = await cookies();

  cookieStore.set(TOKEN_COOKIE_NAME, encryptedSession, {
    httpOnly: true,
    secure: process.env['NODE_ENV'] === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });

  return session;
}

export async function getSession(): Promise<WhopSession | null> {
  // Test mode bypass
  if (TEST_MODE) {
    return {
      access_token: 'test_access_token',
      refresh_token: 'test_refresh_token',
      expires_at: Date.now() + (1000 * 60 * 60 * 24), // 24 hours
      user: {
        id: TEST_CREATOR_ID,
        email: 'creator@test.chronos.ai',
        username: 'test_creator',
        profile_pic_url: null,
        social_accounts: {},
        created_at: Date.now(),
      },
    };
  }

  try {
    const cookieStore = await cookies();
    const encryptedSession = cookieStore.get(TOKEN_COOKIE_NAME)?.value;

    if (!encryptedSession) {
      return null;
    }

    const decrypted = decrypt(encryptedSession);
    const session: WhopSession = JSON.parse(decrypted);

    // Check if token is expired
    if (session.expires_at < Date.now()) {
      // Try to refresh
      try {
        const refreshed = await whopApi.refreshAccessToken(session.refresh_token);
        return await createSession(
          refreshed.access_token,
          refreshed.refresh_token,
          refreshed.expires_in
        );
      } catch (error) {
        // Refresh failed, clear session
        await clearSession();
        return null;
      }
    }

    return session;
  } catch (error) {
    console.error('Failed to get session:', error);
    await clearSession();
    return null;
  }
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_COOKIE_NAME);
}

// ============================================================================
// Authentication Helpers
// ============================================================================

export async function requireAuth(): Promise<WhopSession> {
  const session = await getSession();

  if (!session) {
    throw new WhopAuthError('Authentication required');
  }

  return session;
}

export async function getAuthUser(): Promise<WhopUser | null> {
  const session = await getSession();
  return session?.user || null;
}

export async function requireAuthUser(): Promise<WhopUser> {
  const session = await requireAuth();
  return session.user;
}

// ============================================================================
// Membership Validation
// ============================================================================

export interface ValidatedMembership {
  user: WhopUser;
  membership: WhopMembership;
  tier: SubscriptionTier;
  isValid: boolean;
}

export async function validateUserMembership(
  membershipId: string
): Promise<ValidatedMembership> {
  const session = await requireAuth();

  // Test mode bypass
  if (TEST_MODE) {
    return {
      user: session.user,
      membership: {
        id: 'mem_test_001',
        user_id: session.user.id,
        product_id: 'prod_test_pro',
        plan_id: 'plan_test_pro',
        status: 'active',
        valid: true,
        cancel_at_period_end: false,
        renewal_period_start: Date.now(),
        renewal_period_end: Date.now() + (1000 * 60 * 60 * 24 * 30),
        created_at: Date.now(),
      },
      tier: 'pro',
      isValid: true,
    };
  }

  try {
    const result = await whopApi.validateMembership(membershipId);

    if (!result.valid) {
      throw new WhopMembershipError('Membership is not active');
    }

    // Map Whop membership to our subscription tiers
    // This mapping should match your Whop product setup
    const tier = mapMembershipToTier(result.membership);

    return {
      user: session.user,
      membership: result.membership,
      tier,
      isValid: result.valid,
    };
  } catch (error) {
    if (error instanceof WhopMembershipError) {
      throw error;
    }
    throw new WhopMembershipError('Failed to validate membership');
  }
}

/**
 * Maps Whop membership/product to our app's subscription tiers
 * Customize this based on your Whop product configuration
 */
function mapMembershipToTier(_membership: WhopMembership): SubscriptionTier {
  // TODO: Implement actual mapping based on your Whop product IDs
  // For now, returning a default tier

  // Example implementation:
  // const productId = membership.product_id;
  // switch (productId) {
  //   case 'prod_basic_id':
  //     return 'basic';
  //   case 'prod_pro_id':
  //     return 'pro';
  //   case 'prod_enterprise_id':
  //     return 'enterprise';
  //   default:
  //     return 'free';
  // }

  return 'free';
}

// ============================================================================
// Authorization Helpers
// ============================================================================

export async function requireMembership(
  membershipId: string
): Promise<ValidatedMembership> {
  const validated = await validateUserMembership(membershipId);

  if (!validated.isValid) {
    throw new WhopMembershipError('Valid membership required');
  }

  return validated;
}

export async function requireTier(
  membershipId: string,
  requiredTier: SubscriptionTier
): Promise<ValidatedMembership> {
  const validated = await requireMembership(membershipId);

  const tierHierarchy: SubscriptionTier[] = ['free', 'basic', 'pro', 'enterprise'];
  const userTierIndex = tierHierarchy.indexOf(validated.tier);
  const requiredTierIndex = tierHierarchy.indexOf(requiredTier);

  if (userTierIndex < requiredTierIndex) {
    throw new WhopMembershipError(
      `This feature requires ${requiredTier} tier or higher`
    );
  }

  return validated;
}

// ============================================================================
// Middleware Helpers
// ============================================================================

export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session !== null;
}

export async function hasValidMembership(membershipId: string): Promise<boolean> {
  try {
    const validated = await validateUserMembership(membershipId);
    return validated.isValid;
  } catch {
    return false;
  }
}

// ============================================================================
// OAuth Flow Helpers
// ============================================================================

export async function handleOAuthCallback(code: string): Promise<WhopSession> {
  try {
    console.log('[OAuth] Exchanging code for token...');
    const tokens = await whopApi.exchangeCodeForToken(code);
    console.log('[OAuth] Token exchange successful, creating session...');
    const session = await createSession(
      tokens.access_token,
      tokens.refresh_token,
      tokens.expires_in
    );
    console.log('[OAuth] Session created successfully');
    return session;
  } catch (error) {
    console.error('OAuth callback failed:', error);
    // Re-throw with original error message for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new WhopAuthError(`Failed to complete OAuth flow: ${errorMessage}`);
  }
}

export function getOAuthLoginUrl(redirectTo?: string): string {
  const state = redirectTo ? Buffer.from(redirectTo).toString('base64') : undefined;
  return whopApi.getOAuthUrl(state);
}

export function parseOAuthState(state: string): string | null {
  try {
    return Buffer.from(state, 'base64').toString('utf8');
  } catch {
    return null;
  }
}
