/**
 * Storage Breakdown API
 *
 * GET /api/analytics/usage/storage-breakdown - Get storage breakdown by video
 */

import { NextRequest, NextResponse } from 'next/server';
import { getStorageBreakdown } from '@/lib/analytics/usage';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const creatorId = searchParams.get('creatorId');

    if (!creatorId) {
      return NextResponse.json(
        { error: 'creatorId is required' },
        { status: 400 },
      );
    }

    const breakdown = await getStorageBreakdown(creatorId);

    return NextResponse.json(breakdown);
  } catch (error) {
    console.error('Error fetching storage breakdown:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
