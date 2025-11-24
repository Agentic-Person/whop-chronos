/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  ⚠️  DEPRECATED ROUTE - DO NOT USE FOR EMBEDDED APPS  ⚠️                  ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║  This OAuth login endpoint is DEPRECATED for embedded Whop apps.          ║
 * ║  Embedded apps use native auth - Whop injects JWT via x-whop-user-token. ║
 * ║  See: docs/integrations/whop/NATIVE_AUTH_MIGRATION_REPORT.md             ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * @deprecated OAuth is deprecated for embedded Whop apps.
 *
 * For embedded apps, use native authentication:
 * - Routes: /dashboard/[companyId]/* and /experiences/[experienceId]/*
 * - Whop provides JWT via x-whop-user-token header automatically
 * - Use @/lib/whop/native-auth helpers
 *
 * See docs/deployment/WHOP_OAUTH_DEPLOYMENT_GUIDE.md for migration guide.
 *
 * Whop OAuth Login Endpoint (LEGACY)
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
