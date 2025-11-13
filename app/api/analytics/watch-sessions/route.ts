/**
 * Watch Sessions API
 *
 * POST /api/analytics/watch-sessions - Create new watch session
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/db/client';

export const runtime = 'nodejs';

/**
 * POST /api/analytics/watch-sessions
 *
 * Create a new video watch session
 *
 * Request body:
 * {
 *   video_id: string (required)
 *   student_id: string (required)
 *   creator_id: string (required)
 *   device_type?: 'desktop' | 'mobile' | 'tablet'
 *   referrer_type?: 'course_page' | 'direct_link' | 'search' | 'chat_reference'
 * }
 *
 * Response:
 * {
 *   success: true,
 *   session_id: string
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { video_id, student_id, creator_id, device_type, referrer_type } = body;

    // Validate required fields
    if (!video_id || !student_id || !creator_id) {
      return NextResponse.json(
        { error: 'Missing required fields: video_id, student_id, creator_id' },
        { status: 400 },
      );
    }

    const supabase = getServiceSupabase();

    // Verify video exists
    const { data: video, error: videoError } = await supabase
      .from('videos')
      .select('id, creator_id')
      .eq('id', video_id)
      .eq('is_deleted', false)
      .single();

    if (videoError || !video) {
      return NextResponse.json({ error: 'Video not found', code: 'VIDEO_NOT_FOUND' }, { status: 404 });
    }

    // Verify creator matches
    if ((video as any).creator_id !== creator_id) {
      return NextResponse.json(
        { error: 'Creator ID mismatch', code: 'CREATOR_MISMATCH' },
        { status: 403 },
      );
    }

    // Create watch session
    const { data: session, error: sessionError } = await (supabase as any)
      .from('video_watch_sessions')
      .insert({
        video_id,
        student_id,
        device_type: device_type || null,
        referrer_type: referrer_type || null,
        session_start: new Date().toISOString(),
        watch_time_seconds: 0,
        percent_complete: 0,
        completed: false,
        metadata: {
          creator_id,
        },
      })
      .select('id')
      .single();

    if (sessionError || !session) {
      console.error('[WatchSessions] Failed to create session:', sessionError);
      return NextResponse.json(
        { error: 'Failed to create watch session', code: 'SESSION_CREATE_FAILED' },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        session_id: session.id,
        message: 'Watch session created successfully',
      },
      { status: 201 },
    );
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
