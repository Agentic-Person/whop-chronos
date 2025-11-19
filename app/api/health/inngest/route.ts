/**
 * Inngest Health Check API Endpoint
 *
 * GET /api/health/inngest
 *
 * Verifies that the Inngest background processing system is available and functioning.
 * This endpoint checks:
 * 1. Inngest client is configured properly
 * 2. Can send test events to Inngest
 * 3. Response time is within acceptable limits
 *
 * Returns health status with details for debugging.
 */

import { NextResponse } from 'next/server';
import { inngest } from '@/inngest/client';

/**
 * Health check response schema
 */
interface HealthCheckResponse {
  healthy: boolean;
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
  timestamp: string;
  details?: {
    responseTimeMs?: number;
    clientConfigured: boolean;
    testEventSent?: boolean;
    error?: string;
  };
}

/**
 * GET /api/health/inngest
 *
 * Check Inngest background processing system health
 */
export async function GET(): Promise<NextResponse<HealthCheckResponse>> {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  try {
    // Check 1: Verify Inngest client is configured
    if (!inngest) {
      return NextResponse.json(
        {
          healthy: false,
          status: 'unhealthy',
          message: 'Inngest client is not configured',
          timestamp,
          details: {
            clientConfigured: false,
            responseTimeMs: Date.now() - startTime,
          },
        },
        { status: 503 }
      );
    }

    // Check 2: Send a test event to verify connectivity
    try {
      await inngest.send({
        name: 'test/health-check',
        data: {
          timestamp,
          source: 'health-check-endpoint',
        },
      });

      const responseTimeMs = Date.now() - startTime;

      // Check 3: Verify response time is acceptable
      if (responseTimeMs > 5000) {
        // Degraded if response > 5 seconds
        return NextResponse.json(
          {
            healthy: true,
            status: 'degraded',
            message: 'Inngest is available but responding slowly',
            timestamp,
            details: {
              responseTimeMs,
              clientConfigured: true,
              testEventSent: true,
            },
          },
          { status: 200 }
        );
      }

      // All checks passed
      return NextResponse.json(
        {
          healthy: true,
          status: 'healthy',
          message: 'Inngest background processing system is operational',
          timestamp,
          details: {
            responseTimeMs,
            clientConfigured: true,
            testEventSent: true,
          },
        },
        { status: 200 }
      );
    } catch (sendError) {
      // Failed to send test event - Inngest Dev Server is not running
      const responseTimeMs = Date.now() - startTime;
      const errorMessage = sendError instanceof Error ? sendError.message : String(sendError);

      return NextResponse.json(
        {
          healthy: false,
          status: 'unhealthy',
          message: 'Inngest Dev Server is not responding',
          timestamp,
          details: {
            responseTimeMs,
            clientConfigured: true,
            testEventSent: false,
            error: errorMessage,
          },
        },
        { status: 503 }
      );
    }
  } catch (error) {
    // Unexpected error during health check
    const errorMessage = error instanceof Error ? error.message : String(error);

    return NextResponse.json(
      {
        healthy: false,
        status: 'unhealthy',
        message: 'Health check failed with unexpected error',
        timestamp,
        details: {
          responseTimeMs: Date.now() - startTime,
          clientConfigured: !!inngest,
          error: errorMessage,
        },
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS handler for CORS preflight requests
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
