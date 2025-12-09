/**
 * Experiences Entry Point (Server Component)
 *
 * This is a SERVER component that:
 * 1. Reads the x-whop-user-token from headers (injected by Whop's proxy)
 * 2. Sets it in a secure httpOnly cookie for subsequent requests
 * 3. Renders the client-side SDK component for context extraction
 *
 * The token flow:
 * - Whop loads iframe → injects x-whop-user-token header → this page reads it
 * - This page sets the token in a cookie
 * - Client-side redirects to /experiences/[experienceId]
 * - Experience layout reads token from cookie (since redirect doesn't go through Whop proxy)
 */

import { headers, cookies } from 'next/headers';
import { ExperiencesEntryClient } from './entry-client';

export const dynamic = 'force-dynamic';

export default async function ExperiencesEntryPage() {
  // Read the token from headers (injected by Whop on iframe load)
  const headersList = await headers();
  const whopToken = headersList.get('x-whop-user-token');

  // If we have a token, store it in a secure httpOnly cookie
  if (whopToken) {
    const cookieStore = await cookies();
    cookieStore.set('whop-user-token', whopToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 3600, // 1 hour
      path: '/',
    });
    console.log('[Experiences Entry] Token captured from headers and stored in cookie');
  } else {
    console.log('[Experiences Entry] No token in headers - may be in test mode or direct access');
  }

  // Render the client component for SDK context extraction
  return <ExperiencesEntryClient hasToken={!!whopToken} />;
}
