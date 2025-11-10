/**
 * Whop Webhook Endpoint
 *
 * Receives and processes webhook events from Whop
 * POST /api/whop/webhook
 *
 * Events handled:
 * - membership.created: New student joins
 * - membership.went_valid: Membership becomes active
 * - membership.went_invalid: Membership expires
 * - membership.deleted: Membership removed
 * - payment.succeeded: Successful payment
 * - payment.failed: Failed payment
 */

import { NextRequest, NextResponse } from 'next/server';
import { webhooks } from '@/lib/whop/webhooks';
import type { WhopWebhookPayload } from '@/lib/whop/types';

export async function POST(request: NextRequest) {
  try {
    // Get webhook signature from headers
    const signature = request.headers.get('x-whop-signature');

    if (!signature) {
      console.error('Missing webhook signature');
      return NextResponse.json(
        { error: 'Missing webhook signature' },
        { status: 401 }
      );
    }

    // Get raw body for signature verification
    const rawBody = await request.text();

    // Verify webhook signature
    const isValid = webhooks.verify(rawBody, signature);

    if (!isValid) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    // Parse webhook payload
    let payload: WhopWebhookPayload;
    try {
      payload = JSON.parse(rawBody);
    } catch (error) {
      console.error('Failed to parse webhook payload:', error);
      return NextResponse.json(
        { error: 'Invalid webhook payload' },
        { status: 400 }
      );
    }

    // Log webhook receipt
    console.log('Received webhook:', {
      action: payload.action,
      timestamp: payload.timestamp,
    });

    // Process webhook event
    await webhooks.process(payload);

    // Return success response
    return NextResponse.json(
      {
        success: true,
        action: payload.action,
        processedAt: Date.now(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Webhook processing failed:', error);

    // Return 500 to trigger Whop retry
    return NextResponse.json(
      {
        error: 'Webhook processing failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Disable body parsing to get raw body for signature verification
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
