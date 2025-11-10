/**
 * Whop OAuth Login Endpoint
 *
 * Initiates OAuth flow by redirecting to Whop authorization page
 * GET /api/whop/auth/login?redirect=/dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOAuthLoginUrl } from '@/lib/whop/auth';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const redirectTo = searchParams.get('redirect') || '/dashboard';

    // Generate OAuth URL with state parameter
    const authUrl = getOAuthLoginUrl(redirectTo);

    // Redirect to Whop OAuth page
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('OAuth login failed:', error);

    return NextResponse.json(
      {
        error: 'Failed to initiate OAuth flow',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
