/**
 * Debug Endpoint: Whop Context
 *
 * This endpoint helps debug what Whop is sending to the app.
 * It logs all headers and provides information about the authentication context.
 *
 * GET /api/debug/whop-context
 *
 * IMPORTANT: Remove or protect this endpoint in production!
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { whopsdk } from '@/lib/whop-sdk';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const headersList = await headers();

  // Collect all headers
  const allHeaders: Record<string, string> = {};
  headersList.forEach((value, key) => {
    allHeaders[key] = value;
  });

  // Try to verify user token
  let userTokenResult: { success: boolean; data?: any; error?: string } = {
    success: false,
  };

  try {
    const result = await whopsdk.verifyUserToken(headersList);
    userTokenResult = {
      success: true,
      data: result,
    };
  } catch (error) {
    userTokenResult = {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  // Check for specific Whop headers
  const whopHeaders = {
    'x-whop-user-token': headersList.get('x-whop-user-token'),
    'x-whop-company-id': headersList.get('x-whop-company-id'),
    'x-whop-experience-id': headersList.get('x-whop-experience-id'),
    'x-whop-user-id': headersList.get('x-whop-user-id'),
    'x-forwarded-host': headersList.get('x-forwarded-host'),
    'origin': headersList.get('origin'),
    'referer': headersList.get('referer'),
  };

  // Get URL info
  const url = new URL(request.url);

  const debugInfo = {
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      WHOP_APP_ID: process.env.WHOP_APP_ID ? '***SET***' : 'NOT SET',
      NEXT_PUBLIC_WHOP_APP_ID: process.env.NEXT_PUBLIC_WHOP_APP_ID ? '***SET***' : 'NOT SET',
      WHOP_API_KEY: process.env.WHOP_API_KEY ? '***SET***' : 'NOT SET',
      DEV_BYPASS_AUTH: process.env.DEV_BYPASS_AUTH,
    },
    request: {
      url: request.url,
      pathname: url.pathname,
      searchParams: Object.fromEntries(url.searchParams),
    },
    whopHeaders,
    userTokenVerification: userTokenResult,
    allHeaders,
    note: 'This endpoint is for debugging. Remove in production!',
    documentation: {
      issue: 'If whopHeaders are empty, the app is not receiving context from Whop',
      solution: 'Use @whop/iframe SDK getTopLevelUrlData() to request context from parent window',
      file: 'lib/whop/iframe-sdk.ts',
    },
  };

  console.log('[Debug] Whop context:', JSON.stringify(debugInfo, null, 2));

  return NextResponse.json(debugInfo, {
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}
