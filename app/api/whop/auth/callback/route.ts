/**
 * Whop OAuth Callback Endpoint
 *
 * Handles OAuth callback from Whop, exchanges code for tokens
 * GET /api/whop/auth/callback?code=xxx&state=xxx
 */

import { NextRequest, NextResponse } from 'next/server';
import { handleOAuthCallback, parseOAuthState } from '@/lib/whop/auth';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      console.error('OAuth error:', error);
      return NextResponse.redirect(
        new URL(`/?error=${encodeURIComponent(error)}`, request.url)
      );
    }

    // Validate code
    if (!code) {
      return NextResponse.redirect(
        new URL('/?error=missing_code', request.url)
      );
    }

    // Exchange code for tokens and create session
    await handleOAuthCallback(code);

    // Parse redirect URL from state
    const redirectTo = state ? parseOAuthState(state) : null;
    const redirectUrl = redirectTo || '/dashboard';

    // Redirect to original destination
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  } catch (error) {
    console.error('OAuth callback failed:', error);

    return NextResponse.redirect(
      new URL(
        `/?error=${encodeURIComponent('oauth_failed')}`,
        request.url
      )
    );
  }
}

export const dynamic = 'force-dynamic';
