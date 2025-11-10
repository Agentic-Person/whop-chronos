/**
 * Whop Logout Endpoint
 *
 * Clears session and redirects to home page
 * POST /api/whop/auth/logout
 */

import { NextRequest, NextResponse } from 'next/server';
import { clearSession } from '@/lib/whop/auth';

export async function POST(_request: NextRequest) {
  try {
    // Clear session cookie
    await clearSession();

    return NextResponse.json(
      { success: true, message: 'Logged out successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Logout failed:', error);

    return NextResponse.json(
      {
        error: 'Failed to log out',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Also support GET for simple redirect-based logout
export async function GET(request: NextRequest) {
  await clearSession();
  return NextResponse.redirect(new URL('/', request.url));
}

export const dynamic = 'force-dynamic';
