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
    logger.error('WHOP_WEBHOOK_SECRET not configured', undefined, {
      component: 'webhook-verification',
    });
    throw new Error('Webhook secret not configured');
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
      logger.error('Webhook timestamp too old', undefined, { component: 'webhook-verification', timestamp, currentTime });
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
    logger.error('Signature verification failed', error, { component: 'webhook-verification' });
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

  logger.info(`Processing webhook: ${action}`, {
    component: 'webhook-processor',
    timestamp: payload.timestamp,
    hasHandler: !!handlers[action],
  });

  const handler = handlers[action];

  if (!handler) {
    logger.warn(`No handler registered for event: ${action}`, { component: 'webhook-processor' });
    return;
  }

  try {
    await handler(data, action);
    logger.info(`Successfully processed webhook: ${action}`, { component: 'webhook-processor' });
  } catch (error) {
    logger.error(`Error processing webhook ${action}`, error, { component: 'webhook-processor' });
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
 * Creates a new student record when a membership is purchased
 */
onWebhook('membership.created', async (data: MembershipWebhookData) => {
  try {
    logger.info('Processing membership.created webhook', {
      component: 'webhook-handler',
      userId: data.user.id,
      membershipId: data.membership.id,
      productId: data.product.id,
    });

    // Get the company_id from the product
    // In Whop, products belong to companies
    const { getCompanyInfo } = await import('./api-client');
    const { getCreatorByWhopCompanyId, upsertStudent } = await import('@/lib/db/queries');

    // Get company info to find the creator
    const companyInfo = await getCompanyInfo();

    // Find creator by company_id
    const creator = await getCreatorByWhopCompanyId(companyInfo.id);

    if (!creator) {
      logger.warn('No creator found for company_id', {
        component: 'webhook-handler',
        companyId: companyInfo.id,
        productId: data.product.id,
      });
      return;
    }

    // Extract creator ID (we've verified creator exists above)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const creatorId: string = (creator as any).id;

    // Create or update student record
    await upsertStudent({
      whop_user_id: data.user.id,
      whop_membership_id: data.membership.id,
      creator_id: creatorId,
      email: data.user.email,
      name: data.user.username || null,
      is_active: data.membership.valid,
      last_active_at: new Date().toISOString(),
    });

    logger.info('Successfully created/updated student record', {
      component: 'webhook-handler',
      userId: data.user.id,
      creatorId: creatorId,
    });
  } catch (error) {
    logger.error('Failed to process membership.created webhook', error, {
      component: 'webhook-handler',
      userId: data.user.id,
      membershipId: data.membership.id,
    });
    throw error;
  }
});

/**
 * Default handler for membership.went_valid
 * Activates student access when membership becomes valid
 */
onWebhook('membership.went_valid', async (data: MembershipWebhookData) => {
  try {
    logger.info('Processing membership.went_valid webhook', {
      component: 'webhook-handler',
      userId: data.user.id,
      membershipId: data.membership.id,
    });

    const { activateStudent } = await import('@/lib/db/queries');

    // Activate student access
    await activateStudent(data.membership.id);

    logger.info('Successfully activated student membership', {
      component: 'webhook-handler',
      membershipId: data.membership.id,
    });
  } catch (error) {
    logger.error('Failed to process membership.went_valid webhook', error, {
      component: 'webhook-handler',
      membershipId: data.membership.id,
    });
    throw error;
  }
});

/**
 * Default handler for membership.went_invalid
 * Deactivates student access when membership expires or becomes invalid
 */
onWebhook('membership.went_invalid', async (data: MembershipWebhookData) => {
  try {
    logger.info('Processing membership.went_invalid webhook', {
      component: 'webhook-handler',
      userId: data.user.id,
      membershipId: data.membership.id,
    });

    const { deactivateStudent } = await import('@/lib/db/queries');

    // Deactivate student access
    await deactivateStudent(data.membership.id);

    logger.info('Successfully deactivated student membership', {
      component: 'webhook-handler',
      membershipId: data.membership.id,
    });
  } catch (error) {
    logger.error('Failed to process membership.went_invalid webhook', error, {
      component: 'webhook-handler',
      membershipId: data.membership.id,
    });
    throw error;
  }
});

/**
 * Default handler for membership.deleted
 * Soft deletes student access when membership is permanently deleted
 */
onWebhook('membership.deleted', async (data: MembershipWebhookData) => {
  try {
    logger.info('Processing membership.deleted webhook', {
      component: 'webhook-handler',
      userId: data.user.id,
      membershipId: data.membership.id,
    });

    const { deactivateStudent } = await import('@/lib/db/queries');

    // Soft delete: deactivate student (keep record for analytics)
    await deactivateStudent(data.membership.id);

    logger.info('Successfully deactivated student for deleted membership', {
      component: 'webhook-handler',
      membershipId: data.membership.id,
    });
  } catch (error) {
    logger.error('Failed to process membership.deleted webhook', error, {
      component: 'webhook-handler',
      membershipId: data.membership.id,
    });
    throw error;
  }
});

/**
 * Default handler for payment.succeeded
 * Logs successful payment for analytics tracking
 */
onWebhook('payment.succeeded', async (data: PaymentWebhookData) => {
  try {
    logger.info('Payment succeeded', {
      component: 'webhook-handler',
      membershipId: data.membership_id,
      amount: data.amount,
      currency: data.currency,
    });

    // Future: Store payment records for analytics and revenue tracking
    // For now, just log the event

  } catch (error) {
    logger.error('Failed to process payment.succeeded webhook', error, {
      component: 'webhook-handler',
      membershipId: data.membership_id,
    });
    // Don't throw - payment already succeeded, this is just logging
  }
});

/**
 * Default handler for payment.failed
 * Logs failed payment for monitoring
 */
onWebhook('payment.failed', async (data: PaymentWebhookData) => {
  try {
    logger.warn('Payment failed', {
      component: 'webhook-handler',
      membershipId: data.membership_id,
      amount: data.amount,
      currency: data.currency,
    });

    // Future: Notify creator about failed payment
    // Future: Update billing status
    // For now, just log the event

  } catch (error) {
    logger.error('Failed to process payment.failed webhook', error, {
      component: 'webhook-handler',
      membershipId: data.membership_id,
    });
    // Don't throw - this is just logging
  }
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
