/**
 * Bulk Operation Status API
 *
 * GET /api/bulk/status/[id] - Get bulk operation status and progress
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/db/client';

export const runtime = 'nodejs';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/bulk/status/[id]
 *
 * Get bulk operation status for polling
 */
export async function GET(
  req: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const { id } = await context.params;
    const supabase = getServiceSupabase();

    // Fetch operation
    const { data: operation, error } = await supabase
      .from('bulk_operations')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !operation) {
      return NextResponse.json(
        { error: 'Operation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: (operation as any).id,
          operation_type: (operation as any).operation_type,
          status: (operation as any).status,
          progress: {
            current: (operation as any).progress_current,
            total: (operation as any).progress_total,
            percentage: Math.round(
              ((operation as any).progress_current / (operation as any).progress_total) * 100
            ),
          },
          result: (operation as any).result,
          error_message: (operation as any).error_message,
          created_at: (operation as any).created_at,
          completed_at: (operation as any).completed_at,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Bulk status API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
