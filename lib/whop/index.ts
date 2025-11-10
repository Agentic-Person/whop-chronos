/**
 * Whop Integration
 *
 * Centralized exports for all Whop-related functionality
 */

// API Client
export { whopApi, whopMCP } from './api-client';

// Authentication
export {
  createSession,
  getSession,
  clearSession,
  requireAuth,
  getAuthUser,
  requireAuthUser,
  validateUserMembership,
  requireMembership,
  requireTier,
  isAuthenticated,
  hasValidMembership,
  handleOAuthCallback,
  getOAuthLoginUrl,
  parseOAuthState,
  type ValidatedMembership,
} from './auth';

// Webhooks
export { webhooks, onWebhook, processWebhook, verifyWebhookSignature } from './webhooks';

// Types
export * from './types';

// Re-export commonly used types
export type {
  WhopUser,
  WhopMembership,
  WhopProduct,
  WhopSession,
  SubscriptionTier,
} from './types';
