/**
 * Watch Session Management API
 *
 * PUT /api/analytics/watch-sessions/[id] - Update session progress
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/db/client';

export const runtime = 'nodejs';

/**
 * PUT /api/analytics/watch-sessions/[id]
 *
 * Update watch session progress
 *
 * Request body:
 * {
 *   percent_complete?: number
 *   watch_time_seconds?: number
 *   current_time_seconds?: number
 *   completed?: boolean
 * }
 *
 * Response:
 * {
 *   success: true,
 *   session_id: string
 * }
 */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const sessionId = id;
    const body = await req.json();
    const { percent_complete, watch_time_seconds, current_time_seconds, completed } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Get current session
    const { data: session, error: sessionError } = await supabase
      .from('video_watch_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Watch session not found', code: 'SESSION_NOT_FOUND' },
        { status: 404 },
      );
    }

    // Build update object
    const updates: {
      percent_complete?: number;
      watch_time_seconds?: number;
      completed?: boolean;
      updated_at?: string;
      metadata?: Record<string, unknown>;
    } = {
      updated_at: new Date().toISOString(),
    };

    if (percent_complete !== undefined) {
      updates.percent_complete = Math.min(100, Math.max(0, percent_complete));
    }

    if (watch_time_seconds !== undefined) {
      updates.watch_time_seconds = Math.max(0, watch_time_seconds);
    }

    if (completed !== undefined) {
      updates.completed = completed;
    }

    // Store current time in metadata if provided
    if (current_time_seconds !== undefined) {
      updates.metadata = {
        ...((session as any).metadata as Record<string, unknown>),
        current_time_seconds,
        last_updated: new Date().toISOString(),
      };
    }

    // Update session
    const { error: updateError } = await (supabase as any)
      .from('video_watch_sessions')
      .update(updates)
      .eq('id', sessionId);

    if (updateError) {
      console.error('[WatchSessions] Failed to update session:', updateError);
      return NextResponse.json(
        { error: 'Failed to update watch session', code: 'SESSION_UPDATE_FAILED' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      session_id: sessionId,
      message: 'Watch session updated successfully',
    });
  } catch (error) {
    console.error('[WatchSessions] API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
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
      'Access-Control-Allow-Methods': 'PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
