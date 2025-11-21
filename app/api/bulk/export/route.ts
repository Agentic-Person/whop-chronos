/**
 * Bulk Export API
 *
 * POST /api/bulk/export - Initiate bulk video export to CSV
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/db/client';
import { inngest } from '@/inngest/client';

export const runtime = 'nodejs';

/**
 * POST /api/bulk/export
 *
 * Initiate bulk export of videos to CSV
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { creator_id, video_ids } = body;

    // Validate inputs
    if (!creator_id || !video_ids || !Array.isArray(video_ids) || video_ids.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request. Provide creator_id and video_ids array' },
        { status: 400 }
      );
    }

    if (video_ids.length > 500) {
      return NextResponse.json(
        { error: 'Cannot export more than 500 videos at once' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Create bulk operation record
    const { data: operation, error: createError } = await (supabase as any)
      .from('bulk_operations')
      .insert({
        creator_id,
        operation_type: 'export',
        video_ids,
        status: 'pending',
        progress_current: 0,
        progress_total: video_ids.length,
      })
      .select()
      .single();

    if (createError || !operation) {
      console.error('Error creating bulk operation:', createError);
      return NextResponse.json(
        { error: 'Failed to create bulk operation' },
        { status: 500 }
      );
    }

    // Send Inngest event to process export
    await inngest.send({
      name: 'videos/bulk.export',
      data: {
        operation_id: operation.id,
        creator_id,
        video_ids,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Bulk export initiated',
        data: {
          operation_id: operation.id,
          video_count: video_ids.length,
          status: 'pending',
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Bulk export API error:', error);
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
