/**
 * Watch Session End API
 *
 * POST /api/analytics/watch-sessions/[id]/end - End watch session
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/db/client';

export const runtime = 'nodejs';

/**
 * POST /api/analytics/watch-sessions/[id]/end
 *
 * End a watch session and finalize statistics
 *
 * Request body:
 * {
 *   session_end?: string (ISO timestamp, defaults to now)
 * }
 *
 * Response:
 * {
 *   success: true,
 *   session_id: string,
 *   stats: {
 *     watch_time_seconds: number,
 *     percent_complete: number,
 *     completed: boolean
 *   }
 * }
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sessionId = params.id;
    const body = await req.json().catch(() => ({}));
    const { session_end } = body;

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

    // Calculate final statistics
    const endTime = session_end || new Date().toISOString();
    const startTime = new Date(session.session_start).getTime();
    const endTimestamp = new Date(endTime).getTime();
    const totalDurationSeconds = Math.floor((endTimestamp - startTime) / 1000);

    // Update session with end time and final stats
    const { error: updateError } = await supabase
      .from('video_watch_sessions')
      .update({
        session_end: endTime,
        updated_at: new Date().toISOString(),
        metadata: {
          ...(session.metadata as Record<string, unknown>),
          total_session_duration_seconds: totalDurationSeconds,
          ended_at: endTime,
        },
      })
      .eq('id', sessionId);

    if (updateError) {
      console.error('[WatchSessions] Failed to end session:', updateError);
      return NextResponse.json(
        { error: 'Failed to end watch session', code: 'SESSION_END_FAILED' },
        { status: 500 },
      );
    }

    // Return final statistics
    return NextResponse.json({
      success: true,
      session_id: sessionId,
      message: 'Watch session ended successfully',
      stats: {
        watch_time_seconds: session.watch_time_seconds,
        percent_complete: session.percent_complete,
        completed: session.completed,
        total_session_duration_seconds: totalDurationSeconds,
      },
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
