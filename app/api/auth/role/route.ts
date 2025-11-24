/**
 * Role Detection API Endpoint
 *
 * Server-side role detection for client components.
 * This allows client components to detect user roles without
 * importing server-only code.
 */

import { NextResponse } from 'next/server';
import { detectUserRole } from '@/lib/whop/roles';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const roleResult = await detectUserRole(userId);
    return NextResponse.json(roleResult);
  } catch (error) {
    console.error('[Role API] Error detecting role:', error);
    return NextResponse.json(
      { error: 'Failed to detect role', role: 'none', isCreator: false, isStudent: false },
      { status: 500 }
    );
  }
}
