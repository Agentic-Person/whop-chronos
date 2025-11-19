/**
 * Whop Webhook Handler
 *
 * Handles incoming webhook events from Whop
 * Documentation: https://docs.whop.com/webhooks
 */

import crypto from 'crypto';
import { logger } from '@/lib/logger';
import {
  WhopWebhookPayload,
  WhopWebhookEvent,
  MembershipWebhookData,
  PaymentWebhookData,
  WhopApiError,
} from './types';

// ============================================================================
// Webhook Signature Verification
// ============================================================================

const WEBHOOK_SECRET = process.env['WHOP_WEBHOOK_SECRET'];

/**
 * Verifies the webhook signature from Whop
 * This ensures the webhook is authentic and hasn't been tampered with
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string
): boolean {
  if (!WEBHOOK_SECRET) {
    logger.error('WHOP_WEBHOOK_SECRET not configured', undefined, { component: 'webhook-verification' });
    return false;
  }

  try {
    // Whop sends signature in format: t=timestamp,v1=signature
    const parts = signature.split(',').reduce((acc, part) => {
      const [key, value] = part.split('=');
      if (key && value) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, string>);

    const timestamp = parts['t'];
    const receivedSignature = parts['v1'];

    if (!timestamp || !receivedSignature) {
      logger.error('Invalid webhook signature format', undefined, { component: 'webhook-verification' });
      return false;
    }

    // Verify timestamp is recent (within 5 minutes)
    const currentTime = Math.floor(Date.now() / 1000);
    const eventTime = parseInt(timestamp, 10);

    if (Math.abs(currentTime - eventTime) > 300) {
      console.error('Webhook timestamp too old');
      return false;
    }

    // Compute expected signature
    const signedPayload = `${timestamp}.${rawBody}`;
    const expectedSignature = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(signedPayload)
      .digest('hex');

    // Compare signatures
    return crypto.timingSafeEqual(
      Buffer.from(receivedSignature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
}

// ============================================================================
// Webhook Event Handlers
// ============================================================================

export type WebhookHandler<T = any> = (
  data: T,
  event: WhopWebhookEvent
) => Promise<void> | void;

interface WebhookHandlers {
  'membership.created'?: WebhookHandler<MembershipWebhookData>;
  'membership.updated'?: WebhookHandler<MembershipWebhookData>;
  'membership.deleted'?: WebhookHandler<MembershipWebhookData>;
  'membership.went_valid'?: WebhookHandler<MembershipWebhookData>;
  'membership.went_invalid'?: WebhookHandler<MembershipWebhookData>;
  'payment.succeeded'?: WebhookHandler<PaymentWebhookData>;
  'payment.failed'?: WebhookHandler<PaymentWebhookData>;
}

const handlers: WebhookHandlers = {};

/**
 * Register a handler for a specific webhook event
 */
export function onWebhook<T = any>(
  event: WhopWebhookEvent,
  handler: WebhookHandler<T>
): void {
  handlers[event] = handler as any;
}

/**
 * Process an incoming webhook payload
 */
export async function processWebhook(
  payload: WhopWebhookPayload
): Promise<void> {
  const { action, data } = payload;

  console.log(`Processing webhook: ${action}`, {
    timestamp: payload.timestamp,
    hasHandler: !!handlers[action],
  });

  const handler = handlers[action];

  if (!handler) {
    console.warn(`No handler registered for event: ${action}`);
    return;
  }

  try {
    await handler(data, action);
    console.log(`Successfully processed webhook: ${action}`);
  } catch (error) {
    console.error(`Error processing webhook ${action}:`, error);
    throw new WhopApiError(
      `Failed to process webhook: ${action}`,
      500,
      'WEBHOOK_HANDLER_ERROR'
    );
  }
}

// ============================================================================
// Default Event Handlers
// ============================================================================

/**
 * Default handler for membership.created
 * Override this with onWebhook('membership.created', yourHandler)
 */
onWebhook('membership.created', async (data: MembershipWebhookData) => {
  console.log('New membership created:', {
    userId: data.user.id,
    membershipId: data.membership.id,
    productId: data.product.id,
  });

  // TODO: Create student record in database
  // TODO: Send welcome email
  // TODO: Grant access to courses
});

/**
 * Default handler for membership.went_valid
 */
onWebhook('membership.went_valid', async (data: MembershipWebhookData) => {
  console.log('Membership became valid:', {
    userId: data.user.id,
    membershipId: data.membership.id,
  });

  // TODO: Enable student access
  // TODO: Send activation email
});

/**
 * Default handler for membership.went_invalid
 */
onWebhook('membership.went_invalid', async (data: MembershipWebhookData) => {
  console.log('Membership became invalid:', {
    userId: data.user.id,
    membershipId: data.membership.id,
  });

  // TODO: Revoke student access
  // TODO: Send expiration notice
});

/**
 * Default handler for membership.deleted
 */
onWebhook('membership.deleted', async (data: MembershipWebhookData) => {
  console.log('Membership deleted:', {
    userId: data.user.id,
    membershipId: data.membership.id,
  });

  // TODO: Remove student access
  // TODO: Archive student data
});

/**
 * Default handler for payment.succeeded
 */
onWebhook('payment.succeeded', async (data: PaymentWebhookData) => {
  console.log('Payment succeeded:', {
    membershipId: data.membership_id,
    amount: data.amount,
  });

  // TODO: Log payment for analytics
  // TODO: Update billing records
  // TODO: Send receipt
});

/**
 * Default handler for payment.failed
 */
onWebhook('payment.failed', async (data: PaymentWebhookData) => {
  console.log('Payment failed:', {
    membershipId: data.membership_id,
    amount: data.amount,
  });

  // TODO: Send payment failure notice
  // TODO: Update billing status
});

// ============================================================================
// Webhook Testing & Utilities
// ============================================================================

/**
 * Generate a test webhook signature for local testing
 */
export function generateTestSignature(payload: string): string {
  if (!WEBHOOK_SECRET) {
    throw new Error('WHOP_WEBHOOK_SECRET not configured');
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const signedPayload = `${timestamp}.${payload}`;
  const signature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(signedPayload)
    .digest('hex');

  return `t=${timestamp},v1=${signature}`;
}

/**
 * Create a test webhook payload
 */
export function createTestWebhook<T = any>(
  action: WhopWebhookEvent,
  data: T
): WhopWebhookPayload<T> {
  return {
    action,
    data,
    timestamp: Date.now(),
  };
}

// ============================================================================
// Exports
// ============================================================================

export const webhooks = {
  verify: verifyWebhookSignature,
  process: processWebhook,
  on: onWebhook,
  test: {
    generateSignature: generateTestSignature,
    createPayload: createTestWebhook,
  },
};
